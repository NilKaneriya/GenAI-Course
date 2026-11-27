// Progression rules. Edit here to change defaults for a fresh learner profile.
// The pass threshold can also be changed at runtime in Settings (stored with progress).
export const CONFIG = {
  storageKey: 'genai-quest:v1',
  defaultPassThreshold: 80,       // percent needed on an end-of-level test
  minPassThreshold: 50,
  maxPassThreshold: 100,
  requireBossToUnlock: true,      // a level's boss challenge (if it has one) must be beaten before the next level unlocks
  revealSolutionAfterFailedRuns: 2,
  codeTimeoutMs: 2000,            // JavaScript sandbox time limit
  mentorEndpoint: '/api/mentor',  // optional real AI backend (see server.js); simulated mentor is used if unavailable
};
