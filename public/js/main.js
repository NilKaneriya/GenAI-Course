// App shell: router, navigation, top bar, reward celebrations.
import * as store from './store.js';
import * as P from './progression.js';
import { h, icon, toast, modal, confetti, progressBar } from './ui.js';
import { openMentor, initMentor } from './views/mentorPanel.js';
import { renderDashboard } from './views/dashboard.js';
import { renderMap } from './views/map.js';
import { renderLevel } from './views/level.js';
import { renderLesson } from './views/lesson.js';
import { renderTest } from './views/test.js';
import { renderBoss } from './views/boss.js';
import { renderPlayground } from './views/playground.js';
import { renderReport } from './views/report.js';
import { renderSettings } from './views/settings.js';

const ROUTES = [
  { re: /^#\/(?:dashboard)?$/, view: renderDashboard, nav: 'dashboard', title: 'Dashboard' },
  { re: /^#\/map$/, view: renderMap, nav: 'map', title: 'Journey map' },
  { re: /^#\/level\/(l\d+)$/, view: renderLevel, nav: 'map', title: 'Level' },
  { re: /^#\/lesson\/(l\d+m\d+)$/, view: renderLesson, nav: 'map', title: 'Lesson', enter: ([mid]) => P.isMissionAvailable(store.getState(), mid) && store.visitMission(mid) },
  { re: /^#\/test\/(l\d+)$/, view: renderTest, nav: 'map', title: 'Level test' },
  { re: /^#\/boss\/(l\d+)$/, view: renderBoss, nav: 'map', title: 'Boss challenge' },
  { re: /^#\/playground(?:\/([\w-]+))?$/, view: renderPlayground, nav: 'playground', title: 'Playground' },
  { re: /^#\/report$/, view: renderReport, nav: 'report', title: 'Progress report' },
  { re: /^#\/settings$/, view: renderSettings, nav: 'settings', title: 'Settings' },
];

const NAV = [
  { id: 'dashboard', href: '#/dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'map', href: '#/map', label: 'Journey', icon: 'map' },
  { id: 'playground', href: '#/playground', label: 'Playground', icon: 'code' },
  { id: 'report', href: '#/report', label: 'Report', icon: 'chart' },
  { id: 'settings', href: '#/settings', label: 'Settings', icon: 'settings' },
];

let current = null;
const main = () => document.getElementById('main');

function resolve(hash) {
  for (const r of ROUTES) { const m = hash.match(r.re); if (m) return { route: r, params: m.slice(1) }; }
  return null;
}

function render({ scroll = true } = {}) {
  const hash = location.hash || '#/dashboard';
  if (hash === '#/mentor') { history.replaceState(null, '', '#/dashboard'); openMentor(); return render(); }
  const found = resolve(hash);
  if (!found) { main().replaceChildren(notFound()); return; }
  const { route, params } = found;
  const el = route.view(params, { refresh: () => render({ scroll: false }) });
  main().replaceChildren(el);
  document.title = `${el.dataset.title || route.title} · GenAI Quest`;
  updateNav(route.nav);
  updateTopbar();
  if (scroll) { window.scrollTo(0, 0); main().focus({ preventScroll: true }); }
  current = { hash, route };
}

function notFound() {
  return h('section.page', { 'data-title': 'Page not found' }, h('div.empty-state', icon('compass', 40), h('h1', 'This path is off the map'), h('p', 'The page you asked for does not exist.'), h('a.btn.btn-primary', { href: '#/dashboard' }, 'Back to dashboard')));
}

function onHashChange() {
  const found = resolve(location.hash || '#/dashboard');
  if (found?.route.enter) found.route.enter(found.params);
  render();
}

// ---------- shell ----------
function buildShell() {
  const sidebar = h('nav.sidebar', { 'aria-label': 'Main navigation' },
    h('a.brand', { href: '#/dashboard' }, brandMark(), h('span', h('strong', 'GenAI Quest'), h('small', 'Beginner → job-ready'))),
    h('ul.nav-list', NAV.map((n) => h('li', h('a.nav-link', { href: n.href, 'data-nav': n.id }, icon(n.icon, 20), h('span', n.label))))),
    h('button.nav-mentor', { onclick: () => openMentor(), 'aria-label': 'Open the AI mentor chat' }, icon('chat', 20), h('span', 'Ask the mentor')),
    h('div.sidebar-foot#sidebar-rank'));
  const topbar = h('header.topbar',
    h('div.topbar-stats#topbar-stats'),
    h('button.btn.btn-mentor', { onclick: () => openMentor(), 'aria-label': 'Open the AI mentor chat' }, icon('chat', 18), h('span', 'Mentor')));
  const tabbar = h('nav.tabbar', { 'aria-label': 'Main navigation' }, NAV.filter((n) => n.id !== 'settings').map((n) => h('a.tab-link', { href: n.href, 'data-nav': n.id }, icon(n.icon, 22), h('span', n.label))),
    h('button.tab-link', { onclick: () => openMentor() }, icon('chat', 22), h('span', 'Mentor')));
  document.getElementById('app').replaceChildren(
    h('a.skip-link', { href: '#main' }, 'Skip to content'),
    sidebar,
    h('div.content', topbar, h('main#main', { tabindex: '-1' })),
    tabbar);
}

export function brandMark(size = 34) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 40 40'); svg.setAttribute('width', size); svg.setAttribute('height', size); svg.setAttribute('aria-hidden', 'true');
  svg.innerHTML = '<rect x="2" y="2" width="36" height="36" rx="11" fill="var(--primary)"/><path d="M12 26c3-9 5-13 8-13s5 4 8 13" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="26" r="2.6" fill="var(--accent)"/><circle cx="20" cy="13" r="2.6" fill="#fff"/><circle cx="28" cy="26" r="2.6" fill="var(--gold)"/>';
  return svg;
}

function updateNav(active) {
  document.querySelectorAll('[data-nav]').forEach((a) => {
    const on = a.dataset.nav === active;
    a.classList.toggle('active', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
}

function updateTopbar() {
  const s = store.getState();
  const xp = P.totalXP(s);
  const r = P.rankInfo(xp);
  const st = P.streak(s);
  const lvl = P.currentLevel(s);
  document.getElementById('topbar-stats').replaceChildren(
    h('a.stat-chip', { href: `#/level/${lvl.id}`, title: 'Current level' }, icon('flag', 16), h('span', h('small', 'Level'), h('strong', `${lvl.num} · ${lvl.region}`))),
    h('a.stat-chip.chip-xp', { href: '#/report', title: 'Total XP' }, icon('bolt', 16), h('span', h('small', 'XP'), h('strong', xp.toLocaleString()))),
    h('span.stat-chip.chip-streak', { title: 'One missed day is forgiven; missing days never removes XP.' }, icon('spark', 16), h('span', h('small', 'Streak'), h('strong', `${st.count} day${st.count === 1 ? '' : 's'}`))));
  document.getElementById('sidebar-rank').replaceChildren(
    h('p.rank-name', icon('shield', 16), r.rank.name),
    progressBar(r.pct, { label: 'Progress to next rank', cls: 'thin' }),
    h('p.small.muted', r.next ? `${r.toNext} XP to ${r.next.name}` : 'Top rank reached'));
}

// ---------- celebrations ----------
function celebrate(events) {
  const xp = events.filter((e) => e.type === 'xp');
  if (xp.length) {
    const total = xp.reduce((t, e) => t + e.xp, 0);
    toast(`+${total} XP — ${xp.map((e) => e.reason).join(' · ')}`, { kind: 'xp', iconName: 'bolt' });
  }
  for (const e of events) {
    if (e.type === 'badge') toast(`Badge earned: ${e.badge.name} — ${e.badge.desc}`, { kind: 'badge', iconName: e.badge.icon, timeout: 5000 });
    if (e.type === 'rank') toast(`Rank up! You are now a ${e.rank.name}.`, { kind: 'rank', iconName: 'shield', timeout: 5000 });
  }
  const unlock = events.find((e) => e.type === 'unlock');
  if (unlock) {
    confetti();
    const l = unlock.level;
    modal({
      title: `Region unlocked: ${l.region}`,
      cls: 'modal-celebrate',
      body: h('div.celebrate-body', h('div.celebrate-badge', h('span', `Level ${l.num}`)), h('p', h('strong', l.title)), h('p.muted', l.tagline), h('p.small', 'You earned this by passing the required test — not by clicking through. Your map, dashboard and report are updated.')),
      actions: [{ label: 'Start the first lesson', onClick: () => { location.hash = `#/lesson/${l.missions[0].id}`; } }, { label: 'View the map', onClick: () => { location.hash = '#/map'; } }],
    });
  }
  updateTopbar();
}

// ---------- boot ----------
function boot() {
  store.init();
  buildShell();
  initMentor({ getContext: () => ({ route: current?.hash, challengeId: (current?.hash.match(/^#\/playground\/(c-[\w-]+)/) || [])[1] || null }) });
  store.onEvent(celebrate);
  store.subscribe(() => updateTopbar());
  window.addEventListener('hashchange', onHashChange);
  onHashChange();
}

boot();
