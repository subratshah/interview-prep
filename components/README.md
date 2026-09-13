# HTML fragments (`components/`)

These files are **HTML snippets** included into `index.html` by `scripts/compose-html.mjs` via `index.template.html`. Edit fragments and the template, then run `node scripts/compose-html.mjs`. Use `node scripts/compose-html.mjs --check` in CI to ensure `index.html` is up to date.

To preview changes locally, run `./start-server.sh` from the repo root and open http://localhost:8888.

| File | Responsibility | Notable IDs / hooks |
|------|----------------|----------------------|
| `topbar.html` | Topic tabs, command palette launcher, hidden `topic-select` sync, Learn/Quiz toggle | `topic-tabs`, `cmd-launch`, `topic-select`, `toggle-switch` |
| `sidebar.html` | Section list (`sb-list`), searchable multi-select tag filter, difficulty chips, importance star chip, memory filter slider | `sb-list`, `tag-filter-section`, `tag-search-input`, `diff-chips`, `importance-chips`, `sidebar-memory-range` |
| `feed.html` | Feed header title/count and question card list | `feed-title`, `feed-count`, `feed-list` |
| `detail-panel.html` | Empty state, question chrome, body, tags/related, flashcard, meta block | `main-panel`, `detail-empty`, `detail-question`, `detail-body`, `flashcard`, `cmd-*` consumers |
| `command-palette.html` | Full-screen search overlay, results, hints | `cmd-overlay`, `cmd-input`, `cmd-results` |
