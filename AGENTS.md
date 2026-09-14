# Interview Prep — Agent Guidance

## Project Overview

A vanilla JavaScript single-page application for interview preparation: 408 curated questions
across Android (154), Behaviour (74), Data Structures (68) and System Design (112), with Learn/Quiz
modes, a section-derived roadmap pane, progress tracking (local SQLite API with a localStorage
fallback), and a command palette that searches every question and every rendered answer card.

## Quick Start

```bash
# Serve locally (the app itself has no build step)
./start-server.sh           # PORT env var overrides the default 1000
# or: node server/proxy-server.js
# Windows: launch.bat       (sets PORT=1000 and opens the page)
```

Then open `http://localhost:1000`. `start-server.sh` execs `server/proxy-server.js`, which serves
the repo root statically on **1000** and spawns `server/server.js` — the progress API on **1001**,
built on `node:sqlite`, so it needs **Node ≥ 22**. Both bind every interface, so the script also
prints a `http://<lan-ip>:1000` URL for other devices (allow the `node` binary through the OS
firewall, not Python). Any plain static server works too (`python -m http.server 1000`,
`npx serve`): with no API answering, the app keeps progress in localStorage instead.

## File Structure

```
├── index.html              # Entry point (generated: template + components)
├── index.template.html     # Template: `<!-- @include … -->` markers + <script> tags
├── start-server.sh         # Static + API server starter (default port 1000)
├── launch.bat              # Same starter for Windows
├── AGENTS.md               # This file
├── .gitignore              # `.*/ ` + `.agents/` — dot-directories are not tracked
├── .agents/                # Local agent scratch; gitignored and never loaded by the app
├── .vscode/                # launch.json + tasks.json (tracked despite the ignore rule)
├── components/             # HTML partials composed into index.html
│   ├── README.md
│   ├── command-palette.html
│   ├── detail-panel.html
│   ├── diagram-modal.html
│   ├── feed.html
│   ├── sidebar.html
│   └── topbar.html
├── data/                   # Question databases (one <script> per topic)
│   ├── android.js          #   154 tech-* (ids run to tech-155; tech-21 is absent)
│   ├── behavioral.js       #   74 behav-*
│   ├── data-structures.js  #   68 ds-*
│   ├── system-design.js    #   112 sd-*
│   └── roadmaps.js         #   RoadmapDB: band ORDER per topic; membership derived
├── scripts/
│   └── compose-html.mjs    # Composes index.html from components (--check = staleness gate)
├── server/
│   ├── proxy-server.js     # Static on 1000; spawns and forwards /api to 1001
│   ├── server.js           # Zero-dependency node:sqlite progress API on 1001
│   └── package.json        # interview-prep-server, engines.node >= 22
├── skills/mock-interview/  # Agent skill: SKILL.md + reference/progress-api.md, roadmap.md
└── view/
    ├── app.js              # Main application logic (detail layout: see Architecture Notes)
    ├── style.css           # All styles (rem lengths; see Code Style)
    └── theme-init.js       # Pre-paint theme + zoom ladder, loaded by index.template.html
```

There is no `.claude/`, `.cursor/` or `.codex/` in this checkout and no `view/cmd-launch-init.js` —
palette keys are handled inside `view/app.js`. Ignore the `.claude/handoff.md` reference in an
`app.js` comment; nothing at that path is tracked or present.

## Key Conventions

- **No build step** — pure vanilla JS, CSS, HTML served statically; `scripts/compose-html.mjs` is
  the only generator, and it only regenerates `index.html`
- **Question data** lives in `/data/*.js`, each calling `QuestionDB.register('topic', [...])`
- **New questions** go in the appropriate `/data/*.js` file following the schema below
- **New data files** need a `<script>` tag in `index.template.html` *after* `view/app.js` (which
  defines the registry) and *before* `data/roadmaps.js` (which reads the registry), then a compose
- **UI components** are HTML partials in `/components/` composed into `index.html` by `scripts/compose-html.mjs`
- **Main logic** in `/view/app.js` — modular IIFE pattern with `QuestionDB` / `RoadmapDB` namespaces

## Question Data Schema

Common fields on every question object in `data/*.js`:

