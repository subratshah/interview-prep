# Playbook template (`.interview/playbook.md`)

Merge new insights into the existing sections; deduplicate; keep each list short (strongest items
first). Frameworks below are the defaults — refine them only when a report shows one failed.

```markdown
# Technical Interview Playbook
Compiled from: <list of report files>

## Performance Tracking
| Date | Company | Round | Score | Outcome |
| ---- | ------- | ----- | ----- | ------- |
Trend: <Improving | Stable | Needs work> (from the last 3 scores)
Consistent strengths: <2–3>
Consistent weaknesses: <2–3>

## Core Response Frameworks

### System design
- CLARIFY: scale (users, QPS, data), must-have vs nice-to-have, constraints (latency, consistency)
- APPROACH: high-level components, data flow, justified technology choices
- TRADEOFFS: consistency vs availability, latency vs throughput, simplicity vs scale
- FINALIZE: one-sentence architecture, what you would build first

### Algorithm / coding
- UNDERSTAND: repeat constraints, input format, edge cases, time/space targets
- PLAN: brute force → optimise, name the paradigm, state complexity up front
- EXECUTE: narrate while coding, handle edge cases explicitly
- TEST: walk a sample input, restate complexity, one optimisation if time permits

### Behavioural (STAR + L)
- Situation (1 sentence) · Task (specific) · Action (what *you* did) · Result (quantified) · Learning

## Quick Reference
### Terms to always mention (Android)
### Clarifying questions that worked
### Phrases that show strong thinking

## Common Pitfalls
- <pitfall> — seen in <report>

## Weekly Review
- [ ] Re-read one past report for patterns
- [ ] Practise one framework out loud
- [ ] Drill the bank ids from open action items
```
