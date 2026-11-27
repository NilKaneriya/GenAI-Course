import { h, icon, toast, confetti } from '../ui.js';
import * as P from '../progression.js';
import { getState, submitBossBattle, submitProject, saveProjectDraft, wordCount } from '../store.js';
import { getLevel, LEVELS } from '../data/curriculum.js';
import { questionCard } from '../components/question.js';
import { lockedPage } from './level.js';
import { regionArt } from './map.js';

export function renderBoss([lid], { refresh }) {
  const s = getState();
  const level = getLevel(lid);
  if (!level?.boss) return h('section.page', h('h1', 'This level has no boss'), h('a', { href: `#/level/${lid}` }, 'Back'));
  if (!P.isLevelUnlocked(s, level)) return lockedPage(s, level, `The Level ${level.num} boss`);
  const boss = level.boss;
  const page = h('section.page.boss-page', { 'data-title': `Boss: ${boss.title}` });

  if (!P.bossAvailable(s, level)) {
    page.append(h('div.locked-panel.small-lock', h('div', h('p.kicker', icon('lock', 14), 'Boss locked'), h('h1', boss.title),
      h('p.lead', `Pass the ${level.test.title} first (${P.threshold(s)}% or higher).`),
      h('a.btn.btn-primary', { href: `#/level/${lid}` }, 'Back to the level', icon('arrow', 18)))));
    return page;
  }

  const qs = boss.questions;
  let idx = 0, answers = [];
  const attemptNo = (s.bosses[lid]?.attempts || []).length + 1;

  const hpBar = () => {
    const hits = answers.filter((a) => a?.correct).length;
    const hp = Math.max(0, boss.toWin - hits);
    return h('div.boss-hud',
      h('div.hud-boss', h('span.hud-name', icon('sword', 16), boss.title), h('div.hp', { role: 'meter', 'aria-valuemin': 0, 'aria-valuemax': boss.toWin, 'aria-valuenow': hp, 'aria-label': 'Boss health' }, Array.from({ length: boss.toWin }, (_, i) => h(`span.hp-pip${i < hp ? '.full' : ''}`)))),
      h('div.hud-round', `Round ${Math.min(idx + 1, qs.length)} of ${qs.length}`),
      h('div.hud-you', h('span.small', `Hits: ${hits} / ${boss.toWin} needed`)));
  };

  const intro = () => page.replaceChildren(h('div.boss-intro',
    regionArt(level.num, { large: true }),
    h('div',
      h('a.back', { href: `#/level/${lid}` }, icon('back', 16), `Level ${level.num}: ${level.region}`),
      h('p.kicker', h('span.tag.tag-boss', icon('sword', 12), 'Boss challenge'), P.bossRequired(s, level) ? ' Required to unlock the next region' : ' Optional'),
      h('h1', boss.title),
      h('p.lead', boss.story),
      h('ul.rules',
        h('li', icon('target', 16), `${qs.length} scenario rounds. Each correct answer is a hit; land ${boss.toWin} to win.`),
        h('li', icon('bulb', 16), 'These are applied problems — think like an engineer on the job.'),
        h('li', icon('rotate', 16), 'If the boss survives, review and try again. No penalties.'),
        boss.project ? h('li', icon('rocket', 16), 'After winning, you’ll write your capstone project plan to finish the level.') : null),
      h('div.hero-actions',
        P.bossBattleWon(s, lid) && boss.project && !P.bossWon(s, lid) ? h('button.btn.btn-primary.btn-lg', { onclick: () => project() }, icon('rocket', 18), 'Continue to the project plan') : null,
        h(`button.btn.btn-lg${P.bossBattleWon(s, lid) && boss.project && !P.bossWon(s, lid) ? '.btn-ghost' : '.btn-primary'}`, { onclick: () => round() }, icon('sword', 18), P.bossBattleWon(s, lid) ? 'Replay the battle' : 'Begin the battle')))));

  const round = () => {
    const q = qs[idx];
    const nextBtn = h('button.btn.btn-primary', { hidden: true, onclick: () => { idx++; idx < qs.length ? round() : end(); } }, idx === qs.length - 1 ? 'Finish the battle' : 'Next round', icon('arrow', 18));
    const hud = hpBar();
    const card = questionCard(q, {
      mode: 'boss', number: idx + 1, total: qs.length, seed: attemptNo * 31 + idx,
      onAnswer: (res, response) => {
        answers[idx] = { qid: q.id, correct: res.correct, response };
        const fresh = hpBar(); hud.replaceWith(fresh);
        if (res.correct) fresh.classList.add('hit');
        nextBtn.hidden = false; nextBtn.focus();
      },
    });
    page.replaceChildren(hud, card, h('div.q-nav', nextBtn));
  };

  const end = () => {
    const r = submitBossBattle(lid, { answers });
    if (!r.ok) { toast(r.reason, { kind: 'warn' }); return; }
    if (r.won) confetti();
    const nextLevel = LEVELS[level.num];
    page.replaceChildren(h('div.results',
      h(`div.result-hero${r.won ? '.pass' : '.fail'}`,
        h('div.score-ring', h('strong', `${r.hits}`), h('span', `of ${boss.toWin} hits`)),
        h('div', h('p.kicker', `Boss attempt ${attemptNo}`), h('h1', r.won ? `${boss.title} defeated!` : `${boss.title} survived`),
          h('p.lead', r.won
            ? (boss.project ? 'One last step: write your capstone project plan.' : P.isLevelComplete(getState(), level) && nextLevel ? `Level ${nextLevel.num}: ${nextLevel.region} is now unlocked.` : 'Victory saved to your progress.')
            : `You needed ${boss.toWin} hits. Read the explanations, review the related lessons, and try again.`))),
      h('div.hero-actions',
        r.won && boss.project ? h('button.btn.btn-primary', { onclick: () => project() }, icon('rocket', 18), 'Write the project plan') : null,
        r.won && !boss.project && nextLevel && P.isLevelComplete(getState(), level) ? h('a.btn.btn-primary', { href: `#/level/${nextLevel.id}` }, `Enter ${nextLevel.region}`, icon('arrow', 18)) : null,
        !r.won ? h('button.btn.btn-primary', { onclick: () => refresh() }, icon('rotate', 18), 'Try again') : null,
        h('a.btn.btn-ghost', { href: `#/level/${lid}` }, 'Back to level'))));
    window.scrollTo(0, 0);
  };

  const project = () => {
    const pr = boss.project;
    const saved = getState().bosses[lid]?.project || getState().bosses[lid]?.draft || {};
    const vals = { ...saved };
    const status = h('p.small', { 'aria-live': 'polite' });
    const fields = pr.fields.map((f) => {
      const counter = h('span.small.muted');
      const ta = h('textarea', { id: `pf-${f.id}`, rows: 4, 'aria-describedby': `pf-${f.id}-hint` });
      ta.value = vals[f.id] || '';
      const upd = () => { const n = wordCount(ta.value); counter.textContent = `${n}/${f.minWords} words minimum`; counter.classList.toggle('ok', n >= f.minWords); };
      ta.addEventListener('input', () => { vals[f.id] = ta.value; upd(); saveProjectDraft(lid, vals); status.textContent = 'Draft saved.'; });
      upd();
      return h('div.field', h('label', { for: `pf-${f.id}` }, f.label), h('p.small.muted', { id: `pf-${f.id}-hint` }, f.hint), ta, counter);
    });
    page.replaceChildren(h('div.project',
      h('a.back', { href: `#/level/${lid}` }, icon('back', 16), `Level ${level.num}: ${level.region}`),
      h('p.kicker', h('span.tag.tag-boss', icon('rocket', 12), 'Capstone project')),
      h('h1', 'Your capstone project plan'),
      h('p.lead', pr.brief),
      h('form.project-form', { onsubmit: (e) => {
        e.preventDefault();
        const r = submitProject(lid, vals);
        if (!r.ok) { status.textContent = r.reason; toast(r.reason, { kind: 'warn', iconName: 'info' }); return; }
        confetti();
        page.replaceChildren(h('div.results', h('div.result-hero.pass', h('div.score-ring', icon('trophy', 36)), h('div', h('h1', 'Capstone plan submitted'), h('p.lead', 'This plan is saved in your progress report and export — use it as the outline for your portfolio project README.'))),
          h('div.hero-actions', h('a.btn.btn-primary', { href: '#/report' }, 'See my progress report', icon('arrow', 18)), h('a.btn.btn-ghost', { href: `#/level/${lid}` }, 'Back to level'))));
      } }, fields, status, h('div.hero-actions', h('button.btn.btn-primary.btn-lg', { type: 'submit' }, icon('check', 18), 'Submit project plan')))));
  };

  intro();
  return page;
}
