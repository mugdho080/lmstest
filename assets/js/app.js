// Minimal helper functions and renderers that consume window.chapters data.
// You can create new pages and reuse these utilities to stay on-theme.
const qs = (selector, scope = document) => scope.querySelector(selector);
const qsa = (selector, scope = document) => [...scope.querySelectorAll(selector)];

const GAMES_URL = 'https://www.crazygames.com/';
const THEME_KEY = 'ga-theme';
// Auto-detect the base directory (public_html/academy) so API calls always hit the right folder
const BASE_PATH = window.location.pathname.includes('/academy/') ? '/academy' : '';
const API_BASE = `${BASE_PATH}/backend/api.php`;

const getChapterFromUrl = () => new URLSearchParams(window.location.search).get('chapter');
const getLevelFromUrl = () => new URLSearchParams(window.location.search).get('level');

// Speech helpers for read-aloud support
const canSpeak = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
const VOICE_KEY = 'ga-voice';
let availableVoices = [];
const voiceSelectors = new Set();

const loadVoices = () => {
  if (!canSpeak) return [];
  availableVoices = window.speechSynthesis.getVoices() || [];
  return availableVoices;
};

const getVoicePreference = () => localStorage.getItem(VOICE_KEY);

const setVoicePreference = (voiceOrKey) => {
  if (!voiceOrKey) return;
  const key = typeof voiceOrKey === 'string' ? voiceOrKey : (voiceOrKey.voiceURI || voiceOrKey.name);
  if (key) localStorage.setItem(VOICE_KEY, key);
};

const voiceScore = (voice) => {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  const lang = (voice.lang || '').toLowerCase();
  let score = 0;
  if (lang.startsWith('en')) score += 6;
  if (lang.startsWith('en-us')) score += 1;
  if (voice.default) score += 1;
  if (name.includes('natural')) score += 4;
  if (name.includes('neural')) score += 4;
  if (name.includes('premium')) score += 2;
  if (name.includes('enhanced')) score += 2;
  if (name.includes('siri')) score += 1;
  if (name.includes('google')) score += 1;
  return score;
};

const pickBestVoice = (voices) => {
  if (!voices?.length) return null;
  const localVoices = voices.filter((voice) => voice.localService);
  const pool = localVoices.length ? localVoices : voices;
  return pool.reduce((best, voice) => (voiceScore(voice) > voiceScore(best) ? voice : best), pool[0]);
};

const getVoiceByKey = (voices, key) => voices?.find((voice) => voice.voiceURI === key || voice.name === key);

const resolveVoice = () => {
  const voices = availableVoices.length ? availableVoices : loadVoices();
  if (!voices.length) return null;
  const stored = getVoicePreference();
  const storedVoice = stored ? getVoiceByKey(voices, stored) : null;
  if (storedVoice) return storedVoice;
  const best = pickBestVoice(voices);
  if (best) setVoicePreference(best);
  return best;
};

const refreshVoiceSelector = (select) => {
  if (!select) return;
  const voices = availableVoices.length ? availableVoices : loadVoices();
  if (!voices.length) {
    select.innerHTML = '<option>Loading voices...</option>';
    select.disabled = true;
    return;
  }

  select.disabled = false;
  const currentVoice = resolveVoice();
  select.innerHTML = '';
  voices.forEach((voice) => {
    const option = document.createElement('option');
    option.value = voice.voiceURI || voice.name;
    const lang = voice.lang ? ` (${voice.lang})` : '';
    const source = voice.localService ? '' : ' - online';
    option.textContent = `${voice.name}${lang}${source}`;
    select.appendChild(option);
  });
  if (currentVoice) {
    select.value = currentVoice.voiceURI || currentVoice.name;
  }
};

const registerVoiceSelector = (select) => {
  if (!canSpeak || !select) return;
  voiceSelectors.add(select);
  select.addEventListener('change', () => {
    const voices = availableVoices.length ? availableVoices : loadVoices();
    const selected = getVoiceByKey(voices, select.value) || select.value;
    setVoicePreference(selected);
  });
  refreshVoiceSelector(select);
};

