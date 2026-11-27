// Mentor chatbot. Uses a real AI backend if /api/mentor is configured (see server.js);
// otherwise a rule-based SIMULATED mentor answers from the curriculum and saved progress.
import { CONFIG } from './data/config.js';
import { LEVELS, getLevel, getMission, getChallenge, getQuestion, allMissions, SKILLS } from './data/curriculum.js';
import * as P from './progression.js';

// ---------- learner context (also sent to a real backend) ----------
export function progressContext(s) {
  const c = P.courseCompletion(s);
  const r = P.rankInfo(P.totalXP(s));
  const lvl = P.currentLevel(s);
  const next = P.nextAction(s);
  const { strengths, gaps } = P.strengthsAndGaps(s);
  return {
    learner: s.profile.name,
    passThreshold: P.threshold(s),
    xp: P.totalXP(s), rank: r.rank.name, nextRank: r.next?.name || null, xpToNextRank: r.toNext,
    completionPct: c.pct, lessonsDone: c.lessons, lessonsTotal: c.totalLessons, levelsCleared: c.levelsCleared,
    currentLevel: { num: lvl.num, title: lvl.title, region: lvl.region, status: P.levelStatus(s, lvl) },
    nextStep: next.label,
    levels: LEVELS.map((l) => ({ num: l.num, title: l.title, status: P.levelStatus(s, l), lessonsDone: P.missionsDone(s, l), lessons: l.missions.length, bestTest: P.bestScore(s, l.id) < 0 ? null : P.bestScore(s, l.id), attempts: P.testAttempts(s, l.id).length })),
    tests: P.allTestAttempts(s).map((a) => ({ level: a.levelNum, date: a.date.slice(0, 10), score: a.score, passed: a.passed, missed: a.missedTopics.map((m) => getMission(m)?.title) })),
    strengths: strengths.map((x) => `${x.label} (${x.accuracy}%)`),
    needsWork: gaps.map((x) => `${x.label} (${x.accuracy}%)`),
    weakTopics: P.weakTopics(s).map((w) => w.mission.title),
    streakDays: P.streak(s).count,
  };
}

// ---------- backend detection ----------
let backend = null; // null = unknown, false = simulated, { provider } = live
export async function detectBackend() {
  if (backend !== null) return backend;
  try {
    const res = await fetch(`${CONFIG.mentorEndpoint}/status`, { headers: { Accept: 'application/json' } });
    const data = res.ok ? await res.json() : null;
    backend = data?.configured ? { provider: data.provider || 'AI provider' } : false;
  } catch { backend = false; }
  return backend;
}

