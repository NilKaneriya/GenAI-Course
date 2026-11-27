// Interactive visual explanations used inside lessons. Each returns a DOM element.
// All numbers are small teaching models, labelled as such — not outputs of a real LLM.
import { h, icon, reducedMotion } from '../ui.js';
import { visualUsed, arcadeWin } from '../store.js';

const NS = 'http://www.w3.org/2000/svg';
const s = (tag, attrs = {}, ...kids) => {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const k of kids.flat()) if (k != null) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
};
const softmax = (logits, t = 1) => {
  const T = Math.max(t, 0.01);
  const m = Math.max(...logits);
  const ex = logits.map((l) => Math.exp((l - m) / T));
  const sum = ex.reduce((a, b) => a + b, 0);
  return ex.map((e) => e / sum);
};
const sample = (probs) => { let r = Math.random(), i = 0; for (; i < probs.length - 1; i++) { r -= probs[i]; if (r <= 0) break; } return i; };
const cos = (a, b) => { const d = a.reduce((t, x, i) => t + x * b[i], 0); const n = Math.hypot(...a) * Math.hypot(...b); return n ? d / n : 0; };
const pct = (x) => `${Math.round(x * 100)}%`;

function frame(key, title, caption, ...body) {
  let touched = false;
  const el = h('section.visual', { 'aria-label': `Interactive visual: ${title}` },
    h('header.visual-head', h('span.visual-kicker', icon('eye', 16), 'Interactive visual'), h('h3', title)),
    caption ? h('p.visual-caption', caption) : null,
    h('div.visual-body', body),
    h('p.visual-note', 'Teaching model: simplified numbers chosen to illustrate the idea.'));
  const mark = () => { if (!touched) { touched = true; visualUsed(key); } };
  el.addEventListener('input', mark);
  el.addEventListener('click', (e) => { if (e.target.closest('button, [role="button"], .clickable')) mark(); });
  return el;
}

// ---------------------------------------------------------------- promptFlow
const PF_PROMPTS = [
  { prompt: 'The capital of France is', tokens: ['The', ' capital', ' of', ' France', ' is'], cands: [' Paris', ' a', ' located', ' Lyon', ' beautiful'], logits: [6.2, 2.9, 2.6, 1.4, 1.9] },
  { prompt: 'Write a name for a coffee shop:', tokens: ['Write', ' a', ' name', ' for', ' a', ' coffee', ' shop', ':'], cands: [' Bean', ' The', ' Brew', ' Daily', ' Ember'], logits: [3.1, 3.0, 2.8, 2.2, 1.6] },
  { prompt: 'def add(a, b):\\n    return', tokens: ['def', ' add', '(a', ',', ' b', '):', '\\n   ', ' return'], cands: [' a', ' sum', ' (', ' None', ' b'], logits: [5.6, 2.4, 2.0, 0.9, 1.3] },
];
function promptFlow(caption) {
  let p = PF_PROMPTS[0], temp = 0.7, tally = {}, last = null;
  const sel = h('select', { 'aria-label': 'Choose a prompt' }, PF_PROMPTS.map((x, i) => h('option', { value: i }, x.prompt.replace('\\n', ' '))));
  const tempIn = h('input', { type: 'range', min: 0, max: 2, step: 0.1, value: temp, 'aria-label': 'Temperature' });
  const tempOut = h('output.mono');
  const tokens = h('div.token-row');
  const bars = h('div.prob-bars');
  const result = h('div.sample-result', { 'aria-live': 'polite' });
  const render = () => {
    tempOut.textContent = temp.toFixed(1);
    tokens.replaceChildren(...p.tokens.map((t, i) => h(`span.tok.tok-${i % 4}`, t.replace(/ /g, '·'))), last ? h('span.tok.tok-new', last.replace(/ /g, '·')) : h('span.tok.tok-ghost', '?'));
    const probs = softmax(p.logits, temp);
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    bars.replaceChildren(...p.cands.map((c, i) => h('div.prob-row',
      h('span.prob-label.mono', c.replace(/ /g, '·')),
      h('span.prob-track', h('span.prob-fill', { style: { width: pct(probs[i]) } })),
      h('span.prob-val', pct(probs[i])),
      h('span.prob-count', total ? `${tally[c] || 0}/${total} picked` : ''))));
  };
  const draw = (n) => {
    const probs = softmax(p.logits, temp);
    for (let k = 0; k < n; k++) { const c = p.cands[temp === 0 ? 0 : sample(probs)]; tally[c] = (tally[c] || 0) + 1; last = c; }
    result.textContent = n === 1 ? `Sampled next token: "${last.trim()}"` : `Sampled ${n} times at temperature ${temp.toFixed(1)}.`;
    render();
  };
  sel.addEventListener('change', () => { p = PF_PROMPTS[sel.value]; tally = {}; last = null; result.textContent = ''; render(); });
  tempIn.addEventListener('input', () => { temp = Number(tempIn.value); tally = {}; render(); });
  render();
  return frame('promptFlow', 'From prompt to next token', caption,
    h('div.vis-controls', h('label', 'Prompt ', sel), h('label', 'Temperature ', tempIn, tempOut)),
    h('div.flow',
      h('div.flow-step', h('span.flow-label', '1. Tokens'), tokens),
      h('div.flow-arrow', icon('arrow', 18)),
      h('div.flow-step.flow-model', h('span.flow-label', '2. Model scores every candidate'), h('div.model-box', icon('layers', 22), 'LLM')),
      h('div.flow-arrow', icon('arrow', 18)),
      h('div.flow-step', h('span.flow-label', '3. Probabilities after temperature'), bars)),
    h('div.vis-actions', h('button.btn.btn-small', { onclick: () => draw(1) }, icon('play', 16), 'Sample 1 token'), h('button.btn.btn-small.btn-ghost', { onclick: () => draw(20) }, 'Sample 20 times'), h('button.btn.btn-small.btn-ghost', { onclick: () => { tally = {}; last = null; result.textContent = ''; render(); } }, 'Clear')),
    result);
}

