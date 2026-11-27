// Pure progression rules: everything here derives from saved state + curriculum data.
// Nothing in the UI can unlock a level directly — unlocks are computed from these rules.
import { LEVELS, getLevel, getMission, getQuestion, SKILLS, allChallenges, skillOfQuestion, totalMissions } from './data/curriculum.js';
import { RANKS, BADGES, QUEST_POOL, XP } from './data/rewards.js';

// ---------- dates ----------
export const dayKey = (d = new Date()) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};
export const daysAgoKey = (n) => dayKey(new Date(Date.now() - n * 86400000));

// ---------- basics ----------
export const threshold = (s) => s.settings.passThreshold;
export const isMissionComplete = (s, mid) => Boolean(s.missions[mid]?.completedAt);
export const missionsDone = (s, level) => level.missions.filter((m) => isMissionComplete(s, m.id)).length;
export const testAttempts = (s, lid) => s.tests[lid] || [];
export const testPassed = (s, lid) => testAttempts(s, lid).some((a) => a.passed);
export const bestScore = (s, lid) => testAttempts(s, lid).reduce((b, a) => Math.max(b, a.score), -1);
export const lastAttempt = (s, lid) => testAttempts(s, lid).at(-1) || null;
export const bossRequired = (s, level) => Boolean(level.boss) && s.settings.requireBoss;
export const bossWon = (s, lid) => Boolean(s.bosses[lid]?.wonAt);
export const bossBattleWon = (s, lid) => (s.bosses[lid]?.attempts || []).some((a) => a.won);
export const challengePassed = (s, cid) => Boolean(s.challenges[cid]?.passedAt);

export function isLevelComplete(s, level) {
  if (missionsDone(s, level) < level.missions.length) return false;
  if (!testPassed(s, level.id)) return false;
  if (bossRequired(s, level) && !bossWon(s, level.id)) return false;
  return true;
}

export function isLevelUnlocked(s, level) {
  if (level.num === 1) return true;
  return isLevelComplete(s, LEVELS[level.num - 2]);
}

export const testAvailable = (s, level) => isLevelUnlocked(s, level) && missionsDone(s, level) === level.missions.length;
export const bossAvailable = (s, level) => Boolean(level.boss) && isLevelUnlocked(s, level) && testPassed(s, level.id);

export function isMissionAvailable(s, mid) {
  const m = getMission(mid);
  if (!m) return false;
  const level = getLevel(m.levelId);
  if (!isLevelUnlocked(s, level)) return false;
  if (m.index === 0) return true;
  return isMissionComplete(s, level.missions[m.index - 1].id) || isMissionComplete(s, mid);
}

/** locked | available | in-progress | test-ready | test-failed | boss-ready | completed */
export function levelStatus(s, level) {
  if (!isLevelUnlocked(s, level)) return 'locked';
  if (isLevelComplete(s, level)) return 'completed';
  const done = missionsDone(s, level);
  if (done < level.missions.length) return done === 0 && !s.missions[level.missions[0].id]?.visits ? 'available' : 'in-progress';
  if (!testPassed(s, level.id)) return testAttempts(s, level.id).length ? 'test-failed' : 'test-ready';
  return 'boss-ready';
}

export const STATUS_LABEL = {
  locked: 'Locked',
  available: 'Available',
  'in-progress': 'In progress',
  'test-ready': 'Test ready',
  'test-failed': 'Test not passed yet',
  'boss-ready': 'Boss ready',
  completed: 'Cleared',
};

export function missionStatus(s, mid) {
  if (isMissionComplete(s, mid)) return 'completed';
  if (!isMissionAvailable(s, mid)) return 'locked';
  return s.missions[mid]?.visits ? 'in-progress' : 'available';
}

/** Requirement checklist used on level pages, the map and the report. */
export function requirements(s, level) {
  const unlocked = isLevelUnlocked(s, level);
  const done = missionsDone(s, level);
  const total = level.missions.length;
  const attempts = testAttempts(s, level.id);
  const passed = testPassed(s, level.id);
  const reqs = [];
  reqs.push({
    key: 'lessons',
    label: `Complete all ${total} lessons`,
    detail: `${done} of ${total} lessons complete`,
    status: !unlocked ? 'locked' : done === total ? 'done' : 'todo',
  });
  const best = bestScore(s, level.id);
  reqs.push({
    key: 'test',
    label: `Pass the level test (${threshold(s)}% or higher)`,
    detail: passed
      ? `Passed — best score ${best}%`
      : attempts.length
        ? `Best score ${best}% after ${attempts.length} attempt${attempts.length > 1 ? 's' : ''} — review and retry`
        : done < total ? 'Unlocks after all lessons are complete' : 'Ready to take',
    status: !unlocked ? 'locked' : passed ? 'done' : attempts.length ? 'failed' : 'todo',
  });
  if (level.boss) {
    const req = bossRequired(s, level);
    const won = bossWon(s, level.id);
    const battleLost = (s.bosses[level.id]?.attempts || []).some((a) => !a.won) && !bossBattleWon(s, level.id);
    reqs.push({
      key: 'boss',
      label: `${req ? 'Defeat' : 'Optional: defeat'} the boss: ${level.boss.title}`,
      detail: won ? 'Defeated' : bossBattleWon(s, level.id) ? 'Battle won — submit the project plan to finish' : passed ? 'Unlocked — ready when you are' : 'Unlocks after you pass the level test',
      status: !unlocked ? 'locked' : won ? 'done' : battleLost ? 'failed' : 'todo',
      optional: !req,
    });
  }
  return reqs;
}

