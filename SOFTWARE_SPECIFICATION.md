# Software Specification - Goodwill Care Academy LMS

This document describes the technical design, data model, and operational behavior of the Goodwill Care Academy learning experience. It is intended for maintainers, implementers, and reviewers who need a clear picture of what the system does and how it is structured.

## 1. Purpose and scope
The system provides a calm, neuro-friendly learning environment for autistic learners. It delivers structured learning content (chapters, levels, lessons, and quizzes), tracks progress, and rewards engagement with points, badges, and avatar customization. The core experience runs as a static web app and can optionally connect to a PHP/MySQL backend to persist account and progress data.

In scope:
- Front-end user experience for learners and support staff.
- Content data model and rendering flow.
- Optional backend API for persistence.
- Deployment model for static hosting or shared hosting (GoDaddy-style).

Out of scope:
- Real-time collaboration.
- Payment processing or billing.
- Third-party identity providers.

## 2. Users and roles
- Learner: explores chapters, completes lessons, takes quizzes, and tracks progress.
- Support staff or admin: reviews learner entries and toggles locked level access.
- Content editor: updates or adds chapters, levels, lessons, and quizzes.

## 3. System overview
### Front-end
- Static HTML pages rendered by browser-side JavaScript.
- Chapters and lessons are defined in a single data file and rendered dynamically based on query parameters.
- Local storage is used for account data, progress, gamification state, and UI theme.

### Backend (optional)
- PHP API provides chapter data, signup, login, and progress sync.
- MySQL stores chapters (as JSON payloads), client accounts, and progress.
- API is designed for light hosting environments and minimal dependencies.

### Data flow summary
1. `assets/js/chapters.js` defines `window.chapters` at page load.
2. `assets/js/app.js` boots and calls `/backend/api.php?action=chapters`.
3. If the API responds, `window.chapters` is replaced with the server data. If not, the local data remains in use.
4. Learner progress is stored in `localStorage` and optionally synced to the backend.

## 4. Libraries and dependencies
### Front-end
- No external JavaScript libraries. Pure HTML, CSS, and vanilla JavaScript.
- Uses built-in Web APIs: DOM, Fetch, URLSearchParams, LocalStorage, SpeechSynthesis, and Audio.
- SpeechSynthesis supports a user-selected voice for read-aloud content.
- Embedded content and media:
  - YouTube (nocookie) iframe for lesson video.
  - OpenMoji image assets loaded by URL.
  - Google Forms link for service agreement.
  - CrazyGames link for optional breaks.

### Backend
- PHP (with PDO) for API endpoints.
- MySQL for persistence (JSON column used for chapter payloads).
- No third-party PHP frameworks.

## 5. Routing and navigation
This is a file-based site with query-string routing for dynamic content.

Primary routes:
- `index.html` - chapter overview, signup/login modal, and gamified hub.
- `chapter.html?chapter=<slug>` - chapter-specific view with level cards and progress bars.
- `level.html?chapter=<slug>&level=<id>` - lesson view for a specific level; renders lessons and quizzes.
  - Lessons appear as a single flashcard with previous/next navigation and a single progress bar.
- `admin.html` - local admin view for toggling unlocks (local storage only).

Supplemental static pages (standalone or legacy):
- `module-ai-level1.html` - standalone module layout for AI Level 1.
- `ai-level2-locked.html` - preview page for locked AI Level 2.
- `life-skills-level2-locked.html` - preview page for locked Life Skills Level 2.
- `goodwill-academy-dashboard.html` - standalone dashboard mockup.
- `goodwill-academy-full-landing.html` - standalone landing page mockup.

## 6. Data model
### Chapter data (front-end and backend)
Each chapter is keyed by a slug and contains:
- `title`, `icon`, `color`, `blurb`, `formLink`
- `levels`: array of level objects

Level object:
- `id`, `title`, `summary`, `free` (boolean), `topics` (array)
- `content`: `intro` (string), `steps` (array)
- `lessons`: array of lesson objects (optional)

Lesson object:
- `id`, `title`, `summary`
- `content`: `intro`, `bullets` (array)
- `quiz`: array of { question, options[], answer }

