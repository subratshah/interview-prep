// ── Question Registry ─────────────────────────────────────────
// Add new question sets by creating a data/xyz.js file that calls
// QuestionDB.register('name', [...]) and adding a <script> tag in index.template.html
// (then run `node scripts/compose-html.mjs` to refresh index.html).
window.QuestionDB = (function () {
  const _tables = {};
  return {
    register(name, questions) {
      _tables[name] = questions.map(q => ({ ...q, type: name }));
    },
    all() {
      return Object.values(_tables).flat();
    }
  };
})();

// ── Constants ──────────────────────────────────────────────
const VALID_TABS = ['android', 'behavioral', 'data-structures', 'system-design'];
const THEME_STORAGE_KEY = 'interview-theme';
const ZOOM_STORAGE_KEY = 'interview-ui-zoom';
const ZOOM_MIGRATION_KEY = 'interview-ui-zoom-v2';
const ROADMAP_STORAGE_KEY = 'interview-roadmap-mode';
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const ZOOM_DEFAULT = 1;
const VALID_RATING_VALUES = new Set(['know', 'shaky', 'review']);
// Same-origin by derivation: the page's own server (`server/proxy-server.js`, any port,
// LAN IP or localhost) forwards `/api/*` to the progress API, so these fetches are never
// cross-origin and need no CORS grant. A hardcoded `localhost:1001` broke on any port
// override and for every non-host device; with no API answering (plain static server)
// each fetch fails and the existing localStorage fallback takes over unchanged.
const SERVER_API_BASE = window.location.origin;
const MEMORY_SLIDER_MIN = 0;
const MEMORY_SLIDER_MAX = 3;

// ── State ──────────────────────────────────────────────────
let questions = [];

const state = {
  activeTab: 'android',
  diffFilter: null,  // null | 'E' | 'M' | 'H' — null = show all difficulties
  statusFilter: null,    // null | 'star' | 'know' | 'shaky' | 'review' | 'unseen'
  tagFilters: [],        // array of strings — multiple tags can be selected (AND logic)
  /** Exactly one `{ type, section }` is visible in the feed at a time. */
  activeFeedSection: null, // null | { type: string, section: string }
  /** After sidebar picks a section, keep it even when filters hide all questions here (cleared on filter/search/tab changes). */
  feedSectionPinned: false,
  selectedId: null,
  cardRevealed: false,
  learningMode: true,
  theme: 'dark',         // resolved: 'light' | 'dark'
  uiZoom: ZOOM_DEFAULT,
  ratings: {},           // { [id]: 'know' | 'shaky' | 'review' }
  seen: new Set(),       // IDs of questions ever opened
  hiddenIds: new Set(),  // IDs of AI questions hidden/deleted locally
  showRoadmap: false,    // roadmap mode: the detail pane shows the path (#detail-roadmap)
  history: [],           // array of question IDs visited
  historyIdx: -1,        // current position in history
};

// ── UI zoom ladder ────────────────────────────────────────────
// The size you see at browser zoom 100% is baked into the sheet
// (html { font-size: calc(18px * var(--z)) }), so this ladder only moves --z.
// There is deliberately no `zoom` property: measured on the as-shipped page,
// `zoom: 1.5` left a 1104px tall shell rendering 1655px tall inside the window
// while matchMedia still reported a 1535px viewport, so nothing could re-flow
// and the browser's own zoom could not be reset from the page.
// ⌘/Ctrl +−0 is therefore NOT intercepted — those belong to the browser, whose
// zoom re-flows the layout properly. The ladder answers to bare +/−/0.
function clampZoom(level) {
  if (!Number.isFinite(level)) return ZOOM_DEFAULT;
  const snapped = Math.round(level / ZOOM_STEP) * ZOOM_STEP;
  return Math.round(Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, snapped)) * 100) / 100;
}

// theme-init.js sets --z before first paint; read it back so the two can never
// disagree, and so a stored legacy value cannot double-apply.
function readAppliedZoom() {
  return clampZoom(parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--z')));
}

function applyZoom(level) {
  const zoom = clampZoom(level);
  state.uiZoom = zoom;
  document.documentElement.style.setProperty('--z', String(zoom));
  try {
    localStorage.setItem(ZOOM_STORAGE_KEY, String(zoom));
    localStorage.setItem(ZOOM_MIGRATION_KEY, '1');
  } catch (e) {}
}

function stepZoom(delta) {
  const current = state.uiZoom ?? ZOOM_DEFAULT;
  const next = clampZoom(current + delta * ZOOM_STEP);
  if (next === current) return;
  applyZoom(next);
}

function resetZoom() {
  applyZoom(ZOOM_DEFAULT);
}

function initZoom() {
  state.uiZoom = readAppliedZoom();
}

function handleZoomShortcut(e) {
  // Any modifier means it is the browser's key (⌘/Ctrl +−0, ⌥⌘…), so leave it
  // alone entirely: no preventDefault, no early return.
  if (e.metaKey || e.ctrlKey || e.altKey) return false;
  if (isShortcutSuppressedTarget(e.target)) return false;

  const key = e.key;
  if (key === '=' || key === '+') {
    e.preventDefault();
    stepZoom(1);
    return true;
  }
  if (key === '-' || key === '_') {
    e.preventDefault();
    stepZoom(-1);
    return true;
  }
  if (key === '0') {
    e.preventDefault();
    resetZoom();
    return true;
  }
  return false;
}

// ── Theme ─────────────────────────────────────────────────────
function getSystemTheme() {
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch (e) {}
  return null;
}

function getResolvedTheme() {
  return getStoredTheme() || getSystemTheme();
}

function getMermaidTheme() {
  return getResolvedTheme() === 'light' ? 'light' : 'dark';
}

function applyTheme(theme, { persist = false } = {}) {
  const resolved = theme === 'light' || theme === 'dark' ? theme : getSystemTheme();
  state.theme = resolved;
  document.documentElement.dataset.theme = resolved;

  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, resolved);
    } catch (e) {}
  }

  // Mermaid is configured where its diagrams are drawn (see
  // runMermaidInContainer) so a theme switch takes effect on the next render
  // without this function having to know about it.

  syncThemeToggleUI();
}

function toggleTheme() {
  const current = getResolvedTheme();
  const next = current === 'light' ? 'dark' : 'light';
  applyTheme(next, { persist: true });
  if (state.selectedId) renderMainPanel();
}

function syncThemeToggleUI() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) {
    return;
  }
  
  const currentTheme = getResolvedTheme();
  const isLight = currentTheme === 'light';
  const label = isLight ? 'Switch to dark theme' : 'Switch to light theme';
  btn.setAttribute('aria-label', label);
  btn.title = label;
  
  // Update minimal toggle visual state based on theme
  const themeToggle = document.getElementById('theme-toggle');
  const textElement = themeToggle?.querySelector('.minimal-text');
  
  if (themeToggle && textElement) {
    const isDark = currentTheme === 'dark';

    
    if (isDark) {
      themeToggle.classList.add('active');
      textElement.textContent = 'Dark';
    } else {
      themeToggle.classList.remove('active');
      textElement.textContent = 'Light';
    }
    


  }
}

function initTheme() {
  applyTheme(getResolvedTheme());

  const mq = window.matchMedia('(prefers-color-scheme: light)');
  mq.addEventListener('change', () => {
    if (getStoredTheme()) return;
    applyTheme(getSystemTheme());
    if (state.selectedId) renderMainPanel();
  });

  // Theme toggle uses onclick attribute in HTML
}

// ── Persistence ─────────────────────────────────────────────
function loadRatings() {
  try {
    const raw = localStorage.getItem('interview-ratings');
    if (raw) state.ratings = JSON.parse(raw);
  } catch (e) {}
}

function saveRatings() {
  try {
    localStorage.setItem('interview-ratings', JSON.stringify(state.ratings));
  } catch (e) {}
  // Fire-and-forget server sync
  saveProgressToServer({ ratings: state.ratings, seen: state.seen }).catch(() => {});
}

function loadSeen() {
  try {
    const raw = localStorage.getItem('interview-seen');
    if (raw) state.seen = new Set(JSON.parse(raw));
  } catch (e) {}
}

function saveSeen() {
  try {
    localStorage.setItem('interview-seen', JSON.stringify([...state.seen]));
  } catch (e) {}
  // Fire-and-forget server sync
  saveProgressToServer({ ratings: state.ratings, seen: state.seen }).catch(() => {});
}

function loadHiddenIds() {
  try {
    const raw = localStorage.getItem('interview-hidden');
    if (raw) state.hiddenIds = new Set(JSON.parse(raw));
  } catch (e) {}
}

function saveHiddenIds() {
  try {
    localStorage.setItem('interview-hidden', JSON.stringify([...state.hiddenIds]));
  } catch (e) {}
}

/** Roadmap mode is a UI mode, so it persists like the theme and Learn/Quiz. */
function loadRoadmapMode() {
  try {
    state.showRoadmap = localStorage.getItem(ROADMAP_STORAGE_KEY) === '1';
  } catch (e) {
    state.showRoadmap = false;
  }
}

function saveRoadmapMode() {
  try {
    localStorage.setItem(ROADMAP_STORAGE_KEY, state.showRoadmap ? '1' : '0');
  } catch (e) {}
}

/**
 * One-time cleanup: card collapse state now follows Learn/Quiz mode and is
 * re-derived on every render, so the old per-question `notion-collapsed::`
 * keys are pure dead UI state.
 */
function purgeCollapsedCardStorage() {
  try {
    const doomed = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('notion-collapsed::')) doomed.push(key);
    }
    doomed.forEach(key => localStorage.removeItem(key));
  } catch (e) {}
}

/**
 * Load progress from server, with localStorage fallback and one-time import.
 * Returns true if server was used successfully.
 */
async function loadProgressWithServerFallback() {
  try {
    const { ratings, seen } = await fetchProgressFromServer();
    // If server has data, use it
    if (ratings && Object.keys(ratings).length > 0 || seen && seen.size > 0) {
      state.ratings = ratings;
      state.seen = seen;
      return true;
    }
    // Server is empty: try one-time import from localStorage
    const hasLocal = localStorage.getItem('interview-ratings') || localStorage.getItem('interview-seen');
    if (hasLocal) {
      const imported = await importLocalStorageToServer();
      if (imported) {
        const fresh = await fetchProgressFromServer();
        state.ratings = fresh.ratings;
        state.seen = fresh.seen;
        return true;
      }
    }
    // Server empty and nothing to import: start fresh
    state.ratings = {};
    state.seen = new Set();
    return true;
  } catch (err) {
    // Server unavailable – fallback handled by caller
    return false;
  }
}

// ── Helpers ──────────────────────────────────────────────────
function getRating(id) {
  return state.ratings[id] || null;
}

/** CSS state class for `.memory-dots` and feed `.qcard-memory` (knew | shaky | forgot | unseen | '').
 *  Derived from detailMemorySliderValueForId — the single seen/rating precedence — so the feed gem,
 *  the dots, the detail slider and the roadmap fill can never disagree. */
function memoryDotStateClassForId(id) {
  if (!id) return '';
  return MEMORY_DOT_CLASS_BY_VALUE[detailMemorySliderValueForId(id)] || '';
}

/** Short phrase for Accessible Name / status text: the shared label for the same 4-level value. */
function memoryStatusPhraseForId(id) {
  if (!id) return '';
  return MEMORY_LABELS[detailMemorySliderValueForId(id)] || '';
}

/** `#detail-memory-range`: 0 unseen … 3 know (ordinal memory scale). */

function normalizeMemorySliderValue(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return null;
  const v = Math.round(n);
  if (v < MEMORY_SLIDER_MIN || v > MEMORY_SLIDER_MAX) return null;
  return v;
}

/**
 * Slider 0–3 → sidebar `data-status` / filter values.
 * Unseen is expressed only via `state.seen`, not `state.ratings`.
 */
function getStatusFromSliderValue(rawValue) {
  const v = normalizeMemorySliderValue(rawValue);
  if (v === null) return null;
  const map = MEMORY_STATUS_BY_VALUE;
  return map[v] ?? null;
}

/**
 * Memory-only statuses → slider position. `star` and unknown → null (no slider notch).
 */
function getSliderValueFromStatus(status) {
  if (!status) return null;
  const map = MEMORY_VALUE_BY_STATUS;
  return map[status] ?? null;
}

/** Unseen: clear rating and remove from seen (filter + detail slider position 0). */
function applyUnseenMemoryState(id) {
  if (!id) return;
  delete state.ratings[id];
  state.seen.delete(id);
}

/**
 * Positions 1–3: set `state.ratings` and mark seen. Does nothing for unseen (use `applyUnseenMemoryState`).
 */
function applyRatedMemoryFromSliderValue(id, rawSliderValue) {
  if (!id) return;
  const v = normalizeMemorySliderValue(rawSliderValue);
  if (v === null || v === 0) return;
  const status = getStatusFromSliderValue(v);
  if (!status || status === 'unseen') return;
  state.ratings[id] = status;
  state.seen.add(id);
}

function getQuestionById(id) {
  return questions.find(q => q.id === id) || null;
}

/** Ordinal for secondary sort Easy → Medium → Hard (progressive warm-up within each tier). */
const DIFFICULTY_SORT_ORDER = { E: 0, M: 1, H: 2 };

// Shared, single-source labels/maps (extracted to kill duplication across renderers).
const DIFFICULTY_LABELS = { E: 'Easy', M: 'Medium', H: 'Hard' };
const MEMORY_STATUS_BY_VALUE = { 0: 'unseen', 1: 'review', 2: 'shaky', 3: 'know' };
const MEMORY_VALUE_BY_STATUS = { unseen: 0, review: 1, shaky: 2, know: 3 };
const MEMORY_LABELS = ['Unseen', 'Forgot', 'Shaky', 'Knew'];
/** Slider ordinal → `.memory-dots` / `.qcard-memory` state class. */
const MEMORY_DOT_CLASS_BY_VALUE = { 0: 'unseen', 1: 'forgot', 2: 'shaky', 3: 'knew' };

/**
 * Primary: starred questions first within the compared set.
 * Secondary: difficulty E → M → H.
 * Tiebreak: question number then id for stable ordering.
 */
function compareQuestionsImportanceDifficulty(a, b) {
  const bs = Number(!!b.star);
  const as = Number(!!a.star);
  if (bs !== as) return bs - as;
  const da = DIFFICULTY_SORT_ORDER[a.difficulty] ?? 1;
  const db = DIFFICULTY_SORT_ORDER[b.difficulty] ?? 1;
  if (da !== db) return da - db;
  const na = typeof a.num === 'number' ? a.num : 0;
  const nb = typeof b.num === 'number' ? b.num : 0;
  if (na !== nb) return na - nb;
  return String(a.id).localeCompare(String(b.id));
}

function sortQuestionsByImportanceDifficulty(items) {
  return [...items].sort(compareQuestionsImportanceDifficulty);
}

function getFilteredQuestions() {
  return questions.filter(q => {
    // Hide AI questions that user deleted
    if (state.hiddenIds.has(q.id)) return false;
    // Browsing is always scoped to the active topic; facets narrow within it
    if (q.type !== state.activeTab) return false;
    if (state.diffFilter && q.difficulty !== state.diffFilter) return false;
    if (state.statusFilter) {
      if (state.statusFilter === 'star') {
        if (!q.star) return false;
      } else if (state.statusFilter === 'unseen') {
        if (state.seen.has(q.id)) return false;
      } else {
        if (getRating(q.id) !== state.statusFilter) return false;
      }
    }
    if (state.tagFilters.length > 0) {
      // AND logic: question must have ALL selected tags
      const questionTags = q.tags || [];
      if (!state.tagFilters.every(tag => questionTags.includes(tag))) return false;
    }
    return true;
  });
}

/** Group questions within the active topic tab preserving first-seen section order (sidebar). */
function groupBySection(tabQuestions) {
  const groups = {};
  const order = [];
  tabQuestions.forEach(q => {
    const key = q.section;
    if (!groups[key]) {
      groups[key] = { section: key, items: [] };
      order.push(key);
    }
    groups[key].items.push(q);
  });
  return order.map(key => groups[key]);
}

/** Preserve first-seen order; group key is topic + section (needed when search spans types). */
function groupByTopicSection(qs) {
  const groups = {};
  const order = [];
  qs.forEach(q => {
    const key = `${q.type}::${q.section}`;
    if (!groups[key]) {
      groups[key] = { type: q.type, section: q.section, items: [] };
      order.push(key);
    }
    groups[key].items.push(q);
  });
  return order.map(key => groups[key]);
}

function sortSectionGroups(groups) {
  return groups.map(({ type, section, items }) => ({
    type,
    section,
    items: sortQuestionsByImportanceDifficulty(items),
  }));
}

/** Get all unique tags for the current active tab, sorted alphabetically. */
function getAllTagsForCurrentTab() {
  const tabQs = questions.filter(q => q.type === state.activeTab);
  const tagSet = new Set();
  tabQs.forEach(q => (q.tags || []).forEach(t => tagSet.add(t)));
  return [...tagSet].sort((a, b) => a.localeCompare(b));
}

/** After filters, ensure `activeFeedSection` points at a section with visible questions. */
function syncActiveFeedSection(filteredQs) {
  const groups = sortSectionGroups(groupByTopicSection(filteredQs));
  const cur = state.activeFeedSection;

  if (groups.length === 0) {
    state.activeFeedSection = null;
    state.feedSectionPinned = false;
    return;
  }

  if (cur && filteredQs.some(q => q.type === cur.type && q.section === cur.section)) return;

  state.feedSectionPinned = false;
  state.activeFeedSection = { type: groups[0].type, section: groups[0].section };
}

/** Questions visible in the feed (exactly one section). */
function getFeedQuestions() {
  if (!state.activeFeedSection) return [];
  const { type, section } = state.activeFeedSection;
  return getFilteredQuestions().filter(q => q.type === type && q.section === section);
}

