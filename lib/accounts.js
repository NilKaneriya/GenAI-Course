// Accounts + cloud progress, shared by server.js (local dev) and the Vercel functions in /api.
// Zero dependencies. Passwords are hashed with scrypt (random salt per user) and never stored or logged.
// Sessions are stateless HMAC-signed tokens (AUTH_SECRET).
//
// Storage, picked automatically:
//   - Upstash Redis REST (Vercel Marketplace → Upstash for Redis sets KV_REST_API_URL / KV_REST_API_TOKEN,
//     or set UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN yourself)
//   - otherwise, when not running on Vercel: a local JSON file in ./.data (git-ignored)
//   - otherwise (Vercel without Redis): accounts are disabled and the app runs in guest mode.
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const MAX_STATE_BYTES = 900 * 1024;
const TOKEN_DAYS = 60;
const MAX_FAILS = 10;        // failed logins per email …
const FAIL_WINDOW_S = 900;   // … within 15 minutes before a temporary lock
const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;

// ---------------------------------------------------------------- storage
const REDIS_URL = () => (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || '').replace(/\/$/, '');
const REDIS_TOKEN = () => process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || '';
const onVercel = () => Boolean(process.env.VERCEL);

async function redis(cmd) {
  const r = await fetch(REDIS_URL(), { method: 'POST', headers: { Authorization: `Bearer ${REDIS_TOKEN()}`, 'Content-Type': 'application/json' }, body: JSON.stringify(cmd) });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(`storage error: ${data.error || r.status}`);
  return data.result;
}
const redisStore = {
  kind: 'redis',
  get: async (k) => { const v = await redis(['GET', k]); return v == null ? null : JSON.parse(v); },
  set: async (k, v, { nx = false, ex } = {}) => {
    const cmd = ['SET', k, JSON.stringify(v)];
    if (ex) cmd.push('EX', String(ex));
    if (nx) cmd.push('NX');
    return (await redis(cmd)) === 'OK';
  },
  incr: async (k, ex) => { const n = await redis(['INCR', k]); if (n === 1 && ex) await redis(['EXPIRE', k, String(ex)]); return n; },
  del: async (k) => { await redis(['DEL', k]); },
};

const DATA_DIR = () => process.env.DATA_DIR || path.join(process.cwd(), '.data');
function fileDb() {
  const f = path.join(DATA_DIR(), 'db.json');
  let db = {};
  try { db = JSON.parse(fs.readFileSync(f, 'utf8')); } catch { /* first run */ }
  const now = Date.now();
  for (const [k, e] of Object.entries(db)) if (e.exp && e.exp < now) delete db[k];
  return { db, save: () => { fs.mkdirSync(DATA_DIR(), { recursive: true }); fs.writeFileSync(f, JSON.stringify(db)); } };
}
const fileStore = {
  kind: 'file',
  get: async (k) => fileDb().db[k]?.v ?? null,
  set: async (k, v, { nx = false, ex } = {}) => {
    const { db, save } = fileDb();
    if (nx && db[k]) return false;
    db[k] = { v, exp: ex ? Date.now() + ex * 1000 : 0 };
    save();
    return true;
  },
  incr: async (k, ex) => {
    const { db, save } = fileDb();
    const n = (db[k]?.v || 0) + 1;
    db[k] = { v: n, exp: db[k]?.exp || (ex ? Date.now() + ex * 1000 : 0) };
    save();
    return n;
  },
  del: async (k) => { const { db, save } = fileDb(); delete db[k]; save(); },
};

function store() {
  if (REDIS_URL() && REDIS_TOKEN()) return redisStore;
  if (!onVercel()) return fileStore;
  return null;
}

function secret() {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 16) return process.env.AUTH_SECRET;
  if (onVercel()) return null; // must be configured explicitly in production
  const f = path.join(DATA_DIR(), 'secret.txt');
  try { return fs.readFileSync(f, 'utf8').trim(); } catch {
    const s = crypto.randomBytes(32).toString('hex');
    fs.mkdirSync(DATA_DIR(), { recursive: true });
    fs.writeFileSync(f, s);
    return s;
  }
}

export function authEnabled() { return Boolean(store() && secret()); }

// ---------------------------------------------------------------- crypto helpers
const b64u = (buf) => Buffer.from(buf).toString('base64url');
const scrypt = (pw, salt) => new Promise((res, rej) => crypto.scrypt(pw, salt, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? rej(e) : res(k))));

