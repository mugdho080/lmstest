# Goodwill Care Academy LMS

Goodwill Care Academy is a calm, neuro-friendly learning experience designed for autistic learners and their supporters. This repo ships a static, data-driven front end plus an optional PHP/MySQL backend for storing accounts and progress. There is no build step; everything runs directly from the HTML, CSS, and JavaScript you see in this folder.

The UI emphasizes clear layouts, large controls, gentle motion, and supportive language. Chapters, levels, lessons, and quizzes are all defined in a single data file so content can grow without rewriting pages.

## Key features
- Data-driven chapters, levels, lessons, and quizzes.
- Learner progress tracking, points, badges, and avatar choices.
- Read-aloud support using the browser speech synthesis API with a local voice picker.
- Flashcard-style lesson flow with a single progress bar per level.
- Token-based light/dark theming for consistent color palettes.
- Optional backend for signup, login, and progress sync.
- Admin view for toggling access to locked levels (local storage).

## How the app works
- The front end loads `assets/js/chapters.js`, which defines `window.chapters`.
- On startup, `assets/js/app.js` tries to fetch content from `backend/api.php?action=chapters`. If the API is unavailable, it keeps the local `chapters.js` data.
- Progress and learner profile data are stored in `localStorage` by default. If the backend is configured, progress and login can sync to MySQL.
- Navigation is file based: `index.html` lists chapters, `chapter.html` lists levels for a chosen chapter, and `level.html` renders lessons and quizzes for a chosen level.
- Level lessons render as a single flashcard with previous/next controls, and the progress bar reflects completed lessons.
- Read-aloud voice choice is stored locally so it persists across sessions.

## Project structure
- `index.html` - landing page with chapter grid, signup modal, and hero content.
- `chapter.html` - chapter view with level cards and progress summary.
- `level.html` - level view with lessons, quizzes, and read-aloud actions.
- `admin.html` - admin helper page for locking/unlocking levels (local storage).
- `assets/js/chapters.js` - primary content source (chapters, levels, lessons).
- `assets/js/app.js` - rendering, progress, auth, gamification, and UI behavior.
- `assets/css/theme.css` - shared theme and layout styles, including light/dark tokens.
- `backend/` - optional PHP/MySQL API and seed data.
- `GUIDE.md` - step-by-step customization guide.

Additional HTML files like `module-ai-level1.html` and `goodwill-academy-dashboard.html` are standalone mockups or legacy layouts and do not use the dynamic data flow.

## Run locally
- Simple: open `index.html` in a browser. The UI will use local data and local storage.
- Recommended (local server): run a static server so relative links and embeds behave consistently.

Example:
```bash
python3 -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

## Optional backend quick start
1. Copy `backend/config.sample.php` to `backend/config.php` and set your database credentials and API key.
2. Create the MySQL tables by running `backend/schema.sql`.
3. Seed content into the database by running `backend/seed.php` once.
4. Ensure `backend/api.php` is accessible from the browser.

When hosted under `/academy`, the front end automatically targets `/academy/backend/api.php`. Otherwise it will call `/backend/api.php`.

## Customizing content
- Edit `assets/js/chapters.js` to add or update chapters, levels, lessons, and quizzes.
- If you are using the backend, update `backend/data/chapters.json` and re-run `backend/seed.php`.
- See `GUIDE.md` for a detailed workflow.

## External services
This project embeds or links to external resources such as YouTube (nocookie), OpenMoji images, Google Forms, and CrazyGames. Update or replace those URLs as needed for your deployment.