// ---------------------------------------------------------------- tokens
export function approxTokenize(text) {
  const pieces = text.match(/\s*[A-Za-z]+|\s*\d|\s*[^\sA-Za-z\d]|\s+/g) || [];
  const out = [];
  for (const p of pieces) {
    const lead = p.match(/^\s*/)[0];
    const core = p.slice(lead.length);
    if (/^[A-Za-z]+$/.test(core) && core.length > 7) {
      // long/rare words split into sub-word chunks (approximation)
      let first = true;
      for (let i = 0; i < core.length; i += 5) { out.push((first ? lead : '') + core.slice(i, i + 5)); first = false; }
    } else out.push(p);
  }
  return out;
}
function tokens(caption) {
  const ta = h('textarea', { rows: 3, 'aria-label': 'Text to tokenize' });
  ta.value = 'Tokenization splits text into pieces. Common words stay whole; unusual words like photosynthesis split up. Numbers like 2026 cost extra.';
  const win = h('input', { type: 'range', min: 16, max: 96, step: 8, value: 48, 'aria-label': 'Context window size in tokens' });
  const reserve = h('input', { type: 'range', min: 0, max: 32, step: 4, value: 12, 'aria-label': 'Tokens reserved for the answer' });
  const chips = h('div.token-row.wrap');
  const stats = h('div.stat-row');
  const bar = h('div.window-bar');
  const note = h('p.small', { 'aria-live': 'polite' });
  const render = () => {
    const toks = approxTokenize(ta.value);
    const W = Number(win.value), R = Number(reserve.value), room = W - R;
    chips.replaceChildren(...toks.map((t, i) => h(`span.tok.tok-${i % 4}${i >= room ? '.tok-cut' : ''}`, { title: i >= room ? 'Does not fit — cut off' : `Token ${i + 1}` }, t.replace(/ /g, '·'))));
    stats.replaceChildren(
      h('div.stat', h('strong', ta.value.length), h('span', 'characters')),
      h('div.stat', h('strong', toks.length), h('span', 'tokens (approx.)')),
      h('div.stat', h('strong', toks.length ? (ta.value.length / toks.length).toFixed(1) : '0'), h('span', 'chars per token')));
    const used = Math.min(toks.length, room);
    bar.replaceChildren(
      h('span.wb-input', { style: { width: `${(used / W) * 100}%` } }, `prompt ${used}`),
      h('span.wb-reserve', { style: { width: `${(R / W) * 100}%` } }, R ? `answer ${R}` : ''),
      h('span.wb-free', { style: { width: `${(Math.max(0, room - used) / W) * 100}%` } }));
    note.textContent = toks.length > room
      ? `Overflow: ${toks.length - room} tokens do not fit in a ${W}-token window once ${R} are reserved for the answer. They would be cut or rejected.`
      : `Fits: ${room - toks.length} tokens to spare in a ${W}-token window (with ${R} reserved for the answer).`;
  };
  [ta, win, reserve].forEach((el) => el.addEventListener('input', render));
  render();
  return frame('tokens', 'Tokens and the context window', caption,
    ta, chips, stats,
    h('div.vis-controls', h('label', 'Context window ', win), h('label', 'Reserved for answer ', reserve)),
    bar, note,
    h('p.visual-note', 'Approximation: real tokenizers use a learned vocabulary, so exact splits differ by model.'));
}

// ---------------------------------------------------------------- trainInfer
function trainInfer(caption) {
  let mode = 'train', weights = [0.12, -0.4, 0.75], loss = 2.4, step = 0, calls = 0;
  const diagram = h('div.ti-diagram');
  const info = h('div.ti-info', { 'aria-live': 'polite' });
  const tabs = h('div.segmented', { role: 'tablist' });
  const render = () => {
    tabs.replaceChildren(...['train', 'infer'].map((m) => h(`button.seg${mode === m ? '.active' : ''}`, { role: 'tab', 'aria-selected': mode === m, onclick: () => { mode = m; render(); } }, m === 'train' ? 'Training' : 'Inference')));
    const train = mode === 'train';
    diagram.className = `ti-diagram mode-${mode}`;
    diagram.replaceChildren(
      h('div.ti-node', h('span.ti-t', train ? 'Training example' : 'Your prompt'), h('code', train ? '"The cat sat on the" → "mat"' : '"Summarize this email…"')),
      h('div.ti-arrow.fwd', icon('arrow', 20)),
      h('div.ti-node.ti-model', h('span.ti-t', train ? 'Model (weights change)' : 'Model (weights frozen)'), h('div.weights', weights.map((w) => h('span.w', w.toFixed(2)))), train ? null : h('span.frozen', icon('lock', 14), 'frozen')),
      h('div.ti-arrow.fwd', icon('arrow', 20)),
      h('div.ti-node', h('span.ti-t', train ? 'Prediction vs. answer' : 'Output'), h('code', train ? `loss = ${loss.toFixed(2)}` : 'Generated summary…')),
      train ? h('div.ti-back', icon('back', 18), 'Error flows backward → weights updated') : null);
    info.textContent = train
      ? `Training step ${step}. Each step nudges the weights to reduce the loss. Loss now ${loss.toFixed(2)}.`
      : `Inference calls made: ${calls}. The weights have not changed — inference only runs the model forward.`;
  };
  const act = () => {
    if (mode === 'train') { step++; loss = Math.max(0.08, loss * 0.72); weights = weights.map((w, i) => +(w + (i % 2 ? 0.07 : -0.05) * loss).toFixed(2)); }
    else calls++;
    render();
    diagram.classList.add('pulse'); setTimeout(() => diagram.classList.remove('pulse'), 600);
  };
  render();
  return frame('trainInfer', 'Training vs. inference', caption, tabs, diagram, h('div.vis-actions', h('button.btn.btn-small', { onclick: act }, icon('play', 16), 'Run one step')), info);
}

// ---------------------------------------------------------------- gradient
function gradient(caption) {
  const f = (w) => 0.25 * (w - 3) ** 2 + 0.5, df = (w) => 0.5 * (w - 3);
  let w = -3, lr = 0.6, trail = [w];
  const lrIn = h('input', { type: 'range', min: 0.1, max: 4.4, step: 0.1, value: lr, 'aria-label': 'Learning rate' });
  const lrOut = h('output.mono');
  const W = 520, H = 240, x = (v) => 30 + ((v + 5) / 16) * (W - 60), y = (l) => H - 30 - Math.min(l, 18) / 18 * (H - 50);
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'vis-svg', role: 'img', 'aria-label': 'Loss curve with gradient descent steps' });
  const info = h('p.small', { 'aria-live': 'polite' });
  const render = () => {
    lrOut.textContent = lr.toFixed(1);
    const pts = []; for (let v = -5; v <= 11; v += 0.1) pts.push(`${x(v)},${y(f(v))}`);
    svg.replaceChildren(
      s('line', { x1: 30, x2: W - 30, y1: H - 30, y2: H - 30, class: 'axis-line' }),
      s('text', { x: W / 2, y: H - 8, 'text-anchor': 'middle', class: 'axis' }, 'weight value (w)'),
      s('text', { x: 14, y: H / 2, transform: `rotate(-90 14 ${H / 2})`, 'text-anchor': 'middle', class: 'axis' }, 'loss'),
      s('polyline', { points: pts.join(' '), class: 'loss-curve' }),
      s('line', { x1: x(3), x2: x(3), y1: y(f(3)), y2: H - 30, class: 'grid' }),
      s('text', { x: x(3), y: H - 36, 'text-anchor': 'middle', class: 'axis' }, 'minimum'),
      ...trail.slice(0, -1).map((v, i) => s('line', { x1: x(v), y1: y(f(v)), x2: x(trail[i + 1]), y2: y(f(trail[i + 1])), class: 'trail' })),
      ...trail.map((v, i) => s('circle', { cx: x(Math.max(-5, Math.min(11, v))), cy: y(f(v)), r: i === trail.length - 1 ? 8 : 4, class: i === trail.length - 1 ? 'ball' : 'ball-ghost' })));
    const l = f(w);
    info.textContent = `Step ${trail.length - 1}: w = ${w.toFixed(2)}, loss = ${l.toFixed(2)}. ` +
      (lr >= 4 ? 'Learning rate too large: each step overshoots further — the loss diverges.' : lr > 2.2 ? 'Large learning rate: the steps overshoot and bounce across the minimum.' : lr < 0.3 ? 'Small learning rate: steady but slow progress.' : 'A reasonable learning rate: quick, stable descent.');
  };
  const stepOnce = () => { w = w - lr * df(w); if (!isFinite(w) || Math.abs(w) > 1e6) w = Math.sign(w) * 1e6; trail.push(w); render(); };
  lrIn.addEventListener('input', () => { lr = Number(lrIn.value); w = -3; trail = [w]; render(); });
  render();
  return frame('gradient', 'Gradient descent on a loss curve', caption,
    h('div.vis-controls', h('label', 'Learning rate ', lrIn, lrOut)), svg,
    h('div.vis-actions', h('button.btn.btn-small', { onclick: stepOnce }, icon('play', 16), 'Take a step'), h('button.btn.btn-small.btn-ghost', { onclick: () => { for (let i = 0; i < 10; i++) stepOnce(); } }, 'Take 10 steps'), h('button.btn.btn-small.btn-ghost', { onclick: () => { w = -3; trail = [w]; render(); } }, 'Reset')),
    info);
}

