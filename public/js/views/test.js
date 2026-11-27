import { h, icon, progressBar, statusPill, confetti } from '../ui.js';
import * as P from '../progression.js';
import { getState, submitTest } from '../store.js';
import { getLevel, getQuestion, getMission, LEVELS } from '../data/curriculum.js';
import { questionCard } from '../components/question.js';
import { lockedPage, reviewList } from './level.js';
import { openMentor } from './mentorPanel.js';

export function renderTest([lid], { refresh }) {
  const s = getState();
  const level = getLevel(lid);
  if (!level) return h('section.page', h('h1', 'Test not found'));
  if (!P.isLevelUnlocked(s, level)) return lockedPage(s, level, `The Level ${level.num} test`);
  const page = h('section.page.test-page', { 'data-title': level.test.title });

  if (!P.testAvailable(s, level)) {
    const left = level.missions.filter((m) => !P.isMissionComplete(s, m.id));
    page.append(h('div.locked-panel.small-lock', h('div',
      h('p.kicker', icon('lock', 14), 'Required test · locked'), h('h1', level.test.title),
      h('p.lead', `Complete every lesson in ${level.region} first. ${left.length} remaining:`),
      h('ul', left.map((m) => h('li', h('a', { href: `#/lesson/${m.id}` }, m.title)))),
      h('a.btn.btn-primary', { href: `#/lesson/${left[0].id}` }, 'Go to the next lesson', icon('arrow', 18)))));
    return page;
  }

  const qs = level.test.questions;
  const attemptNo = P.testAttempts(s, lid).length + 1;
  const answers = [];
  let idx = 0;

  const intro = () => {
    const prev = P.lastAttempt(s, lid);
    page.replaceChildren(h('div.test-intro',
      h('a.back', { href: `#/level/${lid}` }, icon('back', 16), `Level ${level.num}: ${level.region}`),
      h('p.kicker', h('span.tag.tag-test', 'Required test'), ` Attempt ${attemptNo}`),
      h('h1', level.test.title),
      h('p.lead', level.test.intro),
      h('ul.rules',
        h('li', icon('target', 16), `${qs.length} questions — multiple choice and short answer`),
        h('li', icon('flag', 16), `Pass mark: ${P.threshold(s)}% (${Math.ceil((P.threshold(s) / 100) * qs.length)} of ${qs.length} correct)`),
        h('li', icon('bulb', 16), 'You see feedback and an explanation right after each answer'),
        h('li', icon('rotate', 16), 'Not passing is fine: review the suggested lessons and retry. Every attempt is saved.'),
        h('li', icon('info', 16), 'Leaving before the last question discards this attempt.')),
      prev && !prev.passed ? reviewList(s, level, prev.missedTopics) : null,
      h('div.hero-actions', h('button.btn.btn-primary.btn-lg', { onclick: () => question() }, 'Begin test', icon('arrow', 18)), h('a.btn.btn-ghost', { href: `#/level/${lid}` }, 'Not yet'))));
  };

  const question = () => {
    const q = qs[idx];
    const nextBtn = h('button.btn.btn-primary', { hidden: true, onclick: () => { idx++; idx < qs.length ? question() : finish(); } }, idx === qs.length - 1 ? 'See my results' : 'Next question', icon('arrow', 18));
    const card = questionCard(q, {
      mode: 'test', number: idx + 1, total: qs.length, seed: attemptNo * 97 + idx,
      onAnswer: (res, response) => { answers[idx] = { qid: q.id, correct: res.correct, response }; nextBtn.hidden = false; nextBtn.focus(); },
    });
    const correctSoFar = answers.filter((a) => a?.correct).length;
    page.replaceChildren(
      h('div.test-bar', h('span', `${level.test.title}`), h('span.small', `${idx} answered · ${correctSoFar} correct`), progressBar((idx / qs.length) * 100, { label: 'Test progress', cls: 'thin' })),
      card, h('div.q-nav', nextBtn));
    page.querySelector('.q-text')?.setAttribute('tabindex', '-1');
    page.querySelector('.q-text')?.focus();
  };

  const finish = () => {
    const before = P.isLevelComplete(getState(), level);
    const r = submitTest(lid, answers);
    if (!r.ok) { page.replaceChildren(h('p', r.reason)); return; }
    const a = r.attempt;
    const nextLevel = LEVELS[level.num];
    const nowComplete = P.isLevelComplete(getState(), level);
    if (a.passed) confetti();
    page.replaceChildren(h('div.results',
      h('div.result-hero' + (a.passed ? '.pass' : '.fail'),
        h('div.score-ring', h('strong', `${a.score}%`), h('span', `${a.correct}/${a.total}`)),
        h('div',
          h('p.kicker', `Attempt ${attemptNo} · pass mark ${a.threshold}%`),
          h('h1', a.passed ? 'Passed!' : 'Not passed yet'),
          h('p.lead', a.passed
            ? (level.boss && P.bossRequired(getState(), level) && !P.bossWon(getState(), lid) ? `Great work. One step left in ${level.region}: defeat the boss to unlock Level ${level.num + 1}.` : nowComplete && !before && nextLevel ? `Level ${nextLevel.num}: ${nextLevel.region} is now unlocked.` : 'Your result is saved to your progress report.')
            : `You need ${a.threshold}% to pass. Review the topics below, then retry — your best score is what counts.`))),
      !a.passed ? reviewList(getState(), level, a.missedTopics) : a.missedTopics.length ? h('p.small.muted', 'You passed — the questions you missed are still worth a quick review below.') : null,
      h('div.hero-actions',
        a.passed && level.boss && !P.bossWon(getState(), lid) ? h('a.btn.btn-primary', { href: `#/boss/${lid}` }, icon('sword', 18), 'Challenge the boss') : null,
        a.passed && nowComplete && nextLevel ? h('a.btn.btn-primary', { href: `#/level/${nextLevel.id}` }, `Enter ${nextLevel.region}`, icon('arrow', 18)) : null,
        !a.passed ? h('a.btn.btn-primary', { href: `#/lesson/${a.missedTopics[0] || level.missions[0].id}` }, icon('book', 18), 'Review the first topic') : null,
        !a.passed ? h('button.btn.btn-ghost', { onclick: () => refresh() }, icon('rotate', 18), 'Retry now') : null,
        h('button.btn.btn-ghost', { onclick: () => openMentor('Explain my last test') }, icon('chat', 18), 'Ask the mentor to explain'),
        h('a.btn.btn-ghost', { href: `#/level/${lid}` }, 'Back to level')),
      h('h2', 'Answer review'),
      h('ol.answer-review', a.answers.map((ans, i) => {
        const q = getQuestion(ans.qid);
        return h(`li.ar-item.${ans.correct ? 'ok' : 'bad'}`,
          h('div.ar-head', ans.correct ? statusPill('passed', 'Correct') : statusPill('failed', 'Incorrect'), h('span.small.muted', `Q${i + 1} · ${q.type === 'mc' ? 'Multiple choice' : 'Short answer'}`)),
          h('p', h('strong', q.q)),
          h('p.small', h('span.muted', 'Your answer: '), q.type === 'mc' ? q.options[ans.response] : ans.response),
          !ans.correct ? h('p.small', h('span.muted', 'Correct answer: '), q.type === 'mc' ? q.options[q.answer] : q.sample) : null,
          h('p.small', q.explain),
          !ans.correct ? h('a.small', { href: `#/lesson/${q.topic}` }, `Review: ${getMission(q.topic)?.title}`) : null);
      }))));
    window.scrollTo(0, 0);
  };

  intro();
  return page;
}