function getSortedFeedQuestions() {
  return sortQuestionsByImportanceDifficulty(getFeedQuestions());
}

function clearFeedSectionPin() {
  state.feedSectionPinned = false;
}

/** Questions sorted for list navigation (keyboard) within the visible feed section. */
function getSortedFilteredQuestions() {
  return sortQuestionsByImportanceDifficulty(getFeedQuestions());
}

// ── Sidebar: section rows + progress (targets #sb-list) ───────
function selectFeedSection(type, section) {
  state.activeFeedSection = { type, section };
  state.feedSectionPinned = true;

  if (VALID_TABS.includes(type) && type !== state.activeTab) {
    state.activeTab = type;
    const sel = document.getElementById('topic-select');
    if (sel) sel.value = type;
    syncTopicTabsActive(type);
  }

  const ordered = getSortedFeedQuestions();
  if (!ordered.some(q => q.id === state.selectedId)) {
    state.selectedId = null;
    state.cardRevealed = false;
  }

  pushURLState();
  renderList();
  renderMainPanel();

  // A roadmap band *is* a section, so a sidebar click in roadmap mode keeps the
  // mode and jumps to that band — the same thing a rail click does.
  if (state.showRoadmap) roadmapShowBand(section);
}

function onSidebarSectionClick(section) {
  selectFeedSection(state.activeTab, section);
}

/** Hint under “Sections” when difficulty filter hides empty section rows. */
function ensureSidebarDiffHint() {
  const header = document.querySelector('.sidebar .sb-header');
  if (!header) return null;
  let el = document.getElementById('sb-diff-hint');
  if (!el) {
    el = document.createElement('p');
    el.id = 'sb-diff-hint';
    el.className = 'sb-diff-hint';
    header.appendChild(el);
  }
  return el;
}

function renderSidebar() {
  const root = document.getElementById('sb-list');
  if (!root) return;

  const tabQs = questions.filter(q => q.type === state.activeTab);
  root.innerHTML = '';

  const hintEl = ensureSidebarDiffHint();
  if (hintEl) {
    if (state.diffFilter) {
      const map = DIFFICULTY_LABELS;
      const diffLabel = map[state.diffFilter] || state.diffFilter;
      hintEl.textContent = `Sections with no ${diffLabel} questions are hidden. Counts and progress use only matching questions.`;
      hintEl.hidden = false;
    } else {
      hintEl.hidden = true;
      hintEl.textContent = '';
    }
  }

  root.dataset.diffFilter = state.diffFilter || '';

  if (tabQs.length === 0) return;

  const facetFilter = Boolean(state.diffFilter || state.tagFilters.length);
  const sidebarQs = facetFilter
    ? getFilteredQuestions().filter(q => q.type === state.activeTab)
    : tabQs;

  if (facetFilter && sidebarQs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sb-list-empty sb-list-empty--filtered';
    empty.setAttribute('role', 'status');
    const map = DIFFICULTY_LABELS;
    const diffLabel = map[state.diffFilter] || state.diffFilter;
    let msg;
    if (state.diffFilter && state.tagFilters.length) {
      msg = 'No questions in this topic match the difficulty and tag filters — every section is hidden.';
    } else if (state.diffFilter) {
      msg = `No ${diffLabel} questions in this topic — every section is hidden for this filter.`;
    } else {
      msg = 'No questions in this topic have all the selected tags — every section is hidden.';
    }
    empty.textContent = msg;
    root.appendChild(empty);
    return;
  }

  const groups = groupBySection(sidebarQs);
  const currentSection =
    state.activeFeedSection && state.activeFeedSection.type === state.activeTab
      ? state.activeFeedSection.section
      : null;

  const frag = document.createDocumentFragment();
  for (const { section, items } of groups) {
    const total = items.length;
    const seenCount = items.filter(q => state.seen.has(q.id)).length;
    const pct = total ? Math.round((seenCount / total) * 100) : 0;

    const row = document.createElement('div');
    row.className = 'sb-item';
    row.dataset.section = section;
    row.setAttribute('role', 'button');
    row.setAttribute('tabindex', '0');
    row.title = `Show questions in: ${section}`;
    const isCurrent = currentSection === section;
    if (isCurrent) {
      row.classList.add('sb-item-current');
      row.setAttribute('aria-current', 'true');
    } else {
      row.removeAttribute('aria-current');
    }

    row.innerHTML = `
      <div class="sb-item-row">
        <span class="sb-item-label">${escapeHtml(section)}</span>
        <span class="sb-item-count">${seenCount} / ${total}</span>
      </div>
      <div class="sb-progress" role="img" aria-label="${seenCount} of ${total} seen in this section">
        <div class="sb-progress-fill" style="width:${pct}%"></div>
      </div>
    `;

    row.addEventListener('click', () => onSidebarSectionClick(section));
    row.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSidebarSectionClick(section);
      }
    });

    frag.appendChild(row);
  }

  root.appendChild(frag);
}

/** Initialize tag filter search in the sidebar (sits above Difficulty). */
function initTagFilterSearch() {
  const searchInput = document.getElementById('tag-search-input');
  const resultsContainer = document.getElementById('tag-search-results');
  const selectedContainer = document.getElementById('tag-filter-selected');
  const clearAllBtn = document.getElementById('tag-clear-all');
  if (!searchInput || !resultsContainer || !selectedContainer) return;

  // Render selected tags
  function renderSelectedTags() {
    selectedContainer.innerHTML = '';
    if (clearAllBtn) clearAllBtn.hidden = state.tagFilters.length === 0;

    if (state.tagFilters.length === 0) return;

    state.tagFilters.forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-selected-chip';
      chip.innerHTML = `
        <span class="tag-selected-label">${escapeHtml(tag)}</span>
        <button type="button" class="tag-selected-remove" aria-label="Remove ${tag} filter">✕</button>
      `;
      chip.querySelector('.tag-selected-remove').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTagFilter(tag);
      });
      selectedContainer.appendChild(chip);
    });
  }

  // Render search results
  function renderSearchResults(query) {
    const allTags = getAllTagsForCurrentTab();
    const filtered = allTags.filter(tag => 
      !state.tagFilters.includes(tag) && 
      tag.toLowerCase().includes(query.toLowerCase())
    );

    if (query === '' || filtered.length === 0) {
      resultsContainer.classList.add('hidden');
      return;
    }

    resultsContainer.innerHTML = '';
    filtered.forEach(tag => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'tag-search-result';
      btn.textContent = tag;
      btn.setAttribute('role', 'option');
      btn.addEventListener('click', () => {
        toggleTagFilter(tag);
        searchInput.value = '';
        resultsContainer.classList.add('hidden');
        searchInput.focus();
      });
      resultsContainer.appendChild(btn);
    });
    resultsContainer.classList.remove('hidden');
  }

  // Initial render
  renderSelectedTags();

  // Search input events
  searchInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  searchInput.addEventListener('focus', () => {
    renderSearchResults(searchInput.value);
  });

  // Hide results when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.tag-filter-section')) {
      resultsContainer.classList.add('hidden');
    }
  });

  // Prevent hiding when clicking inside search wrapper
  document.querySelector('.tag-search-wrapper')?.addEventListener('click', (e) => {
    e.stopPropagation();
  });

  // Clear-all button removes every selected tag
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      clearTagFilters();
      searchInput.value = '';
      resultsContainer.classList.add('hidden');
    });
  }

  // Expose render function for updates
  window.renderTagFilterUI = renderSelectedTags;
}

/** Toggle a tag in the multi-select tag filter. */
function toggleTagFilter(tag) {
  const idx = state.tagFilters.indexOf(tag);
  if (idx >= 0) {
    state.tagFilters.splice(idx, 1);
  } else {
    state.tagFilters.push(tag);
  }
  clearFeedSectionPin();
  
  // Re-render selected tags
  if (window.renderTagFilterUI) {
    window.renderTagFilterUI();
  }
  
  renderList();
  renderMainPanel();
}

/** Clear all tag filters. */
function clearTagFilters() {
  if (state.tagFilters.length > 0) {
    state.tagFilters = [];
    clearFeedSectionPin();
    if (window.renderTagFilterUI) {
      window.renderTagFilterUI();
    }
    renderList();
    renderMainPanel();
  }
}

/** Section badge in the detail header (#qv-section). No-ops until that markup lands. */
function syncDetailSectionChip(q) {
  const chip = document.getElementById('qv-section');
  if (!chip || !q) return;
  chip.textContent = q.section;
  chip.hidden = false;
}

/** Single memory gem on feed question cards (bottom-right); states match `.memory-dots.*`. */
function memoryCardIndicatorMarkup(stateClass, memLabel) {
  const cls = stateClass ? ` ${stateClass}` : '';
  return `<div class="qcard-memory${cls}" role="img" aria-label="${escapeHtml(memLabel)}"></div>`;
}

/**
 * Five-dot memory row. Use tag `span` inside `<button>` (flow content forbidden).
 * Variants: default | compact | tiny | chip — see `.memory-dots--*` in style.css.
 */
function memoryDotsMarkup(stateClass, opts = {}) {
  const {
    variant = 'default',
    tag = 'div',
    roleLabel = null,
  } = opts;
  const cls = stateClass ? ` ${stateClass}` : '';
  let mod = '';
  if (variant === 'compact') mod += ' memory-dots--compact';
  else if (variant === 'tiny') mod += ' memory-dots--tiny';
  else if (variant === 'chip') mod += ' memory-dots--chip';
  const aria = roleLabel != null
    ? ` role="img" aria-label="${escapeHtml(roleLabel)}"`
    : ' aria-hidden="true"';
  const inner = '<span></span>'.repeat(5);
  return `<${tag} class="memory-dots${cls}${mod}"${aria}>${inner}</${tag}>`;
}

function createFeedQuestionCard(q) {
  const dotStateClass = memoryDotStateClassForId(q.id);
  const memLabel = `Memory: ${memoryStatusPhraseForId(q.id)}`;

  const starBadge = q.star
    ? '<span class="qcard-star" aria-hidden="true">⭐</span>'
    : '';


  const tagStr = (q.tags || [])
    .map(t => `<span class="qcard-tag">${escapeHtml(t)}</span>`)
    .join('');

  const unseen = !state.seen.has(q.id);
  const card = document.createElement('div');
  card.className = 'qcard q-item'
    + (q.id === state.selectedId ? ' selected' : '')
    + (q.star ? ' starred' : '')
    + (unseen ? ' unseen' : '');
  card.dataset.id = q.id;

  card.innerHTML = `
    ${starBadge}
    ${memoryCardIndicatorMarkup(dotStateClass, memLabel)}
    <div class="qcard-stripe ${q.difficulty}" aria-hidden="true"></div>
    <div class="qcard-body">
      <div class="qcard-title">${escapeHtml(q.title)}</div>
      <div class="qcard-footer">
        <div class="qcard-tags">${tagStr || '<span class="qcard-tag-empty"></span>'}</div>
      </div>
    </div>
  `;

  card.addEventListener('click', () => selectQuestion(q.id));
  return card;
}

// ── Main feed: question cards (targets #feed-list, .qcard) ─────
function renderList() {
  const list = document.getElementById('feed-list') || document.getElementById('question-list');

  // Roadmap mode belongs to the detail pane (see renderRoadmapPane), not here:
  // the feed always renders its own section whatever the pane next to it shows.
  // The early return that used to sit here handed this container to a milestone
  // list instead, and left the feed showing that list after the mode turned off.
  const filteredQs = getFilteredQuestions();
  syncActiveFeedSection(filteredQs);

  // Update dropdown option label with count (read base label from data-label attr or text)
  const opt = document.querySelector(`#topic-select option[value="${state.activeTab}"]`);
  if (opt) {
    const base = opt.dataset.label || opt.textContent.replace(/\s*\(\d+\)/, '');
    opt.dataset.label = base;
    opt.textContent = `${base} (${filteredQs.length})`;
  }

  // Update filter control labels with counts (current tab only; ignores active filters)
  const allQ = questions.filter(q => q.type === state.activeTab);
  const statusCounts = {
    star:   allQ.filter(q => q.star).length,
    know:   allQ.filter(q => getRating(q.id) === 'know').length,
    shaky:  allQ.filter(q => getRating(q.id) === 'shaky').length,
    review: allQ.filter(q => getRating(q.id) === 'review').length,
    unseen: allQ.filter(q => !state.seen.has(q.id)).length,
  };

  for (const [status, count] of Object.entries(statusCounts)) {
    const legacyChip = queryLegacyStatusFilterChip(status);
    if (legacyChip) {
      const countEl = legacyChip.querySelector('.chip-count');
      if (countEl) {
        countEl.textContent = ` (${count})`;
      } else {
        const label = legacyChip.dataset.chipLabel;
        if (label) legacyChip.textContent = `${label} (${count})`;
        else {
          const base = legacyChip.dataset.label ??= legacyChip.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
          legacyChip.textContent = `${base} (${count})`;
        }
      }
    }
    
  }
  for (const code of ['E', 'M', 'H']) {
    const count = allQ.filter(q => q.difficulty === code).length;
    document
      .querySelectorAll(`#diff-chips [data-diff="${code}"], #diff-filters .pill[data-diff="${code}"]`)
      .forEach(chip => {
        const countEl = chip.querySelector('.chip-count');
        if (countEl) {
          countEl.textContent = `(${count})`;
        } else {
          // Fallback for pills that don't have structured layout
          const label = chip.dataset.chipLabel;
          if (label) chip.textContent = `${label} (${count})`;
          else {
            const base = chip.dataset.label ??= chip.textContent.replace(/\s*\(\d+\)\s*$/, '').trim();
            chip.textContent = `${base} (${count})`;
          }
        }
      });
  }

  const typeLabel = {
    android: 'Android',
    behavioral: 'Behaviour',
    'data-structures': 'Data Structures',
    'system-design': 'System Design',
  };

  const feedQs = getSortedFeedQuestions();

  const feedHd = document.querySelector('.feed-hd');
  const feedTitle = document.getElementById('feed-title');
  if (feedTitle) {
    // Remove category/section name display - user requested to keep only counts
    feedTitle.textContent = '';
  }

  let feedDiffBadge = document.getElementById('feed-diff-badge');
  if (!feedDiffBadge && feedTitle) {
    feedDiffBadge = document.createElement('span');
    feedDiffBadge.id = 'feed-diff-badge';
    feedDiffBadge.className = 'feed-diff-badge';
    feedTitle.after(feedDiffBadge);
  } else if (!feedDiffBadge && feedHd) {
    feedDiffBadge = document.createElement('span');
    feedDiffBadge.id = 'feed-diff-badge';
    feedDiffBadge.className = 'feed-diff-badge';
    feedHd.appendChild(feedDiffBadge);
  }
  if (feedDiffBadge) {
    if (state.diffFilter) {
      const map = DIFFICULTY_LABELS;
      feedDiffBadge.textContent = map[state.diffFilter] || state.diffFilter;
      feedDiffBadge.title = 'Difficulty filter: list and section counts use this level only.';
      feedDiffBadge.hidden = false;
    } else {
      feedDiffBadge.hidden = true;
      feedDiffBadge.textContent = '';
    }
  }

  const feedEl = document.querySelector('.feed');
  if (feedEl) feedEl.classList.toggle('feed--diff-filtered', Boolean(state.diffFilter));

  // Update feed counts - total on left, important on right
  const feedCountTotal = document.getElementById('feed-count-total');
  const feedCountImportant = document.getElementById('feed-count-important');
  
  if (feedCountTotal) {
    const starredCount = feedQs.filter(q => q.star).length;
    const totalText = `${feedQs.length} ${feedQs.length === 1 ? 'question' : 'questions'}`;
    
    // Always show total on the left
    feedCountTotal.textContent = totalText;
    
    // Show important count on the right only if there are starred questions
    if (feedCountImportant) {
      if (starredCount > 0) {
        feedCountImportant.textContent = `${starredCount} important`;
        feedCountImportant.style.display = '';
      } else {
        feedCountImportant.style.display = 'none';
      }
    }
  }

  if (!list) {
    renderSidebar();
    return;
  }

  list.innerHTML = '';

  if (feedQs.length === 0) {
    const div = document.createElement('div');
    div.className = 'empty-list';
    div.id = 'empty-list-msg';
    if (questions.length === 0) {
      div.textContent = 'No questions loaded.';
    } else if (filteredQs.length === 0) {
      div.textContent = 'No questions match your filters.';
    } else if (state.diffFilter) {
      const map = DIFFICULTY_LABELS;
      div.textContent = `No ${map[state.diffFilter] || state.diffFilter} questions in this section for your current filters. Try another section or clear filters.`;
    } else {
      div.textContent = 'No questions in this section match your filters.';
    }
    list.appendChild(div);
    renderSidebar();
    return;
  }

  feedQs.forEach(q => list.appendChild(createFeedQuestionCard(q)));

  renderSidebar();
}

// ── Detail panel: Notion blocks + status (see .claude/handoff.md) ─
const SD_SECTIONS = [
  { key: 'scope',       icon: '🎯', label: 'Clarifying Questions & Scope', defaultOpen: true },
  // Virtual split of `scope` (see splitScopeSection). `scope` above stays the
  // fallback card for blobs without a standalone assumptions heading.
  { key: 'scope-q',     icon: '❓', label: 'Clarifying Questions',         defaultOpen: true },
  { key: 'scope-a',     icon: '❗', label: 'Assumptions',                  defaultOpen: true },
  { key: 'functional',  icon: '⚙️',  label: 'Functional Requirements',      defaultOpen: true },
  { key: 'nfr',         icon: '📊',  label: 'Non-Functional Requirements',  defaultOpen: true },
  { key: 'capacity',    icon: '📈',  label: 'Capacity Estimation',          defaultOpen: true },
  { key: 'architecture',icon: '🏗️',  label: 'High-Level Architecture',      defaultOpen: true },
  { key: 'dataModel',   icon: '🗄️',  label: 'Data Model',                   defaultOpen: false },
  { key: 'api',         icon: '🔌',  label: 'API Design',                   defaultOpen: false },
  { key: 'tradeoffs',   icon: '⚖️',  label: 'Key Trade-offs',               defaultOpen: true },
  { key: 'approach',    icon: '📋',  label: 'Interview Approach',           defaultOpen: false },
  { key: 'followUp',    icon: '🧵',  label: 'Follow-ups',                   defaultOpen: false },
  { key: 'pitfalls',    icon: '🚩',  label: 'Common Pitfalls',              defaultOpen: false },
];