// ---------------------------------------------------------------- nnLayers
function nnLayers(caption) {
  const W1 = [[0.9, -0.6], [-0.7, 1.1], [0.5, 0.8]], B1 = [0.1, -0.2, -0.4];
  const W2 = [1.2, 0.9, -1.0], B2 = -0.3;
  const relu = (v) => Math.max(0, v), sig = (v) => 1 / (1 + Math.exp(-v));
  const inputs = [h('input', { type: 'range', min: -1, max: 1, step: 0.1, value: 0.6, 'aria-label': 'Input x1' }), h('input', { type: 'range', min: -1, max: 1, step: 0.1, value: -0.2, 'aria-label': 'Input x2' })];
  const W = 520, H = 250;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'vis-svg nn', role: 'img', 'aria-label': 'Neural network forward pass' });
  const math = h('div.nn-math.mono.small');
  const pos = { in: [[80, 80], [80, 170]], hid: [[260, 55], [260, 125], [260, 195]], out: [[440, 125]] };
  const render = () => {
    const x = inputs.map((i) => Number(i.value));
    const z = W1.map((row, j) => row[0] * x[0] + row[1] * x[1] + B1[j]);
    const a = z.map(relu);
    const zo = a.reduce((t, v, j) => t + v * W2[j], B2), out = sig(zo);
    const edge = (p, q, wt, act) => s('line', { x1: p[0], y1: p[1], x2: q[0], y2: q[1], class: `edge ${wt >= 0 ? 'pos' : 'neg'}`, 'stroke-width': 1 + Math.abs(wt) * 3, opacity: 0.25 + Math.min(1, Math.abs(act)) * 0.75 });
    const node = (p, val, label, sub) => [s('circle', { cx: p[0], cy: p[1], r: 24, class: 'node', style: `fill-opacity:${0.15 + Math.min(1, Math.abs(val)) * 0.85}` }), s('text', { x: p[0], y: p[1] + 5, 'text-anchor': 'middle', class: 'node-val' }, val.toFixed(2)), s('text', { x: p[0], y: p[1] - 32, 'text-anchor': 'middle', class: 'axis' }, label), sub ? s('text', { x: p[0], y: p[1] + 42, 'text-anchor': 'middle', class: 'axis axis-sub' }, sub) : null];
    svg.replaceChildren(
      ...pos.hid.flatMap((q, j) => pos.in.map((p, i) => edge(p, q, W1[j][i], x[i]))),
      ...pos.hid.map((p, j) => edge(p, pos.out[0], W2[j], a[j])),
      ...pos.in.flatMap((p, i) => node(p, x[i], `x${i + 1}`)),
      ...pos.hid.flatMap((p, j) => node(p, a[j], `h${j + 1}`, z[j] < 0 ? 'ReLU → 0' : null)),
      ...node(pos.out[0], out, 'output', 'sigmoid'),
      s('text', { x: 80, y: 235, 'text-anchor': 'middle', class: 'axis' }, 'Input layer'),
      s('text', { x: 260, y: 245, 'text-anchor': 'middle', class: 'axis' }, 'Hidden layer (ReLU)'),
      s('text', { x: 440, y: 235, 'text-anchor': 'middle', class: 'axis' }, 'Output layer'));
    math.replaceChildren(
      h('div', `h1 = ReLU(${W1[0][0]}·${x[0].toFixed(1)} + ${W1[0][1]}·${x[1].toFixed(1)} + ${B1[0]}) = ReLU(${z[0].toFixed(2)}) = ${a[0].toFixed(2)}`),
      h('div', `output = sigmoid(${W2.map((w, j) => `${w}·${a[j].toFixed(2)}`).join(' + ')} + ${B2}) = ${out.toFixed(2)}`));
  };
  inputs.forEach((i) => i.addEventListener('input', render));
  render();
  return frame('nnLayers', 'A forward pass through a tiny network', caption,
    h('div.vis-controls', h('label', 'x1 ', inputs[0]), h('label', 'x2 ', inputs[1])), svg, math,
    h('p.small.muted', 'Blue edges are positive weights, orange are negative; thicker means larger magnitude.'));
}

