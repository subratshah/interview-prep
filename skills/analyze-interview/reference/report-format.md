# Report format

```markdown
# Report: <Company> <round type> (<start>–<end>)

State: active

- Company: <name>
- Role: <title, level>
- Interviewer: <role as they introduced themselves>
- Outcome: <Selected | Not qualified | Pending> (source: candidate / recruiter)

## Context

#### Question:
What was asked, what was answered, how much was correct? Transcript: `MM-DD_transcript_<round>.md`.

#### Scope:
- Stretches of the round (intro, verbal, design, live coding, …)
- Items graded: N. Not graded: <unresolved lines>
- Caveats that change a decision (NDA, unfinished build, …)

## Analysis

#### Score:
| Weights (C / M / P / W) | Items | Points | Score |
| ----------------------- | ----- | ------ | ----- |
| 1 / 0.75 / 0.5 / 0      | N     | x      | **y%** |

#### Items:
| # | Asked | Answered (paraphrase) | Grade | Strong answer adds | Bank |
| - | ----- | --------------------- | ----- | ------------------ | ---- |

#### Question patterns:
- Types seen (concept, design, coding, behavioural) and where follow-ups went deeper

#### Strengths:
- …

#### Areas for improvement:
- …

#### Bank gaps:
- Proposed new question (topic, section, difficulty) — not added yet

## Handoff

#### Action items:
- Immediate: one thing to practise before the next round
- Short-term: one topic to study (with bank ids)
- Long-term: one skill to develop

#### Next action:
<one concrete step, or None>
```

Set `State: complete` only once the action items are done or dropped and Next action is `None`.
