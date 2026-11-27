// Small DOM helpers, markdown-lite renderer, icons, toasts and celebrations.

/** h('div.card#id', { onclick, class, attrs... }, ...children) */
export function h(tag, props, ...children) {
  if (props == null || typeof props !== 'object' || props instanceof Node || Array.isArray(props)) { children.unshift(props); props = {}; }
  const [, name = 'div', rest = ''] = tag.match(/^([a-z0-9-]*)(.*)$/i);
  const el = document.createElement(name || 'div');
  for (const part of rest.match(/[.#][^.#]+/g) || []) {
    if (part[0] === '.') el.classList.add(part.slice(1)); else el.id = part.slice(1);
  }
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v;
    else if (k === 'dataset') Object.assign(el.dataset, v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  append(el, children);
  return el;
}
function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === '') continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((#\/[^)\s]*)\)/g, '<a href="$2">$1</a>')
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])\*([^*\s][^*]*)\*/g, '$1<em>$2</em>');
}

/** Markdown-lite → HTML (paragraphs, bold, code, lists, fenced code). Content is escaped first. */
export function md(text = '') {
  const lines = String(text).split('\n');
  let out = '', list = null, para = [], code = null;
  const flushPara = () => { if (para.length) { out += `<p>${inline(para.join(' '))}</p>`; para = []; } };
  const flushList = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const line of lines) {
    if (code) {
      if (line.trim().startsWith('```')) { out += `<pre class="code-block" data-lang="${esc(code.lang)}"><code>${highlight(code.lines.join('\n'), code.lang)}</code></pre>`; code = null; }
      else code.lines.push(line);
      continue;
    }
    const fence = line.trim().match(/^```(\w*)/);
    if (fence) { flushPara(); flushList(); code = { lang: fence[1] || 'text', lines: [] }; continue; }
    const ul = line.match(/^\s*[-*] (.*)$/), ol = line.match(/^\s*\d+[.)] (.*)$/);
    if (ul || ol) {
      flushPara();
      const want = ul ? 'ul' : 'ol';
      if (list !== want) { flushList(); out += `<${want}>`; list = want; }
      out += `<li>${inline((ul || ol)[1])}</li>`;
      continue;
    }
    if (!line.trim()) { flushPara(); flushList(); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  if (code) out += `<pre class="code-block"><code>${highlight(code.lines.join('\n'), code.lang)}</code></pre>`;
  return out;
}

export const mdEl = (text, cls = 'prose') => h(`div.${cls}`, { html: md(text) });

// ---------- syntax highlighting (lightweight, for JS / Python / JSON) ----------
const KW = {
  javascript: 'const let var function return if else for while of in new class extends async await try catch finally throw typeof instanceof true false null undefined import export from default break continue switch case this',
  python: 'def return if elif else for while in not and or is import from as class try except finally raise with lambda None True False pass break continue yield global async await print',
  json: 'true false null',
};
export function highlight(code, lang = 'text') {
  const key = lang === 'js' ? 'javascript' : lang === 'py' ? 'python' : lang;
  if (!KW[key]) return esc(code);
  const kws = new Set(KW[key].split(' '));
  const commentRe = key === 'python' ? /#[^\n]*/y : /\/\/[^\n]*|\/\*[\s\S]*?\*\//y;
  let i = 0, out = '';
  const re = {
    str: /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|`(?:\\.|[^`\\])*`)/y,
    num: /\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b/y,
    word: /[A-Za-z_$][\w$]*/y,
  };
  while (i < code.length) {
    let m;
    commentRe.lastIndex = i;
    if ((m = commentRe.exec(code))) { out += `<span class="tk-c">${esc(m[0])}</span>`; i += m[0].length; continue; }
    re.str.lastIndex = i;
    if ((m = re.str.exec(code))) { out += `<span class="tk-s">${esc(m[0])}</span>`; i += m[0].length; continue; }
    re.num.lastIndex = i;
    if ((m = re.num.exec(code)) && !/[\w$]/.test(code[i - 1] || '')) { out += `<span class="tk-n">${m[0]}</span>`; i += m[0].length; continue; }
    re.word.lastIndex = i;
    if ((m = re.word.exec(code))) {
      const w = m[0];
      const next = code.slice(i + w.length).match(/^\s*\(/);
      out += kws.has(w) ? `<span class="tk-k">${w}</span>` : next ? `<span class="tk-f">${w}</span>` : esc(w);
      i += w.length; continue;
    }
    out += esc(code[i]); i++;
  }
  return out;
}

// ---------- icons (inline SVG, stroke-based) ----------
const ICONS = {
  home: 'M3 11l9-7 9 7M5 10v10h5v-6h4v6h5V10',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14',
  code: 'M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16',
  chart: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  chat: 'M4 5h16v11H9l-5 4V5z',
  settings: 'M12 15a3 3 0 100-6 3 3 0 000 6zM19.4 15a1.6 1.6 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.6 1.6 0 00-1.8-.3 1.6 1.6 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.6 1.6 0 00-1-1.5 1.6 1.6 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.6 1.6 0 00.3-1.8 1.6 1.6 0 00-1.5-1H3a2 2 0 110-4h.1a1.6 1.6 0 001.5-1 1.6 1.6 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.6 1.6 0 001.8.3H9a1.6 1.6 0 001-1.5V3a2 2 0 114 0v.1a1.6 1.6 0 001 1.5 1.6 1.6 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.6 1.6 0 00-.3 1.8V9a1.6 1.6 0 001.5 1H21a2 2 0 110 4h-.1a1.6 1.6 0 00-1.5 1z',
  lock: 'M6 11h12v9H6zM8 11V8a4 4 0 118 0v3',
  check: 'M5 12l5 5L20 7',
  x: 'M6 6l12 12M18 6L6 18',
  play: 'M7 4l13 8-13 8V4z',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9L12 3z',
  flag: 'M5 21V4M5 4h11l-2 4 2 4H5',
  shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z',
  trophy: 'M8 4h8v5a4 4 0 01-8 0V4zM8 6H4v1a4 4 0 004 4M16 6h4v1a4 4 0 01-4 4M12 13v4M8 21h8M9 17h6',
  spark: 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l3.5 3.5M15.5 15.5L19 19M19 5l-3.5 3.5M8.5 15.5L5 19',
  layers: 'M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5',
  search: 'M11 18a7 7 0 100-14 7 7 0 000 14zM21 21l-5-5',
  wrench: 'M14.7 6.3a4 4 0 00-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 005.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z',
  compass: 'M12 21a9 9 0 100-18 9 9 0 000 18zM15.5 8.5l-2 5-5 2 2-5 5-2z',
  rocket: 'M5 15c-1.5 1.5-2 4-2 6 2 0 4.5-.5 6-2M9 15l-3-3c1-4 4.5-8 12-9-1 7.5-5 11-9 12zM15 9a1 1 0 100-2 1 1 0 000 2z',
  footprints: 'M8 14c-2 0-3-2-3-5s1-5 3-5 3 2 3 5-1 5-3 5zM6 17h4v3H6zM16 10c2 0 3-2 3-4s-1-3-3-3-3 1-3 3 1 4 3 4zM14 13h4v3h-4z',
  rotate: 'M4 12a8 8 0 0114-5l2 2M20 4v5h-5M20 12a8 8 0 01-14 5l-2-2M4 20v-5h5',
  clock: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7l1-8z',
  book: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2V5zM4 19a2 2 0 012-2h13',
  target: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 16a4 4 0 100-8 4 4 0 000 8zM12 12h.01',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  back: 'M19 12H5M11 6l-6 6 6 6',
  copy: 'M9 9h11v11H9zM5 15H4V4h11v1',
  reset: 'M4 4v6h6M4.5 15a8 8 0 102-8.5L4 10',
  send: 'M4 12l16-8-6 16-3-7-7-1z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0012 3z',
  download: 'M12 4v11M7 10l5 5 5-5M4 20h16',
  upload: 'M12 20V9M7 14l5-5 5 5M4 4h16',
  menu: 'M4 7h16M4 12h16M4 17h16',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 3.5-6 8-6s8 2 8 6',
  sword: 'M14.5 4H20v5.5L9 20.5 3.5 15 14.5 4zM5 13l6 6M3 21l3-3',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.8A4.5 4.5 0 0120 9c0 6-8 11-8 11z',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v6M12 7h.01',
  alert: 'M12 3l10 18H2L12 3zM12 10v5M12 18h.01',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 15a3 3 0 100-6 3 3 0 000 6z',
};
export function icon(name, size = 20, cls = '') {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  svg.setAttribute('fill', 'none'); svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.8'); svg.setAttribute('stroke-linecap', 'round'); svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `icon ${cls}`);
  const p = document.createElementNS(ns, 'path');
  p.setAttribute('d', ICONS[name] || ICONS.info);
  svg.append(p);
  return svg;
}

// ---------- misc ----------
export const fmtDate = (iso, opts = { month: 'short', day: 'numeric' }) => new Date(iso).toLocaleDateString(undefined, opts);
export const fmtDateTime = (iso) => new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export const relDay = (iso) => {
  const d0 = new Date(); d0.setHours(0, 0, 0, 0);
  const d = new Date(iso); d.setHours(0, 0, 0, 0);
  const diff = Math.round((d0 - d) / 86400000);
  return diff === 0 ? 'Today' : diff === 1 ? 'Yesterday' : diff < 7 ? `${diff} days ago` : fmtDate(iso);
};
export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function progressBar(pct, { label, cls = '' } = {}) {
  return h(`div.progress${cls ? '.' + cls : ''}`, { role: 'progressbar', 'aria-valuenow': pct, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': label || 'Progress' },
    h('div.progress-fill', { style: { width: `${Math.max(0, Math.min(100, pct))}%` } }));
}

export function statusPill(status, text) {
  const ic = { completed: 'check', done: 'check', passed: 'check', locked: 'lock', failed: 'x', 'test-failed': 'rotate', 'in-progress': 'clock', available: 'play', 'test-ready': 'target', 'boss-ready': 'sword', todo: 'target' }[status] || 'info';
  return h(`span.pill.pill-${status}`, icon(ic, 14), text);
}

// ---------- toasts & celebrations ----------
let toastRoot;
export function toast(message, { kind = 'info', iconName, timeout = 3600 } = {}) {
  toastRoot = toastRoot || document.getElementById('toasts');
  const t = h(`div.toast.toast-${kind}`, { role: 'status' }, iconName ? icon(iconName, 18) : null, h('span', message));
  toastRoot.append(t);
  setTimeout(() => { t.classList.add('leaving'); setTimeout(() => t.remove(), 300); }, timeout);
}

export function modal({ title, body, actions = [], cls = '', onClose }) {
  const prevFocus = document.activeElement;
  const close = () => { overlay.remove(); document.removeEventListener('keydown', onKey); prevFocus?.focus?.(); onClose?.(); };
  const onKey = (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      const f = [...dialog.querySelectorAll('button, a[href], input, textarea, select, [tabindex]:not([tabindex="-1"])')];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  };
  const dialog = h(`div.modal${cls ? '.' + cls : ''}`, { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'modal-title' },
    h('h2#modal-title', title),
    body instanceof Node ? body : h('p', body),
    h('div.modal-actions', actions.map((a, i) => h(`button.btn${a.kind === 'danger' ? '.btn-danger' : i === 0 ? '.btn-primary' : '.btn-ghost'}`, { onclick: () => { close(); a.onClick?.(); }, 'data-autofocus': a.autofocus ? '' : null }, a.label))));
  const overlay = h('div.modal-overlay', { onclick: (e) => { if (e.target === overlay) close(); } }, dialog);
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  setTimeout(() => (dialog.querySelector('[data-autofocus]') || dialog.querySelector('button'))?.focus(), 30);
  return close;
}

export function confetti(container = document.body) {
  if (reducedMotion()) return;
  const layer = h('div.confetti', { 'aria-hidden': 'true' });
  const colors = ['var(--primary)', 'var(--accent)', 'var(--success)', 'var(--gold)'];
  for (let i = 0; i < 36; i++) {
    layer.append(h('i', { style: { left: `${Math.random() * 100}%`, background: colors[i % colors.length], animationDelay: `${Math.random() * 0.4}s`, transform: `rotate(${Math.random() * 360}deg)` } }));
  }
  container.append(layer);
  setTimeout(() => layer.remove(), 2200);
}

export function shuffleWithSeed(arr, seed) {
  const a = arr.map((v, i) => ({ v, i }));
  let s = seed >>> 0 || 1;
  for (let i = a.length - 1; i > 0; i--) {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    const j = s % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
