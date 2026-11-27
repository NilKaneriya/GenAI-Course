# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start` — serve on http://127.0.0.1:5173 (Node 18+, zero dependencies, no build step).
- `npm run dev` — same, with `node --watch` (restarts only when `server.js` changes; front-end files are served with `no-cache`, so a browser refresh is enough).
- `npm run check` — validates all curriculum content (`scripts/check-content.mjs`): schema, answer keys, short-answer grading, and that every coding-challenge solution passes its own tests. Run it after any edit to `public/js/data/`. There is no test runner or linter beyond this; it checks all 10 levels at once (no single-level mode).

## Architecture

Plain ES modules, no bundler. `server.js` is a static file server for `public/` plus one optional API; everything else runs in the browser.

- **State** (`public/js/store.js`): one JSON document persisted to `localStorage` (`loadRaw`/`persist`). All mutations go through store actions, which emit reward events that `main.js` turns into celebrations.
- **Progression** (`public/js/progression.js`): pure functions that derive everything (level/lesson/test/boss status, unlocking, XP, ranks, streaks, badges, skills) from saved activity. There is intentionally no "mark complete" state; unlocking is always computed, so never add a shortcut that writes completion directly. Tunables are in `data/config.js` (pass mark, boss required) and `data/rewards.js` (XP, ranks, badges, quests).
- **Content** (`public/js/data/levels/level01-10.js`): each exports one Level object, following `docs/CONTENT_SCHEMA.md`. Level ids (`l1`…`l10`) and question/mission ids must never change once learners have progress, since saved state references them. `curriculum.js` builds lookup indexes. Question topics must reference a mission id in the same level; visual names and skill ids are whitelisted in `scripts/check-content.mjs` (add new ones there too).
- **UI**: hash router in `main.js`; `views/` are pages, `components/` are shared pieces (`question.js` grading, `runner.js` sandboxed Web Worker that really executes JS challenges, `visuals.js` the 15 interactive explainers + mini-games, `learnKit.js` the staged lesson pieces: concept map, flashcards, story slides, mentor coach, `charts.js`). Lessons are played as stages (Big picture → Flashcards → Story → Quiz) with derived 3-star scores (`P.lessonStars`); mini-game wins live in `state.arcade` and award XP once. `ui.js` has the DOM helper, markdown-lite, and syntax highlighter.
- **Seed data** (`seed.js`): sample learner shown on first launch, generated with the same progression rules. Settings → Start fresh clears it.
- **Python** is not executed; playground shows recorded outputs and Python challenges are predict-the-output.

### Mentor chatbot (two paths)

`mentor.js` has a rule-based simulated mentor (default) and a client for `POST /api/mentor`. `server.js` enables the proxy only when `AI_PROVIDER` is set (`anthropic` or `openai-compatible`; config via `.env`, see `.env.example`), builds the system prompt from the learner's progress JSON, and falls back to the simulated mentor on failure. New providers go in `callProvider()`; the client contract is `{ message, history, progress, page }` → `{ reply }`. Mentor links must use the form `[label](#/route)`.

### Accounts and cloud progress

`lib/accounts.js` holds framework-free handlers (`handle(route, …)`) for signup, login, me and progress; `server.js` routes `/api/auth/*` and `/api/progress` to them locally (JSON file store in `.data/`), and the files in `api/` expose the same handlers as Vercel functions (Upstash Redis via `KV_REST_API_URL`/`KV_REST_API_TOKEN`, plus `AUTH_SECRET`). In the browser, `account.js` is the API client/session, `sync.js` reconciles local state with the server (newer `savedAt` wins) and pushes after every `persist()` via `store.setPersistHook`. `views/login.js` is the full-screen login route (`#/login`, `bare: true` hides the shell). Reward overlays and the flying XP live in `components/celebrate.js`; the lesson's right column is `components/sidePanel.js`.
