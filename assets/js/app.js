// Minimal helper functions and renderers that consume window.chapters data.
// You can create new pages and reuse these utilities to stay on-theme.
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const GAMES_URL = 'https://www.crazygames.com/';
const THEME_KEY = 'ga-theme';

const getChapterFromUrl = () => new URLSearchParams(window.location.search).get('chapter');
const getLevelFromUrl = () => new URLSearchParams(window.location.search).get('level');

// Speech helpers for read-aloud support
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const stopSpeech = () => {
  if (canSpeak) {
    window.speechSynthesis.cancel();
  }
};

const speakText = (text) => {
  if (!canSpeak || !text) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.97;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
};

// Simple localStorage-backed client directory (works on static hosting)
const STORAGE_KEYS = {
  clients: 'ga-clients',
  currentClientId: 'ga-current-client-id',
  progress: 'ga-progress'
};

const loadClients = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.clients)) || [];
  } catch (e) {
    return [];
  }
};

const saveClients = (clients) => {
  localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
};

const getCurrentClientId = () => localStorage.getItem(STORAGE_KEYS.currentClientId);

const setCurrentClientId = (id) => {
  if (id) {
    localStorage.setItem(STORAGE_KEYS.currentClientId, id);
  } else {
    localStorage.removeItem(STORAGE_KEYS.currentClientId);
  }
};

const getCurrentClient = () => {
  const id = getCurrentClientId();
  if (!id) return null;
  return loadClients().find((c) => c.id === id) || null;
};

const upsertClient = (client) => {
  const clients = loadClients();
  const existingIdx = clients.findIndex((c) => c.id === client.id);
  if (existingIdx >= 0) {
    clients[existingIdx] = client;
  } else {
    clients.push(client);
  }
  saveClients(clients);
};

const unlockClientLevels = (id, unlocked = true) => {
  const clients = loadClients();
  const idx = clients.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  clients[idx].unlockedAll = unlocked;
  saveClients(clients);
  return clients[idx];
};

const loadProgressStore = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.progress)) || {};
  } catch (e) {
    return {};
  }
};

const saveProgressStore = (store) => {
  localStorage.setItem(STORAGE_KEYS.progress, JSON.stringify(store));
};

const getProgressKey = () => getCurrentClientId() || 'guest';

const readProgress = () => {
  const store = loadProgressStore();
  return store[getProgressKey()] || {};
};

const writeProgress = (progress) => {
  const store = loadProgressStore();
  store[getProgressKey()] = progress;
  saveProgressStore(store);
};

const getLevelProgress = (chapterId, levelId) => {
  const progress = readProgress();
  const levelProgress = progress[chapterId]?.[levelId] || { lessons: [] };
  const completedLessons = levelProgress.lessons || [];
  const level = chapters?.[chapterId]?.levels.find((l) => l.id === levelId);
  const totalLessons = level?.lessons?.length || 0;
  const percent = totalLessons ? Math.round((completedLessons.length / totalLessons) * 100) : 0;
  return { completedLessons, totalLessons, percent };
};

const markLessonComplete = (chapterId, levelId, lessonId) => {
  const progress = readProgress();
  if (!progress[chapterId]) progress[chapterId] = {};
  if (!progress[chapterId][levelId]) progress[chapterId][levelId] = { lessons: [] };
  if (!progress[chapterId][levelId].lessons.includes(lessonId)) {
    progress[chapterId][levelId].lessons.push(lessonId);
  }
  writeProgress(progress);
  return getLevelProgress(chapterId, levelId);
};