// ---------------------------------------------------------------- attention
const ATT = {
  light: { words: ['The', 'robot', 'lifted', 'the', 'box', 'because', 'it', 'was', 'light'], focus: { it: [0.02, 0.12, 0.06, 0.02, 0.62, 0.03, 0.05, 0.03, 0.05], lifted: [0.04, 0.45, 0.2, 0.03, 0.22, 0.02, 0.01, 0.01, 0.02], light: [0.02, 0.06, 0.08, 0.02, 0.38, 0.04, 0.24, 0.12, 0.04] } },
  strong: { words: ['The', 'robot', 'lifted', 'the', 'box', 'because', 'it', 'was', 'strong'], focus: { it: [0.03, 0.64, 0.05, 0.02, 0.13, 0.03, 0.04, 0.02, 0.04], lifted: [0.04, 0.45, 0.2, 0.03, 0.22, 0.02, 0.01, 0.01, 0.02], strong: [0.02, 0.36, 0.08, 0.02, 0.08, 0.04, 0.26, 0.1, 0.04] } },
};
function attention(caption) {
  let variant = 'light', sel = 'it';
  const row = h('div.att-words');
  const detail = h('div.att-detail', { 'aria-live': 'polite' });
  const tabs = h('div.segmented');
  const render = () => {
    const v = ATT[variant];
    tabs.replaceChildren(...Object.keys(ATT).map((k) => h(`button.seg${variant === k ? '.active' : ''}`, { onclick: () => { variant = k; if (!ATT[k].focus[sel]) sel = 'it'; render(); } }, `…because it was ${k}`)));
    const weights = v.focus[sel] || v.words.map((w, i) => (w === sel ? 0.5 : 0.5 / (v.words.length - 1)));
    row.replaceChildren(...v.words.map((w, i) => h(`button.att-word${w === sel ? '.selected' : ''}`, { style: { '--w': weights[i] }, 'aria-pressed': w === sel, onclick: () => { sel = w; render(); }, title: `Attention from "${sel}": ${pct(weights[i])}` }, w, h('span.att-w', pct(weights[i])))));
    const top = v.words.map((w, i) => [w, weights[i]]).filter(([w]) => w !== sel).sort((a, b) => b[1] - a[1])[0];
    detail.replaceChildren(h('p', h('strong', `"${sel}"`), ` attends most to `, h('strong', `"${top[0]}"`), ` (${pct(top[1])}).`),
      sel === 'it' ? h('p.small', variant === 'light' ? 'Boxes are light, robots are not — so "it" is resolved to the box.' : 'Being strong describes the robot — so "it" is resolved to the robot. Same word, different context, different attention.') : h('p.small', 'Weights come from softmax(query · key / √d) and always sum to 100% across the sentence.'));
  };
  render();
  return frame('attention', 'Self-attention: who looks at whom', caption, tabs, row, detail,
    h('p.small.muted', 'Click "it", "lifted" or the last word. Darker = more attention. Real models run many attention heads in parallel, each learning different patterns.'));
}

// ---------------------------------------------------------------- embeddings
const EMB = [
  ['dog', [0.82, 0.62], 'animal'], ['puppy', [0.86, 0.55], 'animal'], ['cat', [0.75, 0.7], 'animal'], ['kitten', [0.78, 0.64], 'animal'],
  ['apple', [-0.2, 0.92], 'food'], ['banana', [-0.3, 0.88], 'food'], ['bread', [-0.12, 0.95], 'food'],
  ['car', [0.55, -0.78], 'vehicle'], ['truck', [0.62, -0.72], 'vehicle'], ['bicycle', [0.4, -0.85], 'vehicle'],
  ['python', [-0.85, -0.42], 'code'], ['javascript', [-0.9, -0.33], 'code'], ['function', [-0.78, -0.55], 'code'], ['snake', [0.6, 0.35], 'animal'],
];
function embeddings(caption) {
  let sel = 'dog';
  const W = 440, H = 340, cx = W / 2, cy = H / 2, sc = 150;
  const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'vis-svg emb', role: 'img', 'aria-label': 'Two-dimensional embedding map' });
  const list = h('ol.sim-list');
  const render = () => {
    const sv = EMB.find((e) => e[0] === sel)[1];
    const sims = EMB.filter((e) => e[0] !== sel).map(([w, v, g]) => ({ w, v, g, sim: cos(sv, v) })).sort((a, b) => b.sim - a.sim);
    const top = new Set(sims.slice(0, 3).map((x) => x.w));
    svg.replaceChildren(
      s('line', { x1: 20, x2: W - 20, y1: cy, y2: cy, class: 'grid' }), s('line', { x1: cx, x2: cx, y1: 10, y2: H - 10, class: 'grid' }),
      ...sims.filter((x) => top.has(x.w)).map((x) => s('line', { x1: cx + sv[0] * sc, y1: cy - sv[1] * sc, x2: cx + x.v[0] * sc, y2: cy - x.v[1] * sc, class: 'emb-link' })),
      ...EMB.map(([w, v, g]) => {
        const gEl = s('g', { class: `emb-pt grp-${g} ${w === sel ? 'is-sel' : ''} ${top.has(w) ? 'is-near' : ''} clickable`, tabindex: 0, role: 'button', 'aria-label': `Select ${w}` },
          s('circle', { cx: cx + v[0] * sc, cy: cy - v[1] * sc, r: w === sel ? 9 : 6 }),
          s('text', { x: cx + v[0] * sc + 10, y: cy - v[1] * sc + 4 }, w));
        const pick = () => { sel = w; render(); };
        gEl.addEventListener('click', pick);
        gEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
        return gEl;
      }));
    list.replaceChildren(...sims.slice(0, 6).map((x) => h('li', h('span.mono', x.w), h('span.sim-bar', h('span', { style: { width: pct(Math.max(0, x.sim)) } })), h('span.mono', x.sim.toFixed(2)))));
  };
  render();
  return frame('embeddings', 'Embeddings: meaning as position', caption,
    h('div.split', svg, h('div', h('h4', 'Cosine similarity to the selected word'), list,
      h('p.small.muted', 'Notice "python" sits near code words, not near "snake": the embedding reflects the sense the training text used most. Real embeddings have hundreds or thousands of dimensions; this map uses two.'))));
}

// ---------------------------------------------------------------- vectorSearch
const AXES = ['refunds', 'shipping', 'account', 'technical'];
const DOCS = [
  { id: 'D1', title: 'Refund policy: 30 days with receipt', v: [0.95, 0.15, 0.1, 0] },
  { id: 'D2', title: 'How to track your parcel', v: [0.1, 0.95, 0.05, 0.1] },
  { id: 'D3', title: 'Reset your password', v: [0, 0, 0.9, 0.35] },
  { id: 'D4', title: 'Damaged items: return or replace', v: [0.7, 0.55, 0, 0.05] },
  { id: 'D5', title: 'App crashes on startup — fixes', v: [0, 0, 0.2, 0.97] },
  { id: 'D6', title: 'International delivery times', v: [0.05, 0.9, 0, 0] },
  { id: 'D7', title: 'Close or delete your account', v: [0.15, 0, 0.95, 0.1] },
];
const QUERIES = [
  { q: 'My package arrived broken, can I get my money back?', v: [0.75, 0.5, 0, 0.05] },
  { q: 'I forgot my login details', v: [0, 0, 0.95, 0.25] },
  { q: 'Where is my order?', v: [0.05, 0.98, 0.05, 0] },
  { q: 'The mobile app keeps closing', v: [0, 0, 0.15, 0.98] },
];
function vectorSearch(caption) {
  let qi = 0, k = 3;
  const sel = h('select', { 'aria-label': 'Choose a query' }, QUERIES.map((x, i) => h('option', { value: i }, x.q)));
  const kIn = h('input', { type: 'range', min: 1, max: 5, value: k, 'aria-label': 'Top k' });
  const kOut = h('output.mono');
  const qvec = h('div.vec');
  const results = h('ol.vs-results');
  const render = () => {
    kOut.textContent = k;
    const q = QUERIES[qi];
    qvec.replaceChildren(h('span.small.muted', 'Query vector: '), ...q.v.map((x, i) => h('span.vec-cell', { title: AXES[i] }, x.toFixed(2))), h('span.small.muted', `  (dims: ${AXES.join(', ')})`));
    const ranked = DOCS.map((d) => ({ ...d, score: cos(q.v, d.v) })).sort((a, b) => b.score - a.score);
    results.replaceChildren(...ranked.map((d, i) => h(`li.result${i < k ? '.in' : '.out'}`,
      h('span.rank', i + 1), h('span.r-title', h('span.mono.small', d.id), ' ', d.title),
      h('span.r-score', h('span.sim-bar', h('span', { style: { width: pct(Math.max(0, d.score)) } })), d.score.toFixed(3)),
      h('span.r-tag', i < k ? 'Retrieved' : 'Below top-k'))));
  };
  sel.addEventListener('change', () => { qi = Number(sel.value); render(); });
  kIn.addEventListener('input', () => { k = Number(kIn.value); render(); });
  render();
  return frame('vectorSearch', 'Vector search: nearest neighbours', caption,
    h('div.vis-controls', h('label.grow', 'Query ', sel), h('label', 'Top-k ', kIn, kOut)), qvec, results,
    h('p.small.muted', 'No keyword overlap is needed: "money back" finds the refund documents because their vectors point in a similar direction. Toy 4-dimension vectors.'));
}

