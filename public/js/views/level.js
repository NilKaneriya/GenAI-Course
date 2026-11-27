import { h, icon, progressBar, statusPill, mdEl, fmtDateTime } from '../ui.js';
import * as P from '../progression.js';
import { getState } from '../store.js';
import { getLevel, getMission, SKILLS } from '../data/curriculum.js';
import { regionArt } from './map.js';

export function lockedPage(s, level, what = 'This level') {
  return h('section.page', { 'data-title': `Locked: ${level.region}` },
    h('div.locked-panel',
      regionArt(level.num, { large: true, locked: true }),
      h('div', h('p.kicker', icon('lock', 14), `Level ${level.num} · Locked`), h('h1', `${what} is locked`),
        h('p.lead', P.unlockExplanation(s, level) || 'Complete the previous requirements first.'),
        h('p', 'Levels unlock only from real results: finishing lessons and passing the required test (and the boss, where there is one). Nothing unlocks from clicking "complete".'),
        h('div.hero-actions', h('a.btn.btn-primary', { href: P.nextAction(s).href }, 'Go to my next step', icon('arrow', 18)), h('a.btn.btn-ghost', { href: '#/map' }, 'View the map')))));
}

export function reviewList(s, level, topicIds) {
  if (!topicIds.length) return null;
  return h('div.review-box',
    h('h3', icon('book', 18), 'Topics to review before retrying'),
    h('ul', topicIds.map((mid) => {
      const m = getMission(mid);
      const tip = level.review?.find((r) => r.missionId === mid)?.tip;
      return h('li', h('a', { href: `#/lesson/${mid}` }, m?.title || mid), tip ? h('p.small.muted', tip) : null);
    })));
}

