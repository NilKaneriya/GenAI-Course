import { h, icon, statusPill, fmtDate, fmtDateTime } from '../ui.js';
import * as P from '../progression.js';
import { getState } from '../store.js';
import { LEVELS, getLevel, getMission, allChallenges } from '../data/curriculum.js';
import { BADGES } from '../data/rewards.js';
import { donut, hBars, scoreLine, columns, skillBars, chartCard, legend } from '../components/charts.js';
import { openMentor } from './mentorPanel.js';

export function renderReport() {
  const s = getState();
  const comp = P.courseCompletion(s);
  const xp = P.totalXP(s);
  const rank = P.rankInfo(xp);
  const attempts = P.allTestAttempts(s);
  const skills = P.skillStats(s).filter((x) => x.attempts >= 1).sort((a, b) => b.accuracy - a.accuracy);
  const { strengths, gaps } = P.strengthsAndGaps(s);
  const weak = P.weakTopics(s, 5);
  const days = P.xpByDay(s, 14);
  const next = P.nextAction(s);
  const firstUse = comp.lessons === 0 && attempts.length === 0;

  const kpis = h('div.kpis',
    kpi('Course complete', `${comp.pct}%`, `${comp.lessons}/${comp.totalLessons} lessons`),
    kpi('Levels cleared', `${comp.levelsCleared}/10`, `${comp.tests} tests passed`),
    kpi('Total XP', xp.toLocaleString(), rank.rank.name),
    kpi('Test attempts', attempts.length, attempts.length ? `${attempts.filter((a) => a.passed).length} passed` : 'none yet'),
    kpi('Bosses defeated', `${comp.bosses}/${comp.totalBosses}`, `${allChallenges().filter((c) => P.challengePassed(s, c.id)).length} coding challenges passed`));

  const recommend = h('section.card.recommend',
    h('div.rec-icon', icon('compass', 26)),
    h('div', h('p.kicker', 'Recommended next step'), h('h2', next.label),
      h('p', next.type === 'mission' ? `Lesson ${next.mission.index + 1} of Level ${next.level.num} · about ${next.mission.minutes} minutes.` : next.type === 'test' ? `All lessons in ${next.level.region} are done. ${P.testAttempts(s, next.level.id).length ? 'Review the topics you missed, then retry.' : 'Take the required test to progress.'}` : next.type === 'boss' ? 'Beat the boss to unlock the next region.' : 'You have completed the whole journey.'),
      weak[0] && next.type !== 'test' ? h('p.small.muted', 'Also worth 10 minutes: review ', h('a', { href: `#/lesson/${weak[0].mission.id}` }, weak[0].mission.title), ', your most-missed topic.') : null,
      h('div.hero-actions', h('a.btn.btn-primary', { href: next.href }, 'Go', icon('arrow', 18)), h('button.btn.btn-ghost', { onclick: () => openMentor('Explain my progress charts') }, icon('chat', 18), 'Ask the mentor about this report'))));

  const levelRows = LEVELS.map((l) => ({ label: `${l.num}. ${l.region}`, value: P.levelProgressPct(s, l), status: P.levelStatus(s, l) === 'locked' ? 'locked' : P.levelStatus(s, l) === 'completed' ? 'completed' : P.levelStatus(s, l) === 'test-failed' ? 'failed' : 'active' }));

  const charts = h('div.chart-grid',
    chartCard('Overall course completion', 'Lessons 60% · tests 30% · bosses 10%', h('div.donut-wrap', donut(comp.pct, { label: 'Course complete', sub: 'complete' }),
      h('ul.mini-stats', h('li', h('strong', `${comp.lessons}/${comp.totalLessons}`), ' lessons'), h('li', h('strong', `${comp.tests}/10`), ' tests passed'), h('li', h('strong', `${comp.bosses}/${comp.totalBosses}`), ' bosses')))),
    chartCard('Progress by level', 'Lessons + test + boss for each level, in percent', hBars(levelRows), { footer: legend([['sw-completed', 'Cleared'], ['sw-active', 'Unlocked'], ['sw-failed', 'Test not passed yet'], ['sw-locked', 'Locked']]) }),
    chartCard('Test scores over time', `Every attempt, in order. Dashed line = pass mark (${P.threshold(s)}%)`,
      attempts.length ? scoreLine(attempts.map((a) => ({ date: a.date, score: a.score, passed: a.passed, label: `Level ${a.levelNum} #${a.attemptNo}`, short: `L${a.levelNum} #${a.attemptNo}` })), { threshold: P.threshold(s) }) : null,
      { wide: true, empty: attempts.length ? null : emptyMsg('No test attempts yet', 'Finish the lessons in a level and take its test — each attempt appears here as a point.'), footer: attempts.length ? legend([['sw-pass', 'Passed'], ['sw-fail', 'Below pass mark']]) : null }),
    chartCard('Accuracy by skill', 'Practice answers + latest test answers (tests count double). Line = 75% review threshold',
      skills.length ? skillBars(skills.map((x) => ({ label: x.label, accuracy: x.accuracy, attempts: x.attempts }))) : null,
      { empty: skills.length ? null : emptyMsg('No answers yet', 'Answer practice questions in a lesson to start measuring your skills.'), footer: skills.length ? legend([['sw-strong', 'Strong (80%+)'], ['sw-ok', 'Developing'], ['sw-weak', 'Needs review (<75%)']]) : null }),
    chartCard('XP earned per day', 'Last 14 days · hover a bar for lessons completed that day',
      days.some((d) => d.xp) ? columns(days) : null, { empty: days.some((d) => d.xp) ? null : emptyMsg('No XP in the last 14 days', 'Complete a lesson to earn your first 50 XP.') }));

  const levelTable = h('section.card', h('h2', 'Level unlock status'),
    h('div.table-wrap', h('table.table',
      h('thead', h('tr', h('th', 'Level'), h('th', 'Status'), h('th', 'Lessons'), h('th', 'Best test'), h('th', 'Attempts'), h('th', 'Boss'))),
      h('tbody', LEVELS.map((l) => {
        const st = P.levelStatus(s, l);
        const best = P.bestScore(s, l.id);
        return h('tr', h('td', st === 'locked' ? `${l.num}. ${l.title}` : h('a', { href: `#/level/${l.id}` }, `${l.num}. ${l.title}`)), h('td', statusPill(st, P.STATUS_LABEL[st])), h('td', `${P.missionsDone(s, l)}/${l.missions.length}`), h('td', best < 0 ? '—' : `${best}%`), h('td', P.testAttempts(s, l.id).length), h('td', !l.boss ? '—' : P.bossWon(s, l.id) ? 'Defeated' : P.bossAvailable(s, l) ? 'Ready' : 'Locked'));
      })))));

  const history = h('section.card', h('h2', 'Test attempt history'),
    attempts.length ? h('div.table-wrap', h('table.table',
      h('thead', h('tr', h('th', 'Date'), h('th', 'Test'), h('th', 'Attempt'), h('th', 'Score'), h('th', 'Pass mark'), h('th', 'Result'), h('th', 'Topics missed'))),
      h('tbody', [...attempts].reverse().map((a) => h('tr', h('td', fmtDateTime(a.date)), h('td', `L${a.levelNum}: ${getLevel(a.levelId).test.title}`), h('td', `#${a.attemptNo}`), h('td', `${a.score}% (${a.correct}/${a.total})`), h('td', `${a.threshold}%`), h('td', a.passed ? statusPill('passed', 'Passed') : statusPill('failed', 'Not passed')),
        h('td.small', a.missedTopics.length ? a.missedTopics.map((m, i) => [i ? ', ' : '', h('a', { href: `#/lesson/${m}` }, getMission(m)?.title || m)]) : '—')))))) : h('p.muted', 'No attempts yet.'));

  const lessons = h('section.card', h('h2', 'Lessons'),
    h('div.lesson-columns', LEVELS.map((l) => h('div.lesson-col', h('h3', `${l.num}. ${l.region}`), h('ul.check-list', l.missions.map((m) => {
      const ms = P.missionStatus(s, m.id);
      return h(`li.cl-${ms}`, icon(ms === 'completed' ? 'check' : ms === 'locked' ? 'lock' : 'clock', 14), ms === 'locked' ? m.title : h('a', { href: `#/lesson/${m.id}` }, m.title));
    }))))));

  const projects = LEVELS.filter((l) => l.boss);
  const projectCard = h('section.card', h('h2', 'Projects and boss challenges'),
    h('ul.boss-list', projects.map((l) => {
      const rec = s.bosses[l.id];
      const lastA = rec?.attempts?.at(-1);
      return h('li', h('span.boss-ic', icon(P.bossWon(s, l.id) ? 'trophy' : 'sword', 18)), h('div', h('strong', l.boss.title), h('span.small.muted', ` · Level ${l.num}`), h('p.small', P.bossWon(s, l.id) ? `Defeated ${fmtDate(rec.wonAt)}${l.boss.project ? ' · project plan submitted' : ''}` : lastA ? `Best attempt: ${Math.max(...rec.attempts.map((a) => a.hits))}/${l.boss.toWin} hits` : P.bossAvailable(s, l) ? 'Ready to challenge' : 'Not unlocked yet')));
    })),
    s.bosses.l10?.project ? h('details', h('summary', 'Your capstone project plan'), h('dl.plan', getLevel('l10').boss.project.fields.map((f) => [h('dt', f.label), h('dd', s.bosses.l10.project[f.id])]))) : null);

  const badgeCard = h('section.card', h('h2', `Badges (${Object.keys(s.badges).length}/${BADGES.length})`),
    h('ul.badge-row.wide', BADGES.map((b) => h(`li.badge${s.badges[b.id] ? '.earned' : '.unearned'}`, h('span.badge-icon', icon(b.icon, 20)), h('span.badge-name', b.name), h('span.badge-desc', s.badges[b.id] ? `Earned ${fmtDate(s.badges[b.id])}` : b.desc)))));

  const skillsCard = h('section.card.two-col',
    h('div', h('h2', 'Strengths'), strengths.length ? h('ul.pill-list', strengths.map((x) => h('li.strong', `${x.label} · ${x.accuracy}%`))) : h('p.muted.small', 'Strengths appear once a skill has 3+ graded answers at 80% or above.')),
    h('div', h('h2', 'Needs improvement'), gaps.length || weak.length ? h('div', gaps.length ? h('ul.pill-list', gaps.map((x) => h('li.weak', `${x.label} · ${x.accuracy}%`))) : null,
      weak.length ? h('ul.review-links', weak.map((w) => h('li', h('a', { href: `#/lesson/${w.mission.id}` }, w.mission.title), h('span.small.muted', ` · Level ${getLevel(w.mission.levelId).num}`)))) : null) : h('p.muted.small', 'Nothing flagged right now.')));

  const exportCard = h('section.card.export', h('h2', 'Export your progress'),
    h('p.small.muted', 'Download your saved data to back it up, analyse it, or move it to another browser (import it in Settings).'),
    h('div.hero-actions',
      h('button.btn.btn-ghost', { onclick: () => download(`genai-quest-progress-${P.dayKey()}.json`, JSON.stringify(getState(), null, 2), 'application/json') }, icon('download', 16), 'Download JSON'),
      h('button.btn.btn-ghost', { onclick: () => download(`genai-quest-tests-${P.dayKey()}.csv`, testsCsv(getState()), 'text/csv') }, icon('download', 16), 'Test history (CSV)'),
      h('button.btn.btn-ghost', { onclick: () => download(`genai-quest-lessons-${P.dayKey()}.csv`, lessonsCsv(getState()), 'text/csv') }, icon('download', 16), 'Lessons (CSV)'),
      h('button.btn.btn-ghost', { onclick: () => window.print() }, icon('book', 16), 'Print report')));

  return h('section.page.report', { 'data-title': 'Progress report' },
    h('header.page-head', h('p.kicker', 'Progress report'), h('h1', `${s.profile.name}’s learning report`), h('p.lead', `Generated ${fmtDateTime(new Date().toISOString())} from your saved activity.${s.isSample ? ' Currently showing sample data.' : ''}`)),
    firstUse ? h('div.banner', icon('info', 18), h('p', h('strong', 'Your report is empty for now. '), 'Complete your first lesson and the charts below will start filling in. ', h('a', { href: next.href }, 'Start the first mission'), '.')) : null,
    kpis, recommend, charts, skillsCard, levelTable, history, projectCard, lessons, badgeCard, exportCard);
}

const kpi = (label, value, sub) => h('div.kpi', h('span.kpi-label', label), h('strong.kpi-value', value), h('span.kpi-sub', sub));
const emptyMsg = (title, text) => h('div', h('strong', title), h('p.small.muted', text));

function csvRow(cells) { return cells.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','); }
function testsCsv(s) {
  const rows = [['date', 'level', 'test', 'attempt', 'score_pct', 'correct', 'total', 'pass_mark_pct', 'passed', 'topics_missed']];
  for (const a of P.allTestAttempts(s)) rows.push([a.date, a.levelNum, getLevel(a.levelId).test.title, a.attemptNo, a.score, a.correct, a.total, a.threshold, a.passed, a.missedTopics.map((m) => getMission(m)?.title).join('; ')]);
  return rows.map(csvRow).join('\n');
}
function lessonsCsv(s) {
  const rows = [['level', 'lesson_id', 'lesson', 'skill', 'status', 'completed_at']];
  for (const l of LEVELS) for (const m of l.missions) rows.push([l.num, m.id, m.title, m.skill, P.missionStatus(s, m.id), s.missions[m.id]?.completedAt || '']);
  return rows.map(csvRow).join('\n');
}
function download(name, text, type) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = h('a', { href: url, download: name });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