### Local storage state
- `ga-clients`: array of learner records (id, name, email, ndis, planManager, unlockedAll).
- `ga-current-client-id`: active learner id.
- `ga-progress`: progress by learner id, chapter id, and level id.
- `ga-gamify`: points, badges, avatar, mood, chapterTallies, completedLessons.
- `ga-theme`: theme mode (light or dark).
- `ga-voice`: preferred read-aloud voice (voice URI or name).

### Database schema
- `clients`: learner identity and unlock state.
- `chapters`: chapter payload stored as JSON by slug.
- `progress`: per-learner progress for each chapter and level.

## 7. Module responsibilities (functional classes)
The codebase is mostly functional rather than class-based. The following files act as the major modules and responsibilities:

- `assets/js/chapters.js`
  - Single source of content for chapters and lessons in static mode.
  - Defines `window.chapters` used by all page renderers.

- `assets/js/app.js`
  - Data helpers: `getChapterFromUrl`, `fetchChaptersFromApi`, `postApi`.
  - Progress tracking: `readProgress`, `markLessonComplete`, `syncProgressToApi`.
  - Gamification: points, badges, avatar, mood, and celebratory UI.
  - UI rendering: chapter grid, level cards, flashcard lessons, progress bars.
  - Read-aloud voice selection and persistence.
  - Auth UI: signup/login modal, local storage persistence, optional API sync.
  - Admin UI: client table render and local unlock toggles.
  - Boot logic: fetch, hydrate, and page-specific initialization.

- `assets/css/theme.css`
  - Design tokens, typography, layout grids, and component styles.
  - Light/dark theme handling via shared color variables.

- `backend/api.php`
  - Entry point for API actions (`chapters`, `signup`, `login`, `progress_get`, `progress_save`, admin actions).
  - Fallback to `backend/data/chapters.json` when DB content is empty.

- `backend/db.php`
  - PDO connection setup for MySQL.

- `backend/schema.sql` and `backend/seed.php`
  - Database schema and content seeding.

## 8. Backend API contract
All endpoints are routed through `backend/api.php` using the `action` query parameter. JSON is returned for all responses.

Public endpoints:
- `GET /backend/api.php?action=chapters`
  - Response: `{ "chapters": { <slug>: <chapterObject> } }`
- `POST /backend/api.php?action=signup`
  - Body: `{ "client": { id, name, email, ndis, planManager, unlockedAll } }`
  - Response: `{ "status": "ok" }`
- `POST /backend/api.php?action=login`
  - Body: `{ "email": "user@example.com" }`
  - Response: `{ "client": { id, name, email, ndis, planManager, unlockedAll } }`
- `POST /backend/api.php?action=progress_get`
  - Body: `{ "clientId": "..." }`
  - Response: `{ "progress": { chapter: { level: { lessons: [] } } } }`
- `POST /backend/api.php?action=progress_save`
  - Body: `{ "clientId": "...", "chapter": "slug", "level": "1", "lessons": ["1","2"] }`
  - Response: `{ "status": "ok" }`

Admin endpoints (require `X-API-Key` header):
- `POST /backend/api.php?action=admin_clients`
  - Response: `{ "clients": [ ... ] }`
- `POST /backend/api.php?action=admin_unlock`
  - Body: `{ "clientId": "...", "unlock": true }`
  - Response: `{ "status": "ok" }`

## 9. Non-functional requirements
- Accessibility: large touch targets, readable font sizes, reduced motion support, and supportive language.
- Performance: no build step, minimal JavaScript, fast load on basic hosting.
- Reliability: fallback to local data when API is unreachable.
- Privacy: no password storage; learner info stored locally unless backend is configured.
- Security: API key protects admin endpoints; `config.php` should be kept private.

## 10. Error handling and fallbacks
- If `backend/config.php` is missing, the API returns a clear error.
- If the API is unavailable, the front end uses `assets/js/chapters.js`.
- Progress sync failures are logged to the console but do not block the UI.
- Video embed falls back to a direct YouTube link when necessary.