```javascript
{
  id: "tech-1",           // unique identifier (tech-N / ds-N / behav-N / sd-N)
  type: "android",        // register() overwrites whatever you write with the topic key
  num: 1,                 // display number — equals the id suffix (every existing row obeys this)
  difficulty: "E",        // "E" | "M" | "H" — also the roadmap cell hue
  star: true,             // boolean — important/featured (2px cell border)
  section: "Kotlin",      // section name: feed scoping, sidebar rows AND roadmap matrix rows
  title: "What is...",    // question text
  tags: ["kotlin", "basics"], // array of strings
  related: ["tech-2", "tech-5"], // array of related question IDs
}
```

Topic-specific content fields (all markdown; the renderer omits a card whose key the question does
not fill):

**Technical** (`android.js`, `data-structures.js` → `TECH_SECTIONS`):

```javascript
{
  keyPoints: "- ...",        // the full detail — 🔑 Key Points card
  answer: "- ...",           // short summary of it — 💡 "Expected Answer" card
  complexity: "- Access: O(1)...", // big-O notes: 68/68 in data-structures, 0/154 in android
  followUp: "**Follow-up:** ...\n> ...", // optional — 🧵 (190/222 filled: android 133, data-structures 57)
  redFlags: "- ...",         // 🚩 (222/222 filled)
}
```

All 222 technical questions carry **both** `answer` and `keyPoints`: `keyPoints` holds the detail
(on average ~1.8× the length of `answer`, code blocks included), `answer` holds a summary of at
most 3 bullet lines — no question exceeds 3 today. Note the label inversion: the card headed
💡 **Expected Answer** shows the short `answer`, and 🔑 **Key Points** shows the long body. That is
also why `DETAIL_LAYOUT` packs `answer` and `keyPoints` into one band on android (no `complexity`
to pair `keyPoints` with) while data-structures gives `answer` its own full-width row.

Do not reintroduce `expectedAnswer` as a body field: it appears in **0** of the 222 technical
questions and **0** of the 74 behavioural ones. What is left of it is plumbing only — the
`fallback: 'expectedAnswer'` on the `answer` entry of `TECH_SECTIONS` and the
`q.answer || q.expectedAnswer` in `collectDetailValues`. Keep those guards, and write new
questions as `answer` + `keyPoints`.

**Behavioral** (`behavioral.js` → `BEHAVIORAL_SECTIONS`):

```javascript
{
  listenFor: "- ...",        // 👂 interviewer signal list (74/74)
  starGuide: "- ...",        // ⭐ STAR framing hint (74/74)
  redFlags: "- ...",         // 🚩 (74/74)
}
```

**System Design** (`system-design.js` → `SD_SECTIONS`, Codemia-aligned 11 fields):

```javascript
{
  scope: "**Clarifying Questions**\n...", // one blob → two cards (see below)
  functional: "- ...",       // functional requirements
  nfr: "- ...",              // non-functional requirements
  capacity: "- ...",         // optional — back-of-envelope numbers (7/112: sd-75, sd-98, sd-99, sd-103, sd-106, sd-108, sd-111)
  architecture: "...",       // mermaid diagram + pipeline
  dataModel: "| Entity | ...", // optional — table (1/112: `sd-75`)
  api: "...",                // optional — endpoints (1/112: `sd-75`)
  tradeoffs: "| Decision |...", // table + "### Alternatives"
  approach: "**How to Structure the 45 Min**\n...",
  followUp: "**Follow-up:** ...\n> ...", // 🧵 Follow-ups
  pitfalls: "- ...",
}
```

`capacity` / `dataModel` / `api` are optional in the strict sense that the renderer omits an absent
field: exactly one of the 112 system-design questions (`sd-75`) fills all three today (seven carry
`capacity` alone), and the other eight fields are filled on 112/112 — so adding them is per-question authoring, not a rendering
requirement. `scope` is one blob that becomes two cards sharing the first row — **Clarifying
Questions** (❓) and **Assumptions** (❗) — split by `SCOPE_ASSUMPTIONS_HEADING` on a bold
`**Declared assumptions:**`-style marker anywhere in it (the wording, case and trailing colon vary,
and it may sit inline with its first bullet); all 112 blobs carry a marker today, so the standalone
🎯 `scope` card is a live code path with no data behind it. Follow-ups are 🧵 — ❓ belongs to
Clarifying Questions now.

