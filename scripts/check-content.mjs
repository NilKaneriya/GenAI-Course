// Validates every curriculum level against docs/CONTENT_SCHEMA.md and the app grading rules. Run: npm run check
const root = new URL('../public/js/', import.meta.url).href;
const VIS = ['promptFlow', 'tokens', 'trainInfer', 'gradient', 'nnLayers', 'attention', 'embeddings', 'vectorSearch', 'ragPipeline', 'toolCalling', 'structuredOutput', 'evalCheck', 'streaming'];
const SK = ['foundations', 'python', 'ml', 'deep-learning', 'llms', 'prompting', 'structured-output', 'apis', 'embeddings', 'rag', 'tools', 'evaluation', 'safety', 'deployment', 'career'];
const norm = (t) => String(t || '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ');
const gradeShort = (q, r) => { const text = norm(r); const w = text.split(' ').filter(Boolean).length; const m = q.keywords.filter((g) => g.some((k) => text.includes(norm(k)))).length; return w >= 3 && m >= q.min; };
const deepEq = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEq(x, b[i]));
  if (a && b && typeof a === 'object' && typeof b === 'object') { const ka = Object.keys(a).filter((k) => a[k] !== undefined), kb = Object.keys(b).filter((k) => b[k] !== undefined); return ka.length === kb.length && kb.every((k) => deepEq(a[k], b[k])); }
  return a === b;
};
const problems = [];
const ids = new Set();
const P = (lvl, msg) => problems.push(`${lvl}: ${msg}`);
const answerPos = {};
for (let n = 1; n <= 10; n++) {
  const f = `level${String(n).padStart(2, '0')}.js`;
  const l = (await import(root + 'data/levels/' + f)).default;
  const L = l.id;
  if (l.id !== `l${n}` || l.num !== n) P(L, 'bad id/num');
  for (const k of ['title', 'region', 'tagline', 'overview']) if (!l[k]) P(L, `missing ${k}`);
  if (!l.objectives?.length) P(L, 'no objectives');
  (l.skills || []).forEach((s) => SK.includes(s) || P(L, `unknown skill ${s}`));
  const mids = l.missions.map((m) => m.id);
  const cids = (l.challenges || []).map((c) => c.id);
  const checkQ = (q, where, scope) => {
    if (ids.has(q.id)) P(L, `duplicate id ${q.id}`); ids.add(q.id);
    if (!q.q || !q.explain) P(L, `${q.id} missing q/explain`);
    if (!mids.includes(q.topic)) P(L, `${q.id} topic ${q.topic} not a mission`);
    if (q.type === 'mc') {
      if (!Array.isArray(q.options) || q.options.length < 2) P(L, `${q.id} options`);
      if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < q.options.length)) P(L, `${q.id} answer index`);
      if (scope) { answerPos[scope] = answerPos[scope] || [0, 0, 0, 0, 0, 0]; answerPos[scope][q.answer]++; }
    } else if (q.type === 'short') {
      if (!q.keywords?.length || !q.min || !q.sample) P(L, `${q.id} short fields`);
      else if (!gradeShort(q, q.sample)) P(L, `${q.id} sample fails own grading`);
      if (q.min > q.keywords?.length) P(L, `${q.id} min > groups`);
    } else P(L, `${q.id} bad type ${q.type}`);
  };
  for (const m of l.missions) {
    if (ids.has(m.id)) P(L, `dup mission ${m.id}`); ids.add(m.id);
    for (const k of ['title', 'goal', 'minutes', 'skill']) if (!m[k]) P(L, `${m.id} missing ${k}`);
    if (!SK.includes(m.skill)) P(L, `${m.id} unknown skill ${m.skill}`);
    if (m.visual && !VIS.includes(m.visual)) P(L, `${m.id} unknown visual ${m.visual}`);
    if (!m.sections?.length) P(L, `${m.id} no sections`);
    if (!m.check?.length) P(L, `${m.id} no check questions`);
    (m.check || []).forEach((q) => checkQ(q, m.id));
    if (m.challengeId && !cids.includes(m.challengeId)) P(L, `${m.id} challengeId ${m.challengeId} missing`);
    if (m.example && (!m.example.code || !m.example.lang)) P(L, `${m.id} example incomplete`);
  }
  if (l.test.questions.length !== 8) P(L, `test has ${l.test.questions.length} questions`);
  l.test.questions.forEach((q) => checkQ(q, 'test', `${L}-test`));
  if (l.boss) {
    if (l.boss.questions.length !== l.boss.hp) P(L, 'boss hp != questions');
    if (!(l.boss.toWin <= l.boss.questions.length)) P(L, 'boss toWin');
    l.boss.questions.forEach((q) => checkQ(q, 'boss', `${L}-boss`));
    if (l.boss.project) l.boss.project.fields.forEach((f) => (f.id && f.label && f.minWords) || P(L, 'project field incomplete'));
  }
  for (const c of l.challenges || []) {
    if (!SK.includes(c.skill)) P(L, `${c.id} unknown skill ${c.skill}`);
    if (!mids.includes(c.missionId)) P(L, `${c.id} missionId ${c.missionId}`);
    if (c.levelId !== L) P(L, `${c.id} levelId`);
    if (c.kind === 'code') {
      try {
        const res = new Function('"use strict";\n' + c.solution + '\n;return [' + c.tests.map((t) => t.call).join(',') + '];')();
        res.forEach((v, i) => deepEq(v, c.tests[i].expect) || P(L, `${c.id} test ${i} ${c.tests[i].call} expected ${JSON.stringify(c.tests[i].expect)} got ${JSON.stringify(v)}`));
      } catch (e) { P(L, `${c.id} solution threw ${e.message}`); }
      try { new Function('"use strict";\nconst console={log(){}};\n' + c.starter)(); } catch (e) { P(L, `${c.id} starter throws: ${e.message}`); }
      if (!c.hints?.length) P(L, `${c.id} no hints`);
    } else if (c.kind === 'predict') {
      if (!(c.answer >= 0 && c.answer < c.options.length)) P(L, `${c.id} answer`);
    } else P(L, `${c.id} bad kind`);
  }
  (l.review || []).forEach((r) => mids.includes(r.missionId) || P(L, `review ${r.missionId}`));
  const words = l.missions.flatMap((m) => m.sections.map((s) => s.body.split(/\s+/).length));
  console.log(`${L} ${l.region}: ${l.missions.length} missions, max section ${Math.max(...words)} words, visuals: ${l.missions.map((m) => m.visual).filter(Boolean).join(',') || '-'}`);
}
console.log('answer positions:', JSON.stringify(answerPos));
console.log(problems.length ? 'PROBLEMS:\n' + problems.join('\n') : 'ALL CHECKS PASSED');
