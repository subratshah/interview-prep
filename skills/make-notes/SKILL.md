---
name: make-notes
description: Turn a source (transcript, article, video notes, file) into concept notes for the interview-prep app — extend existing notes under data/notes/, register them in data/notes.js and link related questions. Use when the user says "make notes from this transcript/article/video/file" or asks to add/extend concept notes.
---

# make-notes

## Purpose

Convert learning material into revision-grade concept notes rendered by the app's 📚 Notes view.
One note per **concept**, not per source: a new source extends existing notes before it creates new ones.

## Where things live

- Notes: `data/notes/<topic>/<NN>-<id>.md`, topic ∈ `android` | `behavioral` | `data-structures` | `system-design`.
  `data/notes/` is tracked; the private prep folder `.notes/` is gitignored — never copy from it into a tracked note verbatim.
- Registry: `data/notes.js` → `NotesDB.register([{ id, topic, title, icon, file, related: [...] }])`.
- Format and emoji vocabulary: `reference/format.md` (follow it exactly).

## Workflow

1. **Read the source fully** before planning. Note every concept it teaches.
2. **Map to existing notes** — read `data/notes.js` and list `data/notes/<topic>/`. For each
   concept decide: extend an existing note (add or deepen an H2) or create a new one.
3. **Propose, then wait** — show the note list: new ids + titles + topic, and which existing notes
   gain which sections. Get the user's confirmation before writing.
4. **Write / extend notes** per `reference/format.md`:
   - Rewrite for revision: full detail, mermaid diagrams for flows, tables for comparisons,
     and worked examples. No "say this in the interview" blocks.
     Go deeper than the source where it helps.
   - Correct source errors silently — never write "the video says" or "correction".
   - When merging with existing text keep the fuller answer; ask the user when a merge is unclear.
5. **Registry** — add or update the entry in `data/notes.js` (`file` must match the real path).
6. **Link questions** — search `data/*.js` for matching questions; put ids in the registry
   `related` or a section's `<!-- related: ... -->` comment. Never hand-list ids anywhere else.
   List concepts with no matching question as **suggested new questions** — do not add them to
   `data/*.js` without approval.
7. **Validate**
   - `node --check data/notes.js`
   - every `related` id exists in `QuestionDB` (grep `id: "<id>"` in `data/*.js`)
   - every registry `file` exists; each note has one H1 and at least one H2
   - mermaid blocks are closed and parse-plausible (one diagram type line, no stray backticks)
   - no personal markers: recruiter/HR text, names, personal stories, private links, company logistics
   - `node scripts/compose-html.mjs --check` (only relevant if the template changed)
   - browser: `http://localhost:1000/#tab=<topic>&note=<id>` via `./start-server.sh` —
     notes are fetched at runtime, so `file://` will not load them

## Content rules

- Learning concepts only. Drop recruiter/HR content, personal stories, private links and logistics.
- Keep every **public** reference link from the source (LeetCode, docs, articles, videos) **inline**
  where its topic is discussed — never in a trailing references list. Keep URL and link text
  verbatim. Drop only local/relative links to private files and personal search sessions
  (e.g. perplexity.ai). Verify each kept URL appears exactly once across `data/notes/`.
- No duplicate notes for one concept; no second list of question ids outside `related`.
- `related` ids must exist in `QuestionDB`.
- Do not touch app code (`view/`, `components/`) for content work.

## References

- `reference/format.md`
- `../mock-interview/SKILL.md` (question bank usage)
- `../../AGENTS.md`