// ---------------------------------------------------------------- steppers (rag, tools)
function stepper(key, title, caption, steps) {
  let i = 0;
  const nav = h('ol.stepper-nav');
  const panel = h('div.stepper-panel', { 'aria-live': 'polite' });
  const prev = h('button.btn.btn-small.btn-ghost', { onclick: () => { if (i > 0) { i--; render(); } } }, icon('back', 16), 'Back');
  const next = h('button.btn.btn-small', { onclick: () => { if (i < steps.length - 1) { i++; render(); } } }, 'Next step', icon('arrow', 16));
  const render = () => {
    nav.replaceChildren(...steps.map((st, j) => h(`li${j === i ? '.current' : j < i ? '.done' : ''}`, h('button', { onclick: () => { i = j; render(); }, 'aria-current': j === i ? 'step' : null }, h('span.step-n', j + 1), h('span.step-t', st.t)))));
    const st = steps[i];
    panel.replaceChildren(h('h4', `${i + 1}. ${st.t}`), h('p', st.d), st.code ? h('pre.code-block.small', h('code', st.code)) : null, st.extra ? st.extra() : null);
    prev.disabled = i === 0; next.disabled = i === steps.length - 1;
  };
  render();
  return frame(key, title, caption, nav, panel, h('div.vis-actions', prev, next));
}

const ragPipeline = (caption) => stepper('ragPipeline', 'The RAG pipeline, step by step', caption, [
  { t: 'Ingest', d: 'Load trusted source documents — help-centre pages, PDFs, policies — and clean them (strip navigation, fix encoding).', code: 'refund-policy.md  (2,400 words)\nshipping-faq.md   (1,800 words)\nwarranty.pdf      (12 pages)' },
  { t: 'Chunk', d: 'Split each document into overlapping passages small enough to retrieve precisely but big enough to keep meaning.', code: 'chunk 14: "Refunds are issued within 30 days of delivery if the item…"\nchunk 15: "…if the item is unused. Damaged items can be returned at no cost…"' },
  { t: 'Embed & store', d: 'Turn every chunk into an embedding vector and store it in a vector database together with its text and metadata (source, date).', code: '{ id: "refund-policy#14", vector: [0.021, -0.113, 0.087, …], source: "refund-policy.md" }' },
  { t: 'Retrieve', d: 'At question time, embed the user’s question and fetch the top-k most similar chunks (optionally filtered by metadata and reranked).', code: 'Q: "Can I return a broken blender?"\n→ refund-policy#15 (0.89)  warranty#3 (0.84)  shipping-faq#7 (0.61)' },
  { t: 'Augment', d: 'Insert the retrieved chunks into the prompt with clear delimiters and an instruction to answer only from them and cite sources.', code: 'SYSTEM: Answer using only the context. Cite [source]. If unsure, say so.\nCONTEXT:\n[refund-policy#15] Damaged items can be returned at no cost…\nQUESTION: Can I return a broken blender?' },
  { t: 'Generate', d: 'The model writes a grounded answer with citations. Because sources are attached, users (and your evals) can verify it.', code: 'Yes — damaged items can be returned at no cost within 30 days of delivery [refund-policy#15].' },
]);

const toolCalling = (caption) => stepper('toolCalling', 'A tool-call round trip', caption, [
  { t: 'Define tools', d: 'Your app sends the model the conversation plus tool definitions: a name, a description and a JSON Schema for the arguments.', code: '{ "name": "get_order_status",\n  "description": "Look up an order by id",\n  "parameters": { "type": "object",\n    "properties": { "order_id": { "type": "string" } },\n    "required": ["order_id"] } }' },
  { t: 'User asks', d: 'The user asks something the model cannot answer from training data alone.', code: 'USER: Where is order A-1042?' },
  { t: 'Model requests a tool', d: 'Instead of guessing, the model returns a structured tool call. It does not run anything itself.', code: '{ "tool_call": { "name": "get_order_status",\n  "arguments": { "order_id": "A-1042" } } }' },
  { t: 'Your code validates & runs it', d: 'Your application checks the tool name and arguments against the schema and permissions, then executes the real function.', code: 'validate(args, schema)  ✓\nresult = db.orders.status("A-1042")\n→ { "status": "shipped", "eta": "Thu" }' },
  { t: 'Send the result back', d: 'The tool result is appended to the conversation as a tool message, linked to the call.', code: 'TOOL RESULT (get_order_status): { "status": "shipped", "eta": "Thu" }' },
  { t: 'Model answers', d: 'With real data in context, the model writes the final answer. Multi-step agents repeat steps 3–5 until done, with a step limit.', code: 'ASSISTANT: Order A-1042 has shipped and should arrive on Thursday.' },
]);

