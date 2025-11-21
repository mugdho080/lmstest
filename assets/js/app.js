// Minimal helper functions and renderers that consume window.chapters data.
// You can create new pages and reuse these utilities to stay on-theme.
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const getChapterFromUrl = () => new URLSearchParams(window.location.search).get('chapter');
const getLevelFromUrl = () => new URLSearchParams(window.location.search).get('level');

const isRegistered = (chapterId) => {
  return localStorage.getItem(`registered-${chapterId}`) === 'true';
};

const markRegistered = (chapterId) => {
  localStorage.setItem(`registered-${chapterId}`, 'true');
};

const renderChapterGrid = () => {
  const grid = qs('#chapter-grid');
  if (!grid || !window.chapters) return;

  grid.innerHTML = '';
  Object.entries(window.chapters).forEach(([id, chapter]) => {
    const card = document.createElement('article');
    card.className = 'chapter-card';
    card.innerHTML = `
      <div class="meta">
        <div class="badge">${chapter.icon} ${chapter.title}</div>
        <span class="subtle">${chapter.levels.length} levels</span>
      </div>
      <div class="chapter-icon" style="background:${chapter.color}">${chapter.icon}</div>
      <p>${chapter.blurb}</p>
      <div class="card-row">
        <span class="badge">Level 1: Open</span>
        <span class="badge locked">Level 2+: Registration</span>
      </div>
      <div class="level-actions">
        <a class="btn btn-primary" href="chapter.html?chapter=${id}">Open chapter</a>
        <a class="btn btn-secondary" href="${chapter.formLink}" target="_blank" rel="noreferrer">Registration form</a>
      </div>
    `;
    grid.appendChild(card);
  });
};

const renderFeatures = () => {
  const grid = qs('#feature-grid');
  if (!grid) return;
  const features = [
    {
      title: 'Neuro-friendly design',
      text: 'Large buttons, soft colors, and reduced motion to make navigation calm.',
      icon: '✨'
    },
    {
      title: 'Consistent layouts',
      text: 'All pages share one theme file so every new level feels familiar.',
      icon: '🧩'
    },
    {
      title: 'Easy to extend',
      text: 'Add chapters and levels by editing a single data file.',
      icon: '📚'
    },
    {
      title: 'Offline friendly',
      text: 'Static HTML, CSS, and JS that can be uploaded anywhere (including GoDaddy).',
      icon: '🌐'
    }
  ];
  grid.innerHTML = '';
  features.forEach((f) => {
    const card = document.createElement('article');
    card.className = 'chapter-card';
    card.innerHTML = `
      <div class="meta"><span class="badge">${f.icon}</span><span class="subtle">${f.title}</span></div>
      <p>${f.text}</p>
    `;
    grid.appendChild(card);
  });
};

const renderLevels = (chapterId) => {
  const grid = qs('#level-grid');
  if (!grid || !chapters[chapterId]) return;
  const chapter = chapters[chapterId];
  const registered = isRegistered(chapterId);

  grid.innerHTML = '';
  chapter.levels.forEach((level) => {
    const open = level.free || registered;
    const card = document.createElement('article');
    card.className = 'level-card';
    card.innerHTML = `
      <header>
        <div>
          <div class="badge">Level ${level.id}</div>
          <h3>${level.title}</h3>
        </div>
        <span class="status-pill">${open ? 'Ready' : 'Locked'}</span>
      </header>
      <p class="level-details">${level.summary}</p>
      <div class="card-row">${level.topics
        .map((t) => `<span class="badge">${t}</span>`)
        .join('')}</div>
      <div class="level-actions">
        ${open
          ? `<a class="btn btn-primary" href="level.html?chapter=${chapterId}&level=${level.id}">Start level</a>`
          : `<button class="btn btn-secondary" data-register="${chapterId}">Register to unlock</button>`}
        <a class="btn btn-secondary" href="${chapter.formLink}" target="_blank" rel="noreferrer">Service agreement</a>
      </div>
    `;
    grid.appendChild(card);
  });

  qsa('[data-register]').forEach((btn) => {
    btn.addEventListener('click', () => openRegistrationModal(chapterId));
  });
};

const renderLevelContent = (chapterId, levelId) => {
  const intro = qs('#level-intro');
  if (!intro || !chapters[chapterId]) return;
  const chapter = chapters[chapterId];
  const level = chapter.levels.find((l) => l.id === levelId);
  if (!level) return;

  qs('#breadcrumb-title').textContent = chapter.title;
  qs('#level-title').textContent = `${level.title}`;
  qs('#level-summary').textContent = level.summary;
  qs('#level-badge').textContent = `Level ${level.id}`;
  qs('#level-status').textContent = level.free ? 'Open for everyone' : 'Requires registration after Level 1';
  qs('#chapter-pill').textContent = chapter.title;

  intro.innerHTML = `
    <p class="subtle">${level.content.intro}</p>
    <ul class="checklist">
      ${level.content.steps.map((step) => `<li>✅ <span>${step}</span></li>`).join('')}
    </ul>
  `;
};

const openRegistrationModal = (chapterId) => {
  const modal = qs('#registration-modal');
  if (!modal) return;
  modal.dataset.chapter = chapterId;
  modal.classList.add('active');
};

const closeRegistrationModal = () => {
  const modal = qs('#registration-modal');
  if (!modal) return;
  modal.classList.remove('active');
};

const bindRegistrationForm = () => {
  const form = qs('#registration-form');
  if (!form) return;
  const modal = qs('#registration-modal');
  const alert = qs('#registration-alert');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const chapterId = modal?.dataset.chapter;
    if (!chapterId) return;
    markRegistered(chapterId);
    if (alert) {
      alert.textContent = 'Saved locally. You can also submit the official agreement form.';
      alert.style.display = 'block';
    }
    closeRegistrationModal();
    if (window.location.pathname.includes('chapter.html')) {
      renderLevels(chapterId);
    }
  });

  qsa('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeRegistrationModal));
};

const hydrateHero = () => {
  const heroTitle = qs('#page-title');
  if (!heroTitle) return;
  heroTitle.textContent = 'Calm Learning for Autistic Learners';
};

const init = () => {
  const page = document.body.dataset.page;
  hydrateHero();
  renderChapterGrid();
  renderFeatures();
  bindRegistrationForm();

  if (page === 'chapter') {
    const chapterId = getChapterFromUrl();
    const headerTitle = qs('#chapter-title');
    if (!chapterId || !chapters[chapterId]) return;
    headerTitle.textContent = chapters[chapterId].title;
    qs('#chapter-blurb').textContent = chapters[chapterId].blurb;
    renderLevels(chapterId);
  }

  if (page === 'level') {
    const chapterId = getChapterFromUrl();
    const levelId = getLevelFromUrl();
    if (!chapterId || !levelId) return;
    renderLevelContent(chapterId, levelId);
  }
};

document.addEventListener('DOMContentLoaded', init);
