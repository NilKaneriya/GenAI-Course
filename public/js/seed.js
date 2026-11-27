// Sample progress shown on first launch so the dashboard and charts are populated.
// It is generated with the same rules as real progress and clearly flagged as sample data
// (Settings → "Start fresh" clears it).
import { LEVELS } from './data/curriculum.js';
import { XP } from './data/rewards.js';
import * as P from './progression.js';

const at = (daysAgo, hour = 19, min = 0) => {
  const d = new Date(Date.now() - daysAgo * 86400000);
  d.setHours(hour, min, 0, 0);
  return d.toISOString();
};

export function buildSampleState(s) {
  s.isSample = true;
  s.profile.name = 'Learner';
  s.createdAt = at(7, 18);
  const [l1, l2] = LEVELS;
  const xp = (date, amount, reason, kind) => s.xpLog.push({ date, xp: amount, reason, kind });
  const act = (daysAgo, metric, n = 1) => {
    const k = P.daysAgoKey(daysAgo);
    s.activity[k] = s.activity[k] || {};
    s.activity[k][metric] = (s.activity[k][metric] || 0) + n;
  };
  const practice = (q, results, daysAgo) => {
    s.practice[q.id] = { attempts: results.length, correct: results.filter(Boolean).length, firstCorrect: results[0], last: results.at(-1) };
    act(daysAgo, 'practice', results.length);
  };

  // Level 1 lessons, spread across the week. One short-answer question needed a second try.
  const l1Days = [7, 7, 6, 5, 5, 4];
  l1.missions.forEach((m, i) => {
    const d = l1Days[i];
    m.check.forEach((q, qi) => practice(q, i === 1 && qi === 1 ? [false, true] : i === 2 && qi === 0 ? [false, true] : [true], d));
    const perfect = m.check.every((q) => s.practice[q.id].firstCorrect);
    s.missions[m.id] = { visits: i === 1 ? 2 : 1, lastVisited: at(d, 19, i * 10), completedAt: at(d, 19, 20 + i * 10), firstTryPerfect: perfect };
    xp(at(d, 19, 20 + i * 10), XP.lesson, `Lesson: ${m.title}`, 'lesson');
    if (perfect) xp(at(d, 19, 21 + i * 10), XP.practicePerfect, 'Practice perfect on first try', 'lesson');
    act(d, 'lessons');
  });
  act(5, 'visuals'); act(6, 'visuals');

  // Coding challenge in Level 1
  const c1 = l1.challenges[0];
  if (c1) {
    s.challenges[c1.id] = { attempts: 3, hintsUsed: 1, failedRuns: 2, passedAt: at(5, 20, 30), code: c1.solution };
    xp(at(5, 20, 30), XP.challenge, `Challenge: ${c1.title}`, 'challenge');
    act(5, 'runs', 3);
  }

  // Level 1 test: a first attempt below the bar, then a pass after review.
  const qs = l1.test.questions;
  const attempt = (daysAgo, wrongIdx) => {
    const answers = qs.map((q, i) => ({ qid: q.id, correct: !wrongIdx.includes(i), response: wrongIdx.includes(i) ? (q.type === 'mc' ? (q.answer + 1) % q.options.length : 'not sure') : (q.type === 'mc' ? q.answer : q.sample) }));
    const correct = answers.filter((a) => a.correct).length;
    const score = Math.round((correct / qs.length) * 100);
    return { id: `l1-sample-${daysAgo}`, date: at(daysAgo, 20), score, correct, total: qs.length, passed: score >= s.settings.passThreshold, threshold: s.settings.passThreshold, answers, missedTopics: [...new Set(wrongIdx.map((i) => qs[i].topic))] };
  };
  s.tests[l1.id] = [attempt(4, [2, 5, 7]), attempt(3, [7])];
  act(4, 'tests'); act(3, 'tests'); act(3, 'reviews', 2);
  xp(at(3, 20), XP.testPass, `Passed ${l1.test.title}`, 'test');
  xp(at(3, 20, 1), XP.testComeback, 'Comeback: passed after reviewing', 'test');

  // Level 2: two lessons in progress
  [2, 1].forEach((d, i) => {
    const m = l2.missions[i];
    if (!m) return;
    m.check.forEach((q, qi) => practice(q, qi === 0 && i === 1 ? [false, true] : [true], d));
    const perfect = m.check.every((q) => s.practice[q.id].firstCorrect);
    s.missions[m.id] = { visits: 1, lastVisited: at(d, 18), completedAt: at(d, 18, 40), firstTryPerfect: perfect };
    xp(at(d, 18, 40), XP.lesson, `Lesson: ${m.title}`, 'lesson');
    if (perfect) xp(at(d, 18, 41), XP.practicePerfect, 'Practice perfect on first try', 'lesson');
    act(d, 'lessons');
  });
  if (l2.missions[2]) s.missions[l2.missions[2].id] = { visits: 1, lastVisited: at(1, 19) };
  s.lastMission = l2.missions[2]?.id || null;

  // Optional quests completed earlier in the week
  [[5, 'Complete one lesson'], [3, 'Answer 5 practice questions'], [1, 'Complete one lesson']].forEach(([d, t]) => {
    xp(at(d, 21), XP.quest, `Daily quest: ${t}`, 'quest');
  });
  s.questsCompleted = 3;
  s.mentor.asked = 2;
  act(4, 'mentor'); act(3, 'mentor');

  // Badges with plausible dates
  const dates = { 'first-steps': at(6, 19, 20), spark: at(3, 20, 2), 'code-runner': at(5, 20, 30), comeback: at(3, 20, 2) };
  for (const id of P.earnedBadgeIds(s)) s.badges[id] = dates[id] || at(3, 20, 5);
  s.xpLog.sort((a, b) => new Date(a.date) - new Date(b.date));
  return s;
}
