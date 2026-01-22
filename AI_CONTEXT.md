# AI Context - Goodwill Care Academy LMS

This repo is a static, data-driven LMS for Goodwill Care Academy with an optional PHP/MySQL backend. The core experience is in plain HTML, CSS, and vanilla JavaScript. Content is stored in a single data file and rendered dynamically based on query parameters. The optional backend mirrors the same content in a database and supports signup/login/progress sync.

## Quick map
- Primary pages:
  - `index.html` (home and chapter grid)
  - `chapter.html?chapter=<slug>` (levels and chapter progress)
  - `level.html?chapter=<slug>&level=<id>` (lesson cards and quizzes)
  - `admin.html` (local admin toggles for unlocks)
- Standalone or legacy pages:
  - `module-ai-level1.html`, `ai-level2-locked.html`, `life-skills-level2-locked.html`
  - `goodwill-academy-dashboard.html`, `goodwill-academy-full-landing.html`

## Source of truth for content
- Front-end content lives in `assets/js/chapters.js` as `window.chapters`.
- Backend content lives in `backend/data/chapters.json` and is loaded into MySQL via `backend/seed.php`.
- At runtime, `assets/js/app.js` attempts to fetch `/backend/api.php?action=chapters` and replaces `window.chapters` if the API responds.

## Local storage keys (important for debugging)
- `ga-clients`: array of client objects with `unlockedAll` flag.
- `ga-current-client-id`: active learner id.
- `ga-progress`: nested object keyed by client id, chapter id, level id.
- `ga-gamify`: points, badges, avatar, mood, completed lessons.
- `ga-theme`: theme mode.
- `ga-voice`: preferred SpeechSynthesis voice.

## Backend endpoints
- `chapters` (GET) returns the chapter payload.
- `signup`, `login`, `progress_get`, `progress_save` (POST) handle persistence.
- `admin_clients` and `admin_unlock` are protected by `X-API-Key`.
- The API requires `backend/config.php` with DB credentials and an `api_key`.

## Core behaviors in `assets/js/app.js`
- Boot flow: `boot()` calls `fetchChaptersFromApi()` then `init()`.
- Rendering: chapter cards, level cards, flashcard lesson flow, progress bars.
- Gamification: points, badges, avatar, mood, celebratory effects.
- Auth: signup/login modal uses local storage; optionally syncs to API.
- Progress: per-lesson completion stored locally; optionally synced to API.
- Voice: local voice picker for read-aloud, persisted in local storage.

## Common tasks
- Add or update content: edit `assets/js/chapters.js` (and `backend/data/chapters.json` if using backend).
- Adjust styles: edit `assets/css/theme.css`.
- Update backend: change `backend/config.php`, run `backend/schema.sql`, then `backend/seed.php`.

## Known gotchas
- The front end assumes it might be hosted under `/academy` and sets `API_BASE` accordingly.
- If the API is offline, the app silently keeps local content.
- Admin UI in `admin.html` only reads local storage; no admin API calls are wired in.
- There are no passwords; login is by email only.
