import { h, icon, progressBar, statusPill, relDay, fmtDate } from '../ui.js';
import * as P from '../progression.js';
import { getState } from '../store.js';
import { LEVELS, getMission, getChallenge, getLevel, SKILLS } from '../data/curriculum.js';
import { BADGES } from '../data/rewards.js';
import { donut } from '../components/charts.js';
import { openMentor } from './mentorPanel.js';
import { regionArt } from './map.js';

export function recentActivity(s, limit = 7) {
  const items = [];
  for (const [mid, rec] of Object.entries(s.missions)) if (rec.completedAt) { const m = getMission(mid); if (m) items.push({ date: rec.completedAt, kind: 'Lesson', icon: 'book', text: m.title, href: `#/lesson/${mid}` }); }
  for (const [cid, rec] of Object.entries(s.challenges)) if (rec.passedAt) { const c = getChallenge(cid); if (c) items.push({ date: rec.passedAt, kind: 'Challenge', icon: 'code', text: c.title, href: `#/playground/${cid}` }); }
  for (const a of P.allTestAttempts(s)) items.push({ date: a.date, kind: 'Test', icon: a.passed ? 'check' : 'rotate', text: `${getLevel(a.levelId).test.title} — ${a.score}%`, href: `#/level/${a.levelId}`, status: a.passed ? 'passed' : 'failed' });
  for (const [lid, rec] of Object.entries(s.bosses)) for (const a of rec.attempts || []) items.push({ date: a.date, kind: 'Boss', icon: 'sword', text: `${getLevel(lid).boss.title} — ${a.won ? 'defeated' : `${a.hits}/${a.total} hits`}`, href: `#/boss/${lid}`, status: a.won ? 'passed' : 'failed' });
  return items.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, limit);
}