const showToast = (message) => {
  const toast = qs('#celebrate-toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 3000);
};

const applyTheme = (theme) => {
  const clean = theme === 'light' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', clean);
  localStorage.setItem(THEME_KEY, clean);
  const toggle = qs('[data-theme-toggle]');
  if (toggle) {
    const toLight = clean === 'dark';
    toggle.textContent = toLight ? 'Switch to light mode' : 'Switch to dark mode';
    toggle.setAttribute('aria-pressed', (!toLight).toString());
  }
};

const bindThemeToggle = () => {
  const saved = localStorage.getItem(THEME_KEY) || 'dark';
  applyTheme(saved);
  const toggle = qs('[data-theme-toggle]');
  if (toggle) {
    toggle.addEventListener('click', () => {
      const next = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  }
};

const openGamesPopup = () => {
  const win = window.open(GAMES_URL, 'goodwill-games', 'width=1200,height=800,noopener');
  if (!win) {
    window.location.href = GAMES_URL;
  }
};

const bindGamesButtons = () => {
  qsa('[data-games-button]').forEach((btn) => {
    btn.addEventListener('click', openGamesPopup);
  });
};

const hydrateLessonVideo = () => {
  const iframe = qs('[data-lesson-video]');
  if (!iframe) return;

  const help = qs('#video-help');
  const showHelp = () => {
    if (help) help.classList.add('visible');
  };

  const baseSrc = iframe.dataset.videoSrc || iframe.src;

  iframe.referrerPolicy = 'strict-origin-when-cross-origin';

  const buildSrc = (src, useNoCookieHost = true) => {
    const url = new URL(src);
    url.hostname = useNoCookieHost ? 'www.youtube-nocookie.com' : 'www.youtube.com';
    const params = url.searchParams;
    params.set('rel', '0');
    params.set('modestbranding', '1');
    params.set('playsinline', '1');
    params.set('iv_load_policy', '3');
    params.set('cc_load_policy', '1');
    params.delete('origin');
    url.search = params.toString();
    return url.toString();
  };

  const fallbackHostSrc = buildSrc(baseSrc, false);
  const primarySrc = buildSrc(baseSrc, true);

  const timer = setTimeout(() => {
    if (!iframe.dataset.loaded) showHelp();
  }, 3500);

  iframe.addEventListener('load', () => {
    iframe.dataset.loaded = 'true';
    clearTimeout(timer);
  });

  iframe.addEventListener('error', () => {
    if (iframe.dataset.fallbackTried) {
      showHelp();
      return;
    }
    iframe.dataset.fallbackTried = 'true';
    iframe.src = fallbackHostSrc;
    showHelp();
  });

  iframe.src = primarySrc;
};

const startInspireTicker = () => {
  qsa('.inspire-track').forEach((track) => {
    if (!track.dataset.cloned) {
      track.innerHTML = `${track.innerHTML}${track.innerHTML}`;
      track.dataset.cloned = 'true';
    }
  });
};

const renderChapterGrid = () => {
  const grid = qs('#chapter-grid');
  if (!grid || !window.chapters) return;

  grid.innerHTML = '';
  Object.entries(window.chapters).forEach(([id, chapter]) => {
    const card = document.createElement('article');
    card.className = 'chapter-card';
    card.style.setProperty('--chapter-accent', chapter.color || '#7cf5ff');
    card.innerHTML = `
      <div class="chapter-aurora"></div>
      <div class="meta">
        <div class="badge">${chapter.icon} ${chapter.title}</div>
        <span class="subtle">${chapter.levels.length} levels</span>
      </div>
      <div class="chapter-icon" style="background:${chapter.color}">${chapter.icon}</div>
      <p>${chapter.blurb}</p>
      <p class="ndis-note">Time to level up using your own NDIS plan.</p>
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
      text: 'New chapters and levels can appear without changing how you navigate.',
      icon: '📚'
    },
    {
      title: 'Offline friendly',
      text: 'Works on simple hosting like GoDaddy while keeping the same smooth feel.',
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
  const currentClient = getCurrentClient();
  const unlocked = currentClient?.unlockedAll;

  grid.innerHTML = '';
  chapter.levels.forEach((level) => {
    const open = level.free || unlocked;
    const progress = getLevelProgress(chapterId, level.id);
    const lessonsLabel = level.lessons?.length ? `${progress.completedLessons.length}/${level.lessons.length} lessons` : `${level.topics.length} topics`;
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
      <div class="level-progress-box">
        <div class="progress-row"><span class="subtle">${lessonsLabel}</span><span class="badge">${progress.percent}%</span></div>
        <div class="progress-bar"><span style="width:${progress.percent}%"></span></div>
      </div>
      <div class="level-actions">
        ${open
          ? `<a class="btn btn-primary" href="level.html?chapter=${chapterId}&level=${level.id}">Start level</a>`
          : `<button class="btn btn-secondary" data-register="${chapterId}">Sign up to unlock</button>`}
        <a class="btn btn-secondary" href="${chapter.formLink}" target="_blank" rel="noreferrer">Service agreement</a>
      </div>
    `;
    grid.appendChild(card);
  });

  qsa('[data-register]').forEach((btn) => {
    btn.addEventListener('click', () => openAuthModal('signup'));
  });
};

const renderChapterProgress = (chapterId) => {
  const wrap = qs('#chapter-progress');
  if (!wrap || !chapters[chapterId]) return;
  wrap.innerHTML = '';
  chapters[chapterId].levels.forEach((level) => {
    const progress = getLevelProgress(chapterId, level.id);
    const row = document.createElement('div');
    row.className = 'progress-row';
    row.innerHTML = `
      <span>${level.title}</span>
      <div class="progress-bar"><span style="width:${progress.percent}%"></span></div>
      <span class="badge">${progress.percent}%</span>
    `;
    wrap.appendChild(row);
  });
};

const createSwipeSteps = (steps = []) => {
  const wrap = document.createElement('div');
  wrap.className = 'swipe-steps';

  const hint = document.createElement('p');
  hint.className = 'swipe-hint';
  hint.textContent = 'Swipe sideways or tap arrows to see each step.';

  const track = document.createElement('div');
  track.className = 'swipe-track';

  steps.forEach((step, idx) => {
    const card = document.createElement('article');
    card.className = 'swipe-step';
    card.innerHTML = `<div class="step-index">${idx + 1}</div><p>${step}</p>`;
    track.appendChild(card);
  });

  const scrollAmount = () => Math.max(track.clientWidth * 0.9, 280);
  const prev = document.createElement('button');
  prev.type = 'button';
  prev.className = 'swipe-nav prev';
  prev.textContent = '←';
  prev.addEventListener('click', () => track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' }));

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'swipe-nav next';
  next.textContent = '→';
  next.addEventListener('click', () => track.scrollBy({ left: scrollAmount(), behavior: 'smooth' }));

  wrap.append(hint, track, prev, next);
  return wrap;
};

const makeReadButton = (label, text) => {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn-voice';
  btn.textContent = label;
  if (!canSpeak) {
    btn.disabled = true;
    btn.title = 'Read-aloud not supported in this browser';
  }
  btn.addEventListener('click', () => speakText(text));
  return btn;
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

  intro.innerHTML = '';
  const introText = document.createElement('p');
  introText.className = 'subtle highlight';
  introText.textContent = level.content.intro;
  intro.appendChild(introText);

  const overviewActions = document.createElement('div');
  overviewActions.className = 'level-actions tight';
  overviewActions.appendChild(
    makeReadButton('🔊 Read this overview aloud', `${level.content.intro}. ${level.content.steps.join('. ')}`)
  );
  intro.appendChild(overviewActions);
  intro.appendChild(createSwipeSteps(level.content.steps));

  renderLessonList(chapterId, levelId, level);
  updateLessonProgressUI(chapterId, levelId);
};

const updateLessonProgressUI = (chapterId, levelId) => {
  const progress = getLevelProgress(chapterId, levelId);
  const bar = qs('#lesson-progress-bar');
  const label = qs('#lesson-progress-label');
  if (bar) bar.style.width = `${progress.percent}%`;
  if (label) label.textContent = progress.totalLessons
    ? `${progress.percent}% (${progress.completedLessons.length}/${progress.totalLessons})`
    : `${progress.percent}%`;
};

const renderLessonList = (chapterId, levelId, level) => {
  const list = qs('#lesson-list');
  if (!list) return;
  if (!level?.lessons?.length) {
    list.innerHTML = '<p class="subtle">This level will add lesson cards soon.</p>';
    return;
  }

  const progress = getLevelProgress(chapterId, levelId);
  list.innerHTML = '';

  const tabBar = document.createElement('div');
  tabBar.className = 'lesson-tabs';
  const panelWrap = document.createElement('div');
  panelWrap.className = 'lesson-panels';

  const initialLesson = progress.completedLessons.at(-1) || level.lessons[0].id;

  const setActive = (lessonId) => {
    stopSpeech();
    qsa('.lesson-tab', tabBar).forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.lesson === String(lessonId));
    });
    qsa('.lesson-panel', panelWrap).forEach((panel) => {
      panel.classList.toggle('active', panel.dataset.lesson === String(lessonId));
    });
  };

  level.lessons.forEach((lesson) => {
    const completed = progress.completedLessons.includes(lesson.id);
    const lessonSpeech = `Lesson ${lesson.id}: ${lesson.title}. ${lesson.summary}. ${lesson.content.intro}. ${lesson.content.bullets.join('. ')}`;
    const quizSpeech = `Quiz for ${lesson.title}. ${lesson.quiz
      .map((q, idx) => `Question ${idx + 1}: ${q.question}. Options: ${q.options.join(', ')}`)
      .join('. ')}`;

    const tabBtn = document.createElement('button');
    tabBtn.type = 'button';
    tabBtn.className = `lesson-tab ${completed ? 'completed' : ''}`;
    tabBtn.dataset.lesson = lesson.id;
    tabBtn.textContent = `Lesson ${lesson.id}: ${lesson.title}`;
    tabBtn.addEventListener('click', () => setActive(lesson.id));
    tabBar.appendChild(tabBtn);

    const panel = document.createElement('div');
    panel.className = 'lesson-panel';
    panel.dataset.lesson = lesson.id;

    const card = document.createElement('article');
    card.className = 'lesson-card';
    card.innerHTML = `
      <div class="glow-ring"></div>
      <header>
        <div class="lesson-meta">
          <span class="badge">Lesson ${lesson.id}</span>
          <strong>${lesson.title}</strong>
        </div>
        <span class="badge ${completed ? '' : 'locked'}" data-lesson-status> ${completed ? 'Completed' : 'Take the quiz'} </span>
      </header>
      <div class="lesson-body">
        <p>${lesson.summary}</p>
        <p class="subtle">${lesson.content.intro}</p>
        <ul class="checklist">${lesson.content.bullets.map((b) => `<li>✅ ${b}</li>`).join('')}</ul>
      </div>
    `;

    const lessonBody = card.querySelector('.lesson-body');
    const audioRow = document.createElement('div');
    audioRow.className = 'audio-row';
    audioRow.appendChild(makeReadButton('🔊 Read this lesson', lessonSpeech));
    audioRow.appendChild(makeReadButton('🧠 Read the quiz', quizSpeech));
    lessonBody.appendChild(audioRow);

    const form = document.createElement('form');
    form.className = 'quiz-form';
    lesson.quiz.forEach((q, idx) => {
      const wrap = document.createElement('div');
      wrap.className = 'quiz-question';
      wrap.innerHTML = `<p><strong>Q${idx + 1}.</strong> ${q.question}</p>`;
      const optionsWrap = document.createElement('div');
      optionsWrap.className = 'quiz-options';
      q.options.forEach((opt, optIdx) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="l${lesson.id}-q${idx}" value="${optIdx}"> ${opt}`;
        optionsWrap.appendChild(label);
      });
      wrap.appendChild(optionsWrap);
      form.appendChild(wrap);
    });

    const result = document.createElement('div');
    result.className = 'quiz-result subtle';
    const buttonRow = document.createElement('div');
    buttonRow.className = 'level-actions';
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'btn btn-primary';
    submitBtn.textContent = completed ? 'Quiz completed' : 'Check answers';
    if (completed) submitBtn.disabled = true;
    buttonRow.appendChild(submitBtn);
    form.appendChild(buttonRow);
    form.appendChild(result);

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const allCorrect = lesson.quiz.every((q, qIdx) => {
        const checked = form.querySelector(`input[name="l${lesson.id}-q${qIdx}"]:checked`);
        return checked && Number(checked.value) === q.answer;
      });

      if (allCorrect) {
        markLessonComplete(chapterId, levelId, lesson.id);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Completed';
        result.textContent = '🎉 Perfect! You passed this lesson.';
        const status = card.querySelector('[data-lesson-status]');
        if (status) {
          status.textContent = 'Completed';
          status.classList.remove('locked');
        }
        tabBtn.classList.add('completed');
        showToast('Congrats! Lesson passed');
        updateLessonProgressUI(chapterId, levelId);
        renderChapterProgress(chapterId);
      } else {
        result.textContent = 'Try again — check the hints above and retry.';
      }
    });

    card.appendChild(form);
    panel.appendChild(card);
    panelWrap.appendChild(panel);
  });

  list.appendChild(tabBar);
  list.appendChild(panelWrap);
  setActive(initialLesson);
};

const openAuthModal = (mode = 'signup') => {
  const modal = qs('#auth-modal');
  if (!modal) return;
  modal.classList.add('active');
  modal.dataset.mode = mode;
  qs('#auth-title').textContent = mode === 'login' ? 'Log in to unlock all levels' : 'Sign up to unlock all levels';
  qs('#signup-form').style.display = mode === 'signup' ? 'grid' : 'none';
  qs('#login-form').style.display = mode === 'login' ? 'grid' : 'none';
};

const closeAuthModal = () => {
  const modal = qs('#auth-modal');
  if (!modal) return;
  modal.classList.remove('active');
};

const handleSignup = (form) => {
  const formData = new FormData(form);
  const client = {
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`,
    name: formData.get('name'),
    email: formData.get('email'),
    ndis: formData.get('ndis'),
    planManager: formData.get('planManager'),
    unlockedAll: true,
    createdAt: new Date().toISOString()
  };
  upsertClient(client);
  setCurrentClientId(client.id);
  updateAuthBadge();
  closeAuthModal();
  if (window.location.pathname.includes('chapter.html')) {
    const chapterId = getChapterFromUrl();
    if (chapterId) renderLevels(chapterId);
  }
};

const handleLogin = (form, alertNode) => {
  const formData = new FormData(form);
  const email = (formData.get('email') || '').toLowerCase();
  const clients = loadClients();
  const client = clients.find((c) => c.email?.toLowerCase() === email);
  if (!client) {
    alertNode.textContent = 'No account found. Please sign up first.';
    alertNode.style.display = 'block';
    return;
  }
  setCurrentClientId(client.id);
  updateAuthBadge();
  closeAuthModal();
  if (window.location.pathname.includes('chapter.html')) {
    const chapterId = getChapterFromUrl();
    if (chapterId) renderLevels(chapterId);
  }
};

const bindAuthForms = () => {
  const signupForm = qs('#signup-form');
  const loginForm = qs('#login-form');
  const alert = qs('#auth-alert');

  if (signupForm) {
    signupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSignup(signupForm);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (alert) {
        alert.style.display = 'none';
        alert.textContent = '';
      }
      handleLogin(loginForm, alert);
    });
  }

  qsa('[data-close-modal]').forEach((btn) => btn.addEventListener('click', closeAuthModal));
  qsa('[data-auth-mode]').forEach((btn) =>
    btn.addEventListener('click', () => openAuthModal(btn.dataset.authMode))
  );
};

const logoutClient = () => {
  setCurrentClientId(null);
  updateAuthBadge();
  if (window.location.pathname.includes('chapter.html')) {
    const chapterId = getChapterFromUrl();
    if (chapterId) renderLevels(chapterId);
  }
};

const updateAuthBadge = () => {
  const badge = qs('#auth-badge');
  const btn = qs('#auth-button');
  const logoutBtn = qs('#logout-button');
  const current = getCurrentClient();
  if (current) {
    if (badge) {
      badge.textContent = `Welcome, ${current.name || 'learner'} (all levels unlocked)`;
      badge.style.display = 'inline-flex';
    }
    if (btn) {
      btn.textContent = 'Account';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline-flex';
    }
  } else {
    if (badge) badge.style.display = 'none';
    if (btn) btn.textContent = 'Sign up / Log in';
    if (logoutBtn) logoutBtn.style.display = 'none';
  }
};

const renderAdminTable = () => {
  const body = qs('#client-table-body');
  if (!body) return;
  const clients = loadClients();
  body.innerHTML = '';
  if (!clients.length) {
    body.innerHTML = '<tr><td colspan="5" class="subtle">No clients yet. Signups will appear here.</td></tr>';
    return;
  }

  clients.forEach((client) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${client.name || 'Unknown'}</td>
      <td>${client.email || '—'}</td>
      <td>${client.ndis || '—'}</td>
      <td>${client.planManager || '—'}</td>
      <td>
        <button class="btn btn-secondary" data-toggle-client="${client.id}">
          ${client.unlockedAll ? 'Lock levels' : 'Unlock levels'}
        </button>
      </td>
    `;
    body.appendChild(row);
  });

  qsa('[data-toggle-client]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.toggleClient;
      const clients = loadClients();
      const target = clients.find((c) => c.id === id);
      if (!target) return;
      const updated = unlockClientLevels(id, !target.unlockedAll);
      if (updated && getCurrentClientId() === id && window.location.pathname.includes('chapter.html')) {
        renderLevels(getChapterFromUrl());
      }
      renderAdminTable();
    });
  });
};

const hydrateHero = () => {
  const heroTitle = qs('#page-title');
  if (!heroTitle) return;
  heroTitle.textContent = 'Welcome to Goodwill Care Academy.';
};

const init = () => {
  bindThemeToggle();
  const page = document.body.dataset.page;
  hydrateHero();
  renderChapterGrid();
  renderFeatures();
  bindAuthForms();
  updateAuthBadge();
  bindGamesButtons();
  startInspireTicker();

  const authButton = qs('#auth-button');
  if (authButton) authButton.addEventListener('click', () => openAuthModal('signup'));
  const authButtonCta = qs('#auth-button-cta');
  if (authButtonCta) authButtonCta.addEventListener('click', () => openAuthModal('signup'));
  const logoutBtn = qs('#logout-button');
  if (logoutBtn) logoutBtn.addEventListener('click', logoutClient);

  if (page === 'chapter') {
    const chapterId = getChapterFromUrl();
    const headerTitle = qs('#chapter-title');
    if (!chapterId || !chapters[chapterId]) return;
    headerTitle.textContent = chapters[chapterId].title;
    qs('#chapter-blurb').textContent = chapters[chapterId].blurb;
    renderLevels(chapterId);
    renderChapterProgress(chapterId);
  }

  if (page === 'level') {
    const chapterId = getChapterFromUrl();
    const levelId = getLevelFromUrl();
    if (!chapterId || !levelId) return;
    renderLevelContent(chapterId, levelId);
    hydrateLessonVideo();
  }

  if (page === 'admin') {
    renderAdminTable();
  }
};

document.addEventListener('DOMContentLoaded', init);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSpeech();
});