// ---------------------------------------------------------------- structuredOutput
function structuredOutput(caption) {
  const schema = { required: ['name', 'email', 'priority'], types: { name: 'string', email: 'string', priority: ['low', 'medium', 'high'] } };
  const outputs = {
    free: 'Sure! The customer is Dana Ortiz (dana@example.com) and it sounds fairly urgent, maybe high priority?',
    bad: '```json\n{ "name": "Dana Ortiz", "email": "dana@example.com", "priority": "urgent" }\n```',
    good: '{ "name": "Dana Ortiz", "email": "dana@example.com", "priority": "high" }',
  };
  let mode = 'free';
  const tabs = h('div.segmented');
  const raw = h('pre.code-block.small');
  const verdict = h('div.validation', { 'aria-live': 'polite' });
  const validate = (text) => {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return ['No JSON object found — free text cannot be parsed reliably.'];
    let data; try { data = JSON.parse(m[0]); } catch { return ['Invalid JSON.']; }
    const errs = [];
    for (const k of schema.required) if (!(k in data)) errs.push(`Missing required field "${k}".`);
    if (data.priority && !schema.types.priority.includes(data.priority)) errs.push(`"priority" must be one of ${schema.types.priority.join(', ')} — got "${data.priority}".`);
    return errs;
  };
  const render = () => {
    tabs.replaceChildren(...[['free', 'Free-text reply'], ['bad', 'JSON, wrong value'], ['good', 'Valid JSON']].map(([k, t]) => h(`button.seg${mode === k ? '.active' : ''}`, { onclick: () => { mode = k; render(); } }, t)));
    raw.textContent = outputs[mode];
    const errs = validate(outputs[mode]);
    verdict.replaceChildren(errs.length
      ? h('div.fb.fb-bad', h('p.fb-head.bad', icon('x', 18), 'Rejected by schema validation'), h('ul', errs.map((e) => h('li', e))), h('p.small', 'Fix: re-prompt with the validation error, or use the provider’s structured-output / JSON-schema mode, then validate again.'))
      : h('div.fb.fb-ok', h('p.fb-head.ok', icon('check', 18), 'Valid — safe to pass to your code'), h('p.small', 'Every required field is present and "priority" is an allowed value.')));
  };
  render();
  return frame('structuredOutput', 'Structured output vs. free text', caption,
    h('div.split', h('div', h('h4', 'Schema'), h('pre.code-block.small', h('code', '{\n  "name": string,\n  "email": string,\n  "priority": "low" | "medium" | "high"\n}\nrequired: name, email, priority'))),
      h('div', h('h4', 'Model output'), tabs, raw, verdict)));
}

// ---------------------------------------------------------------- evalCheck
function evalCheck(caption) {
  const sources = [
    { id: 'S1', text: 'The Model X kettle has a 1.7 litre capacity and boils water in about 4 minutes.' },
    { id: 'S2', text: 'The kettle includes automatic shut-off and a two-year warranty.' },
  ];
  const claims = [
    { text: 'The kettle holds 1.7 litres.', src: 'S1' },
    { text: 'It boils water in about four minutes.', src: 'S1' },
    { text: 'It has a five-year warranty.', src: null, why: 'Source S2 says two years — contradicted.' },
    { text: 'It has automatic shut-off.', src: 'S2' },
    { text: 'It is the best-selling kettle in Europe.', src: null, why: 'No source mentions sales — unsupported.' },
  ];
  let checked = false;
  const list = h('ol.claims');
  const score = h('div.eval-score', { 'aria-live': 'polite' });
  const render = () => {
    list.replaceChildren(...claims.map((c) => h(`li.claim${checked ? (c.src ? '.ok' : '.bad') : ''}`,
      h('span', c.text),
      checked ? h('span.claim-tag', c.src ? [icon('check', 14), `Supported by ${c.src}`] : [icon('x', 14), c.why]) : null)));
    const sup = claims.filter((c) => c.src).length;
    score.replaceChildren(checked ? h('p', h('strong', `Groundedness: ${sup}/${claims.length} claims supported (${pct(sup / claims.length)})`), ' — two claims would be flagged as possible hallucinations.') : h('p.muted', 'Press "Check against sources" to grade each claim.'));
  };
  render();
  return frame('evalCheck', 'Hallucination check: claims vs. sources', caption,
    h('div.split', h('div', h('h4', 'Retrieved sources'), sources.map((x) => h('p.source', h('strong.mono', x.id), ' ', x.text))),
      h('div', h('h4', 'Model answer, split into claims'), list)),
    h('div.vis-actions', h('button.btn.btn-small', { onclick: () => { checked = !checked; render(); } }, icon('search', 16), 'Check against sources')), score);
}

// ---------------------------------------------------------------- streaming
function streaming(caption) {
  const answer = 'Streaming sends the response in small chunks as soon as each is generated, so users start reading almost immediately instead of staring at a spinner until the whole answer is ready.'.split(/(?<= )/);
  const left = h('div.stream-box'), right = h('div.stream-box');
  const lm = h('p.small.mono'), rm = h('p.small.mono');
  let timers = [];
  const run = () => {
    timers.forEach(clearTimeout); timers = [];
    left.textContent = ''; right.replaceChildren(h('span.spinner', { 'aria-label': 'waiting' }));
    const ttft = 350, per = reducedMotion() ? 20 : 70, total = ttft + per * answer.length;
    lm.textContent = 'waiting…'; rm.textContent = 'waiting…';
    answer.forEach((tok, i) => timers.push(setTimeout(() => { left.textContent += tok; if (i === 0) lm.textContent = `first token: ${ttft} ms`; if (i === answer.length - 1) lm.textContent = `first token: ${ttft} ms · done: ${(total / 1000).toFixed(1)} s`; }, ttft + per * i)));
    timers.push(setTimeout(() => { right.textContent = answer.join(''); rm.textContent = `first text: ${(total / 1000).toFixed(1)} s · done: ${(total / 1000).toFixed(1)} s`; }, total));
  };
  return frame('streaming', 'Streaming vs. waiting for the full response', caption,
    h('div.vis-actions', h('button.btn.btn-small', { onclick: run }, icon('play', 16), 'Send the same request to both')),
    h('div.split', h('div', h('h4', 'Streaming'), left, lm), h('div', h('h4', 'Non-streaming'), right, rm)),
    h('p.small.muted', 'Total generation time is the same; streaming improves perceived latency (time to first token). Simulated timings.'));
}

