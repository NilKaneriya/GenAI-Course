// Question rendering + grading shared by practice checks, level tests and boss battles.
import { h, icon, md, shuffleWithSeed } from '../ui.js';

const norm = (t) => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');

/** Returns { correct, matched, needed } */
export function grade(q, response) {
  if (q.type === 'mc') return { correct: Number(response) === q.answer };
  const text = norm(response);
  const words = text.split(' ').filter(Boolean).length;
  const matched = q.keywords.filter((group) => group.some((k) => text.includes(norm(k)))).length;
  return { correct: words >= 3 && matched >= q.min, matched, needed: q.min, tooShort: words < 3 };
}

/**
 * Render one question.
 * opts.mode: 'practice' (retry allowed) | 'test' (one answer, immediate feedback) | 'boss'
 * opts.onAnswer(result, response) — called after each submission
 * opts.seed — option shuffle seed (so the correct answer is not always in the same place)
 * opts.prior — { correct, response } to show an already-answered state
 */
export function questionCard(q, opts = {}) {
  const { mode = 'practice', onAnswer, seed = 1, number, total, prior } = opts;
  const name = `q-${q.id}-${seed}`;
  const order = q.type === 'mc' ? shuffleWithSeed(q.options, seed + q.id.length * 7) : [];
  let locked = false;

  const feedback = h('div.feedback', { 'aria-live': 'polite' });
  const submitBtn = h('button.btn.btn-primary', { type: 'submit' }, mode === 'practice' ? 'Check answer' : 'Submit answer');
  let input;

  const body = q.type === 'mc'
    ? h('fieldset.options', h('legend.sr-only', 'Choose one answer'),
      order.map(({ v, i }, idx) => h('label.option', { 'data-index': i },
        h('input', { type: 'radio', name, value: i }),
        h('span.option-key', String.fromCharCode(65 + idx)),
        h('span.option-text', v))))
    : h('div.short',
      h('label.sr-only', { for: name }, 'Your answer'),
      (input = h('textarea', { id: name, rows: 3, placeholder: 'Answer in your own words (one or two sentences)…', 'aria-describedby': `${name}-help` })),
      h('p.muted.small', { id: `${name}-help` }, 'Short answers are checked for the key ideas, not exact wording.'));

  const form = h('form.question-form', {
    onsubmit: (e) => {
      e.preventDefault();
      if (locked) return;
      const response = q.type === 'mc' ? form.querySelector(`input[name="${name}"]:checked`)?.value : input.value;
      if (response == null || (q.type === 'short' && !response.trim())) {
        feedback.replaceChildren(h('p.hint-text', icon('info', 16), q.type === 'mc' ? 'Choose an answer first.' : 'Write an answer first.'));
        return;
      }
      const result = grade(q, response);
      show(result, response);
      onAnswer?.(result, q.type === 'mc' ? Number(response) : response);
    },
  }, body, h('div.q-actions', submitBtn), feedback);

  function show(result, response) {
    const { correct } = result;
    if (q.type === 'mc') {
      form.querySelectorAll('.option').forEach((el) => {
        const i = Number(el.dataset.index);
        el.classList.toggle('is-correct', i === q.answer && (correct || mode !== 'practice'));
        el.classList.toggle('is-wrong', !correct && i === Number(response));
      });
    }
    const lockAll = mode !== 'practice' || correct;
    if (lockAll) {
      locked = true;
      form.querySelectorAll('input, textarea').forEach((el) => { el.disabled = true; });
      submitBtn.hidden = true;
    }
    const head = correct
      ? h('p.fb-head.ok', icon('check', 18), mode === 'boss' ? 'Direct hit!' : 'Correct')
      : h('p.fb-head.bad', icon('x', 18), result.tooShort ? 'Too short to grade — add a full sentence.' : mode === 'practice' ? 'Not quite — rethink it and try again. The full explanation appears once you get it.' : 'Not correct');
    const parts = [head];
    if (!correct && q.type === 'short' && !result.tooShort) parts.push(h('p.small', `Your answer covered ${result.matched} of the ${q.min} key ideas needed.`));
    if (correct || mode !== 'practice') {
      parts.push(h('div.prose.small', { html: md(q.explain) }));
      if (q.type === 'short') parts.push(h('div.sample', h('strong', 'Model answer: '), q.sample));
    } else {
      parts.push(h('div.prose.small', { html: md(q.type === 'mc' ? 'Hint: ask yourself *why* the option you picked fails, or re-read the section this question is about.' : 'Hint: name the core concepts explicitly, in a full sentence.') }));
    }
    feedback.replaceChildren(h(`div.fb.${correct ? 'fb-ok' : 'fb-bad'}`, parts));
  }

  if (prior) {
    if (q.type === 'mc') { const r = form.querySelector(`input[value="${prior.response}"]`); if (r) r.checked = true; }
    else if (input) input.value = prior.response || '';
    show(grade(q, prior.response), prior.response);
  }

  return h(`article.question.q-${mode}`, { 'data-qid': q.id },
    h('header.q-head',
      number ? h('span.q-num', total ? `Question ${number} of ${total}` : `Question ${number}`) : null,
      h('span.q-type', q.type === 'mc' ? 'Multiple choice' : 'Short answer'),
      mode === 'practice' ? h('span.tag.tag-practice', 'Practice — not graded') : mode === 'test' ? h('span.tag.tag-test', 'Required test') : h('span.tag.tag-boss', 'Boss battle')),
    h('h3.q-text', q.q),
    form);
}