const BEHAVIORAL_SECTIONS = [
  { key: 'listenFor', icon: '👂', label: 'What to listen for', defaultOpen: true },
  { key: 'starGuide', icon: '⭐', label: 'STAR hint', defaultOpen: true },
  { key: 'redFlags', icon: '🚩', label: 'Red flags', defaultOpen: true },
];

// Technical (android / data-structures): structured fields with `answer` fallback.
// `fallback` names the documented legacy field (`expectedAnswer`).
const TECH_SECTIONS = [
  { key: 'answer', icon: '💡', label: 'Expected Answer', defaultOpen: true, fallback: 'expectedAnswer' },
  { key: 'keyPoints',      icon: '🔑', label: 'Key Points',      defaultOpen: false },
  { key: 'complexity',     icon: '⏱️', label: 'Complexity',      defaultOpen: false },
  { key: 'followUp',       icon: '🧵', label: 'Follow-ups',      defaultOpen: false },
  { key: 'redFlags',       icon: '🚩', label: 'Red Flags',       defaultOpen: false },
];

// ── Detail layout ──────────────────────────────────────────────
// The row structure of the detail pane is declared, not inferred from the
// section order above. Four row forms:
//   { cols: [a, b] } — two cards sharing one row; when the question has only
//                      one of the two fields it becomes a single-card row,
//                      and consecutive ones pack into a band (buildDetailRows);
//   { half: key }    — one card in one column, the other stays empty;
//   { full: key }    — a spanning card;
//   { pack: key }    — one card that JOINS packing: consecutive packable rows
//                      (this form or a one-card `cols` resolution) collapse
//                      into one band stacked column-first; alone it stays a
//                      plain half card.
// Safety rule: a key present in the question data but missing from the
// topic's layout still renders, appended as its own full-width row (see
// buildDetailRows). Silently dropping content was the original clipping bug.
const DETAIL_LAYOUT = {
  'system-design': [
    { cols: ['scope-q', 'scope-a'] },
    { cols: ['functional', 'nfr'] },
    { half: 'capacity' },
    { full: 'architecture' },
    { cols: ['dataModel', 'api'] },
    { full: 'tradeoffs' },
    { cols: ['followUp', 'pitfalls'] },
    { full: 'approach' },
  ],
  android: [
    { pack: 'answer' },
    { cols: ['keyPoints', 'complexity'] },
    { cols: ['followUp', 'redFlags'] },
  ],
  'data-structures': [
    { full: 'answer' },
    { cols: ['keyPoints', 'complexity'] },
    { cols: ['followUp', 'redFlags'] },
  ],
  behavioral: [
    { cols: ['listenFor', 'starGuide'] },
    { full: 'redFlags' },
  ],
};

// Section metadata per topic: labels/icons plus the safety pass over keys a
// layout forgot. Types without an entry read TECH_SECTIONS/tech layout, which
// matches the old renderer's else-branch.
const DETAIL_SECTIONS_BY_TYPE = {
  'system-design': SD_SECTIONS,
  behavioral: BEHAVIORAL_SECTIONS,
  android: TECH_SECTIONS,
  'data-structures': TECH_SECTIONS,
};

function detailSectionsFor(type) {
  return DETAIL_SECTIONS_BY_TYPE[type] || TECH_SECTIONS;
}

function detailLayoutFor(type) {
  return DETAIL_LAYOUT[type] || DETAIL_LAYOUT.android;
}

function detailSectionMeta(type, key) {
  return detailSectionsFor(type).find(sec => sec.key === key)
    || { key, icon: '📄', label: key };
}

// `scope` is one markdown blob carrying two cards. The assumptions heading
// text varies (**Assumptions**, **Declared Assumptions**, ±trailing colon) and
// it may sit inline with its first bullet (sd-86 … sd-97), so match the bold
// marker anywhere in the blob, not only as a whole line. The leading
// `**Clarifying questions:**` line stays in the questions card untouched. Only
// a blob with no marker at all falls back to the single `scope` card.
const SCOPE_ASSUMPTIONS_HEADING = /\*\*\s*(?:Declared\s+)?Assumptions?\s*:?\s*\*\*/i;

function splitScopeSection(scope) {
  const raw = String(scope);
  const match = raw.match(SCOPE_ASSUMPTIONS_HEADING);
  if (!match) return { scope: raw };
  const questionsPart = raw.slice(0, match.index).trim();
  // Everything after the marker: its trailing text on that line plus all
  // following lines — the marker itself is stripped, both halves trimmed.
  const assumptionsPart = raw.slice(match.index + match[0].length).trim();
  const out = {};
  if (questionsPart) out['scope-q'] = questionsPart;
  if (assumptionsPart) out['scope-a'] = assumptionsPart;
  return out;
}

/** key → markdown, for every detail card this question actually fills. */
function collectDetailValues(q) {
  const values = {};
  const isBehavioral = q.type === 'behavioral';
  const parsed = isBehavioral ? parseBehavioralContent(q.answer || q.expectedAnswer || '') : null;
  detailSectionsFor(q.type).forEach(sec => {
    if (sec.key === 'scope') return; // split below
    let raw;
    if (isBehavioral) {
      raw = q[sec.key] !== undefined ? q[sec.key] : parsed[sec.key];
    } else {
      raw = q[sec.key] !== undefined ? q[sec.key] : (sec.fallback ? q[sec.fallback] : undefined);
    }
    if (raw) values[sec.key] = String(raw);
  });
  if (q.type === 'system-design' && q.scope) {
    Object.assign(values, splitScopeSection(q.scope));
  }
  return values;
}

/**
 * Build one answer-section card from its markdown. Returns the block plus the
 * body element so the caller can attach it where it belongs (a plain grid row
 * or a `.db-band`) and only then run mermaid — which needs the node connected.
 * Collapsing follows Learn/Quiz mode and is re-derived on every render — no
 * stored card state is consulted (see purgeCollapsedCardStorage).
 */
function createDetailCard(q, values, key, width, rowStart) {
  const raw = values[key];
  const sec = detailSectionMeta(q.type, key);
  const isCollapsed = !state.learningMode;

  const block = document.createElement('div');
  block.className = `notion-block ${width}`
    + (rowStart ? ' db-row-start' : '')
    + (isCollapsed ? ' collapsed' : '');
  block.dataset.notionKey = key;

  const head = document.createElement('button');
  head.type = 'button';
  head.className = 'notion-block-header';
  head.setAttribute('aria-expanded', (!isCollapsed).toString());
  const chevronIcon = isCollapsed ? '▶' : '▼';
  head.innerHTML = `<span class="notion-chevron">${chevronIcon}</span><span class="notion-icon">${sec.icon}</span><span class="notion-label">${escapeHtml(sec.label)}</span>`;

  const body = document.createElement('div');
  body.className = 'notion-block-body' + (isCollapsed ? ' collapsed' : '');
  body.hidden = isCollapsed;
  body.innerHTML = typeof marked !== 'undefined'
    ? marked.parse(String(raw))
    : `<p>${escapeHtml(String(raw))}</p>`;

  head.addEventListener('click', () => {
    const collapsed = !block.classList.contains('collapsed');
    block.classList.toggle('collapsed', collapsed);
    head.setAttribute('aria-expanded', (!collapsed).toString());
    body.classList.toggle('collapsed', collapsed);
    body.hidden = collapsed;

    // Update chevron icon
    const chevron = head.querySelector('.notion-chevron');
    if (chevron) {
      chevron.textContent = collapsed ? '▶' : '▼';
    }
  });

  block.appendChild(head);
  block.appendChild(body);
  return { block, body };
}

/**
 * Flatten the declared layout into the ordered row list for this question.
 * Two entry shapes come out. A single card is { key, width, rowStart }: width
 * is 'db-half' (one column, what the row's `cols`/`half` form produces) or
 * 'db-full' (spanning), and rowStart marks the FIRST card of every visual row
 * — T1's two-column CSS anchors .db-row-start back to column 1, so the next
 * declared row starts a new grid row instead of auto-flow pulling it into the
 * hole the previous row left. A packed run is { band: [key, …], width:
 * 'db-band', rowStart: true }.
 *
 * Packing rule: a `cols` row resolves against the fields the question
 * actually has, so an optional absent partner (complexity on every android
 * question, followUp on some) leaves one card and a hole; a declared
 * `{ pack }` row is a single card that opts into the same treatment. Two or
 * more CONSECUTIVE such one-card rows collapse into one band: a single grid
 * item whose cards fill an inner first column top-to-bottom (declaration
 * order preserved) and overflow into the inner second column — lone cards
 * stack beside each other instead of each owning a hole-ridden row.
 * Deliberately excluded: a lone `{ half }` row is a chosen single column, not
 * a packing candidate (it breaks a run and keeps its hole); `{ full }` rows
 * and the safety-pass rows are the declared wide cards and keep their own
 * spanning row; a `cols` row that resolves to two cards still pairs
 * half/half as before; a run of exactly one stays a plain half row (nothing
 * to pack). Rows whose keys are all absent emit nothing and do not break a
 * run either — they render nowhere, so the surviving cards stay consecutive.
 */
function buildDetailRows(q, values) {
  const layout = detailLayoutFor(q.type);
  const has = key => values[key] !== undefined && values[key] !== '';
  const referenced = new Set();
  layout.forEach(row => {
    if (row.cols) row.cols.forEach(k => referenced.add(k));
    else referenced.add(row.half || row.full || row.pack);
  });

  const rows = [];
  let run = [];
  const flushRun = () => {
    if (run.length > 1) {
      rows.push({ band: run.slice(), width: 'db-band', rowStart: true });
    } else if (run.length === 1) {
      rows.push({ key: run[0], width: 'db-half', rowStart: true });
    }
    run = [];
  };
  layout.forEach(row => {
    if (row.cols) {
      const present = row.cols.filter(key => has(key));
      if (!present.length) return;
      if (present.length === 1) {
        run.push(present[0]);
        return;
      }
      flushRun();
      present.forEach((key, i) => {
        rows.push({ key, width: 'db-half', rowStart: i === 0 });
      });
      return;
    }
    if (row.pack && has(row.pack)) {
      run.push(row.pack);
      return;
    }
    if (row.half && has(row.half)) {
      flushRun();
      rows.push({ key: row.half, width: 'db-half', rowStart: true });
    } else if (row.full && has(row.full)) {
      flushRun();
      rows.push({ key: row.full, width: 'db-full', rowStart: true });
    }
  });
  flushRun();

  // Safety rule (see DETAIL_LAYOUT): data keys the layout never mentions still
  // render, appended as their own full-width row. This is also how the no-
  // marker `scope` fallback card (splitScopeSection) reaches the screen.
  detailSectionsFor(q.type).forEach(sec => {
    if (!referenced.has(sec.key) && has(sec.key)) {
      rows.push({ key: sec.key, width: 'db-full', rowStart: true });
    }
  });
  return rows;
}

// Parse behavioral question content into sections (fallback when structured fields are absent)
function parseBehavioralContent(content) {
  const sections = {
    listenFor: '',
    starGuide: '',
    redFlags: ''
  };
  
  // Split content by bold headers
  const parts = content.split(/\*\*([^*]+?):\*\*/);
  let currentSection = null;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    
    if (part === 'What to listen for') {
      currentSection = 'listenFor';
    } else if (part === 'STAR hint') {
      currentSection = 'starGuide';  
    } else if (part === 'Red flags') {
      currentSection = 'redFlags';
    } else if (currentSection && part) {
      sections[currentSection] += part + '\n';
    }
  }
  
  // Clean up content
  Object.keys(sections).forEach(key => {
    sections[key] = sections[key].trim();
  });
  
  return sections;
}

const TOPIC_LABELS = {
  android: 'Android',
  behavioral: 'Behaviour',
  'data-structures': 'Data Structures',
  'system-design': 'System Design',
};

function runMermaidInContainer(container) {
  if (typeof mermaid === 'undefined' || !container) return;
  const blocks = container.querySelectorAll('pre code.language-mermaid');
  if (!blocks.length) return;
  // Mermaid lays its labels out in px of its own, so it gets the live root font
  // size: a diagram then matches the type scale around it at the current zoom
  // ladder instead of staying at its 16px default.
  mermaid.initialize({
    startOnLoad: false,
    theme: getMermaidTheme(),
    themeVariables: { fontSize: getComputedStyle(document.documentElement).fontSize }
  });
  blocks.forEach(async (block, i) => {
    const source = block.textContent.trim();
    const wrap = document.createElement('div');
    wrap.className = 'mermaid-container';
    // Click / Enter / Space opens the diagram modal (see initializeDiagramModal).
    wrap.tabIndex = 0;
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('aria-label', 'Enlarge diagram');
    block.parentElement.replaceWith(wrap);
    try {
      const id = 'mermaid-' + Date.now() + '-' + i;
      const { svg } = await mermaid.render(id, source);
      wrap.innerHTML = svg;
    } catch (e) {
      wrap.innerHTML = `<pre class="mermaid-error">${escapeHtml(source)}</pre>`;
    }
  });
}

// ── Diagram modal (click-to-enlarge) ───────────────────────────
// Body-level markup (#diagram-modal, #diagram-modal-title,
// #diagram-modal-viewport, #diagram-modal-close, [data-diagram-close]) is
// authored in components/diagram-modal.html. Every lookup here is guarded, so
// a page without that markup just keeps inline diagrams.
let diagramModalOpener = null;

function openDiagramModal(source) {
  const modal = document.getElementById('diagram-modal');
  const viewport = document.getElementById('diagram-modal-viewport');
  if (!modal || !viewport || !source) return;
  const svg = source.querySelector('svg');
  if (!svg) return;

  const titleEl = document.getElementById('diagram-modal-title');
  if (titleEl) {
    const block = source.closest('.notion-block');
    const label = block ? block.querySelector('.notion-label') : null;
    titleEl.textContent = label ? label.textContent : 'Diagram';
  }

  viewport.innerHTML = '';
  viewport.appendChild(svg.cloneNode(true));
  diagramModalOpener = source;
  modal.hidden = false;
  const closeBtn = document.getElementById('diagram-modal-close');
  if (closeBtn) closeBtn.focus();
}

function closeDiagramModal() {
  const modal = document.getElementById('diagram-modal');
  if (!modal || modal.hidden) return;
  modal.hidden = true;
  const viewport = document.getElementById('diagram-modal-viewport');
  if (viewport) viewport.innerHTML = '';
  const opener = diagramModalOpener;
  diagramModalOpener = null;
  if (opener && document.contains(opener) && typeof opener.focus === 'function') {
    opener.focus();
  }
}

function initializeDiagramModal() {
  const detailBody = document.getElementById('detail-body');
  if (detailBody) {
    detailBody.addEventListener('click', e => {
      const source = typeof e.target.closest === 'function'
        ? e.target.closest('.mermaid-container')
        : null;
      if (source && detailBody.contains(source)) openDiagramModal(source);
    });
    detailBody.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const focused = e.target;
      if (!focused || !focused.classList || !focused.classList.contains('mermaid-container')) return;
      if (!detailBody.contains(focused)) return;
      // Keep Space from also firing the global reveal shortcut / scrolling.
      e.preventDefault();
      e.stopPropagation();
      openDiagramModal(focused);
    });
  }

  // Document-level delegation so the wiring survives late markup: the close
  // button and the backdrop both carry [data-diagram-close].
  document.addEventListener('click', e => {
    const modal = document.getElementById('diagram-modal');
    if (!modal || modal.hidden) return;
    const closer = typeof e.target.closest === 'function'
      ? e.target.closest('[data-diagram-close]')
      : null;
    if (closer && modal.contains(closer)) closeDiagramModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const modal = document.getElementById('diagram-modal');
    if (!modal || modal.hidden) return;
    e.preventDefault();
    closeDiagramModal();
  });
}

// ── Select a question ──────────────────────────────────────────
function selectQuestion(id) {
  // Opening a question is the pane saying "show me this answer", so roadmap mode
  // ends here — every path into a question (feed card, J/K, palette, roadmap
  // cell, ghost un-hide, hash link) funnels through this function.
  setRoadmapMode(false);

  // Push to history (only if not navigating via history buttons)
  if (!state._historyNav) {
    // Truncate forward history
    state.history = state.history.slice(0, state.historyIdx + 1);
    state.history.push(id);
    state.historyIdx = state.history.length - 1;
  }
  state._historyNav = false;

  state.selectedId = id;
  // Switch tab if the selected question belongs to a different category
  const _q = getQuestionById(id);
  if (_q && _q.type !== state.activeTab) {
    state.activeTab = _q.type;
    const sel = document.getElementById('topic-select');
    if (sel) sel.value = _q.type;
    syncTopicTabsActive(_q.type);
  }
  if (_q) {
    state.activeFeedSection = { type: _q.type, section: _q.section };
    clearFeedSectionPin();
  }
  state.seen.add(id);
  saveSeen();
  state.cardRevealed = state.learningMode;
  pushURLState();
  renderList();
  renderMainPanel();
  // Scroll selected into view
  const el = document.querySelector('.q-item.selected');
  if (el) el.scrollIntoView({ block: 'nearest' });
  updateHistoryButtons();
}

