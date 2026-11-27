// App shell: router, navigation, top bar, reward celebrations.
import * as store from './store.js';
import * as P from './progression.js';
import { h, icon, toast, modal, progressBar } from './ui.js';
import { brandMark } from './brand.js';
import * as acc from './account.js';
import { startSync, signOutAndClear } from './sync.js';
import { xpBurst, countUp, celebrateBig } from './components/celebrate.js';
import { BADGES } from './data/rewards.js';
import { renderLogin } from './views/login.js';
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
  { re: /^#\/login$/, view: renderLogin, nav: null, title: 'Sign in', bare: true },
];

const NAV = [
  { id: 'dashboard', href: '#/dashboard', label: 'Dashboard', icon: 'home' },
  { id: 'map', href: '#/map', label: 'Journey', icon: 'map' },
  { id: 'playground', href: '#/playground', label: 'Playground', icon: 'code' },
  { id: 'report', href: '#/report', label: 'Report', icon: 'chart' },
  { id: 'settings', href: '#/settings', label: 'Settings', icon: 'settings' },
];

let current = null;
let shownXP = null;
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
  document.body.classList.toggle('auth-mode', Boolean(route.bare));
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
    h('div.sidebar-account#sidebar-account'),
    h('div.sidebar-foot#sidebar-rank'));
  const topbar = h('header.topbar',
    h('div.topbar-stats#topbar-stats'),
    h('div.topbar-account#topbar-account'),
    h('button.btn.btn-mentor', { onclick: () => openMentor(), 'aria-label': 'Open the AI mentor chat' }, icon('chat', 18), h('span', 'Mentor')));
  const tabbar = h('nav.tabbar', { 'aria-label': 'Main navigation' }, NAV.filter((n) => n.id !== 'settings').map((n) => h('a.tab-link', { href: n.href, 'data-nav': n.id }, icon(n.icon, 22), h('span', n.label))),
    h('button.tab-link', { onclick: () => openMentor() }, icon('chat', 22), h('span', 'Mentor')));
  document.getElementById('app').replaceChildren(
    h('a.skip-link', { href: '#main' }, 'Skip to content'),
    sidebar,
    h('div.content', topbar, h('main#main', { tabindex: '-1' })),
    tabbar);
}

export { brandMark };

// ---------- account (sidebar box + top-bar avatar) ----------
const SYNC_LABEL = { idle: ['check', 'Synced to your account'], saved: ['check', 'Saved to your account'], saving: ['upload', 'Saving…'], offline: ['alert', 'Offline — will sync later'], error: ['alert', 'Not synced — will retry'] };
function renderAccount() {
  const a = acc.getAccount();
  const box = document.getElementById('sidebar-account');
  const top = document.getElementById('topbar-account');
  if (!box || !top) return;
  const initial = (a.name || a.email || 'G').trim()[0].toUpperCase();
  if (a.signedIn) {
    const [ic, label] = SYNC_LABEL[a.sync] || SYNC_LABEL.idle;
    box.replaceChildren(
      h('div.acct-row', h('span.acct-avatar', initial), h('div.acct-id', h('strong', a.name || 'Learner'), h('span', a.email))),
      h(`p.acct-sync.sync-${a.sync}`, icon(ic, 14), label),
      h('button.btn.btn-small.acct-out', { type: 'button', onclick: () => modal({ title: 'Sign out?', body: 'Your progress stays saved in your account. This browser’s copy is cleared, so the next person starts fresh.', actions: [{ label: 'Sign out', onClick: () => { signOutAndClear(); location.hash = '#/login'; } }, { label: 'Cancel', autofocus: true }] }) }, icon('back', 14), 'Sign out'));
    top.replaceChildren(h('a.acct-avatar.small', { href: '#/settings', title: `${a.name} · ${label}`, 'aria-label': `Account: ${a.email}` }, initial, h(`i.sync-dot.sync-${a.sync}`)));
  } else {
    box.replaceChildren(
      h('p.acct-guest', icon('user', 16), h('span', h('strong', 'Guest mode'), h('small', 'Progress saved on this device only'))),
      h('a.btn.btn-small.btn-primary.acct-cta', { href: '#/login' }, icon('shield', 14), 'Save progress: sign in'));
    top.replaceChildren(h('a.btn.btn-small.btn-ghost.topbar-login', { href: '#/login', 'aria-label': 'Sign in to save your progress' }, icon('user', 16), h('span', 'Sign in')));
  }
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
  const xpNum = h('strong.xp-num', xp.toLocaleString());
  if (shownXP !== null && xp > shownXP) countUp(xpNum, shownXP, xp);
  shownXP = xp;
  document.getElementById('topbar-stats').replaceChildren(
    h('a.stat-chip', { href: `#/level/${lvl.id}`, title: 'Current level' }, icon('flag', 16), h('span', h('small', 'Level'), h('strong', `${lvl.num} · ${lvl.region}`))),
    h('a.stat-chip.chip-xp', { href: '#/report', title: 'Total XP' }, icon('bolt', 16), h('span', h('small', 'XP'), xpNum)),
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
    xpBurst(total, xp.length === 1 ? xp[0].reason : `${xp.length} rewards`);
    toast(`+${total} XP — ${xp.map((e) => e.reason).join(' · ')}`, { kind: 'xp', iconName: 'bolt' });
  }
  for (const e of events) {
    if (e.type === 'badge') celebrateBig({ kind: 'badge', icon: e.badge.icon, title: e.badge.name, text: e.badge.desc, sub: `${Object.keys(store.getState().badges).length} of ${BADGES.length} badges collected`, actions: [{ label: 'Awesome!' }, { label: 'See all badges', onClick: () => { location.hash = '#/report'; } }] });
    if (e.type === 'rank') celebrateBig({ kind: 'rank', icon: 'shield', title: e.rank.name, text: `You reached ${e.rank.xp.toLocaleString()} XP. Keep going to unlock the next rank.` });
  }
  const unlock = events.find((e) => e.type === 'unlock');
  if (unlock) {
    const l = unlock.level;
    celebrateBig({ kind: 'unlock', icon: 'flag', title: `Level ${l.num}: ${l.region}`, text: l.tagline, sub: 'Earned by passing the required test — not by clicking through.',
      actions: [{ label: 'Start the first lesson', onClick: () => { location.hash = `#/lesson/${l.missions[0].id}`; } }, { label: 'View the map', onClick: () => { location.hash = '#/map'; } }] });
  }
  updateTopbar();
}

// ---------- boot ----------
async function boot() {
  store.init();
  buildShell();
  initMentor({ getContext: () => ({ route: current?.hash, challengeId: (current?.hash.match(/^#\/playground\/(c-[\w-]+)/) || [])[1] || null, missionId: (current?.hash.match(/^#\/lesson\/(l\d+m\d+)/) || [])[1] || null }) });
  store.onEvent(celebrate);
  store.subscribe(() => updateTopbar());
  acc.onAccountChange(renderAccount);
  renderAccount();
  window.addEventListener('hashchange', onHashChange);
  // First visit with accounts enabled: start on the login page (guests can skip it).
  const st = await acc.authStatus();
  renderAccount();
  if (st.enabled && !acc.getAccount().signedIn && !acc.isGuestChosen() && !location.hash.startsWith('#/login')) {
    history.replaceState(null, '', '#/login');
  }
  onHashChange();
  if (await startSync()) render({ scroll: false });
}

boot();