## Code Style

- No linter/formatter configured currently
- 2-space indentation, single quotes, trailing commas where valid
- If adding Prettier/ESLint, configure in this repo root
- **`view/style.css` lengths are `rem`, not `px`** — `html { font-size: calc(18px * var(--z)) }`
  is the single dial that scales the whole UI. The sheet was written against a 16px
  reference, so a value of `Npx` becomes `N/16` rem (e.g. 24px → `1.5rem`). New rules must
  follow that: anything larger than 2px is rem. The exceptions are deliberate: 1–2px
  hairlines (borders, sun-ray dots, scrollbars) stay `px`, and `@media` thresholds stay
  `px` so they keep meaning "window CSS pixels" and react to browser zoom.
- Percentages of the window use `vw`/`vh` (the search pill, the palette, the collapse
  thresholds); never a `100vh`-tall shell — panels fill `height: 100%` and scroll per column.
- **Never make a percentage a `clamp()` minimum, or a grid/flex item's own track size** — the
  percentage resolves against the box the declaration is sizing, so the cycle collapses. Fixed rem
  tracks are the fix (`.rm-cells` is a nowrap flex run of `--rm-cell` squares with `flex: none` on
  each cell — without that one declaration a 34-cell row silently shrinks every cell to ~14px while
  the token still *says* 22px on the line above), and the search pill's `clamp()` floors at `11rem`.
  The sibling mistake is a rem value converted from the wrong base:
  `.empty-desc` at `2rem` wrapped one word per line until it became `20rem`.

## Testing

No test infrastructure exists currently. All verification is manual via browser, plus two cheap
gates that need no server: `node --check view/app.js` / `node --check data/<topic>.js` for syntax,
and `node scripts/compose-html.mjs --check`, which exits 1 when `index.html` no longer matches the
template plus components.

## Adding New Questions

1. Open the appropriate file in `/data/` (e.g., `android.js`)
2. Add a new object to the array passed to `QuestionDB.register()`
3. Follow the schema above — unique `id` (next unused suffix for the topic) and `num` equal to that suffix
4. Check the `section` value: it *is* the roadmap matrix row. A section missing from `SECTION_ORDER`
   in `data/roadmaps.js` still reaches the path — `build()` appends it in data order — so the only
   cost is its position. Add the name there to place the row deliberately, and never hand-list
   question ids anywhere: the derived id map this replaced covered 47 of the 146 Android ids that existed then and put
   `sd-14` in two rows
5. Run `node scripts/compose-html.mjs` if you also modified components
6. Refresh browser to verify

## Modifying UI Components

1. Edit the relevant `.html` file in `/components/`
2. Run `node scripts/compose-html.mjs` to rebuild `index.html`
3. Run `node scripts/compose-html.mjs --check` to prove it, then refresh browser

## Architecture Notes

- **SPA with hash routing** — two accepted forms: `#<questionId>` (e.g. `#sd-75`) and the
  canonical `#tab=<topic>&q=<questionId>` written by `pushURLState`. `restoreStateFromURL` parses
  both (the short form only when the id matches a real question); `initializeHashRouting` adds a
  `hashchange` listener so a link pasted into an already-open tab re-renders. A bare `#<topic>` is
  not a form. The outgoing write uses `history.replaceState`, which never fires `hashchange`, so
  URL writes cannot re-trigger routing.