const initVoiceSupport = () => {
  if (!canSpeak) return;
  loadVoices();
  if (typeof window.speechSynthesis?.addEventListener === 'function') {
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      loadVoices();
      voiceSelectors.forEach((select) => refreshVoiceSelector(select));
    });
  }
};

const stopSpeech = () => {
  if (canSpeak) {
    window.speechSynthesis.cancel();
  }
};

const speakText = (text) => {
  if (!canSpeak || !text) return;
  stopSpeech();
  const utterance = new SpeechSynthesisUtterance(text);
  const voice = resolveVoice();
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang || 'en-US';
  } else {
    utterance.lang = 'en-US';
  }
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

const GAMIFY_KEY = 'ga-gamify';
const rewardAudio = new Audio('data:audio/mp3;base64,//uQxAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAACcQCAAwACABAAZGF0Yf//kP////////////////////////////8AAAAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA//8AAP//AAD//wAA');
const clapAudio = new Audio('data:audio/wav;base64,UklGRrh4AABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YZR4AAAY6iX7RPkADUD4ZAUO2vvzRtL+EQsNSRAtB8XeVAwWHnjYafPx55TUexWa9wcuzWKU2D4oaFas4YG4XCZZSIAqlJbWONlGgJznpI/DP1vZdz6wbE0yPvxska8yeVRdrpX9sMtsXN7vKnAuwWoykbH1+yRvhxHCwaY8czZ2oJtXPfsTs/qhexeSotQoV4SbVtyNytkOAwZTJ0W0PaKaLY6OX2k/XP3Y8cb9KsSvHZ7vdZYFeGG5MNzLrX7VdluK9pU/4j3v1rR86TOjFf3kqbH4rZY9kZlnJXGj9KeMB5d6fNJkZtIx0c0OFhjGPqJ0+76Q9MiKk9WG1XcsP0GrTqz3hQJm+wtXS/Y0MYOVUOqt6muk7+ph0yfaICbJt6FoHyZY+2xrWQECiThn2y4bRy8+JQ2mMeoRVM7eGgT5QEGGgFIELZPUzK3By42u09Z9X4nj8/HxsyVXdFMUMAPabzvKHXBrUgv4Bwlrzkr+zYZ4SzGLgF++Q0pM6PCOTTrCcqTW7/Du13/dX+Rx3mxTHn0AvH0mcmjNUno5eROxMTaTvRGPfJHpDaYlsz8fBmslPxl7YmpsxkvAq2g0y0FeXjvrsO7O2Mw6KvHI+eg2/UG1yVvkK8zSkqqA/0o/L1gvd0jZgmJqF6pN6x3XLZMauIpQzsY0vmCY40wuHl3GDj1Gz8Av+av8TKB4iZV44eW9UEFXEuc3UZYk5xZphSLlWfInBIRB4NTyDgphAqaFqrcxsk/A73l6ais1C2HEbDaUYE1qYO2CHe6rGeBg1xZnZwjXgStTFPr52tH7RI0Aru4mz1SY1vPMQiQfTInb5HHWzWyvTNLKKag8je+x1VSxyVlWF2rKlgFOwv4Y8DPLKlyi6NPlqIDMll874bEowjaX19Cj1PZvQtJnI98OaJ1kmHR0AzA74tj7sdjsNdtpZ8hBsVhlxxQfIkkwJ3oY1b3H4MYRh6euaITPqubItJx46LjwWBoNuLtBoXUQhAVwZjdLThy4vL6+XDmL1pskGy83YKtY6ff75u6VjEg7EvME/A/rQ50X3m6zhRJY9WzUzzNhyLTELB7GgNu/8cC0wTV/+P+OwEhBIv+qgHbAF3/DANY+9r7IAPNA8D9FATt/4QC2P2t+yP8cv/wABIBd/x//H4AzPwhAdoBngM//XYEl/qM+/r+d/zQBOj7kQRJAoAA');