// ── Render main panel ──────────────────────────────────────────
function renderMainPanel() {
  const emptyState = document.getElementById('detail-empty');
  const questionView = document.getElementById('detail-question');
  const roadmapView = document.getElementById('detail-roadmap');

  // Roadmap mode owns the pane. Hiding #detail-question takes the per-question
  // header (num / star / difficulty / rating slider) and the Tags/Related
  // bottom bar with it — they are children of that view, so there is nothing
  // else to switch off.
  if (state.showRoadmap) {
    if (emptyState) emptyState.classList.add('hidden');
    if (questionView) questionView.classList.add('hidden');
    renderRoadmapPane();
    return;
  }

  if (roadmapView) roadmapView.classList.add('hidden');
  hideRoadmapTooltip();

  if (!state.selectedId) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (questionView) questionView.classList.add('hidden');
    
    return;
  }

  const q = getQuestionById(state.selectedId);
  if (!q) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (questionView) questionView.classList.add('hidden');
    
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (questionView) questionView.classList.remove('hidden');

  // Header strip (unchanged ids for rating buttons / history)
  const qvNum = document.getElementById('qv-num');
  if (qvNum) qvNum.textContent = `#${q.num}`;
  const diffBadge = document.getElementById('qv-diff');
  if (diffBadge) {
    diffBadge.className = `diff-badge ${q.difficulty}`;
    const diffMap = DIFFICULTY_LABELS;
    diffBadge.textContent = diffMap[q.difficulty] || q.difficulty;
  }
  const qvStar = document.getElementById('qv-star');
  if (qvStar) qvStar.textContent = q.star ? '⭐' : '';

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = q.title;

  const detailBody = document.getElementById('detail-body');
  if (detailBody) {
    detailBody.innerHTML = '';

    // Layout is declared data (DETAIL_LAYOUT); values come straight from the
    // question, except behavioral content, which still parses `answer`.
    const values = collectDetailValues(q);
    const rows = buildDetailRows(q, values);

    rows.forEach(row => {
      if (row.band) {
        // Packed run of single-card rows (see buildDetailRows): one grid
        // item hosting an inner column-first flow. The row count, min(n, 2),
        // is what makes the run STACK: with `grid-auto-flow: column` cards 1
        // and 2 land in rows 1–2 of the inner first column, and a run of 3+
        // overflows into the inner second column starting at its row 1 —
        // never one card per inner row side by side. The .db-band rules only
        // apply their two-column flow inside the container query, so the
        // one-column state just stacks.
        const band = document.createElement('div');
        band.className = 'db-band';
        band.style.gridTemplateRows = `repeat(${Math.min(row.band.length, 2)}, max-content)`;
        const bodies = [];
        row.band.forEach(key => {
          const card = createDetailCard(q, values, key, 'db-half', false);
          band.appendChild(card.block);
          bodies.push(card.body);
        });
        detailBody.appendChild(band);
        bodies.forEach(b => runMermaidInContainer(b));
        return;
      }
      const card = createDetailCard(q, values, row.key, row.width, row.rowStart);
      detailBody.appendChild(card.block);
      runMermaidInContainer(card.body);
    });
  }

  const tagsOut = document.getElementById('bb-tags');
  if (tagsOut) {
    tagsOut.innerHTML = '';
    (q.tags || []).forEach(tag => {
      const chip = document.createElement('span');
      chip.className = 'tag-chip bb-tag' + (state.tagFilters.includes(tag) ? ' active' : '');
      chip.textContent = tag;
      chip.addEventListener('click', () => toggleTagFilter(tag));
      tagsOut.appendChild(chip);
    });
    if ((q.tags || []).length === 0) {
      tagsOut.innerHTML = '<span class="no-related">None</span>';
    }
  }

  const relatedOut = document.getElementById('bb-related');
  if (relatedOut) {
    relatedOut.innerHTML = '';
    (q.related || []).forEach(relId => {
      const rel = getQuestionById(relId);
      if (!rel) return;
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'bb-related-item';
      row.innerHTML = `<span class="bb-related-title">${escapeHtml(`#${rel.num} — ${rel.title}`)}</span>`;
      row.addEventListener('click', () => selectQuestion(relId));
      relatedOut.appendChild(row);
    });
    if ((q.related || []).length === 0) {
      relatedOut.innerHTML = '<span class="no-related">None</span>';
    }
  }

  const hiddenFace = document.getElementById('card-hidden-face');
  const revealedFace = document.getElementById('card-revealed-face');
  const ratingBar = document.getElementById('rating-bar');
  const metaSection = document.getElementById('meta-section');

  if (state.cardRevealed) {
    if (hiddenFace) hiddenFace.classList.add('hidden');
    if (revealedFace) revealedFace.classList.remove('hidden');
    if (ratingBar) ratingBar.classList.remove('hidden');
    if (metaSection) metaSection.classList.add('hidden');
  } else {
    if (hiddenFace) hiddenFace.classList.remove('hidden');
    if (revealedFace) revealedFace.classList.add('hidden');
    if (ratingBar) ratingBar.classList.add('hidden');
    if (metaSection) metaSection.classList.add('hidden');
  }

  updateRatingButtons(q.id);
  syncDetailSectionChip(q);

  const quizCover = document.getElementById('quiz-reveal-cover');
  const bottomBarEl = document.getElementById('bottom-bar');
  // Hide the strip entirely when both columns would be empty, instead of
  // leaving a tall blank band under the answer cards.
  if (bottomBarEl) {
    const hasTags = (q.tags || []).length > 0;
    const hasRelated = (q.related || []).some(id => Boolean(getQuestionById(id)));
    bottomBarEl.hidden = !hasTags && !hasRelated;
  }
  const quizCovered = Boolean(q && !state.learningMode && !state.cardRevealed);
  if (detailBody) detailBody.classList.toggle('quiz-covered', quizCovered);
  if (bottomBarEl) bottomBarEl.classList.toggle('quiz-covered', quizCovered);
  if (quizCover) quizCover.classList.toggle('hidden', !quizCovered);

  
}



function flashSaved() {
  document.querySelectorAll('.saved-dot').forEach(dot => {
    dot.classList.remove('flash');
    void dot.offsetWidth;
    dot.classList.add('flash');
    const clear = () => {
      dot.classList.remove('flash');
      dot.removeEventListener('animationend', clear);
    };
    dot.addEventListener('animationend', clear);
    setTimeout(clear, 650);
  });
}

function revealCard() {
  if (state.cardRevealed) return;
  if (!state.selectedId) return;
  state.cardRevealed = true;
  renderMainPanel();
}

function toggleLearningMode() {
  state.learningMode = !state.learningMode;
  const btn = document.getElementById('mode-toggle');
  const sidebar = document.querySelector('.sidebar');
  
  if (btn) {
    // Quiz mode = active state (green), Learn mode = inactive state (default)
    btn.classList.toggle('active', !state.learningMode);
    // role="switch" is meaningless to screen readers unless aria-checked
    // follows the mode (it used to stay at the markup's static "false").
    btn.setAttribute('aria-checked', String(!state.learningMode));

    // Update text to show current mode (id or class — whichever the markup ships)
    const modeText = btn.querySelector('#mode-text, .mode-text');
    if (modeText) {
      modeText.textContent = state.learningMode ? 'Learn' : 'Quiz';
    }
  }
  
  if (sidebar) sidebar.classList.toggle('learning-mode', state.learningMode);

  if (state.selectedId) {
    state.cardRevealed = state.learningMode;
    renderMainPanel();
  }
}


/**
 * Set roadmap mode, persist it and sync the switch. Deliberately does not
 * render: every caller already has a render of its own (selectQuestion,
 * toggleRoadmap, init), and a second one would rebuild the pane mid-keystroke.
 * Returns true when the mode actually changed.
 */
function setRoadmapMode(on) {
  const next = Boolean(on);
  if (state.showRoadmap === next) return false;
  state.showRoadmap = next;
  saveRoadmapMode();
  syncRoadmapToggleUI();
  return true;
}

/** #roadmap-btn is a role="switch", so its state lands on aria-checked (never a
    "pressed" attribute, which is the toggle-button contract). */
function syncRoadmapToggleUI() {
  const btn = document.getElementById('roadmap-btn');
  if (!btn) return;
  btn.classList.toggle('active', state.showRoadmap);
  btn.setAttribute('aria-checked', state.showRoadmap ? 'true' : 'false');
}

function toggleRoadmap() {
  const on = !state.showRoadmap;
  setRoadmapMode(on);
  if (!on) hideRoadmapTooltip();
  renderApp();
  if (on) {
    // Opening lands on the band holding the question that was already open (with
    // no selection, on the top of the path). Asked for *after* the render, so the
    // band it looks for is in the DOM by the time it is looked for.
    const q = state.selectedId ? getQuestionById(state.selectedId) : null;
    roadmapShowBand(q ? q.section : null);
  }
}

function exitRoadmapMode() {
  if (!setRoadmapMode(false)) return;
  hideRoadmapTooltip();
  renderApp();
}

// ── Roadmap pane ─────────────────────────────────────────────────
//
// The path for `state.activeTab`: one band per milestone (a band *is* a section —
// see data/roadmaps.js), each holding a heatmap cell per question. A cell is a
// real `<a href="#<id>">`, so ⌘-click and middle-click open a question in a new
// tab through the app's own hash routing without any extra code.
//
// Three defects in the feed-list version this replaces, and where they went:
// · `completed` counted *any* rating (`getRating(id)` truthy), so a question
//   marked “Forgot” was booked as progress. Here `known` is rating === 'know'.
// · hidden questions were dropped from the rows but still counted in `total`, so
//   no band's fraction matched what was on screen. Here they render as ghost
//   cells and count in the total.
// · one click handler on the whole milestone card opened its *first* question —
//   through a selector function that was never defined, so the click threw.
//   Every cell is its own link now.
const ROADMAP_RAIL_LABEL_MAX = 10;  // spec: rail labels truncate to ~10 characters
// Geometry read from getBoundingClientRect is px, so the two gaps that are really
// sheet lengths are declared in rem and converted through the live root font size
// (the same reading runMermaidInContainer uses): at ladder 70% they shrink with
// everything else instead of drifting. The sticky head is measured, not assumed.
const ROADMAP_TOOLTIP_GAP_REM = 0.5; // air between a cell and its tooltip
const ROADMAP_SCROLL_PAD_REM = 0.5;  // air under the pinned head when jumping to a band
function roadmapRem() {
  const px = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return Number.isFinite(px) && px > 0 ? px : 16;
}
const roadmapTooltipGap = () => ROADMAP_TOOLTIP_GAP_REM * roadmapRem();
const roadmapScrollPad = () => ROADMAP_SCROLL_PAD_REM * roadmapRem();

let roadmapBands = [];        // the model the last render drew (rail tooltips read it)
let roadmapCells = [];        // every cell, in path order — this is the roving order
let roadmapBandOrder = [];    // band names, path order
let roadmapScrollRequest = null; // { section: string | null } | null
let roadmapTooltipEl = null;
let roadmapTipSubject = null;
let roadmapHoverSection = null;

/** The only definition of progress on this pane: `know`, not “any rating”. */
function roadmapIsKnown(id) {
  return getRating(id) === 'know';
}

/** Difficulty → cell shape: E circle, M rounded square, H sharp square. */
function roadmapShapeFor(q) {
  const d = q.difficulty;
  return d === 'E' || d === 'H' ? d : 'M';
}

function roadmapCurrentSection() {
  const q = state.selectedId ? getQuestionById(state.selectedId) : null;
  return q && q.type === state.activeTab ? q.section : null;
}

/** RoadmapDB's band order + membership, resolved against the live registry. */
function roadmapBandsForActiveTopic() {
  const roadmap = RoadmapDB ? RoadmapDB.getRoadmap(state.activeTab) : [];
  const byId = new Map(questions.map(q => [q.id, q]));
  return roadmap.map(band => {
    // Starred first, then data order. Array#sort is stable, so comparing only on
    // `star` keeps the sequence RoadmapDB produced — the order the questions are
    // written in /data. The feed's importance+difficulty sort is not wanted here:
    // the path reads as a sequence.
    const items = band.questions
      .map(id => byId.get(id))
      .filter(Boolean)
      .sort((a, b) => Number(!!b.star) - Number(!!a.star));
    const counts = { E: 0, M: 0, H: 0 };
    let known = 0;
    items.forEach(q => {
      counts[roadmapShapeFor(q)] += 1;
      if (roadmapIsKnown(q.id)) known += 1;
    });
    return { name: band.milestone, items, counts, known };
  });
}

function roadmapCellAriaLabel(q, band) {
  const mem = detailMemorySliderValueForId(q.id);
  const bits = [
    q.title,
    `Section ${band.name}`,
    `Question ${q.id}`,
    DIFFICULTY_LABELS[roadmapShapeFor(q)],
    `Memory: ${MEMORY_LABELS[mem]}`,
  ];
  if (q.star) bits.push('Important');
  if (state.hiddenIds.has(q.id)) bits.push('Hidden — activate to unhide and open');
  return bits.join('. ');
}

function buildRoadmapBand(band) {
  const el = document.createElement('div');
  el.className = 'roadmap-band';
  el.dataset.band = band.name;

  const hd = document.createElement('h3');
  hd.className = 'roadmap-band-hd';
  const name = document.createElement('span');
  name.className = 'roadmap-band-name';
  name.textContent = band.name;
  const tally = document.createElement('span');
  tally.className = 'roadmap-band-tally';
  tally.textContent = `— ${band.known}/${band.items.length} known`;
  const diffs = document.createElement('span');
  diffs.className = 'roadmap-band-diffs';
  diffs.textContent = `E·${band.counts.E} M·${band.counts.M} H·${band.counts.H}`;
  hd.appendChild(name);
  hd.appendChild(tally);
  hd.appendChild(diffs);

  const cells = document.createElement('div');
  cells.className = 'roadmap-cells';
  cells.setAttribute('role', 'group');
  cells.setAttribute('aria-label', `${band.name}: ${band.items.length} question${band.items.length === 1 ? '' : 's'}`);

  band.items.forEach(q => {
    const hidden = state.hiddenIds.has(q.id);
    const cell = document.createElement('a');
    cell.className = `roadmap-cell rm-shape-${roadmapShapeFor(q)} rm-mem-${detailMemorySliderValueForId(q.id)}`
      + (hidden ? ' roadmap-cell-ghost' : '')
      + (q.id === state.selectedId ? ' is-current' : '');
    cell.href = `#${q.id}`;
    cell.dataset.rmq = q.id;
    cell.dataset.band = band.name;
    // One tab stop for the whole map: arrows move the roving focus (see
    // onRoadmapGridKeyDown), Tab moves to the next control outside it.
    cell.tabIndex = -1;
    cell.setAttribute('aria-label', roadmapCellAriaLabel(q, band));
    if (hidden) cell.dataset.ghost = '1';
    cells.appendChild(cell);
    roadmapCells.push(cell);
  });

  el.appendChild(hd);
  el.appendChild(cells);
  return el;
}

/**
 * The rail as one inline SVG: a segment per milestone, wide by cell count,
 * filled by % known. Geometry is measured rather than assumed — the viewBox is
 * the element's own px box, so one user unit is one CSS px and
 * `preserveAspectRatio="none"` cannot smear the labels. Because the box comes
 * from `clientHeight`, which is `rem` in the sheet, every proportion inside it
 * tracks the size ladder with the rest of the UI.
 */
function buildRoadmapRail(host, bands, attempt) {
  host.innerHTML = '';
  const total = bands.reduce((n, b) => n + b.items.length, 0);
  if (!total) return;
  const w = host.clientWidth;
  const h = host.clientHeight;
  // A pane that has not been laid out yet measures 0; retry once per frame.
  if ((!w || !h) && (attempt || 0) < 3) {
    window.requestAnimationFrame(() => buildRoadmapRail(host, bands, (attempt || 0) + 1));
    return;
  }
  if (!w || !h) return;

  const fs = Math.max(6, Math.round(h * 0.24));
  const barH = Math.round(h * 0.24);
  const barY = 2;
  const pad = 2;
  const labelY = Math.min(h - 1, barY + barH + Math.round(fs * 1.5));
  const rx = Math.round(barH / 2);
  const gap = bands.length > 1 ? 2 : 0;
  const usable = Math.max(1, w - pad * 2 - gap * (bands.length - 1));
  const current = roadmapCurrentSection();

  const edges = [];
  let acc = 0;
  bands.forEach(b => {
    acc += (b.items.length / total) * usable;
    edges.push(Math.round(acc));
  });

  const parts = bands.map((band, i) => {
    const left = i === 0 ? pad : pad + edges[i - 1] + i * gap;
    const right = pad + edges[i] + i * gap;
    const segW = Math.max(1, right - left);
    const fillW = Math.round(segW * (band.items.length ? band.known / band.items.length : 0));
    const label = roadmapRailLabel(band.name, segW, fs);
    return '<g class="roadmap-rail-seg" data-band="' + escapeHtml(band.name) + '">'
      + '<rect class="rr-track" x="' + left + '" y="' + barY + '" width="' + segW + '" height="' + barH + '" rx="' + rx + '"></rect>'
      + (fillW > 0 ? '<rect class="rr-fill" x="' + left + '" y="' + barY + '" width="' + fillW + '" height="' + barH + '" rx="' + rx + '"></rect>' : '')
      // you-are-here: a ring on the segment holding the open question. Stroke,
      // never the state colour — the fill already says how much is known.
      + (band.name === current ? '<rect class="rr-here" x="' + (left - 1.5) + '" y="' + (barY - 1.5) + '" width="' + (segW + 3) + '" height="' + (barH + 3) + '" rx="' + (rx + 1.5) + '"></rect>' : '')
      + (label ? '<text class="rr-label" x="' + (left + segW / 2) + '" y="' + labelY + '" text-anchor="middle" font-size="' + fs + '">' + escapeHtml(label) + '</text>' : '')
      + '</g>';
  });

  host.innerHTML = '<svg class="roadmap-rail-svg" width="100%" height="100%" viewBox="0 0 '
    + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true" focusable="false">'
    + parts.join('') + '</svg>';
}

