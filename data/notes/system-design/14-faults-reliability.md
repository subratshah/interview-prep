# 💥 Faults & reliability

*Faults are inevitable; reliability is stopping a fault in one component from becoming a failure users see.*

## 🔤 Fault vs failure

- **Fault** — one component deviates from spec (a disk dies, a bug throws).
- **Failure** — the system as a whole stops serving users.
- **Fault tolerance** — design so faults don't become failures.

| Kind | Nature | Main defence |
|---|---|---|
| Hardware | Random, independent | Redundancy |
| Software | Deterministic, **correlated** | Testing, staged rollouts, isolation |
| Human | Unpredictable, leading outage cause | Guardrails, automation, review |

```mermaid
flowchart LR
  F[Fault] --> D{Contained?}
  D -->|"yes: redundancy, retry, breaker"| OK[Users unaffected]
  D -->|no| X[Failure]
```

> 🔑 Redundancy beats hardware faults because they are independent: one disk's death says nothing about the next. It does not beat software faults: every replica runs the same bug and fails together. Software needs canaries, input validation and fast rollback.

### 📏 Availability budget

| Availability | Downtime per year |
|---|---|
| 99.9% | about 8.8 h |
| 99.95% | about 4.4 h |
| 99.99% | about 53 min |

## 🖥️ Hardware faults

- Causes:
  - disk full;
  - out of memory;
  - server down;
  - damaged network cable;
  - power supply issue;
  - misconfigured node;
  - traffic spike → overheating;
  - compromised database.
- **Random and independent** — one disk's death says little about another's.
- Mitigation:
  - **Redundancy** — N+1 servers, replicated DBs, multi-AZ.
  - Alerts on leading signals (disk 85%, memory 90%).
  - Automatic replacement (autoscaling groups, orchestrators).

## 🐛 Software faults

- Causes:
  - bad code, unhandled exceptions;
  - edge cases that only real users hit;
  - configuration errors (service, API config);
  - **environment drift** — dev ≠ staging ≠ prod;
  - **merge conflicts** — two developers change the same feature in parallel;
  - performance regressions (slow requests).
- **Deterministic** — same input, same crash; reproducible, so fixable, but it keeps recurring until fixed.
- **Correlated** — the same bug runs on every node, so redundancy doesn't help; all replicas crash together.
- Mitigation:
  - Handle exceptions; test edge cases; test every component on every build.
  - Infrastructure/config as code; parity between environments.
  - Staged rollouts, feature flags, fast rollback.

## 🧑 Human faults

- Humans are the least predictable component and a leading cause of real outages: bad config pushes, wrong commands, deleting the wrong resource, hasty "bandage" fixes applied under pressure.
- Also the most important: someone must be accountable. AI-generated code still needs human **review and ownership**.
- Mitigation:
  - **Guardrails** — reviews, CI checks, restricted prod access, confirmation on destructive ops.
  - Automation over manual runbooks.
  - **Blameless postmortems** → fix the root cause everywhere, not a band-aid. Blame makes people hide mistakes, and hidden mistakes recur.
  - Easy rollback, sandboxes for trying things.

## 🚀 Safe rollouts

- **Canary** — 1% → 10% → 50% → 100%, gated on error rate and p99.
- **Blue/green** — switch traffic between two environments; instant rollback.
- **Feature flags** — ship dark, enable gradually, kill switch.

```mermaid
flowchart LR
  B[Build] --> C1["Canary 1%"]
  C1 -->|"metrics ok"| C2["10%"]
  C2 -->|"metrics ok"| C3["100%"]
  C1 -->|"errors up"| RB[Rollback]
  C2 -->|"errors up"| RB
```

## 🔌 Circuit breakers and graceful degradation

- A slow dependency ties up threads upstream → **cascading failure**.
- **Timeouts** on every remote call; **retries** with backoff + jitter, capped.
- **Circuit breaker** — Closed (normal) → Open after error threshold (fail fast) → Half-open (trial calls) → Closed.
- **Bulkheads** — separate pools per dependency.
- **Fallbacks** — cached data, default response, hide the feature.

```mermaid
flowchart LR
  CL[Closed] -->|"errors over threshold"| OP[Open]
  OP -->|"cool-down elapsed"| HO[Half-open]
  HO -->|"trial ok"| CL
  HO -->|"trial fails"| OP
```

### 🎛️ Tuning and pitfalls

| Parameter | Example setting | Why |
|---|---|---|
| Timeout | 300 ms on every outbound call | Unbounded waits cascade even without a breaker |
| Trip signal | Failure rate at or above 60% over a 10 s sliding window | An absolute count trips on quiet traffic and misses spikes on busy traffic |
| Open duration | 30 s, then one half-open probe | Gives the dependency room to recover |
| Fallback | Cached value, then a default; never a bare error | The page must still render; a missing widget beats a failed page |
| Scope | One breaker per dependency and endpoint | A failing non-critical call must not take down critical ones |

- **Count only server-side failures.** A 4xx is the client's fault; counting it lets a burst of bad requests open the breaker for everyone.
- **Single half-open probe.** After the open timer, allow exactly one trial call. Success closes the breaker; failure re-opens it. Ramp traffic gradually only for very high-volume dependencies.
- **Per-instance breakers** are the norm. A breaker shared through a central store adds a network hop and a new dependency to every call.
- **Fallbacks need their own timeout.** A fallback that calls another slow dependency can cascade on its own.
- **Retries outside the breaker need a budget.** Every open ↔ half-open flip otherwise triggers a retry burst.
- Export every state transition as a per-dependency metric. On the JVM, Resilience4j is the usual library.

## 🐒 Chaos testing

- Inject faults on purpose (kill instances, add latency, drop a zone) to prove fault tolerance works.
- Start in staging, small blast radius, with a stop button; then game days in prod.
- Examples: Chaos Monkey, fault injection in the service mesh.

