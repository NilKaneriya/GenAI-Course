// Login / create-account page. Shown full-screen (no sidebar) and on first visit when accounts are enabled.
import { h, icon, toast, confetti } from '../ui.js';
import * as acc from '../account.js';
import { afterSignIn } from '../sync.js';
import { brandMark } from '../brand.js';
import { LEVELS, totalMissions } from '../data/curriculum.js';
import { BADGES } from '../data/rewards.js';

const PERKS = [
  ['map', 'A 10-level journey', 'From “what is AI?” to job-ready GenAI engineer.'],
  ['layers', 'Learn by playing', 'Flashcards, mini-games, visuals and boss fights.'],
  ['chat', 'A mentor beside you', 'Explains simply, quizzes you, plans your next step.'],
  ['shield', 'Progress saved to your account', 'Pick up on your phone where you left off.'],
];
const FLOATERS = ['spark', 'trophy', 'star', 'bolt', 'rocket', 'shield', 'target', 'heart'];

export function renderLogin(_, { refresh }) {
  let mode = 'signin';
  const errBox = h('p.auth-error', { role: 'alert' });
  const notice = h('div.auth-notice');
  const nameField = h('div.field.auth-name', h('label', { for: 'au-name' }, 'Your name'), h('div.input-ic', icon('user', 18), h('input#au-name', { type: 'text', autocomplete: 'nickname', maxlength: 40, placeholder: 'What should the mentor call you?' })));
  const email = h('input#au-email', { type: 'email', autocomplete: 'email', required: true, placeholder: 'you@example.com', inputmode: 'email' });
  const pw = h('input#au-pw', { type: 'password', autocomplete: 'current-password', required: true, minlength: 8, placeholder: 'At least 8 characters' });
  const eye = h('button.icon-btn.pw-eye', { type: 'button', 'aria-label': 'Show password', onclick: () => { const show = pw.type === 'password'; pw.type = show ? 'text' : 'password'; eye.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); eye.classList.toggle('on', show); } }, icon('eye', 18));
  const submit = h('button.btn.btn-primary.btn-lg.auth-submit', { type: 'submit' });
  const tabs = h('div.auth-tabs', { role: 'tablist' });
  const title = h('h1.auth-title');
  const sub = h('p.muted.auth-sub');

  const paint = () => {
    const up = mode === 'signup';
    title.textContent = up ? 'Create your account' : 'Welcome back';
    sub.textContent = up ? 'Free. Your XP, badges and lessons follow you to any device.' : 'Sign in to continue your quest.';
    nameField.hidden = !up;
    pw.autocomplete = up ? 'new-password' : 'current-password';
    submit.replaceChildren(icon(up ? 'rocket' : 'arrow', 18), up ? 'Create account & start' : 'Sign in');
    tabs.replaceChildren(...[['signin', 'Sign in'], ['signup', 'Create account']].map(([k, label]) => h(`button.auth-tab${mode === k ? '.on' : ''}`, { type: 'button', role: 'tab', 'aria-selected': String(mode === k), onclick: () => { mode = k; errBox.textContent = ''; paint(); } }, label)));
  };

  const form = h('form.auth-form', { novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    errBox.textContent = '';
    if (!/^\S+@\S+\.\S+$/.test(email.value.trim())) { errBox.textContent = 'Enter a valid email address.'; email.focus(); return; }
    if (pw.value.length < 8) { errBox.textContent = 'Passwords have at least 8 characters.'; pw.focus(); return; }
    submit.disabled = true; form.classList.add('busy');
    try {
      const creds = { email: email.value.trim(), password: pw.value, name: nameField.querySelector('input').value.trim() };
      const user = mode === 'signup' ? await acc.signUp(creds) : await acc.signIn(creds);
      const result = await afterSignIn(user, { isNew: mode === 'signup' });
      confetti();
      toast(result === 'loaded' ? `Welcome back, ${user.name}! Your progress is loaded.` : `Account ready, ${user.name}! Progress now saves to your account.`, { kind: 'xp', iconName: 'check', timeout: 4500 });
      location.hash = '#/dashboard';
    } catch (err) {
      errBox.textContent = err.message || 'Something went wrong. Try again.';
      form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    } finally { submit.disabled = false; form.classList.remove('busy'); pw.value = ''; }
  } },
    tabs, title, sub, nameField,
    h('div.field', h('label', { for: 'au-email' }, 'Email'), h('div.input-ic', icon('mail', 18), email)),
    h('div.field', h('label', { for: 'au-pw' }, 'Password'), h('div.input-ic', icon('lock', 18), pw, eye)),
    errBox, submit,
    h('div.auth-or', h('span', 'or')),
    h('button.btn.btn-ghost.auth-guest', { type: 'button', onclick: () => { acc.chooseGuest(); location.hash = '#/dashboard'; } }, icon('footprints', 18), 'Continue as guest'),
    h('p.small.muted.auth-fine', icon('info', 14), ' As a guest, progress is saved only in this browser. You can create an account later from the sidebar.'),
    notice);

  acc.authStatus().then((st) => {
    if (st.enabled) return;
    notice.replaceChildren(h('p.small', icon('alert', 14), ' Accounts are not switched on for this server yet, so sign-in is unavailable. Continue as a guest — your progress is saved in this browser.'));
    form.querySelectorAll('input, .auth-submit, .auth-tab').forEach((el) => { el.disabled = true; });
  });
  paint();

  const art = h('div.auth-art', { 'aria-hidden': 'true' }, FLOATERS.map((n, i) => h(`span.floater.f${i}`, icon(n, 22))));
  return h('section.auth-page', { 'data-title': 'Sign in' },
    h('div.auth-hero', art,
      h('a.brand.auth-brand', { href: '#/dashboard' }, brandMark(40), h('span', h('strong', 'GenAI Quest'), h('small', 'Beginner → job-ready'))),
      h('h2.auth-hero-title', 'Level up in Generative AI', h('span', '— one quest at a time.')),
      h('ul.auth-perks', PERKS.map(([ic, t, d], i) => h('li', { style: { animationDelay: `${0.1 + i * 0.08}s` } }, h('span.perk-ic', icon(ic, 20)), h('div', h('strong', t), h('span', d))))),
      h('div.auth-stats', h('div', h('strong', LEVELS.length), h('span', 'levels')), h('div', h('strong', totalMissions()), h('span', 'lessons')), h('div', h('strong', BADGES.length), h('span', 'badges')))),
    h('div.auth-card', form));
}