export function unlockExplanation(s, level) {
  if (level.num === 1) return '';
  const prev = LEVELS[level.num - 2];
  const missing = requirements(s, prev).filter((r) => r.status !== 'done' && !r.optional).map((r) => r.label.toLowerCase());
  return `Clear Level ${prev.num} (${prev.region}): ${missing.join(', ') || 'all requirements'}.`;
}

export function currentLevel(s) {
  return LEVELS.find((l) => isLevelUnlocked(s, l) && !isLevelComplete(s, l)) || LEVELS.at(-1);
}

/** The single best next step for "Continue learning". */
export function nextAction(s) {
  const level = currentLevel(s);
  if (isLevelComplete(s, level)) return { type: 'done', label: 'Course complete — review your portfolio report', href: '#/report', level };
  const m = level.missions.find((x) => !isMissionComplete(s, x.id));
  if (m) return { type: 'mission', id: m.id, label: m.title, href: `#/lesson/${m.id}`, level, mission: m };
  if (!testPassed(s, level.id)) {
    const failed = testAttempts(s, level.id).length > 0;
    return { type: 'test', label: failed ? `Review, then retry the ${level.test.title}` : level.test.title, href: failed ? `#/level/${level.id}` : `#/test/${level.id}`, level };
  }
  return { type: 'boss', label: level.boss.title, href: `#/boss/${level.id}`, level };
}

// ---------- XP & ranks ----------
export const totalXP = (s) => s.xpLog.reduce((t, e) => t + e.xp, 0);

export function rankInfo(xp) {
  let i = 0;
  while (i + 1 < RANKS.length && xp >= RANKS[i + 1].xp) i++;
  const rank = RANKS[i];
  const next = RANKS[i + 1] || null;
  const pct = next ? Math.round(((xp - rank.xp) / (next.xp - rank.xp)) * 100) : 100;
  return { rank, next, pct, index: i, toNext: next ? next.xp - xp : 0 };
}

export function courseCompletion(s) {
  // Weighted: lessons 60%, tests 30%, bosses 10% (of required bosses).
  const lessons = LEVELS.reduce((t, l) => t + missionsDone(s, l), 0);
  const tests = LEVELS.filter((l) => testPassed(s, l.id)).length;
  const bossLevels = LEVELS.filter((l) => l.boss);
  const bosses = bossLevels.filter((l) => bossWon(s, l.id)).length;
  const pct = (lessons / totalMissions()) * 60 + (tests / LEVELS.length) * 30 + (bossLevels.length ? (bosses / bossLevels.length) * 10 : 10);
  return { pct: Math.round(pct), lessons, totalLessons: totalMissions(), tests, totalTests: LEVELS.length, bosses, totalBosses: bossLevels.length, levelsCleared: LEVELS.filter((l) => isLevelComplete(s, l)).length };
}

export function levelProgressPct(s, level) {
  const parts = level.missions.length + 1 + (level.boss ? 1 : 0);
  const got = missionsDone(s, level) + (testPassed(s, level.id) ? 1 : 0) + (level.boss && bossWon(s, level.id) ? 1 : 0);
  return Math.round((got / parts) * 100);
}

// ---------- skills ----------
/** Accuracy per skill from practice answers, the latest test attempt per level and latest boss attempt. */
export function skillStats(s) {
  const stats = {};
  for (const k of Object.keys(SKILLS)) stats[k] = { id: k, label: SKILLS[k].label, attempts: 0, correct: 0, lessons: 0, challenges: 0 };
  for (const [qid, rec] of Object.entries(s.practice)) {
    const q = getQuestion(qid);
    if (!q) continue;
    const sk = stats[skillOfQuestion(q)];
    if (!sk) continue;
    sk.attempts += rec.attempts;
    sk.correct += rec.correct;
  }
  const latestAnswerSets = [];
  for (const lid of Object.keys(s.tests)) { const a = lastAttempt(s, lid); if (a) latestAnswerSets.push(a.answers); }
  for (const lid of Object.keys(s.bosses)) { const a = (s.bosses[lid].attempts || []).at(-1); if (a?.answers) latestAnswerSets.push(a.answers); }
  for (const answers of latestAnswerSets) {
    for (const ans of answers) {
      const q = getQuestion(ans.qid);
      if (!q) continue;
      const sk = stats[skillOfQuestion(q)];
      if (!sk) continue;
      sk.attempts += 2; // test answers weigh double
      sk.correct += ans.correct ? 2 : 0;
    }
  }
  for (const [mid, rec] of Object.entries(s.missions)) {
    if (!rec.completedAt) continue;
    const m = getMission(mid);
    if (m && stats[m.skill]) stats[m.skill].lessons++;
  }
  for (const c of allChallenges()) if (challengePassed(s, c.id) && stats[c.skill]) stats[c.skill].challenges++;
  return Object.values(stats).map((x) => ({
    ...x,
    accuracy: x.attempts ? Math.round((x.correct / x.attempts) * 100) : null,
    practiced: x.attempts > 0 || x.lessons > 0 || x.challenges > 0,
  }));
}