/**
 * The cap is ~10 characters; a narrow band gets fewer, so a label can never run
 * into its neighbour's. The full name is in the tooltip. Below two characters of
 * room the label is dropped rather than reduced to an ellipsis.
 */
function roadmapRailLabel(name, segW, fs) {
  const room = Math.floor((segW - 2) / (fs * 0.62));
  const max = Math.min(ROADMAP_RAIL_LABEL_MAX, room);
  if (max < 2) return '';
  if (name.length <= max) return name;
  return `${name.slice(0, Math.max(1, max - 1)).trimEnd()}…`;
}

function renderRoadmapPane() {
  const pane = document.getElementById('detail-roadmap');
  const bandsHost = document.getElementById('roadmap-bands');
  const railHost = document.getElementById('roadmap-rail');
  if (!pane || !bandsHost || !railHost) return;

  const titleEl = document.getElementById('roadmap-title');
  const aggregateEl = document.getElementById('roadmap-aggregate');
  const jumpBtn = document.getElementById('roadmap-jump');

  // Re-rendering replaces every cell, so keep the two things a user can feel:
  // where the pane was scrolled, and where the keyboard was.
  const wasVisible = !pane.classList.contains('hidden');
  const keptScroll = wasVisible ? pane.scrollTop : 0;
  const focused = document.activeElement;
  const keptId = wasVisible && focused && focused.classList
    && focused.classList.contains('roadmap-cell') ? focused.dataset.rmq : null;

  pane.classList.remove('hidden');

  roadmapBands = roadmapBandsForActiveTopic();
  roadmapCells = [];
  roadmapBandOrder = roadmapBands.map(b => b.name);
  roadmapHoverSection = null;

  if (titleEl) {
    titleEl.textContent = `🗺️ Roadmap · ${TOPIC_LABELS[state.activeTab] || state.activeTab}`;
  }

  const total = roadmapBands.reduce((n, b) => n + b.items.length, 0);
  const known = roadmapBands.reduce((n, b) => n + b.known, 0);
  if (aggregateEl) {
    aggregateEl.textContent = `${known} of ${total} known`;
    aggregateEl.title = 'Only “Knew” counts as known.';
  }
  if (jumpBtn) jumpBtn.disabled = !roadmapCurrentSection();

  bandsHost.innerHTML = '';
  const frag = document.createDocumentFragment();
  roadmapBands.forEach(band => frag.appendChild(buildRoadmapBand(band)));
  if (roadmapBands.length) {
    bandsHost.appendChild(frag);
  } else {
    const empty = document.createElement('div');
    empty.className = 'roadmap-empty';
    empty.textContent = 'No roadmap for this topic yet.';
    bandsHost.appendChild(empty);
  }

  buildRoadmapRail(railHost, roadmapBands);

  // Re-pick the roving tab stop: keep the keyboard where it was if that question
  // is still on the path, else the open question, else the band being jumped to,
  // else the first cell of the path.
  const cellById = new Map(roadmapCells.map(c => [c.dataset.rmq, c]));
  let active = (keptId && cellById.get(keptId)) || null;
  if (!active && state.selectedId) active = cellById.get(state.selectedId) || null;
  if (!active && roadmapScrollRequest && roadmapScrollRequest.section) {
    active = roadmapCells.filter(c => c.dataset.band === roadmapScrollRequest.section)[0] || null;
  }
  if (!active) active = roadmapCells[0] || null;
  roadmapSetActiveCell(active);

  if (wasVisible && !roadmapScrollRequest) pane.scrollTop = keptScroll;
  if (keptId && active && document.contains(active)) {
    try {
      active.focus({ preventScroll: true });
    } catch (e) {
      active.focus();
    }
  }
  applyRoadmapScrollRequest();
}

/** Roving tabindex: the map keeps exactly one tab stop, on `cell`. */
function roadmapSetActiveCell(cell) {
  roadmapCells.forEach(c => { c.tabIndex = c === cell ? 0 : -1; });
}

function roadmapFocusCell(cell) {
  if (!cell) return;
  roadmapSetActiveCell(cell);
  if (typeof cell.focus === 'function') cell.focus();
}

/**
 * Ask the pane to land on a band (null = the top of the path) and take the jump
 * now if the DOM is already there. Safe to call before or after a render, which
 * is what lets a topic switch, a rail click and a sidebar click share one path.
 */
function roadmapShowBand(section) {
  roadmapScrollRequest = { section: section || null };
  applyRoadmapScrollRequest();
}

function roadmapBandElement(section) {
  const pane = document.getElementById('detail-roadmap');
  if (!pane || !section) return null;
  return Array.prototype.find.call(
    pane.querySelectorAll('.roadmap-band'),
    el => el.dataset.band === section
  ) || null;
}

function applyRoadmapScrollRequest() {
  const req = roadmapScrollRequest;
  if (!req) return;
  const pane = document.getElementById('detail-roadmap');
  // No pane, or a pane that is still hidden: keep the request so the render that
  // shows the pane can take the jump.
  if (!pane || pane.classList.contains('hidden')) return;
  roadmapScrollRequest = null;

  if (!req.section) {
    pane.scrollTop = 0;
    return;
  }
  const bandEl = roadmapBandElement(req.section);
  // A section that is not a band (a filter hid it, or the tab moved under us)
  // must not yank the pane somewhere the user did not ask for.
  if (!bandEl) return;

  const head = pane.querySelector('.roadmap-head');
  const top = bandEl.getBoundingClientRect().top - pane.getBoundingClientRect().top
    + pane.scrollTop - (head ? head.offsetHeight : 0) - roadmapScrollPad();
  const clamped = Math.max(0, Math.round(top));
  if (typeof pane.scrollTo === 'function') {
    pane.scrollTo({ top: clamped, behavior: roadmapScrollBehavior() });
  } else {
    pane.scrollTop = clamped;
  }
  roadmapFlashBand(bandEl);
}

function roadmapScrollBehavior() {
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return reduce ? 'auto' : 'smooth';
}

/** Transient: the jump is invisible on a band that is already at the top. */
function roadmapFlashBand(bandEl) {
  bandEl.classList.remove('band-flash');
  void bandEl.offsetWidth;
  bandEl.classList.add('band-flash');
  const clear = () => bandEl.classList.remove('band-flash');
  bandEl.addEventListener('animationend', clear, { once: true });
  setTimeout(clear, 1200);
}

// ── Roadmap tooltip ──────────────────────────────────────────────
/**
 * One element, appended to `document.body`. It cannot live in the pane:
 * `.detail-inner` has `container: detail / inline-size`, and inline-size
 * containment makes that box the containing block for `position: fixed`
 * descendants — a fixed tooltip inside it would be positioned against the pane,
 * not the window (the same trap that forces the diagram modal to body level).
 */
function roadmapTip() {
  if (roadmapTooltipEl && roadmapTooltipEl.parentNode) return roadmapTooltipEl;
  const el = document.createElement('div');
  el.id = 'roadmap-tooltip';
  el.className = 'roadmap-tooltip';
  el.setAttribute('role', 'tooltip');
  el.hidden = true;
  document.body.appendChild(el);
  roadmapTooltipEl = el;
  return el;
}

function showRoadmapTooltip(subject, lines) {
  if (!subject || !lines) { hideRoadmapTooltip(); return; }
  const el = roadmapTip();
  el.innerHTML = '';
  lines.forEach((line, i) => {
    const row = document.createElement('div');
    row.className = i === 0 ? 'roadmap-tip-title' : 'roadmap-tip-meta';
    // Metadata only — textContent, so a title can never inject markup.
    row.textContent = line;
    el.appendChild(row);
  });
  el.hidden = false;
  const r = subject.getBoundingClientRect();
  const winW = window.innerWidth || document.documentElement.clientWidth;
  const gap = roadmapTooltipGap();
  let left = r.left + r.width / 2 - el.offsetWidth / 2;
  left = Math.max(gap, Math.min(left, winW - el.offsetWidth - gap));
  let top = r.top - el.offsetHeight - gap;
  if (top < gap) top = r.bottom + gap;
  // Placed in px because the numbers come from getBoundingClientRect; the tooltip
  // box itself is sized in rem by the sheet.
  el.style.left = `${Math.round(left)}px`;
  el.style.top = `${Math.round(top)}px`;
  roadmapTipSubject = subject;
}

function hideRoadmapTooltip() {
  if (roadmapTooltipEl && !roadmapTooltipEl.hidden) roadmapTooltipEl.hidden = true;
  roadmapTipSubject = null;
}

/** Full title + section + difficulty + memory state + star flag. No preview. */
function roadmapCellTipLines(cell) {
  const q = getQuestionById(cell.dataset.rmq);
  if (!q) return null;
  const mem = detailMemorySliderValueForId(q.id);
  const lines = [
    q.title,
    `${cell.dataset.band} · ${DIFFICULTY_LABELS[roadmapShapeFor(q)]} · ${MEMORY_LABELS[mem]}`,
  ];
  const extra = [];
  if (q.star) extra.push('⭐ Important');
  if (state.hiddenIds.has(q.id)) extra.push('Hidden — click to unhide and open');
  if (extra.length) lines.push(extra.join(' · '));
  return lines;
}

function roadmapRailTipLines(section) {
  const band = roadmapBands.find(b => b.name === section);
  if (!band) return null;
  return [
    band.name,
    `${band.known} of ${band.items.length} known`,
    `E·${band.counts.E} M·${band.counts.M} H·${band.counts.H}`,
  ];
}

/** Rail hover marks the matching band, so a segment is never a guess. */
function roadmapSetBandHover(section) {
  if (roadmapHoverSection === section) return;
  roadmapHoverSection = section;
  const pane = document.getElementById('detail-roadmap');
  if (!pane) return;
  Array.prototype.forEach.call(pane.querySelectorAll('.roadmap-band'), el => {
    el.classList.toggle('band-hover', Boolean(section) && el.dataset.band === section);
  });
}

// ── Roadmap interaction ──────────────────────────────────────────
/**
 * The app's only un-hide path. `interview-hidden` used to be written by
 * hideAIQuestion() and never removed anywhere, so a question hidden by mistake
 * was gone for good. A ghost cell exists to undo exactly that.
 */
function roadmapUnhideAndOpen(id) {
  state.hiddenIds.delete(id);
  saveHiddenIds();
  selectQuestion(id);
}

function onRoadmapBandsClick(e) {
  const cell = e.target && e.target.closest ? e.target.closest('.roadmap-cell') : null;
  if (!cell) return;
  const id = cell.dataset.rmq;
  if (!id) return;
  // A modified click is the browser's: the anchor's own href does the work, so
  // ⌘/Ctrl-click still opens the question in a new tab.
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
  e.preventDefault();
  hideRoadmapTooltip();
  if (cell.dataset.ghost) {
    roadmapUnhideAndOpen(id);
    return;
  }
  selectQuestion(id);
}

/** Same-column cell one visual row down (step -1: up) inside a band. */
function roadmapRowNeighbour(cells, at, step) {
  const from = cells[at];
  if (!from || !from.getBoundingClientRect) return null;
  const base = from.getBoundingClientRect();
  if (!base.height) return null;
  const rows = new Map();
  cells.forEach((c, i) => {
    const top = Math.round(c.getBoundingClientRect().top);
    const bucket = rows.get(top);
    if (bucket) bucket.push(i);
    else rows.set(top, [i]);
  });
  const tops = [...rows.keys()].sort((a, b) => a - b);
  const rowAt = tops.indexOf(Math.round(base.top));
  if (rowAt === -1) return null;
  const want = tops[rowAt + step];
  if (want === undefined) return null;
  const bucket = rows.get(want);
  let best = bucket[0];
  let bestDx = Infinity;
  bucket.forEach(i => {
    const dx = Math.abs(cells[i].getBoundingClientRect().left - base.left);
    if (dx < bestDx) { bestDx = dx; best = i; }
  });
  return cells[best];
}

function roadmapAdjacentCell(cell, key) {
  const flat = roadmapCells;
  const at = flat.indexOf(cell);
  if (at === -1) return null;
  const inBand = flat.filter(c => c.dataset.band === cell.dataset.band);
  const bandAt = inBand.indexOf(cell);
  if (key === 'Home') return inBand[0];
  if (key === 'End') return inBand[inBand.length - 1];
  if (key === 'ArrowRight') return flat[Math.min(flat.length - 1, at + 1)];
  if (key === 'ArrowLeft') return flat[Math.max(0, at - 1)];

  const step = key === 'ArrowDown' ? 1 : -1;
  const row = roadmapRowNeighbour(inBand, bandAt, step);
  if (row) return row;
  // No row left in this band: carry on into the next one, which is what lets the
  // arrows walk the whole path without leaving the pane.
  const nextBand = roadmapBandOrder[roadmapBandOrder.indexOf(cell.dataset.band) + step];
  if (!nextBand) return null;
  const cells = flat.filter(c => c.dataset.band === nextBand);
  return step > 0 ? cells[0] : cells[cells.length - 1];
}

function onRoadmapGridKeyDown(e) {
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const cell = e.target && e.target.closest ? e.target.closest('.roadmap-cell') : null;
  if (!cell) return;
  // Enter is left to the browser: it activates the anchor, which is the cell's
  // real purpose (and gives hash routing, so ⌘-click semantics match).
  if (e.key === 'Enter') return;
  if (e.key === ' ') {
    // Swallow it: the reveal cover belongs to the question view this mode hides.
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].indexOf(e.key) === -1) return;
  e.preventDefault();
  // The document-level shortcuts alias ArrowUp/Down to J/K on the *feed*; while
  // the map has the keyboard, arrows must not move that selection as well.
  e.stopPropagation();
  roadmapFocusCell(roadmapAdjacentCell(cell, e.key));
}

function onRoadmapCellPointer(e) {
  const cell = e.target && e.target.closest ? e.target.closest('.roadmap-cell') : null;
  if (!cell) { hideRoadmapTooltip(); return; }
  if (cell === roadmapTipSubject) return;
  showRoadmapTooltip(cell, roadmapCellTipLines(cell));
}

function onRoadmapCellLeave(e) {
  const cell = e.target && e.target.closest ? e.target.closest('.roadmap-cell') : null;
  if (!cell) return;
  const to = e.relatedTarget;
  if (to && to.closest && to.closest('.roadmap-cell') === cell) return;
  hideRoadmapTooltip();
}

function roadmapRailSegment(target) {
  return target && target.closest ? target.closest('.roadmap-rail-seg') : null;
}

function onRoadmapRailMove(e) {
  const seg = roadmapRailSegment(e.target);
  roadmapSetBandHover(seg ? seg.dataset.band : null);
  if (!seg) { hideRoadmapTooltip(); return; }
  if (seg === roadmapTipSubject) return;
  showRoadmapTooltip(seg, roadmapRailTipLines(seg.dataset.band));
}

function onRoadmapRailLeave() {
  roadmapSetBandHover(null);
  hideRoadmapTooltip();
}

function onRoadmapRailClick(e) {
  const seg = roadmapRailSegment(e.target);
  if (!seg) return;
  e.preventDefault();
  roadmapShowBand(seg.dataset.band);
}

function roadmapJumpToCurrent() {
  const section = roadmapCurrentSection();
  if (!section) return;
  roadmapShowBand(section);
}

function initializeRoadmap() {
  const pane = document.getElementById('detail-roadmap');
  const bandsHost = document.getElementById('roadmap-bands');
  const railHost = document.getElementById('roadmap-rail');

  if (bandsHost) {
    bandsHost.addEventListener('click', onRoadmapBandsClick);
    bandsHost.addEventListener('keydown', onRoadmapGridKeyDown);
    // Tooltip on hover *and* on focus: the pointer and the keyboard must see the
    // same metadata, and the cells carry none of it visibly.
    bandsHost.addEventListener('mouseover', onRoadmapCellPointer);
    bandsHost.addEventListener('mouseout', onRoadmapCellLeave);
    bandsHost.addEventListener('focusin', onRoadmapCellPointer);
    bandsHost.addEventListener('focusout', onRoadmapCellLeave);
  }
  if (railHost) {
    railHost.addEventListener('mousemove', onRoadmapRailMove);
    railHost.addEventListener('mouseleave', onRoadmapRailLeave);
    railHost.addEventListener('click', onRoadmapRailClick);
  }
  // The tooltip is placed against the cell's viewport rect, so it has to go when
  // the pane scrolls under it.
  if (pane) pane.addEventListener('scroll', hideRoadmapTooltip, { passive: true });
}

function hideAIQuestion(id) {
  state.hiddenIds.add(id);
  saveHiddenIds();
  renderApp();
}

function updateRatingButtons(id) {
  const rating = id ? getRating(id) : null;
  const bar = document.getElementById('rating-bar');
  const buttons = bar
    ? bar.querySelectorAll('.rate-btn[data-rating]')
    : document.querySelectorAll('#rate-know, #rate-shaky, #rate-review');

  buttons.forEach(btn => {
    const r = btn.dataset.rating;
    if (!r) return;
    btn.classList.remove('active-know', 'active-shaky', 'active-review');
    const on = rating === r;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) btn.classList.add(`active-${r}`);
  });

  const range = document.getElementById('detail-memory-range');
  if (range) {
    const v = detailMemorySliderValueForId(id);
    range.value = String(v);
    range.setAttribute('aria-valuenow', String(v));
    range.setAttribute('aria-valuetext', detailMemorySliderAriaValuetext(id, v));
  }
}

function setRating(id, rating) {
  const current = getRating(id);
  if (current === rating) {
    // Toggle off
    delete state.ratings[id];
  } else {
    state.ratings[id] = rating;
  }
  saveRatings();
  flashSaved();
  updateRatingButtons(id);
  renderList();
  const q = getQuestionById(id);
  if (q) syncDetailSectionChip(q);
  
}

