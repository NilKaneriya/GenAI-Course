import { h, icon, md, mdEl, toast, statusPill, highlight, shuffleWithSeed } from '../ui.js';
import * as P from '../progression.js';
import { getState, recordChallengeRun, recordPredict, useHint, revealSolution, saveDraft, playgroundRun } from '../store.js';
import { LEVELS, getChallenge, getLevel, getMission } from '../data/curriculum.js';
import { SNIPPETS } from '../data/snippets.js';
import { CONFIG } from '../data/config.js';
import { createEditor } from '../components/editor.js';
import { runJavaScript, explainError } from '../components/runner.js';
import { openMentor } from './mentorPanel.js';

export function renderPlayground([id], { refresh }) {
  const s = getState();
  const challenge = id && id.startsWith('c-') ? getChallenge(id) : null;
  const snippet = !challenge ? SNIPPETS.find((x) => x.id === id) || SNIPPETS[0] : null;

  const list = h('nav.pg-list', { 'aria-label': 'Challenges and examples' },
    h('h2', 'Coding challenges'),
    LEVELS.filter((l) => (l.challenges || []).length).map((l) => {
      const unlocked = P.isLevelUnlocked(s, l);
      return h('div.pg-group', h('h3', `Level ${l.num} · ${l.region}`), h('ul', l.challenges.map((c) => {
        const passed = P.challengePassed(s, c.id);
        return h(`li${challenge?.id === c.id ? '.active' : ''}`, unlocked
          ? h('a', { href: `#/playground/${c.id}`, 'aria-current': challenge?.id === c.id ? 'page' : null }, h('span.lang-tag', c.lang === 'python' ? 'PY' : 'JS'), h('span', c.title), passed ? icon('check', 16, 'ok-icon') : null)
          : h('span.locked-item', icon('lock', 14), h('span', c.title)));
      })));
    }),
    h('h2', 'Free play examples'),
    h('ul.pg-snippets', SNIPPETS.map((x) => h(`li${snippet?.id === x.id ? '.active' : ''}`, h('a', { href: `#/playground/${x.id}` }, h('span.lang-tag', x.lang === 'python' ? 'PY' : 'JS'), h('span', x.title))))));

  const main = challenge
    ? (P.isLevelUnlocked(s, getLevel(challenge.levelId)) ? (challenge.kind === 'predict' ? predictView(challenge, refresh) : codeChallengeView(challenge, refresh)) : h('div.locked-panel.small-lock', h('div', h('p.kicker', icon('lock', 14), 'Locked challenge'), h('h1', challenge.title), h('p.lead', P.unlockExplanation(s, getLevel(challenge.levelId))))))
    : freePlayView(snippet);

  return h('section.page.playground', { 'data-title': challenge ? challenge.title : 'Playground' },
    h('header.page-head.compact', h('p.kicker', 'Coding playground'), h('h1', challenge ? challenge.title : 'Experiment with code'),
      h('p.small.muted', h('strong', 'JavaScript runs for real '), 'in a sandboxed worker (no network, 2-second limit). ', h('strong', 'Python is simulated: '), 'the browser can’t run it, so you see recorded outputs and predict-the-output challenges.')),
    h('div.pg-layout', list, h('div.pg-main', main)));
}

function outputPanel() {
  const el = h('div.output', { role: 'log', 'aria-live': 'polite', 'aria-label': 'Output' }, h('p.muted.small', 'Output appears here when you run your code.'));
  return el;
}

function renderRun(out, res, { showTests = true } = {}) {
  const kids = [];
  kids.push(h('p.out-meta', res.error ? h('span.bad', icon('x', 14), 'Error') : h('span.ok', icon('check', 14), 'Ran successfully'), h('span.muted', ` · executed in your browser${res.ms != null ? ` · ${res.ms} ms` : ''}`)));
  if (res.logs?.length) kids.push(h('pre.console', res.logs.map((l) => h(`span.log-${l.kind}`, l.text + '\n'))));
  if (res.error) kids.push(h('div.fb.fb-bad', h('p.fb-head.bad', `${res.error.name}${res.error.line ? ` (line ${res.error.line})` : ''}: ${res.error.message}`), h('p.small', explainError(res.error))));
  if (showTests && res.tests?.length) {
    const passed = res.tests.filter((t) => t.pass).length;
    kids.push(h('h4', `Tests: ${passed}/${res.tests.length} passed`));
    kids.push(h('ul.test-results', res.tests.map((t) => h(`li.${t.pass ? 'ok' : 'bad'}`,
      icon(t.pass ? 'check' : 'x', 14), h('code', t.call),
      t.pass ? h('span.muted', ` → ${t.got}`) : h('span', t.error ? ` threw: ${t.error}` : ` expected ${t.expect}, got ${t.got}`),
      !t.pass && t.returnedUndefined ? h('p.small.muted', 'Your function returned undefined — did you forget a return statement?') : null))));
  }
  if (!res.logs?.length && !res.error && !res.tests?.length) kids.push(h('p.muted.small', 'No output. Use console.log(...) to print values.'));
  out.replaceChildren(...kids);
}

