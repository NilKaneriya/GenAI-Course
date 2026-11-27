// Reward animations: flying "+XP", count-up numbers, and full-screen badge / rank / unlock celebrations.
import { h, icon, confetti, reducedMotion } from '../ui.js';

// ---------------------------------------------------------------- XP
/** A "+N XP" pill that pops up mid-screen and flies into the XP chip in the top bar. */
export function xpBurst(total, reason) {
  const chip = document.querySelector('.chip-xp');
  const pill = h('div.xp-fly', { 'aria-hidden': 'true' }, icon('bolt', 18), `+${total} XP`, reason ? h('small', reason) : null);
  document.body.append(pill);
  if (reducedMotion() || !chip) { setTimeout(() => pill.remove(), 1400); return; }
  const r = chip.getBoundingClientRect();
  const p = pill.getBoundingClientRect();
  const dx = r.left + r.width / 2 - (p.left + p.width / 2);
  const dy = r.top + r.height / 2 - (p.top + p.height / 2);
  pill.animate([
    { transform: 'translate(-50%, 20px) scale(.6)', opacity: 0 },
    { transform: 'translate(-50%, 0) scale(1.1)', opacity: 1, offset: 0.18 },
    { transform: 'translate(-50%, 0) scale(1)', opacity: 1, offset: 0.55 },
    { transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(.35)`, opacity: 0.2 },
  ], { duration: 1500, easing: 'cubic-bezier(.4,0,.2,1)' }).onfinish = () => {
    pill.remove();
    chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump');
  };
}

/** Animate a number element from one value to another. */
export function countUp(el, from, to, ms = 900) {
  if (!el || from === to || reducedMotion()) { if (el) el.textContent = to.toLocaleString(); return; }
  const t0 = performance.now();
  const step = (t) => {
    const k = Math.min(1, (t - t0) / ms);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = Math.round(from + (to - from) * e).toLocaleString();
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------------------------------------------------------------- big celebrations (queued)
const queue = [];
let showing = false;

/** kind: 'badge' | 'rank' | 'unlock'. Shows one overlay at a time. */
export function celebrateBig(item) {
  queue.push(item);
  if (!showing) next();
}

function next() {
  const item = queue.shift();
  if (!item) { showing = false; return; }
  showing = true;
  const prevFocus = document.activeElement;
  const close = (after) => {
    overlay.classList.add('leaving');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { overlay.remove(); prevFocus?.focus?.(); after?.(); next(); }, 260);
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  const kicker = { badge: 'Badge unlocked!', rank: 'Rank up!', unlock: 'New region unlocked!' }[item.kind];
  const rays = h('div.cel-rays');
  const sparkles = h('div.cel-sparkles', Array.from({ length: 12 }, (_, i) => h('i', { style: { '--a': `${i * 30}deg`, '--d': `${0.2 + (i % 4) * 0.12}s` } })));
  const medal = h(`div.cel-medal.cel-${item.kind}`, rays, sparkles, h('div.cel-disc', icon(item.icon, 46)));
  const actions = item.actions?.length ? item.actions : [{ label: item.kind === 'badge' ? 'Awesome!' : 'Let’s go!' }];
  const dialog = h('div.cel-card', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'cel-title' },
    medal,
    h('p.cel-kicker', icon(item.kind === 'rank' ? 'shield' : item.kind === 'unlock' ? 'flag' : 'star', 16), kicker),
    h('h2#cel-title.cel-title', item.title),
    item.text ? h('p.cel-text', item.text) : null,
    item.sub ? h('p.cel-sub', item.sub) : null,
    h('div.cel-actions', actions.map((a, i) => h(`button.btn${i === 0 ? '.btn-primary.btn-lg' : '.btn-ghost'}`, { type: 'button', onclick: () => close(a.onClick) }, a.label))));
  const overlay = h('div.cel-overlay', { onclick: (e) => { if (e.target === overlay) close(); } }, dialog);
  document.body.append(overlay);
  document.addEventListener('keydown', onKey);
  confetti();
  setTimeout(() => dialog.querySelector('button')?.focus(), 60);
}
