// Account client: sign up / sign in with email + password, and keep progress synced to the server.
// Progress always lives in localStorage first (works offline); when signed in it is also pushed to
// /api/progress a moment after each change, and pulled on sign-in / app start.
const SESSION_KEY = 'genai-quest-session';
const GUEST_KEY = 'genai-quest-guest';

let status = null;           // { enabled } from /api/auth/status, or { enabled:false } when unreachable
let syncState = 'idle';      // idle | saving | saved | offline | error
let pushTimer = null;
const listeners = new Set();

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode */ } };
const emit = () => listeners.forEach((fn) => fn(getAccount()));

export const onAccountChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const session = () => read(SESSION_KEY);
export const isGuestChosen = () => Boolean(read(GUEST_KEY));
export const chooseGuest = () => write(GUEST_KEY, true);
export function getAccount() {
  const s = session();
  return { signedIn: Boolean(s?.token), email: s?.user?.email || null, name: s?.user?.name || null, sync: syncState, enabled: status?.enabled ?? null };
}

async function api(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { Accept: 'application/json' };
  if (body) headers['Content-Type'] = 'application/json';
  const tok = session()?.token;
  if (auth && tok) headers.Authorization = `Bearer ${tok}`;
  const res = await fetch(path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || `Request failed (${res.status})`); e.status = res.status; throw e; }
  return data;
}

export async function authStatus() {
  if (status) return status;
  try { status = await api('/api/auth/status', { auth: false }); } catch { status = { enabled: false }; }
  return status;
}

export async function signUp({ email, password, name }) {
  const d = await api('/api/auth/signup', { method: 'POST', body: { email, password, name }, auth: false });
  write(SESSION_KEY, { token: d.token, user: d.user });
  write(GUEST_KEY, null);
  emit();
  return d.user;
}
export async function signIn({ email, password }) {
  const d = await api('/api/auth/login', { method: 'POST', body: { email, password }, auth: false });
  write(SESSION_KEY, { token: d.token, user: d.user });
  write(GUEST_KEY, null);
  emit();
  return d.user;
}
export function signOut() {
  clearTimeout(pushTimer);
  write(SESSION_KEY, null);
  syncState = 'idle';
  emit();
}

/** Saved progress on the server: { state, updatedAt } (state null if none yet). */
export async function pullProgress() {
  try { return await api('/api/progress'); } catch (e) { if (e.status === 401) signOut(); throw e; }
}

function setSync(s) { syncState = s; emit(); }

/** Push now (returns a promise). */
export async function pushProgress(state) {
  if (!session()?.token) return;
  setSync('saving');
  try {
    await api('/api/progress', { method: 'PUT', body: { state } });
    setSync('saved');
  } catch (e) {
    if (e.status === 401) signOut();
    setSync(navigator.onLine === false ? 'offline' : 'error');
  }
}
/** Debounced push used on every local save. */
export function schedulePush(getState) {
  if (!session()?.token) return;
  clearTimeout(pushTimer);
  syncState = 'saving'; emit();
  pushTimer = setTimeout(() => pushProgress(getState()), 1200);
}
window.addEventListener('online', () => { if (syncState === 'offline' || syncState === 'error') emit(); });