const BADGE_RULES = [
  { id: 'calm-hero', label: 'Calm Hero', desc: 'Complete your first lesson', check: (s) => (s.completedLessons?.length || 0) >= 1 },
  { id: 'focus-star', label: 'Focus Star', desc: 'Earn 150 points', check: (s) => s.points >= 150, pointsRequired: 150 },
  { id: 'maths-champion', label: 'Maths Champion', desc: 'Finish any Math lesson', check: (s) => (s.chapterTallies?.['math-numbers'] || 0) >= 1 },
  { id: 'life-master', label: 'Life Skills Master', desc: 'Finish any Life Skills lesson', check: (s) => (s.chapterTallies?.['life-skills-independence'] || 0) >= 1 },
  { id: 'psych-guardian', label: 'Calm Guardian', desc: 'Finish any Psychology lesson', check: (s) => (s.chapterTallies?.['psychology-behaviour'] || 0) >= 1 }
];

const defaultGamifyState = () => ({
  points: 0,
  badges: [],
  avatar: { character: 'Explorer', color: 'mint', accessory: 'star' },
  mood: 'Calm',
  chapterTallies: {},
  completedLessons: [],
  choice: 'Free roam'
});

const loadGamify = () => {
  try {
    return { ...defaultGamifyState(), ...(JSON.parse(localStorage.getItem(GAMIFY_KEY)) || {}) };
  } catch (e) {
    return defaultGamifyState();
  }
};

const saveGamify = (state) => {
  localStorage.setItem(GAMIFY_KEY, JSON.stringify(state));
};

const safeJson = async (res) => {
  try {
    return await res.json();
  } catch (e) {
    return null;
  }
};

const fetchChaptersFromApi = async () => {
  try {
    const res = await fetch(`${API_BASE}?action=chapters`, { cache: 'no-store' });
    if (!res.ok) return false;
    const data = await safeJson(res);
    if (data?.chapters) {
      chapters = data.chapters;
      window.chapters = chapters;
      return true;
    }
  } catch (e) {
    console.warn('Falling back to bundled chapter data', e);
  }
  return false;
};

const postApi = async (action, payload = {}) => {
  const res = await fetch(`${API_BASE}?action=${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error('API call failed');
  return safeJson(res);
};

const pushClientToApi = async (client) => {
  try {
    await postApi('signup', { client });
  } catch (e) {
    console.warn('Signup sync skipped', e);
  }
};

const loginFromApi = async (email) => {
  try {
    const data = await postApi('login', { email });
    return data?.client || null;
  } catch (e) {
    return null;
  }
};

const syncProgressToApi = async (chapterId, levelId) => {
  const clientId = getCurrentClientId();
  if (!clientId) return;
  const progress = readProgress();
  const lessons = progress?.[chapterId]?.[levelId]?.lessons || [];
  try {
    await postApi('progress_save', { clientId, chapter: chapterId, level: levelId, lessons });
  } catch (e) {
    console.warn('Progress sync skipped', e);
  }
};

const pullProgressFromApi = async () => {
  const clientId = getCurrentClientId();
  if (!clientId) return;
  try {
    const data = await postApi('progress_get', { clientId });
    if (data?.progress) {
      const store = loadProgressStore();
      store[getProgressKey()] = data.progress;
      saveProgressStore(store);
    }
  } catch (e) {
    console.warn('Progress fetch skipped', e);
  }
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
  syncProgressToApi(chapterId, levelId);
  return getLevelProgress(chapterId, levelId);
};

const playRewardChime = () => {
  try {
    rewardAudio.currentTime = 0;
    rewardAudio.play().catch(() => {});
  } catch (e) {
    /* noop */
  }
};

const playClap = () => {
  try {
    clapAudio.currentTime = 0;
    clapAudio.play().catch(() => {});
  } catch (e) {
    /* noop */
  }
};

const triggerCelebrate = () => {
  const overlay = document.createElement('div');
  overlay.className = 'celebrate-burst';
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 1200);
};

const evaluateBadges = (state) => {
  const updated = { ...state };
  BADGE_RULES.forEach((rule) => {
    if (rule.check(updated) && !updated.badges.includes(rule.id)) {
      updated.badges.push(rule.id);
      showToast(`Unlocked: ${rule.label}`);
      playRewardChime();
    }
  });
  saveGamify(updated);
  updatePlayerHub();
  return updated;
};

const awardPoints = (amount = 1, reason = '', options = {}) => {
  const state = loadGamify();
  state.points = Math.max(0, Math.round((state.points || 0) + amount));
  saveGamify(state);
  if (!options?.silent) {
    if (options?.celebrate) triggerCelebrate();
    playRewardChime();
    showToast(reason || `+${amount} points`);
  }
  evaluateBadges(state);
};

const recordLessonAchievement = (chapterId, levelId, lessonId) => {
  const state = loadGamify();
  const key = `${chapterId}:${levelId}:${lessonId}`;
  if (!state.completedLessons.includes(key)) {
    state.completedLessons.push(key);
    state.chapterTallies[chapterId] = (state.chapterTallies[chapterId] || 0) + 1;
    saveGamify(state);
    awardPoints(25, 'Well done! Lesson complete', { celebrate: true });
  } else {
    evaluateBadges(state);
  }
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
  awardPoints(3, 'Break time!');
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
      <p class="subtle">Land unlocked: ${chapter.title} — choose this mission to earn bonus points.</p>
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
      <div class="progress-visuals">
        <div class="progress-bar"><span style="width:${progress.percent}%"></span></div>
        <div class="battery-bar" aria-hidden="true"><span style="width:${progress.percent}%"></span></div>
      </div>
      <span class="badge">${progress.percent}%</span>
    `;
    wrap.appendChild(row);
  });
};

