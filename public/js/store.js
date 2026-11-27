// Learner state: persistence (localStorage), actions, and reward events.
// Swap `persist`/`loadRaw` for API calls to move progress to a backend later.
import { CONFIG } from './data/config.js';
import { LEVELS, getLevel, getMission, getChallenge, getQuestion } from './data/curriculum.js';
import { BADGES, RANKS, XP } from './data/rewards.js';
import * as P from './progression.js';
import { buildSampleState } from './seed.js';

const listeners = new Set();
const eventListeners = new Set();
let state = null;

export function emptyState() {
  return {
    v: 1,
    createdAt: new Date().toISOString(),
    isSample: false,
    profile: { name: 'Learner' },
    settings: { passThreshold: CONFIG.defaultPassThreshold, requireBoss: CONFIG.requireBossToUnlock },
    missions: {},
    practice: {},
    tests: {},
    bosses: {},
    challenges: {},
    xpLog: [],
    badges: {},
    activity: {},
    quests: {},
    questsCompleted: 0,
    mentor: { messages: [], asked: 0 },
    arcade: {},          // `${missionId}:cards` / `${gameKey}:game` -> ISO date won (lesson mini-games)
    lastMission: null,
  };
}

function loadRaw() {
  try { return JSON.parse(localStorage.getItem(CONFIG.storageKey)); } catch { return null; }
}
let persistHook = null;
/** Called after every local save (used for cloud sync when signed in). */
export const setPersistHook = (fn) => { persistHook = fn; };
function persist() {
  state.savedAt = new Date().toISOString();
  try { localStorage.setItem(CONFIG.storageKey, JSON.stringify(state)); } catch (e) { console.warn('Could not save progress', e); }
  persistHook?.(state);
}

export function init() {
  const raw = loadRaw();
  state = raw && raw.v === 1 ? { ...emptyState(), ...raw } : buildSampleState(emptyState());
  persist();
  return state;
}

export const getState = () => state;
export const subscribe = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export const onEvent = (fn) => (eventListeners.add(fn), () => eventListeners.delete(fn));

function snapshot(s) {
  return {
    unlocked: LEVELS.filter((l) => P.isLevelUnlocked(s, l)).map((l) => l.id),
    rank: P.rankInfo(P.totalXP(s)).rank.id,
  };
}

/** Run a mutation, then derive rewards (badges, rank-ups, unlocks, quests), save and notify. */
function commit(mutator) {
  const before = snapshot(state);
  const events = [];
  const ctx = { award: (xp, reason, kind) => { state.xpLog.push({ date: new Date().toISOString(), xp, reason, kind }); events.push({ type: 'xp', xp, reason }); } };
  const result = mutator(state, ctx);

  // Daily quests complete automatically (optional; never penalised).
  const today = P.dayKey();
  for (const q of P.todaysQuests(state)) {
    if (!q.done && q.progress >= q.target) {
      state.quests[today] = [...(state.quests[today] || []), q.id];
      state.questsCompleted = (state.questsCompleted || 0) + 1;
      ctx.award(XP.quest, `Daily quest: ${q.text}`, 'quest');
      events.push({ type: 'quest', quest: q });
    }
  }
  // Badges
  for (const id of P.earnedBadgeIds(state)) {
    if (!state.badges[id]) { state.badges[id] = new Date().toISOString(); events.push({ type: 'badge', badge: BADGES.find((b) => b.id === id) }); }
  }
  const after = snapshot(state);
  for (const lid of after.unlocked) if (!before.unlocked.includes(lid)) events.push({ type: 'unlock', level: getLevel(lid) });
  if (after.rank !== before.rank) events.push({ type: 'rank', rank: RANKS.find((r) => r.id === after.rank) });

  persist();
  listeners.forEach((fn) => fn(state));
  if (events.length) eventListeners.forEach((fn) => fn(events));
  return result;
}

function bump(s, metric, n = 1) {
  const k = P.dayKey();
  s.activity[k] = s.activity[k] || {};
  s.activity[k][metric] = (s.activity[k][metric] || 0) + n;
}

// ---------------- actions ----------------

export function visitMission(mid) {
  commit((s) => {
    const rec = s.missions[mid] || { visits: 0 };
    if (rec.completedAt) bump(s, 'reviews');
    s.missions[mid] = { ...rec, visits: (rec.visits || 0) + 1, lastVisited: new Date().toISOString() };
    s.lastMission = mid;
  });
}

