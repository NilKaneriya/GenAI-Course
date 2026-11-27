// Game rewards. XP is awarded once per item (no farming by repeating or guessing).

export const XP = {
  lesson: 50,          // mission completed (practice check answered correctly)
  practicePerfect: 10, // bonus when every practice question was right on the first try
  challenge: 75,       // coding challenge passed (first time only)
  testPass: 150,       // end-of-level test passed (first pass only)
  testComeback: 50,    // passing after a previous failed attempt (rewards review, once per level)
  boss: 250,           // boss challenge beaten
  project: 400,        // capstone project plan submitted
  quest: 20,           // optional daily quest
};

// Learner ranks — reach the XP threshold to earn the rank.
export const RANKS = [
  { id: 'r1', name: 'Curious Novice', xp: 0 },
  { id: 'r2', name: 'Token Tinkerer', xp: 300 },
  { id: 'r3', name: 'Script Scout', xp: 800 },
  { id: 'r4', name: 'Model Apprentice', xp: 1500 },
  { id: 'r5', name: 'Prompt Smith', xp: 2400 },
  { id: 'r6', name: 'Retrieval Ranger', xp: 3500 },
  { id: 'r7', name: 'Agent Architect', xp: 4800 },
  { id: 'r8', name: 'GenAI Engineer', xp: 6300 },
  { id: 'r9', name: 'Portfolio Ready', xp: 8000 },
];

// Badges — `rule` keys are evaluated in progression.js (see BADGE_RULES there).
export const BADGES = [
  { id: 'first-steps', name: 'First Steps', desc: 'Completed your first lesson.', rule: 'lessons>=1', icon: 'footprints' },
  { id: 'spark', name: 'Spark Lit', desc: 'Passed the Spark Plains checkpoint (Level 1).', rule: 'level:l1', icon: 'spark' },
  { id: 'pythonista', name: 'Pythonista', desc: 'Cleared Python Grove (Level 2).', rule: 'level:l2', icon: 'code' },
  { id: 'code-runner', name: 'Code Runner', desc: 'Passed your first coding challenge.', rule: 'challenges>=1', icon: 'play' },
  { id: 'comeback', name: 'Comeback', desc: 'Passed a test after reviewing a failed attempt.', rule: 'comeback', icon: 'rotate' },
  { id: 'perfect', name: 'Flawless', desc: 'Scored 100% on an end-of-level test.', rule: 'perfect', icon: 'star' },
  { id: 'boss-slayer', name: 'Boss Slayer', desc: 'Defeated your first boss challenge.', rule: 'bosses>=1', icon: 'shield' },
  { id: 'deep-diver', name: 'Deep Diver', desc: 'Cleared Neuron Peaks (Level 4).', rule: 'level:l4', icon: 'layers' },
  { id: 'halfway', name: 'Halfway There', desc: 'Cleared five levels.', rule: 'levels>=5', icon: 'flag' },
  { id: 'retriever', name: 'Retriever', desc: 'Cleared Vector Archipelago (Level 7).', rule: 'level:l7', icon: 'search' },
  { id: 'toolsmith', name: 'Toolsmith', desc: 'Cleared Agent Harbor (Level 8).', rule: 'level:l8', icon: 'wrench' },
  { id: 'guardian', name: 'Guardian', desc: 'Cleared Trust Citadel (Level 9).', rule: 'level:l9', icon: 'lock' },
  { id: 'quest-keeper', name: 'Quest Keeper', desc: 'Finished five optional daily quests.', rule: 'quests>=5', icon: 'compass' },
  { id: 'curious', name: 'Curious Mind', desc: 'Asked the mentor five questions.', rule: 'mentor>=5', icon: 'chat' },
  { id: 'challenger', name: 'Challenger', desc: 'Passed five coding challenges.', rule: 'challenges>=5', icon: 'trophy' },
  { id: 'job-ready', name: 'Job Ready', desc: 'Completed the Launch Summit capstone.', rule: 'level:l10', icon: 'rocket' },
];

// Optional daily quests. Three are picked per day; missing a day costs nothing.
export const QUEST_POOL = [
  { id: 'q-lesson', text: 'Complete one lesson', metric: 'lessons', target: 1 },
  { id: 'q-practice', text: 'Answer 5 practice questions', metric: 'practice', target: 5 },
  { id: 'q-code', text: 'Run code in the playground', metric: 'runs', target: 1 },
  { id: 'q-mentor', text: 'Ask the mentor a question', metric: 'mentor', target: 1 },
  { id: 'q-review', text: 'Revisit a lesson you already finished', metric: 'reviews', target: 1 },
  { id: 'q-visual', text: 'Experiment with an interactive visual', metric: 'visuals', target: 1 },
];