/**
 * Detail range: ordinal 0 unseen … 3 know (aligned with sidebar memory chips).
 * THE source of truth for the 4-level memory value — feed gem class, status
 * phrase, slider position, ARIA text and roadmap fill all derive from it, so
 * they can never disagree. Rating-first: an explicit `know|shaky|review` in
 * `state.ratings` is the user changing the level and ALWAYS wins (3|2|1).
 * The absence of a rating resolves to 0 "Unseen"; `state.seen` is irrelevant
 * to the value (opening a question is not a rating, and a stored rating is
 * never hidden by a missing seen entry). Notch 1 ("Forgot") is therefore
 * reachable only through a deliberate rating (slider, 1/2/3 keys, or stored
 * `review` data). `state.seen` still drives other surfaces that read it
 * directly: the unseen filter, the unseen chip count, the section % bar and
 * the feed card's opened/unseen styling.
 */
function detailMemorySliderValueForId(id) {
  if (!id) return 0;
  const v = getSliderValueFromStatus(getRating(id));
  return v === null ? 0 : v; // no rating (or an unmapped value) → Unseen
}

/** `aria-valuetext` for the detail range: the shared label for the ordinal. Notch 1
 *  now only ever means an explicit "Forgot" rating, so there is no seen-unrated case here. */
function detailMemorySliderAriaValuetext(id, sliderValue) {
  if (!id) return 'Unseen';
  const labels = MEMORY_LABELS;
  return labels[sliderValue] || 'Unseen';
}

/**
 * Apply memory level from the detail range (absolute, not toggle).
 * 0 = unseen (`applyUnseenMemoryState`); 1–3 = review / shaky / know + seen.
 */
function applyDetailMemoryRange(id, rawValue) {
  if (!id) return;
  const v = normalizeMemorySliderValue(rawValue);
  if (v === null) return;
  if (v === 0) {
    applyUnseenMemoryState(id);
  } else {
    applyRatedMemoryFromSliderValue(id, v);
  }
  saveRatings();
  saveSeen();
  flashSaved();
  updateRatingButtons(id);
  renderList();
  renderMainPanel();
}

// ── Navigation ─────────────────────────────────────────────────
function navigateList(direction) {
  const filtered = getSortedFilteredQuestions();
  if (filtered.length === 0) return;
  let idx = filtered.findIndex(q => q.id === state.selectedId);
  if (idx === -1) {
    idx = direction === 1 ? 0 : filtered.length - 1;
  } else {
    idx = (idx + direction + filtered.length) % filtered.length;
  }
  selectQuestion(filtered[idx].id);
}

function onTopicChange(value) {
  state.activeTab = value;
  // Tag selections are topic-scoped facets — they don't carry across topics
  if (state.tagFilters.length) {
    state.tagFilters = [];
    if (window.renderTagFilterUI) window.renderTagFilterUI();
  }
  state.activeFeedSection = null;
  clearFeedSectionPin();
  state.selectedId = null;
  state.cardRevealed = false;
  pushURLState();
  renderList();
  renderMainPanel(null);
  // A tab switch keeps roadmap mode and shows that topic's path from the top
  // (there is no question to land on any more).
  if (state.showRoadmap) roadmapShowBand(null);
}

// ── URL state ──────────────────────────────────────────────────
function pushURLState() {
  const params = new URLSearchParams();
  params.set('tab', state.activeTab);
  if (state.selectedId) params.set('q', state.selectedId);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '#' + qs : location.pathname);
}

/**
 * Deep links into an already-open tab: pasting `#tab=system-design&q=sd-75`
 * (or the short `#sd-75`) onto a loaded page is a same-document navigation,
 * and without this listener nothing re-renders. No feedback loop: every URL
 * write goes through pushURLState's history.replaceState, which — unlike a
 * user navigation — never fires `hashchange`.
 */
function initializeHashRouting() {
  window.addEventListener('hashchange', () => {
    const prevTab = state.activeTab;
    const prevSelected = state.selectedId;
    restoreStateFromURL();

    const target = state.selectedId ? getQuestionById(state.selectedId) : null;
    if (target) {
      if (target.id === prevSelected && state.activeTab === prevTab) return;
      // Re-runs renderList/renderMainPanel and canonicalises the hash
      // (e.g. `#sd-75` → `#tab=system-design&q=sd-75`).
      selectQuestion(target.id);
      return;
    }
    if (!prevSelected && state.activeTab === prevTab) return;
    // Hash points at a topic with no (valid) question: mirror a tab click.
    onTopicChange(state.activeTab);
  });
}

// ── History navigation ─────────────────────────────────────────
function historyBack() {
  if (state.historyIdx <= 0) return;
  state.historyIdx--;
  state._historyNav = true;
  selectQuestion(state.history[state.historyIdx]);
  updateHistoryButtons();
}

function historyForward() {
  if (state.historyIdx >= state.history.length - 1) return;
  state.historyIdx++;
  state._historyNav = true;
  selectQuestion(state.history[state.historyIdx]);
  updateHistoryButtons();
}

function updateHistoryButtons() {
  const backBtn = document.getElementById('hist-back');
  const fwdBtn = document.getElementById('hist-fwd');
  if (backBtn) backBtn.disabled = state.historyIdx <= 0;
  if (fwdBtn) fwdBtn.disabled = state.historyIdx >= state.history.length - 1;
}

// ── Command palette (⌘⇧F / Ctrl+Shift+F; ⌘E / Ctrl+E kept) ────
let cmdPaletteOpen = false;
/** Render entries: { q, direct, score, titleHtml, snippetHtml, groupLabel } */
let cmdResultsList = [];
let cmdRowEls = [];
let cmdSelectedIdx = 0;
let cmdInvalidOperator = null;
let cmdReturnFocus = null;
/** Active #/@ completion context computed on the last filter pass, or null. */
let cmdSuggestCtx = null;

/** Cap for visible palette rows (direct hits first, body hits fill the rest). */
const CMD_RESULT_LIMIT = 20;
const CMD_RECENT_LIMIT = 5;
const CMD_MAX_POSTINGS_PER_TERM = 400;
const CMD_SNIPPET_WINDOW = 100;

function cmdIsMacPlatform() {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav) return false;
  return /Mac|iPhone|iPad|iPod/.test(`${nav.platform || ''} ${nav.userAgent || ''}`);
}
const CMD_IS_MAC = cmdIsMacPlatform();

/**
 * Per-word in-order matcher. The query is split on whitespace and EVERY
 * non-empty token must occur as a CONTIGUOUS, case-insensitive substring of
 * the text, each token starting no earlier than the end of the previous one
 * (in-order, non-overlapping). Scattered characters inside a token never
 * match, so "sreq" finds nothing in "search request", while "staff plat"
 * finds "Staff / Platform" and "ping hm" does not match what "hm ping" does.
 * Returns { score, positions } or null. The score keeps the old direct-hit
 * scale — 100 + (query length × 2) − min(first-token index, 20) — and
 * subtracts min(total gap, 20), the characters the matched words spent
 * apart, so adjacent words outrank far-apart ones without reordering whole
 * tiers; cmdScoreDirect's field weights (title › section = tags › id) and
 * the body tier are therefore untouched. positions index every matched token
 * into `text` so callers can wrap them in <mark class="cmd-mark"> (escape
 * first!).
 */
function cmdFuzzyScore(text, pattern) {
  const t = String(text);
  const p = String(pattern);
  if (!t || !p) return null;
  const tl = t.toLowerCase();
  const pl = p.toLowerCase();
  const tokens = pl.split(/\s+/).filter(Boolean);
  if (!tokens.length) return null;
  const positions = [];
  let firstAt = 0;
  let gap = 0;
  let next = 0;
  for (let k = 0; k < tokens.length; k++) {
    const tok = tokens[k];
    const at = tl.indexOf(tok, next);
    if (at === -1) return null;
    if (k === 0) firstAt = at;
    else gap += at - next;
    for (let i = 0; i < tok.length; i++) positions.push(at + i);
    next = at + tok.length;
  }
  return {
    score: 100 + pl.length * 2 - Math.min(firstAt, 20) - Math.min(gap, 20),
    positions,
  };
}

/** Escape `text`, then wrap the given character indices in <mark class="cmd-mark">. */
function cmdHighlightHtml(text, positions) {
  const s = String(text);
  if (!positions || !positions.length) return escapeHtml(s);
  const marked = new Set(positions.filter(i => i >= 0 && i < s.length));
  let html = '';
  let open = false;
  for (let i = 0; i < s.length; i++) {
    const hit = marked.has(i);
    if (hit && !open) { html += '<mark class="cmd-mark">'; open = true; }
    if (!hit && open) { html += '</mark>'; open = false; }
    html += escapeHtml(s[i]);
  }
  if (open) html += '</mark>';
  return html;
}

// ── Palette search structures (built once at load) ─────────────
let cmdSearchStructuresBuilt = false;
const cmdKnownTags = new Set();
const cmdSectionsByNorm = new Map(); // normalized name → canonical section
let cmdBodyFields = [];              // { questionId, fieldKey, sectionLabel, text, q }
let cmdPostings = new Map();         // lowercase term → flat [fieldRef, offset, …]
let cmdBodyIndexBuildMs = 0;
let cmdTagCounts = new Map();        // lowercase tag → { name, count }
let cmdSectionCounts = new Map();    // normalized section → { name, count }

function cmdNormalizeSectionName(s) {
  return String(s).toLowerCase().replace(/\s+/g, '');
}

