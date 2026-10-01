# Android and Kotlin concept questions

For "how does X work", "X vs Y", "what happens when…", and security, storage, concurrency and architecture questions. Produce these steps in this order.

1. **Restate**: the question in one line, and which layer it lives in (language, framework, build, security, architecture).
2. **Clarify**: 1 or 2 clarifying questions an interviewer expects (API level, Compose or Views, single or multi-process, offline or not). Give the assumption taken, and what changes if it is wrong.
3. **Short answer**: the answer in 2 or 3 bullets, as a candidate would open with. Correct, precise terminology, no hedging.
4. **Naive approach**: what most people do or assume first.
5. **Why it breaks**: the concrete failure (leak, race, crash on rotation or process death, battery or ANR cost, security hole, data loss), ideally with the exact condition that triggers it.
6. **Idiomatic fix**: the recommended approach and the reason it works. Name the API and, where it matters, the API level or library version it needs.
7. **What changes at runtime**: lifecycle, threading, memory, persistence, and security consequences of the fix, and its costs. Include the contrasts the interviewer will ask for (X vs Y table only if there are 10 or more real rows; otherwise bullets).
8. **Pitfalls and follow-ups**: the common wrong claims, the two likeliest follow-ups with one-line answers, and a one-line "say it aloud" summary a candidate can speak in about 30 seconds.
9. **Kotlin snippet**: the last section. A short, compilable block that shows the idiom, with a `main` or usage example when it is not Android-specific. State how it was verified (see `SKILL.md`); Android framework code can only be traced by hand unless a project is available, so say "traced by hand, not run" when that is the case.

## Accuracy rules for this type

- Quote API levels, deprecations and version numbers only when sure; otherwise say "check against the current docs" and name the page. Prefer fetching the official page over memory when the answer depends on it.
- Distinguish **guarantee** from **best effort** (for example WorkManager guarantees execution, not timing; periodic work has a 15-minute minimum).
- For security questions state the threat model first (stolen device, rooted device, backup extraction, malware, shoulder-surfing), then the control, then what it does not protect against.
- Separate what the platform does for you from what the app must do (Keystore holds keys but the app chooses what to encrypt; `BiometricPrompt` alone returns a boolean, a `CryptoObject` ties authentication to a key use).
- If the repo already has a row for the question (search `data/*.js` by title), use it as ground truth and flag any disagreement instead of silently contradicting it.

## Common concept areas and the angle interviewers probe

- Coroutines and Flow: structured concurrency, cancellation, exception propagation (`coroutineScope` vs `supervisorScope`), dispatchers, cold vs hot, backpressure.
- Lifecycle and state: configuration change, process death, `SavedStateHandle`, `rememberSaveable`.
- Storage and security: Room migrations, DataStore, Keystore, encryption at rest, certificate pinning, obfuscation as deterrence only, PendingIntent mutability.
- Architecture: MVVM vs MVI, unidirectional data flow, Clean Architecture's dependency rule, DI scopes.
- Background work: WorkManager vs foreground service vs alarm, constraints, expedited work.
- Build and delivery: R8, App Bundles, baseline profiles.