export function answerPractice(qid, correct) {
  return commit((s) => {
    const rec = s.practice[qid] || { attempts: 0, correct: 0 };
    rec.attempts += 1;
    if (correct) rec.correct += 1;
    if (rec.attempts === 1) rec.firstCorrect = correct;
    rec.last = correct;
    s.practice[qid] = rec;
    bump(s, 'practice');
  });
}

/** A lesson completes only once every practice question has been answered correctly. */
export function completeMission(mid) {
  const m = getMission(mid);
  if (!m || !P.isMissionAvailable(state, mid)) return { ok: false, reason: 'This lesson is locked.' };
  const pending = (m.check || []).filter((q) => !(state.practice[q.id]?.correct > 0));
  if (pending.length) return { ok: false, reason: `Answer the ${pending.length} remaining practice question${pending.length > 1 ? 's' : ''} correctly first.` };
  if (P.isMissionComplete(state, mid)) return { ok: true, already: true };
  return commit((s, { award }) => {
    const perfect = (m.check || []).every((q) => s.practice[q.id]?.firstCorrect);
    s.missions[mid] = { ...s.missions[mid], completedAt: new Date().toISOString(), firstTryPerfect: perfect };
    award(XP.lesson, `Lesson: ${m.title}`, 'lesson');
    if (perfect) award(XP.practicePerfect, 'Practice perfect on first try', 'lesson');
    bump(s, 'lessons');
    return { ok: true };
  });
}

/** answers: [{ qid, correct, response }] */
export function submitTest(levelId, answers) {
  const level = getLevel(levelId);
  if (!P.testAvailable(state, level)) return { ok: false, reason: 'Complete every lesson in this level first.' };
  return commit((s, { award }) => {
    const total = level.test.questions.length;
    const correct = answers.filter((a) => a.correct).length;
    const score = Math.round((correct / total) * 100);
    const th = s.settings.passThreshold;
    const passed = score >= th;
    const hadPass = P.testPassed(s, levelId);
    const hadFail = P.testAttempts(s, levelId).some((a) => !a.passed);
    const missedTopics = [...new Set(answers.filter((a) => !a.correct).map((a) => getQuestion(a.qid)?.topic).filter(Boolean))];
    const attempt = { id: `${levelId}-${Date.now()}`, date: new Date().toISOString(), score, correct, total, passed, threshold: th, answers, missedTopics };
    s.tests[levelId] = [...(s.tests[levelId] || []), attempt];
    bump(s, 'tests');
    if (passed && !hadPass) {
      award(XP.testPass, `Passed ${level.test.title}`, 'test');
      if (hadFail) award(XP.testComeback, 'Comeback: passed after reviewing', 'test');
    }
    return { ok: true, attempt };
  });
}

export function submitBossBattle(levelId, { answers }) {
  const level = getLevel(levelId);
  if (!P.bossAvailable(state, level)) return { ok: false, reason: 'Pass the level test to challenge the boss.' };
  return commit((s, { award }) => {
    const hits = answers.filter((a) => a.correct).length;
    const won = hits >= level.boss.toWin;
    const rec = s.bosses[levelId] || { attempts: [] };
    const firstWin = won && !rec.attempts.some((a) => a.won);
    rec.attempts = [...rec.attempts, { date: new Date().toISOString(), hits, total: answers.length, won, answers }];
    if (firstWin) {
      award(XP.boss, `Defeated ${level.boss.title}`, 'boss');
      if (!level.boss.project) rec.wonAt = new Date().toISOString();
    }
    s.bosses[levelId] = rec;
    bump(s, 'tests');
    return { ok: true, won, hits };
  });
}

export function submitProject(levelId, fields) {
  const level = getLevel(levelId);
  if (!level.boss?.project || !P.bossBattleWon(state, levelId)) return { ok: false, reason: 'Win the boss battle first.' };
  const short = level.boss.project.fields.filter((f) => wordCount(fields[f.id]) < f.minWords);
  if (short.length) return { ok: false, reason: `Expand: ${short.map((f) => f.label).join(', ')}.` };
  return commit((s, { award }) => {
    const rec = s.bosses[levelId];
    const first = !rec.wonAt;
    rec.project = fields;
    rec.projectAt = new Date().toISOString();
    if (first) { rec.wonAt = rec.projectAt; award(XP.project, `Capstone plan: ${level.title}`, 'project'); }
    return { ok: true };
  });
}

