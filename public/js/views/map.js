import { h, icon, progressBar, statusPill } from '../ui.js';
import * as P from '../progression.js';
import { getState } from '../store.js';
import { LEVELS } from '../data/curriculum.js';

// Simple illustrated motifs for each region (inline SVG, theme colours via CSS variables).
const ART = {
  1: '<path d="M0 62 Q30 40 60 56 T120 50 V80 H0Z" fill="var(--art-2)"/><path d="M0 70 Q40 55 80 66 T120 64 V80 H0Z" fill="var(--art-1)"/><g stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round"><path d="M86 22v10M81 27h10M83 24l6 6M89 24l-6 6"/></g><circle cx="34" cy="26" r="7" fill="var(--gold)"/>',
  2: '<path d="M0 66 Q60 54 120 66 V80 H0Z" fill="var(--art-1)"/><g fill="var(--art-3)"><path d="M22 66 L32 34 L42 66Z"/><path d="M48 66 L60 24 L72 66Z"/><path d="M80 66 L90 38 L100 66Z"/></g><g fill="var(--art-2)"><rect x="30.5" y="64" width="3" height="6"/><rect x="58.5" y="64" width="3" height="6"/><rect x="88.5" y="64" width="3" height="6"/></g>',
  3: '<path d="M0 50 H120 V80 H0Z" fill="var(--art-1)"/><path d="M60 50 C55 60 40 66 20 80 M60 50 C62 62 66 70 70 80 M60 50 C70 60 90 66 112 80" stroke="var(--primary-soft)" stroke-width="4" fill="none"/><circle cx="60" cy="30" r="9" fill="var(--gold)"/>',
  4: '<path d="M0 80 L30 34 L50 58 L72 18 L100 60 L120 44 V80Z" fill="var(--art-3)"/><path d="M66 28 L72 18 L78 28 L72 25Z" fill="#fff"/><g fill="var(--accent)"><circle cx="22" cy="20" r="2.5"/><circle cx="36" cy="14" r="2.5"/><circle cx="50" cy="22" r="2.5"/></g><path d="M22 20 L36 14 L50 22" stroke="var(--accent)" stroke-width="1.4" fill="none"/>',
  5: '<path d="M0 70 H120 V80 H0Z" fill="var(--art-1)"/><path d="M50 70 V22 L60 12 L70 22 V70Z" fill="var(--art-3)"/><g fill="var(--gold)"><rect x="56" y="28" width="8" height="6" rx="1"/><rect x="56" y="42" width="8" height="6" rx="1"/><rect x="56" y="56" width="8" height="6" rx="1"/></g><path d="M20 40 Q40 20 56 30 M100 40 Q80 20 64 30" stroke="var(--accent)" stroke-dasharray="3 3" fill="none"/>',
  6: '<path d="M0 68 H120 V80 H0Z" fill="var(--art-1)"/><path d="M38 52 H82 L76 62 H44Z" fill="var(--art-3)"/><rect x="52" y="62" width="16" height="7" fill="var(--art-3)"/><g stroke="var(--accent)" stroke-width="2.2" stroke-linecap="round"><path d="M60 44 L56 34"/><path d="M66 44 L74 32"/><path d="M54 46 L44 38"/></g><rect x="62" y="20" width="26" height="14" rx="3" fill="var(--art-2)"/><path d="M66 26 H84 M66 30 H78" stroke="var(--primary)" stroke-width="1.6"/>',
  7: '<path d="M0 56 H120 V80 H0Z" fill="var(--primary-soft)"/><g fill="var(--art-1)"><ellipse cx="24" cy="58" rx="14" ry="6"/><ellipse cx="66" cy="62" rx="18" ry="7"/><ellipse cx="102" cy="56" rx="11" ry="5"/></g><g fill="var(--accent)"><circle cx="24" cy="44" r="3"/><circle cx="66" cy="40" r="3"/><circle cx="102" cy="44" r="3"/></g><path d="M24 44 L66 40 L102 44" stroke="var(--accent)" stroke-width="1.4" fill="none" stroke-dasharray="3 2"/>',
  8: '<path d="M0 60 H120 V80 H0Z" fill="var(--primary-soft)"/><path d="M0 52 H40 V60 H0Z" fill="var(--art-3)"/><path d="M58 58 H96 L90 66 H64Z" fill="var(--art-3)"/><path d="M77 58 V30 L92 52Z" fill="var(--art-2)"/><g fill="var(--gold)"><rect x="8" y="40" width="8" height="12"/><rect x="22" y="44" width="8" height="8"/></g>',
  9: '<path d="M0 70 H120 V80 H0Z" fill="var(--art-1)"/><path d="M30 70 V36 H40 V30 H48 V36 H72 V30 H80 V36 H90 V70Z" fill="var(--art-3)"/><path d="M54 70 V54 a6 6 0 0 1 12 0 V70Z" fill="var(--art-2)"/><path d="M60 14 L68 18 V26 C68 31 64 34 60 35 C56 34 52 31 52 26 V18Z" fill="var(--success)"/>',
  10: '<path d="M0 80 L52 18 L60 26 L68 14 L120 80Z" fill="var(--art-3)"/><path d="M60 26 L68 14 L74 22 L68 20Z" fill="#fff"/><path d="M68 14 V2" stroke="var(--ink)" stroke-width="1.6"/><path d="M68 2 L80 6 L68 10Z" fill="var(--accent)"/><circle cx="22" cy="20" r="6" fill="var(--gold)"/>',
};