export async function askMentor(s, text, history, context = {}) {
  const b = await detectBackend();
  if (b) {
    try {
      const res = await fetch(CONFIG.mentorEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: history.slice(-12).map((m) => ({ role: m.role, text: m.text })), progress: progressContext(s), page: context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { text: data.reply, simulated: false };
    } catch (e) {
      return { text: `${simulate(s, text, context)}\n\n*(The live AI backend did not respond — ${e.message}. This reply is simulated.)*`, simulated: true };
    }
  }
  await new Promise((r) => setTimeout(r, 450 + Math.random() * 500)); // natural typing delay
  return { text: simulate(s, text, context), simulated: true };
}

// ---------- simulated mentor ----------
const has = (t, ...words) => words.some((w) => t.includes(w));
const link = (href, label) => `[${label}](${href})`;

function termIndex() {
  const idx = [];
  for (const m of allMissions()) {
    for (const t of m.terms || []) idx.push({ key: t.term.toLowerCase(), term: t.term, def: t.def, mission: m });
    idx.push({ key: m.title.toLowerCase(), term: m.title, def: m.goal, mission: m, isTitle: true });
  }
  return idx;
}
let TERMS;

function findConcept(t) {
  TERMS = TERMS || termIndex();
  const words = t.replace(/[^a-z0-9\s-]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
  let best = null, bestScore = 0;
  for (const e of TERMS) {
    let score = 0;
    if (t.includes(e.key)) score += 10 + e.key.length / 4;
    const kw = e.key.split(/[\s/()-]+/).filter((w) => w.length > 2);
    score += kw.filter((w) => words.some((x) => x === w || x.startsWith(w) || w.startsWith(x))).length * 2;
    if (e.isTitle) score -= 1;
    if (score > bestScore) { bestScore = score; best = e; }
  }
  return bestScore >= 4 ? best : null;
}

export function simulate(s, raw, ctx = {}) {
  const t = raw.toLowerCase().trim();
  const pc = progressContext(s);
  const next = P.nextAction(s);
  const weak = P.weakTopics(s);
  const { strengths, gaps } = P.strengthsAndGaps(s);

  // Hints for the challenge the learner is looking at — never the full answer.
  if (has(t, 'hint', 'stuck', 'help me with this', 'challenge') && ctx.challengeId) {
    const c = getChallenge(ctx.challengeId);
    const used = s.challenges[c.id]?.hintsUsed || 0;
    const hint = c.hints[Math.min(used, c.hints.length - 1)];
    return `Here’s a nudge for **${c.title}** (I won’t give the full solution):\n\n- ${hint}\n- Re-read the task and list the inputs and the exact value each function must return.\n- Run your code and compare *got* vs *expected* for the first failing test — the difference usually tells you what to change.\n\nThe lesson ${link(`#/lesson/${c.missionId}`, getMission(c.missionId)?.title || 'for this challenge')} has the background.`;
  }

  if (has(t, 'hint', 'answer to', 'solution')) {
    return `I give hints rather than answers — working it out is what makes it stick. Open a coding challenge from the ${link('#/playground', 'Playground')} and ask me for a hint there, or tell me which concept is confusing and I’ll explain it.`;
  }

  // Wrong answers / last test
  if (has(t, 'wrong', 'incorrect', 'missed', 'failed', 'fail', 'why did i', 'explain my test', 'test result', 'last test')) {
    const last = P.allTestAttempts(s).at(-1);
    if (!last) return `You haven’t taken an end-of-level test yet. Finish the lessons in **${pc.currentLevel.title}**, then the test unlocks. Practice questions inside lessons don’t affect unlocking, so they’re a safe place to make mistakes.`;
    const level = getLevel(last.levelId);
    const wrong = last.answers.filter((a) => !a.correct).map((a) => getQuestion(a.qid)).filter(Boolean);
    if (!wrong.length) return `Your latest test — **${level.test.title}** — was a perfect ${last.score}%. Nothing to fix there. ${next.type !== 'done' ? `Next up: ${link(next.href, next.label)}.` : ''}`;
    const lines = wrong.slice(0, 4).map((q) => `- **${q.q}**\n  ${q.explain}\n  Review: ${link(`#/lesson/${q.topic}`, getMission(q.topic)?.title || q.topic)}`);
    return `In your latest attempt at **${level.test.title}** (${new Date(last.date).toLocaleDateString()}) you scored **${last.score}%** — ${last.passed ? 'a pass' : `below the ${last.threshold}% pass mark`}. Here’s what went wrong and where to review:\n\n${lines.join('\n')}\n\n${last.passed ? 'You passed, but these are worth a quick revisit.' : 'Review those lessons, redo their practice questions, then retry — every attempt is saved, and only passing unlocks the next level.'}`;
  }

  // Struggling
  if (has(t, 'struggl', 'weak', 'bad at', 'improve', 'need work', 'gaps', 'where am i')) {
    if (!weak.length && !gaps.length) return `Good news: I don’t see a weak spot yet. ${strengths.length ? `You’re strongest in **${strengths.map((x) => x.label).join(', ')}**.` : 'You haven’t answered enough questions yet for a reliable picture — keep going and ask me again.'}\n\nNext step: ${link(next.href, next.label)}.`;
    const wl = weak.map((w) => `- ${link(`#/lesson/${w.mission.id}`, w.mission.title)} (Level ${getLevel(w.mission.levelId).num})`).join('\n');
    const gl = gaps.map((g) => `**${g.label}** at ${g.accuracy}%`).join(', ');
    return `Based on your saved answers, here’s where to focus:\n\n${gaps.length ? `Skills below 75% accuracy: ${gl}.\n\n` : ''}${weak.length ? `Topics you missed most recently:\n${wl}\n\n` : ''}Suggested routine: reopen the first topic, replay its interactive visual, then redo its practice questions until you can explain *why* each answer is right. That’s worth more than retaking a test straight away.`;
  }

  // Strengths
  if (has(t, 'good at', 'strength', 'doing well', 'best at')) {
    if (!strengths.length) return `I need a few more answers before calling anything a strength (I count a skill once you have at least 3 graded answers at 80%+). So far: ${pc.lessonsDone} lessons complete.`;
    return `You’re doing well in **${strengths.map((x) => `${x.label} (${x.accuracy}%)`).join(', ')}**. That’s a solid base — those skills feed directly into the later levels.`;
  }

  // Next step / plan
  if (has(t, 'next', 'what should i', 'study plan', 'plan', 'recommend', 'today', 'where do i start', 'continue')) {
    const quick = weak[0] ? `\n\nIf you have 10 extra minutes, review ${link(`#/lesson/${weak[0].mission.id}`, weak[0].mission.title)} — it’s your most-missed topic.` : '';
    if (has(t, 'plan', 'week')) {
      const lvl = P.currentLevel(s);
      const remaining = lvl.missions.filter((m) => !P.isMissionComplete(s, m.id));
      const mins = remaining.reduce((tt, m) => tt + m.minutes, 0);
      return `Here’s a realistic plan for **Level ${lvl.num}: ${lvl.title}**:\n\n${remaining.map((m, i) => `${i + 1}. ${link(`#/lesson/${m.id}`, m.title)} — about ${m.minutes} min`).join('\n')}\n${remaining.length + 1}. ${lvl.test.title} — the required test (pass mark ${pc.passThreshold}%)${lvl.boss ? `\n${remaining.length + 2}. Boss: ${lvl.boss.title}` : ''}\n\nThat’s roughly ${mins + 15} minutes of focused work. Two or three short sessions beat one long one; rest days don’t cost you anything here.${quick}`;
    }
    return `Your best next step: **${link(next.href, next.label)}**${next.level ? ` in Level ${next.level.num} (${next.level.region})` : ''}.${next.type === 'test' ? ` You’ve finished every lesson — the test needs ${pc.passThreshold}% to unlock the next region.` : ''}${quick}`;
  }

  // Progress summary
  if (has(t, 'progress', 'summary', 'summarize', 'how am i doing', 'status', 'xp', 'rank', 'level am i')) {
    const lastTest = pc.tests.at(-1);
    return `Here’s your progress summary:\n\n- **${pc.completionPct}%** of the course complete (${pc.lessonsDone}/${pc.lessonsTotal} lessons, ${pc.levelsCleared} level${pc.levelsCleared === 1 ? '' : 's'} cleared)\n- Current region: **Level ${pc.currentLevel.num}, ${pc.currentLevel.region}** — ${P.STATUS_LABEL[pc.currentLevel.status].toLowerCase()}\n- **${pc.xp} XP**, rank **${pc.rank}**${pc.nextRank ? ` (${pc.xpToNextRank} XP to ${pc.nextRank})` : ''}\n- Streak: ${pc.streakDays} day${pc.streakDays === 1 ? '' : 's'}${lastTest ? `\n- Latest test: Level ${lastTest.level}, ${lastTest.score}% (${lastTest.passed ? 'passed' : 'not passed yet'})` : ''}\n${pc.strengths.length ? `\nStrengths: ${pc.strengths.join(', ')}.` : ''}${pc.needsWork.length ? `\nNeeds work: ${pc.needsWork.join(', ')}.` : ''}\n\nNext: ${link(next.href, next.label)}. Full details are in your ${link('#/report', 'progress report')}.`;
  }

  // Charts / report
  if (has(t, 'chart', 'graph', 'report')) {
    return `Your ${link('#/report', 'progress report')} has five charts, all built from your saved activity:\n\n- **Course completion** — lessons count 60%, level tests 30%, boss challenges 10%.\n- **Progress by level** — each bar is lessons + test + boss for that level.\n- **Test scores over time** — each dot is one attempt; the dashed line is your ${pc.passThreshold}% pass mark. Red dots are attempts below it.\n- **Accuracy by skill** — practice answers plus your latest test answers (tests count double). Below 75% means "review".\n- **XP per day** — what you earned over the last 14 days.\n\n${pc.tests.length ? `You have ${pc.tests.length} test attempt${pc.tests.length > 1 ? 's' : ''} on record.` : 'Take your first test and the score chart will start filling in.'}`;
  }

  // Unlocking
  if (has(t, 'unlock', 'locked', 'next level', 'pass mark', 'threshold')) {
    const lvl = P.currentLevel(s);
    const reqs = P.requirements(s, lvl).map((r) => `- ${r.status === 'done' ? 'Done' : r.status === 'failed' ? 'Not passed yet' : 'To do'}: ${r.label} — ${r.detail}`).join('\n');
    return `To unlock the next region you must clear **Level ${lvl.num}: ${lvl.title}**:\n\n${reqs}\n\nClicking through lessons isn’t enough — the required test (${pc.passThreshold}%+) controls unlocking.`;
  }

  // Encouragement
  if (has(t, 'motivat', 'tired', 'hard', 'give up', 'frustrat', 'difficult', 'can i do', 'overwhelm')) {
    return `That’s completely normal — GenAI stacks a lot of new ideas on top of each other. You’ve already finished **${pc.lessonsDone} lessons** and earned **${pc.xp} XP**, so the method is working.\n\nTry this: pick one small thing (a single lesson, about ${next.mission?.minutes || 12} minutes), do it, and stop. Missing days never resets your XP or progress here.\n\nWhen you’re ready: ${link(next.href, next.label)}.`;
  }

  if (has(t, 'hello', 'hi ', 'hey') || t === 'hi') {
    return `Hi ${s.profile.name}! I can explain concepts, give hints, review your tests, and plan your next session. You’re on **Level ${pc.currentLevel.num}: ${pc.currentLevel.title}**. What would you like to do?`;
  }

  // Concept explanation from curriculum
  const hit = findConcept(t);
  if (hit) {
    const m = hit.mission;
    const lvl = getLevel(m.levelId);
    const status = P.missionStatus(s, m.id);
    const extra = (m.terms || []).filter((x) => x.term !== hit.term).slice(0, 2).map((x) => `- **${x.term}**: ${x.def}`).join('\n');
    return `**${hit.term}** — ${hit.def}\n\nThis is covered in ${link(`#/lesson/${m.id}`, m.title)} (Level ${lvl.num}, ${lvl.region})${status === 'locked' ? ', which unlocks later in your journey' : status === 'completed' ? ', which you’ve completed — worth a revisit' : ''}.${extra ? `\n\nRelated ideas:\n${extra}` : ''}`;
  }

  return `I’m not sure I understood that. In this simulated mode I can:\n\n- explain GenAI terms from the course (try "what is a context window?")\n- summarize your progress or explain your charts\n- show where you’re struggling and what to study next\n- explain the answers you missed on a test\n- give hints on a coding challenge (open it in the Playground first)\n\nConnect a real AI backend (see README) for open-ended conversation.`;
}

export const SUGGESTIONS = ['Summarize my progress', 'Where am I struggling?', 'What should I study next?', 'Explain my last test', 'Make me a study plan', 'What is a context window?', 'Explain my progress charts', 'How do I unlock the next level?'];
