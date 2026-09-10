---
name: mock-interview
description: Run structured Android, behavioral, data-structures, and system-design interview practice sessions using the local question bank and durable progress store.
disable-model-invocation: true
---

# mock-interview

## Purpose

Use this skill to run an interviewer-led mock interview or focused interview-prep session. It is designed for Zed agent use and does not expose an embedded browser chat.

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
   - Use `data/*.js` as the source of truth.
   - Prefer starred questions unless the user requests a different mix.
   - Use `data/roadmaps.js` to choose a learning path.

3. **Ask one question at a time**
   - Present the question without the answer.
   - Let the user answer before revealing hints or evaluation criteria.
   - Ask one follow-up at a time based on the user's answer.

4. **Evaluate**
   - Compare the answer with the stored expected answer and red flags.
   - Give concise, constructive feedback.
   - Distinguish between incorrect facts, missing depth, communication issues, and strong signals.

5. **Progress update**
   - Record the question as seen.
   - Record the user's rating when the user provides one.
   - Save progress to the durable SQLite store when available; fall back to existing localStorage state.

6. **End-of-session review**
   - Summarize strengths, weak areas, and recommended next questions.
   - Review any AI-generated follow-up question before it is added to the question bank.
   - Do not add AI-generated questions to `data/*.js` without explicit user approval.

## Provider and tooling boundaries

- Use existing Zed provider configuration for NVIDIA and OpenRouter.
- Do not introduce an LLM proxy.
- The server is a minimal static server plus a SQLite progress API. It does not call an LLM.
- Keep question content in `data/*.js`; keep progress in SQLite.

## Safety and correctness

- Do not invent question IDs or duplicate existing IDs.
- Preserve the question schema in `AGENTS.md`.
- Keep server and client behavior aligned around the same progress contract.
- Keep sensitive data out of logs and question content.
- Do not claim progress persistence or AI generation unless the relevant path is implemented and verified.

## References

- `persona.md`
- `reference/roadmap.md`
- `reference/progress-api.md`
- `../AGENTS.md`