function signToken(email) {
  const body = b64u(JSON.stringify({ sub: email, exp: Date.now() + TOKEN_DAYS * 86400000 }));
  const mac = b64u(crypto.createHmac('sha256', secret()).update(body).digest());
  return `${body}.${mac}`;
}
function verifyToken(token) {
  const [body, mac] = String(token || '').split('.');
  if (!body || !mac || !secret()) return null;
  const want = crypto.createHmac('sha256', secret()).update(body).digest();
  const got = Buffer.from(mac, 'base64url');
  if (got.length !== want.length || !crypto.timingSafeEqual(got, want)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return p.exp > Date.now() ? p.sub : null;
  } catch { return null; }
}

const normEmail = (e) => String(e || '').trim().toLowerCase();
const userKey = (e) => `user:${e}`;
const progressKey = (e) => `progress:${e}`;
const publicUser = (u) => ({ email: u.email, name: u.name });

// ---------------------------------------------------------------- routes
/** Framework-free handler: (route, { method, body, auth }) → { status, body }. */
export async function handle(route, { method, body = {}, auth = '' }) {
  const db = store();
  if (route === 'status') return { status: 200, body: { enabled: authEnabled(), storage: db?.kind || null } };
  if (!authEnabled()) return { status: 503, body: { error: 'Accounts are not set up on this server yet. You can keep learning as a guest.' } };

  try {
    if (route === 'signup' && method === 'POST') {
      const email = normEmail(body.email);
      const password = String(body.password || '');
      const name = String(body.name || '').trim().slice(0, 40) || email.split('@')[0];
      if (!EMAIL_RE.test(email)) return { status: 400, body: { error: 'Enter a valid email address.' } };
      if (password.length < 8 || password.length > 128) return { status: 400, body: { error: 'Use a password with at least 8 characters.' } };
      const salt = crypto.randomBytes(16);
      const hash = await scrypt(password, salt);
      const user = { email, name, salt: b64u(salt), hash: b64u(hash), createdAt: new Date().toISOString() };
      const created = await db.set(userKey(email), user, { nx: true });
      if (!created) return { status: 409, body: { error: 'An account with this email already exists. Sign in instead.' } };
      return { status: 201, body: { token: signToken(email), user: publicUser(user) } };
    }

    if (route === 'login' && method === 'POST') {
      const email = normEmail(body.email);
      const password = String(body.password || '');
      const failKey = `fail:${email}`;
      if (((await db.get(failKey)) || 0) >= MAX_FAILS) return { status: 429, body: { error: 'Too many attempts. Wait 15 minutes and try again.' } };
      const user = EMAIL_RE.test(email) ? await db.get(userKey(email)) : null;
      // Hash even when the user does not exist, so timing does not reveal which emails are registered.
      const hash = await scrypt(password, user ? Buffer.from(user.salt, 'base64url') : Buffer.alloc(16));
      const ok = user && crypto.timingSafeEqual(hash, Buffer.from(user.hash, 'base64url'));
      if (!ok) { await db.incr(failKey, FAIL_WINDOW_S); return { status: 401, body: { error: 'Wrong email or password.' } }; }
      await db.del(failKey);
      return { status: 200, body: { token: signToken(email), user: publicUser(user) } };
    }

    const email = verifyToken(String(auth).replace(/^Bearer\s+/i, ''));
    if (route === 'me' || route === 'progress') {
      if (!email) return { status: 401, body: { error: 'Please sign in again.' } };
      const user = await db.get(userKey(email));
      if (!user) return { status: 401, body: { error: 'Account not found. Please sign in again.' } };
      if (route === 'me') return { status: 200, body: { user: publicUser(user) } };
      if (method === 'GET') {
        const rec = await db.get(progressKey(email));
        return { status: 200, body: { state: rec?.state || null, updatedAt: rec?.updatedAt || null } };
      }
      if (method === 'PUT') {
        const st = body.state;
        if (!st || typeof st !== 'object' || st.v !== 1 || typeof st.missions !== 'object') return { status: 400, body: { error: 'Invalid progress data.' } };
        if (JSON.stringify(st).length > MAX_STATE_BYTES) return { status: 413, body: { error: 'Progress data too large.' } };
        const updatedAt = new Date().toISOString();
        await db.set(progressKey(email), { state: st, updatedAt });
        return { status: 200, body: { ok: true, updatedAt } };
      }
    }
    return { status: 404, body: { error: 'Not found' } };
  } catch (e) {
    console.error('[accounts]', route, e.message); // never log passwords, tokens or progress
    return { status: 500, body: { error: 'Server error. Your progress is still saved in this browser.' } };
  }
}

/** Adapter for Vercel Node functions: export default vercelHandler('login'). */
export const vercelHandler = (route) => async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const out = await handle(route, { method: req.method, body: body || {}, auth: req.headers.authorization || '' });
  res.status(out.status).json(out.body);
};
