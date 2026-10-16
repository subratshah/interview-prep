QuestionDB.register('behavioral', [
  {
    id: 'behav-1',
    type: 'behavioral',
    num: 1,
    difficulty: 'M',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a bug you owned end-to-end — from discovery to resolution.',
    tags: [ 'ownership', 'debugging' ],
    related: [ 'behav-2', 'behav-3' ],
    listenFor: `- Takes full ownership (not "we fixed it" without personal action)
- Systematic path: reproduce → isolate → fix → verify → prevent — and can say which tool did the isolating (Crashlytics/Play Console cluster, StrictMode, a bisect, a Perfetto trace, a heap dump)
- Found the root cause, not just the symptom — e.g. a lifecycle race or process-death restore, not "added a null check"
- Sized the blast radius: affected devices / OS versions / app versions, and whether it needed a hotfix or could ride the train
- Left a guard behind: a regression test, a lint rule, an alert, so the class of bug cannot silently return`,
    starGuide: `- **S** — the bug in one line, with its user cost (crash-free rate, affected cohort, support tickets).
- **T** — why it was yours (you shipped it, you were on-call, or you picked it up when no one did).
- **A** — reproduce (how you got a reliable repro), isolate (the evidence that narrowed it), fix (and the alternative you rejected), verify (staged rollout, metric watched).
- **R** — the metric back to baseline, plus the test/lint/alert that prevents the whole class of bug.`,
    redFlags: `- Vague "we" language with no personal ownership
- No root-cause analysis — "couldn't repro, added a try/catch"
- Fixed the symptom (null check, retry) and never asked why the state was possible
- No verification after the fix shipped — assumed it worked
- Claims never to have shipped a bug, or that bugs were always caught in review`
  },
  {
    id: 'behav-2',
    type: 'behavioral',
    num: 2,
    difficulty: 'M',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a time you missed a deadline or shipped something broken.',
    tags: [ 'ownership', 'delivery' ],
    related: [ 'behav-1', 'behav-11', 'behav-39' ],
    listenFor: `- Picks a real miss with a real cost — not a humble-brag ("I shipped one day late because I wrote extra tests")
- Owns their own share precisely ("I didn't test on API 26", "I didn't flag the risk at the week-2 checkpoint") without blame-shifting
- Separates the immediate recovery (hotfix, rollback, comms) from the root cause in their own process
- A concrete behaviour change that has since been applied on a later project — the proof the lesson stuck`,
    starGuide: `- **S** — what was promised, to whom, and what broke or slipped (with the cost).
- **T** — your part of the commitment.
- **A** — how you found out, what you did in the first day (told people, contained it), and the root cause in your own process.
- **R** — the recovery outcome, then the one habit you changed and where you have used it since.`,
    redFlags: `- Blames others entirely ("the PM changed requirements", "CI was flaky")
- Minimizes the impact ("it wasn't a big deal")
- The "lesson" is generic ("communicate more") with no changed behaviour
- Claims never to have missed a deadline or shipped anything broken`
  },
  {
    id: 'behav-3',
    type: 'behavioral',
    num: 3,
    difficulty: 'E',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a production incident you handled under pressure. What did you do first, and what changed afterwards?',
    tags: [ 'ownership', 'incident', 'incident-response', 'post-mortem', 'production', 'walmart' ],
    related: [ 'behav-1', 'behav-56', 'behav-71', 'behav-72' ],
    listenFor: `- Quantifies the impact (users affected, crash-free rate drop, revenue or SLA hit) — not just "it was bad"
- Clear triage order: mitigate first (halt the staged rollout, flip the remote-config kill switch, roll back the server change) → communicate → diagnose → fix → postmortem
- Knows mobile's constraint: a shipped binary cannot be recalled, so mitigation lives in rollout halts, server-side flags and forced-update paths
- Can say exactly what they did in the first 10 minutes, and how they coordinated others (incident channel, a comms owner) rather than solo-heroing or fully delegating
- Names the durable systemic fix (alert, runbook, canary gate, test) — not just "we hotfixed it"

**Context:** also asked verbatim in Walmart senior-track rounds.`,
    starGuide: `- **S** — the incident in one line with its numbers: what broke, for whom, how it was detected.
- **T** — your role (on-call, release owner, the engineer closest to the change) and the goal: stop user harm, then prevent recurrence.
- **A** — the first 10 minutes (contain), the comms cadence you set, the diagnosis evidence, the fix and how it reached users (hotfix release vs server flag).
- **R** — time to mitigate, final impact, and the systemic change from the postmortem that is still in place.`,
    redFlags: `- Panic-driven response with no prioritization — debugging before containing
- No communication to users or stakeholders during the incident
- No follow-up to prevent recurrence ("we fixed it and moved on")
- Solo-hero narrative, or waited for someone else to lead a problem they owned
- Cannot quantify impact or say what they did in the first 10 minutes
- Blames an individual or another team instead of the system`
  },
  {
    id: 'behav-4',
    type: 'behavioral',
    num: 4,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a code review where you strongly disagreed with feedback.',
    tags: [ 'collaboration', 'code-review' ],
    related: [ 'behav-5', 'behav-38', 'behav-75' ],
    listenFor: `- Stays curious — asks "why" before defending their approach
- Separates ego from code; argues trade-offs on merit (testability, threading, recomposition cost, API surface)
- Moves a long comment thread to a call or a quick prototype/benchmark instead of a 30-comment PR war
- Finds an option that satisfies both concerns, or brings in a third engineer / an existing guideline as tie-breaker
- Distinguishes a blocking concern from a style preference — and turns a repeated disagreement into a written team convention`,
    starGuide: `- **S** — the PR and the comment, stated fairly from the reviewer's side.
- **T** — what was at stake (correctness, consistency, a deadline) and why you disagreed.
- **A** — how you engaged: asked for their reasoning, moved to a call, brought evidence (benchmark, doc, prototype), what you conceded.
- **R** — what merged, how the relationship held up, and whether it became a guideline so the debate did not recur.`,
    redFlags: '- Dismisses the reviewer without genuinely engaging with their concern\n- Becomes defensive or takes the criticism personally\n- Caves immediately without understanding the reviewer\'s reasoning ("I just changed it to make them happy")\n- Has never disagreed with a reviewer (suggests low engagement or conflict-avoidance)'
  },
  {
    id: 'behav-5',
    type: 'behavioral',
    num: 5,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Describe a conflict with a coworker or cross-team peer. How did you resolve it?',
    tags: [ 'collaboration', 'communication', 'conflict', 'walmart', 'hr' ],
    related: [ 'behav-4', 'behav-22', 'behav-38', 'behav-72' ],
    listenFor: `- Went to the person directly and early, assuming good intent, rather than letting it fester
- Separates the problem from the person; finds the shared goal underneath
- Genuinely understands the other side's constraints, incentives or context — and can state their view charitably
- Uses data or a spike to settle technical disagreements instead of seniority or persistence
- Resolved it without manager intervention, or escalated with context rather than complaint
- Takes partial ownership even if the other party was more at fault, and the relationship survived

**Context:** Walmart's #3 sourced HR question (AmbitionBox top-3).`,
    starGuide: `- **S** — who, what the friction was about (prefer a technical or prioritization disagreement), and the cost of leaving it.
- **T** — your goal: a decision both sides could live with, and a working relationship afterwards.
- **A** — the direct conversation, what you learned about their constraints, the evidence or option that broke the deadlock, any escalation and how you framed it.
- **R** — the decision, the state of the relationship after, and what you do differently since.`,
    redFlags: `- "They were just wrong" — no empathy or attempt to understand the other perspective
- Avoids conflict until it explodes
- Wins the argument but loses the relationship
- Escalates to a manager as the first move, or for every interpersonal disagreement
- The conflict was never actually resolved
- Blames entirely without acknowledging any role they played`
  },
  {
    id: 'behav-6',
    type: 'behavioral',
    num: 6,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a time you disagreed with a product decision or said no to a feature request. How did you influence the outcome?',
    tags: [ 'collaboration', 'product', 'influence', 'disagreement', 'communication' ],
    related: [ 'behav-12', 'behav-41', 'behav-49', 'behav-76' ],
    listenFor: `- Engages with the underlying goal first ("what metric is this meant to move?") before arguing the solution
- Frames the concern with data or user impact — crash/ANR risk, battery or data cost, accessibility, a Play policy — not personal preference
- Says no with a reason and a costed alternative: a smaller version, a phased rollout, an experiment, or a later date
- Raised it early (at spec/estimation), not after implementation
- Gets alignment on the trade-off rather than quietly dropping the request; stands firm under social pressure unless new information arrives
- Respects the final call once made — disagree and commit — and can say how it played out`,
    starGuide: `- **S** — the decision or request as product framed it, and the goal behind it.
- **T** — your concern (cost, risk, user harm) and why it was yours to raise.
- **A** — how you raised it (when, with what data), the alternative you proposed with its cost, who else you brought in, and what you did once the call was made.
- **R** — what shipped, what the data showed afterwards, and how the relationship with the PM held up.`,
    redFlags: `- Always agrees with product regardless of feasibility or quality concerns
- Says no without a reason or alternative — a dead end
- Pushes back aggressively or emotionally; holds a grudge after the decision
- Pushes back as a default without engaging with the underlying goal
- Lets the requester route around them instead of owning the decision
- Changes position under social pressure without new information`
  },
  {
    id: 'behav-7',
    type: 'behavioral',
    num: 7,
    difficulty: 'M',
    star: true,
    section: 'Growth & Culture',
    title: 'Tell me about ramping up quickly on an unfamiliar codebase or system.',
    tags: [ 'learning', 'onboarding', 'growth' ],
    related: [ 'behav-8', 'behav-24', 'behav-50' ],
    listenFor: `- A systematic approach: dev environment first, then trace one critical path end to end (e.g. app start → DI graph → navigation → one screen's ViewModel → repository → network)
- Reads the module graph, Gradle setup, existing conventions and tests before writing new code
- Asks targeted questions of the right people, and doesn't ask the same one twice
- Ships something small and validated early (a bug fix, a flaky test) to build context and credibility
- Leaves the codebase better documented than they found it — an onboarding doc, an architecture diagram, a fixed README`,
    starGuide: `- **S** — the codebase and its size/age (modules, legacy Java/XML vs Kotlin/Compose, team count).
- **T** — what you had to deliver and by when.
- **A** — your first two weeks: environment, the path you traced, who you asked, the first small change you shipped, and the notes you wrote.
- **R** — time to first meaningful contribution, and the onboarding artefact you left for the next person.`,
    redFlags: `- Jumped straight to writing code without understanding the system, and broke conventions
- Spent weeks reading before touching anything
- Relied entirely on a buddy and never developed independent understanding
- Skipped documentation and tests as sources of understanding
- No strategy — just trial and error`
  },
  {
    id: 'behav-8',
    type: 'behavioral',
    num: 8,
    difficulty: 'M',
    star: false,
    section: 'Growth & Culture',
    title: 'Tell me about a technology or framework you had to learn fast to unblock a project.',
    tags: [ 'learning', 'adaptability', 'unblock' ],
    related: [ 'behav-7', 'behav-44', 'behav-29' ],
    listenFor: `- Scopes the learning to the slice the project's critical path needs, not the whole technology surface
- Triangulates official docs with real-world signals: release notes, issue trackers, how other teams run it in production
- Timeboxes spikes and knows when to ask an expert vs. keep digging
- Experiments against the actual project constraint and can say what the docs left out or got wrong
- Delivered something working within the constraint, then transferred it — notes, an internal sample, a write-up so the next person ramps faster`,
    starGuide: `- **S** — the project, the blocker, and the deadline.
- **T** — what you did not know (e.g. Compose interop, a KMP module, Baseline Profiles, a new CI system) and the slice you actually needed.
- **A** — how you learned it: sources, the spike and its timebox, who you asked, the surprise the docs did not mention.
- **R** — what shipped, and what you left behind for the team.`,
    redFlags: `- Cannot recall learning anything new in the last year
- "I just Googled it" without describing any depth of understanding
- No structure — no timebox, no scoping to what the project needed
- Relied entirely on a colleague to explain everything
- Learned just enough to unblock themselves; nothing transferred to the team`
  },
  {
    id: 'behav-9',
    type: 'behavioral',
    num: 9,
    difficulty: 'M',
    star: true,
    section: 'Growth & Culture',
    title: 'Tell me about critical feedback you received that was hard to hear. How did you respond?',
    tags: [ 'growth', 'feedback', 'self-awareness' ],
    related: [ 'behav-15', 'behav-16', 'behav-74' ],
    listenFor: `- Remembers specific, concrete feedback — and it is genuinely critical, ideally about how they work with people (e.g. "your reviews read as gatekeeping", "you solve it yourself instead of growing the team")
- Honest about the first reaction, then asked clarifying questions to understand it before responding
- A concrete behaviour change, with visible follow-through months later
- Went back to the person who gave it to close the loop and check the change landed
- Bonus signal: also takes feedback from juniors or peers, not just their manager`,
    starGuide: `- **S** — who gave it, in what context, and the words as close as you remember them.
- **T** — why it stung, and what it put at risk (your effectiveness, a relationship, a promotion case).
- **A** — your first reaction, how you dug into it (examples asked for, other people consulted), and the specific habit you changed.
- **R** — the evidence it changed (later feedback, a metric, a relationship), and how you closed the loop with the giver.`,
    redFlags: `- Cannot recall specific critical feedback, or "I've never received any" — not credible
- Defensive — explains why the feedback was wrong rather than what they did with it
- Acknowledged it but never changed behaviour, or the change didn't stick
- Feedback so mild it doesn't qualify as critical ("work on your documentation")`
  },
  {
    id: 'behav-10',
    type: 'behavioral',
    num: 10,
    difficulty: 'M',
    star: true,
    section: 'Delivery',
    title: 'When is code good enough to ship? Tell me about a time you balanced moving fast with quality.',
    tags: [ 'delivery', 'quality', 'culture' ],
    related: [ 'behav-11', 'behav-53', 'behav-70' ],
    listenFor: `- Treats it as a context-dependent trade-off and names the factors: blast radius, reversibility, user-facing risk, test coverage of the risky path
- Knows mobile's asymmetry: a server change rolls back in minutes, a shipped APK lives on devices for months — so the bar for client code, migrations and persisted formats is higher
- Ships with safety nets sized to the risk: feature flag / remote config kill switch, staged rollout percentages, crash and ANR monitoring, a server-side fallback
- Separates what cannot be compromised (data loss, security, crash paths, schema migrations) from what can (polish, edge-case UI, internal refactors)
- Writes the deferred work down and actually returns to it`,
    starGuide: `- **S** — the pressure to move fast (launch date, competitor, experiment window).
- **T** — the quality risk you had to manage.
- **A** — what you explicitly traded and what you protected, the guardrails you shipped behind (flag, staged rollout, alert), and how you told stakeholders.
- **R** — what happened in production, and when/how the deferred work was paid back.`,
    redFlags: `- Perfectionism that blocks delivery: "I never ship unless it's fully refactored and tested"
- No quality bar at all: "ship it, we'll fix it later" with no risk assessment or rollback path
- Cannot articulate which factors they weigh, or treats client and server changes as equally reversible
- Ships fast and never cleans up the resulting debt`
  },
  {
    id: 'behav-11',
    type: 'behavioral',
    num: 11,
    difficulty: 'M',
    star: true,
    section: 'Delivery',
    title: 'Tell me about a time you had to cut scope or prioritize ruthlessly to meet a deadline.',
    tags: [ 'delivery', 'prioritization', 'scope' ],
    related: [ 'behav-10', 'behav-12', 'behav-39' ],
    listenFor: `- An explicit framework: user value vs. effort, must-have vs. nice-to-have, reversible vs. irreversible cuts
- Cuts scope, not quality — e.g. ships one entry point behind a flag, drops tablet/landscape polish, defers offline support, but keeps crash paths and data integrity
- Made hard calls rather than "we worked nights and weekends" — stamina is not prioritization
- Communicated the cuts proactively; stakeholders knew what was in and out before the date, not on it
- Documented deferred work and actually came back to it after the release`,
    starGuide: `- **S** — the deadline, why it was fixed, and how far over the original scope was.
- **T** — what had to land for the release to still be worth shipping.
- **A** — the framework you used, the specific cuts (and what you refused to cut), who agreed, and how you tracked the deferred work.
- **R** — what shipped on the date, its impact, and when the deferred items landed (or why they were rightly dropped).`,
    redFlags: `- "We just worked nights and weekends" — stamina, not prioritization
- Cut quality silently (tests, error handling, accessibility) without stakeholder buy-in
- Cut scope without telling PM or stakeholders
- No framework — ad hoc cuts
- Never revisited the deferred work, or missed the deadline anyway without calling it early`
  },
  {
    id: 'behav-12',
    type: 'behavioral',
    num: 12,
    difficulty: 'E',
    star: false,
    section: 'Delivery',
    title: 'How do you handle competing priorities from multiple stakeholders?',
    tags: [ 'delivery', 'communication', 'walmart', 'prioritization' ],
    related: [ 'behav-11', 'behav-22', 'behav-6' ],
    listenFor: `- Uses an explicit prioritization framework (user impact, revenue or risk, deadline, dependencies) and can show it was applied, not invented afterwards
- Puts the conflict in front of the people who own the trade-off (both stakeholders, or their common manager/PM) rather than choosing silently
- Surfaces conflicts before they become crises; escalates when genuinely blocked rather than silently context-switching
- Negotiates timelines and scope openly rather than over-promising to both
- Protects the team from thrash by saying no with clear reasons, and documents the decision so it isn't re-litigated`,
    starGuide: `- **S** — the two (or more) asks, who wanted each, and why they collided.
- **T** — the capacity you actually had.
- **A** — the framework you applied, the conversation where the trade-off was decided (and by whom), what you said no or "later" to, and how you recorded it.
- **R** — what shipped for each stakeholder, and how both relationships held up.`,
    redFlags: '- Tries to do everything simultaneously and burns out or delivers nothing well\n- Picks a priority without communicating the decision to the other stakeholders\n- No escalation path — just figures it out alone until something slips\n- Over-promises to both parties and misses both deadlines\n- Prioritizes based on whoever pushed hardest rather than an actual framework'
  },
  {
    id: 'behav-13',
    type: 'behavioral',
    num: 13,
    difficulty: 'M',
    star: true,
    section: 'Delivery',
    title: 'Tell me about an improvement nobody asked for that you drove — for example one that raised engineering velocity.',
    tags: [ 'initiative', 'growth', 'velocity', 'leadership' ],
    related: [ 'behav-21', 'behav-35', 'behav-59' ],
    listenFor: `- Identified the problem themselves — not assigned or prompted by a manager
- Measured the pain before fixing it: Gradle build or CI time, flaky-test rate, release cadence, time-to-first-PR for new joiners
- Made a case for why it mattered and fitted it around committed work rather than going dark
- Shipped something concrete — build-cache/config-cache adoption, module split, convention plugins, a test-sharding setup, a release script — not just a ticket
- Got buy-in from the people it affected, and measured the before/after (e.g. "clean build 14 → 6 min, CI p50 25 → 11 min")
- The improvement outlived them: documented, owned, still in use`,
    starGuide: `- **S** — the recurring pain you noticed and its measured cost.
- **T** — why you took it on without being asked, and how you made room for it.
- **A** — the case you made, the smallest version you shipped first, how you got others to adopt it.
- **R** — the before/after number, who benefited, and whether it is still running.`,
    redFlags: `- Waits to be assigned everything — no examples of self-directed improvement work
- "I thought about it but didn't have time" — ideas without execution
- No measurable impact, or initiative had no lasting effect
- Made a change without coordinating with the team it affected
- Takes sole credit for what others built, or the improvement only benefited themselves`
  },
  {
    id: 'behav-15',
    type: 'behavioral',
    num: 15,
    difficulty: 'M',
    star: true,
    section: 'Growth & Culture',
    title: 'What\'s a weakness or blind spot you\'re actively working on?',
    tags: [ 'growth', 'self-awareness', 'walmart', 'hr' ],
    related: [ 'behav-16', 'behav-9', 'behav-8' ],
    listenFor: '- Genuinely self-aware — names a real weakness, not a strength in disguise ("I care too much")\n- Specific behavior they are actively changing, not vague intention\n- Concrete evidence of progress (e.g., "my last three code reviews had no feedback on X")\n- Understands why the weakness matters for their effectiveness\n- Self-aware about its impact on others — reviews, teammates, delivery — not just on themselves\n\n**Context:** Also verified as a Walmart top-3 sourced HR question (AmbitionBox).',
    starGuide: `- **S** — the weakness, named as a behaviour (e.g. "I hold onto hard problems too long before asking", "I under-communicate status on long tasks").
- **T** — where it showed up and what it cost someone else.
- **A** — the specific mechanism you use now (a timebox, a weekly written update, a review checklist) and who holds you to it.
- **R** — evidence of progress, and honestly where it still slips.`,
    redFlags: '- No real weakness — interview-polished answer with zero substance\n- Vague answer that doesn\'t name a specific behavior ("I\'m still learning")\n- Weakness that would be disqualifying for this role with no mitigation plan\n- Describes a weakness but shows no active effort to address it'
  },
  {
    id: 'behav-16',
    type: 'behavioral',
    num: 16,
    difficulty: 'E',
    star: false,
    section: 'Growth & Culture',
    title: 'Looking back on a project, what would you do differently?',
    tags: [ 'growth', 'retrospective' ],
    related: [ 'behav-15', 'behav-9', 'behav-36', 'behav-65' ],
    listenFor: `- Honest retrospective — names a real decision they regret (architecture, sequencing, who they involved), not a minor polish item
- Explains why the decision looked right with the information they had then — no hindsight self-flagellation
- Articulates a concrete alternative they would take today, and its own cost
- Applies the learning to subsequent work (not just insight without transfer)`,
    starGuide: `- **S** — the project and its outcome in one line.
- **T** — the decision you would change, and what you knew when you made it.
- **A** — what it cost later, what you would do instead, and what that alternative would have cost.
- **R** — where you have applied that lesson since.`,
    redFlags: '- "Everything was great" — no real retrospective or genuine reflection\n- Blames the team, the tools, or the timeline without owning any part of it\n- Cannot identify a specific decision — only vague "we could have communicated better"\n- The lesson is one they had to learn but still haven\'t applied'
  },
  {
    id: 'behav-17',
    type: 'behavioral',
    num: 17,
    difficulty: 'M',
    star: true,
    section: 'Growth & Culture',
    title: 'Tell me about a time you used data to make or change a decision.',
    tags: [ 'culture', 'data' ],
    related: [ 'behav-10', 'behav-19', 'behav-79' ],
    listenFor: `- Defines the right metric upfront — not just "looked at analytics" (e.g. cold-start p90, crash-free users, ANR rate, funnel conversion by app version)
- Instruments what was missing rather than deciding blind — added a trace, an event, a Macrobenchmark
- Interprets critically: sample size, selection bias (only users on the new version), device-tier skew, lagging indicators
- Changes course when data contradicts their assumption — the key signal
- Doesn't cherry-pick results that confirm their prior view`,
    starGuide: `- **S** — the decision on the table and the opinion people held before looking.
- **T** — what you needed to know to decide.
- **A** — the metric you chose, how you got the data (existing dashboards or new instrumentation), the caveats you checked.
- **R** — what the data said, whether it changed the decision (or your mind), and the outcome.`,
    redFlags: '- Relies purely on gut with no data to support technical or product decisions\n- Cannot name a specific metric they tracked or instrument they used\n- Ignores data that contradicts their assumption ("the metric was wrong")\n- Uses data only to confirm a decision already made, not to inform it'
  },
  {
    id: 'behav-19',
    type: 'behavioral',
    num: 19,
    difficulty: 'E',
    star: false,
    section: 'Growth & Culture',
    title: 'How do you think about customer impact when making technical decisions?',
    tags: [ 'culture', 'product' ],
    related: [ 'behav-17', 'behav-6' ],
    listenFor: `- Centers user experience in technical choices — e.g. "I cared about cold start because it drives first-session retention", "we kept the old flow for users on low-end devices"
- Thinks beyond the happy path: offline and flaky networks, process death, low-RAM devices, accessibility (TalkBack, font scaling), older OS versions still in the install base
- Uses user-facing metrics (crash-free users, ANR rate, startup and frame-time vitals, retention) to set technical priorities
- Connects tech debt and reliability to users, and can name a case where user impact overrode an engineering preference`,
    starGuide: `- **S** — the technical choice on the table and the user group it touched.
- **T** — the user outcome you were protecting (speed, reliability, accessibility, data cost).
- **A** — how you got the user signal (metrics, support tickets, device-tier data, usability sessions) and how it changed the technical decision.
- **R** — the user-facing metric before and after.`,
    redFlags: '- "That\'s the PM\'s job" — abdication of any responsibility for user outcomes\n- Purely inward-facing technical thinking: performance matters because it\'s elegant, not because it affects users\n- No mention of users, customers, or the end experience in technical reasoning\n- Optimizes for developer experience exclusively with no connection to user impact'
  },
  {
    id: 'behav-20',
    type: 'behavioral',
    num: 20,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Tell me about a time you disagreed with a technical decision made by your manager or tech lead.',
    tags: [ 'influence', 'conflict', 'leadership' ],
    related: [ 'behav-21', 'behav-49', 'behav-75' ],
    listenFor: `- Raises disagreement constructively — data, a benchmark, a prototype, or a written risk analysis, not just opinion
- Picks the right forum: private first, not ambushing the lead in a group meeting
- Steelmans the lead's position — knows what constraints (deadline, staffing, org direction) they were optimising for
- Proposes a way to reduce the risk of being wrong: a timeboxed spike, a reversible first step, a checkpoint to revisit
- Commits fully once decided, and knows when to escalate vs. let it go`,
    starGuide: `- **S** — the decision (e.g. a state-management pattern, a big-bang rewrite, a third-party SDK) and who made it.
- **T** — your concern and what it put at risk.
- **A** — how and where you raised it, the evidence you brought, what you learned about their constraints, and the compromise or checkpoint proposed.
- **R** — the final call, how you executed it, and how it turned out — including if you were wrong.`,
    redFlags: '- Never disagrees (lack of backbone or just telling me what I want to hear)\n- Went around their lead instead of having a direct conversation\n- Still harbors resentment — hasn\'t committed to the decision\n- Can\'t articulate a technical argument — just \'felt wrong\''
  },
  {
    id: 'behav-21',
    type: 'behavioral',
    num: 21,
    difficulty: 'M',
    star: true,
    section: 'Leadership',
    title: 'Tell me about a time you influenced a decision without having formal authority.',
    tags: [ 'influence', 'leadership', 'communication', 'walmart' ],
    related: [ 'behav-20', 'behav-30', 'behav-75', 'behav-43' ],
    listenFor: `- Built a case with evidence: benchmarks, user data, incident postmortems — not just conviction
- Mapped the stakeholders and their incentives (a feature team's roadmap, a PM's OKR, an iOS lead's parity concern) and framed the argument in their terms
- Lowered the cost of saying yes: a pilot on one module, a reversible first step, doing the first migration themselves
- Got buy-in from key people one-on-one before the formal discussion
- Knew when to push harder and when to plant the seed and wait
- Outcome improved the system as a whole, not just a personal win`,
    starGuide: `- **S** — the change you wanted and why you had no authority to mandate it.
- **T** — who had to say yes, and what each of them cared about.
- **A** — the evidence you built, the one-on-ones, the objection that nearly sank it and how you handled it, the pilot that made yes easy.
- **R** — adoption (how many teams/modules/people), the measurable effect, and what you would do differently.`,
    redFlags: '- Relies on title or seniority to get their way\n- Gives up if the first attempt fails — no persistence\n- Can\'t explain how they read the room or adapted their approach\n- Influenced by steamrolling instead of genuine persuasion\n- Went over heads as the first move instead of building the case\n- No empathy for the other team\'s or stakeholder\'s constraints\n- Claims credit for what was actually a committee or team outcome'
  },
  {
    id: 'behav-22',
    type: 'behavioral',
    num: 22,
    difficulty: 'M',
    star: false,
    section: 'Collaboration',
    title: 'Tell me about a time you worked across teams with conflicting priorities.',
    tags: [ 'collaboration', 'conflict', 'cross-team' ],
    related: [ 'behav-12', 'behav-5', 'behav-58', 'behav-73' ],
    listenFor: `- Sought to understand the other team's constraints and goals (their OKRs, their release train, their on-call load) before pushing their own agenda
- Found shared ground: a sequenced plan, a smaller ask, an offer to do part of the work in the other team's codebase
- Escalated only after genuine attempts at resolution, and framed it as "help us choose" with the trade-off laid out — not as a complaint
- Maintained a good relationship after the conflict was resolved`,
    starGuide: `- **S** — the two teams, what each needed, and where the priorities collided.
- **T** — what your team needed from them, by when.
- **A** — how you learned their constraints, the options you put on the table, what you offered in return, and any escalation and its framing.
- **R** — what both teams shipped, and the state of the relationship after.`,
    redFlags: '- Immediately escalates to management as first resort\n- Assumes the other team is unreasonable without understanding their context\n- "Won" the conflict but damaged the relationship\n- No mention of the other team\'s perspective — only their own'
  },
  {
    id: 'behav-24',
    type: 'behavioral',
    num: 24,
    difficulty: 'H',
    star: true,
    section: 'Growth & Culture',
    title: 'Tell me about a time you mentored or grew a junior engineer.',
    tags: [ 'growth', 'mentoring', 'leadership', 'mentorship', 'technical' ],
    related: [ 'behav-38', 'behav-45', 'behav-80' ],
    listenFor: `- Diagnosed the actual gap first (e.g. coroutine cancellation and structured concurrency, Compose state hoisting, debugging method, scoping work) rather than mentoring ad hoc
- Met the mentee where they were — asked guiding questions instead of handing over answers
- Delegated real ownership: the junior drove a meaningful piece of work while the mentor reviewed and unblocked, not the reverse
- Feedback targeted the reasoning (how they debugged, how they chose the approach), not just the final code
- Made time consistently despite their own workload, and adjusted their style to what worked for this person
- Measurable progress: the mentee shipped something they could not have before, led a design review, or got promoted`,
    starGuide: `- **S** — who the mentee was and where they were stuck.
- **T** — the gap you diagnosed and the growth goal you agreed with them (and their manager).
- **A** — the work you delegated, the structure you used (pairing, design-doc reviews, weekly 1:1), how you gave feedback, and what you changed when something did not land.
- **R** — what they can now do independently, with evidence; what you learned about mentoring.`,
    redFlags: `- Only helped when asked (reactive, not proactive mentoring)
- Did the work for them instead of teaching
- Can't articulate what the mentee learned — mentoring was just pairing
- No follow-up to see if their help actually landed
- Takes credit for the mentee's outcome rather than describing the mentee's growth`
  },
  {
    id: 'behav-26',
    type: 'behavioral',
    num: 26,
    difficulty: 'H',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a time you navigated ambiguous or unclear requirements.',
    tags: [ 'ownership', 'ambiguity', 'communication', 'initiative' ],
    related: [ 'behav-81', 'behav-47', 'behav-6' ],
    listenFor: `- Didn't wait to be unblocked — proactively sought out what they needed
- Made explicit assumptions and wrote them down (a one-page brief, open questions with owners) before building
- Built a prototype or thin vertical slice to validate direction before investing heavily
- Looped in the right people at the right time — not too early (waste), not too late (rework)
- Kept stakeholders aligned through the changes so there were no surprises at demo time
- Designed for change when uncertainty was high — feature flags, server-driven config, reversible decisions`,
    starGuide: `- **S** — what was unclear (the goal, the users, the edge cases, the owner).
- **T** — what you had to deliver despite it.
- **A** — the questions you asked and of whom, the assumptions you wrote down, the prototype/slice you used to test them, and how you decided you knew enough to commit.
- **R** — what shipped, how much rework the early validation avoided, and which assumption turned out wrong.`,
    redFlags: '- Waits for perfect requirements before starting anything\n- Builds something large based on unvalidated assumptions\n- Never writes down their assumptions — just proceeds on vibes\n- Escalates every ambiguity to their manager instead of resolving at their level\n- Becomes frustrated or disengaged rather than adapting when requirements shift'
  },
  {
    id: 'behav-29',
    type: 'behavioral',
    num: 29,
    difficulty: 'M',
    star: true,
    section: 'Growth & Culture',
    title: 'How do you stay current with Android and mobile development? Give a recent example.',
    tags: [ 'culture', 'growth', 'android' ],
    related: [ 'behav-8', 'behav-35' ],
    listenFor: `- Specific, recent sources: Android Developers Blog and release notes, Now in Android, Google I/O / Android Dev Summit, KotlinConf, AOSP and issue-tracker threads, a few named practitioners or newsletters
- Can name a specific recent change and its impact on their app — e.g. a targetSdk behaviour change (edge-to-edge enforcement, foreground-service types, predictive back), a K2 compiler or Compose release, a Play policy deadline
- Evaluates before adopting — reads the stability level (alpha/beta/stable), checks the cost of early adoption
- Applies it at work and shares it: a tech talk, a migration guide, a lint rule or a PR that upgrades the team`,
    starGuide: `- **S** — the change you learned about and where you heard of it.
- **T** — why it mattered for your app or team (a deadline, a risk, an opportunity).
- **A** — how you evaluated it (spike, docs, sample), how you brought it into the codebase, how you shared it.
- **R** — what changed in the product or the team's practice.`,
    redFlags: `- Generic sources only ("I read blogs") and cannot name a recent change
- Adopts every alpha library on release with no stability or cost assessment
- Learns but doesn't apply or share — knowledge stays siloed
- Learns only through assigned work — no investment beyond it`
  },
  {
    id: 'behav-30',
    type: 'behavioral',
    num: 30,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Tell me about a time you defined the technical direction for a platform, codebase, or team. How did you get people to actually follow it?',
    tags: [ 'staff', 'leadership', 'technical-direction', 'influence' ],
    related: [ 'behav-21', 'behav-31', 'sd-20', 'sd-22' ],
    listenFor: '- Named a concrete decision they owned — not "we decided to use X" but what *they* drove\n- Built the case before deciding: prototyped, benchmarked, analyzed tradeoffs\n- Got buy-in from peers and senior engineers *before* mandating — persuasion before authority\n- Documented it durably (ADR, RFC, wiki) so the decision survives them leaving the team\n- Created a migration path and escape hatches — not all-or-nothing adoption\n\n**The key signal:** Can they distinguish "things I personally preferred" from "decisions that genuinely served the team"?',
    starGuide: `- **S** — the platform/codebase and the problem with the status quo (e.g. three competing architecture patterns across feature modules).
- **T** — the direction you owned and its scope.
- **A** — the evidence (prototype, benchmark, incident data), the RFC/ADR, the skeptics you brought along one-on-one, the reference implementation and the escape hatches.
- **R** — adoption measured (modules/teams on the new path), the effect, and how the decision is kept current now.`,
    redFlags: '- Mandated the decision by seniority without explanation — engineers don\'t understand why and quietly ignore it\n- Made the decision in isolation — others feel no ownership and resist passively\n- Never wrote anything down — direction lives only in their head and erodes over time\n- Confused personal preference with team benefit'
  },
  {
    id: 'behav-31',
    type: 'behavioral',
    num: 31,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Tell me about driving a large-scale technical migration (architecture change, framework swap, platform upgrade). How did you plan it, maintain momentum, and handle resistance?',
    tags: [ 'staff', 'leadership', 'migration', 'technical-direction' ],
    related: [ 'behav-30', 'behav-35' ],
    listenFor: `- Phased plan with clear milestones — not a big-bang rewrite that requires stopping all feature work
- Made the case in terms of user impact, engineering velocity, or reliability — not just "it's technically better"
- Strangler-fig / interop period: new and old coexist (ComposeView/AndroidView interop, a dual-read network layer, KAPT and KSP side by side) and teams migrate on their own schedule
- Cross-team mechanics: an inventory of call sites per team, a tracking dashboard, codemods or lint rules that stop new usage of the old path, a deprecation date agreed with every owning team
- Found early adopters, demonstrated wins, and did the hardest first migration themselves
- Support infrastructure: migration guide, helper tooling, office hours, one-on-one unblocking

**The key signal:** Did they ship the migration or just start it? What's the measurable before/after, and was the old path actually deleted?`,
    starGuide: `- **S** — the migration (e.g. Views → Compose, RxJava → coroutines/Flow, monolith → feature modules, KAPT → KSP), its scale (modules, teams), and why now.
- **T** — your role and what "done" meant (old path deleted, not just new path available).
- **A** — the phasing, the interop strategy, how you kept momentum across teams (tracking, guard-rails, codemods), and the biggest blocker or resistance and how you resolved it.
- **R** — percentage migrated, the measured win (build time, crash rate, velocity), and the date the old code was removed.`,
    redFlags: `- Announced the migration and expected it to happen — no execution plan, no support structure
- Froze feature development to focus on migration (unsustainable, creates org conflict)
- Couldn't articulate why the migration was necessary — "it just felt wrong"
- Made it all-or-nothing — no interop period, forced teams to migrate or be blocked
- Left a permanent half-migrated state with two patterns and no end date`
  },
  {
    id: 'behav-32',
    type: 'behavioral',
    num: 32,
    difficulty: 'M',
    star: true,
    section: 'Leadership',
    title: 'Tell me about a build-vs-buy (or build-vs-adopt-open-source) decision you drove. How did you evaluate it?',
    tags: [ 'staff', 'leadership', 'build-vs-buy', 'decision-making' ],
    related: [ 'behav-30', 'behav-36' ],
    listenFor: '- Defined evaluation criteria upfront: cost, control, maintenance burden, fit — not just "this library looks good"\n- Considered total cost of ownership: build cost is obvious, long-term maintenance is what kills you\n- Timeboxed a spike/POC before deciding — theory is insufficient for complex build-vs-buy calls\n- Considered opportunity cost: what doesn\'t get built if we build this ourselves?\n- Made a defensible decision, not just the technically interesting one\n\n**Framework they should be able to name:**\n- **Build when**: core differentiator, unique requirements, OSS doesn\'t fit, maintenance burden would be low\n- **Buy/adopt OSS when**: commodity functionality, active community, team lacks deep expertise, speed matters',
    starGuide: `- **S** — the capability needed (e.g. image loading, analytics, feature flags, a networking or DI library) and the options.
- **T** — your role in the decision and the constraint (time, team size, compliance, APK size).
- **A** — the criteria you set up front, the timeboxed spike, total cost of ownership (licence, SDK size, startup cost, privacy review, upgrade cadence), who you involved.
- **R** — the decision, and how it looked a year or two later.`,
    redFlags: '- Always builds (NIH — Not Invented Here syndrome)\n- Always adopts OSS without evaluating long-term maintenance risk or fit\n- Made the decision alone — didn\'t involve infra, security, or legal where relevant\n- Chose based on hype ("everyone is using X") rather than fit for the specific problem'
  },
  {
    id: 'behav-33',
    type: 'behavioral',
    num: 33,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Tell me about presenting a major technical investment — a rewrite, platform migration, or multi-quarter refactor — to engineering or business leadership. How did you make the case?',
    tags: [ 'staff', 'leadership', 'communication', 'executive-alignment' ],
    related: [ 'behav-30', 'behav-34' ],
    listenFor: '- Translated technical language to business outcomes: "20% faster CI saves $200K/year and 2 hours per engineer per week"\n- Connected technical debt to user impact and business risk — not just developer annoyance\n- Anticipated and pre-addressed the top objections before the meeting\n- Offered options with tradeoffs — not "we must do X" but "here are three paths with different risk and cost profiles"\n- Got sponsorship from at least one senior leader before the formal presentation\n\n**A strong proposal contains:**\n- Problem statement in user/business terms (not technical terms)\n- Current cost (slowed velocity, incident frequency, engineer attrition)\n- Three paths: do nothing, minimal investment, full investment — with tradeoffs\n- Timeline, milestones, resource ask\n- Success metrics (measurable, not vague)',
    starGuide: `- **S** — the investment you proposed and the business pain behind it.
- **T** — the audience, the decision they had to make, and their main worry (cost, risk, roadmap impact).
- **A** — the cost of doing nothing in their terms, the options you offered (do nothing / minimal / full), the sponsor you lined up, how you handled the hardest question.
- **R** — the decision, the resources granted, and whether the promised metrics were hit.`,
    redFlags: '- Presented purely technical rationale — leadership can\'t assess it and defaults to no\n- "We need to do this because it\'s the right thing to do" — no data, no business case\n- No alternatives — came across as closed-minded or having already decided\n- Didn\'t anticipate leadership\'s main concerns (cost, timeline, risk, team impact)'
  },
  {
    id: 'behav-34',
    type: 'behavioral',
    num: 34,
    difficulty: 'H',
    star: false,
    section: 'Leadership',
    title: 'How do you approach technical debt across a large codebase with many contributors? Tell me about a time you drove a debt-reduction effort that actually stuck.',
    tags: [ 'staff', 'leadership', 'technical-debt', 'engineering-culture' ],
    related: [ 'behav-33', 'behav-35', 'behav-53', 'behav-41' ],
    listenFor: `- Has a framework for classifying debt: deliberate (shortcut to ship) vs. inadvertent (didn't know better) vs. bit-rot (entropy, deprecated APIs, targetSdk drift)
- Prioritizes by blast radius and pain — doesn't try to pay off all debt at once
- Makes debt visible and quantifiable: "this module causes 40% of our crash clusters", "every change here takes 3x the review time"
- Builds a sustainable cadence — a standing capacity allocation, not a one-off "debt sprint"
- Gets it into the roadmap by connecting debt to business outcomes

**What 'stuck' looks like:**
- Debt has a dedicated allocation every sprint/quarter, not just when there's slack time
- Tracking is public: tech debt register, tagged in code with context, visible in dashboards
- Guard-rails stop new debt of the same kind (lint rules, module-dependency checks, API-surface checks)`,
    starGuide: `- **S** — the codebase, the contributors, and the debt that hurt most.
- **T** — what you were trying to change: the debt itself, or the way the team handles debt.
- **A** — how you quantified it, how you got it onto the roadmap, the cadence or allocation you set up, the guard-rails that stopped regrowth.
- **R** — the measured improvement, and whether the process is still running without you.`,
    redFlags: '- "We do quarterly debt sprints" — isolated effort, not systemic\n- No data connecting debt to business impact — "it just feels bad"\n- No prioritization — clearing everything first loses team buy-in and PM support\n- Debt stays in people\'s heads — not written down, not tracked, forgotten after the sprint'
  },
  {
    id: 'behav-35',
    type: 'behavioral',
    num: 35,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Tell me about a time you raised the technical quality or standards for an entire team — not just one project. How did you make it stick?',
    tags: [ 'staff', 'leadership', 'engineering-culture', 'quality' ],
    related: [ 'behav-34', 'behav-31', 'behav-59' ],
    listenFor: '- Started with observation and data — not "I think we should do X"\n- Changed the system (processes, tooling, CI gates) not just the people — process beats willpower\n- Demonstrated, didn\'t dictate — wrote the first example, ran the first workshop, did the first review\n- Measured improvement: before/after crash rates, test coverage, review turnaround time\n- Had patience — cultural change is measured in months, not sprints\n\n**Concrete examples of raising the bar (any of these):**\n- Introduced a lint rule that eliminated a whole class of bugs\n- Added a required test coverage gate to CI\n- Created a code review checklist the whole team adopted\n- Set up a tech talk series that normalized knowledge sharing\n- Established an ADR process so architectural decisions are durable',
    starGuide: `- **S** — the team-wide quality problem and its evidence (crash clusters, review churn, flaky CI, regressions per release).
- **T** — the standard you wanted to raise and why it had to be systemic, not one project.
- **A** — the data you started from, the system change (lint rule, CI gate, review checklist, screenshot tests), how you demonstrated it first and earned buy-in.
- **R** — the before/after metric, and proof it is still in place six months later.`,
    redFlags: '- Raised the bar by being more demanding in code review without explaining why — demoralized the team\n- Made process changes without buy-in — people worked around them\n- Can\'t measure the impact — "I think it\'s better now"\n- Did it for one project but it didn\'t spread — no systemic change, just local heroism'
  },
  {
    id: 'behav-36',
    type: 'behavioral',
    num: 36,
    difficulty: 'M',
    star: true,
    section: 'Leadership',
    title: 'How do you evaluate whether a technical decision will hold up over time? Give an example where your prediction was right — or wrong.',
    tags: [ 'staff', 'leadership', 'decision-making', 'technical-judgment' ],
    related: [ 'behav-30', 'behav-37' ],
    listenFor: '- Has concrete dimensions, not just intuition: scalability of the model, coupling to external APIs, team\'s ability to maintain it long-term\n- Applies the \'extension test\': will adding the next feature in this area be easy or painful?\n- Has an example where they were *wrong* — this is more revealing than a success story\n- Knows when \'good enough now\' is the right call even if it won\'t scale\n\n**Framework for evaluation:**\n- **Reversibility**: how hard is it to change if wrong? Prefer reversible decisions at the start.\n- **Coupling**: does this create tight coupling to something that might change (a library version, a third-party API, a platform behavior)?\n- **Extension points**: will adding the 3rd feature in this area be as easy as the 1st?\n- **Cognitive load**: will an engineer who joins in 2 years understand why this exists without finding the Slack thread?',
    starGuide: `- **S** — the decision and the alternatives considered.
- **T** — what you had to predict (scale, team growth, platform direction).
- **A** — the reasoning: reversibility, coupling, the extension test, what you deliberately left out.
- **R** — how it looked one to two years later; if wrong, what signal you missed and how you now check for it.`,
    redFlags: '- Only has examples where they were right — no intellectual honesty\n- "I just go with my gut" — no framework, no transferable reasoning\n- Over-engineers for hypothetical scale that never materializes\n- Never revisits old decisions — treats them as permanent once made'
  },
  {
    id: 'behav-37',
    type: 'behavioral',
    num: 37,
    difficulty: 'H',
    star: false,
    section: 'Leadership',
    title: 'Tell me about a time you had to stop or reverse a technical decision that was already underway — either your own or someone else\'s.',
    tags: [ 'staff', 'leadership', 'decision-making', 'courage' ],
    related: [ 'behav-36', 'behav-30' ],
    listenFor: '- Caught it early — had signals before the full cost was sunk, didn\'t wait until launch\n- Gathered concrete evidence before raising the concern — not just intuition, not just their preference\n- Handled the conversation with empathy — the original decision-maker had to be brought along, not embarrassed\n- Proposed a clear path forward: what to do instead, how to migrate, how to recover gracefully\n- Extracted the lesson: what would have caught this earlier? What process would prevent it next time?\n\n**The key signal:** Did they have the courage to raise it even when it was socially uncomfortable? Did they bring a solution or just a complaint?',
    starGuide: `- **S** — the decision already underway, who owned it, and how much had been invested.
- **T** — the signal that it was wrong and why you were the one to raise it.
- **A** — the evidence you gathered, how you raised it (especially to someone senior), the alternative and recovery path you proposed, how you handled the sunk cost.
- **R** — what was stopped or reversed, the cost saved, and the process change that would catch it earlier next time.`,
    redFlags: '- Never had to stop a decision — suggests they either never make bold bets, or never raise concerns about others\'\n- Reversed it unilaterally without involving the original decision-makers — creates resentment\n- Raised the concern but caved under social pressure without new information\n- No post-mortem — didn\'t extract lessons to prevent it from happening again\n- Describes a very minor course-correction — not a true reversal under pressure'
  },
  {
    id: 'behav-38',
    type: 'behavioral',
    num: 38,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a time you gave critical feedback to a peer. How did you approach it?',
    tags: [ 'collaboration', 'feedback', 'communication' ],
    related: [ 'behav-4', 'behav-45' ],
    listenFor: '- Went directly to the person — not their manager, not other teammates\n- Framed feedback around specific behavior and impact, not personality: "the PR had three unhandled error paths" not "you\'re careless"\n- Was private and timely — not during a group standup or code review in front of others\n- Checked their own intent first: is this to help the person, or to vent?\n- Followed up to see whether anything changed — didn\'t treat feedback as a one-shot event\n\n**What makes feedback land:**\n- Specific example, not a pattern accusation: "In Tuesday\'s PR review..."\n- Impact: "This caused the test suite to take 40% longer"\n- Request: "In the future, could you..."',
    starGuide: `- **S** — the peer, the pattern you observed, and its impact on the team or product.
- **T** — why it was yours to raise, and what you wanted to change.
- **A** — when and where you raised it, the specific example + impact + request you gave, how they reacted, and the follow-up.
- **R** — what changed in their behaviour and in the working relationship.`,
    redFlags: '- Went to their manager instead of talking directly first\n- Gave vague feedback: "your code quality has been low" with no specific examples\n- Never gives critical feedback because they don\'t want to damage the relationship\n- Gave feedback publicly in a way that embarrassed the person'
  },
  {
    id: 'behav-39',
    type: 'behavioral',
    num: 39,
    difficulty: 'M',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a deadline you knew you would miss. How did you deliver the bad news and renegotiate the commitment?',
    tags: [ 'ownership', 'communication', 'accountability', 'deadlines', 'stakeholders', 'negotiation' ],
    related: [ 'behav-2', 'behav-11', 'behav-40', 'behav-47', 'behav-73' ],
    listenFor: `- Communicated early — as soon as the problem was clear, not on the original delivery date
- Came with options and consequences, not just bad news: cut scope to hold the date, slide the date at full scope, or add help — with the risk of each
- Names which axis actually moved (date, scope, quality, people) and why that was the cheapest one to bend
- Quantified what forcing the original date would have cost: defect exposure, rollback risk, on-call load, store-review lead time
- Took ownership of the recovery, not just the announcement, and rebuilt trust by hitting the revised commitment

**What separates strong from weak:**
- Weak: announces the miss the week it's due with no plan
- Strong: flags the risk weeks out with options and a recommendation`,
    starGuide: `- **S** — the commitment, who it was made to, and what changed.
- **T** — when you knew it would slip and what was at stake downstream (a marketing date, a partner integration, a release train).
- **A** — how fast you raised it, the options you brought and your recommendation, the actual conversation, and what was agreed.
- **R** — whether you hit the revised commitment, and what you now do to see slips earlier.`,
    redFlags: `- Waited and hoped the problem would resolve itself — stakeholders heard after the miss, not before
- Minimized the severity to avoid a difficult conversation
- Came without a plan — dropped the news and waited for leadership to solve it
- Frames it as "impossible PM dates" with no data or options
- Only answer is grinding nights and weekends
- Let someone else deliver bad news they were responsible for`
  },
  {
    id: 'behav-40',
    type: 'behavioral',
    num: 40,
    difficulty: 'M',
    star: false,
    section: 'Delivery',
    title: 'Tell me about a time your estimate was significantly wrong. What caused it and what did you change?',
    tags: [ 'estimation', 'delivery', 'planning' ],
    related: [ 'behav-2', 'behav-11', 'behav-39' ],
    listenFor: '- Has a real example — meaningfully off (2x or more), not a minor rounding error\n- Identifies the root cause honestly: unknown unknowns, underestimated complexity, hidden dependencies, scope creep they didn\'t catch\n- Re-estimated as soon as reality diverged — didn\'t stay silent until the deadline passed\n- Describes a concrete change to their estimation process afterward\n- Doesn\'t frame it entirely as external factors\n\n**Common root causes worth probing:**\n- "I estimated the happy path and didn\'t account for edge cases or integration work"\n- "I hadn\'t understood the dependency on another team"\n- "The spike revealed the chosen approach was wrong"\n- "Scope expanded and I absorbed it without re-estimating"',
    starGuide: `- **S** — the work, your estimate, and the actual.
- **T** — who relied on the estimate and what it drove (a launch date, a staffing plan).
- **A** — when you noticed the divergence, how quickly you re-estimated and told people, and the root cause of the gap.
- **R** — the outcome, and the concrete change to how you estimate now (spikes first, ranges with confidence, explicit buffers for integration and store review).`,
    redFlags: '- Blames others for scope changes without acknowledging their own estimation error\n- "Estimates are always wrong" — refuses to reflect or improve\n- Never re-estimates when reality diverges — keeps working toward the original date in silence\n- Pads all estimates by 2x without being transparent about it'
  },
  {
    id: 'behav-41',
    type: 'behavioral',
    num: 41,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about working with a PM who consistently deprioritized technical work. How did you handle it?',
    tags: [ 'collaboration', 'product', 'communication', 'advocacy' ],
    related: [ 'behav-6', 'behav-43' ],
    listenFor: '- Translated technical concerns into business impact: "this component causes 30% of our crashes, affecting X% of DAU"\n- Built the relationship before trying to change prioritization\n- Found a creative compromise: embedded refactors in feature work, negotiated a regular debt allocation\n- Framed technical work as an enabler: "if we fix this, the next feature in this area ships twice as fast"\n- Escalated constructively if needed — involved their engineering lead, didn\'t go around the PM',
    starGuide: `- **S** — the PM, their goals, and the technical work that kept losing.
- **T** — what that work was costing (crashes, velocity, an upcoming targetSdk or library deadline).
- **A** — how you translated it into their metrics, the compromise you negotiated (allocation, bundling with feature work), any escalation and how you kept the relationship.
- **R** — what got prioritized, the measured effect, and how the PM treats technical work now.`,
    redFlags: '- Only vented frustration to other engineers — never addressed it directly\n- Went around the PM to force prioritization — damaged the relationship\n- Framed technical needs in engineering terms the PM couldn\'t evaluate\n- Gave up and shipped increasingly fragile code without escalating'
  },
  {
    id: 'behav-42',
    type: 'behavioral',
    num: 42,
    difficulty: 'E',
    star: false,
    section: 'Collaboration',
    title: 'Tell me about working closely with a designer to implement a feature. How did you handle gaps between the spec and what was feasible?',
    tags: [ 'collaboration', 'design', 'communication' ],
    related: [ 'behav-76', 'behav-6' ],
    listenFor: `- Engaged design early — raised feasibility concerns before the spec was finalized, not after
- Understood what design was trying to achieve (the user outcome), not just what they drew
- Raised constraints clearly with alternatives: "this blur/animation drops frames on low-end devices — here are two options with the same feel"
- Filled the states the comp left out with design, not alone: loading, empty, error, offline, long text, RTL, font scaling, small and large screens
- Built a feedback loop: early builds or a Compose preview/screenshot catalogue designers can review
- Delivered something faithful to the intent even when some details differed from the comp`,
    starGuide: `- **S** — the feature and the design spec.
- **T** — the gap between the spec and what was feasible or complete.
- **A** — when you raised it, the alternatives you prototyped, how you agreed the missing states, and the review loop you set up.
- **R** — what shipped, how close it was to the intent, and what changed in how you and design work together.`,
    redFlags: `- Implemented designs without questioning edge cases — left gaps for users to discover
- "Designers don't understand engineering" — dismissive rather than collaborative
- Shipped something visually off from the spec without looping back to design
- Said "not possible" without offering an alternative`
  },
  {
    id: 'behav-43',
    type: 'behavioral',
    num: 43,
    difficulty: 'M',
    star: false,
    section: 'Leadership',
    title: 'Tell me about a time you advocated for your team\'s needs — time for tech work, tooling, or headcount. How did you make the case?',
    tags: [ 'advocacy', 'leadership', 'communication', 'influence' ],
    related: [ 'behav-21', 'behav-41' ],
    listenFor: '- Identified a real gap with a measurable cost: slow CI costs 2 hours per engineer per week, on-call burden is causing attrition risk\n- Translated the need into business terms leadership could assess\n- Built the case with data and found allies before escalating\n- Was specific about what they were asking for and what success looks like: "with this investment, we cut CI time by 50% and ship the backlog in Q4"\n- Escalated to the right person at the right time',
    starGuide: `- **S** — the team need (CI capacity, device lab, on-call relief, headcount) and its measured cost.
- **T** — who could grant it and what they cared about.
- **A** — the case in business terms, the specific ask and success metric, allies you found, and what you did after the first "no".
- **R** — what was granted, and whether the promised improvement showed up.`,
    redFlags: '- Only vents frustration to teammates — never takes it up the chain\n- Makes vague asks: "the team is overloaded" without specifics or a proposal\n- Advocates once, hears no, and permanently drops it\n- Advocates for team comfort rather than team effectiveness'
  },
  {
    id: 'behav-44',
    type: 'behavioral',
    num: 44,
    difficulty: 'M',
    star: false,
    section: 'Growth & Culture',
    title: 'Tell me about a stretch assignment that was meaningfully outside your comfort zone.',
    tags: [ 'growth', 'adaptability', 'learning' ],
    related: [ 'behav-7', 'behav-8', 'behav-15' ],
    listenFor: '- Describes something genuinely outside their domain — not a harder version of familiar work\n- Built a structured plan for their gaps: identified what they didn\'t know, found people and resources\n- Communicated proactively when stuck — didn\'t disappear into the unknown for weeks\n- Delivered — even imperfectly — and can articulate what they\'d do differently\n- Describes real discomfort and how they managed it, not a polished success narrative',
    starGuide: `- **S** — the assignment and why it was outside your domain (e.g. leading an incident review, owning a backend service, running hiring for a quarter).
- **T** — what success looked like and what you did not know.
- **A** — how you mapped your gaps, who you learned from, when you asked for help, and the hardest moment.
- **R** — the outcome (imperfect is fine), and what you would do differently.`,
    redFlags: '- Only ever works on things they\'re already comfortable with — no growth orientation\n- Describes a project that wasn\'t actually outside their domain\n- Got overwhelmed and quietly failed without escalating\n- "I just figured it out" — no reflection on what made it hard or what they learned'
  },
  {
    id: 'behav-45',
    type: 'behavioral',
    num: 45,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a time a teammate wasn\'t meeting expectations. How did you handle it without formal authority?',
    tags: [ 'collaboration', 'conflict', 'feedback', 'leadership' ],
    related: [ 'behav-38', 'behav-4' ],
    listenFor: '- Talked to the person directly and privately first — not their manager, not the broader team\n- Was specific about behavior and impact, not vague impressions\n- Gave the benefit of the doubt: asked what was going on before assuming intent\n- Gave it time to improve before escalating\n- Protected the team\'s health without throwing the person under the bus publicly\n\n**What makes it hard:** No formal authority. Others may be quietly covering for them. The root cause may be unclear expectations, personal circumstances, or role misfit — not laziness.',
    starGuide: `- **S** — what you observed (missed commitments, review quality, reliability) and its effect on the team.
- **T** — your relationship to them (peer, tech lead without reports) and why you acted.
- **A** — the private conversation, what you learned about the cause, the support or clearer expectations you offered, and when and how you involved their manager.
- **R** — what changed for them and for the team.`,
    redFlags: '- Went to the person\'s manager without talking to them directly first\n- Covered for them indefinitely — created unfairness the team would eventually resent\n- Made it a group complaint rather than a direct conversation\n- Couldn\'t give a specific example — just a vague sense they "weren\'t contributing"'
  },
  {
    id: 'behav-46',
    type: 'behavioral',
    num: 46,
    difficulty: 'H',
    star: false,
    section: 'Ownership',
    title: 'Tell me about a time you had to shut down a project you had started or championed.',
    tags: [ 'ownership', 'decision-making', 'accountability', 'sunk-cost' ],
    related: [ 'behav-2', 'behav-37' ],
    listenFor: '- Recognized the signal early enough to cut losses — didn\'t keep going purely to avoid admitting failure\n- Distinguished between pivoting (change direction) and stopping (shut it down) — made a deliberate choice\n- Made the case to leadership with data, not emotion\n- Documented learnings so the investment wasn\'t entirely lost\n- Moved on cleanly — didn\'t keep relitigating the decision or quietly undermining what came next\n\n**The key signal:** Can they separate their identity from the project? Do they describe stopping it as a rational decision or a personal failure?',
    starGuide: `- **S** — the project you championed and what it was meant to achieve.
- **T** — the signals that it was not working (adoption, metrics, cost) and your role in deciding.
- **A** — how you checked it was not just a slow start, the case you made to stop (data, opportunity cost), how you wound it down (users, code, people).
- **R** — what was saved, what was kept, and the learning you documented.`,
    redFlags: '- Never had to shut down something they started — always right (unlikely) or never killing things that should die\n- Continued the project to avoid the embarrassment of being wrong\n- Attributed the failure entirely to external factors\n- No retrospective — the learnings were lost with the project'
  },
  {
    id: 'behav-47',
    type: 'behavioral',
    num: 47,
    difficulty: 'M',
    star: false,
    section: 'Delivery',
    title: 'Tell me about a time requirements changed significantly mid-project. How did you manage the impact?',
    tags: [ 'delivery', 'planning', 'communication', 'scope' ],
    related: [ 'behav-11', 'behav-39', 'behav-26' ],
    listenFor: `- Immediately surfaced the impact of the change: "this adds 2 weeks and removes feature X unless we cut Y"
- Negotiated what to cut or defer rather than silently absorbing the scope change
- Documented the change and its implications — didn't leave it as an informal conversation that caused conflict later
- Protected work already done where possible (flags, modular boundaries) instead of throwing it away
- Knew when a change was minor enough to absorb and when it required a formal reset`,
    starGuide: `- **S** — the project and the change (new requirement, pivot, platform policy, a partner's API change).
- **T** — the commitment it threatened.
- **A** — how fast you sized the impact, the options you put to stakeholders, what you salvaged, and how you recorded the new plan.
- **R** — what shipped versus the new plan, and what you would set up earlier next time.`,
    redFlags: '- Said yes to every change without discussing timeline or scope impact\n- Delivered late without warning because they silently absorbed scope without re-estimating\n- Became rigid — treated any change as a reason to restart all planning\n- Required a formal process for even minor changes — slowed everyone down unnecessarily'
  },
  {
    id: 'behav-48',
    type: 'behavioral',
    num: 48,
    difficulty: 'M',
    star: false,
    section: 'Growth & Culture',
    title: 'Tell me about a time you were burning out or hitting an unsustainable pace. What did you do?',
    tags: [ 'growth', 'self-awareness', 'sustainability' ],
    related: [ 'behav-15', 'behav-44' ],
    listenFor: '- Recognized the warning signs before full burnout: fatigue, loss of motivation, errors, cynicism\n- Took action: talked to their manager, reprioritized, took time off, redistributed load\n- Diagnosed the root cause: always-on on-call, too many context switches, unclear expectations, undervalued work\n- Made a systemic change — not just "I took a vacation" but "we restructured on-call" or "I learned to protect focus time"\n- Was honest with themselves and their manager about what they needed',
    starGuide: `- **S** — the period and what made the pace unsustainable (on-call load, a launch crunch, context switching).
- **T** — what was at risk (quality, health, the team).
- **A** — the warning signs you noticed, the conversation with your manager, what you reprioritized or handed off, the systemic fix.
- **R** — what changed for you and for the team, and the early-warning habit you keep now.`,
    redFlags: '- Claims they\'ve never experienced workload pressure — low self-awareness\n- "Just pushed through it" with no systemic change — will hit the same wall again\n- Suffered in silence until they quit or made serious errors\n- Attributes it entirely to external factors with no reflection on what they could have controlled'
  },
  {
    id: 'behav-49',
    type: 'behavioral',
    num: 49,
    difficulty: 'M',
    star: true,
    section: 'Leadership',
    title: 'Tell me about a time you disagreed with a technical or product decision but had to execute it anyway.',
    tags: [ 'influence', 'leadership', 'disagree-and-commit', 'communication' ],
    related: [ 'behav-20', 'behav-6', 'behav-37' ],
    listenFor: '- Raised the concern clearly and professionally before the decision was finalized — not just after\n- Once the decision was made, committed fully and in good faith — "disagree and commit"\n- Didn\'t undermine the decision passively: slow-walking execution, seeding doubt in teammates, doing the minimum\n- Can distinguish a principled concern worth escalating from a preference they\'d just do differently\n- Brought the same effort to executing a decision they disagreed with as one they championed\n\n**The key distinction:** Strong candidates are selective — they reserve escalation for genuine concerns, not every decision they\'d have made differently.',
    starGuide: `- **S** — the decision and who made it.
- **T** — your concern, and your role in executing the decision.
- **A** — how you raised it before it was final, the moment you committed, how you executed at full effort (and how you talked about it to your team), and the risk mitigations you added.
- **R** — how it turned out, and whether your concern materialized — and if it did, how you handled that without "I told you so".`,
    redFlags: '- Claims they always agree with leadership — passive or low self-awareness\n- Raised the concern only after the decision was made — too late to influence anything\n- Committed publicly but undermined privately: told teammates "I don\'t think this is right"\n- Couldn\'t execute at full effort because of the disagreement'
  },
  {
    id: 'behav-50',
    type: 'behavioral',
    num: 50,
    difficulty: 'M',
    star: false,
    section: 'Growth & Culture',
    title: 'Tell me about joining a new team or company. How did you build trust and establish credibility?',
    tags: [ 'growth', 'onboarding', 'trust', 'adaptability' ],
    related: [ 'behav-7', 'behav-44' ],
    listenFor: '- Listened and observed before proposing changes — understood why things were done before suggesting improvements\n- Sought early, visible wins: identified and shipped something real before trying to shift how the team works\n- Made commitments and kept them — reliability builds trust faster than brilliance\n- Invested in one-on-ones — relationships are built individually, not just in group settings\n- Was transparent about their gaps and asked for help rather than pretending to know everything',
    starGuide: `- **S** — the new team and what you walked into.
- **T** — what you needed to earn before you could change anything.
- **A** — first 30 days (listen, 1:1s, small reliable deliveries), 60 days (a visible win), 90 days (the first improvement you proposed, grounded in what you learned).
- **R** — the signal trust was there (asked into decisions, given ownership), and what you would do the same next time.`,
    redFlags: '- Came in immediately proposing large changes before understanding the context\n- "Just did my work" — no intentional relationship-building\n- Treated trust as automatic — didn\'t see it as something to earn\n- Focused purely on technical reputation and ignored the human relationships'
  },
  {
    id: 'behav-51',
    type: 'behavioral',
    num: 51,
    difficulty: 'H',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a time you took over a project that was already in trouble. How did you assess it and what did you do?',
    tags: [ 'ownership', 'leadership', 'delivery', 'accountability' ],
    related: [ 'behav-39', 'behav-46' ],
    listenFor: '- Assessed before acting — read the code, talked to the people involved, understood what "in trouble" actually meant before making changes\n- Separated technical problems from team/process problems — both usually coexist\n- Reset expectations honestly with leadership: "this will take 3 more months, not 1"\n- Set a new baseline rather than inheriting an unrealistic commitment and silently failing against it\n- Preserved the morale of the people already on the project — didn\'t make them feel blamed\n\n**The key signal:** Could they deliver hard news upward AND keep the existing team engaged? Both are required.',
    starGuide: `- **S** — the project, how it got into trouble, and the inherited commitment.
- **T** — what you were asked to do and what you decided "rescued" meant.
- **A** — the first two weeks of assessment (code, people, plan), the honest reset you took to leadership, the technical and process changes, how you kept the existing team engaged.
- **R** — what shipped against the reset plan, and the team's state at the end.`,
    redFlags: '- First move was to rewrite everything from scratch — usually wrong and demoralizing\n- Inherited unrealistic commitments and didn\'t push back — then failed to hit them\n- Blamed the previous engineers publicly — destroys trust immediately\n- Accepted the project without questioning inherited timelines and scope'
  },
  {
    id: 'behav-53',
    type: 'behavioral',
    num: 53,
    difficulty: 'M',
    star: true,
    section: 'Leadership',
    title: 'Describe a time you had to choose between paying down technical debt and shipping a feature. How did you prioritize?',
    tags: [ 'trade-off', 'technical-debt', 'delivery', 'prioritization' ],
    related: [ 'behav-34', 'behav-41', 'behav-10' ],
    listenFor: `- An explicit rule for the call: does the debt sit on the path of this feature (pay it now), is it a risk multiplier (crashes, data loss, security), or is it merely ugly (defer)?
- Quantified both sides — the feature's value and date vs. the debt's interest (incidents, slowed delivery, the next three features that touch the same code)
- Considered a middle path: refactor only the seam the feature touches, ship behind a flag, schedule the remainder
- Made the trade-off visible: a ticket with context and an owner, the PM told explicitly what was deferred and what it would cost later
- Came back and paid it, or can explain why it was rightly never paid`,
    starGuide: `- **S** — the feature, its deadline, and the debt sitting in its way.
- **T** — the decision you owned and who else had a stake (PM, other teams touching the code).
- **A** — the rule you used, the numbers on each side, the middle path you chose, and how you recorded and communicated the deferred cost.
- **R** — what shipped, what the debt cost in the meantime, and when it was cleared.`,
    redFlags: `- No framework — just intuition, or "we always ship features first" / "we always refactor first"
- Talks about shipping fast without mentioning tests, review, or monitoring
- Knowingly takes shortcuts but never surfaces the debt — no ticket, no doc, no heads-up to anyone
- Deferred debt was never revisited and no one owned it`
  },
  {
    id: 'behav-56',
    type: 'behavioral',
    num: 56,
    difficulty: 'M',
    star: true,
    section: 'Ownership',
    title: 'Describe a time you identified and prevented a potential production issue before it impacted users.',
    tags: [ 'proactive', 'monitoring', 'prevention', 'ownership' ],
    related: [ 'behav-3', 'behav-1', 'behav-71' ],
    listenFor: `- A concrete detection source, ideally a system: a canary or 1% staged-rollout cohort, Play Console pre-launch report, an Android vitals or Crashlytics velocity alert, a beta-channel crash, an internal dogfood build, a targetSdk behaviour-change review
- Or sharp judgement in review: spotted a non-backward-compatible Room migration, a main-thread disk read, an unbounded cache, a missing foreground-service type before release
- Investigated properly: reproduced, sized the blast radius (versions, devices, % of users), decided between halt, flag-off and hotfix
- Acted before users were hit, and told the right people
- Left a guard behind: a new alert threshold, a CI check, a migration test, a checklist item`,
    starGuide: `- **S** — the risk and how close it was to users (in review, in beta, at 1% rollout).
- **T** — why it was yours to chase.
- **A** — what caught the signal (a system, not luck), how you confirmed and sized it, the action you took and who you told.
- **R** — size the result by the blast radius you avoided, then the guard you left behind so it is caught automatically next time.`,
    redFlags: `- No proactive detection — "we got lucky"
- Found it but did not act or escalate in time
- No process improvement after the near-miss
- Exaggerates an ordinary code-review comment into a heroic save`
  },
  {
    id: 'behav-58',
    type: 'behavioral',
    num: 58,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Describe a time you had to coordinate work across multiple teams (e.g., Android, iOS, backend).',
    tags: [ 'cross-team', 'coordination', 'communication' ],
    related: [ 'behav-22', 'behav-73', 'behav-77', 'behav-78' ],
    listenFor: `- Maps cross-team dependencies upfront — which team's API, release train, or review gate their timeline depends on
- Agrees the contract early: API schema (OpenAPI/GraphQL/proto) and mock server so mobile is not blocked on backend, shared analytics event spec, a common feature-flag key across Android and iOS
- Accounts for mobile release realities: store review, staged rollouts, old app versions in the field — so the backend must stay backward compatible and the launch is gated by a server flag, not by binary release dates
- Sets up a concrete coordination mechanism (shared design doc, integration milestones, a single launch checklist) and keeps it current
- Handles a priority clash by negotiating a sequenced plan; flags slippage before it lands on anyone`,
    starGuide: `- **S** — the feature and the teams involved (Android, iOS, backend, design, QA, data).
- **T** — your role (Android lead, overall tech lead) and the launch constraint.
- **A** — the contract you agreed and when, the coordination mechanism, one clash or slippage and how you handled it, how you synchronized the launch (server flag, staged rollout on both platforms).
- **R** — what shipped and when, the cross-platform parity outcome, and what you would standardize next time.`,
    redFlags: `- No coordination mechanism — status lived in DMs
- Built against an unagreed API and redid the work
- Coupled the launch to app-store release timing with no server-side switch
- Siloed work with no cross-team visibility; missed integration points`
  },
  {
    id: 'behav-59',
    type: 'behavioral',
    num: 59,
    difficulty: 'H',
    star: true,
    section: 'Growth & Culture',
    title: 'Tell me about a time you advocated for a cultural improvement on your team.',
    tags: [ 'cultural-improvement', 'advocacy', 'growth' ],
    related: [ 'behav-13', 'behav-15', 'behav-35' ],
    listenFor: '- Pins the cultural problem to a concrete cost — attrition, slow reviews, repeated incidents — not just a feeling that morale was low\n- Brings evidence others can check: survey results, delivery metrics, incident counts, before/after comparisons\n- Pilots the change with a small group and shows a working example instead of proposing a policy upfront\n- Enlists a skeptic as an ally and measures adoption after the initial excitement fades',
    starGuide: `- **S** — the team habit that was costing you (e.g. blameful postmortems, PRs left unreviewed for days, nobody owning flaky tests, knowledge siloed in one person).
- **T** — the change you wanted and why you, without authority, pushed it.
- **A** — the case you built, the small pilot, the skeptic you won over, how you made it the default rather than a favour.
- **R** — what was still in place six months later, with a number if you have one.`,
    redFlags: `- Cannot name a concrete cost — "morale felt low"
- Proposed a policy by email and called it done; nothing changed in practice
- Change depended on their personal enforcement and faded when they stopped
- Imposed their own preference on the team without asking what the team needed`
  },
  {
    id: 'behav-62',
    type: 'behavioral',
    num: 62,
    difficulty: 'E',
    star: true,
    section: 'Growth & Culture',
    title: 'Why do you want to change jobs, and why Walmart specifically? (Verified Walmart HR question)',
    listenFor: '- Pull factors (growth, scope, product impact) more than push factors (escaping a bad manager)\n- Specific knowledge of Walmart Global Tech: omnichannel retail scale, millions of transactions/day, tech-forward investment, open-source presence\n- Honest, non-transactional motivation — not only compensation\n\n**Context:** Top-3 sourced HR question from Walmart interview reports (AmbitionBox)',
    starGuide: `Not a STAR story — use a three-beat shape instead:
- **Now** — what you have done and learned in your current role (one concrete achievement).
- **Gap** — the thing you want next that your current role cannot offer (scale, product surface, scope), phrased as a pull, never a complaint.
- **Why here** — something concrete about this company's apps, scale, or team charter that matches that gap.`,
    redFlags: '- Generic answer that could apply to any company\n- Only mentions money\n- Badmouths current team',
    tags: [ 'walmart', 'motivation', 'hr' ],
    related: [ 'behav-7', 'behav-15' ]
  },
  {
    id: 'behav-65',
    type: 'behavioral',
    num: 65,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Deep-dive on a project you owned: what would you improve, and how would you scale it? (Verified Walmart hiring-manager round format)',
    listenFor: '- End-to-end ownership narrative: problem, constraints, decisions, trade-offs, outcome with numbers\n- Honest critique of own design — specific improvements, not generic \'better tests\'\n- Scaling reasoning tied to real bottlenecks (data volume, team growth, release cadence)\n- Comfort being challenged — updates position when pressed with new constraints\n\n**Context:** The Walmart hiring-manager round consistently walks your current project with improve/scale follow-ups (both GfG SDE-III reports)',
    starGuide: `- **S** — the project, the users, and why it mattered; be ready to draw the architecture from memory.
- **T** — your exact ownership boundary.
- **A** — three key decisions, each with the alternative you rejected and why.
- **R** — before/after metrics; then "what I'd improve" (specific) and "at 10x, what breaks first" (users, data volume, team size, release cadence).`,
    redFlags: '- Cannot explain own system beyond the happy path\n- Defensive when probed on trade-offs\n- Improvements are vague (\'add caching\') with no bottleneck reasoning',
    tags: [ 'walmart', 'leadership', 'hiring-manager', 'system-design', 'palo-alto' ],
    related: [ 'behav-20', 'behav-30', 'sd-86' ]
  },
  {
    id: 'behav-67',
    type: 'behavioral',
    num: 67,
    difficulty: 'M',
    star: false,
    section: 'Collaboration',
    title: 'Describe explaining a technical solution to a non-technical stakeholder. (Verified Walmart senior-track question)',
    listenFor: '- Translates to business terms: cost, risk, revenue, time — not jargon\n- Checks understanding; invites questions\n- Uses analogies/visuals appropriately without condescension\n- Ties the recommendation to a decision the stakeholder needed to make\n\n**Context:** Verified from Walmart data-platform senior interview (round 3)',
    starGuide: `- **S** — the stakeholder (PM, support lead, exec, legal) and the decision they faced.
- **T** — the technical point they needed to understand (e.g. why a forced update is needed, why offline sync takes a quarter, what a staged rollout protects).
- **A** — how you framed it in their terms (cost, risk, time), the analogy or visual you actually used, how you checked understanding.
- **R** — the decision it enabled, and what you would explain differently.`,
    redFlags: `- Explains implementation details to a business audience
- One-way lecture with no comprehension check
- Condescending simplification, or hides the real risk to make the message easier
- No decision resulted — the explanation was not tied to anything the stakeholder had to do`,
    tags: [ 'walmart', 'communication', 'stakeholders' ],
    related: [ 'behav-5', 'behav-22' ]
  },
  {
    id: 'behav-70',
    type: 'behavioral',
    num: 70,
    difficulty: 'H',
    star: false,
    section: 'Delivery',
    title: 'Tell me about a time you had to ship against an immovable legal, regulatory, or compliance deadline despite quality risk.',
    listenFor: '- Distinguishes a genuinely immovable date (regulatory effective date, contract clause, audit window) from one that merely feels hard\n- Names the specific quality risks accepted and the compensating controls shipped instead: feature flags, staged rollout, enhanced monitoring, documented debt\n- Brought legal, security, or compliance partners into the plan early rather than discovering them at submission\n- Candid about residual risk after go-live — what actually broke and what they owed the team afterwards',
    starGuide: `- **S** — the immovable date and what forced it (a Play targetSdk / policy deadline, a data-safety or privacy regulation, an accessibility law, a contract).
- **T** — how far short of ready you were and what was non-negotiable.
- **A** — when you brought legal/compliance in, the quality risks you accepted, the guardrails you shipped behind (flags, staged rollout, monitoring), and the debt you recorded.
- **R** — whether you hit the date, what actually broke, and how the remaining risk was paid down.`,
    redFlags: '- Pretends deadline pressure never degrades quality\n- Met the date with no monitoring or rollback path — "the date is the date"\n- Refused to ship at all and left legal or regulatory exposure unmitigated, with no alternative route\n- Treats compliance and legal partners purely as blockers, not stakeholders',
    tags: [ 'delivery', 'compliance', 'quality-risk', 'deadlines' ],
    related: [ 'behav-10', 'behav-11', 'behav-47' ],
    source: 'interview'
  },
  {
    id: 'behav-71',
    type: 'behavioral',
    num: 71,
    difficulty: 'H',
    star: true,
    section: 'Delivery',
    title: 'Tell me about a time you pulled the plug on a release mid-flight — rolling it back or halting it — and had to own the call.',
    listenFor: '- Decision criteria stated concretely: error-budget burn, user-impact signal, confidence in root cause — not gut feel\n- Owns the call personally, including its cost: marketing reverted, a burned cycle, leadership pushing to press on\n- Handled countervailing pressure well — who wanted to continue, how they weighed it, how the decision stayed blameless for the author of the change\n- Follows through past the rollback: what in the pipeline or canary process let it get that far',
    starGuide: `- **S** — the release and the rollout state (e.g. 10% staged rollout on Play, a server-side feature at 25%).
- **T** — the signal you saw and your authority to stop it.
- **A** — the criteria you used, who wanted to continue and how you weighed it, the halt itself (halt rollout, flag off, server rollback — knowing a halted Play rollout does not remove the build from devices already updated), and how you kept it blameless.
- **R** — what halting cost and saved, and what changed in the pipeline or canary process so the next one is caught earlier.`,
    redFlags: '- Story ends at the rollback with no prevention follow-up\n- Uncalibrated in either direction — rolls back at the first blip, or has never rolled anything back\n- Blames the engineer whose change tripped it instead of the decision process\n- Was not the decider and cannot say what they would have done in that seat',
    tags: [ 'delivery', 'release', 'risk', 'ownership' ],
    related: [ 'behav-3', 'behav-37' ],
    source: 'interview'
  },
  {
    id: 'behav-72',
    type: 'behavioral',
    num: 72,
    difficulty: 'H',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a postmortem where two teams disagreed on root cause or accountability after an incident.',
    listenFor: '- Separates "blameless" from "accountability-free" and can articulate the difference in practice\n- Argued with evidence — timeline, telemetry, change history — not memory or persistence\n- Acknowledged their own team\'s contribution to the failure before pointing at the other team\n- Landed on action items with named owners across both teams, and can say which ones actually shipped',
    starGuide: `- **S** — the incident and the two competing root-cause narratives (e.g. "the app retried too aggressively" vs. "the API changed its error contract").
- **T** — your role in the postmortem.
- **A** — the evidence you assembled (timeline, telemetry, change history), how you acknowledged your own team's share first, how you kept it blameless without making it accountability-free.
- **R** — the action items with owners on both sides, and which actually shipped.`,
    redFlags: '- Uses "blameless" to shut down accountability entirely\n- The disagreement got settled by whose manager was more senior, not by evidence\n- Postmortem exists but nothing measurably changed afterward\n- Recasts the incident as purely the other team\'s fault',
    tags: [ 'collaboration', 'postmortem', 'incident', 'conflict' ],
    related: [ 'behav-3', 'behav-5', 'behav-77' ],
    source: 'interview'
  },
  {
    id: 'behav-73',
    type: 'behavioral',
    num: 73,
    difficulty: 'M',
    star: false,
    section: 'Collaboration',
    title: 'Tell me about a launch that depended on another team that kept slipping.',
    listenFor: '- Sought to understand the dependency team\'s constraints before escalating — their slippage was context, not malice\n- Took action to decouple: stubbed the interface, phased the launch, put their own flag or fallback behind the missing piece\n- Escalated as a risk conversation with business impact, not as tattling — and preserved the working relationship\n- Fixed the dependency going forward: clearer contract, shared status visibility, agreed SLA',
    starGuide: `- **S** — your launch, the dependency, and the slip pattern.
- **T** — the date you owned and what depended on it.
- **A** — what you learned about their constraints, what you did after the second slip (stubbed the interface, phased the launch, put the missing piece behind a flag), and how you escalated as a risk with business impact.
- **R** — what launched and when, and the contract or visibility you set up so it does not repeat.`,
    redFlags: '- Waited passively, then played "told you so" at launch review\n- Went straight to manager-vs-manager escalation as the first and only tool\n- Quietly rebuilt the whole dependency in-house without costing the scope tradeoff\n- "There was nothing we could do" — no action taken at any point',
    tags: [ 'collaboration', 'dependencies', 'cross-team', 'delivery' ],
    related: [ 'behav-22', 'behav-41', 'behav-58' ],
    source: 'interview'
  },
  {
    id: 'behav-74',
    type: 'behavioral',
    num: 74,
    difficulty: 'M',
    star: false,
    section: 'Growth & Culture',
    title: 'Tell me about a time you were passed over for a promotion or didn\'t get a role you wanted. What did you do?',
    listenFor: '- Honest disappointment without lingering bitterness at the manager or panel\n- Sought out the specific gap — and can name it, which proves the feedback conversation was real\n- A concrete multi-month response: changed scope of work, found a sponsor, built visible outcomes\n- Treats the outcome as information — neither a rigged system nor a verdict on their worth',
    starGuide: `- **S** — the role or promotion and the decision.
- **T** — what you needed to understand and change.
- **A** — the feedback conversation (the specific gap named), the plan you agreed with your manager, the scope or sponsor you sought, the visible outcomes over six to twelve months.
- **R** — where it led, and what you now do differently about career conversations.`,
    redFlags: '- Blames politics or the process with zero self-assessment\n- "I just wasn\'t ready" with no follow-up action of any kind\n- Job-hopped at every setback without reflecting on the pattern\n- Cannot recall the feedback they were given',
    tags: [ 'growth', 'career', 'resilience', 'self-awareness' ],
    related: [ 'behav-9', 'behav-15', 'behav-62' ],
    source: 'interview'
  },
  {
    id: 'behav-75',
    type: 'behavioral',
    num: 75,
    difficulty: 'H',
    star: true,
    section: 'Leadership',
    title: 'Walk me through a design doc or RFC you wrote that was contested. How did you drive it to a decision?',
    tags: [ 'leadership', 'rfc', 'design-doc', 'technical-direction', 'influence', 'decision-making' ],
    related: [ 'behav-30', 'behav-21', 'behav-20', 'behav-36' ],
    listenFor: `- The doc framed the problem and the decision needed before the solution — goals, non-goals, constraints, and at least two real alternatives with honest trade-offs
- Socialized it before the review: shared early drafts with the most affected people and the likely skeptics, so the meeting was a decision, not a first read
- Engaged objections on substance — changed the design where a reviewer was right, and can name one change a critic forced
- Separated reversible from irreversible parts and moved fast on the former (a two-way-door choice should not wait for consensus)
- Drove to an explicit decision with an owner and date — a decider, a deadline for comments, or an escalation — instead of letting the thread run indefinitely
- Recorded the outcome (ADR, decision log) including the rejected options and why

**The key signal:** Can they build consensus without needing unanimity, and tell "unconvinced but can commit" apart from a blocking concern?`,
    starGuide: `- **S** — the problem (e.g. choosing a navigation or state-management approach, modularization strategy, an offline-sync model, adopting KMP for shared logic) and why it needed a written decision.
- **T** — your role as author and who had to agree.
- **A** — how you structured the doc, who you pre-socialized it with, the strongest objection and what you changed because of it, and how you forced a decision (decider, deadline, escalation).
- **R** — the decision, adoption since, and one thing in the doc that proved wrong.`,
    redFlags: `- The doc was a sales pitch for a predetermined answer — no real alternatives, straw-man options
- Surprised stakeholders in the review meeting; no pre-reads or one-on-ones
- Treated every comment as an attack, or caved to the loudest reviewer without new information
- Let the RFC stall for weeks with no decider or deadline
- No record of the decision — the same debate restarted six months later`,
  },
  {
    id: 'behav-76',
    type: 'behavioral',
    num: 76,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a time design asked for something that clashed with Android platform conventions — for example a pixel-identical copy of the iOS UI. How did you handle it?',
    tags: [ 'collaboration', 'design', 'android', 'platform-conventions', 'disagreement', 'accessibility' ],
    related: [ 'behav-42', 'behav-6', 'behav-78' ],
    listenFor: `- Knows the concrete conventions at stake and why they matter to users: system back and predictive back, edge-to-edge and insets, Material components and motion, top-app-bar vs. iOS navigation bar, share sheets, permission flows, TalkBack and font scaling, large screens and foldables
- Separates brand (which should be consistent across platforms) from platform behaviour (which should feel native) — and gets design to agree on that split
- Brought evidence rather than taste: platform guidelines, an accessibility audit, a prototype on a real device, user feedback, or the engineering cost of fighting the framework
- Offered a version that keeps the design intent, and compromised where the convention really did not matter
- Left a reusable outcome: a shared design-system decision or a platform-differences doc so the debate does not recur per feature`,
    starGuide: `- **S** — the feature and the design ask (e.g. custom back arrow that ignores system back, a bottom sheet that breaks TalkBack focus order, a fixed-size layout that breaks at large font sizes).
- **T** — what was at risk for Android users, and the relationship you needed to keep with design.
- **A** — how you raised it (prototype, guideline, accessibility check), the brand-vs-platform split you proposed, what you conceded.
- **R** — what shipped, the user/quality result, and the rule the design system adopted.`,
    redFlags: `- "Android users expect Material, end of discussion" — dogmatic, no engagement with brand goals
- Built the iOS clone silently and let users discover the broken back or accessibility behaviour
- Cannot name a single concrete platform convention or why it matters
- Treated it as a one-off fight instead of fixing the shared decision`,
  },
  {
    id: 'behav-77',
    type: 'behavioral',
    num: 77,
    difficulty: 'M',
    star: true,
    section: 'Collaboration',
    title: 'Tell me about a time a backend API did not fit what the mobile client needed. How did you work it out with the backend team?',
    tags: [ 'collaboration', 'cross-team', 'backend', 'api-design', 'mobile' ],
    related: [ 'behav-58', 'behav-22', 'behav-72', 'behav-78' ],
    listenFor: `- Names the concrete mobile constraint: chatty endpoints (N calls per screen on high-latency networks), over-fetching on metered data, no pagination or cursor, unstable error contract, breaking changes that old app versions in the field cannot absorb
- Quantified the cost from the client side: screen load time, data usage, battery, crash or error rate by app version
- Understood the backend team's constraints (ownership, other consumers, their roadmap) before asking
- Proposed workable options: a batched or screen-shaped endpoint, a BFF (backend-for-frontend), field selection, versioning and deprecation policy, contract tests
- Agreed a contract (schema, error model, compatibility rules) and a way to keep it — not a one-off favour`,
    starGuide: `- **S** — the screen or feature and the API shape that hurt it.
- **T** — the client-side cost and the date pressure.
- **A** — the numbers you brought, how you learned the backend team's constraints, the options you put forward, and the contract you agreed (including backward compatibility for old app versions).
- **R** — the measured improvement and the lasting change (BFF, contract tests, API review step).`,
    redFlags: `- Worked around it in the client with retries, caching hacks and parallel calls, without ever raising it
- "Backend should just do what we ask" — no interest in their constraints or other consumers
- Ignores old app versions — proposes a breaking change with no migration path
- No data on the client-side cost`,
  },
  {
    id: 'behav-78',
    type: 'behavioral',
    num: 78,
    difficulty: 'M',
    star: false,
    section: 'Collaboration',
    title: 'Tell me about a disagreement with your iOS counterpart on how a shared feature should work or be built.',
    tags: [ 'collaboration', 'cross-platform', 'ios', 'parity', 'conflict' ],
    related: [ 'behav-58', 'behav-76', 'behav-77', 'behav-5' ],
    listenFor: `- Distinguishes what must be the same across platforms (behaviour, analytics events, API usage, business rules, launch timing) from what should differ (navigation, platform UI, OS integrations)
- Understood the iOS constraints before pushing their own approach — different lifecycles, background-execution limits, release cadence
- Resolved it with a shared artefact: a joint tech spec, a shared state machine or contract, an agreed event schema — or, where it made sense, a shared-code decision such as Kotlin Multiplatform for the business logic, with its costs stated honestly
- Kept parity measurable: a feature checklist, shared QA cases, analytics compared across platforms
- The relationship got better, not worse`,
    starGuide: `- **S** — the shared feature and the disagreement (e.g. caching rules, retry behaviour, offline handling, whether to share logic via KMP).
- **T** — what had to be consistent for users and product, and your role.
- **A** — how you understood their constraints, the evidence or prototype that settled it, the split between "must match" and "should be native", the shared artefact you created.
- **R** — what shipped on both platforms, any parity bugs avoided or found, and how you work together now.`,
    redFlags: `- Treats the other platform as the problem — "iOS always does it their own way"
- Forces identical implementations where platform behaviour should differ, or ignores real parity requirements
- Settled it by whoever shipped first, leaving users with inconsistent behaviour
- Pushes shared code (KMP) as the answer to every disagreement without weighing build, hiring and debugging costs`,
  },
  {
    id: 'behav-79',
    type: 'behavioral',
    num: 79,
    difficulty: 'H',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a launch that failed — it shipped, but did not deliver the impact you expected.',
    tags: [ 'ownership', 'failure', 'launch', 'product', 'data' ],
    related: [ 'behav-2', 'behav-46', 'behav-17', 'behav-16' ],
    listenFor: `- Picks a genuine miss — adoption, conversion, retention or performance target missed — not a launch that "went great with minor issues"
- Had defined success up front (a metric and target) and instrumented it before launch, so failure was visible rather than argued about
- Diagnosed why with data and users, not opinion: funnel drop-off, cohort by app version and device tier, qualitative feedback, an A/B readout
- Separates their own contribution (assumption not validated, instrumentation missing, slow rollout of fixes) from external factors without hiding behind them
- Made a clear next call — iterate, pivot, or roll back and remove the code — and can say what they validated earlier on the next launch`,
    starGuide: `- **S** — the launch, the hypothesis behind it, and the target.
- **T** — your role and your stake in its success.
- **A** — when and how you saw it was missing, the diagnosis (data and user signal), your own share of the cause, the decision you drove next.
- **R** — the eventual outcome (recovered, pivoted, removed) and the validation step you now do before building.`,
    redFlags: `- Every launch they describe succeeded
- No success metric was defined, so "failure" is a matter of opinion
- Blames marketing, design or "users didn't get it" with no self-examination
- Kept iterating on a dead feature to avoid admitting it failed
- No learning that changed how they launch now`,
  },
  {
    id: 'behav-80',
    type: 'behavioral',
    num: 80,
    difficulty: 'M',
    star: false,
    section: 'Leadership',
    title: 'Tell me about your involvement in hiring. How have you raised the bar as an interviewer?',
    tags: [ 'leadership', 'hiring', 'interviewing', 'bar-raising' ],
    related: [ 'behav-24', 'behav-35', 'behav-38' ],
    listenFor: `- Interviews against an agreed rubric and signals, and writes evidence-based feedback (what the candidate said and did), not impressions
- Can describe a question they designed or improved — e.g. replacing a trivia question with a realistic Android debugging or design exercise — and why it predicts the job better
- Calibrates: shadowed and reverse-shadowed, compares notes in debriefs, knows their own biases (similarity, halo, confidence-as-competence)
- Has argued a hire or no-hire against the room with evidence, and can say how it turned out
- Treats candidate experience and fairness as part of the bar; helped train other interviewers or improve the loop`,
    starGuide: `- **S** — the hiring context (team growth, a role you interviewed for, the loop you were part of).
- **T** — what was wrong or missing (inconsistent signal, a weak question, hires that did not work out).
- **A** — what you changed (rubric, question, interviewer training, debrief format) and a specific debrief where you held the line or changed your mind.
- **R** — the effect on the loop (consistency, offer-accept, performance of hires), stated honestly.`,
    redFlags: `- Hires on "gut feel" or culture fit with no rubric
- Feedback is impressions ("seemed smart", "not senior enough") with no evidence
- Raising the bar means asking harder trivia or puzzles
- Has never disagreed in a debrief, or treats interviewing as a chore to minimize`,
  },
  {
    id: 'behav-81',
    type: 'behavioral',
    num: 81,
    difficulty: 'H',
    star: true,
    section: 'Ownership',
    title: 'Tell me about a time you were handed an open-ended problem rather than a spec, and had to define the project yourself.',
    tags: [ 'ownership', 'ambiguity', 'scoping', 'planning', 'leadership' ],
    related: [ 'behav-26', 'behav-17', 'behav-33', 'behav-75' ],
    listenFor: `- Turned a fuzzy goal ("the app feels slow", "reduce churn", "make releases safer") into a measurable problem statement with a baseline — e.g. cold-start p90, ANR rate, crash-free users, release rollback rate
- Investigated before committing: data, traces, user research, talking to support — and found where the problem actually concentrated
- Defined scope explicitly: goals, non-goals, milestones with exit criteria, and a first slice that delivered value early
- Sized it and got agreement on staffing and priority from the people who owned the roadmap
- Re-scoped as they learned and communicated the changes, rather than defending the original plan`,
    starGuide: `- **S** — the vague ask, who gave it, and why it had no spec.
- **T** — what you had to produce: a plan others could commit to.
- **A** — how you measured the baseline, what the investigation revealed, the goals/non-goals and milestones you set, the first slice, how you got buy-in on scope.
- **R** — the metric movement, what you cut or added along the way, and how you scope open-ended work now.`,
    redFlags: `- Waited for someone to write the spec
- Jumped straight to a favourite solution without measuring the problem
- No non-goals — scope grew until the project stalled
- Success defined only as "shipped the plan", with no outcome metric`,
  },
  ]);
