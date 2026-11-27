// Runs learner JavaScript in a sandboxed Web Worker (no DOM, no network, time-limited).
import { CONFIG } from '../data/config.js';

const WORKER_SRC = `
const fmt = (v) => {
  if (typeof v === 'string') return v;
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return '[Function ' + (v.name || 'anonymous') + ']';
  try { return JSON.stringify(v, (k, x) => (x === undefined ? null : Number.isNaN(x) ? 'NaN' : x)); } catch { return String(v); }
};
const deepEq = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6 || (Number.isNaN(a) && Number.isNaN(b));
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const ka = Object.keys(a).filter(k => a[k] !== undefined), kb = Object.keys(b).filter(k => b[k] !== undefined);
    return ka.length === kb.length && kb.every((k) => deepEq(a[k], b[k]));
  }
  return a === b;
};
self.onmessage = (e) => {
  const { code, tests } = e.data;
  const logs = [];
  const push = (kind) => (...a) => { if (logs.length < 200) logs.push({ kind, text: a.map(fmt).join(' ') }); };
  self.console = { log: push('log'), info: push('log'), warn: push('warn'), error: push('error'), table: push('log') };
  for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'importScripts', 'EventSource', 'indexedDB', 'caches']) { try { self[k] = undefined; } catch {} }
  const wrap = (call) => '(() => { try { return { ok: true, v: (' + call + ') }; } catch (err) { return { ok: false, err: String(err && err.message || err) }; } })()';
  let results = [];
  try {
    const body = '"use strict";\\n' + code + '\\n;return [' + (tests || []).map(t => wrap(t.call)).join(',') + '];';
    const fn = new Function(body);
    results = fn();
  } catch (err) {
    const m = String(err && err.stack || '').match(/<anonymous>:(\\d+):(\\d+)/);
    self.postMessage({ logs, error: { name: err && err.name || 'Error', message: String(err && err.message || err), line: m ? Number(m[1]) - 3 : null } });
    return;
  }
  const out = (tests || []).map((t, i) => {
    const r = results[i];
    if (!r.ok) return { call: t.call, expect: fmt(t.expect), pass: false, error: r.err };
    return { call: t.call, expect: fmt(t.expect), got: fmt(r.v), pass: deepEq(r.v, t.expect), returnedUndefined: r.v === undefined };
  });
  self.postMessage({ logs, tests: out });
};`;

let workerUrl;
export function runJavaScript(code, tests = []) {
  workerUrl = workerUrl || URL.createObjectURL(new Blob([WORKER_SRC], { type: 'text/javascript' }));
  return new Promise((resolve) => {
    const worker = new Worker(workerUrl);
    const started = performance.now();
    const timer = setTimeout(() => {
      worker.terminate();
      resolve({ logs: [], error: { name: 'TimeoutError', message: `Stopped after ${CONFIG.codeTimeoutMs / 1000}s — is there an infinite loop?` }, ms: CONFIG.codeTimeoutMs });
    }, CONFIG.codeTimeoutMs);
    worker.onmessage = (e) => { clearTimeout(timer); worker.terminate(); resolve({ ...e.data, ms: Math.round(performance.now() - started) }); };
    worker.onerror = (e) => { clearTimeout(timer); worker.terminate(); resolve({ logs: [], error: { name: 'Error', message: e.message } }); };
    worker.postMessage({ code, tests });
  });
}

/** Turn raw JS errors into beginner-friendly guidance. */
export function explainError(err) {
  if (!err) return '';
  const msg = err.message || '';
  if (err.name === 'TimeoutError') return 'Your code ran too long. Look for a loop whose condition never becomes false.';
  if (err.name === 'SyntaxError') return 'The code could not be parsed. Check for a missing bracket, parenthesis, quote, or comma near the reported line.';
  if (/is not defined/.test(msg)) return `A name is used before it exists. Check spelling and capitalisation, and declare variables with let or const. (${msg})`;
  if (/Cannot read properties of (undefined|null)/.test(msg)) return 'You tried to read a property of something that is undefined or null. Log the value just before that line to see what it holds.';
  if (/is not a function/.test(msg)) return 'You called something that is not a function. Check the name and that you are calling it on the right type (e.g. arrays have .map, numbers do not).';
  if (/Assignment to constant/.test(msg)) return 'A const variable cannot be reassigned. Use let if the value needs to change.';
  if (/Maximum call stack/.test(msg)) return 'A function keeps calling itself without stopping. Add or fix the base case.';
  return msg;
}
