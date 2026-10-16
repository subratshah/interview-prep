# System design questions (backend and mobile)

Produce these steps in this order, each as its own labelled step. Keep a running list of assumptions and refer to them by number. The order is the app's answer order (Hello Interview delivery framework), so a solved question maps onto `data/system-design.js` field by field.

1. **Scope** (`scope`): the product in one line, clarifying questions, numbered assumptions, and a **Below the line (out of scope)** list.
2. **Requirements** (`functional`, `nfr`): functional as 3 to 5 "Users should be able to…" bullets; non-functional with numbers (latency, availability, consistency, durability, security, cost). For mobile, add offline behaviour, battery, data usage and cold start. Pin every consistency choice here ("a user must read their own writes") and reuse the same wording later.
3. **Capacity** (`capacity`, optional): back-of-envelope arithmetic shown, only for the numbers that change the design; say which number drives it.
4. **Core entities** (`entities`): 3 to 7 nouns with key fields and relationships. Add a storage table (keys, indexes, store) only when it matters. For mobile include the local schema.
5. **API / system interface** (`api`): endpoints as `METHOD /plural-path` with request and response, pagination and idempotency keys; the user comes from the auth token. Mobile: the client↔server contract plus the key on-device interface.
6. **High-level design** (`architecture`): one `### 1) <requirement>` subsection per functional requirement with a numbered request path, then `### Final design` with one Mermaid diagram. Start from the simplest design that works and say which requirement or number breaks it.
7. **Deep dives** (`deepDives`): 2 to 4, each a question tied to a non-functional requirement (hot keys, fan-out, ranking, sync conflicts, rate limiting, exactly-once, caching layers, failure of a node, region or queue). For each give Bad → Good → Great options, each with **Approach** and **Challenges** in one or two short bullets, then a **Verdict**: why the pick wins and the signal that would change it. Trade-offs and likely follow-ups belong here, not in a separate section.
8. **Pitfalls** (`pitfalls`): 4 to 6 common candidate mistakes. End with a one-line "say it aloud" summary a candidate can speak in about 30 seconds.
9. **Kotlin slice**: the last section. Not the whole system: the core client or service contract (an interface) plus one representative implementation, for example a repository with an offline cache and a sync worker, a rate limiter, or an idempotent request handler. State how it was verified (see `SKILL.md`).

## Habits that separate strong answers

- Ask or assume numbers before choosing technology; let the numbers pick the design.
- Every box on the diagram has a reason that traces back to a requirement.
- Name the trade-off in each choice (consistency vs availability, latency vs cost, simplicity vs flexibility) and the signal that would make you change it.
- Include security and privacy where users' data is involved (auth, encryption in transit and at rest, token handling, least privilege).
- Mobile: say what happens offline, on a flaky network, on process death, and when the app is updated while old clients remain.

## Verification specifics

- Check the arithmetic in step 3 line by line.
- The Kotlin slice must compile in principle and its example calls must match the contract in step 5. If it contains logic (rate limiter, backoff, merge), mirror that logic in Node or Python and test it, as `SKILL.md` describes.
