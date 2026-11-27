// Right-hand column on lesson pages: lesson quest (stars), level progress / up next, badges to chase,
// today's quests and a study tip. Everything is derived from saved state and refreshes live.
import { h, icon, progressBar } from '../ui.js';
import * as P from '../progression.js';
import { getState, subscribe } from '../store.js';
import { XP } from '../data/rewards.js';

const QUEST_ICON = { lessons: 'book', practice: 'target', runs: 'code', mentor: 'chat', reviews: 'rotate', visuals: 'eye', cards: 'layers' };
const STAR_INFO = { cards: ['layers', `+${XP.cards} XP`], perfect: ['target', `+${XP.practicePerfect} XP`], done: ['check', `+${XP.lesson} XP`] };
const TIPS = [
  ['bulb', 'Say it out loud', 'Explaining a term in your own words before flipping a card doubles what you remember.'],
  ['clock', 'Short beats long', 'Two 15-minute sessions stick better than one hour. Your streak forgives one missed day.'],
  ['rotate', 'Come back tomorrow', 'Revisiting a finished lesson the next day is the fastest way to lock it in — and it counts for a quest.'],
  ['chat', 'Use the mentor', 'Stuck on a word? Ask the mentor for an analogy, then say “quiz me” to check yourself.'],
  ['target', 'Mistakes are free', 'Practice questions never affect unlocking. Guess, read the explanation, try again.'],
  ['eye', 'Play before you read', 'Poke the visual first. Your brain asks better questions when you read the story after.'],
];
const hash = (s) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function card(cls, ic, title, ...kids) {
  return h(`section.side-card.${cls}`, h('h3.side-title', h('span.side-ic', icon(ic, 16)), title), ...kids);
}

export function lessonSide(m, level) {
  const wrap = h('div.side-stack');
  const tip = TIPS[hash(m.id) % TIPS.length];

  const render = () => {
    const s = getState();
    const stars = P.lessonStars(s, m.id);
    const done = P.missionsDone(s, level);
    const next = level.missions.find((x) => !P.isMissionComplete(s, x.id) && x.id !== m.id);
    const pct = P.levelProgressPct(s, level);
    const chase = P.badgeProgress(s).filter((b) => !b.earned).sort((a, b) => b.pct - a.pct).slice(0, 2);
    const quests = P.todaysQuests(s);

    wrap.replaceChildren(
      card('side-quest', 'star', `Lesson quest · ${stars.stars}/3`,
        h('ul.quest-list', stars.parts.map((p) => {
          const [ic, reward] = STAR_INFO[p.key];
          return h(`li${p.got ? '.got' : ''}`, h('span.q-ic', icon(p.got ? 'check' : ic, 15)), h('span.q-text', p.label), h('span.q-xp', p.got ? icon('star', 14) : reward));
        }))),
      card('side-level', 'flag', `Level ${level.num} · ${level.region}`,
        h('div.ring-row',
          h('div.ring', { style: { '--p': pct }, role: 'img', 'aria-label': `${pct}% of level cleared` }, h('span', `${pct}%`)),
          h('div', h('strong', `${done}/${level.missions.length} lessons`), h('span.small.muted', P.testPassed(s, level.id) ? 'Level test passed' : 'Then pass the level test'))),
        next ? h('a.next-link', { href: `#/lesson/${next.id}` }, h('span.small.muted', 'Up next'), h('strong', next.title), icon('arrow', 16))
          : P.testAvailable(s, level) && !P.testPassed(s, level.id) ? h('a.next-link.test', { href: `#/test/${level.id}` }, h('span.small.muted', 'Ready'), h('strong', level.test.title), icon('arrow', 16)) : null),
      chase.length ? card('side-badges', 'trophy', 'Badges to chase',
        h('ul.chase-list', chase.map((b) => h('li',
          h('span.chase-ic', icon(b.badge.icon, 18)),
          h('div.chase-body', h('strong', b.badge.name), h('span.small.muted', b.hint), progressBar(b.pct, { label: `${b.badge.name} progress`, cls: 'thin' })))))) : null,
      card('side-daily', 'bolt', 'Today’s quests',
        h('ul.daily-list', quests.map((q) => h(`li${q.done ? '.got' : ''}`,
          h('span.q-ic', icon(q.done ? 'check' : QUEST_ICON[q.metric] || 'target', 15)),
          h('div', h('span.q-text', q.text), progressBar(Math.round((q.progress / q.target) * 100), { label: q.text, cls: 'thin' })),
          h('span.q-xp', q.done ? icon('star', 14) : `+${XP.quest}`))))),
      card('side-tip', tip[0], tip[1], h('p.small', tip[2])));
  };
  render();
  const off = subscribe(() => { if (!wrap.isConnected) { off(); return; } render(); });
  return wrap;
}