const getOverallProgress = () => {
  let total = 0;
  let done = 0;
  Object.entries(chapters || {}).forEach(([chapterId, chapter]) => {
    (chapter.levels || []).forEach((level) => {
      const levelTotal = level.lessons?.length || 0;
      total += levelTotal;
      const progress = getLevelProgress(chapterId, level.id);
      done += progress.completedLessons.length;
    });
  });
  const percent = total ? Math.round((done / total) * 100) : 0;
  return { done, total, percent };
};

const pointsUntilNextBadge = (state) => {
  const pending = BADGE_RULES.filter((rule) => rule.pointsRequired && !(state.badges || []).includes(rule.id));
  if (!pending.length) return 0;
  const deltas = pending.map((rule) => Math.max(0, (rule.pointsRequired || 0) - (state.points || 0)));
  return Math.min(...deltas);
};

const renderPlayerHub = () => {
  const hub = qs('#player-hub');
  if (!hub) return;
  const overall = getOverallProgress();
  const state = loadGamify();
  hub.innerHTML = `
    <div class="section-title">
      <h2>Hero hub</h2>
      <p class="subtle">Earn points, unlock badges, and watch your avatar grow. Choose your mood and mission before you start.</p>
    </div>
    <div class="player-grid">
      <div class="score-card">
        <div class="score-points">⭐ <span id="score-points">${state.points}</span> pts</div>
        <div class="progress-row">
          <span class="subtle">Overall journey</span>
          <span class="badge" id="score-progress-label">${overall.percent}%</span>
        </div>
        <div class="progress-bar"><span id="score-progress-bar" style="width:${overall.percent}%"></span></div>
        <p class="badge-hint" id="badge-points-needed"></p>
        <p class="subtle">Every tap, quiz, and step gives you points. Badges unlock as you explore.</p>
        <div class="hud-avatar" id="hud-avatar"></div>
      </div>
      <div class="score-card">
        <h3>Badges</h3>
        <div class="badge-row" id="badge-row"></div>
      </div>
      <div class="score-card">
        <h3>Today’s choices</h3>
        <div class="choice-row" id="choice-row"></div>
        <div class="mission-row" id="mission-row"></div>
      </div>
    </div>
  `;
  updatePlayerHub();
};

