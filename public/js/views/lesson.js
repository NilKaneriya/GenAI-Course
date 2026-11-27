import { h, icon, md, highlight, toast, statusPill } from '../ui.js';
import * as P from '../progression.js';
import { getState, answerPractice, completeMission } from '../store.js';
import { getMission, getLevel, getChallenge, SKILLS } from '../data/curriculum.js';
import { questionCard } from '../components/question.js';
import { renderVisual } from '../components/visuals.js';
import { keyIdeaCard, conceptMap, flashDeck, storySlides, mentorCoach, starRow } from '../components/learnKit.js';
import { openMentor } from './mentorPanel.js';
import { lessonSide } from '../components/sidePanel.js';
import { lockedPage } from './level.js';

// A lesson is played as four stages: see the big picture → flip the flashcards → read the story in
// bite-size slides → quiz. Text is still there, but it comes after the visuals and is split into small parts.
export function renderLesson([mid]) {
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

  // ---- stars + stage nav (derived from saved state, refreshed after each action) ----
  const starsBox = h('div.lesson-stars');
  const stageNav = h('nav.stage-nav', { 'aria-label': 'Lesson stages' });
  const STAGES = [
    { id: 'see', label: 'Big picture', icon: 'eye' },
    { id: 'cards', label: 'Flashcards', icon: 'layers', hide: !(m.terms || []).length },
    { id: 'learn', label: 'Story', icon: 'book' },
    { id: 'quiz', label: 'Quiz', icon: 'target' },
  ].filter((x) => !x.hide);
  const stageDone = (id) => {
    const st = getState();
    if (id === 'cards') return P.arcadeWon(st, mid, 'cards');
    if (id === 'quiz') return P.isMissionComplete(st, mid);
    return false;
  };
  const go = (id) => document.getElementById(`stage-${mid}-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const refreshHud = () => {
    starsBox.replaceChildren(starRow(P.lessonStars(getState(), mid), { large: true }));
    stageNav.replaceChildren(...STAGES.map((x, i) => h(`button.stage-pill${stageDone(x.id) ? '.done' : ''}`, { type: 'button', onclick: () => go(x.id) },
      h('span.stage-n', stageDone(x.id) ? icon('check', 14) : i + 1), icon(x.icon, 15), h('span.stage-l', x.label))));
  };

  // ---- practice check ----
  const completeArea = h('div.complete-area', { 'aria-live': 'polite' });
  const pendingCount = () => m.check.filter((q) => !(getState().practice[q.id]?.correct > 0)).length;
  const renderComplete = () => {
    const isDone = P.isMissionComplete(getState(), mid);
    const pending = pendingCount();
    const after = next ? h('a.btn.btn-primary', { href: `#/lesson/${next.id}` }, `Next: ${next.title}`, icon('arrow', 18))
      : P.testAvailable(getState(), level) ? h('a.btn.btn-primary', { href: `#/level/${level.id}` }, 'All lessons done — go to the level test', icon('arrow', 18)) : null;
    refreshHud();
    if (isDone) {
      const st = P.lessonStars(getState(), mid);
      completeArea.replaceChildren(h('div.complete-done', icon('check', 22), h('div', h('strong', 'Lesson complete'), h('p.small.muted', st.stars === 3 ? 'Three stars — perfect run!' : `${st.stars}/3 stars. ${st.parts.filter((p) => !p.got).map((p) => p.label).join(' · ')} to collect the rest.`))), after);
      return;
    }
    completeArea.replaceChildren(
      h('button.btn.btn-primary.btn-lg', { disabled: pending > 0, onclick: () => {
        const r = completeMission(mid);
        if (!r.ok) toast(r.reason, { kind: 'warn', iconName: 'info' });
        renderComplete();
      } }, icon('check', 18), 'Complete lesson'),
      h('p.small.muted', pending > 0 ? `Answer the ${pending} quiz question${pending > 1 ? 's' : ''} above correctly to complete this lesson. Retries are unlimited and don’t affect your test.` : 'Ready — your answers are all correct.'));
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

  const example = m.example ? h('details.example-drop',
    h('summary', icon('code', 18), h('span', m.example.title), h('span.tag', m.example.lang === 'text' ? 'Walkthrough' : 'Code')),
    h('pre.code-block', { 'data-lang': m.example.lang }, h('code', { html: highlight(m.example.code, m.example.lang) })),
    m.example.note ? h('p.small', m.example.note) : null,
    ['python', 'javascript'].includes(m.example.lang) ? h('p.small.muted', m.example.lang === 'python' ? 'Python examples are for reading — the browser playground simulates Python output rather than running it.' : 'You can paste this into the Playground to run it.') : null) : null;

  const stage = (id, n, title, sub, ...kids) => h(`section.stage#stage-${mid}-${id}`, { 'aria-labelledby': `sh-${mid}-${id}` },
    h('header.stage-head', h('span.stage-badge', n), h('div', h('h2', { id: `sh-${mid}-${id}` }, title), sub ? h('p.small.muted', sub) : null)), ...kids);
  const cardsStage = (m.terms || []).length ? stage('cards', 2, 'Flashcards', 'Recall beats re-reading. Master every card for a star.', flashDeck(m, { onMastered: refreshHud })) : null;

  return h('article.page.lesson-page', { 'data-title': m.title },
    h('nav.crumbs', { 'aria-label': 'Breadcrumb' }, h('a', { href: '#/map' }, 'Map'), icon('arrow', 12), h('a', { href: `#/level/${level.id}` }, `Level ${level.num}: ${level.region}`), icon('arrow', 12), h('span', `Mission ${m.index + 1}`)),
    h('header.lesson-head',
      h('div.lesson-head-top', h('p.kicker', `Mission ${m.index + 1} of ${level.missions.length} · ${SKILLS[m.skill]?.label || m.skill}`), starsBox),
      h('h1', m.title),
      h('div.mission-goal', icon('target', 20), h('div', h('span.small.muted', 'Mission goal'), h('p', m.goal))),
      h('div.meta-row', statusPill(done ? 'completed' : 'in-progress', done ? 'Completed' : 'In progress'), h('span', icon('clock', 15), `${m.minutes} min`), h('button.btn.btn-small.btn-ghost', { onclick: () => openMentor('Explain this lesson simply') }, icon('chat', 16), 'Ask the mentor'))),
    stageNav,
    h('div.lesson-grid',
      h('div.lesson-main',
        stage('see', 1, 'Big picture', 'Look and play first — words later.', keyIdeaCard(m), m.visual ? renderVisual(m.visual, m.visualCaption) : null, conceptMap(m)),
        cardsStage,
        stage('learn', cardsStage ? 3 : 2, 'Story', 'Short parts, one idea each. Prefer docs? Tap “Read it all”.', storySlides(m, { onFinish: () => go('quiz') }), example,
          challenge ? h('section.card.activity-card',
            h('div.card-head', h('h3', icon('code', 20), 'Hands-on activity'), P.challengePassed(s, challenge.id) ? statusPill('completed', 'Passed') : h('span.tag', 'Optional · +75 XP')),
            h('p', h('strong', challenge.title), ' — ', h('span', { html: md(challenge.prompt.split('\n')[0]).replace(/<\/?p>/g, '') })),
            h('a.btn.btn-ghost', { href: `#/playground/${challenge.id}` }, challenge.kind === 'code' ? 'Open the coding challenge' : 'Open the predict-the-output challenge', icon('arrow', 18))) : null),
        stage('quiz', cardsStage ? 4 : 3, 'Quiz', 'Instant feedback, unlimited retries. Right on the first try = a star.',
          h('section.practice', checks),
          completeArea)),
      h('aside.lesson-side', { 'aria-label': 'Lesson helpers' }, mentorCoach(m), lessonSide(m, level))));
}