function codeChallengeView(c, refresh) {
  const s = getState();
  const rec = s.challenges[c.id] || {};
  const mission = getMission(c.missionId);
  const out = outputPanel();
  const editor = createEditor({ value: rec.code || c.starter, lang: 'javascript', label: `${c.title} code`, onChange: (v) => saveDraft(c.id, v) });
  const hintBox = h('div.hints', { 'aria-live': 'polite' });
  const solBox = h('div');
  let running = false;

  const renderHints = () => {
    const r = getState().challenges[c.id] || {};
    const shown = Math.min(r.hintsUsed || 0, c.hints.length);
    const failed = r.failedRuns || 0;
    const canReveal = P.challengePassed(getState(), c.id) || failed >= CONFIG.revealSolutionAfterFailedRuns;
    hintBox.replaceChildren(
      ...c.hints.slice(0, shown).map((t, i) => h('div.hint', h('strong', `Hint ${i + 1}: `), h('span', { html: md(t).replace(/<\/?p>/g, '') }))),
      h('div.hint-actions',
        shown < c.hints.length ? h('button.btn.btn-small.btn-ghost', { onclick: () => { useHint(c.id); renderHints(); } }, icon('bulb', 16), shown ? 'Another hint' : 'Get a hint') : null,
        h('button.btn.btn-small.btn-ghost', { onclick: () => openMentor('Give me a hint for this challenge') }, icon('chat', 16), 'Ask the mentor'),
        r.revealed || P.challengePassed(getState(), c.id)
          ? h('button.btn.btn-small.btn-ghost', { onclick: () => showSolution() }, icon('eye', 16), 'Show solution')
          : h('button.btn.btn-small.btn-ghost', { disabled: !canReveal, title: canReveal ? '' : `Available after ${CONFIG.revealSolutionAfterFailedRuns} failed runs`, onclick: () => { revealSolution(c.id); showSolution(); renderHints(); } }, icon('eye', 16), canReveal ? 'Reveal solution' : `Solution unlocks after ${CONFIG.revealSolutionAfterFailedRuns} tries`)));
  };
  const showSolution = () => solBox.replaceChildren(h('div.solution', h('h4', 'Reference solution'), h('pre.code-block', h('code', { html: highlight(c.solution, 'javascript') })), h('p.small.muted', 'Compare it with yours. Revealing the solution never takes away XP — but try one more time before peeking.')));

  const run = async (withTests) => {
    if (running) return;
    running = true;
    out.replaceChildren(h('p.muted', h('span.spinner'), ' Running…'));
    const res = await runJavaScript(editor.getValue(), withTests ? c.tests : []);
    running = false;
    renderRun(out, res, { showTests: withTests });
    if (withTests) {
      const passed = !res.error && res.tests.every((t) => t.pass);
      const was = P.challengePassed(getState(), c.id);
      recordChallengeRun(c.id, { passed, code: editor.getValue() });
      if (passed && !was) out.prepend(h('div.fb.fb-ok', h('p.fb-head.ok', icon('trophy', 18), 'All tests pass — challenge complete!')));
      renderHints();
      statusEl.replaceChildren(P.challengePassed(getState(), c.id) ? statusPill('completed', 'Passed') : statusPill('in-progress', `${(getState().challenges[c.id]?.attempts) || 0} runs`));
    } else playgroundRun();
  };

  const statusEl = h('span', P.challengePassed(s, c.id) ? statusPill('completed', 'Passed') : rec.attempts ? statusPill('in-progress', `${rec.attempts} runs`) : h('span.tag', 'Optional · +75 XP'));
  renderHints();
  if (rec.revealed) showSolution();

  return h('div.challenge',
    h('div.challenge-head', h('span.lang-tag', 'JavaScript · runs for real'), statusEl, mission ? h('a.small', { href: `#/lesson/${mission.id}` }, `Related lesson: ${mission.title}`) : null),
    mdEl(c.prompt),
    editor.el,
    h('div.pg-actions',
      h('button.btn.btn-primary', { onclick: () => run(true) }, icon('check', 16), 'Run tests'),
      h('button.btn.btn-ghost', { onclick: () => run(false) }, icon('play', 16), 'Run only'),
      h('button.btn.btn-ghost', { onclick: () => { if (confirm('Reset the editor to the starter code? Your current code will be replaced.')) { editor.setValue(c.starter); out.replaceChildren(h('p.muted.small', 'Editor reset.')); } } }, icon('reset', 16), 'Reset'),
      h('button.btn.btn-ghost', { onclick: () => copy(editor.getValue()) }, icon('copy', 16), 'Copy code')),
    out, hintBox, solBox);
}

