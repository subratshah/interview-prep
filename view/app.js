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

// ── State ──────────────────────────────────────────────────
let questions = [];

const state = {
  activeTab: 'android',
  searchQuery: '',
  diffFilter: null,  // null | 'E' | 'M' | 'H' — null = show all difficulties
  statusFilter: null,    // null | 'star' | 'know' | 'shaky' | 'review' | 'unseen'
  tagFilter: null,       // null | string
  /** Exactly one `{ type, section }` is visible in the feed at a time. */
  activeFeedSection: null, // null | { type: string, section: string }
  /** After sidebar picks a section, keep it even when filters hide all questions here (cleared on filter/search/tab changes). */
  feedSectionPinned: false,
  selectedId: null,
  cardRevealed: false,
  learningMode: true,
  ratings: {},           // { [id]: 'know' | 'shaky' | 'review' }
  seen: new Set(),       // IDs of questions ever opened
  history: [],           // array of question IDs visited
  historyIdx: -1,        // current position in history
};

const VALID_TABS = ['android', 'behavioral', 'data-structures', 'system-design'];

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
  return 'Not rated';
}

/** `#detail-memory-range`: 0 unseen … 3 know (ordinal memory scale). */
const MEMORY_SLIDER_MIN = 0;
const MEMORY_SLIDER_MAX = 3;

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
  const map = { 0: 'unseen', 1: 'review', 2: 'shaky', 3: 'know' };
  return map[v] ?? null;
}

/**
 * Memory-only statuses → slider position. `star` and unknown → null (no slider notch).
 */
