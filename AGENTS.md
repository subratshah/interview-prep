# Interview Prep — Agent Guidance

## Project Overview

A vanilla JavaScript single-page application for interview preparation with curated questions across Android, Behavioral, Data Structures, and System Design topics, featuring Learn/Quiz modes, progress tracking, and local storage persistence.

## Quick Start

```bash
# Serve locally (no build step required)
./start-server.sh
# or: python -m http.server 8000
# or: npx serve
```

Then open `http://localhost:8000` in a browser.

## File Structure

```
├── index.html              # Entry point (composed from components)
├── index.template.html     # Template for compose-html.mjs
├── start-server.sh         # Simple HTTP server starter
├── AGENTS.md               # This file
├── .agents/                # Shared agent artifacts (source of truth)
├── .claude/                # → symlink to .agents/
├── .cursor/                # → symlink to .agents/
├── .codex                  # Kept as-is (points to .claude)
├── components/             # HTML templates for UI components
│   ├── command-palette.html
│   ├── detail-panel.html
│   ├── feed.html
│   ├── sidebar.html
│   ├── statusbar.html
│   └── topbar.html
├── data/                   # Question databases (one per topic)
│   ├── android.js
│   ├── behavioral.js
│   ├── data-structures.js
│   └── system-design.js
├── scripts/
│   └── compose-html.mjs    # Composes index.html from components
└── view/
    ├── app.js              # Main application logic (~2100 lines)
    ├── cmd-launch-init.js  # Command palette initialization
    ├── style.css           # All styles
    └── theme-init.js       # Theme initialization
```

## Key Conventions

- **No build step** — pure vanilla JS, CSS, HTML served statically
- **Question data** lives in `/data/*.js`, each exporting via `QuestionDB.register('topic', [...])`
- **New questions** go in the appropriate `/data/*.js` file following the schema below
- **UI components** are HTML partials in `/components/` composed into `index.html` by `scripts/compose-html.mjs`
- **Main logic** in `/view/app.js` — modular IIFE pattern with `QuestionDB` namespace

## Question Data Schema

Each question object in `data/*.js`:

```javascript
{
  id: "tech-1",           // unique identifier
  type: "technical",      // "technical" | "behavioral"
  num: 1,                 // display number within section
  difficulty: "E",        // "E" | "M" | "H"
  star: true,             // boolean — important/featured
  section: "Kotlin",      // section/group name
  title: "What is...",    // question text
  answer: "**Expected...", // markdown answer (supports **bold**, `code`, tables)
  tags: ["kotlin", "basics"], // array of strings
  related: ["tech-2", "tech-5"] // array of related question IDs
}
```

## Code Style

- No linter/formatter configured currently
- 2-space indentation, single quotes, trailing commas where valid
- If adding Prettier/ESLint, configure in this repo root

## Testing

No test infrastructure exists currently. All verification is manual via browser.

## Adding New Questions

1. Open the appropriate file in `/data/` (e.g., `android.js`)
2. Add a new object to the array passed to `QuestionDB.register()`
3. Follow the schema above — ensure unique `id`, incremental `num` within section
4. Run `node scripts/compose-html.mjs` if you also modified components
5. Refresh browser to verify

## Modifying UI Components

1. Edit the relevant `.html` file in `/components/`
2. Run `node scripts/compose-html.mjs` to rebuild `index.html`
3. Refresh browser

## Architecture Notes

- **SPA with hash routing** — URL state encodes topic (`#android`) and question (`#tech-1`)
- **LocalStorage persistence** — ratings, seen state, theme, zoom level, learning mode
- **Markdown rendering** — marked.js for answers, Mermaid for diagrams
- **Command palette** — ⌘E opens fuzzy search across all questions
- **No framework** — vanilla ES modules, IIFE namespace pattern (`QuestionDB`, app state)
- **Accessibility** — keyboard navigation (J/K, Space, 1/2/3), ARIA labels

## Deployment

Static site — deploy to any static hosting:

- GitHub Pages (push to `gh-pages` branch or use Actions)
- Netlify / Vercel / Cloudflare Pages (connect repo)
- Any web server serving the directory

## Troubleshooting

- **Questions not appearing** — check browser console for JS errors in `data/*.js` syntax
- **Styles broken** — verify `view/style.css` loads (check Network tab)
- **Command palette not opening** — ensure ⌘E isn't captured by browser/OS; check `cmd-launch-init.js` loaded
- **Progress not saving** — verify LocalStorage isn't blocked (private browsing, storage full)

## Agent-Specific Guidance

- **Keep it vanilla** — do not add a bundler, TypeScript, or framework without explicit approval
- **Data first** — new questions go in `/data/*.js`, not hardcoded in HTML/JS
- **Follow patterns** — mimic existing code style in `app.js` for new features
- **Compose before commit** — if you edit `/components/`, run `node scripts/compose-html.mjs`
- **No tests to run** — manual browser verification only
