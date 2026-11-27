import { h, icon, md, mdEl, highlight, toast, statusPill } from '../ui.js';
import * as P from '../progression.js';
import { getState, answerPractice, completeMission } from '../store.js';
import { getMission, getLevel, getChallenge, SKILLS } from '../data/curriculum.js';
import { questionCard } from '../components/question.js';
import { renderVisual } from '../components/visuals.js';
import { openMentor } from './mentorPanel.js';
import { lockedPage } from './level.js';

export function renderLesson([mid], { refresh }) {
  const s = getState();
  const m = getMission(mid);
  if (!m) return h('section.page', h('h1', 'Lesson not found'));
  const level = getLevel(m.levelId);
  if (!P.isLevelUnlocked(s, level)) return lockedPage(s, level, `Level ${level.num}`);
  if (!P.isMissionAvailable(s, mid)) {
    const prev = level.missions[m.index - 1];
    return h('section.page', { 'data-title': m.title }, h('div.locked-panel.small-lock', h('div',
      h('p.kicker', icon('lock', 14), 'Mission locked'), h('h1', m.title),
      h('p.lead', `Finish “${prev.title}” first — missions in a region are completed in order.`),
      h('a.btn.btn-primary', { href: `#/lesson/${prev.id}` }, 'Go to the previous lesson', icon('arrow', 18)))));
  }

  const done = P.isMissionComplete(s, mid);
  const next = level.missions[m.index + 1];
  const challenge = m.challengeId ? getChallenge(m.challengeId) : null;

  // ---- practice check ----
  const completeArea = h('div.complete-area', { 'aria-live': 'polite' });
  const pendingCount = () => m.check.filter((q) => !(getState().practice[q.id]?.correct > 0)).length;
  const renderComplete = () => {
    const isDone = P.isMissionComplete(getState(), mid);
    const pending = pendingCount();
    const after = next ? h('a.btn.btn-primary', { href: `#/lesson/${next.id}` }, `Next: ${next.title}`, icon('arrow', 18))
      : P.testAvailable(getState(), level) ? h('a.btn.btn-primary', { href: `#/level/${level.id}` }, 'All lessons done — go to the level test', icon('arrow', 18)) : null;
    if (isDone) {
      completeArea.replaceChildren(h('div.complete-done', icon('check', 22), h('div', h('strong', 'Lesson complete'), h('p.small.muted', 'Progress saved. You can revisit any time.'))), after);
      return;
    }
    completeArea.replaceChildren(
      h('button.btn.btn-primary.btn-lg', { disabled: pending > 0, onclick: () => {
        const r = completeMission(mid);
        if (!r.ok) toast(r.reason, { kind: 'warn', iconName: 'info' });
        renderComplete();
      } }, icon('check', 18), 'Complete lesson'),
      h('p.small.muted', pending > 0 ? `Answer the ${pending} practice question${pending > 1 ? 's' : ''} above correctly to complete this lesson. Retries are unlimited and don’t affect your test.` : 'Ready — your practice answers are all correct.'));
  };
  const checks = m.check.map((q, i) => {
    const rec = s.practice[q.id];
    return questionCard(q, {
      mode: 'practice', number: i + 1, total: m.check.length, seed: 11 + i,
      prior: rec?.correct > 0 && rec.last ? { correct: true, response: q.type === 'mc' ? q.answer : q.sample } : null,
      onAnswer: (res) => { answerPractice(q.id, res.correct); renderComplete(); },
    });
  });
  renderComplete();

  // ---- glossary ----
  const glossary = (m.terms || []).length ? h('aside.card.glossary', { 'aria-labelledby': `gl-${mid}` },
    h('h2', { id: `gl-${mid}` }, icon('book', 18), 'Key terms'),
    h('dl', m.terms.map((t) => [h('dt', t.term), h('dd', t.def)]))) : null;

  const example = m.example ? h('section.example',
    h('h2', icon('code', 18), m.example.title),
    h('pre.code-block', { 'data-lang': m.example.lang }, h('code', { html: highlight(m.example.code, m.example.lang) })),
    m.example.note ? h('p.small', m.example.note) : null,
    ['python', 'javascript'].includes(m.example.lang) ? h('p.small.muted', m.example.lang === 'python' ? 'Python examples are for reading — the browser playground simulates Python output rather than running it.' : 'You can paste this into the Playground to run it.') : null) : null;

  return h('article.page.lesson-page', { 'data-title': m.title },
    h('nav.crumbs', { 'aria-label': 'Breadcrumb' }, h('a', { href: '#/map' }, 'Map'), icon('arrow', 12), h('a', { href: `#/level/${level.id}` }, `Level ${level.num}: ${level.region}`), icon('arrow', 12), h('span', `Mission ${m.index + 1}`)),
    h('header.lesson-head',
      h('p.kicker', `Mission ${m.index + 1} of ${level.missions.length} · ${SKILLS[m.skill]?.label || m.skill}`),
      h('h1', m.title),
      h('div.mission-goal', icon('target', 20), h('div', h('span.small.muted', 'Mission goal'), h('p', m.goal))),
      h('div.meta-row', statusPill(done ? 'completed' : 'in-progress', done ? 'Completed' : 'In progress'), h('span', icon('clock', 15), `${m.minutes} min`), h('button.btn.btn-small.btn-ghost', { onclick: () => openMentor(`Explain "${m.title}" simply`) }, icon('chat', 16), 'Ask the mentor about this'))),
    h('div.lesson-grid',
      h('div.lesson-main',
        m.sections.map((sec, i) => h('section.lesson-section', h('h2', h('span.sec-n', i + 1), sec.h), mdEl(sec.body))),
        m.visual ? renderVisual(m.visual, m.visualCaption) : null,
        example,
        h('section.practice', { 'aria-labelledby': `pr-${mid}` },
          h('div.section-head', h('h2', { id: `pr-${mid}` }, icon('bulb', 20), 'Knowledge check'), h('span.tag.tag-practice', 'Practice · not graded')),
          h('p.small.muted', 'Practice questions give instant feedback and unlimited retries. They don’t count toward unlocking — the level test does.'),
          checks),
        challenge ? h('section.card.activity-card',
          h('div.card-head', h('h2', icon('code', 20), 'Hands-on activity'), P.challengePassed(s, challenge.id) ? statusPill('completed', 'Passed') : h('span.tag', 'Optional · +75 XP')),
          h('p', h('strong', challenge.title), ' — ', h('span', { html: md(challenge.prompt.split('\n')[0]).replace(/<\/?p>/g, '') })),
          h('a.btn.btn-ghost', { href: `#/playground/${challenge.id}` }, challenge.kind === 'code' ? 'Open the coding challenge' : 'Open the predict-the-output challenge', icon('arrow', 18))) : null,
        completeArea),
      glossary));
}