const renderAvatarLab = () => {
  const lab = qs('#avatar-lab');
  if (!lab) return;
  const state = loadGamify();
  const avatars = [
    { id: 'Explorer', label: 'Explorer', emoji: '🧑‍🚀' },
    { id: 'Calm Friend', label: 'Calm Friend', emoji: '🧘' },
    { id: 'Math Wiz', label: 'Math Wiz', emoji: '🧠' }
  ];
  const accessories = [
    { id: 'star', label: 'Star cap' },
    { id: 'cape', label: 'Hero cape' },
    { id: 'sprout', label: 'Sprout hat' }
  ];
  lab.innerHTML = `
    <div class="section-title">
      <h2>Pick your avatar</h2>
      <p class="subtle">Choose who you are today. Unlock colors and accessories as you learn.</p>
    </div>
    <div class="avatar-grid">
      <div class="avatar-picker" id="avatar-picker">
        ${avatars.map((a) => `<button type="button" class="avatar-choice" data-avatar="${a.id}"><span class="avatar-face">${a.emoji}</span><span class="avatar-label">${a.label}</span></button>`).join('')}
      </div>
      <div class="avatar-accessories" id="avatar-accessories">
        ${accessories.map((a) => `<button type="button" class="avatar-choice ghost" data-accessory="${a.id}"><span class="avatar-label">${a.label}</span></button>`).join('')}
      </div>
      <div class="avatar-preview" id="avatar-preview">
        <div class="avatar-emoji">${state.avatar.character === 'Calm Friend' ? '🧘' : state.avatar.character === 'Math Wiz' ? '🧠' : '🧑‍🚀'}</div>
        <p class="subtle">Accessory: ${state.avatar.accessory}</p>
      </div>
    </div>
  `;

  qsa('[data-avatar]', lab).forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = loadGamify();
      next.avatar.character = btn.dataset.avatar;
      saveGamify(next);
      awardPoints(5, 'Avatar selected');
      renderAvatarLab();
      updatePlayerHub();
    });
  });

  qsa('[data-accessory]', lab).forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = loadGamify();
      next.avatar.accessory = btn.dataset.accessory;
      saveGamify(next);
      awardPoints(3, 'Accessory equipped');
      renderAvatarLab();
      updatePlayerHub();
    });
  });
};

const renderEmotionZone = () => {
  const zone = qs('#emotion-zone');
  if (!zone) return;
  const feelings = [
    { id: 'Calm', emoji: '🧘', tip: 'Slow breathing helps your brain.' },
    { id: 'Happy', emoji: '😄', tip: 'Use that energy to explore a new lesson.' },
    { id: 'Worried', emoji: '😟', tip: 'Tap the breathing circle to reset.' },
    { id: 'Excited', emoji: '🤩', tip: 'Channel it into a quick quiz!' }
  ];
  zone.innerHTML = `
    <div class="section-title">
      <h2>How are you feeling?</h2>
      <p class="subtle">Pick a mood, try a calming animation, or tap the friendly critter to practice patience.</p>
    </div>
    <div class="feeling-row" id="feeling-row">
      ${feelings.map((f) => `<button type="button" class="mood-chip mood-large" data-mood="${f.id}" title="${f.tip}">${f.emoji} ${f.id}</button>`).join('')}
    </div>
    <div class="calm-tools">
      <div class="breathing-card">
        <div class="breathing-circle" aria-label="Breathing exercise"></div>
        <p class="subtle">Breathe in as the circle grows, out as it shrinks.</p>
      </div>
      <div class="calm-pet" id="calm-pet" role="button" tabindex="0">🐢 Tap the turtle to calm it down</div>
    </div>
  `;

  qsa('[data-mood]', zone).forEach((btn) => {
    btn.addEventListener('click', () => {
      const next = loadGamify();
      next.mood = btn.dataset.mood;
      saveGamify(next);
      awardPoints(2, `Mood set: ${next.mood}`);
      updatePlayerHub();
    });
  });

  const pet = qs('#calm-pet', zone);
  if (pet) {
    pet.addEventListener('click', () => {
      pet.classList.add('soothed', 'wiggle');
      setTimeout(() => pet.classList.remove('soothed', 'wiggle'), 1200);
      awardPoints(1, 'Nice calming tap');
    });
  }
};

