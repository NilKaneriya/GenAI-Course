// Curriculum index: loads every level file and exposes lookup helpers.
import l1 from './levels/level01.js';
import l2 from './levels/level02.js';
import l3 from './levels/level03.js';
import l4 from './levels/level04.js';
import l5 from './levels/level05.js';
import l6 from './levels/level06.js';
import l7 from './levels/level07.js';
import l8 from './levels/level08.js';
import l9 from './levels/level09.js';
import l10 from './levels/level10.js';

export const LEVELS = [l1, l2, l3, l4, l5, l6, l7, l8, l9, l10];

export const SKILLS = {
  foundations: { label: 'GenAI Foundations', short: 'Foundations' },
  python: { label: 'Python', short: 'Python' },
  ml: { label: 'Machine Learning', short: 'ML' },
  'deep-learning': { label: 'Deep Learning', short: 'Deep learning' },
  llms: { label: 'LLMs & Transformers', short: 'LLMs' },
  prompting: { label: 'Prompting', short: 'Prompting' },
  'structured-output': { label: 'Structured Outputs', short: 'Structured' },
  apis: { label: 'APIs', short: 'APIs' },
  embeddings: { label: 'Embeddings', short: 'Embeddings' },
  rag: { label: 'RAG', short: 'RAG' },
  tools: { label: 'Tool Calling', short: 'Tools' },
  evaluation: { label: 'Evaluation', short: 'Evaluation' },
  safety: { label: 'Safety & Responsible AI', short: 'Safety' },
  deployment: { label: 'Deployment', short: 'Deployment' },
  career: { label: 'Career & Portfolio', short: 'Career' },
};

const missionIndex = new Map();
const challengeIndex = new Map();
const questionIndex = new Map();

for (const level of LEVELS) {
  level.missions.forEach((m, i) => {
    m.levelId = level.id;
    m.index = i;
    missionIndex.set(m.id, m);
    (m.check || []).forEach((q) => questionIndex.set(q.id, { ...q, source: 'practice', levelId: level.id, missionId: m.id }));
  });
  (level.challenges || []).forEach((c) => challengeIndex.set(c.id, { ...c, levelId: level.id }));
  level.test.questions.forEach((q) => questionIndex.set(q.id, { ...q, source: 'test', levelId: level.id }));
  if (level.boss) level.boss.questions.forEach((q) => questionIndex.set(q.id, { ...q, source: 'boss', levelId: level.id }));
}

export const getLevel = (id) => LEVELS.find((l) => l.id === id);
export const getLevelByNum = (n) => LEVELS[n - 1];
export const getMission = (id) => missionIndex.get(id);
export const getChallenge = (id) => challengeIndex.get(id);
export const getQuestion = (id) => questionIndex.get(id);
export const allMissions = () => LEVELS.flatMap((l) => l.missions);
export const allChallenges = () => LEVELS.flatMap((l) => (l.challenges || []).map((c) => challengeIndex.get(c.id)));
export const skillOfQuestion = (q) => {
  const m = q.topic ? missionIndex.get(q.topic) : null;
  return m ? m.skill : (getLevel(q.levelId)?.skills?.[0] ?? 'foundations');
};
export const totalMissions = () => allMissions().length;
