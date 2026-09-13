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
const ZOOM_MIN = 0.7;
const ZOOM_MAX = 2.5;
const ZOOM_STEP = 0.1;
const ZOOM_DEFAULT = 1;
const VALID_RATING_VALUES = new Set(['know', 'shaky', 'review']);
const SERVER_API_BASE = '';
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
  aiOnly: false,         // filter feed to AI-generated questions only
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

/** CSS state class for `.memory-dots` and feed `.qcard-memory` (knew | shaky | forgot | unseen | ''). */
function memoryDotStateClassForId(id) {
  if (!id) return '';
  const r = getRating(id);
  if (r === 'know') return 'knew';
  if (r === 'shaky') return 'shaky';
  if (r === 'review') return 'forgot';
  if (!state.seen.has(id)) return 'unseen';
  // Seen but no explicit rating — same slider notch as “Forgot” (see detailMemorySliderValueForId); aria still “Not rated”.
  return 'forgot';
}

/** Short phrase for Accessible Name / status text. */
function memoryStatusPhraseForId(id) {
  if (!id) return '';
  const r = getRating(id);
  if (r === 'know') return 'Knew';
  if (r === 'shaky') return 'Shaky';
  if (r === 'review') return 'Forgot';
  if (!state.seen.has(id)) return 'Unseen';
  return 'Forgot';
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
    // AI-only filter
    if (state.aiOnly && q.source !== 'interview') return false;
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
  const sourceBadge = q.source === 'interview'
    ? '<span class="qcard-source" title="AI-generated / reviewed question" aria-label="AI question">🤖</span>'
    : '';
  const aiDeleteBtn = q.source === 'interview'
    ? `<button class="qcard-ai-delete" aria-label="Hide AI question" title="Hide this AI question" onclick="event.stopPropagation(); hideAIQuestion('${q.id}')">✕</button>`
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
    ${starBadge}${sourceBadge}
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
// section order above. Three row forms:
//   { cols: [a, b] } — two cards sharing one row;
//   { half: key }    — one card in one column, the other stays empty;
//   { full: key }    — a spanning card.
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
    { full: 'answer' },
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
 * Flatten the declared layout into the ordered card list for this question.
 * Each entry is { key, width, rowStart }: width is 'db-half' (one column,
 * what the row's `cols`/`half` form produces) or 'db-full' (spanning), and
 * rowStart marks the FIRST card of every row — emitted even when the row
 * resolves to a single card. T1's two-column CSS anchors .db-row-start back
 * to column 1, so a partial row keeps its hole instead of default
 * grid-auto-flow pulling the next row's first card into it. Rows whose keys
 * are all absent emit nothing — no empty cards, no forced gaps.
 */
function buildDetailRows(q, values) {
  const layout = detailLayoutFor(q.type);
  const has = key => values[key] !== undefined && values[key] !== '';
  const referenced = new Set();
  layout.forEach(row => {
    if (row.cols) row.cols.forEach(k => referenced.add(k));
    else referenced.add(row.half || row.full);
  });

  const rows = [];
  layout.forEach(row => {
    let rowOpened = false;
    if (row.cols) {
      row.cols.forEach(key => {
        if (!has(key)) return;
        rows.push({ key, width: 'db-half', rowStart: !rowOpened });
        rowOpened = true;
      });
    } else if (row.half && has(row.half)) {
      rows.push({ key: row.half, width: 'db-half', rowStart: true });
    } else if (row.full && has(row.full)) {
      rows.push({ key: row.full, width: 'db-full', rowStart: true });
    }
  });

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

    rows.forEach(({ key, width, rowStart }) => {
      const raw = values[key];
      const sec = detailSectionMeta(q.type, key);

      // Collapse follows Learn/Quiz mode and is re-derived on every render —
      // no stored card state is consulted (see purgeCollapsedCardStorage).
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
      detailBody.appendChild(block);

      runMermaidInContainer(body);
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

function toggleAIFilter() {
  state.aiOnly = !state.aiOnly;
  const btn = document.getElementById('ai-filter-btn');
  if (btn) {
    btn.classList.toggle('active', state.aiOnly);
    btn.setAttribute('aria-pressed', state.aiOnly ? 'true' : 'false');
  }
  // Reset section pin so feed recomputes
  state.activeFeedSection = null;
  state.feedSectionPinned = false;
  renderApp();
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

/** Detail range: ordinal 0 unseen … 3 know (aligned with sidebar memory chips). */
function detailMemorySliderValueForId(id) {
  if (!id) return 0;
  if (!state.seen.has(id)) return getSliderValueFromStatus('unseen');
  const r = getRating(id);
  if (r) return getSliderValueFromStatus(r);
  return 1; // seen but not explicitly rated → notch 1 (“Forgot”); ARIA still “Not rated”
}

function detailMemorySliderAriaValuetext(id, sliderValue) {
  if (!id) return 'Unseen';
  if (sliderValue === 0) return 'Unseen';
  if (sliderValue === 1 && state.seen.has(id) && !getRating(id)) return 'Forgot';
  const labels = MEMORY_LABELS;
  return labels[sliderValue] || 'Forgot';
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
const CMD_BOUNDARY_CHARS = /[\s\-_/\\(){}[\],.;:&'"|·…+*^]/;

function cmdIsMacPlatform() {
  const nav = typeof navigator !== 'undefined' ? navigator : null;
  if (!nav) return false;
  return /Mac|iPhone|iPad|iPod/.test(`${nav.platform || ''} ${nav.userAgent || ''}`);
}
const CMD_IS_MAC = cmdIsMacPlatform();

/**
 * VS Code-style fuzzy scorer. Returns { score, positions } or null when the
 * pattern is not a subsequence. Positions index into `text` so callers can
 * wrap the matched characters in <mark class="cmd-mark"> (escape first!).
 * Contiguous-substring hits dominate; otherwise word/separator starts and
 * camelCase humps are rewarded while skipped runs and a late start hurt.
 */
function cmdFuzzyScore(text, pattern) {
  const t = String(text);
  const p = String(pattern);
  if (!t || !p) return null;
  const tl = t.toLowerCase();
  const pl = p.toLowerCase();
  const direct = tl.indexOf(pl);
  if (direct !== -1) {
    const positions = [];
    for (let i = 0; i < pl.length; i++) positions.push(direct + i);
    return { score: 100 + pl.length * 2 - Math.min(direct, 20), positions };
  }
  let pi = 0;
  let prev = -2;
  let first = -1;
  let score = 0;
  const positions = [];
  for (let ti = 0; ti < tl.length && pi < pl.length; ti++) {
    if (tl[ti] !== pl[pi]) continue;
    let s = 9;
    if (ti === 0 || CMD_BOUNDARY_CHARS.test(t[ti - 1])) s += 12;
    else if (ti === prev + 1) s += 8;
    const cur = t.charCodeAt(ti);
    const before = ti > 0 ? t.charCodeAt(ti - 1) : 0;
    if (cur >= 65 && cur <= 90 && !(before >= 65 && before <= 90)) s += 10;
    if (pi > 0 && ti > prev + 1) s -= Math.min(ti - prev - 1, 6);
    score += s;
    positions.push(ti);
    prev = ti;
    if (first < 0) first = ti;
    pi++;
  }
  if (pi < pl.length) return null;
  return { score: Math.max(1, score - Math.min(first, 12)), positions };
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
 */
function cmdSuggestContext(raw, caret) {
  if (!raw || caret < 0 || caret > raw.length) return null;
  const m = /([#@]([^\s#@]*))$/.exec(raw.slice(0, caret));
  if (!m) return null;
  const kind = m[1][0] === '#' ? 'tag' : 'section';
  const partial = m[2].toLowerCase();
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
 * ranked by the same fuzzy scorer, bounded by CMD_RESULT_LIMIT, ordered by
 * usage count when the token is still bare. Already-present operators are
 * excluded so `#cache #c` cannot offer a second `#cache`.
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
  const parsed = parseCmdQuery(String(query).trim());
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
    'Escape': () => closeCmdPalette()
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