export const wordCount = (t) => (t || '').trim().split(/\s+/).filter(Boolean).length;

export function saveProjectDraft(levelId, fields) {
  state.bosses[levelId] = { attempts: [], ...state.bosses[levelId], draft: fields };
  persist();
}

export function recordChallengeRun(cid, { passed, code }) {
  const c = getChallenge(cid);
  return commit((s, { award }) => {
    const rec = s.challenges[cid] || { attempts: 0, hintsUsed: 0 };
    rec.attempts += 1;
    rec.code = code;
    if (passed && !rec.passedAt) { rec.passedAt = new Date().toISOString(); award(XP.challenge, `Challenge: ${c.title}`, 'challenge'); }
    if (!passed) rec.failedRuns = (rec.failedRuns || 0) + 1;
    s.challenges[cid] = rec;
    bump(s, 'runs');
  });
}

export function recordPredict(cid, correct) {
  const c = getChallenge(cid);
  return commit((s, { award }) => {
    const rec = s.challenges[cid] || { attempts: 0, hintsUsed: 0 };
    rec.attempts += 1;
    if (correct && !rec.passedAt) { rec.passedAt = new Date().toISOString(); award(XP.challenge, `Challenge: ${c.title}`, 'challenge'); }
    if (!correct) rec.failedRuns = (rec.failedRuns || 0) + 1;
    s.challenges[cid] = rec;
    bump(s, 'runs');
  });
}

export function useHint(cid) {
  commit((s) => { const rec = s.challenges[cid] || { attempts: 0, hintsUsed: 0 }; rec.hintsUsed = (rec.hintsUsed || 0) + 1; s.challenges[cid] = rec; });
}
export function revealSolution(cid) {
  commit((s) => { const rec = s.challenges[cid] || { attempts: 0, hintsUsed: 0 }; rec.revealed = true; s.challenges[cid] = rec; });
}
export function saveDraft(cid, code) {
  state.challenges[cid] = { attempts: 0, hintsUsed: 0, ...state.challenges[cid], code };
  persist();
}
export function playgroundRun() { commit((s) => bump(s, 'runs')); }

/** Lesson mini-game won (flashcard deck mastered, sorting game, ...). XP is awarded once per key. */
export function arcadeWin(key, kind, label) {
  const id = `${key}:${kind}`;
  if (state.arcade?.[id]) return false;
  commit((s, { award }) => {
    s.arcade = { ...(s.arcade || {}), [id]: new Date().toISOString() };
    award(kind === 'cards' ? XP.cards : XP.game, label, 'game');
    bump(s, kind === 'cards' ? 'cards' : 'games');
  });
  return true;
}

let visualBumped = new Set();
export function visualUsed(key) {
  const k = `${P.dayKey()}:${key}`;
  if (visualBumped.has(k)) return;
  visualBumped.add(k);
  commit((s) => bump(s, 'visuals'));
}

export function addMentorMessage(msg, { asked = false } = {}) {
  commit((s) => {
    s.mentor.messages = [...s.mentor.messages, { ...msg, time: new Date().toISOString() }].slice(-120);
    if (asked) { s.mentor.asked = (s.mentor.asked || 0) + 1; bump(s, 'mentor'); }
  });
}
export function clearMentor() { commit((s) => { s.mentor.messages = []; }); }

export function setThreshold(n) {
  const v = Math.max(CONFIG.minPassThreshold, Math.min(CONFIG.maxPassThreshold, Math.round(Number(n) || CONFIG.defaultPassThreshold)));
  commit((s) => { s.settings.passThreshold = v; });
}
export function setRequireBoss(v) { commit((s) => { s.settings.requireBoss = Boolean(v); }); }
export function setName(name) { commit((s) => { s.profile.name = String(name || 'Learner').slice(0, 40); }); }

export function resetProgress(mode = 'fresh') {
  const fresh = emptyState();
  state = mode === 'sample' ? buildSampleState(fresh) : fresh;
  persist();
  listeners.forEach((fn) => fn(state));
}

export function importState(obj) {
  if (!obj || obj.v !== 1 || typeof obj.missions !== 'object') throw new Error('This file is not a GenAI Quest progress export.');
  state = { ...emptyState(), ...obj };
  persist();
  listeners.forEach((fn) => fn(state));
}