export function renderLevel([lid]) {
  const s = getState();
  const level = getLevel(lid);
  if (!level) return h('section.page', h('h1', 'Level not found'));
  if (!P.isLevelUnlocked(s, level)) return lockedPage(s, level);

  const st = P.levelStatus(s, level);
  const reqs = P.requirements(s, level);
  const attempts = P.testAttempts(s, lid);
  const last = attempts.at(-1);
  const passed = P.testPassed(s, lid);
  const testOpen = P.testAvailable(s, level);
  const totalMin = level.missions.reduce((t, m) => t + m.minutes, 0);

  const header = h('header.level-hero',
    regionArt(level.num, { large: true }),
    h('div.level-hero-text',
      h('a.back', { href: '#/map' }, icon('back', 16), 'Journey map'),
      h('p.kicker', `Level ${level.num} · ${level.region}`),
      h('h1', level.title),
      h('div.meta-row', statusPill(st, P.STATUS_LABEL[st]), h('span', icon('clock', 15), `≈ ${Math.round(totalMin / 5) * 5 + 15} min`), h('span', icon('book', 15), `${level.missions.length} lessons`), level.boss ? h('span', icon('sword', 15), 'Boss challenge') : null),
      progressBar(P.levelProgressPct(s, level), { label: 'Level progress' })));

  const overview = h('section.card.level-overview', h('h2', 'Overview'), mdEl(level.overview),
    h('h3', 'Learning objectives'), h('ul.objectives', level.objectives.map((o) => h('li', icon('target', 16), o))),
    h('div.skill-tags', level.skills.map((k) => h('span.tag', SKILLS[k]?.label || k))));

  const reqCard = h('section.card.req-card', h('h2', 'Unlock requirements'),
    h('p.small.muted', `To unlock Level ${level.num + 1 <= 10 ? level.num + 1 : '—'}, complete every required item below.`),
    h('ul.req-list', reqs.map((r) => h(`li.req.req-${r.status}`, statusPill(r.status === 'done' ? 'done' : r.status, r.status === 'done' ? 'Done' : r.status === 'failed' ? 'Not passed' : r.status === 'locked' ? 'Locked' : 'To do'), h('div', h('strong', r.label), h('span.small.muted', r.detail))))));

  const missions = h('section.missions', h('h2', 'Missions'),
    h('ol.mission-list', level.missions.map((m, i) => {
      const ms = P.missionStatus(s, m.id);
      const avail = ms !== 'locked';
      return h(`li.mission-card.ms-${ms}`,
        h('span.mission-index', ms === 'completed' ? icon('check', 18) : ms === 'locked' ? icon('lock', 16) : i + 1),
        h('div.mission-main',
          h('h3', avail ? h('a', { href: `#/lesson/${m.id}` }, m.title) : m.title),
          h('p.small', h('strong', 'Goal: '), m.goal),
          h('p.small.muted', icon('clock', 14), ` ${m.minutes} min`, m.visual ? [' · ', icon('eye', 14), ' interactive visual'] : null, m.challengeId ? [' · ', icon('code', 14), ' coding challenge'] : null)),
        h('div.mission-cta', avail
          ? h(`a.btn${ms === 'completed' ? '.btn-ghost' : '.btn-primary'}.btn-small`, { href: `#/lesson/${m.id}` }, ms === 'completed' ? 'Review' : ms === 'in-progress' ? 'Resume' : 'Start')
          : h('span.small.muted', 'Finish the previous lesson')));
    })));

  const challenges = (level.challenges || []).length ? h('section.card', h('h2', 'Hands-on challenges'),
    h('ul.challenge-list', level.challenges.map((c) => h('li',
      h('span.lang-tag', c.lang === 'python' ? 'Python' : 'JS'),
      h('div', h('a', { href: `#/playground/${c.id}` }, c.title), h('p.small.muted', c.kind === 'code' ? 'Runs for real in a sandbox, checked by tests' : 'Predict the output (Python is simulated in the browser)')),
      P.challengePassed(s, c.id) ? statusPill('completed', 'Passed') : h('span.small.muted', 'Optional · +75 XP'))))) : null;

  const testCard = h(`section.card.test-card${passed ? '.passed' : last ? '.failed' : ''}`,
    h('div.card-head', h('h2', icon('target', 20), level.test.title), h('span.tag.tag-test', 'Required test')),
    h('p', level.test.intro),
    h('p.small.muted', `${level.test.questions.length} questions · pass mark ${P.threshold(s)}% · immediate feedback · unlimited retries`),
    passed ? h('p.result-line.ok', icon('check', 18), `Passed with ${P.bestScore(s, lid)}%.`) : last ? h('p.result-line.bad', icon('rotate', 18), `Last attempt: ${last.score}% (needed ${last.threshold}%). Review the topics below, then retry.`) : null,
    !passed && last ? reviewList(s, level, last.missedTopics) : null,
    h('div.hero-actions', testOpen
      ? h(`a.btn${passed ? '.btn-ghost' : '.btn-primary'}`, { href: `#/test/${lid}` }, passed ? 'Retake for practice' : last ? 'Retry the test' : 'Start the test', icon('arrow', 18))
      : h('button.btn', { disabled: true }, icon('lock', 16), `Complete all ${level.missions.length} lessons to unlock`)),
    attempts.length ? h('details.attempts', h('summary', `Attempt history (${attempts.length})`),
      h('table.table', h('thead', h('tr', h('th', 'Attempt'), h('th', 'Date'), h('th', 'Score'), h('th', 'Result'))),
        h('tbody', attempts.map((a, i) => h('tr', h('td', i + 1), h('td', fmtDateTime(a.date)), h('td', `${a.score}% (${a.correct}/${a.total})`), h('td', a.passed ? statusPill('passed', 'Passed') : statusPill('failed', 'Not passed'))))))) : null);

  const boss = level.boss ? h(`section.card.boss-card${P.bossWon(s, lid) ? '.passed' : ''}`,
    h('div.card-head', h('h2', icon('sword', 20), `Boss: ${level.boss.title}`), h('span.tag.tag-boss', P.bossRequired(s, level) ? 'Required' : 'Optional')),
    h('p', level.boss.story),
    h('p.small.muted', `${level.boss.questions.length} scenario rounds · land ${level.boss.toWin} hits to win${level.boss.project ? ' · plus a capstone project plan' : ''} · ≈ ${level.boss.minutes} min`),
    P.bossWon(s, lid) ? h('p.result-line.ok', icon('trophy', 18), 'Defeated!') : null,
    h('div.hero-actions', P.bossAvailable(s, level)
      ? h(`a.btn${P.bossWon(s, lid) ? '.btn-ghost' : '.btn-primary'}`, { href: `#/boss/${lid}` }, P.bossWon(s, lid) ? 'Replay boss' : 'Challenge the boss', icon('sword', 18))
      : h('button.btn', { disabled: true }, icon('lock', 16), 'Pass the level test to unlock'))) : null;

  return h('section.page.level-page', { 'data-title': `Level ${level.num}: ${level.title}` },
    header,
    h('div.level-grid', h('div.level-col', overview, missions, challenges), h('div.level-col.side', reqCard, testCard, boss)));
}
