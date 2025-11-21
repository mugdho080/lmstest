# LMS customization guide

This project is a static, neuro-friendly learning experience tailored for autistic learners. Pages are generated from a single data source so you can add chapters, levels, or topics without rewriting HTML.

## File map
- `index.html` — landing page listing all chapters and a feature highlight.
- `chapter.html` — chapter view that lists all levels for a selected chapter.
- `level.html` — level view that shows intro text and checklist steps for a chapter + level pair.
- `assets/js/chapters.js` — the **only** place you define chapters, registration links, and levels (titles, topics, content).
- `assets/js/app.js` — reads the chapter data, renders cards, handles registration gating, and connects the modal.
- `assets/css/theme.css` — shared styles for all pages (colors, spacing, typography, buttons, cards, motion preferences).

## Adding a new chapter
1. Open `assets/js/chapters.js` and add a new object inside the `chapters` map using a unique key (for example `"wellbeing"`).
2. Provide `title`, `icon` emoji, `color` gradient, `blurb`, `formLink`, and a `levels` array.
3. Each level needs an `id` string, `title`, `summary`, `free` flag (`true` for Level 1), `topics` array, and a `content` object with `intro` text plus `steps` array.
4. Save the file—`index.html`, `chapter.html`, and `level.html` will automatically pick up the new chapter because they read from `window.chapters`.

## Adding more levels to an existing chapter
1. In `assets/js/chapters.js`, find the chapter you want (for example `"math-numbers"`).
2. Append a new level object to the `levels` array with the same fields shown above.
3. Set `free: false` for Level 2 and beyond so they are gated behind registration.
4. The Chapter page will render an extra card, and the Level page will show the intro and checklist you supply.

## Changing the visual design
- Update colors, fonts, and spacing in `assets/css/theme.css`. Key variables near the top of the file control background, accent, and text shades for consistency.
- Button and card styles are shared across all pages; tweaking them updates the entire experience.
- The CSS respects `prefers-reduced-motion`; you can adjust the transitions under the `@media (prefers-reduced-motion)` section if needed.

## How registration gating works
- The registration link is stored in `registrationLink` at the top of `assets/js/chapters.js` and reused for every chapter.
- When someone submits the inline form modal, `localStorage` stores `registered-<chapterId> = true` so Level 2+ buttons unlock for that chapter.
- You can clear browser storage to reset locks, or change the storage key if you want a new gating cycle.

## Creating new pages with the same theme
- Reuse the base HTML structure: wrap content in `.page`, place a `.header` with `#page-title`, and load `assets/css/theme.css` and `assets/js/app.js`.
- Pull chapter or level data by calling helper functions from `app.js` or reading `window.chapters` directly.
- Follow the semantic card pattern (`.chapter-card`, `.level-card`, `.badge`, `.btn`) to inherit spacing and hover states automatically.

## Deploying to GoDaddy (static hosting)
1. Upload everything in this folder to your GoDaddy hosting (typically `public_html/`).
2. Keep the directory structure intact (`assets/...`), and ensure `index.html` sits at the root so it loads by default.
3. Because the site is static, no build step is required—just upload and visit your domain.

## Troubleshooting quick tips
- If a page looks unstyled, confirm the `link` tag for `assets/css/theme.css` points to the correct relative path.
- If levels do not unlock after registration, clear browser storage and ensure the chapter key in the URL matches the key used in `chapters.js`.
- For new chapters not showing, double-check that the object key matches the `chapter` query parameter used in links (e.g., `chapter.html?chapter=your-key`).