- **Progress has two stores** — `saveRatings` / `saveSeen` write localStorage and then mirror the
  whole set to `PUT /api/progress` on `SERVER_API_BASE` fire-and-forget (`.catch(() => {})`), while
  load prefers the API and only reads localStorage when that fails
  (`loadProgressWithServerFallback`, called from `initializeApp`, with a one-time
  `POST /api/import` of whatever localStorage held). Other keys stay localStorage-only:
  `interview-theme`, `interview-ui-zoom` (`interview-ui-zoom-v2` marks that the old forced
  `zoom: 1.5` was retired once), `interview-roadmap-mode`, `interview-hidden`, plus the unprefixed
  `sidebar-width` drag. **Learn/Quiz mode is not persisted at all** — `state.learningMode` starts
  `true` on every load, so a "restore the mode" key would be new behaviour, not a bug fix. The
  endpoint contract is in `skills/mock-interview/reference/progress-api.md`. The client talks to the
  API **same-origin** — `SERVER_API_BASE = window.location.origin` and `proxy-server.js` forwards
  `/api/*` to 1001, so any port or LAN IP works with no preflight. `server/server.js` additionally
  echoes `Access-Control-Allow-Origin` for `localhost`/`127.0.0.1` requesters and answers `OPTIONS`,
  which is what lets a *direct* call to 1001 (bypassing the proxy) work too. If progress "does not
  save", check the proxy is up before blaming the storage code.
- **Two independent size mechanisms** — browser zoom (⌘/Ctrl +−0) re-flows the layout and is
  never intercepted by the app; the in-app ladder (bare `+`/`-`/`0`, 70–250%) only moves
  `--z`. Do not add a CSS `zoom`/`transform: scale` on a root element: it multiplies `100vh`
  past the window and hides the real viewport from `@media`.
- **Topbar** — three zones (`topbar-left/center/right`), the search pill is pinned to the
  window centre, and `@container topbar` stages (68/63/58/42/30/26rem) drop decorative words
  in the tight band instead of letting the groups collide. Topic tab labels never shorten;
  the strip pans. The right-hand zone holds four controls: the roadmap switch, Learn/Quiz,
  theme and RESET — all three toggles are `role="switch"` with `aria-checked`, never a class-only state.
- **Markdown rendering** — marked.js for answers, Mermaid for diagrams (mermaid is configured
  in `runMermaidInContainer` with the live root font size so diagrams track the ladder)
