// GenAI Quest — zero-dependency Node server.
// 1. Serves the static site in ./public
// 2. Optional: POST /api/mentor proxies the mentor chat to a real AI provider.
//    The API key stays on this server (environment variable / .env) and never reaches the browser.
//
// Usage:  node server.js            → http://localhost:5173
// Config (environment variables or a local .env file — see .env.example):
//   PORT=5173
//   AI_PROVIDER=anthropic | openai-compatible     (unset = simulated mentor)
//   AI_API_KEY=...                                (required when AI_PROVIDER is set)
//   AI_MODEL=...                                  (model id for your provider)
//   AI_BASE_URL=...                               (openai-compatible only, e.g. https://your-provider/v1)

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');

// ---- minimal .env loader (no dependency) ----
const envFile = path.join(ROOT, '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/i);
    if (m && !line.trim().startsWith('#') && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(['"])(.*)\1$/, '$2');
  }
}

const PORT = Number(process.env.PORT) || 5173;
const HOST = process.env.HOST || '127.0.0.1';
const PROVIDER = (process.env.AI_PROVIDER || '').toLowerCase();
const API_KEY = process.env.AI_API_KEY || '';
const MODEL = process.env.AI_MODEL || (PROVIDER === 'anthropic' ? 'claude-sonnet-5-5' : '');
const BASE_URL = (process.env.AI_BASE_URL || '').replace(/\/$/, '');
const CONFIGURED = Boolean(PROVIDER && API_KEY && MODEL && (PROVIDER !== 'openai-compatible' || BASE_URL));

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.md': 'text/markdown; charset=utf-8' };
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  // 'unsafe-eval' is required only because the playground compiles learner JavaScript (new Function)
  // inside a blob: Web Worker, which inherits this policy. App code itself never evals.
  'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-eval'; worker-src 'self' blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self'",
};

// ---- simple per-IP rate limit for the AI proxy ----
const hits = new Map();
function rateLimited(ip, limit = 20, windowMs = 60_000) {
  const now = Date.now();
  const arr = (hits.get(ip) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(ip, arr);
  return arr.length > limit;
}

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
const json = (res, status, obj) => send(res, status, JSON.stringify(obj), { 'Content-Type': 'application/json' });

function readBody(req, max = 64 * 1024) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > max) { reject(new Error('Body too large')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

function systemPrompt(progress, page) {
  return [
    'You are the mentor inside "GenAI Quest", a game-based course that takes one learner from beginner to job-ready in Generative AI.',
    'Be supportive, concise and beginner-friendly. Use short paragraphs and bullet lists. Use Markdown links only in the form [label](#/route).',
    'Routes you may link: #/lesson/<missionId>, #/level/<levelId>, #/test/<levelId>, #/playground, #/report, #/map.',
    'When the learner is working on a coding challenge or test, give hints and explanations but never paste a complete solution.',
    'Base any statement about their progress strictly on the JSON below; do not invent scores.',
    `Learner progress (JSON): ${JSON.stringify(progress).slice(0, 12000)}`,
    `Current page context (JSON): ${JSON.stringify(page || {}).slice(0, 1000)}`,
  ].join('\n');
}

async function callProvider({ message, history, progress, page }) {
  const turns = [...(history || []).slice(-12), { role: 'user', text: message }]
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.text === 'string')
    .map((m) => ({ role: m.role, content: m.text.slice(0, 4000) }));
  // Providers expect the conversation to start with a user turn.
  while (turns.length && turns[0].role !== 'user') turns.shift();
  const system = systemPrompt(progress, page);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45_000);
  try {
    if (PROVIDER === 'anthropic') {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', signal: controller.signal,
        headers: { 'content-type': 'application/json', 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: MODEL, max_tokens: 900, system, messages: turns }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || `Provider error ${r.status}`);
      return (data.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
    }
    if (PROVIDER === 'openai-compatible') {
      const r = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST', signal: controller.signal,
        headers: { 'content-type': 'application/json', authorization: `Bearer ${API_KEY}` },
        body: JSON.stringify({ model: MODEL, max_tokens: 900, messages: [{ role: 'system', content: system }, ...turns] }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error?.message || `Provider error ${r.status}`);
      return data.choices?.[0]?.message?.content?.trim() || '';
    }
    throw new Error(`Unknown AI_PROVIDER "${PROVIDER}"`);
  } finally { clearTimeout(timer); }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // ---- API ----
  if (url.pathname === '/api/mentor/status' && req.method === 'GET') {
    return json(res, 200, { configured: CONFIGURED, provider: CONFIGURED ? PROVIDER : null });
  }
  if (url.pathname === '/api/mentor' && req.method === 'POST') {
    if (!CONFIGURED) return json(res, 503, { error: 'No AI provider configured; the client uses the simulated mentor.' });
    if (rateLimited(req.socket.remoteAddress || 'local')) return json(res, 429, { error: 'Too many requests — wait a minute.' });
    try {
      const body = JSON.parse(await readBody(req));
      if (typeof body.message !== 'string' || !body.message.trim()) return json(res, 400, { error: 'message is required' });
      const reply = await callProvider(body);
      return json(res, 200, { reply: reply || 'I could not generate a reply just now.' });
    } catch (e) {
      console.error('[mentor]', e.message); // never log the key or full prompts
      return json(res, 502, { error: 'The AI provider request failed.' });
    }
  }
  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'Not found' });

  // ---- static files ----
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');
  let rel = decodeURIComponent(url.pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC, rel));
  if (!file.startsWith(PUBLIC + path.sep)) return send(res, 403, 'Forbidden');
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found', { 'Content-Type': 'text/plain' });
    res.writeHead(200, { ...SECURITY_HEADERS, 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(file).pipe(res);
  });
});

server.listen(PORT, HOST, () => {
  console.log(`GenAI Quest running at http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
  console.log(CONFIGURED ? `Mentor: live AI via ${PROVIDER} (${MODEL})` : 'Mentor: simulated (set AI_PROVIDER and AI_API_KEY to connect a real model)');
});