// ---------------------------------------------------------------- sortGame (shared mini-game)
// Sort each item into a bucket. Combo counter for consecutive right answers; winning awards XP once.
function sortGame(key, title, buckets, items, winAt) {
  let order = [], i = 0, score = 0, combo = 0, bestCombo = 0, answered = false;
  const card = h('div.sg-card', { 'aria-live': 'polite' });
  const hud = h('div.sg-hud');
  const btns = h('div.sg-buckets');
  const feedback = h('div.sg-feedback', { 'aria-live': 'polite' });
  const start = () => {
    order = items.map((x) => ({ x, r: Math.random() })).sort((a, b) => a.r - b.r).map((o) => o.x);
    i = 0; score = 0; combo = 0; bestCombo = 0; answered = false; show();
  };
  const renderHud = () => hud.replaceChildren(
    h('span.sg-stat', icon('target', 14), `${Math.min(i + 1, order.length)}/${order.length}`),
    h('span.sg-stat', icon('star', 14), `${score} pts`),
    h(`span.sg-stat.sg-combo${combo >= 2 ? '.hot' : ''}`, icon('bolt', 14), `Combo ×${combo}`),
    h('span.sg-track', order.map((_, k) => h(`i${k < i ? '.done' : k === i ? '.now' : ''}`))));
  const show = () => {
    renderHud();
    feedback.replaceChildren();
    if (i >= order.length) {
      const won = score >= winAt;
      const fresh = won && arcadeWin(key, 'game', `Mini-game won: ${title}`);
      card.replaceChildren(h('div.sg-end',
        h('div.sg-trophy', icon(won ? 'trophy' : 'rotate', 30)),
        h('strong', won ? 'You win!' : 'So close!'),
        h('p', `${score} of ${order.length} correct · best combo ×${bestCombo}`),
        h('p.small.muted', won ? (fresh ? 'Mini-game XP added to your total.' : 'Already won before. Replay any time to practise.') : `Get ${winAt} or more right to win XP.`)));
      btns.replaceChildren(h('button.btn.btn-small.clickable', { type: 'button', onclick: start }, icon('rotate', 16), 'Play again'));
      return;
    }
    answered = false;
    const it = order[i];
    card.replaceChildren(h('span.sg-label', 'Where does it go?'), h('p.sg-item', it.text));
    btns.replaceChildren(...buckets.map((b, bi) => h(`button.sg-bucket.b${bi}.clickable`, { type: 'button', onclick: () => pick(bi) }, h('span.sg-ic', icon(b.icon, 18)), b.name)));
  };
  const pick = (bi) => {
    if (answered) return;
    answered = true;
    const it = order[i];
    const ok = bi === it.answer;
    if (ok) { score++; combo++; bestCombo = Math.max(bestCombo, combo); } else combo = 0;
    btns.querySelectorAll('.sg-bucket').forEach((b, k) => { b.disabled = true; b.classList.toggle('is-correct', k === it.answer); b.classList.toggle('is-wrong', !ok && k === bi); });
    card.classList.remove('pop-good', 'pop-bad'); void card.offsetWidth; card.classList.add(ok ? 'pop-good' : 'pop-bad');
    renderHud();
    feedback.replaceChildren(h(`p.${ok ? 'good' : 'bad'}`, h('strong', ok ? (combo >= 3 ? `Combo ×${combo}! ` : 'Correct! ') : `Not quite — it's ${buckets[it.answer].name}. `), it.why),
      h('button.btn.btn-small.btn-primary.clickable', { type: 'button', onclick: () => { i++; show(); } }, i + 1 >= order.length ? 'See score' : 'Next', icon('arrow', 16)));
    feedback.querySelector('button').focus();
  };
  start();
  return h('div.sort-game', h('div.sg-head', h('span.visual-kicker', icon('star', 14), 'Mini-game'), h('strong', title)), hud, card, btns, feedback);
}

// ---------------------------------------------------------------- aiFamily
const FAMILY = [
  { id: 'ai', name: 'Artificial intelligence', r: 112, text: 'Any computer system doing a task that normally needs human smarts — by rules or by learning.', ex: ['Chess computers', 'Sat-nav route finding', 'Game characters'] },
  { id: 'ml', name: 'Machine learning', r: 84, text: 'AI that learns patterns from examples instead of hand-written rules. Mostly predicts or sorts.', ex: ['Spam filters', 'Netflix suggestions', 'Fraud alerts'] },
  { id: 'dl', name: 'Deep learning', r: 57, text: 'ML with many-layered neural networks. Great at photos, speech and language.', ex: ['Face unlock', 'Voice assistants', 'Photo search'] },
  { id: 'gen', name: 'Generative AI', r: 31, text: 'Deep learning that creates brand-new content: text, images, music, code.', ex: ['ChatGPT & Claude', 'Image generators', 'AI code helpers'] },
];
function aiFamily(caption) {
  let sel = 'gen';
  const info = h('div.fam-info', { 'aria-live': 'polite' });
  const svg = s('svg', { viewBox: '0 0 300 236', class: 'fam-svg', role: 'group', 'aria-label': 'Nested circles: AI contains machine learning, which contains deep learning, which contains generative AI' });
  const rings = FAMILY.map((f, k) => {
    const cy = 230 - f.r;
    const g = s('g', { class: `fam-ring fr-${k} clickable`, tabindex: 0, role: 'button', 'aria-label': f.name },
      s('circle', { cx: 150, cy, r: f.r }),
      s('text', { x: 150, y: f.id === 'gen' ? cy + 4 : cy - f.r + 17, 'text-anchor': 'middle' }, f.id === 'ai' ? 'AI' : f.id === 'ml' ? 'Machine learning' : f.id === 'dl' ? 'Deep learning' : 'GenAI'));
    const choose = (e) => { e.stopPropagation(); sel = f.id; render(); };
    g.addEventListener('click', choose);
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(e); } });
    svg.append(g);
    return g;
  });
  const render = () => {
    const f = FAMILY.find((x) => x.id === sel);
    rings.forEach((g, k) => g.classList.toggle('is-sel', FAMILY[k].id === sel));
    info.replaceChildren(h('span.fam-tag', `Ring ${FAMILY.indexOf(f) + 1} of 4`), h('h4', f.name), h('p', f.text), h('div.fam-ex', f.ex.map((x) => h('span.chip.static', x))));
  };
  render();
  const game = sortGame('aiFamily', 'Sort the apps', [
    { name: 'Rule-based AI', icon: 'settings' }, { name: 'Machine learning', icon: 'chart' }, { name: 'Generative AI', icon: 'spark' },
  ], [
    { text: 'A thermostat switches the heating on below 18°C', answer: 0, why: 'A fixed rule written by a person — nothing is learned.' },
    { text: 'Your bank flags an unusual card payment', answer: 1, why: 'It learned what “normal” spending looks like and predicts fraud.' },
    { text: 'Netflix suggests your next show', answer: 1, why: 'It predicts what you will like from viewing patterns.' },
    { text: 'An app writes a birthday poem for your mum', answer: 2, why: 'It creates brand-new text — generative AI.' },
    { text: 'A tool turns “a cat astronaut” into a picture', answer: 2, why: 'It generates a new image from a description.' },
    { text: 'A 1990s chess program using hand-coded strategies', answer: 0, why: 'Clever, but every strategy was written by people as rules.' },
    { text: 'Your phone unlocks by recognising your face', answer: 1, why: 'Deep learning (a kind of ML) recognises — it does not create.' },
  ], 6);
  return frame('aiFamily', 'The AI family tree', caption, h('div.fam-wrap', svg, info), game);
}

