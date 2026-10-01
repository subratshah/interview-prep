---
name: solve-step-by-step
description: One-stop solver for any interview question (data structures and algorithms, system design, Android and Kotlin concepts). Classifies the question, builds a worked solution step by step, verifies the code, and ends in Kotlin. Use when the user pastes a question or an id and says "solve", "solve step by step", "walk me through", or "propose a solution and give Kotlin".
---

# solve-step-by-step

## Purpose

Take one interview question, of any kind, and produce a solution a candidate could narrate aloud:
understand, approach, refine, code. Code comes **last** and must agree with every step above it.
This file is the router and the shared rules; each question type has its own reference file.

## 1. Classify, then load one reference file

| The question is about | Load | Ends with |
|---|---|---|
| An algorithm, data structure, array/string/graph/DP problem, or "write a function that…" | `reference/dsa.md` | Verified Kotlin |
| Designing a system, service, feed, cache, pipeline, or a mobile client architecture | `reference/system-design.md` | A core Kotlin slice (interface + one implementation) |
| An Android, Kotlin, coroutines, security, storage or architecture concept ("how does X work", "X vs Y") | `reference/android-concepts.md` | A short Kotlin snippet that shows the idiom |

- Read only the matching file. For a mixed question (for example "design an LRU cache"), load both and say which parts follow which file.
- A question type not listed (behavioural, pure OOP, low-level design): use the closest file, say so in one line, and keep the shared rules below.
- `reference/worked-example.md` is a full DSA solution (minimum platforms); match its depth and shape.

## 2. Input

- A pasted question, or a bank id (`tech-N`, `ds-N`, `sd-N`, `behav-N`). For an id, read its row in `data/*.js` and use `title`, `keyPoints`, `answer`, `complexity` and `redFlags` as ground truth. Do not contradict them silently; flag a disagreement.
- If the question is ambiguous in a way that changes the solution, state the assumption inline and what changes if it is wrong. Do not stop to ask.

## 3. Shared rules (apply to every type)

- **Pin rules once.** Every tie, boundary, ordering or consistency rule is stated in the Clarify step and reused with the same operator in the approach, the trace and the code.
- **Brute force first** for algorithms, **naive design first** for systems and concepts. The interviewer wants the progression.
- **Complexity out loud.** State time and space including sorts and copies, then give a one-line "say it aloud" version a candidate can speak in about 30 seconds.
- **Likely follow-ups.** End the reasoning with the two follow-ups an interviewer is most likely to ask, each with a one-line answer.
- **Name the pattern or principle** (two pointers, monotonic stack, saga, repository, cooperative cancellation, …).
- **Say what you did not check.** If a fact comes from memory and not from the repo or docs, say so.

## 4. Verify before presenting

Never present code or a trace you have not checked. Use the first that applies and state which one:

1. **Run it** if `kotlinc` and `java` are on the PATH (`kotlinc x.kt -include-runtime -d x.jar`, then `java -jar x.jar`) on the examples.
2. **Mirror it** line for line in Node or Python, run the examples, and compare against the brute force on a few thousand random small inputs. Keep scratch files in the session scratchpad, not the repo. Say "algorithm verified in Node; Kotlin not compiled".
3. **Trace by hand** every example through the code and say "traced by hand, not run".

Then self-check:

- The tie and boundary rules match across prose, trace table and code.
- Every precondition the code relies on is asserted with `require(...)` or stated as an assumption.
- Index and pointer bounds cannot overrun.
- The stated complexity matches the loops in the code.
- The example outputs in the answer match what the code prints.

## 5. Code rules

- Language: **Kotlin by default**. Use Java or Python only when the user names it. If so, keep every rule here, and mirror to Node or Python for verification as usual.
- Idiomatic Kotlin: `val`, data classes, extension functions, expression bodies; scope functions only where they read better; no `!!`; no mutable collections exposed.
- Self-contained: imports included, a `fun main()` that runs the examples with `check(...)` or `println`. Keep the solution in its own named function, separate from `main`.
- Comments only for the non-obvious "why", keyed to step numbers (`// step 6.2`).
- Coroutines and Flow only when the question is about concurrency.
- A one-line KDoc on the main function names its complexity.

## 6. Format and boundaries

- Chat only. Bullets and short lines; number the steps exactly as the reference file does so the user can revise by step.
- No code before the final step. Pseudocode in the approach step is numbered prose.
- If the user replies "explain", give the intuition in a few bullets and correct any earlier mistake first.
- Do not edit `data/*.js` or any app file, and do not offer to add the question to the bank. If the user asks for that, route them to the question schema in `AGENTS.md` or `skills/make-notes/SKILL.md`.

## 7. Common mistakes

- Jumping to the optimal solution without the baseline.
- A tie rule that differs between prose, trace table and code (`<` in one place, `<=` in another changes equal-time cases).
- An unstated precondition that crashes or undercounts on a legal-looking input.
- Claiming "it runs" or "never overruns" without having run or traced it.
- Stating the wrong complexity because a forward-only two-pointer loop looks nested.
- System design that lists components without numbers, failure modes or a trade-off the interviewer can challenge.
- A concept answer that defines terms but never says what breaks, what the idiomatic fix is, or what changes at runtime.
- Kotlin that is Java transliterated (index loops, `!!`, exposed mutable state).
