// Visual-first lesson building blocks: concept map, flashcard deck, story slides and the in-lesson mentor coach.
// They work for every mission from its existing data (terms, sections, goal); optional `keyIdea` / `analogy`
// fields make them richer (see docs/CONTENT_SCHEMA.md).
import { h, icon, mdEl, md } from '../ui.js';
import { arcadeWin, visualUsed } from '../store.js';
import { openMentor } from '../views/mentorPanel.js';

const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => { const el = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v); return el; };
const shortTitle = (t) => t.replace(/\s*[:(].*$/, '').replace(/^What is AI\? /, '');

export const keyIdeaOf = (m) => m.keyIdea || m.goal;

/** Big-idea banner shown first in every lesson. */
export function keyIdeaCard(m) {
  return h('div.big-idea', h('span.big-idea-ic', icon('bulb', 22)), h('div', h('span.big-idea-k', 'The big idea'), h('div.big-idea-t', { html: md(keyIdeaOf(m)).replace(/<\/?p>/g, '') })));
}

/** Radial concept map: the lesson in the middle, its key terms around it. Tap a node to see its meaning. */
export function conceptMap(m) {
  const terms = (m.terms || []).slice(0, 6);
  if (terms.length < 2) return null;
  const detail = h('div.cmap-detail', { 'aria-live': 'polite' });
  const lines = svgEl('svg', { viewBox: '0 0 100 100', preserveAspectRatio: 'none', class: 'cmap-lines', 'aria-hidden': 'true' });
  const stage = h('div.cmap-stage', lines, h('div.cmap-center', shortTitle(m.title)));
  const nodes = terms.map((t, i) => {
    const a = -Math.PI / 2 + (i / terms.length) * Math.PI * 2;
    const x = 50 + Math.cos(a) * 36, y = 50 + Math.sin(a) * 38;
    lines.append(svgEl('line', { x1: 50, y1: 50, x2: x, y2: y }));
    const b = h(`button.cmap-node.cn-${i % 5}`, { type: 'button', style: { left: `${x}%`, top: `${y}%` }, onclick: () => select(i) }, t.term);
    stage.append(b);
    return b;
  });
  const select = (i) => {
    const t = terms[i];
    nodes.forEach((n, k) => n.classList.toggle('is-sel', k === i));
    detail.replaceChildren(h('strong', t.term), h('p', t.def),
      h('button.link-btn', { type: 'button', onclick: () => openMentor(`What is ${t.term}? Explain it simply with an everyday example.`) }, icon('chat', 14), 'Ask the mentor for an example'));
    visualUsed('conceptMap');
  };
  detail.replaceChildren(h('p.muted.small', icon('eye', 14), ' Tap a bubble to see what it means.'));
  return h('section.cmap', { 'aria-label': 'Concept map' }, h('header.visual-head', h('span.visual-kicker', icon('map', 16), 'Concept map'), h('h3', 'How the ideas connect')), stage, detail);
}

/** Flip-card deck from the mission's terms. Mark each card "Got it" to master the deck (XP once per lesson). */
export function flashDeck(m, { onMastered } = {}) {
  const terms = m.terms || [];
  if (!terms.length) return null;
  let queue, known, combo, flipped, listMode = false;
  const body = h('div.deck-body');
  const hud = h('div.deck-hud');
  const reset = () => { queue = terms.map((_, i) => i).sort(() => Math.random() - 0.5); known = new Set(); combo = 0; flipped = false; render(); };

  const renderHud = () => hud.replaceChildren(
    h('div.deck-meter', h('span.deck-meter-fill', { style: { width: `${(known.size / terms.length) * 100}%` } })),
    h('span.sg-stat', icon('check', 14), `${known.size}/${terms.length} mastered`),
    h(`span.sg-stat.sg-combo${combo >= 2 ? '.hot' : ''}`, icon('bolt', 14), `Combo ×${combo}`));

  const render = () => {
    renderHud();
    if (listMode) {
      body.replaceChildren(h('dl.deck-list', terms.map((t) => [h('dt', t.term), h('dd', t.def)])));
      return;
    }
    if (!queue.length) {
      const fresh = arcadeWin(m.id, 'cards', `Flashcards mastered: ${m.title}`);
      onMastered?.();
      body.replaceChildren(h('div.deck-done',
        h('div.sg-trophy', icon('trophy', 30)), h('strong', 'Deck mastered!'),
        h('p.small.muted', fresh ? 'Star earned and XP added.' : 'You already mastered this deck — nice refresher.'),
        h('button.btn.btn-small', { type: 'button', onclick: reset }, icon('rotate', 16), 'Shuffle and play again')));
      return;
    }
    const t = terms[queue[0]];
    const card = h(`button.flash-card${flipped ? '.is-flipped' : ''}`, { type: 'button', 'aria-pressed': String(flipped), 'aria-label': flipped ? `${t.term}: ${t.def}` : `${t.term}. Tap to reveal the meaning.`, onclick: () => { flipped = !flipped; visualUsed('flashcards'); render(); } },
      h('span.flash-inner',
        h('span.flash-face.flash-front', h('span.flash-k', `Card ${known.size + 1} of ${terms.length}`), h('span.flash-term', t.term), h('span.flash-hint', icon('rotate', 14), 'Tap to flip')),
        h('span.flash-face.flash-back', h('span.flash-k', t.term), h('span.flash-def', t.def))));
    const actions = flipped
      ? h('div.deck-actions',
        h('button.btn.btn-small.btn-ghost', { type: 'button', onclick: () => { queue.push(queue.shift()); combo = 0; flipped = false; render(); } }, icon('reset', 16), 'Still learning'),
        h('button.btn.btn-small.btn-primary', { type: 'button', onclick: () => { known.add(queue.shift()); combo++; flipped = false; render(); } }, icon('check', 16), 'Got it'))
      : h('div.deck-actions', h('p.small.muted', 'Say the meaning out loud, then flip to check.'));
    body.replaceChildren(h('div.flash-stack', queue.length > 1 ? h('span.flash-shadow') : null, card), actions,
      h('button.link-btn', { type: 'button', onclick: () => openMentor(`What is ${t.term}? Explain it simply with an everyday example.`) }, icon('chat', 14), `Ask the mentor about “${t.term}”`));
  };
  const toggle = h('button.btn.btn-small.btn-ghost', { type: 'button', onclick: () => { listMode = !listMode; toggle.lastChild.textContent = listMode ? 'Play cards' : 'List view'; render(); } }, icon('book', 16), h('span', 'List view'));
  reset();
  return h('section.deck', { 'aria-label': 'Flashcards' }, h('div.deck-head', h('div', h('span.visual-kicker', icon('layers', 16), 'Flashcards'), h('h3', 'Flip, recall, master')), toggle), hud, body);
}

/** Lesson text as bite-sized slides, with a "read it all" docs mode. */
export function storySlides(m, { onFinish } = {}) {
  const secs = m.sections || [];
  let i = 0, all = false;
  const body = h('div.story-body', { 'aria-live': 'polite' });
  const dots = h('div.story-dots');
  const prev = h('button.btn.btn-small.btn-ghost', { type: 'button', onclick: () => { if (i > 0) { i--; render(); } } }, icon('back', 16), 'Back');
  const next = h('button.btn.btn-small.btn-primary', { type: 'button', onclick: () => { if (i < secs.length - 1) { i++; render(); } else onFinish?.(); } });
  const nav = h('div.story-nav', prev, dots, next);
  const askBtn = (sec) => h('button.link-btn', { type: 'button', onclick: () => openMentor(`I'm confused about "${sec.h}" in the lesson "${m.title}". Explain it more simply.`) }, icon('chat', 14), 'Confused? Ask the mentor');
  const render = () => {
    if (all) {
      nav.hidden = true;
      body.replaceChildren(...secs.map((sec, k) => h('section.lesson-section', h('h3', h('span.sec-n', k + 1), sec.h), mdEl(sec.body))));
      return;
    }
    nav.hidden = false;
    const sec = secs[i];
    body.replaceChildren(h('article.story-slide', h('span.story-k', `Part ${i + 1} of ${secs.length}`), h('h3', sec.h), mdEl(sec.body), askBtn(sec)));
    dots.replaceChildren(...secs.map((_, k) => h(`button.story-dot${k === i ? '.on' : k < i ? '.seen' : ''}`, { type: 'button', 'aria-label': `Go to part ${k + 1}`, onclick: () => { i = k; render(); } })));
    prev.disabled = i === 0;
    next.replaceChildren(...(i < secs.length - 1 ? ['Next', icon('arrow', 16)] : ['Quiz time', icon('arrow', 16)]));
  };
  const modeBtn = h('button.btn.btn-small.btn-ghost', { type: 'button', onclick: () => { all = !all; modeBtn.lastChild.textContent = all ? 'Slides' : 'Read it all'; render(); } }, icon('book', 16), h('span', 'Read it all'));
  render();
  return h('section.story', { 'aria-label': 'Lesson story' }, h('div.deck-head', h('div', h('span.visual-kicker', icon('book', 16), 'Story mode'), h('h3', 'Learn it in bite-size parts')), modeBtn), body, nav);
}

/** Mentor coach attached to the lesson: analogy bubble + one-tap lesson-aware prompts. */
export function mentorCoach(m) {
  const take = m.analogy || `In short: ${m.goal}`;
  const ask = (text) => () => openMentor(text);
  return h('section.coach', { 'aria-label': 'Your mentor for this lesson' },
    h('div.coach-head', h('div.mentor-avatar', icon('compass', 20)), h('div', h('strong', 'Your mentor'), h('span.small.muted', 'Stuck? I know this lesson.'))),
    h('div.coach-bubble', h('span.coach-k', m.analogy ? 'Mentor’s analogy' : 'Mentor’s take'), h('p', take)),
    h('div.coach-actions',
      h('button.chip', { type: 'button', onclick: ask(`Explain this lesson simply`) }, icon('bulb', 14), 'Explain simply'),
      h('button.chip', { type: 'button', onclick: ask(`Give me an analogy for this lesson`) }, icon('spark', 14), 'Analogy'),
      h('button.chip', { type: 'button', onclick: ask(`Quiz me on this lesson`) }, icon('target', 14), 'Quiz me'),
      h('button.chip', { type: 'button', onclick: ask(`Show me a real-world example from this lesson`) }, icon('eye', 14), 'Real example')));
}

/** Three-star HUD for a lesson. `parts` comes from progression.lessonStars(). */
export function starRow({ stars, parts }, { large = false } = {}) {
  return h(`div.star-row${large ? '.large' : ''}`, { title: parts.map((p) => `${p.got ? '★' : '☆'} ${p.label}`).join('\n'), 'aria-label': `${stars} of 3 stars` },
    parts.map((p) => h(`span.star${p.got ? '.got' : ''}`, icon('star', large ? 22 : 16))));
}
