# System design questions (backend and mobile)

Produce these steps in this order, each as its own labelled step. Keep a running list of assumptions and refer to them by number.

1. **Restate and scope**: the product in one line, who uses it, and what is explicitly out of scope.
2. **Requirements**: functional (3 to 6 bullets) and non-functional (latency target, availability, consistency, durability, security, cost). For mobile, add offline behaviour, battery, data usage and cold-start constraints. Pin every consistency choice here ("a user must read their own writes") and reuse the same wording later.
3. **Capacity**: back-of-envelope numbers with the arithmetic shown: users, requests per second (average and peak), read/write ratio, payload size, storage per day and per year, bandwidth. State which number drives the design.
4. **API and data model**: the main endpoints or client interfaces with their inputs and outputs, pagination and idempotency keys, and the core entities with keys and indexes. For mobile include the local schema.
5. **Naive design**: the simplest design that meets the functional requirements, and exactly which requirement or number breaks it.
6. **High-level design**: components and data flow. Draw a small text or Mermaid diagram, then walk one write path and one read path end to end. Name each component's job in a line.
7. **Deep dive**: pick the 2 or 3 parts the interviewer is likeliest to probe (hot keys, fan-out, ranking, sync and conflict handling, rate limiting, exactly-once effects, search, caching layers). For each give the mechanism, the failure it prevents and its cost.
8. **Trade-offs and failure modes**: for each major decision list the alternative and why it lost, then walk the failures: a node dies, a region is lost, a queue backs up, a client is offline, a retry duplicates a request. Say what degrades and what stays correct.
9. **Evolution and follow-ups**: how it changes at 10x scale and the two likeliest follow-ups with one-line answers. End with a one-line "say it aloud" summary a candidate can speak in about 30 seconds.
10. **Kotlin slice**: the last section. Not the whole system: the core client or service contract (an interface) plus one representative implementation, for example a repository with an offline cache and a sync worker, a rate limiter, or an idempotent request handler. State how it was verified (see `SKILL.md`).

## Habits that separate strong answers

- Ask or assume numbers before choosing technology; let the numbers pick the design.
- Every box on the diagram has a reason that traces back to a requirement.
- Name the trade-off in each choice (consistency vs availability, latency vs cost, simplicity vs flexibility) and the signal that would make you change it.
- Include security and privacy where users' data is involved (auth, encryption in transit and at rest, token handling, least privilege).
- Mobile: say what happens offline, on a flaky network, on process death, and when the app is updated while old clients remain.

## Verification specifics

- Check the arithmetic in step 3 line by line.
- The Kotlin slice must compile in principle and its example calls must match the contract in step 4. If it contains logic (rate limiter, backoff, merge), mirror that logic in Node or Python and test it, as `SKILL.md` describes.