function predictView(c, refresh) {
  const s = getState();
  const rec = s.challenges[c.id] || {};
  const passed = P.challengePassed(s, c.id);
  const fb = h('div', { 'aria-live': 'polite' });
  const hintBox = h('div.hints');
  const order = shuffleWithSeed(c.options, 7 + c.id.length);
  const name = `pred-${c.id}`;
  const renderHints = () => {
    const shown = Math.min((getState().challenges[c.id]?.hintsUsed) || 0, c.hints.length);
    hintBox.replaceChildren(...c.hints.slice(0, shown).map((t, i) => h('div.hint', h('strong', `Hint ${i + 1}: `), t)),
      shown < c.hints.length ? h('button.btn.btn-small.btn-ghost', { onclick: () => { useHint(c.id); renderHints(); } }, icon('bulb', 16), 'Get a hint') : null);
  };
  renderHints();
  const form = h('form.question-form', { onsubmit: (e) => {
    e.preventDefault();
    const v = form.querySelector(`input[name="${name}"]:checked`)?.value;
    if (v == null) { fb.replaceChildren(h('p.hint-text', 'Choose an answer first.')); return; }
    const ok = Number(v) === c.answer;
    recordPredict(c.id, ok);
    form.querySelectorAll('.option').forEach((el) => { el.classList.toggle('is-wrong', !ok && el.dataset.index === v); el.classList.toggle('is-correct', ok && Number(el.dataset.index) === c.answer); });
    fb.replaceChildren(h(`div.fb.${ok ? 'fb-ok' : 'fb-bad'}`, h(`p.fb-head.${ok ? 'ok' : 'bad'}`, icon(ok ? 'check' : 'x', 18), ok ? 'Correct — challenge complete!' : 'Not quite. Trace the code line by line and try again.'), ok ? h('div.prose.small', { html: md(c.explain) }) : null));
  } },
  h('fieldset.options', h('legend', 'What does this code print?'), order.map(({ v, i }, k) => h('label.option', { 'data-index': i }, h('input', { type: 'radio', name, value: i }), h('span.option-key', String.fromCharCode(65 + k)), h('pre.option-text.mono', v)))),
  h('div.q-actions', h('button.btn.btn-primary', { type: 'submit' }, 'Check my prediction')));
  return h('div.challenge',
    h('div.challenge-head', h('span.lang-tag.sim', 'Python · predict the output'), passed ? statusPill('completed', 'Passed') : rec.attempts ? statusPill('in-progress', `${rec.attempts} tries`) : h('span.tag', 'Optional · +75 XP')),
    mdEl(c.prompt),
    h('pre.code-block', { 'data-lang': 'python' }, h('code', { html: highlight(c.code, 'python') })),
    h('p.small.muted', 'Python cannot execute in this browser prototype, so this challenge checks your reasoning instead of running code.'),
    form, fb, hintBox);
}

function freePlayView(sn) {
  const out = outputPanel();
  const editor = createEditor({ value: sn.code, lang: sn.lang, label: `${sn.title} code` });
  const run = async () => {
    if (sn.lang === 'python') {
      const edited = editor.getValue().trim() !== sn.code.trim();
      out.replaceChildren(
        h('p.out-meta', h('span.sim-label', icon('info', 14), 'Simulated output'), h('span.muted', ' · recorded from running the original snippet in real Python')),
        h('pre.console', sn.output),
        edited ? h('div.fb.fb-bad', h('p.small', h('strong', 'Your edits were not executed. '), 'Python does not run in this browser prototype, so the output above is for the original snippet. To run your version, copy it into a local Python environment.')) : null);
      playgroundRun();
      return;
    }
    out.replaceChildren(h('p.muted', h('span.spinner'), ' Running…'));
    const res = await runJavaScript(editor.getValue(), []);
    renderRun(out, res, { showTests: false });
    playgroundRun();
  };
  return h('div.challenge',
    h('div.challenge-head', h(`span.lang-tag${sn.lang === 'python' ? '.sim' : ''}`, sn.lang === 'python' ? 'Python · simulated output' : 'JavaScript · runs for real'), h('strong', sn.title)),
    editor.el,
    h('div.pg-actions',
      h('button.btn.btn-primary', { onclick: run }, icon('play', 16), sn.lang === 'python' ? 'Show simulated output' : 'Run'),
      h('button.btn.btn-ghost', { onclick: () => { editor.setValue(sn.code); out.replaceChildren(h('p.muted.small', 'Editor reset.')); } }, icon('reset', 16), 'Reset'),
      h('button.btn.btn-ghost', { onclick: () => copy(editor.getValue()) }, icon('copy', 16), 'Copy code')),
    out);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('Code copied to clipboard', { iconName: 'copy' }); }
  catch { toast('Copy failed — select the code and press Ctrl+C', { kind: 'warn' }); }
}
