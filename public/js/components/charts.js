// Dependency-free charts. Bar charts are HTML (text stays readable at any width);
// line/column charts are SVG redrawn at their real container width, so labels never scale.
// Every chart has a title, axis/value labels and an aria description.
import { h } from '../ui.js';

const NS = 'http://www.w3.org/2000/svg';
function s(tag, attrs = {}, ...kids) {
  const el = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null) el.setAttribute(k, v);
  for (const k of kids.flat()) if (k != null) el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return el;
}
const svgRoot = (w, ht, label) => s('svg', { viewBox: `0 0 ${w} ${ht}`, width: w, height: ht, role: 'img', 'aria-label': label, class: 'chart-svg' }, s('title', {}, label));

export function chartCard(title, subtitle, chart, { empty, footer, wide = false } = {}) {
  return h(`figure.chart-card${wide ? '.wide' : ''}`,
    h('figcaption', h('h3.chart-title', title), subtitle ? h('p.chart-sub', subtitle) : null),
    empty ? h('div.chart-empty', empty) : chart,
    footer ? h('div.chart-foot', footer) : null);
}

/** Wraps an SVG renderer so it redraws at the container's pixel width. */
function responsive(render, { minWidth = 280 } = {}) {
  const box = h('div.chart-box');
  let lastW = 0;
  const draw = () => {
    const w = Math.max(minWidth, Math.floor(box.clientWidth || 0));
    if (!box.clientWidth || w === lastW) return;
    lastW = w;
    box.replaceChildren(render(w));
  };
  const ro = new ResizeObserver(draw);
  ro.observe(box);
  // Fallback first paint (e.g. before layout) so the chart is never blank
  requestAnimationFrame(draw);
  return box;
}

/** Donut for overall completion. */
export function donut(pct, { label = 'Complete', sub = '', size = 180 } = {}) {
  const r = 70, c = 2 * Math.PI * r, cx = size / 2, cy = size / 2;
  const svg = svgRoot(size, size, `${label}: ${pct}%`);
  svg.append(
    s('circle', { cx, cy, r, fill: 'none', stroke: 'var(--track)', 'stroke-width': 18 }),
    s('circle', { cx, cy, r, fill: 'none', stroke: 'var(--primary)', 'stroke-width': 18, 'stroke-linecap': 'round', 'stroke-dasharray': `${(pct / 100) * c} ${c}`, transform: `rotate(-90 ${cx} ${cy})`, class: 'donut-arc' }),
    s('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', class: 'donut-value' }, `${pct}%`),
    s('text', { x: cx, y: cy + 26, 'text-anchor': 'middle', class: 'donut-label' }, sub || label));
  svg.classList.add('donut');
  return svg;
}

/** Horizontal bars (0–100) as HTML. rows: [{label, value, status, note, attempts}] */
export function hBars(rows, { ariaLabel = 'Progress by level', valueSuffix = '%', marker } = {}) {
  return h('div.hbars', { role: 'img', 'aria-label': `${ariaLabel}. ${rows.map((r) => `${r.label}: ${r.value}${valueSuffix}${r.attempts ? ` over ${r.attempts} answers` : ''}`).join('; ')}` },
    rows.map((r) => h(`div.hbar-row${r.status === 'locked' ? '.is-locked' : ''}`, { 'aria-hidden': 'true' },
      h('span.hbar-label', r.label),
      h('span.hbar-track',
        marker != null ? h('span.hbar-marker', { style: { left: `${marker}%` } }) : null,
        h(`span.hbar-fill.bar-${r.status || 'default'}`, { style: { width: `${Math.max(r.value ? 2 : 0, r.value)}%` } })),
      h('span.hbar-value', r.note ?? `${r.value}${valueSuffix}`, r.attempts ? h('small', ` (${r.attempts})`) : null))),
    h('div.hbar-axis', { 'aria-hidden': 'true' }, h('span'), h('span.hbar-ticks', h('span', `0${valueSuffix}`), h('span', `50${valueSuffix}`), h('span', `100${valueSuffix}`)), h('span')));
}

/** Skill accuracy bars with a review threshold marker. rows: [{label, accuracy, attempts}] */
export function skillBars(rows, { reviewBelow = 75 } = {}) {
  return hBars(rows.map((r) => ({ label: r.label, value: r.accuracy, attempts: r.attempts, status: r.accuracy >= 80 ? 'strong' : r.accuracy < reviewBelow ? 'weak' : 'ok' })), { ariaLabel: 'Accuracy by skill', marker: reviewBelow });
}