// ---------------------------------------------------------------- aiCompare
const AC_KINDS = [
  { id: 'pred', name: 'Predictive AI', verb: 'Predicts', icon: 'chart' },
  { id: 'gen', name: 'Generative AI', verb: 'Creates', icon: 'spark' },
  { id: 'agent', name: 'Agentic AI', verb: 'Acts', icon: 'wrench' },
];
const AC_TASKS = [
  {
    name: 'Sort out dinner on Friday',
    out: { pred: 'Ranks restaurants for you: Luigi’s 92% match · Sakura 81% · Taco Hut 64%', gen: 'Writes: “Hey all! Fancy Italian at Luigi’s this Friday at 7? 🍝”', agent: 'Checks calendars → books Luigi’s at 19:00 → sends the invites' },
    trace: [
      ['goal', 'Goal: dinner for 4 people on Friday'],
      ['think', 'Think: first I need a time when everyone is free'],
      ['act', 'Act: calendar.find_free_time("Friday")'],
      ['observe', 'Observe: everyone is free at 19:00'],
      ['think', 'Think: find an Italian place with a table for 4 at 19:00'],
      ['act', 'Act: restaurants.search("italian", 4, "19:00")'],
      ['observe', 'Observe: Luigi’s has a table — needs a €10 deposit'],
      ['think', 'Think: that spends money, so ask the human first'],
      ['act', 'Act: ask_human("Book Luigi’s for a €10 deposit?") → “Yes”'],
      ['done', 'Done: table booked and 3 invites sent ✅'],
    ],
  },
  {
    name: 'Handle a refund email',
    out: { pred: 'Labels it: “Refund request” · 94% confident · priority High', gen: 'Drafts a reply: “So sorry your mug arrived broken! …”', agent: 'Finds the order → checks the policy → issues the refund → replies' },
    trace: [
      ['goal', 'Goal: resolve this customer’s refund email'],
      ['think', 'Think: which order is this about?'],
      ['act', 'Act: orders.lookup(email="sam@example.com")'],
      ['observe', 'Observe: order #4411, mug, delivered 3 days ago'],
      ['think', 'Think: is it inside the 30-day refund policy?'],
      ['act', 'Act: policy.check("refund", days=3)'],
      ['observe', 'Observe: eligible, under the €50 auto-approve limit'],
      ['act', 'Act: payments.refund(order=4411)'],
      ['done', 'Done: refund issued and a friendly reply sent ✅'],
    ],
  },
];
const LOOP_NODES = { goal: [50, 95, 'Goal'], think: [160, 32, 'Think'], act: [262, 95, 'Act'], observe: [160, 158, 'Observe'], done: [262, 175, 'Done'] };
function aiCompare(caption) {
  let task = AC_TASKS[0], step = -1;
  const sel = h('select', { 'aria-label': 'Choose a task' }, AC_TASKS.map((t, i) => h('option', { value: i }, t.name)));
  const cards = h('div.ac-cards');
  const log = h('ol.ac-log', { 'aria-live': 'polite' });
  const svg = s('svg', { viewBox: '0 0 310 200', class: 'loop-svg', 'aria-hidden': 'true' });
  const arrow = (x1, y1, x2, y2) => s('line', { x1, y1, x2, y2, class: 'loop-edge', 'marker-end': 'url(#loopArrow)' });
  svg.append(
    s('defs', {}, s('marker', { id: 'loopArrow', viewBox: '0 0 10 10', refX: 8, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' }, s('path', { d: 'M0 0L10 5L0 10z', class: 'loop-head' }))),
    arrow(84, 86, 126, 46), arrow(196, 42, 236, 80), arrow(240, 112, 196, 150), arrow(126, 150, 150, 58), arrow(262, 117, 262, 152));
  const nodeEls = {};
  for (const [k, [x, y, label]] of Object.entries(LOOP_NODES)) {
    nodeEls[k] = s('g', { class: `loop-node ln-${k}` }, s('circle', { cx: x, cy: y, r: k === 'done' ? 20 : 28 }), s('text', { x, y: y + 4, 'text-anchor': 'middle' }, label));
    svg.append(nodeEls[k]);
  }
  const nextBtn = h('button.btn.btn-small.btn-primary', { type: 'button', onclick: () => { if (step < task.trace.length - 1) { step++; render(); } } }, icon('play', 16), 'Next step');
  const resetBtn = h('button.btn.btn-small.btn-ghost', { type: 'button', onclick: () => { step = -1; render(); } }, icon('reset', 16), 'Restart');
  const render = () => {
    cards.replaceChildren(...AC_KINDS.map((k) => h(`div.ac-card.ac-${k.id}`, h('div.ac-top', h('span.ac-ic', icon(k.icon, 18)), h('div', h('strong', k.name), h('span.small', k.verb))), h('p', task.out[k.id]))));
    const cur = task.trace[step];
    Object.entries(nodeEls).forEach(([k, el]) => el.classList.toggle('is-on', cur?.[0] === k));
    log.replaceChildren(...task.trace.slice(0, step + 1).map(([k, t], i) => h(`li.lg-${k}${i === step ? '.now' : ''}`, t)));
    if (step < 0) log.replaceChildren(h('li.muted', 'Press “Next step” to run the agent.'));
    nextBtn.disabled = step >= task.trace.length - 1;
    if (step === task.trace.length - 1) arcadeWin('aiCompare', 'game', 'Mini-game won: ran an agent loop');
    log.lastElementChild?.scrollIntoView?.({ block: 'nearest' });
  };
  sel.addEventListener('change', () => { task = AC_TASKS[sel.value]; step = -1; render(); });
  render();
  const game = sortGame('aiCompareSort', 'Predict, create or act?', [
    { name: 'Predictive AI', icon: 'chart' }, { name: 'Generative AI', icon: 'spark' }, { name: 'Agentic AI', icon: 'wrench' },
  ], [
    { text: 'Writes a cover letter when you ask for one', answer: 1, why: 'It creates text and stops — generative.' },
    { text: 'Finds 5 jobs, tailors your CV for each and submits the applications', answer: 2, why: 'Several steps, using tools, towards a goal — agentic.' },
    { text: 'Predicts whether a customer will cancel their subscription', answer: 0, why: 'It outputs a prediction (a score), nothing new is created.' },
    { text: 'Draws a logo from a short description', answer: 1, why: 'A new image is generated — generative.' },
    { text: 'Every Friday reads your inbox, saves receipts to a spreadsheet and emails you a summary', answer: 2, why: 'It acts on its own with tools (inbox, spreadsheet, email) — agentic.' },
    { text: 'Scores how risky a loan application is', answer: 0, why: 'A risk score is a prediction — predictive AI.' },
    { text: 'Books a meeting after checking everyone’s calendar', answer: 2, why: 'It takes actions with a calendar tool — agentic.' },
  ], 6);
  return frame('aiCompare', 'Predict vs create vs act', caption,
    h('div.vis-controls', h('label', 'Task ', sel)),
    cards,
    h('div.ac-loop', h('div.ac-loop-art', h('span.small.muted', 'The agent loop'), svg), h('div.ac-loop-run', log, h('div.vis-actions', nextBtn, resetBtn))),
    game);
}

const REGISTRY = { promptFlow, tokens, trainInfer, gradient, nnLayers, attention, embeddings, vectorSearch, ragPipeline, toolCalling, structuredOutput, evalCheck, streaming, aiFamily, aiCompare };

export function renderVisual(key, caption) {
  const fn = REGISTRY[key];
  return fn ? fn(caption) : null;
}
export const VISUAL_KEYS = Object.keys(REGISTRY);