export function strengthsAndGaps(s) {
  const stats = skillStats(s).filter((x) => x.attempts >= 3);
  const strengths = stats.filter((x) => x.accuracy >= 80).sort((a, b) => b.accuracy - a.accuracy);
  const gaps = stats.filter((x) => x.accuracy < 75).sort((a, b) => a.accuracy - b.accuracy);
  return { strengths, gaps };
}

/** Mission ids to review, ranked by how often their questions were missed recently. */
export function weakTopics(s, limit = 4) {
  const misses = {};
  const add = (mid, w) => { if (mid && getMission(mid)) misses[mid] = (misses[mid] || 0) + w; };
  for (const lid of Object.keys(s.tests)) {
    const passed = testPassed(s, lid);
    const a = lastAttempt(s, lid);
    if (!a) continue;
    for (const ans of a.answers) if (!ans.correct) add(getQuestion(ans.qid)?.topic, passed ? 1 : 3);
  }
  for (const [qid, rec] of Object.entries(s.practice)) {
    const wrong = rec.attempts - rec.correct;
    if (wrong > 0 && !rec.last) add(getQuestion(qid)?.topic, wrong);
    else if (wrong > 1) add(getQuestion(qid)?.topic, 0.5);
  }
  return Object.entries(misses).sort((a, b) => b[1] - a[1]).slice(0, limit).map(([mid, w]) => ({ mission: getMission(mid), weight: w }));
}

// ---------- activity, streak, quests ----------
export function streak(s) {
  const days = new Set(Object.keys(s.activity).filter((d) => {
    const a = s.activity[d];
    return a.lessons || a.practice || a.runs || a.tests || a.reviews || a.visuals || a.mentor;
  }));
  // Current streak: consecutive active days ending today or yesterday; one missed day is forgiven (grace day).
  let count = 0, gapUsed = false, i = days.has(dayKey()) ? 0 : 1;
  for (; i < 400; i++) {
    if (days.has(daysAgoKey(i))) count++;
    else if (!gapUsed && count > 0 && days.has(daysAgoKey(i + 1))) gapUsed = true;
    else break;
  }
  let week = 0;
  for (let j = 0; j < 7; j++) if (days.has(daysAgoKey(j))) week++;
  return { count, activeThisWeek: week, activeToday: days.has(dayKey()), graceUsed: gapUsed };
}

function hashStr(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }

export function todaysQuests(s) {
  const today = dayKey();
  const pool = [...QUEST_POOL];
  let h = hashStr(today);
  const picked = [];
  while (picked.length < 3 && pool.length) { picked.push(pool.splice(h % pool.length, 1)[0]); h = hashStr(String(h)); }
  const act = s.activity[today] || {};
  const claimed = s.quests[today] || [];
  return picked.map((q) => ({ ...q, progress: Math.min(act[q.metric] || 0, q.target), done: claimed.includes(q.id) }));
}

// ---------- badges ----------
export function earnedBadgeIds(s) {
  const c = courseCompletion(s);
  const challenges = allChallenges().filter((x) => challengePassed(s, x.id)).length;
  const bosses = LEVELS.filter((l) => bossWon(s, l.id)).length;
  const comeback = LEVELS.some((l) => { const at = testAttempts(s, l.id); const i = at.findIndex((a) => a.passed); return i > 0; });
  const perfect = LEVELS.some((l) => testAttempts(s, l.id).some((a) => a.score === 100));
  const ctx = { lessons: c.lessons, challenges, bosses, levels: c.levelsCleared, quests: s.questsCompleted || 0, mentor: s.mentor.asked || 0 };
  return BADGES.filter((b) => {
    if (b.rule.startsWith('level:')) return isLevelComplete(s, getLevel(b.rule.slice(6)));
    if (b.rule === 'comeback') return comeback;
    if (b.rule === 'perfect') return perfect;
    const [k, v] = b.rule.split('>=');
    return (ctx[k] || 0) >= Number(v);
  }).map((b) => b.id);
}

// ---------- history for charts ----------
export function xpByDay(s, days = 14) {
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = daysAgoKey(i);
    const xp = s.xpLog.filter((e) => dayKey(e.date) === k).reduce((t, e) => t + e.xp, 0);
    const missions = Object.values(s.missions).filter((m) => m.completedAt && dayKey(m.completedAt) === k).length;
    out.push({ day: k, xp, missions });
  }
  return out;
}

export function allTestAttempts(s) {
  const rows = [];
  for (const l of LEVELS) testAttempts(s, l.id).forEach((a, i) => rows.push({ ...a, levelId: l.id, levelNum: l.num, levelTitle: l.title, attemptNo: i + 1 }));
  return rows.sort((a, b) => new Date(a.date) - new Date(b.date));
}

export { XP };