/** Test scores over time with a pass-threshold line. points: [{date, score, passed, label, short}] */
export function scoreLine(points, { threshold = 80 } = {}) {
  const label = `Test scores over time. Pass mark ${threshold}%. ${points.map((p) => `${p.label} on ${new Date(p.date).toLocaleDateString()}: ${p.score}% ${p.passed ? 'passed' : 'not passed'}`).join('; ')}`;
  return responsive((w) => {
    const ht = 250, pl = 56, pr = 24, pt = 22, pb = 46;
    const iw = w - pl - pr, ih = ht - pt - pb;
    const svg = svgRoot(w, ht, label);
    const y = (v) => pt + ih - (v / 100) * ih;
    const n = points.length;
    const x = (i) => pl + (n === 1 ? iw / 2 : (i / (n - 1)) * iw);
    const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 70))));
    [0, 25, 50, 75, 100].forEach((t) => svg.append(s('line', { x1: pl, x2: w - pr, y1: y(t), y2: y(t), class: 'grid' }), s('text', { x: pl - 8, y: y(t) + 4, 'text-anchor': 'end', class: 'axis' }, `${t}%`)));
    svg.append(s('text', { x: 14, y: pt + ih / 2, transform: `rotate(-90 14 ${pt + ih / 2})`, 'text-anchor': 'middle', class: 'axis-title' }, 'Score'));
    svg.append(s('line', { x1: pl, x2: w - pr, y1: y(threshold), y2: y(threshold), class: 'threshold' }),
      s('text', { x: w - pr, y: y(threshold) - 6, 'text-anchor': 'end', class: 'threshold-label' }, `Pass mark ${threshold}%`));
    if (n > 1) svg.append(s('polyline', { points: points.map((p, i) => `${x(i)},${y(p.score)}`).join(' '), class: 'score-line' }));
    points.forEach((p, i) => {
      svg.append(
        s('circle', { cx: x(i), cy: y(p.score), r: 6, class: `pt ${p.passed ? 'pt-pass' : 'pt-fail'}` }, s('title', {}, `${p.label}: ${p.score}% (${p.passed ? 'passed' : 'not passed'})`)),
        s('text', { x: x(i), y: y(p.score) - 12, 'text-anchor': i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle', class: 'pt-value' }, `${p.score}%`));
      if (i % every === 0 || i === n - 1) {
        const anchor = i === 0 && n > 1 ? 'start' : i === n - 1 && n > 1 ? 'end' : 'middle';
        svg.append(
          s('text', { x: x(i), y: ht - pb + 18, 'text-anchor': anchor, class: 'axis' }, p.short || p.label),
          s('text', { x: x(i), y: ht - pb + 32, 'text-anchor': anchor, class: 'axis axis-sub' }, new Date(p.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })));
      }
    });
    return svg;
  });
}

/** Vertical columns for daily values (XP per day). days: [{day, xp, missions}] */
export function columns(days, { valueKey = 'xp', unit = 'XP' } = {}) {
  const total = days.reduce((t, d) => t + d[valueKey], 0);
  const label = `${unit} earned per day over the last ${days.length} days, ${total} in total. ${days.filter((d) => d[valueKey]).map((d) => `${d.day}: ${d[valueKey]}`).join('; ')}`;
  return responsive((w) => {
    const ht = 220, pl = 46, pr = 12, pt = 24, pb = 34;
    const iw = w - pl - pr, ih = ht - pt - pb;
    const max = Math.max(50, ...days.map((d) => d[valueKey]));
    const step = max > 500 ? 250 : max > 200 ? 100 : 50;
    const nice = Math.ceil(max / step) * step;
    const svg = svgRoot(w, ht, label);
    const slot = iw / days.length;
    const bw = Math.min(36, slot * 0.62);
    const every = Math.max(1, Math.ceil(56 / slot));
    [0, nice / 2, nice].forEach((t) => {
      const yy = pt + ih - (t / nice) * ih;
      svg.append(s('line', { x1: pl, x2: w - pr, y1: yy, y2: yy, class: 'grid' }), s('text', { x: pl - 6, y: yy + 4, 'text-anchor': 'end', class: 'axis' }, t));
    });
    svg.append(s('text', { x: 12, y: pt + ih / 2, transform: `rotate(-90 12 ${pt + ih / 2})`, 'text-anchor': 'middle', class: 'axis-title' }, unit));
    days.forEach((d, i) => {
      const cx = pl + (i + 0.5) * slot;
      const bh = (d[valueKey] / nice) * ih;
      const date = new Date(d.day + 'T12:00:00');
      svg.append(s('rect', { x: cx - bw / 2, y: pt + ih - bh, width: bw, height: Math.max(bh, d[valueKey] ? 2 : 0), rx: 4, class: 'col' }, s('title', {}, `${date.toDateString()}: ${d[valueKey]} ${unit}, ${d.missions} lesson(s) completed`)));
      if (d[valueKey]) svg.append(s('text', { x: cx, y: pt + ih - bh - 6, 'text-anchor': 'middle', class: 'col-value' }, d[valueKey]));
      if ((days.length - 1 - i) % every === 0) svg.append(s('text', { x: cx, y: ht - pb + 18, 'text-anchor': 'middle', class: 'axis' }, date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })));
    });
    return svg;
  });
}

export function legend(items) {
  return h('ul.legend', items.map(([cls, text]) => h('li', h(`span.swatch.${cls}`), text)));
}