export function regionArt(num, { large = false, locked = false } = {}) {
  const wrap = h(`div.region-art${large ? '.large' : ''}${locked ? '.locked' : ''}`, { 'aria-hidden': 'true' });
  wrap.innerHTML = `<svg viewBox="0 0 120 80" preserveAspectRatio="xMidYMax slice"><rect width="120" height="80" fill="var(--art-sky)"/>${ART[num] || ART[1]}</svg>`;
  return wrap;
}

export function renderMap() {
  const s = getState();
  const cur = P.currentLevel(s);
  const comp = P.courseCompletion(s);
  return h('section.page.map-page', { 'data-title': 'Journey map' },
    h('header.page-head',
      h('p.kicker', 'Journey map'),
      h('h1', 'From first prompt to job-ready'),
      h('p.lead', 'Ten regions, cleared in order. Each region unlocks only when you finish its lessons, pass its required test, and beat its boss where there is one.'),
      h('div.map-summary', h('span', h('strong', comp.levelsCleared), ' of 10 regions cleared'), h('span', h('strong', `${comp.pct}%`), ' of the course'), h('span', h('strong', `${P.threshold(s)}%`), ' pass mark on tests'))),
    h('ol.trail', LEVELS.map((l) => {
      const st = P.levelStatus(s, l);
      const locked = st === 'locked';
      const pct = P.levelProgressPct(s, l);
      const doneM = P.missionsDone(s, l);
      const href = locked ? null : `#/level/${l.id}`;
      const Card = href ? 'a' : 'div';
      return h(`li.trail-stop.st-${st}${l.id === cur.id ? '.current' : ''}`,
        h('div.trail-node', { 'aria-hidden': 'true' }, locked ? icon('lock', 18) : st === 'completed' ? icon('check', 18) : h('span', l.num)),
        h(`${Card}.region-card`, { href, 'aria-label': `Level ${l.num}, ${l.region}: ${l.title}. ${P.STATUS_LABEL[st]}.` },
          regionArt(l.num, { locked }),
          h('div.region-body',
            h('div.region-top', h('span.region-num', `Level ${l.num}`), statusPill(st, P.STATUS_LABEL[st]), l.boss ? h('span.tag.tag-boss', icon('sword', 12), 'Boss') : null),
            h('h2.region-name', l.region),
            h('p.region-title', l.title),
            locked
              ? h('p.lock-why', icon('lock', 14), P.unlockExplanation(s, l))
              : h('div',
                h('ol.mission-dots', { 'aria-label': `${doneM} of ${l.missions.length} lessons complete` }, l.missions.map((m) => h(`li.md-${P.missionStatus(s, m.id)}`, { title: m.title })), h(`li.md-test${P.testPassed(s, l.id) ? '.md-completed' : P.testAttempts(s, l.id).length ? '.md-failed' : ''}`, { title: 'Level test' }), l.boss ? h(`li.md-boss${P.bossWon(s, l.id) ? '.md-completed' : ''}`, { title: 'Boss' }) : null),
                progressBar(pct, { label: `Level ${l.num} progress`, cls: 'thin' }),
                h('p.small.muted', `${doneM}/${l.missions.length} lessons · test ${P.testPassed(s, l.id) ? `passed (${P.bestScore(s, l.id)}%)` : P.testAttempts(s, l.id).length ? `best ${P.bestScore(s, l.id)}% — retry` : 'not taken'}${l.boss ? ` · boss ${P.bossWon(s, l.id) ? 'defeated' : 'waiting'}` : ''}`)))));
    })));
}
