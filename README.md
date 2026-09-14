# Interview Prep

A single-page app for senior mobile/SWE interview preparation: **408 curated questions** across
four topics. Each carries a worked answer plus the follow-ups and red flags an interviewer will push
on; behavioural items also carry a listening guide and a STAR framing hint. Progress (what you know,
what you forgot, what you've opened) is tracked locally, and a **roadmap matrix** shows the whole
corpus at a glance in one pane.

No framework, no bundler, no database server to install — plain HTML, CSS and `<script>` tags,
with an optional zero-dependency Node API for persistence.

**Live:** <https://subratshah.github.io/interview-prep/> — served straight from this repo by GitHub
Pages. That copy has no progress API, so it remembers each browser separately; see
[How progress is stored](#how-progress-is-stored).

| Topic | File | Questions |
| --- | --- | --- |
| Android | `data/android.js` | 154 |
| Behavioural | `data/behavioral.js` | 74 |
| Data Structures | `data/data-structures.js` | 68 |
| System Design | `data/system-design.js` | 112 |

Those counts are what `HEAD` registers; the authoritative number is whatever the `data/*.js` files
contain, and the app shows it live in the roadmap's per-block counts.

## Run it

The app itself is static. What changes is whether progress persists to the API or to localStorage.

```bash
# Windows: double-click launch.bat — starts the server, opens the browser
# Anywhere else:
node server/proxy-server.js        # static on :1000, spawns the API on :1001
# or
./start-server.sh                  # same thing, prints a LAN URL too
PORT=8080 ./start-server.sh        # :1000 is the default
```

Then open <http://localhost:1000>.

- **The progress API needs Node ≥ 22** — it is built on `node:sqlite`, so there is nothing to
  install (`server/` has no dependencies). If it is not running, the app keeps working and falls
  back to `localStorage`.
- Any plain static server works too (`python -m http.server 1000`, `npx serve`); with no API
  answering, progress just stays in the browser.
- **Fonts, `marked` and `mermaid` load from CDNs**, so markdown answers and diagrams need network
  access on first paint. Everything else is local.
- `start-server.sh` binds every interface and prints a `http://<lan-ip>:1000` URL, so you can open
  it on a phone. On Windows, allow the `node` binary through the firewall — not Python.

## What you get

**Feed and detail pane.** The left column lists the sections for the active topic; the feed shows
one section at a time; the detail pane renders every answer card for the selected question —
expected answer, key points, complexity, follow-ups, red flags — laid out per topic so two cards can
share a row or one can span it.

**Learn and Quiz mode.** Learn expands every section; Quiz collapses all of them so you answer
before reading. The mode applies to every question and is not persisted — each reload starts in
Learn.

**Roadmap matrix.** One row per question section (27 of them) inside four labelled topic blocks,
one cell per question, ragged — columns never align between rows, because rows are 5 to 34 cells
long. Click a cell to open that question.

**Command palette.** ⌘⇧F (⌘E also works) searches every question by title, section, tags, id and
number, *and* the full text of every rendered answer card. `#tag` and `@section` tokens filter, with
Tab completion.

**Diagram modal.** Click any rendered Mermaid diagram to open it at 92% of the window.

**Themes and a size ladder.** Dark/light, plus `+` / `-` / `0` to scale the whole UI (70–250%)
without re-flowing the layout the way browser zoom does.

### Keyboard

| Keys | Action |
| --- | --- |
| `↑` / `↓` | move through the feed |
| `←` / `→` | history back and forward |
| `1` / `2` / `3` | rate the open question: knew · shaky · forgot |
| `+` / `-` / `0` | UI size ladder |
| ⌘⇧F / ⌘E | command palette |
| `Esc` | leave the roadmap, close the palette |
| `Space` | reveal the selected answer |

Inside the roadmap, arrow keys / Home / End move cell to cell and `Enter` opens; one cell is a tab
stop at a time.

## The roadmap matrix, in one paragraph

Colour is difficulty, and *only* difficulty. Opacity is memory, measured against an opaque matte so
an empty cell is genuinely hollow rather than "dark blue". A bold 2px border marks a question you
flagged as important. A 1px neutral outline marks the question you have open. Everything is sized by
four tokens (`--rm-cell` 22px, `--rm-gap` and `--rm-row-gap` 3px, `--rm-label` 150px), so the only
way a cell changes size is by design. The difficulty colours are derived for maximum lightness spread
rather than picked for looks, which means they are readable without colour vision and do not match
the coloured E/M/H chips unless the chips read the same tokens — they do, through `--diff-*`.

## How progress is stored

Two stores, deliberately. `localStorage` is written first and always; the whole set is then mirrored
to `PUT /api/progress`, and on load the API wins if it answers, with a one-time `POST /api/import`
of whatever localStorage held. The client calls the API **same-origin** — the proxy forwards
`/api/*` to :1001 — so any port or LAN IP works without CORS setup. The endpoint contract is in
[`skills/mock-interview/reference/progress-api.md`](skills/mock-interview/reference/progress-api.md).

Keys that stay browser-only: `interview-theme`, `interview-ui-zoom`, `interview-roadmap-mode`,
`interview-hidden`, and the sidebar drag width. The topbar RESET clears **progress only** — ratings
and seen, in both stores — and deliberately leaves theme, size, roadmap mode and the hidden list
alone.

On the hosted copy the API is simply absent: `GET /api/progress` 404s and the mirror writes come
back `405`, both handled as the fallback they are. The app stays fully usable — ratings survive a
reload — but progress is then **per browser and per device**, and it is gone if the site's storage
is cleared. Pages also keys localStorage by *origin* rather than path, so every `*.github.io` site
shares one namespace; the `interview-` prefix is what keeps this app's keys apart, and the
unprefixed `sidebar-width` is the one exception.

## Layout

```
index.html                generated: template + components (do not hand-edit)
index.template.html       the source of index.html, with <!-- @include --> markers
components/*.html         the six partials that compose into it
view/app.js               all application logic (~4000 lines, IIFE, no modules)
view/style.css            all styles (rem lengths — see below)
view/theme-init.js        pre-paint theme and size ladder
data/*.js                 question registries + roadmaps.js (section order per topic)
scripts/compose-html.mjs  the only generator: components -> index.html (--check gate)
server/proxy-server.js    static :1000 + spawns and forwards /api to :1001
server/server.js          node:sqlite progress API
skills/mock-interview/    agent skill: persona, progress-API and roadmap references
AGENTS.md                 guidance for AI agents working in this repo
```

## How it fits together

`index.html` is **generated**. Edit `index.template.html` or a file in `components/`, then run
`node scripts/compose-html.mjs`; `--check` exits non-zero when `index.html` has drifted, which is the
gate against shipping a stale bundle.

Every `<script>` tag is load-bearing. `view/app.js` defines `window.QuestionDB` *before* any
`data/*.js` registers into it, and `data/roadmaps.js` comes last because it derives section order
from the finished registry.

A question's `section` field is its feed group, its sidebar row **and** its roadmap row — one
derived key, never a second hand-maintained list that can drift. Topics group the rows into the four
labelled blocks.

### Adding a question

1. Add an object to the array in the right `data/*.js` file.
2. `id` is the next unused suffix for that topic (`tech-N` / `behav-N` / `ds-N` / `sd-N`) and `num`
   **equals that suffix** — the one rule that keeps the feed's display numbers coherent.
3. `section` is what places it in the roadmap. A section not named in `data/roadmaps.js` still
   appears, appended in data order; add the name there to choose its position.
4. `node --check data/<topic>.js`, then refresh with a cache-busting query (`?cb=1`) — the server
   sends no `Cache-Control`, so a plain reload can serve you the old file.

### Editing the UI

- **Lengths in `view/style.css` are `rem`, not `px`.** `html { font-size: calc(18px * var(--z)) }`
  is the one dial that scales the UI, and the sheet is written against a 16px reference, so `Npx`
  becomes `N/16` rem. Hairlines of 1–2px and `@media` thresholds stay in px on purpose.
- Two cheap gates, no server needed: `node --check view/app.js` and
  `node scripts/compose-html.mjs --check`.
- There is no test suite. Everything else is manual verification in the browser.

## Known rough edges

- **The Hide control has no visible effect.** Hiding is recorded (`interview-hidden`) but no longer
  filters anything, so hidden questions still appear in the feed, the counts and the matrix. Clicking
  a hidden cell in the roadmap clears the flag; that is currently the only visible consequence.
- **A starred question you have rated "knew" loses its border.** At full memory opacity the 2px
  importance border is the same colour as the cell's fill, so the two cancel out. It reads at unseen,
  forgot and shaky.
- **The light theme's difficulty colours are contrast-derived, not colour-blindness-tested**, and the
  hardest level is the dimmest cell in the dark theme by design (it is the highest-contrast choice on
  the matte, not the darkest-looking one).
- The roadmap used to be a branching tree whose cell *shape* encoded difficulty. That is gone — shape
  is no longer a channel, only colour is. A handful of rules (`.rm-row-bar`, `.rm-focus`,
  `.rm-lane-hd`) survive from alternative designs that were never adopted; they are inert because
  nothing emits that markup, and are kept deliberately as the starting point for those frames.
- **The hosted copy logs a console error on every progress write.** With no API answering, the
  mirror still fires, and Pages rejects it with `405` — swallowed by the app, not by the devtools.
  A local run through `server/` is silent. A one-line guard (skip the mirror once the first probe
  has failed) would quiet it.

## Agent tooling

This repo is set up for AI pairing: [`AGENTS.md`](AGENTS.md) carries the conventions and traps, and
[`skills/mock-interview/`](skills/mock-interview/) is a runnable skill (interviewer persona,
progress-API contract, roadmap reference). `.agents/` is scratch space for agent work — gitignored,
and never loaded by the app.
