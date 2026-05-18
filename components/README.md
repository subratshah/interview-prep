# HTML fragments (`components/`)

These files are **HTML snippets** included into `index.html` by `scripts/compose-html.mjs` via `index.template.html`. Edit fragments and the template, then run `node scripts/compose-html.mjs`. Use `node scripts/compose-html.mjs --check` in CI to ensure `index.html` is up to date.

| File | Responsibility | Notable IDs / hooks |
|------|----------------|----------------------|
| `topbar.html` | Topic tabs, list filter search, command palette launcher, hidden `topic-select` sync, Learn/Quiz toggle | `topic-tabs`, `search-input`, `cmd-launch`, `topic-select`, `toggle-switch` |
| `sidebar.html` | Section list (`sb-list`), difficulty chips, importance star chip, memory filter slider (`memory-filter-slider`), tag filter strip, sidebar export/import | `sb-list`, `diff-chips`, `importance-chips`, `memory-filter-slider`, `mem-filter-*`, `tag-filter-bar`, `si-export-sidebar`, `import-input-sidebar` |
| `feed.html` | Feed header title/count and question card list | `feed-title`, `feed-count`, `feed-list` |
| `detail-panel.html` | Empty state, question chrome, body, tags/related, flashcard, meta block | `main-panel`, `detail-empty`, `detail-question`, `detail-body`, `flashcard`, `cmd-*` consumers |
| `statusbar.html` | Legends, breadcrumb, progress, saved/rating, status export/import | `app-statusbar`, `si-topic`, `si-section`, `si-progress`, `si-export`, `import-input` |
| `command-palette.html` | Full-screen search overlay, results, hints | `cmd-overlay`, `cmd-input`, `cmd-results` |