const updatePlayerHub = () => {
  const state = loadGamify();
  const overall = getOverallProgress();
  const pointsEl = qs('#score-points');
  if (pointsEl) pointsEl.textContent = state.points;
  const progressBar = qs('#score-progress-bar');
  if (progressBar) progressBar.style.width = `${overall.percent}%`;
  const badgeHint = qs('#badge-points-needed');
  if (badgeHint) {
    const remaining = pointsUntilNextBadge(state);
    badgeHint.textContent = remaining > 0 ? `${remaining} pts to your next badge` : 'All point badges unlocked — keep exploring missions!';
  }
  const progressLabel = qs('#score-progress-label');
  if (progressLabel) progressLabel.textContent = `${overall.percent}%`;

  const badgeRow = qs('#badge-row');
  if (badgeRow) {
    badgeRow.innerHTML = '';
    BADGE_RULES.forEach((rule) => {
      const has = state.badges.includes(rule.id);
      const chip = document.createElement('div');
      chip.className = `badge-chip ${has ? 'on' : 'off'}`;
      chip.textContent = has ? `🏅 ${rule.label}` : `🔒 ${rule.label}`;
      chip.title = rule.desc;
      badgeRow.appendChild(chip);
    });
  }

  const choiceRow = qs('#choice-row');
  if (choiceRow) {
    choiceRow.innerHTML = `
      <div class="choice-card">Mood: <strong>${state.mood}</strong></div>
      <div class="choice-card">Avatar: <strong>${state.avatar.character}</strong></div>
      <div class="choice-card">Mission: <strong>${state.choice}</strong></div>
    `;
  }

  const missionRow = qs('#mission-row');
  if (missionRow && chapters) {
    missionRow.innerHTML = '';
    Object.entries(chapters).forEach(([id, chapter]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn btn-secondary ghost';
      btn.textContent = `${chapter.icon} ${chapter.title}`;
      btn.addEventListener('click', () => {
        const next = loadGamify();
        next.choice = `${chapter.title} mission`;
        saveGamify(next);
        awardPoints(4, 'Mission chosen');
        updatePlayerHub();
      });
      missionRow.appendChild(btn);
    });
  }

  const hud = qs('#hud-avatar');
  if (hud) {
    const emoji = state.avatar.character === 'Calm Friend' ? '🧘' : state.avatar.character === 'Math Wiz' ? '🧠' : '🧑‍🚀';
    hud.innerHTML = `<div class="hud-emoji">${emoji}</div><p class="subtle">Accessory: ${state.avatar.accessory}</p>`;
  }
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

const createVoiceSelector = () => {
  if (!canSpeak) return null;
  const wrapper = document.createElement('div');
  wrapper.className = 'voice-picker';
  const label = document.createElement('span');
  const labelId = `voice-label-${Math.random().toString(36).slice(2, 8)}`;
  label.id = labelId;
  label.className = 'voice-picker-label';
  label.textContent = 'Voice';
  const select = document.createElement('select');
  select.setAttribute('aria-labelledby', labelId);
  registerVoiceSelector(select);
  wrapper.append(label, select);
  return wrapper;
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
  const voiceSelector = createVoiceSelector();
  if (voiceSelector) intro.appendChild(voiceSelector);
  intro.appendChild(createSwipeSteps(level.content.steps));

  renderLessonList(chapterId, levelId, level);
  updateLessonProgressUI(chapterId, levelId);
};

const updateLessonProgressUI = (chapterId, levelId) => {
  const progress = getLevelProgress(chapterId, levelId);
  const bar = qs('#lesson-progress-bar');
  const label = qs('#lesson-progress-label');
  const track = qs('#lesson-progress-track');
  const inlineBar = qs('#lesson-progress-inline-bar');
  const inlineLabel = qs('#lesson-progress-inline-label');
  const inlinePercent = qs('#lesson-progress-inline-percent');
  if (bar) bar.style.width = `${progress.percent}%`;
  if (label) label.textContent = progress.totalLessons
    ? `${progress.percent}% (${progress.completedLessons.length}/${progress.totalLessons})`
    : `${progress.percent}%`;
  if (track) track.setAttribute('aria-valuenow', `${progress.percent}`);
  if (inlineBar) inlineBar.style.width = `${progress.percent}%`;
  if (inlineLabel) inlineLabel.textContent = progress.totalLessons
    ? `${progress.completedLessons.length}/${progress.totalLessons} lessons complete`
    : 'No lessons tracked yet';
  if (inlinePercent) inlinePercent.textContent = `${progress.percent}%`;
};

const renderLessonList = (chapterId, levelId, level) => {
  const list = qs('#lesson-list');
  if (!list) return;
  if (!level?.lessons?.length) {
    list.innerHTML = '<p class="subtle">This level will add lesson cards soon.</p>';
    return;
  }

  list.innerHTML = '';
  const lessons = level.lessons;

  const shell = document.createElement('div');
  shell.className = 'lesson-flash-shell';

  const header = document.createElement('div');
  header.className = 'lesson-flash-header';

  const stepLabel = document.createElement('div');
  stepLabel.className = 'lesson-flash-step';
  stepLabel.id = 'lesson-flash-step';

  const progressWrap = document.createElement('div');
  progressWrap.className = 'lesson-flash-progress';
  progressWrap.innerHTML = `
    <div class="progress-row">
      <span class="subtle" id="lesson-progress-inline-label"></span>
      <span class="badge" id="lesson-progress-inline-percent"></span>
    </div>
    <div class="progress-bar"><span id="lesson-progress-inline-bar" style="width:0%"></span></div>
  `;

  const nav = document.createElement('div');
  nav.className = 'lesson-flash-nav';

  const prevBtn = document.createElement('button');
  prevBtn.type = 'button';
  prevBtn.className = 'btn btn-secondary ghost';
  prevBtn.textContent = 'Previous lesson';

  const nextBtn = document.createElement('button');
  nextBtn.type = 'button';
  nextBtn.className = 'btn btn-secondary ghost';
  nextBtn.textContent = 'Next lesson';

  nav.append(prevBtn, nextBtn);
  header.append(stepLabel, progressWrap, nav);

  const viewport = document.createElement('div');
  viewport.className = 'lesson-flash-viewport';

  const cardWrap = document.createElement('div');
  cardWrap.className = 'lesson-flashcard';

  viewport.appendChild(cardWrap);
  shell.append(header, viewport);
  list.appendChild(shell);

  const completedLessons = () => getLevelProgress(chapterId, levelId).completedLessons;
  let activeIndex = lessons.findIndex((lesson) => !completedLessons().includes(lesson.id));
  if (activeIndex === -1) activeIndex = Math.max(lessons.length - 1, 0);

  const updateHeader = () => {
    stepLabel.textContent = `Lesson ${activeIndex + 1} of ${lessons.length}`;
    prevBtn.disabled = activeIndex <= 0;
    nextBtn.disabled = activeIndex >= lessons.length - 1;
    updateLessonProgressUI(chapterId, levelId);
  };

  const buildLessonCard = (lesson) => {
    const completed = completedLessons().includes(lesson.id);
    const lessonSpeech = `Lesson ${lesson.id}: ${lesson.title}. ${lesson.summary}. ${lesson.content.intro}. ${lesson.content.bullets.join('. ')}`;
    const quizSpeech = `Quiz for ${lesson.title}. ${lesson.quiz
      .map((q, idx) => `Question ${idx + 1}: ${q.question}. Options: ${q.options.join(', ')}`)
      .join('. ')}`;

    const card = document.createElement('article');
    card.className = 'lesson-card';
    card.innerHTML = `
      <div class="glow-ring"></div>
      <header>
        <div class="lesson-meta">
          <span class="badge">Lesson ${lesson.id}</span>
          <strong>${lesson.title}</strong>
        </div>
        <span class="badge ${completed ? '' : 'locked'}" data-lesson-status>${completed ? 'Completed' : 'Take the quiz'}</span>
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
      optionsWrap.dataset.pointsGiven = 'false';
      q.options.forEach((opt, optIdx) => {
        const label = document.createElement('label');
        label.innerHTML = `<input type="radio" name="l${lesson.id}-q${idx}" value="${optIdx}"> ${opt}`;
        optionsWrap.appendChild(label);
      });
      optionsWrap.addEventListener('change', () => {
        if (optionsWrap.dataset.pointsGiven === 'false') {
          optionsWrap.dataset.pointsGiven = 'true';
          awardPoints(2, 'Great choice!');
        }
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
        recordLessonAchievement(chapterId, levelId, lesson.id);
        submitBtn.disabled = true;
        submitBtn.textContent = 'Completed';
        result.textContent = '🎉 Perfect! You passed this lesson.';
        const status = card.querySelector('[data-lesson-status]');
        if (status) {
          status.textContent = 'Completed';
          status.classList.remove('locked');
        }
        playClap();
        showToast('Congrats! Lesson passed');
        updateLessonProgressUI(chapterId, levelId);
        renderChapterProgress(chapterId);
        updatePlayerHub();

        const lessonIndex = lessons.findIndex((item) => item.id === lesson.id);
        if (lessonIndex >= 0 && lessonIndex < lessons.length - 1) {
          setTimeout(() => swapLesson(lessonIndex + 1, 'next'), 360);
        }
      } else {
        result.textContent = 'Try again — check the hints above and retry.';
      }
    });

    card.appendChild(form);
    return card;
  };

  let isAnimating = false;
  const swapLesson = (nextIndex, direction = 'next', animate = true) => {
    if (nextIndex < 0 || nextIndex >= lessons.length) return;
    if (isAnimating) return;
    stopSpeech();
    const outClass = direction === 'prev' ? 'flash-out-left' : 'flash-out-right';
    const inClass = direction === 'prev' ? 'flash-in-right' : 'flash-in-left';

    const mount = () => {
      cardWrap.innerHTML = '';
      cardWrap.appendChild(buildLessonCard(lessons[nextIndex]));
      activeIndex = nextIndex;
      updateHeader();
    };

    if (!animate || !cardWrap.firstElementChild) {
      mount();
      return;
    }

    isAnimating = true;
    cardWrap.classList.remove('flash-in-left', 'flash-in-right', 'flash-out-left', 'flash-out-right');
    cardWrap.classList.add(outClass);
    window.setTimeout(() => {
      cardWrap.classList.remove(outClass);
      mount();
      cardWrap.classList.add(inClass);
      window.setTimeout(() => {
        cardWrap.classList.remove(inClass);
        isAnimating = false;
      }, 420);
    }, 360);
  };

  prevBtn.addEventListener('click', () => swapLesson(activeIndex - 1, 'prev'));
  nextBtn.addEventListener('click', () => swapLesson(activeIndex + 1, 'next'));

  swapLesson(activeIndex, 'next', false);
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

const handleSignup = async (form) => {
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
  pushClientToApi(client);
  if (window.location.pathname.includes('chapter.html')) {
    const chapterId = getChapterFromUrl();
    if (chapterId) renderLevels(chapterId);
  }
};

const handleLogin = async (form, alertNode) => {
  const formData = new FormData(form);
  const email = (formData.get('email') || '').toLowerCase();
  const clients = loadClients();
  let client = clients.find((c) => c.email?.toLowerCase() === email);

  if (!client) {
    const remote = await loginFromApi(email);
    if (remote) {
      client = {
        id: remote.id,
        name: remote.name,
        email: remote.email,
        ndis: remote.ndis,
        planManager: remote.planManager,
        unlockedAll: remote.unlockedAll,
      };
      upsertClient(client);
      await pullProgressFromApi();
    }
  }

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
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      await handleSignup(signupForm);
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (alert) {
        alert.style.display = 'none';
        alert.textContent = '';
      }
      await handleLogin(loginForm, alert);
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
  initVoiceSupport();
  const page = document.body.dataset.page;
  hydrateHero();
  renderPlayerHub();
  renderAvatarLab();
  renderEmotionZone();
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

const boot = async () => {
  await fetchChaptersFromApi();
  if (getCurrentClientId()) {
    await pullProgressFromApi();
  }
  init();
};

document.addEventListener('DOMContentLoaded', boot);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) stopSpeech();
});
