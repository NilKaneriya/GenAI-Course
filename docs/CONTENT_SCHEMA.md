# Curriculum content schema

All learning content lives in `public/js/data/levels/levelNN.js`. Each file is a plain ES module that
`export default`s one **Level** object. The app reads these files directly — edit the data, refresh the
browser, and the change appears. No build step.

Progression rules (pass threshold, whether bosses are required) live in `public/js/data/config.js`.
Rewards (XP values, ranks, badges, daily quests) live in `public/js/data/rewards.js`.

## Level

```js
export default {
  id: 'l1',                       // 'l1' … 'l10' — never change once learners have progress
  num: 1,
  title: 'Generative AI Foundations',
  region: 'Spark Plains',         // adventure-map name
  tagline: 'One sentence hook shown on the map.',
  overview: 'Two or three sentences: what this level covers and why it matters for a GenAI career.',
  objectives: ['By the end you can …', '…'],   // 3–5 items, start with a verb
  skills: ['foundations'],        // skill ids from the list below
  missions: [ /* Mission */ ],    // 3–5 lessons, in order
  challenges: [ /* Challenge */ ],// 0–2 coding challenges (see below)
  test: { /* LevelTest */ },      // REQUIRED end-of-level test
  boss: null | { /* Boss */ },    // larger end-of-section challenge
  review: [                       // extra reading suggested for missed topics
    { missionId: 'l1m2', tip: 'Re-read the context-window section and try the token visual again.' }
  ],
};
```

### Skill ids

`foundations, python, ml, deep-learning, llms, prompting, structured-output, apis, embeddings, rag,
tools, evaluation, safety, deployment, career`

## Mission (a lesson)

```js
{
  id: 'l1m1',                     // `${levelId}m${n}`
  title: 'What generative AI actually does',
  goal: 'Explain in one sentence how a language model produces text.',  // the mission goal
  minutes: 12,                    // estimated time
  skill: 'foundations',           // one skill id
  visual: 'promptFlow',           // optional interactive visual key (see list), or null
  visualCaption: 'Short instruction telling the learner what to try in the visual.',
  sections: [                     // 2–4 short sections. Keep each body under ~120 words.
    { h: 'Heading', body: 'Markdown-lite text' }
  ],
  terms: [ { term: 'Token', def: 'One-sentence definition.' } ],   // 2–5 glossary terms
  example: {                      // optional worked example
    title: 'Example title',
    lang: 'python' | 'javascript' | 'text' | 'json',
    code: '...',
    note: 'One or two sentences explaining what to notice.'
  },
  check: [ /* Question */ ],      // 2–3 practice questions (not graded for unlocking)
  challengeId: null | 'c-l1-1',   // optional link to a coding challenge in this level
}
```

### Markdown-lite (used in `body`, `overview`, `explain`)

- Blank line = new paragraph
- `**bold**`, `` `code` ``
- Lines starting with `- ` become bullet lists; `1. ` numbered lists
- Fenced code blocks with ``` and a language

### Interactive visual keys

| key | what it shows |
|---|---|
| `promptFlow` | prompt → tokens → model → next-token probabilities, temperature slider |
| `tokens` | live tokenizer approximation + context-window fill bar |
| `trainInfer` | toggle training vs inference data flow |
| `gradient` | gradient descent on a loss curve with learning-rate slider |
| `nnLayers` | small neural network, sliders for inputs, forward pass |
| `attention` | click a word to see attention weights to other words |
| `embeddings` | 2-D map of word embeddings, cosine similarity to a chosen word |
| `vectorSearch` | query → top-k nearest documents with scores |
| `ragPipeline` | step-through of chunk → embed → store → retrieve → augment → generate |
| `toolCalling` | step-through sequence of a tool/function call round trip |
| `structuredOutput` | free text vs JSON-schema-validated output |
| `evalCheck` | answer vs source documents, supported/unsupported claim highlighting |
| `streaming` | token-by-token streaming vs waiting for full response, latency numbers |

## Question

Used in `check` (practice), `test.questions` (required) and `boss.questions`.

```js
// Multiple choice
{ id: 'l1t-q1', type: 'mc', q: 'Question text?', options: ['A', 'B', 'C', 'D'], answer: 2,
  explain: 'Why the right answer is right and the tempting wrong answer is wrong.',
  topic: 'l1m2' }                 // missionId to review if missed

// Short answer — graded by concept keyword groups (case-insensitive substring match)
{ id: 'l1t-q7', type: 'short', q: 'In one or two sentences, why …?',
  keywords: [ ['token', 'tokens'], ['limit', 'maximum', 'window'] ],  // each inner array = one concept
  min: 2,                          // how many concept groups must appear to count as correct
  sample: 'A model answer shown after submission.',
  explain: 'What a good answer must mention.',
  topic: 'l1m2' }
```

Ids: practice `${missionId}-p${n}`, test `${levelId}t-q${n}`, boss `${levelId}b-q${n}`.
Questions should test understanding (apply, compare, predict, diagnose), not trivia.

## LevelTest

```js
{
  title: 'Foundations Checkpoint',
  intro: 'One sentence.',
  questions: [ /* 8 questions: ~6 mc + ~2 short */ ]
}
```

## Boss

```js
{
  id: 'l2b',
  title: 'The Data Wrangler',
  story: 'Two-sentence scenario framing the boss fight.',
  minutes: 20,
  hp: 5,                       // number of questions; learner must land `toWin` hits
  toWin: 4,
  questions: [ /* 5 scenario questions (mc or short) about applying the level */ ],
  project: null | {            // optional practical project deliverable (used in capstone)
    brief: 'What to build.',
    fields: [ { id: 'problem', label: 'Problem statement', minWords: 15, hint: '…' } ]
  }
}
```

## Challenge (coding)

JavaScript challenges are **really executed** in a sandboxed Web Worker and checked against tests.
Python challenges cannot run in the browser, so they are **predict-the-output** challenges.

```js
// Executable JavaScript challenge
{
  id: 'c-l1-1', levelId: 'l1', missionId: 'l1m2', kind: 'code', lang: 'javascript',
  title: 'Estimate tokens', skill: 'foundations',
  prompt: 'Markdown-lite task description.',
  starter: 'function estimateTokens(text) {\n  // your code\n}',
  solution: '…',               // shown only after passing or on explicit "reveal" after 2 failed runs
  hints: ['Hint 1 (gentle)', 'Hint 2 (more direct)'],
  tests: [ { call: 'estimateTokens("abcd")', expect: 1 } ]   // `call` is a JS expression; deep-equal; numbers compared to 1e-6
}

// Python predict-the-output challenge
{
  id: 'c-l2-1', levelId: 'l2', missionId: 'l2m1', kind: 'predict', lang: 'python',
  title: 'Predict the list', skill: 'python',
  prompt: 'What does this code print?',
  code: 'nums = [1, 2, 3]\nprint([n * 2 for n in nums])',
  options: ['[2, 4, 6]', '[1, 2, 3, 1, 2, 3]', '6', 'Error'],
  answer: 0,
  explain: 'Why.',
  hints: ['…']
}
```