function getSliderValueFromStatus(status) {
  if (!status) return null;
  const map = { unseen: 0, review: 1, shaky: 2, know: 3 };
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
    // When searching or tag-filtering, show all types; otherwise filter by active tab
    if (!state.searchQuery && !state.tagFilter && q.type !== state.activeTab) return false;
    if (state.diffFilter && q.difficulty !== state.diffFilter) return false;
    if (state.searchQuery) {
      const lower = state.searchQuery.toLowerCase();
      const numStr = String(q.num);
      const normalised = lower.startsWith('#') ? lower.slice(1) : lower;
      if (!q.title.toLowerCase().includes(lower) &&
          !q.section.toLowerCase().includes(lower) &&
          !(q.tags || []).some(t => t.toLowerCase().includes(lower)) &&
          numStr !== normalised) {
        return false;
      }
    }
    if (state.statusFilter) {
      if (state.statusFilter === 'star') {
        if (!q.star) return false;
      } else if (state.statusFilter === 'unseen') {
        if (state.seen.has(q.id)) return false;
      } else {
        if (getRating(q.id) !== state.statusFilter) return false;
      }
    }
    if (state.tagFilter) {
      if (!(q.tags || []).includes(state.tagFilter)) return false;
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

/** After filters, ensure `activeFeedSection` resolves unless the sidebar pinned an empty-visible section. */
function syncActiveFeedSection(filteredQs) {
  const groups = sortSectionGroups(groupByTopicSection(filteredQs));
  const cur = state.activeFeedSection;

  if (groups.length === 0) {
    state.activeFeedSection = null;
    state.feedSectionPinned = false;
    return;
  }

  const matchesCurrent =
    cur && filteredQs.some(q => q.type === cur.type && q.section === cur.section);

  if (matchesCurrent) {
    if ((state.searchQuery || state.tagFilter) && VALID_TABS.includes(cur.type)) {
      if (state.activeTab !== cur.type) {
        state.activeTab = cur.type;
        const sel = document.getElementById('topic-select');
        if (sel) sel.value = state.activeTab;
        syncTopicTabsActive(state.activeTab);
      }
    }
    return;
  }

  if (state.feedSectionPinned && cur) {
    const preserveEmptyPinned = state.searchQuery || state.tagFilter;
    if (preserveEmptyPinned) {
      if (VALID_TABS.includes(cur.type)) {
        if (state.activeTab !== cur.type) {
          state.activeTab = cur.type;
          const sel = document.getElementById('topic-select');
          if (sel) sel.value = state.activeTab;
          syncTopicTabsActive(state.activeTab);
        }
      }
      return;
    }
    state.feedSectionPinned = false;
  }

  state.activeFeedSection = { type: groups[0].type, section: groups[0].section };
  state.feedSectionPinned = false;

  if ((state.searchQuery || state.tagFilter) && VALID_TABS.includes(state.activeFeedSection.type)) {
    if (state.activeTab !== state.activeFeedSection.type) {
      state.activeTab = state.activeFeedSection.type;
      const sel = document.getElementById('topic-select');
      if (sel) sel.value = state.activeTab;
      syncTopicTabsActive(state.activeTab);
    }
  }
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
      const map = { E: 'Easy', M: 'Medium', H: 'Hard' };
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

  const sidebarQs = state.diffFilter
    ? getFilteredQuestions().filter(q => q.type === state.activeTab)
    : tabQs;

  if (state.diffFilter && sidebarQs.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'sb-list-empty sb-list-empty--filtered';
    empty.setAttribute('role', 'status');
    const map = { E: 'Easy', M: 'Medium', H: 'Hard' };
    const diffLabel = map[state.diffFilter] || state.diffFilter;
    const otherFilters = Boolean(state.statusFilter || state.tagFilter || state.searchQuery);
    empty.textContent = otherFilters
      ? `No questions match this difficulty and your other filters in this topic.`
      : `No ${diffLabel} questions in this topic — every section is hidden for this filter.`;
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

/** Detail header strip: section badge only (memory dots removed per user request). */
function syncDetailMetaMemoryDots(q) {
  const metaEl = document.getElementById('detail-meta');
  if (!metaEl || !q) return;
  metaEl.innerHTML = `<span class="meta-badge meta-sec">${escapeHtml(q.section)}</span>`;
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
      const map = { E: 'Easy', M: 'Medium', H: 'Hard' };
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
      const map = { E: 'Easy', M: 'Medium', H: 'Hard' };
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
const NOTION_SECTIONS = [
  { key: 'answer', icon: '💡', label: 'Expected Answer', defaultOpen: true },
  { key: 'assumptions', icon: '🔍', label: 'Assumptions & Clarifications', defaultOpen: true },
  { key: 'steps', icon: '📋', label: 'Interview Approach', defaultOpen: true },
  { key: 'considerations', icon: '⚠️', label: 'Key Considerations', defaultOpen: true },
  { key: 'tradeoffs', icon: '⚖️', label: 'Trade-offs', defaultOpen: true },
  { key: 'alternatives', icon: '🔀', label: 'Alternative Approaches', defaultOpen: true },
];

const BEHAVIORAL_SECTIONS = [
  { key: 'listen', icon: '👂', label: 'What to listen for', defaultOpen: true },
  { key: 'star', icon: '⭐', label: 'STAR hint', defaultOpen: true },
  { key: 'flags', icon: '🚩', label: 'Red flags', defaultOpen: true },
];

// Parse behavioral question content into sections
function parseBehavioralContent(content) {
  const sections = {
    listen: '',
    star: '',
    flags: ''
  };
  
  // Split content by bold headers
  const parts = content.split(/\*\*(.*?):\*\*/);
  let currentSection = null;
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i].trim();
    
    if (part === 'What to listen for') {
      currentSection = 'listen';
    } else if (part === 'STAR hint') {
      currentSection = 'star';  
    } else if (part === 'Red flags') {
      currentSection = 'flags';
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

function ratingLabelForStatusBar(id) {
  const r = getRating(id);
  if (r === 'know') return 'Knew';
  if (r === 'shaky') return 'Shaky';
  if (r === 'review') return 'Forgot';
  if (id && !state.seen.has(id)) return 'Unseen';
  return '—';
}

function runMermaidInContainer(container) {
  if (typeof mermaid === 'undefined' || !container) return;
  container.querySelectorAll('pre code.language-mermaid').forEach(async (block, i) => {
    const source = block.textContent.trim();
    const wrap = document.createElement('div');
    wrap.className = 'mermaid-container';
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
    renderStatusBar();
    return;
  }

  const q = getQuestionById(state.selectedId);
  if (!q) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (questionView) questionView.classList.add('hidden');
    renderStatusBar();
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
    const diffMap = { E: 'Easy', M: 'Medium', H: 'Hard' };
    diffBadge.textContent = diffMap[q.difficulty] || q.difficulty;
  }
  const qvStar = document.getElementById('qv-star');
  if (qvStar) qvStar.textContent = q.star ? '⭐' : '';

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = q.title;

  const detailBody = document.getElementById('detail-body');
  if (detailBody) {
    detailBody.innerHTML = '';
    
    // Check if this is a behavioral question and needs special parsing
    const isBehavioral = q.type === 'behavioral';
    const sections = isBehavioral ? BEHAVIORAL_SECTIONS : NOTION_SECTIONS;
    const contentData = isBehavioral ? parseBehavioralContent(q.answer || '') : q;
    
    sections.forEach(sec => {
      const raw = isBehavioral ? contentData[sec.key] : q[sec.key];
      if (!raw) return;

      const storageKey = `notion-collapsed::${q.id}::${sec.key}`;
      const stored = localStorage.getItem(storageKey);
      const isCollapsed = stored === null ? !sec.defaultOpen : stored === '1';

      const block = document.createElement('div');
      block.className = 'notion-block' + (isCollapsed ? ' collapsed' : '');
      block.dataset.notionKey = sec.key;

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
        block.classList.toggle('collapsed');
        const collapsed = block.classList.contains('collapsed');
        localStorage.setItem(storageKey, collapsed ? '1' : '0');
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
      chip.className = 'tag-chip bb-tag' + (state.tagFilter === tag ? ' active' : '');
      chip.textContent = tag;
      chip.addEventListener('click', () => filterByTag(tag));
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
  syncDetailMetaMemoryDots(q);

  const quizCover = document.getElementById('quiz-reveal-cover');
  const bottomBarEl = document.getElementById('bottom-bar');
  const quizCovered = Boolean(q && !state.learningMode && !state.cardRevealed);
  if (detailBody) detailBody.classList.toggle('quiz-covered', quizCovered);
  if (bottomBarEl) bottomBarEl.classList.toggle('quiz-covered', quizCovered);
  if (quizCover) quizCover.classList.toggle('hidden', !quizCovered);

  renderStatusBar();
}

function renderStatusBar() {
  const siTopic = document.getElementById('si-topic');
  const siSection = document.getElementById('si-section');
  const siProgress = document.getElementById('si-progress');

  if (siTopic) {
    siTopic.textContent = TOPIC_LABELS[state.activeTab] || state.activeTab;
  }

  const tabQs = questions.filter(q => q.type === state.activeTab);
  const seenCount = tabQs.filter(q => state.seen.has(q.id)).length;
  const total = tabQs.length;
  if (siProgress) {
    siProgress.textContent = total ? `${seenCount} / ${total} seen` : '0 / 0 seen';
  }

  const q = state.selectedId ? getQuestionById(state.selectedId) : null;
  if (siSection) {
    siSection.textContent = q ? q.section : '—';
  }
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
  const btn = document.getElementById('toggle-switch');
  const sidebar = document.querySelector('.sidebar');
  if (btn) btn.classList.toggle('on', !state.learningMode);
  if (sidebar) sidebar.classList.toggle('learning-mode', state.learningMode);

  if (state.selectedId) {
    state.cardRevealed = state.learningMode;
    renderMainPanel();
  }
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
  if (q) syncDetailMetaMemoryDots(q);
  renderStatusBar();
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
  if (sliderValue === 1 && state.seen.has(id) && !getRating(id)) return 'Not rated';
  const labels = ['Unseen', 'Forgot', 'Shaky', 'Knew'];
  return labels[sliderValue] || 'Not rated';
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

// ── Tag filter ─────────────────────────────────────────────────
function filterByTag(tag) {
  if (state.tagFilter === tag) {
    state.tagFilter = null;
  } else {
    state.tagFilter = tag;
  }
  clearFeedSectionPin();
  updateTagFilterBar();
  renderList();
  renderMainPanel(); // refresh detail panel and filter UI
}

function updateTagFilterBar() {
  const bar = document.getElementById('tag-filter-bar');
  const chipLabel = document.getElementById('tag-filter-chip-label');
  if (state.tagFilter) {
    bar.classList.remove('hidden');
    chipLabel.textContent = state.tagFilter;
  } else {
    bar.classList.add('hidden');
  }
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
  history.replaceState(null, '', '?' + params.toString());
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

// ── Search toggle ──────────────────────────────────────────────
function toggleSearch() {
  const expand = document.getElementById('search-expand');
  const iconBtn = document.getElementById('search-icon-btn');
  const input = document.getElementById('search-input');
  if (!expand || !iconBtn) {
    if (input) input.focus();
    return;
  }
  if (expand.classList.contains('open')) {
    closeSearch();
  } else {
    expand.classList.add('open');
    iconBtn.classList.add('active');
    setTimeout(() => input && input.focus(), 50);
  }
}

function closeSearch() {
  const expand = document.getElementById('search-expand');
  const iconBtn = document.getElementById('search-icon-btn');
  const input = document.getElementById('search-input');
  if (expand) expand.classList.remove('open');
  if (iconBtn) iconBtn.classList.remove('active');
  if (input) input.value = '';
  state.searchQuery = '';
  clearFeedSectionPin();
  renderList();
}

// ── Command palette (⌘E) ─────────────────────────────────────
let cmdPaletteOpen = false;
let cmdResultsList = [];
let cmdSelectedIdx = 0;

function questionSearchBlob(q) {
  const tags = (q.tags || []).join(' ');
  return `${q.title} ${q.section} ${tags} ${q.num} ${q.type} ${q.id}`;
}

function fuzzyMatchScore(haystack, query) {
  if (!query) return 1;
  const h = haystack.toLowerCase();
  const q = query.toLowerCase().trim();
  if (!q) return 1;
  if (h.includes(q)) return 100 + q.length;
  let qi = 0;
  let score = 0;
  let run = 0;
  for (let i = 0; i < h.length && qi < q.length; i++) {
    if (h[i] === q[qi]) {
      run++;
      score += run * 2;
      qi++;
    } else {
      run = 0;
    }
  }
  return qi === q.length ? score : 0;
}

function getCmdPaletteMatches(query) {
  const src = questions.length ? questions : QuestionDB.all();
  const trimmed = query.trim();
  if (!trimmed) {
    const sortedAll = [...src].sort((a, b) => {
      const t = String(a.type).localeCompare(String(b.type));
      if (t !== 0) return t;
      const s = String(a.section).localeCompare(String(b.section));
      if (s !== 0) return s;
      return compareQuestionsImportanceDifficulty(a, b);
    });
    return sortedAll.slice(0, 100);
  }
  return src
    .map(x => ({ q: x, score: fuzzyMatchScore(questionSearchBlob(x), trimmed) }))
    .filter(x => x.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        compareQuestionsImportanceDifficulty(a.q, b.q)
    )
    .map(x => x.q)
    .slice(0, 80);
}

function renderCmdResults() {
  const container = document.getElementById('cmd-results');
  if (!container) return;
  container.innerHTML = '';
  if (cmdResultsList.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'cmd-result-empty';
    empty.textContent = 'No matching questions.';
    container.appendChild(empty);
    return;
  }
  cmdResultsList.forEach((q, i) => {
    // Create the feed card component
    const card = createFeedQuestionCard(q);
    
    // Add command palette specific classes and attributes
    card.classList.add('cmd-result-item');
    if (i === cmdSelectedIdx) {
      card.classList.add('selected');
    }
    card.setAttribute('role', 'option');
    card.setAttribute('aria-selected', String(i === cmdSelectedIdx));
    
    // Add event handlers for command palette behavior
    card.addEventListener('mousedown', e => e.preventDefault());
    card.addEventListener('click', () => {
      cmdSelectedIdx = i;
      confirmCmdSelection();
    });
    container.appendChild(card);
  });
  const sel = container.querySelector('.cmd-result-item.selected');
  if (sel) sel.scrollIntoView({ block: 'nearest' });
}

function filterCmdPalette(query) {
  cmdResultsList = getCmdPaletteMatches(query);
  cmdSelectedIdx = 0;
  renderCmdResults();
}

function moveCmdSelection(delta) {
  if (cmdResultsList.length === 0) return;
  cmdSelectedIdx = (cmdSelectedIdx + delta + cmdResultsList.length) % cmdResultsList.length;
  renderCmdResults();
}

function closeCmdPalette() {
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  if (overlay) {
    overlay.classList.add('hidden');
    overlay.setAttribute('aria-hidden', 'true');
  }
  if (input) {
    input.value = '';
    input.blur();
  }
  cmdPaletteOpen = false;
  cmdResultsList = [];
  cmdSelectedIdx = 0;
  const container = document.getElementById('cmd-results');
  if (container) container.innerHTML = '';
}

function openCmdPalette() {
  const overlay = document.getElementById('cmd-overlay');
  const input = document.getElementById('cmd-input');
  if (!overlay || !input) return;
  cmdPaletteOpen = true;
  overlay.classList.remove('hidden');
  overlay.setAttribute('aria-hidden', 'false');
  cmdSelectedIdx = 0;
  filterCmdPalette('');
  requestAnimationFrame(() => {
    input.focus();
    input.select();
  });
}

function toggleCmdPalette() {
  if (cmdPaletteOpen) closeCmdPalette();
  else openCmdPalette();
}

function confirmCmdSelection() {
  if (!cmdPaletteOpen || cmdResultsList.length === 0) return;
  const q = cmdResultsList[cmdSelectedIdx];
  if (!q) return;
  closeCmdPalette();
  selectQuestion(q.id);
}

function wireCommandPalette() {
  const input = document.getElementById('cmd-input');
  const backdrop = document.querySelector('#cmd-overlay .cmd-backdrop');
  if (input) {
    input.addEventListener('input', e => filterCmdPalette(e.target.value));
  }
  if (backdrop) {
    backdrop.addEventListener('click', () => closeCmdPalette());
  }
}

const VALID_RATING_VALUES = new Set(['know', 'shaky', 'review']);

function exportProgressJson() {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    ratings: { ...state.ratings },
    seen: [...state.seen],
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const day = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `interview-prep-memory-${day}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  flashSaved();
}

/**
 * Merge imported `ratings` and `seen` into current state (incoming keys override for ratings).
 * Accepts either our export shape or a minimal `{ ratings, seen }` object.
 */
function mergeImportedProgress(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: expected an object');
  }
  if (data.ratings != null && typeof data.ratings !== 'object') {
    throw new Error('Invalid ratings');
  }
  if (data.seen != null && !Array.isArray(data.seen)) {
    throw new Error('Invalid seen list');
  }

  if (data.ratings) {
    const next = { ...state.ratings };
    for (const [id, val] of Object.entries(data.ratings)) {
      if (val == null || val === '') {
        delete next[id];
        continue;
      }
      if (VALID_RATING_VALUES.has(val)) {
        next[id] = val;
      }
    }
    state.ratings = next;
  }

  if (data.seen) {
    const nextSeen = new Set(state.seen);
    data.seen.forEach(id => {
      if (id != null && id !== '') nextSeen.add(String(id));
    });
    state.seen = nextSeen;
  }

  saveRatings();
  saveSeen();
}

function wireExportImport() {
  const exportBtn = document.getElementById('si-export');
  const importBtn = document.getElementById('si-import');
  const importInput = document.getElementById('import-input');

  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportProgressJson());
  }

  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
  }

  if (importInput) {
    importInput.addEventListener('change', e => {
      const file = e.target.files && e.target.files[0];
      e.target.value = '';
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = String(reader.result || '');
          const data = JSON.parse(text);
          mergeImportedProgress(data);
          flashSaved();
          syncMemoryFilterUI();
          renderList();
          renderMainPanel();
          pushURLState();
        } catch (err) {
          console.error(err);
          window.alert('Could not import this file. Use a JSON export from Interview Prep, or a file with "ratings" and "seen" fields.');
        }
      };
      reader.onerror = () => {
        window.alert('Could not read the selected file.');
      };
      reader.readAsText(file);
    });
  }
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
  
  const labels = ['Unseen', 'Forgot', 'Shaky', 'Knew'];
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
      renderStatusBar();
      
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

function init() {
  if (typeof mermaid !== 'undefined') {
    mermaid.initialize({ startOnLoad: false, theme: 'dark' });
  }

  questions = QuestionDB.all();

  loadRatings();
  loadSeen();

  // Restore state from URL (?tab=android&q=tech-1)
  const _urlParams = new URLSearchParams(window.location.search);
  const _urlTab = _urlParams.get('tab');
  const _urlQ = _urlParams.get('q');
  if (_urlTab && VALID_TABS.includes(_urlTab)) state.activeTab = _urlTab;
  if (_urlQ && questions.find(q => q.id === _urlQ)) {
    state.selectedId = _urlQ;
    state.cardRevealed = state.learningMode;
    const qFromUrl = getQuestionById(_urlQ);
    if (qFromUrl && VALID_TABS.includes(qFromUrl.type)) {
      state.activeTab = qFromUrl.type;
      state.activeFeedSection = { type: qFromUrl.type, section: qFromUrl.section };
      clearFeedSectionPin();
    }
  }

  // Topic: tabs (redesign) and/or legacy dropdown
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

  // Search
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', e => {
      state.searchQuery = e.target.value.trim();
      clearFeedSectionPin();
      renderList();
    });
  }

  // Difficulty filter — single-select chips/pills (toggle off = show all)
  document.querySelectorAll('#diff-chips .chip[data-diff], #diff-filters .pill[data-diff]').forEach(btn => {
    const diff = btn.dataset.diff;
    if (!diff || diff === 'all') return;
    btn.addEventListener('click', () => {
      if (state.diffFilter === diff) {
        state.diffFilter = null;
      } else {
        state.diffFilter = diff;
      }
      syncDiffFilterChipsUI();
      renderList();
    });
  });

  // Memory / importance: star + memory chips (and legacy pill markup if present)
  const onStatusFilterPick = val => {
    if (state.statusFilter === val) {
      state.statusFilter = null;
    } else {
      state.statusFilter = val;
    }
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

  // Sidebar memory range slider
  const sidebarMemoryRange = document.getElementById('sidebar-memory-range');
  if (sidebarMemoryRange) {
    let lastClickTime = 0;
    let lastValue = null;
    
    sidebarMemoryRange.addEventListener('input', e => {
      const value = parseInt(e.target.value);
      let newStatus = null;
      
      // Map range values to status filters: 0=unseen, 1=review, 2=shaky, 3=know
      if (value === 0) newStatus = 'unseen';
      else if (value === 1) newStatus = 'review';
      else if (value === 2) newStatus = 'shaky';
      else if (value === 3) newStatus = 'know';
      
      // Update the range value attribute for CSS highlighting
      e.target.setAttribute('value', value);
      
      onStatusFilterPick(newStatus);
    });
    
    // Double-click to clear filter
    sidebarMemoryRange.addEventListener('dblclick', e => {
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

  // Wire reset memory button
  wireResetMemoryButton();
  

  const tagFilterClear = document.getElementById('tag-filter-clear');
  if (tagFilterClear) {
    tagFilterClear.addEventListener('click', () => {
      state.tagFilter = null;
      clearFeedSectionPin();
      updateTagFilterBar();
      renderList();
      renderMainPanel();
    });
  }

  const cardHidden = document.getElementById('card-hidden-face');
  if (cardHidden) cardHidden.addEventListener('click', revealCard);

  const quizRevealCover = document.getElementById('quiz-reveal-cover');
  if (quizRevealCover) quizRevealCover.addEventListener('click', revealCard);

  const rateHost = document.getElementById('detail-question') || document.getElementById('main-panel') || document.body;
  rateHost.querySelectorAll('[data-rating="know"],[data-rating="shaky"],[data-rating="review"]').forEach(btn => {
    const r = btn.dataset.rating;
    btn.addEventListener('click', () => {
      if (state.selectedId) setRating(state.selectedId, r);
    });
  });

  wireCommandPalette();
  wireExportImport();

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      toggleCmdPalette();
      return;
    }

    if (cmdPaletteOpen) {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeCmdPalette();
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        moveCmdSelection(1);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        moveCmdSelection(-1);
        return;
      }
      if (e.key === 'Enter') {
        e.preventDefault();
        confirmCmdSelection();
        return;
      }
      if (e.target === document.getElementById('cmd-input')) return;
      const blockWhileOpen = ['j', 'k', 'J', 'K', ' ', 'ArrowLeft', 'ArrowRight', '1', '2', '3'];
      if (blockWhileOpen.includes(e.key)) {
        e.preventDefault();
      }
      return;
    }

    if (isShortcutSuppressedTarget(e.target)) return;

    switch (e.key) {
      case 'j':
      case 'ArrowDown':
        e.preventDefault();
        navigateList(1);
        break;
      case 'k':
      case 'ArrowUp':
        e.preventDefault();
        navigateList(-1);
        break;
      case ' ':
        e.preventDefault();
        revealCard();
        break;
      case '1':
        if (state.selectedId && state.cardRevealed) setRating(state.selectedId, 'know');
        break;
      case '2':
        if (state.selectedId && state.cardRevealed) setRating(state.selectedId, 'shaky');
        break;
      case '3':
        if (state.selectedId && state.cardRevealed) setRating(state.selectedId, 'review');
        break;
      case 'ArrowLeft':
        e.preventDefault();
        historyBack();
        break;
      case 'ArrowRight':
        e.preventDefault();
        historyForward();
        break;
      case 'Escape':
        closeSearch();
        closeCmdPalette();
        break;
      default:
        break;
    }
  });

  const toggleBtn = document.getElementById('toggle-switch');
  const sidebar = document.querySelector('.sidebar');
  if (toggleBtn) toggleBtn.classList.toggle('on', !state.learningMode);
  if (sidebar) sidebar.classList.toggle('learning-mode', state.learningMode);

  syncDiffFilterChipsUI();
  syncMemoryFilterUI();

  renderList();
  renderMainPanel();

  if (state.selectedId) {
    requestAnimationFrame(() => {
      const el = document.querySelector('.q-item.selected');
      if (el) el.scrollIntoView({ block: 'center' });
    });
  }

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

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => { init(); initResize(); });
