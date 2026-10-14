---
name: mock-interview
description: Run structured Android, behavioral, data-structures, and system-design interview practice sessions using the local question bank and durable progress store.
disable-model-invocation: true
---

# mock-interview

## Purpose

Use this skill to run an interviewer-led mock interview or focused interview-prep session in the agent chat. The app has no embedded chat; the session runs here and only its progress is shared with the app.

## When to use

- Conduct a mock interview using the repository's curated question bank.
- Practice one topic or mix topics using the roadmap.
- Ask follow-up questions and evaluate candidate answers.
- Track progress across sessions.
- Review and accept AI-generated follow-up questions before adding them to the question bank.

## Interview loop

1. **Clarify the goal**
   - Ask which topic, difficulty, and duration the user wants.
   - For system design, establish scale, users, consistency, latency, availability, and data-growth assumptions.

2. **Select questions**
   - Use `data/*.js` as the source of truth: `data/android.js` (`tech-*`), `data/behavioral.js`
     (`behav-*`), `data/data-structures.js` (`ds-*`), `data/system-design.js` (`sd-*`).
   - Filter by `difficulty` (`E` / `M` / `H`) and `section`; prefer `star: true` questions unless the
     user requests a different mix.
   - Use `reference/roadmap.md` (section order from `SECTION_ORDER` in `data/roadmaps.js`) to choose
     a learning path; with the API up, skip or deprioritise questions already rated `know`.

3. **Ask one question at a time**
   - Present the question without the answer.
   - Let the user answer before revealing hints or evaluation criteria.
   - Ask one follow-up at a time based on the user's answer.

4. **Evaluate**
   - Compare the answer with the stored fields for its topic (schema in `AGENTS.md`):
     android / data-structures -> `answer` (short summary), `keyPoints` (full detail),
     `complexity` (data-structures only), `followUp`, `redFlags`;
     behavioral -> `listenFor`, `starGuide`, `redFlags`;
     system-design -> `scope`, `functional`, `nfr`, `capacity`, `architecture`, `dataModel`, `api`,
     `tradeoffs`, `approach`, `followUp`, `pitfalls` (only some questions fill the optional ones).
   - Give concise, constructive feedback.
   - Distinguish between incorrect facts, missing depth, communication issues, and strong signals.

5. **Progress update**
   - Record the question as seen, and the user's rating (`know` / `shaky` / `review`) when they give one.
   - Save through the progress API (`reference/progress-api.md`): `GET /api/progress`, merge the new
     ids into `ratings` and a deduplicated `seen`, then `PUT` the full set — `PUT` replaces the
     whole store. Use `http://localhost:1000/api/progress` when the app server is running.
   - If the API does not answer, say progress was not saved and list the ids with their ratings so
     the user can rate them in the app (keys 1/2/3). An agent cannot write the browser's localStorage.

6. **End-of-session review**
   - Summarize strengths, weak areas, and recommended next questions.
   - Review any AI-generated follow-up question before it is added to the question bank.
   - Do not add AI-generated questions to `data/*.js` without explicit user approval.

## Provider and tooling boundaries

- Use the host agent's own model configuration; do not introduce an LLM proxy.
- The server is a minimal static server plus a SQLite progress API. It does not call an LLM.
- Keep question content in `data/*.js`; keep progress in SQLite.

## Safety and correctness

- Do not invent question IDs or duplicate existing IDs.
- Preserve the question schema in `AGENTS.md`.
- Keep server and client behavior aligned around the same progress contract.
- Keep sensitive data out of logs and question content.
- Do not claim progress persistence or AI generation unless the relevant path is implemented and verified.
- Do not copy existing questions; if creating new question files, refer to existing ones in `data/*.js` for format and schema consistency.

## References

- `persona.md`
- `reference/roadmap.md`
- `reference/progress-api.md`
- `../../AGENTS.md`