export function renderDashboard() {
  const s = getState();
  const lvl = P.currentLevel(s);
  const next = P.nextAction(s);
  const comp = P.courseCompletion(s);
  const xp = P.totalXP(s);
  const rank = P.rankInfo(xp);
  const st = P.streak(s);
  const quests = P.todaysQuests(s);
  const levelPct = P.levelProgressPct(s, lvl);
  const reqs = P.requirements(s, lvl);
  const skills = P.skillStats(s);
  const { gaps } = P.strengthsAndGaps(s);
  const weak = P.weakTopics(s, 3);
  const tests = P.allTestAttempts(s).slice(-4).reverse();
  const badges = BADGES.filter((b) => s.badges[b.id]);

  const hero = h('section.hero', { 'aria-labelledby': 'hero-title' },
    h('div.hero-art', regionArt(lvl.num, { large: true })),
    h('div.hero-main',
      h('p.kicker', `Level ${lvl.num} · ${lvl.region}`),
      h('h1#hero-title', `Welcome back, ${s.profile.name}`),
      h('p.hero-sub', lvl.title, ' — ', h('span.muted', lvl.tagline)),
      h('div.mission-now',
        h('p.mn-label', next.type === 'mission' ? 'Current mission' : next.type === 'test' ? 'Required test' : next.type === 'boss' ? 'Boss challenge' : 'Journey complete'),
        h('h2.mn-title', next.label),
        next.mission ? h('p.mn-meta', icon('clock', 15), `${next.mission.minutes} min`) : null,
        next.mission ? h('p.mn-goal', icon('target', 15), h('span', next.mission.goal)) : null,
        h('div.hero-actions',
          h('a.btn.btn-primary.btn-lg', { href: next.href }, next.type === 'test' ? 'Go to the test' : 'Continue learning', icon('arrow', 18)),
          h('button.btn.btn-ghost', { onclick: () => openMentor() }, icon('chat', 18), 'Ask the mentor'),
          h('a.btn.btn-ghost', { href: '#/report' }, icon('chart', 18), 'Progress report')))),
    h('div.hero-side',
      donut(comp.pct, { label: 'Course complete', sub: 'of the course', size: 170 }),
      h('p.small.muted.center', `${comp.lessons}/${comp.totalLessons} lessons · ${comp.levelsCleared}/10 levels`)));

  const levelCard = h('section.card.card-level', { 'aria-labelledby': 'lvl-h' },
    h('div.card-head', h('h2#lvl-h', 'Progress to the next level'), statusPill(P.levelStatus(s, lvl), P.STATUS_LABEL[P.levelStatus(s, lvl)])),
    h('div.big-progress', h('strong', `${levelPct}%`), progressBar(levelPct, { label: `Level ${lvl.num} progress` })),
    h('ul.req-list', reqs.map((r) => h(`li.req.req-${r.status}`, statusPill(r.status === 'done' ? 'done' : r.status, r.status === 'done' ? 'Done' : r.status === 'failed' ? 'Retry' : r.status === 'locked' ? 'Locked' : 'To do'), h('div', h('strong', r.label), h('span.small.muted', r.detail))))),
    h('a.link-arrow', { href: `#/level/${lvl.id}` }, 'Open level overview', icon('arrow', 16)));

  const rankCard = h('section.card.card-rank', { 'aria-labelledby': 'rank-h' },
    h('h2#rank-h.sr-only', 'XP and rank'),
    h('div.rank-row', h('div.rank-emblem', icon('shield', 30)), h('div', h('p.kicker', 'Learner rank'), h('p.rank-title', rank.rank.name), h('p.small.muted', `${xp.toLocaleString()} XP total`))),
    progressBar(rank.pct, { label: 'Progress to next rank' }),
    h('p.small', rank.next ? `${rank.toNext} XP to ${rank.next.name}` : 'Highest rank reached'),
    h('div.streak', icon('spark', 18), h('div', h('strong', `${st.count}-day streak`), h('p.small.muted', `${st.activeThisWeek} active day${st.activeThisWeek === 1 ? '' : 's'} this week. Missing a day never costs XP; one gap day is forgiven.`))));

  const questCard = h('section.card.card-quests', { 'aria-labelledby': 'q-h' },
    h('div.card-head', h('h2#q-h', 'Daily quests'), h('span.tag', 'Optional')),
    h('ul.quest-list', quests.map((q) => h(`li.quest${q.done ? '.done' : ''}`,
      h('span.quest-check', q.done ? icon('check', 16) : null),
      h('div', h('span', q.text), h('span.small.muted', q.done ? 'Done · +20 XP' : `${q.progress}/${q.target}`))))),
    h('p.small.muted', 'New quests each day. Skipping them is fine — nothing is lost.'));

  const activity = recentActivity(s);
  const activityCard = h('section.card.card-activity', { 'aria-labelledby': 'a-h' },
    h('h2#a-h', 'Recent activity'),
    activity.length ? h('ol.timeline', activity.map((a) => h('li', h(`span.tl-icon${a.status ? '.tl-' + a.status : ''}`, icon(a.icon, 16)), h('div', h('a', { href: a.href }, a.text), h('span.small.muted', `${a.kind} · ${relDay(a.date)}`)))))
      : h('p.muted', 'Nothing yet — your completed lessons, challenges and tests will appear here.'));

  const testCard = h('section.card.card-tests', { 'aria-labelledby': 't-h' },
    h('h2#t-h', 'Recent test scores'),
    tests.length ? h('ul.score-list', tests.map((a) => h('li',
      h(`span.score-badge.${a.passed ? 'pass' : 'fail'}`, `${a.score}%`),
      h('div', h('strong', `Level ${a.levelNum}: ${getLevel(a.levelId).test.title}`), h('span.small.muted', `Attempt ${a.attemptNo} · ${fmtDate(a.date)} · ${a.passed ? 'Passed' : `Below ${a.threshold}%`}`)))))
      : h('p.muted', 'No test attempts yet.'),
    h('a.link-arrow', { href: '#/report' }, 'Full test history', icon('arrow', 16)));

  const practiced = skills.filter((x) => x.practiced);
  const skillCard = h('section.card.card-skills', { 'aria-labelledby': 's-h' },
    h('h2#s-h', 'Skill inventory'),
    h('div.skill-grid', Object.entries(SKILLS).map(([id, sk]) => {
      const x = skills.find((y) => y.id === id);
      const cls = !x.practiced ? 'unpracticed' : x.accuracy == null ? 'practiced' : x.accuracy >= 80 ? 'strong' : x.accuracy < 75 ? 'weak' : 'practiced';
      return h(`span.skill-chip.sk-${cls}`, { title: x.accuracy != null ? `${x.accuracy}% accuracy over ${x.attempts} weighted answers` : x.practiced ? 'Practiced' : 'Not practiced yet' }, sk.short, x.accuracy != null ? h('small', `${x.accuracy}%`) : null);
    })),
    h('div.legend-inline', h('span.sk-strong', 'Strong'), h('span.sk-practiced', 'Practiced'), h('span.sk-weak', 'Needs practice'), h('span.sk-unpracticed', 'Not started')),
    gaps.length || weak.length
      ? h('div.needs', h('h3', 'Needs more practice'), h('ul', weak.map((w) => h('li', h('a', { href: `#/lesson/${w.mission.id}` }, w.mission.title), h('span.small.muted', ` · Level ${getLevel(w.mission.levelId).num}`)))))
      : h('p.small.muted', `${practiced.length} skills practiced so far.`));

  const badgeCard = h('section.card.card-badges', { 'aria-labelledby': 'b-h' },
    h('div.card-head', h('h2#b-h', 'Badges'), h('span.small.muted', `${badges.length}/${BADGES.length}`)),
    h('ul.badge-row', BADGES.map((b) => h(`li.badge${s.badges[b.id] ? '.earned' : '.unearned'}`, { title: `${b.name}: ${b.desc}${s.badges[b.id] ? ` (earned ${fmtDate(s.badges[b.id])})` : ' (not yet earned)'}` }, h('span.badge-icon', icon(b.icon, 20)), h('span.badge-name', b.name)))));

  const mapStrip = h('section.card.card-strip', { 'aria-labelledby': 'm-h' },
    h('div.card-head', h('h2#m-h', 'Your journey'), h('a.link-arrow', { href: '#/map' }, 'Open map', icon('arrow', 16))),
    h('ol.strip', LEVELS.map((l) => {
      const stt = P.levelStatus(s, l);
      return h(`li.strip-item.st-${stt}${l.id === lvl.id ? '.current' : ''}`, h('a', { href: stt === 'locked' ? '#/map' : `#/level/${l.id}`, 'aria-label': `Level ${l.num} ${l.region}: ${P.STATUS_LABEL[stt]}` }, h('span.strip-num', stt === 'locked' ? icon('lock', 14) : stt === 'completed' ? icon('check', 14) : l.num), h('span.strip-name', l.region)));
    })));

  return h('section.page.dashboard', { 'data-title': 'Dashboard' },
    s.isSample ? h('div.banner', icon('info', 18), h('p', h('strong', 'You’re looking at sample progress. '), 'It shows how the dashboard fills in as you learn. When you’re ready, ', h('a', { href: '#/settings' }, 'start fresh in Settings'), '.')) : null,
    hero,
    h('div.dash-grid', levelCard, rankCard, mapStrip, questCard, testCard, activityCard, skillCard, badgeCard));
}