- **Detail pane layout is declared, not inferred** — `DETAIL_LAYOUT` in `view/app.js` lists the
  ordered rows per topic in four forms: `{ cols: [a, b] }` (two cards share a row), `{ half: k }`
  (one card; the row's other column stays empty), `{ full: k }` (a spanning card), and
  `{ pack: k }` (one card that joins packing). `buildDetailRows` flattens that into cards carrying
  `db-half` / `db-full` / `db-band`, with `db-row-start` on the first card of every row: two or more
  *consecutive* one-card rows (a `cols` row whose partner is absent, or a `pack` row) collapse into
  one `.db-band` — a single grid item whose inner grid is filled column-first, so lone cards stack
  beside each other instead of each owning a hole-ridden row. A lone `{ half }` is a chosen empty
  column and breaks a run; a run of one stays a plain half row. `.detail-inner` is the named
  inline-size container `detail`; two columns engage at `min-width: 35rem` of *that* container,
  otherwise one column. Put span decisions in `DETAIL_LAYOUT` — the previous content-type inference
  (`:has(table)` / `:has(pre)` / `:has(.mermaid)`) was removed because it mispredicted: the renderer
  replaces the mermaid `<pre>` with `.mermaid-container`, and code blocks and tables are not
  reliably detectable from markup. Keep `.detail-body` on `grid-auto-flow: row`: `dense` re-pairs
  declared rows (measured: `keyPoints` landing beside `followUp`). A data key the layout omits still
  renders, as its own full-width row — dropping content was the original clipping bug.
- **Never give a detail card a height** — `.notion-block { overflow: hidden }` (needed for its
  rounded corners) zeroes a grid item's automatic minimum size, so if the answer column ever gets a
  definite height again every implicit row collapses to its header bar and the content becomes
  unreachable with **no scrollbar**. `grid-auto-rows: max-content` on `.detail-body` (and on
  `.db-band`) is what prevents it. Same trap one level down: `overflow-x: auto` on
  `.notion-block-body` is safe only while that box has no `height`, `max-height` or `overflow-y`.
- **Sections follow Learn/Quiz** — all answer sections render expanded in Learn mode and collapsed
  in Quiz mode, re-derived on every render (`isCollapsed = !state.learningMode`) with no stored
  card state; `purgeCollapsedCardStorage` deletes the old `notion-collapsed::*` LocalStorage keys
  once at startup. The `defaultOpen` flags in `TECH_SECTIONS` / `BEHAVIORAL_SECTIONS` /
  `SD_SECTIONS` are dead metadata — read them as documentation of intent, never as behaviour.
- **Empty detail pane** — with no question selected `renderMainPanel` shows `#detail-empty`
  (`components/detail-panel.html`): a centred column of 📋, the "Select a question" title, a
  `.empty-desc` hint and the `↑/↓ · Space · 1/2/3` chip row. It is a sibling of both
  `.detail-inner` views, and roadmap mode hides it along with `#detail-question`. Its `.empty-desc`
  still names ⌘E — the palette's legacy alias — while the topbar chip reads ⌘⇧F; treat the markup,
  not the sentence, as the authority (see the palette bullet).
- **Diagram modal** — click, Enter or Space on a `.mermaid-container` clones its rendered SVG into
  the body-level `#diagram-modal` (`components/diagram-modal.html`), 92vw wide with height capped
  at 84vh; Esc, the ✕ button or the backdrop close it and focus returns to the diagram. It has to
  live at body level because `.detail-inner`'s inline-size containment makes that box a containing
  block for `position: fixed` descendants — an overlay rendered inside the answer pane is trapped
  there. The roadmap tooltip is body-level for the same reason — `roadmapTip()` appends
  `#roadmap-tooltip` to `document.body` rather than to the pane.
- **Command palette** — ⌘⇧F / Ctrl+Shift+F opens it (`paletteShortcutMatches` in `view/app.js`);
  ⌘E / Ctrl+E still works as a legacy alias, and both are ignored while focus sits in a text field
  other than the palette input. The topbar chip is rewritten per platform by `syncCmdKbdHint`
  (`#cmd-kbd-hint`), so do not hardcode a second one. `cmdFuzzyScore` is a **per-word in-order
  substring matcher**, not a fuzzy one: every whitespace-separated token must appear as a
  contiguous, case-insensitive substring of the text, each starting no earlier than the end of the
  previous. Do not reintroduce scattered-character/subsequence matching — it was removed on purpose,
  because "sreq" then matched "search request" and ranking could not tell the difference. Ranking
  weights title › section = tags › type/id/num (`cmdScoreDirect`), a whole-word inverted index
  (`cmdPostings` over `cmdCleanBodyText`) adds hits from every rendered answer card with a ~100-char
  snippet, and `#tag` / `@section` tokens filter the set with Tab completion.
- **Roadmap pane** — the topbar `#roadmap-btn` is a `role="switch"` (`toggleRoadmap` →
  `setRoadmapMode`, persisted in `interview-roadmap-mode`). The view is `#detail-roadmap`, a
  **sibling `.detail-inner`** of `#detail-question` inside the detail pane, so it inherits the
  pane's single scroller, its `.hidden` switching and the named `detail` container; `.roadmap-head`
  is `position: sticky` in that scroller — pinned on **both** axes, since the pane also scrolls
  horizontally — and a second scroll box under it is the bug to avoid. It is a **matrix**: one row
  per question `section` (`data/roadmaps.js` → `RoadmapDB`, 27 rows in four labelled topic blocks,
  408/408 questions, no id in two rows) and one cell per question, ragged — columns never align
  across rows, so nothing may impose a fixed column count. A cell is a real `<a href="#id">`, so
  ⌘-click opens through the app's own hash routing. **Encoding: hue = difficulty only**
  (`.rm-diff-E/M/H` → `--diff-*`; the E-circle / M-rounded / H-sharp dialect is deleted, the words
  live in the legend and the aria-label), **memory = alpha over an opaque matte** (`.rm-mem-0..3`
  on the `::before` fill layer, never on the cell, so hover/focus cannot fake confidence; unseen
  is a hollow 1px hue edge), **importance = a bold 2px border** (`.rm-star`) — whose cost is that
  at `rm-mem-3` the edge and the field are the same full-strength hue, so a starred *and* "knew"
  cell is pixel-identical to an unstarred one. Geometry is four shared tokens only: `--rm-cell`
  22px, `--rm-gap` / `--rm-row-gap` 3px, `--rm-label` 150px — no rule or inline style may size a
  cell another way. `roadmapSections()` is the single grouping source, `roadmapColumnOrder()` sorts
  starred-first then E→M→H (stable), rows stay in data order, and the open question carries
  `.rm-cur` (1px neutral ink outline outside the matte, gated by `ROADMAP_MARK_CURRENT`); there is
  deliberately **no** "you are here" and **no** "next gap" mark. *Known* still means
  `rating === 'know'` — not "any rating". **`interview-hidden` is not a display filter**: hidden
  questions appear in the matrix, the feed and every count exactly like the rest, still carrying
  `data-ghost="1"`, and clicking one still unhides it (the pane's only un-hide path, so the Hide
  control has no visible effect today). Keyboard: one tabbable cell per pane (roving `tabIndex`),
  arrows/Home/End move across `data-rmr`/`data-rmc` and `stopPropagation()` so the feed selection
  does not follow, Enter activates, Space is swallowed, and Esc leaves the pane before it closes the
  palette. Opening any question ends roadmap mode; a tab switch keeps it and restarts at the top; a
  sidebar section click keeps it, scrolls to that row and fades the **row label** (`.rm-row-flash`,
  colour only — a flash that touched cell fill would fake a memory level for its duration).
- **No framework** — vanilla `<script>` tags (no ES modules), IIFE namespace pattern (`QuestionDB`,
  `RoadmapDB`, app state). Load order in `index.template.html` is load-bearing: `view/app.js`
  defines `window.QuestionDB` before any `/data/*.js` registers into it, and `data/roadmaps.js`
  comes last because it derives bands from the finished registry.
- **Accessibility** — keyboard navigation (↑/↓, Space reveal, 1/2/3 rate, ←/→ history),
  ARIA labels, a real focus trap while the palette is open (`aria-modal="true"`), and roadmap cells
  carrying full state in their `aria-label`.

## Deployment

Static site — deploy to any static hosting:

- GitHub Pages (push to `gh-pages` branch or use Actions)
- Netlify / Vercel / Cloudflare Pages (connect repo)
- Any web server serving the directory

Progress then lives in localStorage only: `server/` (Node ≥ 22, `node:sqlite`) is not part of a
static deployment.

## Troubleshooting

- **Questions not appearing** — check browser console for JS errors in `data/*.js` syntax
  (`node --check data/<topic>.js`)
- **A question seems missing from the feed** — usually section-scoping, not bad data: the feed shows
  exactly one section at a time (`getFeedQuestions`), and the sidebar lists the sections for the
  active topic — for system design that is Mobile 14, Classic 24, Infrastructure 34,
  Architecture 13, Frontend 14, Staff / Platform 13 (112 total; counts drop under active facets). Pick the section in
  the sidebar, or let ⌘⇧F find it: the palette searches every question across topics by title,
  section, tags, type/id/num and the text of every answer card
- **A question is missing from the roadmap** — its `section` is not what you think it is. Hiding is
  no longer a cause: `interview-hidden` does not remove a question from the matrix, the feed or any
  count (see the roadmap bullet); a hidden question still carries `data-ghost="1"` and clicking it
  restores the flag
- **Styles broken** — verify `view/style.css` loads (check Network tab)
- **Command palette not opening** — the handler lives in `initializeKeyboardHandlers` in
  `view/app.js` (⌘⇧F primary, ⌘E alias) and the `#cmd-launch` button is wired in
  `index.template.html`; make sure neither is shadowed and that focus is not in another text field
- **Progress not saving** — verify LocalStorage isn't blocked (private browsing, storage full), then
  check `SERVER_API_BASE` and whether `server/server.js` is actually up (see the two-stores bullet)

## Agent-Specific Guidance

- **Keep it vanilla** — do not add a bundler, TypeScript, or framework without explicit approval
- **Data first** — new questions go in `/data/*.js`, not hardcoded in HTML/JS
- **Derive, don't duplicate** — a question's `section` is its feed group and its roadmap band; never
  keep a second list of ids that can drift from `/data`
- **Follow patterns** — mimic existing code style in `app.js` for new features
- **Compose before commit** — if you edit `/components/` or `index.template.html`, run
  `node scripts/compose-html.mjs` and confirm with `--check`
- **No tests to run** — manual browser verification only