/** Markdown → plain searchable text (fenced code incl. mermaid is dropped). */
function cmdCleanBodyText(md) {
  return String(md)
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*_`|>~-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildCmdSearchStructures() {
  const src = questions.length ? questions : QuestionDB.all();
  cmdKnownTags.clear();
  cmdSectionsByNorm.clear();
  cmdTagCounts = new Map();
  cmdSectionCounts = new Map();
  src.forEach(q => {
    (q.tags || []).forEach(tag => {
      const name = String(tag);
      const key = name.toLowerCase();
      cmdKnownTags.add(key);
      const info = cmdTagCounts.get(key) || { name, count: 0 };
      info.count++;
      cmdTagCounts.set(key, info);
    });
    const norm = cmdNormalizeSectionName(q.section);
    if (norm) {
      if (!cmdSectionsByNorm.has(norm)) cmdSectionsByNorm.set(norm, q.section);
      const info = cmdSectionCounts.get(norm) || { name: q.section, count: 0 };
      info.count++;
      cmdSectionCounts.set(norm, info);
    }
  });
  cmdBodyFields = [];
  cmdPostings = new Map();
  const t0 = performance.now();
  src.forEach(q => {
    const values = collectDetailValues(q);
    Object.keys(values).forEach(fieldKey => {
      const cleaned = cmdCleanBodyText(values[fieldKey]);
      if (!cleaned) return;
      const ref = cmdBodyFields.length;
      cmdBodyFields.push({
        questionId: q.id,
        fieldKey,
        sectionLabel: detailSectionMeta(q.type, fieldKey).label,
        text: cleaned,
        q,
      });
      const lower = cleaned.toLowerCase();
      const re = /[a-z0-9]+/g;
      let m;
      while ((m = re.exec(lower))) {
        let list = cmdPostings.get(m[0]);
        if (!list) { list = []; cmdPostings.set(m[0], list); }
        if (list.length < CMD_MAX_POSTINGS_PER_TERM * 2) list.push(ref, m.index);
      }
    });
  });
  cmdBodyIndexBuildMs = performance.now() - t0;
  cmdSearchStructuresBuilt = true;
  try {
    window.__cmdBodyIndexBuildMs = Math.round(cmdBodyIndexBuildMs * 100) / 100;
    window.__cmdBodyStats = { fields: cmdBodyFields.length, terms: cmdPostings.size };
  } catch (e) {}
}

/**
 * Split raw input into free text + `#tag` / `@section` operators.
 * `@` consumes following plain tokens until a known section matches, so
 * quoted-space names work: `@staff / platform` and `@arrays & strings`.
 */
function parseCmdQuery(raw) {
  const parsed = { free: [], tags: [], section: null, invalid: [] };
  const tokens = raw.split(/\s+/).filter(Boolean);
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    if (tok[0] === '#') {
      const name = tok.slice(1).toLowerCase();
      if (name && cmdKnownTags.has(name)) parsed.tags.push(name);
      else parsed.invalid.push(tok);
      continue;
    }
    if (tok[0] === '@') {
      if (parsed.section) { parsed.invalid.push(tok); continue; }
      const parts = [tok.slice(1)];
      let canon = cmdSectionsByNorm.get(cmdNormalizeSectionName(parts[0]));
      let consumed = i;
      if (!canon) {
        for (let j = i + 1; j < tokens.length && !/^[#@]/.test(tokens[j]); j++) {
          parts.push(tokens[j]);
          canon = cmdSectionsByNorm.get(cmdNormalizeSectionName(parts.join(' ')));
          if (canon) { consumed = j; break; }
        }
      }
      if (canon) {
        parsed.section = canon;
        i = consumed;
      } else {
        parsed.invalid.push(tok);
      }
      continue;
    }
    parsed.free.push(tok);
  }
  return parsed;
}

/**
 * Direct-field score. Weight: title › section › tags › type/id/num.
 * Returns { score, titlePositions } or null when nothing direct matched.
 */
function cmdScoreDirect(q, freeText) {
  const title = cmdFuzzyScore(q.title, freeText);
  const section = cmdFuzzyScore(q.section, freeText);
  let tag = null;
  for (const rawTag of q.tags || []) {
    const c = cmdFuzzyScore(rawTag, freeText);
    if (c && (!tag || c.score > tag.score)) tag = c;
  }
  const ident = cmdFuzzyScore(`${q.type} ${q.id} ${q.num ?? ''}`, freeText);
  const score = 3 * (title ? title.score : 0)
    + 2 * (section ? section.score : 0)
    + 2 * (tag ? tag.score : 0)
    + 1.25 * (ident ? ident.score : 0);
  if (!score) return null;
  return { score, titlePositions: title ? title.positions : null };
}

/** Body hits: every query term must occur in the same indexed field. */
function cmdBodyMatches(terms, accept) {
  const hits = [];
  if (!terms.length) return hits;
  const lists = [];
  for (const term of terms) {
    const list = cmdPostings.get(term);
    if (!list || !list.length) return hits;
    lists.push(list);
  }
  lists.sort((a, b) => a.length - b.length);
  let merged = new Map(); // fieldRef → offsets array (one per term)
  for (let k = 0; k < lists.length; k++) {
    const best = new Map(); // fieldRef → min offset for this term
    const list = lists[k];
    for (let i = 0; i < list.length; i += 2) {
      const ref = list[i];
      const off = list[i + 1];
      if (!best.has(ref) || off < best.get(ref)) best.set(ref, off);
    }
    const next = new Map();
    if (k === 0) {
      best.forEach((off, ref) => next.set(ref, [off]));
    } else {
      best.forEach((off, ref) => {
        const acc = merged.get(ref);
        if (acc) {
          acc.push(off);
          next.set(ref, acc);
        }
      });
    }
    merged = next;
    if (!merged.size) return hits;
  }
  merged.forEach((offsets, ref) => {
    const entry = cmdBodyFields[ref];
    if (!entry || !accept(entry.q)) return;
    let min = offsets[0];
    let max = offsets[0];
    offsets.forEach(o => { if (o < min) min = o; if (o > max) max = o; });
    hits.push({
      q: entry.q,
      entry,
      centerOffset: min,
      score: 25 + (terms.length > 1 && max - min < 80 ? 12 : 0),
    });
  });
  return hits;
}

/** ~100 chars centred on the match, terms wrapped in cmd-mark. Safe HTML. */
function cmdSnippetInnerHtml(entry, centerOffset, terms) {
  const text = entry.text;
  let start = Math.max(0, centerOffset - 45);
  if (start + CMD_SNIPPET_WINDOW > text.length) {
    start = Math.max(0, text.length - CMD_SNIPPET_WINDOW);
  }
  const end = Math.min(text.length, start + CMD_SNIPPET_WINDOW);
  const piece = text.slice(start, end);
  const lower = piece.toLowerCase();
  let re = null;
  try {
    re = new RegExp(terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|'), 'g');
  } catch (e) {}
  let body = '';
  let last = 0;
  if (re) {
    let m;
    while ((m = re.exec(lower))) {
      const len = m[0].length || 1;
      if (m.index < last) continue;
      if (m.index > last) body += escapeHtml(piece.slice(last, m.index));
      body += `<mark class="cmd-mark">${escapeHtml(piece.slice(m.index, m.index + len))}</mark>`;
      last = m.index + len;
    }
  }
  body += escapeHtml(piece.slice(last));
  const pre = start > 0 ? '…' : '';
  const post = end < text.length ? '…' : '';
  return `${escapeHtml(entry.sectionLabel)}: ${pre}${body}${post}`;
}

/** Empty input: last 5 distinct history entries, else 5 starred questions. */
function cmdEmptyEntries() {
  const recent = [];
  const used = new Set();
  for (let i = state.history.length - 1; i >= 0 && recent.length < CMD_RECENT_LIMIT; i--) {
    const id = state.history[i];
    if (used.has(id)) continue;
    const q = getQuestionById(id);
    if (q) { used.add(id); recent.push(q); }
  }
  let list = recent;
  let label = 'Recently opened';
  if (!list.length) {
    list = sortQuestionsByImportanceDifficulty(questions.filter(q => q.star)).slice(0, CMD_RECENT_LIMIT);
    label = 'Starred';
  }
  return list.map((q, i) => ({
    q,
    direct: true,
    score: 1,
    titleHtml: escapeHtml(q.title),
    snippetHtml: null,
    groupLabel: i === 0 ? label : null,
  }));
}

// ── Palette autocomplete (#tag / @section) ─────────────────────

/**
 * When the token at the caret starts with # or @ and does not yet resolve to
 * a canonical name, the palette offers completions instead of question rows.
 * Returns { kind, partial, start, end } (token span inside `raw`) or null.
 * This is also what keeps a valid prefix like `#te` from being reported as an
 * invalid filter while the user is still typing it.
 * The `@` branch follows the same absorb-following-plain-tokens rule
 * parseCmdQuery uses for sections, so a partial carrying " / " keeps
 * completing: `@staff /` and `@staff / p` still name "Staff / Platform".
 * The `#` branch stays a single token because parseCmdQuery never absorbs
 * anything after a tag.
 */
function cmdSuggestContext(raw, caret) {
  if (!raw || caret < 0 || caret > raw.length) return null;
  const m = /(@([^\s#@]*(?:\s+[^\s#@]+)*)|#([^\s#@]*))$/.exec(raw.slice(0, caret));
  if (!m) return null;
  const isTag = m[1][0] === '#';
  const partial = (isTag ? m[3] : m[2]).toLowerCase();
  const kind = isTag ? 'tag' : 'section';
  if (partial) {
    const resolved = kind === 'tag'
      ? cmdKnownTags.has(partial)
      : cmdSectionsByNorm.has(cmdNormalizeSectionName(partial));
    if (resolved) return null;
  }
  return { kind, partial, start: caret - m[1].length, end: caret };
}

/**
 * Completion rows for the suggest context. Source set is global (every tag /
 * section across all 357 questions, not the topic-scoped sidebar lists),
 * ranked by the same per-word in-order scorer (cmdFuzzyScore), bounded by
 * CMD_RESULT_LIMIT, ordered by usage count when the token is still bare.
 * Already-present operators are excluded so `#cache #c` cannot offer a second
 * `#cache`.
 */
function cmdSuggestEntries(ctx, remainingQuery) {
  const parsed = parseCmdQuery(String(remainingQuery).trim());
  const isTag = ctx.kind === 'tag';
  const usedTags = new Set(parsed.tags);
  const usedSection = parsed.section ? cmdNormalizeSectionName(parsed.section) : null;
  const out = [];
  const consider = (name, count, skip) => {
    if (skip) return;
    if (ctx.partial) {
      const s = cmdFuzzyScore(name, ctx.partial);
      if (s) out.push({ name, count, score: s.score, html: cmdHighlightHtml(name, s.positions) });
    } else {
      out.push({ name, count, score: 0, html: escapeHtml(name) });
    }
  };
  if (isTag) {
    cmdTagCounts.forEach((info, key) => consider(info.name, info.count, usedTags.has(key)));
  } else {
    cmdSectionCounts.forEach((info, key) => consider(info.name, info.count, key === usedSection));
  }
  out.sort(ctx.partial
    ? (a, b) => b.score - a.score || b.count - a.count || String(a.name).localeCompare(String(b.name))
    : (a, b) => b.count - a.count || String(a.name).localeCompare(String(b.name)));
  return out.slice(0, CMD_RESULT_LIMIT).map((c, i) => ({
    q: null,
    direct: false,
    score: c.score,
    suggest: { kind: ctx.kind, name: c.name, count: c.count },
    titleHtml: c.html,
    snippetHtml: null,
    groupLabel: i === 0 ? (isTag ? 'Tags' : 'Sections') : null,
  }));
}

/** Accept the highlighted completion: rewrite the token, keep focus typing. */
function acceptCmdSuggestion() {
  const ctx = cmdSuggestCtx;
  const entry = ctx ? cmdResultsList[cmdSelectedIdx] : null;
  const input = document.getElementById('cmd-input');
  if (!entry || !entry.suggest || !input) return false;
  const sigil = entry.suggest.kind === 'tag' ? '#' : '@';
  const text = sigil + entry.suggest.name + ' ';
  const before = input.value.slice(0, ctx.start);
  const after = input.value.slice(ctx.end);
  input.value = before + text + after;
  const caret = (before + text).length;
  input.focus();
  try { input.setSelectionRange(caret, caret); } catch (e) {}
  filterCmdPalette(input.value);
  return true;
}

/**
 * Query → render entries. Tier 1 is direct field hits (title/section/tags/id);
 * tier 2 is body-only hits. A body hit can never outrank a direct hit for the
 * same query and never duplicates the same question. Both tiers are cut at
 * CMD_RESULT_LIMIT total visible rows.
 */
function getCmdPaletteMatches(query) {
  if (!cmdSearchStructuresBuilt) buildCmdSearchStructures();
  const trimmed = String(query).trim();
  if (!trimmed) {
    // Empty query: the recent tier (starred fallback) under its own group
    // label — not the unlabelled operator-browse block below, which is only
    // meaningful once a #/@ filter is actually in place.
    cmdInvalidOperator = null;
    return cmdEmptyEntries();
  }
  const parsed = parseCmdQuery(trimmed);
  cmdInvalidOperator = parsed.invalid.length ? parsed.invalid[0] : null;
  if (cmdInvalidOperator) return [];
  const src = questions.length ? questions : QuestionDB.all();
  const sectionNorm = parsed.section ? cmdNormalizeSectionName(parsed.section) : null;
  const accept = q => {
    if (sectionNorm && cmdNormalizeSectionName(q.section) !== sectionNorm) return false;
    if (parsed.tags.length) {
      const tags = (q.tags || []).map(t => String(t).toLowerCase());
      if (!parsed.tags.every(t => tags.indexOf(t) !== -1)) return false;
    }
    return true;
  };
  const freeText = parsed.free.join(' ');
  if (!freeText) {
    // Operator-only browse: importance/difficulty order, no scoring involved.
    return src
      .filter(accept)
      .sort(compareQuestionsImportanceDifficulty)
      .slice(0, CMD_RESULT_LIMIT)
      .map(q => ({
        q,
        direct: true,
        score: 1,
        titleHtml: escapeHtml(q.title),
        snippetHtml: null,
        groupLabel: null,
      }));
  }
  const direct = [];
  const directIds = new Set();
  src.forEach(q => {
    if (!accept(q)) return;
    const scored = cmdScoreDirect(q, freeText);
    if (!scored) return;
    directIds.add(q.id);
    direct.push({
      q,
      direct: true,
      score: scored.score,
      titleHtml: cmdHighlightHtml(q.title, scored.titlePositions),
      snippetHtml: null,
      groupLabel: null,
    });
  });
  direct.sort((a, b) => b.score - a.score || compareQuestionsImportanceDifficulty(a.q, b.q));
  const terms = (freeText.toLowerCase().match(/[a-z0-9]+/g) || []).slice(0, 6);
  const bodyHits = cmdBodyMatches(terms, q => !directIds.has(q.id) && accept(q));
  bodyHits.sort((a, b) => b.score - a.score || compareQuestionsImportanceDifficulty(a.q, b.q));
  const bodyEntries = bodyHits
    .slice(0, CMD_RESULT_LIMIT)
    .map((hit, i) => ({
      q: hit.q,
      direct: false,
      score: hit.score,
      titleHtml: escapeHtml(hit.q.title),
      snippetHtml: cmdSnippetInnerHtml(hit.entry, hit.centerOffset, terms),
      groupLabel: i === 0 ? 'In answers' : null,
    }));
  return direct.slice(0, CMD_RESULT_LIMIT).concat(bodyEntries).slice(0, CMD_RESULT_LIMIT);
}

function renderCmdResults() {
  const container = document.getElementById('cmd-results');
  if (!container) return;
  container.innerHTML = '';
  cmdRowEls = [];
  const frag = document.createDocumentFragment();
  const addGroupLabel = text => {
    const label = document.createElement('div');
    label.className = 'cmd-group-label';
    label.textContent = text;
    frag.appendChild(label);
  };
  if (cmdInvalidOperator) {
    // An unresolvable #/@ operator is a broken FILTER, not a title typo: it
    // replaces the whole list with this banner so the two read differently.
    addGroupLabel(`Unknown filter "${cmdInvalidOperator}" — not a known #tag or @section`);
    const empty = document.createElement('div');
    empty.className = 'cmd-result-empty';
    empty.textContent = 'Remove or fix the filter to see results.';
    frag.appendChild(empty);
    container.appendChild(frag);
    syncCmdAria();
    return;
  }
  cmdResultsList.forEach((entry, i) => {
    if (entry.groupLabel) addGroupLabel(entry.groupLabel);
    if (entry.suggest) {
      // Autocomplete rows are plain pickable names, not feed cards.
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cmd-suggest';
      btn.id = `cmd-opt-${i}`;
      btn.dataset.cmdIndex = String(i);
      btn.setAttribute('role', 'option');
      btn.setAttribute('aria-selected', 'false');
      const sigil = entry.suggest.kind === 'tag' ? '#' : '@';
      btn.innerHTML = sigil + (entry.titleHtml || escapeHtml(entry.suggest.name));
      const count = document.createElement('span');
      count.className = 'cmd-row-tail';
      count.textContent = `${entry.suggest.count} question${entry.suggest.count === 1 ? '' : 's'}`;
      btn.appendChild(count);
      frag.appendChild(btn);
      cmdRowEls.push(btn);
      return;
    }
    const card = createFeedQuestionCard(entry.q);
    card.classList.add('cmd-result-item');
    // createFeedQuestionCard marks the current feed row with .selected; inside
    // the palette that class is reserved for the cursor only.
    card.classList.remove('selected');
    card.id = `cmd-opt-${i}`;
    card.dataset.cmdIndex = String(i);
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', 'false');
    const titleEl = card.querySelector('.qcard-title');
    if (titleEl) titleEl.innerHTML = entry.titleHtml || escapeHtml(entry.q.title);
    const footer = card.querySelector('.qcard-footer') || card.querySelector('.qcard-body');
    if (footer) {
      const tail = document.createElement('span');
      tail.className = 'cmd-row-tail';
      tail.textContent = `${entry.q.section} · ${entry.q.type}`;
      footer.appendChild(tail);
    }
    if (entry.snippetHtml) {
      const body = card.querySelector('.qcard-body') || card;
      const snip = document.createElement('div');
      snip.className = 'cmd-snippet';
      snip.innerHTML = entry.snippetHtml;
      body.appendChild(snip);
    }
    frag.appendChild(card);
    cmdRowEls.push(card);
  });
  if (!cmdResultsList.length) {
    const empty = document.createElement('div');
    empty.className = 'cmd-result-empty';
    empty.textContent = 'No matching questions.';
    frag.appendChild(empty);
  }
  container.appendChild(frag);
  setCmdSelection(0);
}

function filterCmdPalette(query) {
  const t0 = performance.now();
  const input = document.getElementById('cmd-input');
  const caret = input && typeof input.selectionStart === 'number' ? input.selectionStart : query.length;
  cmdSuggestCtx = cmdSuggestContext(query, caret);
  if (cmdSuggestCtx) {
    const remaining = query.slice(0, cmdSuggestCtx.start) + ' ' + query.slice(cmdSuggestCtx.end);
    cmdResultsList = cmdSuggestEntries(cmdSuggestCtx, remaining);
    if (!cmdResultsList.length) {
      // Nothing at all matches the partial — let the invalid-filter banner speak.
      cmdSuggestCtx = null;
      cmdResultsList = getCmdPaletteMatches(query);
    } else {
      cmdInvalidOperator = null;
    }
  } else {
    cmdResultsList = getCmdPaletteMatches(query);
  }
  const tSearch = performance.now();
  cmdSelectedIdx = 0;
  renderCmdResults();
  const t2 = performance.now();
  try {
    window.__cmdLastQueryStats = {
      searchMs: Math.round((tSearch - t0) * 100) / 100,
      renderMs: Math.round((t2 - tSearch) * 100) / 100,
      totalMs: Math.round((t2 - t0) * 100) / 100,
      rows: cmdResultsList.length,
    };
  } catch (e) {}
}

/** Cursor moves toggle class/aria on existing rows — no list rebuild. */
function setCmdSelection(next) {
  const n = cmdRowEls.length;
  if (!n) {
    syncCmdAria();
    return;
  }
  const idx = ((next % n) + n) % n;
  const current = cmdRowEls[cmdSelectedIdx];
  if (idx === cmdSelectedIdx && current && current.classList.contains('selected')) {
    syncCmdAria();
    return;
  }
  if (current) {
    current.classList.remove('selected');
    current.setAttribute('aria-selected', 'false');
  }
  cmdSelectedIdx = idx;
  const row = cmdRowEls[idx];
  row.classList.add('selected');
  row.setAttribute('aria-selected', 'true');
  row.scrollIntoView({ block: 'nearest' });
  syncCmdAria();
}

function moveCmdSelection(delta) {
  if (!cmdRowEls.length) return;
  setCmdSelection(cmdSelectedIdx + delta);
}

/** Rows that fit in the visible list — the PageUp/PageDown step. */
function cmdPageRows() {
  const container = document.getElementById('cmd-results');
  const first = cmdRowEls[0];
  if (!container || !first || !first.offsetHeight) return 8;
  return Math.max(1, Math.floor(container.clientHeight / first.offsetHeight));
}

function syncCmdAria() {
  const input = document.getElementById('cmd-input');
  if (!input) return;
  const row = cmdRowEls[cmdSelectedIdx];
  if (row) input.setAttribute('aria-activedescendant', row.id);
  else input.removeAttribute('aria-activedescendant');
}

function closeCmdPalette() {
  if (!cmdPaletteOpen) return;
  cmdPaletteOpen = false;
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  const container = document.getElementById('cmd-results');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (input) {
    input.value = '';
    input.removeAttribute('aria-activedescendant');
    input.setAttribute('aria-expanded', 'false');
    input.blur();
  }
  if (container) container.innerHTML = '';
  cmdResultsList = [];
  cmdRowEls = [];
  cmdSelectedIdx = 0;
  cmdInvalidOperator = null;
  const back = cmdReturnFocus;
  cmdReturnFocus = null;
  if (back && back !== document.body && document.contains(back) && typeof back.focus === 'function') {
    back.focus();
  }
}

function openCmdPalette() {
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  if (!overlay || !input) return;
  cmdReturnFocus = document.activeElement;
  cmdPaletteOpen = true;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  cmdSelectedIdx = 0;
  filterCmdPalette('');
  // Focus is synchronous on purpose: the old requestAnimationFrame deferred it
  // by one frame (~1s measured on this throttled page), so typing right after
  // opening landed on document.body and was dropped.
  input.focus();
  input.select();
  input.setAttribute('aria-expanded', 'true');
}

function toggleCmdPalette() {
  if (cmdPaletteOpen) closeCmdPalette();
  else openCmdPalette();
}

function confirmCmdSelection() {
  if (!cmdPaletteOpen || !cmdResultsList.length) return;
  const entry = cmdResultsList[cmdSelectedIdx];
  if (!entry || entry.suggest || !entry.q) return;
  closeCmdPalette();
  selectQuestion(entry.q.id);
}

/** While open, keep Tab inside the overlay — aria-modal="true" promises this. */
function trapCmdFocus(backward) {
  const overlay = document.getElementById('cmd-overlay');
  if (!overlay) return;
  const focusables = Array.prototype.filter.call(
    overlay.querySelectorAll('input, button, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'),
    el => !el.disabled && el.getClientRects().length > 0
  );
  if (!focusables.length) return;
  const active = document.activeElement;
  let idx = focusables.indexOf(active);
  idx = idx === -1 ? 0 : (idx + (backward ? -1 : 1) + focusables.length) % focusables.length;
  focusables[idx].focus();
}

function wireCommandPalette() {
  const input = document.getElementById('cmd-input');
  const backdrop = document.querySelector('#cmd-overlay .cmd-backdrop');
  const container = document.getElementById('cmd-results');
  if (input) {
    input.addEventListener('input', e => filterCmdPalette(e.target.value));
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    if (container) input.setAttribute('aria-controls', container.id);
    input.setAttribute('aria-expanded', 'false');
  }
  if (container) {
    // One capture-phase listener owns all row mouse input: stopPropagation()
    // during capture means the click never reaches the row's own
    // createFeedQuestionCard click handler → exactly one commit per click.
    container.addEventListener('mousedown', e => {
      if (e.target && e.target.closest && e.target.closest('.cmd-result-item, .cmd-suggest')) e.preventDefault();
    }, true);
    container.addEventListener('click', e => {
      const row = e.target && e.target.closest ? e.target.closest('.cmd-result-item, .cmd-suggest') : null;
      if (!row || !container.contains(row)) return;
      e.preventDefault();
      e.stopPropagation();
      const idx = Number(row.dataset.cmdIndex);
      if (!Number.isFinite(idx)) return;
      const entry = cmdResultsList[idx];
      setCmdSelection(idx);
      if (entry && entry.suggest) {
        // Click accepts the completion — same path as Enter/Tab.
        acceptCmdSuggestion();
        return;
      }
      confirmCmdSelection();
    }, true);
    // Hover moves the cursor (commit stays Enter/click-only).
    container.addEventListener('mouseover', e => {
      const row = e.target && e.target.closest ? e.target.closest('.cmd-result-item, .cmd-suggest') : null;
      if (!row || row === cmdRowEls[cmdSelectedIdx]) return;
      const idx = Number(row.dataset.cmdIndex);
      if (Number.isFinite(idx)) setCmdSelection(idx);
    });
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => closeCmdPalette());
  }
}

/** Topbar key chip for the primary shortcut (W1 owns the element; guarded). */
function syncCmdKbdHint() {
  const hint = document.getElementById('cmd-kbd-hint');
  if (!hint) return;
  hint.textContent = CMD_IS_MAC ? '⌘⇧F' : 'Ctrl+Shift+F';
}

/** ⌘⇧F / Ctrl+Shift+F is primary; ⌘E / Ctrl+E stays as the legacy alias. */
function paletteShortcutMatches(e) {
  if (!(e.metaKey || e.ctrlKey) || e.altKey) return false;
  const key = typeof e.key === 'string' ? e.key.toLowerCase() : '';
  if (key === 'f' && e.shiftKey) return true;
  if (key === 'e' && !e.shiftKey) return true;
  return false;
}





// ── Event wiring ───────────────────────────────────────────────
function syncTopicTabsActive(tab) {
  document.querySelectorAll('#topic-tabs .topic-tab[data-tab]').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === tab);
  });
}

function syncDiffFilterChipsUI() {
  document.querySelectorAll('#diff-chips .chip[data-diff], #diff-filters .pill[data-diff]').forEach(node => {
    const d = node.dataset.diff;
    if (!d || d === 'all') return;
    node.classList.toggle('active', state.diffFilter === d);
  });
}

/** Legacy HTML only: importance star chip, or old #status-chips / #status-filters / id="pill-*" memory buttons. */
function queryLegacyStatusFilterChip(status) {
  return (
    document.getElementById(`pill-${status}`)
    || document.querySelector(
      `#importance-chips .chip[data-status="${status}"], #status-chips .chip[data-status="${status}"], #status-filters .pill[data-status="${status}"]`
    )
  );
}

function syncSidebarMemoryRange() {
  const range = document.getElementById('sidebar-memory-range');
  if (!range) return;
  
  // Map status filter to range values: unseen=0, review=1, shaky=2, know=3
  let value = 0; // Default to "Unseen"
  if (state.statusFilter === 'unseen') value = 0;
  else if (state.statusFilter === 'review') value = 1;
  else if (state.statusFilter === 'shaky') value = 2;
  else if (state.statusFilter === 'know') value = 3;
  else if (!state.statusFilter) {
    // No filter active - show dimmed state
    range.style.opacity = '0.6';
    value = 0; // Default position
  } else {
    range.style.opacity = '1';
  }
  
  range.value = String(value);
  range.setAttribute('value', String(value)); // For CSS highlighting
  range.setAttribute('aria-valuenow', String(value));
  
  const labels = MEMORY_LABELS;
  const labelText = !state.statusFilter ? 'No filter (double-click to clear)' : labels[value];
  range.setAttribute('aria-valuetext', labelText || 'Unseen');
}

function syncMemoryFilterUI() {
  const legacySelector =
    '#importance-chips .chip[data-status], #status-chips .chip[data-status], #status-filters .pill[data-status]';
  document.querySelectorAll(legacySelector).forEach(node => {
    node.classList.remove('active', 'active-know', 'active-shaky', 'active-review', 'active-star', 'active-unseen');
  });
  document.querySelectorAll('.memory-filter-hit[data-status]').forEach(node => {
    node.classList.remove('active', 'active-know', 'active-shaky', 'active-review', 'active-star', 'active-unseen');
    node.setAttribute('aria-pressed', 'false');
  });

  if (!state.statusFilter) {
    syncSidebarMemoryRange();
    return;
  }
  const activeMap = {
    star: 'active-star',
    know: 'active-know',
    shaky: 'active-shaky',
    review: 'active-review',
    unseen: 'active-unseen',
  };
  const cls = activeMap[state.statusFilter] || 'active';
  const activeEl = queryLegacyStatusFilterChip(state.statusFilter);
  if (activeEl) activeEl.classList.add(cls);

  const hit = document.querySelector(`.memory-filter-hit[data-status="${state.statusFilter}"]`);
  if (hit) {
    hit.classList.add(cls);
    hit.setAttribute('aria-pressed', 'true');
  }

  syncSidebarMemoryRange();
}


function isShortcutSuppressedTarget(el) {
  if (!el || el === document.body) return false;
  if (el.id === 'cmd-input') return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || el.isContentEditable) return true;
  return false;
}

