# GenAI Quest

A game-based learning platform that takes one learner from **beginner to job-ready in Generative AI**:
ten levels, each a region on an adventure map, with lessons, interactive visuals, practice checks,
coding challenges, **required tests that control unlocking**, boss challenges, a capstone project,
XP / ranks / badges, a progress report with charts, and a mentor chatbot that reads your saved progress.

## Run it

Requires **Node.js 18+**. There are no dependencies to install.

```bash
npm start
```

Open http://localhost:5173. Progress is saved in your browser, so a refresh or restart keeps it.

- On first launch you see **sample progress** (Level 1 cleared, Level 2 in progress) so the dashboard and charts are populated. Go to **Settings → Start fresh** to begin your own journey at Level 1.
- `npm run dev` restarts the server when `server.js` changes. Front-end files are served fresh on every reload.
- `npm run check` validates all curriculum content (schema, answer keys, short-answer grading, and that every coding-challenge solution passes its own tests).

## What's live and what's simulated

| Feature | Status |
|---|---|
| Curriculum, lessons, practice checks, level tests, boss battles | **Live.** Graded in the browser. |
| Level unlocking | **Live.** Computed from saved results only. There is no "mark complete" shortcut. |
| XP, ranks, badges, daily quests, streak | **Live.** Derived from real activity. |
| Progress report and charts | **Live.** Built from saved activity. Export as JSON or CSV. |
| JavaScript coding challenges | **Really executed** in a sandboxed Web Worker (no DOM, no network, 2-second limit) and checked against tests. |
| Python snippets | **Simulated.** Browsers can't run Python, so the playground shows outputs recorded from real Python and says so. Your edits aren't executed. Python challenges are *predict-the-output* exercises instead. |
| Interactive visuals | Teaching models with small hand-picked numbers. They're labelled as such. |
| Mentor chatbot | **Simulated by default.** A rule-based mentor answers from the course content and your saved progress, and every reply is tagged "Simulated reply". It becomes **live AI** when you configure a provider (below). |
| Example API calls in lessons | Provider-neutral pseudo-code (`client.generate(...)`). Nothing calls a real API. |

## Connecting a real AI mentor (optional)

The browser never sees an API key. `server.js` exposes `POST /api/mentor`, which adds a system prompt
and a summary of your saved progress, then forwards the request to your provider. Steps:

1. Copy `.env.example` to `.env`. The `.env` file is git-ignored.
2. Set `AI_PROVIDER` (`anthropic` or `openai-compatible`), `AI_API_KEY`, `AI_MODEL`, and, for openai-compatible providers, `AI_BASE_URL`.
3. Restart with `npm start`.

The mentor badge switches from **Simulated** to **Live AI**. Replies are tagged "AI-generated". If the
provider fails, the app falls back to a simulated reply and says so. The proxy limits each IP to
20 requests per minute and never logs keys or prompts.

## How progression works

Rules live in `public/js/progression.js`. Defaults live in `public/js/data/config.js`.

- **Lessons** complete only after every practice question in the lesson has been answered correctly. Practice retries are unlimited and ungraded.
- **Missions** in a level unlock in order.
- **The level test** opens once all lessons in the level are complete. The pass mark is **80% by default** and can be changed in Settings. Each attempt is stored with its date, score, the pass mark used at that time, the answer for every question, and the topics missed. Changing the pass mark affects future attempts only.
- **Boss challenges** (Levels 2, 4, 6, 7, 8, 9 and 10) unlock after the test is passed and are required to clear the level by default. You can toggle this in Settings. The Level 10 boss also requires a written capstone project plan.
- **The next level** unlocks only when lessons, test and boss (if any) are all done. Unlocking updates the map, dashboard, report and mentor, with a short celebration.
- **XP** is awarded once per item: 50 per lesson, +10 for practice answered right on the first try, 75 per challenge, 150 per test pass, +50 for a comeback pass, 250 per boss and 400 for the project. Retrying and guessing earn nothing extra.
- **Daily quests** are optional, and missing a day costs nothing. The streak forgives one gap day.

## Architecture

```
server.js                    Static server + optional secure AI proxy (/api/mentor)
public/index.html            App shell
public/css/styles.css        Design tokens (light and dark), layout, components, responsive rules
public/js/
  main.js                    Hash router, navigation, top bar, reward celebrations
  store.js                   State, localStorage persistence, actions, reward events
  progression.js             Pure rules: unlocking, status, XP and ranks, skills, streaks, badges
  seed.js                    Sample learner data (generated with the same rules)
  mentor.js                  Progress context, simulated mentor, real-backend client
  ui.js                      DOM helper, markdown-lite, syntax highlighter, icons, toasts, modal
  components/                question (grading), charts, visuals (13 interactive explainers),
                             editor, runner (sandboxed JS worker)
  views/                     dashboard, map, level, lesson, test, boss, playground, report,
                             settings, mentorPanel
  data/
    config.js                Pass mark and other rules
    rewards.js               XP values, ranks, badges, quest pool
    curriculum.js            Loads the levels and builds lookup indexes
    levels/level01-10.js     All teaching content (see docs/CONTENT_SCHEMA.md)
    snippets.js              Playground examples
scripts/check-content.mjs    Content validator (npm run check)
```

**Why this stack:** the project folder was empty, so I chose plain ES modules with no build step and
no dependencies. It runs with a single `npm start`, works offline (apart from web fonts), and keeps
the content as editable data files. The UI is built from small reusable components.

**Extending it:**
- **Content:** edit or add files in `public/js/data/levels/`, following `docs/CONTENT_SCHEMA.md`, then run `npm run check`.
- **Backend and database:** `store.js` loads and saves the whole learner state in one place (`loadRaw`/`persist`). Replace those with API calls to move progress to a server. The state is a single JSON document that maps cleanly onto a database row or document.
- **Real AI:** add an adapter in `callProvider()` in `server.js`. The client contract (`{ message, history, progress, page }` → `{ reply }`) stays the same.

## Limitations

- Single learner, single browser. Progress lives in `localStorage`. Use the report's JSON export and the Settings import to move it between browsers.
- Short answers are graded by checking that the key concepts appear. That's fair for concise answers but less nuanced than a human or LLM grader.
- Python is not executed in the browser (see above).
- The simulated mentor understands a set of common intents plus every glossary term in the course. Open-ended conversation needs the live AI backend.
- The Content Security Policy allows `unsafe-eval` because the playground compiles learner code inside a sandboxed worker. App code itself never uses eval.