function wireResetMemoryButton() {
  const resetBtn = document.getElementById('reset-memory-btn');
  if (!resetBtn) return;
  
  resetBtn.addEventListener('click', () => {
    if (confirm('Reset all questions to unseen? This will clear your progress but keep your ratings.')) {
      state.seen = new Set();
      saveSeen();
      renderList();
      
      
      // Flash confirmation
      const icon = resetBtn.querySelector('.reset-icon');
      if (icon) {
        const originalText = icon.textContent;
        icon.textContent = '✓';
        setTimeout(() => {
          icon.textContent = originalText;
        }, 1000);
      }
    }
  });
}

async function initializeApp() {
  initTheme();
  initZoom();
  questions = QuestionDB.all();
  loadHiddenIds();
  loadRoadmapMode();
  buildCmdSearchStructures();
  // Load progress from server with localStorage fallback and one-time import
  const serverAvailable = await loadProgressWithServerFallback();
  if (!serverAvailable) {
    loadRatings();
    loadSeen();
  }
  purgeCollapsedCardStorage();
  restoreStateFromURL();
}

function restoreStateFromURL() {
  const raw = window.location.hash.replace(/^#/, '');
  const urlParams = new URLSearchParams(raw);
  const urlTab = urlParams.get('tab');
  let urlQuestion = urlParams.get('q');

  // Documented short form `#sd-75`: a bare question id, no key=value pairs.
  if (!urlQuestion && raw && raw.indexOf('=') === -1 && questions.some(item => item.id === raw)) {
    urlQuestion = raw;
  }
  if (urlQuestion && !questions.some(item => item.id === urlQuestion)) urlQuestion = null;

  if (urlTab && VALID_TABS.includes(urlTab)) {
    state.activeTab = urlTab;
  }

  if (urlQuestion) {
    state.selectedId = urlQuestion;
    state.cardRevealed = state.learningMode;
    const questionFromUrl = getQuestionById(urlQuestion);
    if (questionFromUrl && VALID_TABS.includes(questionFromUrl.type)) {
      state.activeTab = questionFromUrl.type;
      state.activeFeedSection = { type: questionFromUrl.type, section: questionFromUrl.section };
      clearFeedSectionPin();
    }
  } else if (urlTab && VALID_TABS.includes(urlTab)) {
    // The hash names a topic and no question. Authoritative so the same
    // function can drive hashchange re-routing: drop any stale selection.
    state.selectedId = null;
    state.cardRevealed = false;
    state.activeFeedSection = null;
  }
}

function initializeTopicControls() {
  const topicSelect = document.getElementById('topic-select');
  if (topicSelect) topicSelect.value = state.activeTab;
  syncTopicTabsActive(state.activeTab);

  document.querySelectorAll('#topic-tabs .topic-tab[data-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      if (!VALID_TABS.includes(tabId)) return;
      if (topicSelect) topicSelect.value = tabId;
      syncTopicTabsActive(tabId);
      onTopicChange(tabId);
    });
  });

  if (topicSelect) {
    topicSelect.addEventListener('change', () => {
      const tabId = topicSelect.value;
      syncTopicTabsActive(tabId);
      onTopicChange(tabId);
    });
  }
}

function initializeSearchAndFilters() {
  document.querySelectorAll('#diff-chips .chip[data-diff], #diff-filters .pill[data-diff]').forEach(btn => {
    const diff = btn.dataset.diff;
    if (!diff || diff === 'all') return;
    btn.addEventListener('click', () => {
      state.diffFilter = state.diffFilter === diff ? null : diff;
      syncDiffFilterChipsUI();
      renderList();
    });
  });

  // Initialize tag filter search
  initTagFilterSearch();
}

function initializeMemoryFilters() {
  const onStatusFilterPick = val => {
    state.statusFilter = state.statusFilter === val ? null : val;
    clearFeedSectionPin();
    syncMemoryFilterUI();
    renderList();
  };

  document
    .querySelectorAll(
      '#importance-chips .chip[data-status], #status-chips .chip[data-status], #status-filters .pill[data-status]'
    )
    .forEach(btn => {
      btn.addEventListener('click', () => onStatusFilterPick(btn.dataset.status));
    });

  const sidebarMemoryRange = document.getElementById('sidebar-memory-range');
  if (sidebarMemoryRange) {
    sidebarMemoryRange.addEventListener('input', e => {
      const value = parseInt(e.target.value);
      const statusMap = MEMORY_STATUS_BY_VALUE;
      e.target.setAttribute('value', value);
      onStatusFilterPick(statusMap[value]);
    });
    
    sidebarMemoryRange.addEventListener('dblclick', () => {
      if (state.statusFilter) {
        state.statusFilter = null;
        clearFeedSectionPin();
        syncMemoryFilterUI();
        renderList();
      }
    });
  }

  const detailRange = document.getElementById('detail-memory-range');
  if (detailRange) {
    detailRange.addEventListener('input', e => {
      if (state.selectedId) applyDetailMemoryRange(state.selectedId, e.target.value);
    });
  }

  wireResetMemoryButton();
}

function initializeEventListeners() {
  const cardHidden = document.getElementById('card-hidden-face');
  if (cardHidden) cardHidden.addEventListener('click', revealCard);

  const quizRevealCover = document.getElementById('quiz-reveal-cover');
  if (quizRevealCover) quizRevealCover.addEventListener('click', revealCard);

  const rateHost = document.getElementById('detail-question') || document.getElementById('main-panel') || document.body;
  rateHost.querySelectorAll('[data-rating="know"],[data-rating="shaky"],[data-rating="review"]').forEach(btn => {
    const rating = btn.dataset.rating;
    btn.addEventListener('click', () => {
      if (state.selectedId) setRating(state.selectedId, rating);
    });
  });
}

function initializeKeyboardHandlers() {
  document.addEventListener('keydown', e => {
    if (handleZoomShortcut(e)) return;

    // ⌘⇧F / Ctrl+Shift+F (primary) and ⌘E / Ctrl+E (alias). Both are
    // suppressed while focus is in a text field other than the palette
    // input — ⌘E used to preventDefault unconditionally and ate the
    // browser's/other app's keystroke even inside inputs.
    if (paletteShortcutMatches(e)) {
      if (isShortcutSuppressedTarget(e.target)) return;
      e.preventDefault();
      toggleCmdPalette();
      return;
    }

    if (cmdPaletteOpen) {
      handleCommandPaletteKeyboard(e);
      return;
    }

    if (isShortcutSuppressedTarget(e.target)) return;

    handleMainKeyboardShortcuts(e);
  });
}

function handleCommandPaletteKeyboard(e) {
  const keys = {
    'Escape': () => closeCmdPalette(),
    'Enter': () => {
      if (cmdSuggestCtx) acceptCmdSuggestion();
      else confirmCmdSelection();
    },
    'ArrowDown': () => moveCmdSelection(1),
    'ArrowUp': () => moveCmdSelection(-1),
    'PageDown': () => moveCmdSelection(cmdPageRows()),
    'PageUp': () => moveCmdSelection(-cmdPageRows()),
    'Home': () => setCmdSelection(0),
    'End': () => setCmdSelection(cmdResultsList.length - 1),
  };

  if (keys[e.key]) {
    e.preventDefault();
    keys[e.key]();
    return;
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    if (cmdSuggestCtx) {
      // In suggest mode Tab accepts the highlighted completion instead of
      // walking focus; Shift+Tab is a no-op. Escape still closes the palette.
      if (!e.shiftKey) acceptCmdSuggestion();
      return;
    }
    // Real focus trap: the overlay says aria-modal="true", so Tab must not
    // walk out of the dialog. Committing stays Enter-only — no arrow preview.
    trapCmdFocus(e.shiftKey);
    return;
  }

  const input = document.getElementById('cmd-input');
  if (input && e.target !== input) {
    // Focus can sit on the panel/body (e.g. after a mouse drag); printable
    // keys should still type into the search box.
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      input.focus();
    }
  }
  if (e.target === input) return;

  const blockWhileOpen = ['j', 'k', 'J', 'K', ' ', 'ArrowLeft', 'ArrowRight', '1', '2', '3'];
  if (blockWhileOpen.includes(e.key)) {
    e.preventDefault();
  }
}

function handleMainKeyboardShortcuts(e) {
  // Captured before this handler claims the key: Escape while the diagram modal
  // is open is consumed by its own document listener (which preventDefault()s
  // first), and roadmap mode must not read that as its own. The command palette
  // never gets here — the dispatcher hands it the key first.
  const consumed = e.defaultPrevented;

  const shortcuts = {
    'j': () => navigateList(1),
    'ArrowDown': () => navigateList(1),
    'k': () => navigateList(-1),
    'ArrowUp': () => navigateList(-1),
    ' ': () => revealCard(),
    '1': () => state.selectedId && state.cardRevealed && setRating(state.selectedId, 'know'),
    '2': () => state.selectedId && state.cardRevealed && setRating(state.selectedId, 'shaky'),
    '3': () => state.selectedId && state.cardRevealed && setRating(state.selectedId, 'review'),
    'ArrowLeft': () => historyBack(),
    'ArrowRight': () => historyForward(),
    'Escape': () => {
      // Roadmap mode first: it is a pane mode, so leaving it is the shallower
      // action. Back to whatever question was open.
      if (state.showRoadmap && !consumed) {
        exitRoadmapMode();
        return;
      }
      closeCmdPalette();
    }
  };

  if (shortcuts[e.key]) {
    e.preventDefault();
    shortcuts[e.key]();
  }
}

function initializeUIState() {
  const toggleBtn = document.getElementById('mode-toggle');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn) {
    toggleBtn.classList.toggle('active', !state.learningMode);
    toggleBtn.setAttribute('aria-checked', String(!state.learningMode));
    const modeText = toggleBtn.querySelector('#mode-text, .mode-text');
    if (modeText) {
      modeText.textContent = state.learningMode ? 'Learn' : 'Quiz';
    }
  }
  if (sidebar) sidebar.classList.toggle('learning-mode', state.learningMode);

  // The restored mode has to be reflected on the switch before the first render.
  syncRoadmapToggleUI();

  syncDiffFilterChipsUI();
  syncMemoryFilterUI();
}

function renderApp() {
  renderList();
  renderMainPanel();

  if (state.selectedId) {
    requestAnimationFrame(() => {
      const el = document.querySelector('.q-item.selected');
      if (el) el.scrollIntoView({ block: 'center' });
    });
  }
}

async function init() {
  await initializeApp();

  initializeTopicControls();

  initializeSearchAndFilters();

  initializeMemoryFilters();
  
  initializeEventListeners();
  wireCommandPalette();
  initializeDiagramModal();
  initializeHashRouting();
  initializeRoadmap();

  initializeKeyboardHandlers();

  initializeUIState();
  syncCmdKbdHint();
  renderApp();
  pushURLState();
}

// ── Utility ────────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Resizable Sidebar ──────────────────────────────────────────
function initResize() {
  const handle = document.getElementById('resize-handle');
  const sidebar = document.querySelector('.sidebar');
  if (!handle || !sidebar) return;

  // Restore saved width
  const saved = localStorage.getItem('sidebar-width');
  sidebar.style.width = (saved ?? '600') + 'px';

  let startX, startW;

  handle.addEventListener('mousedown', e => {
    startX = e.clientX;
    startW = sidebar.offsetWidth;
    handle.classList.add('dragging');
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const onMove = e => {
      const dx = e.clientX - startX;
      const newW = Math.min(800, Math.max(500, startW + dx));
      sidebar.style.width = newW + 'px';
    };

    const onUp = () => {
      handle.classList.remove('dragging');
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      localStorage.setItem('sidebar-width', sidebar.offsetWidth);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
}

/**
 * Fetch progress from the server.
 * @returns {Promise<Object>} { ratings, seen } or throws
 */
async function fetchProgressFromServer() {
  try {
    const response = await fetch(`${SERVER_API_BASE}/api/progress`);
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const data = await response.json();
    // Validate data structure
    if (typeof data !== 'object' || !data.ratings || !Array.isArray(data.seen)) {
      throw new Error('Invalid progress data from server');
    }
    // Ensure ratings values are valid
    for (const rating of Object.values(data.ratings)) {
      if (!VALID_RATING_VALUES.has(rating)) {
        throw new Error(`Invalid rating in server data: ${rating}`);
      }
    }
    // Ensure seen items are strings
    for (const id of data.seen) {
      if (typeof id !== 'string') {
        throw new Error(`Invalid seen ID in server data: ${id}`);
      }
    }
    return {
      ratings: data.ratings,
      seen: new Set(data.seen)
    };
  } catch (err) {
    console.warn('Could not fetch progress from server:', err);
    throw err;
  }
}

/**
 * Save progress to the server.
 * @param {Object} progress - { ratings: { [id]: string }, seen: Set<string> }
 * @returns {Promise<void>}
 */
async function saveProgressToServer({ ratings, seen }) {
  try {
    const response = await fetch(`${SERVER_API_BASE}/api/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ratings: ratings,
        seen: Array.from(seen)
      })
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);
  } catch (err) {
    console.error('Failed to save progress to server:', err);
    throw err;
  }
}

/**
 * Import localStorage progress to the server (if server is empty).
 * @returns {Promise<boolean>} true if imported
 */
async function importLocalStorageToServer() {
  try {
    // Load from localStorage
    const rawRatings = localStorage.getItem('interview-ratings');
    const rawSeen = localStorage.getItem('interview-seen');
    if (!rawRatings && !rawSeen) return false; // Nothing to import

    const ratings = rawRatings ? JSON.parse(rawRatings) : {};
    const seenRaw = rawSeen ? JSON.parse(rawSeen) : [];
    const seen = new Set(seenRaw);

    // Validate localStorage data (same as in loadRatings/loadSeen)
    for (const rating of Object.values(ratings)) {
      if (!VALID_RATING_VALUES.has(rating)) {
        throw new Error(`Invalid rating in localStorage: ${rating}`);
      }
    }
    for (const id of seen) {
      if (typeof id !== 'string') {
        throw new Error(`Invalid seen ID in localStorage: ${id}`);
      }
    }

    // Send to server
    const response = await fetch(`${SERVER_API_BASE}/api/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ratings: ratings,
        seen: Array.from(seen)
      })
    });
    if (!response.ok) throw new Error(`Server error: ${response.status}`);

    const result = await response.json();
    if (result.imported) {
      // Clear localStorage after successful import
      localStorage.removeItem('interview-ratings');
      localStorage.removeItem('interview-seen');
    }
    return result.imported;
  } catch (err) {
    console.warn('Could not import localStorage to server:', err);
    return false;
  }
}

/**
 * Clear localStorage progress keys.
 */
function clearLocalStorageProgress() {
  localStorage.removeItem('interview-ratings');
  localStorage.removeItem('interview-seen');
}

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => { await init(); initResize(); });
