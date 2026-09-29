QuestionDB.register('android',
[
  {
    id: 'tech-1',
    type: 'technical',
    num: 1,
    difficulty: 'E',
    star: true,
    section: 'Kotlin',
    title: 'What is the difference between `val` and `var`?',
    tags: [ 'kotlin', 'basics' ],
    related: [ 'tech-2', 'tech-5' ],
    keyPoints: `- \`val\` = read-only reference (immutable reference, not necessarily immutable object)
- \`var\` = mutable reference
- \`val list = mutableListOf(...)\` — the reference is fixed but the list contents can change`,
    answer: `- \`val\` freezes the reference, not the contents — \`val\` list still mutates internally
- \`var\` lets you point at a different object at any time`,
    followUp: `**Follow-up:** Can a \`val\` property change its value?
> Yes — if it's a \`var\` property inside a \`val\` object, or a delegated property`,
    redFlags: `- Says \`val\` means the object is immutable (conflates reference vs. content)`,
  },
  {
    id: 'tech-2',
    type: 'technical',
    num: 2,
    difficulty: 'M',
    star: true,
    section: 'Kotlin',
    title: 'Explain `data class` vs a regular class. When would you use each?',
    tags: [ 'kotlin', 'classes' ],
    related: [ 'tech-1', 'tech-4' ],
    keyPoints: `- \`data class\` auto-generates: \`equals()\`, \`hashCode()\`, \`toString()\`, \`copy()\`, \`componentN()\`
- Use for DTOs, API response models, UI state objects
- Avoid for classes with identity semantics (e.g., a \`View\`, a \`ViewModel\`)`,
    answer: `- Value-semantics test: if two instances with equal fields should be interchangeable, make it a \`data class\`
- Default for DTOs and UI state; keep anything with identity or owned resources a regular class
- Don't reach for \`data class\` just to get a free \`toString()\``,
    followUp: `**Follow-up:** What's the problem with using a \`data class\` for a \`ViewModel\`?
> \`equals()\` compares field values — two VMs with same state would be "equal" even though they're different instances. Also, \`copy()\` on a VM that holds coroutine scopes is dangerous.`,
    redFlags: `- Says "always use data class for everything"`,
  },
  {
    id: 'tech-3',
    type: 'technical',
    num: 3,
    difficulty: 'M',
    star: true,
    section: 'Kotlin',
    title: 'What do `apply`, `let`, `run`, `also`, `with` do? When do you reach for each?',
    tags: [ 'kotlin', 'functional', 'null-safety' ],
    related: [ 'tech-5', 'tech-40' ],
    keyPoints: `| Function | Receiver | Returns | Typical use |
|---|---|---|---|
| \`apply\` | \`this\` | receiver | Builder-style object config |
| \`also\` | \`it\` | receiver | Side-effects (logging, validation) |
| \`let\` | \`it\` | lambda result | Null checks, transforms |
| \`run\` | \`this\` | lambda result | Object config + compute result |
| \`with\` | \`this\` | lambda result | Non-extension, group ops on object |`,
    answer: `- \`apply\`/\`also\` hand back the receiver; \`let\`/\`run\`/\`with\` hand back the lambda result
- \`apply\`/\`run\`/\`with\` bind \`this\`; \`let\`/\`also\` expose the value as \`it\`
- \`apply\` to configure, \`also\` for side effects, \`let\` for null-guarded transforms`,
    followUp: `**Follow-up:** Show me how you'd use \`let\` for null safety.
\`\`\`kotlin
user?.let { sendEmail(it.email) }
\`\`\``,
    redFlags: `- Can only name 2-3, can't explain the receiver/return distinction
- Uses \`!!\` instead of \`let\` for null handling`,
  },
  {
    id: 'tech-4',
    type: 'technical',
    num: 4,
    difficulty: 'M',
    star: false,
    section: 'Kotlin',
    title: 'Explain sealed classes. How are they different from enums?',
    tags: [ 'kotlin', 'classes', 'state' ],
    related: [ 'tech-2', 'tech-138' ],
    keyPoints: `- \`sealed class\` = closed type hierarchy, subclasses defined in same package/file
- Each subclass can hold **different data**; enum instances all have the same shape
- Used for: UI state (\`Loading\`, \`Success(data)\`, \`Error(message)\`), Result types, navigation events`,
    answer: `- Pick a sealed type when variants carry different data; an enum when they are just labelled constants
- Model UI state and results as sealed types so every \`when\` must handle each case
- Adding a subtype then becomes a compile error at each unhandled \`when\` — that is the payoff`,
    followUp: `**Follow-up:** Why does \`when\` on a sealed class not need an \`else\` branch?
> Compiler knows all subclasses at compile time → exhaustive check`,
    redFlags: `- Confuses sealed class with abstract class
- Adds an \`else\` branch to a \`when\` over a sealed type, silently opting out of the exhaustiveness check`,
  },
  {
    id: 'tech-5',
    type: 'technical',
    num: 5,
    difficulty: 'E',
    star: false,
    section: 'Kotlin',
    title: 'Explain Kotlin null safety — `?.`, `!!`, `?:`.',
    tags: [ 'kotlin', 'null-safety' ],
    related: [ 'tech-1', 'tech-3' ],
    keyPoints: `- \`?.\` = safe call, returns null if receiver is null
- \`!!\` = non-null assertion, throws \`NullPointerException\` if null
- \`?:\` = Elvis operator, provides a default value when null`,
    answer: `- Handle absence with \`?.\` and \`?:\` by default
- Treat \`!!\` as a crash chosen in advance — only with a guarantee the type system can't see
- Resolve nullability at the boundaries (parsing, platform calls) so the core works with non-null types`,
    followUp: `**Follow-up:** When is \`!!\` acceptable?
> Only when you have a guarantee outside the type system (e.g., a field always set by framework before use, test code). Even then, prefer a clear error message.`,
    redFlags: `- Uses \`!!\` liberally without acknowledging the risk
- Lets platform types (\`String!\` from Java) flow through the codebase unchecked`,
  },
  {
    id: 'tech-6',
    type: 'technical',
    num: 6,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'Walk me through the Activity lifecycle. What happens on screen rotation?',
    tags: [ 'lifecycle', 'activity' ],
    related: [ 'tech-75', 'tech-10' ],
    keyPoints: `- \`onCreate → onStart → onResume\` (visible, interactive)
- \`onPause → onStop → onDestroy\` (going away)
- On rotation: \`onPause → onStop → onDestroy → onCreate → onStart → onResume\`
- \`ViewModel\` survives rotation; \`onSaveInstanceState\` for lightweight UI state`,
    answer: `- Rotation is a full destroy-and-recreate, so anything held only by the Activity instance is lost
- Set up in \`onCreate\`, start/stop visible work in \`onStart\`/\`onStop\`, never rely on \`onDestroy\` for must-run cleanup
- Keep screen state outside the Activity so recreation is cheap`,
    followUp: `**Follow-up:** When does \`onDestroy\` NOT get called?
> System process kill (OOM, force stop) — OS kills process directly`,
    redFlags: `- Thinks \`onDestroy\` is always called
- Saves critical data in \`onDestroy\` instead of \`onStop\``,
  },
  {
    id: 'tech-8',
    type: 'technical',
    num: 8,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What is `RecyclerView` recycling? How does `ViewHolder` help?',
    tags: [ 'ui', 'recyclerview', 'performance' ],
    related: [ 'tech-35', 'tech-22' ],
    keyPoints: `- \`RecyclerView\` keeps a pool of \`ViewHolder\`s; when a view scrolls off screen it's recycled
- \`ViewHolder\` caches \`findViewById\` calls — avoids repeated inflation and lookup
- \`DiffUtil\` / \`ListAdapter\` calculates minimal changes to avoid full rebind`,
    answer: `- Keep \`onBindViewHolder\` cheap — it runs on every scroll-in, while inflation happens only when the pool is empty
- Submit lists through \`ListAdapter\`/\`DiffUtil\` rather than full refreshes
- Reset every view property you set in bind, because recycled holders carry the previous item's state`,
    followUp: `**Follow-up:** What's the difference between \`notifyDataSetChanged()\` and \`DiffUtil\`?
> \`notifyDataSetChanged\` redraws everything (no animations, poor performance). \`DiffUtil\` computes the diff and animates only changed rows.`,
    redFlags: `- Decodes images or formats heavy text inside \`onBindViewHolder\`
- Stores per-item state in the ViewHolder and sees it reappear on recycled rows`,
  },
  {
    id: 'tech-9',
    type: 'technical',
    num: 9,
    difficulty: 'E',
    star: false,
    section: 'Android Core',
    title: 'What is an ANR? How do you investigate one?',
    tags: [ 'performance', 'threading' ],
    related: [ 'tech-15', 'tech-35' ],
    keyPoints: `- ANR = Application Not Responding — triggered when main thread is blocked >5s (or BroadcastReceiver >10s)
- Caused by: network/DB on main thread, long synchronous computation, deadlock
- Investigation: pull ANR trace from \`data/anr/traces.txt\`, use Android Vitals in Play Console, StrictMode in debug`,
    answer: `- Treat any blocking call on the main thread as a future ANR, however fast it is on your device
- Start from Play Vitals ANR clusters and the main-thread stack in the trace, not from guesses
- Keep StrictMode on in debug so disk/network-on-main fails loudly before release`,
    followUp: `**Follow-up:** How do you prevent ANRs proactively?
> StrictMode, move IO to coroutines with \`Dispatchers.IO\`, profile with Systrace/Perfetto`,
    redFlags: `- Assumes ANRs only come from network calls and misses lock contention or deadlocks on the main thread`,
  },
  {
    id: 'tech-10',
    type: 'technical',
    num: 10,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'What are common memory leak causes in Android? How do you find them?',
    tags: [ 'memory', 'lifecycle' ],
    related: [ 'tech-6', 'tech-9' ],
    keyPoints: `Common causes:
- Holding \`Activity\` context in a static field or singleton
- Anonymous inner class / lambda capturing \`Activity\`
- Unregistered listeners/callbacks
- \`Handler\` with delayed messages holding Activity reference

Detection:
- LeakCanary (automatic detection)
- Android Studio Memory Profiler
- \`weak references\` for context in long-lived objects`,
    answer: `- Statics or singletons holding an \`Activity\`, or lambdas capturing one
- Listeners never unregistered; \`Handler\` delayed messages still referencing it
- Hunt with LeakCanary or Memory Profiler; keep long-lived context weakly`,
    redFlags: `- Can't name a single leak cause`,
  },
  {
    id: 'tech-12',
    type: 'technical',
    num: 12,
    difficulty: 'M',
    star: false,
    section: 'Jetpack',
    title: '`remember` vs `rememberSaveable` — when does each apply?',
    tags: [ 'compose', 'state' ],
    related: [ 'tech-138', 'tech-6' ],
    keyPoints: `- \`remember\`: survives recomposition, lost on config change or process death
- \`rememberSaveable\`: persists across config changes via \`Bundle\` (like \`onSaveInstanceState\`)
- Use \`rememberSaveable\` for UI state that should survive rotation (text input, scroll position)`,
    answer: `- Use \`remember\` for derived or cheap-to-rebuild state; \`rememberSaveable\` for what the user typed or chose
- Whatever \`rememberSaveable\` holds must fit in a Bundle — keep it small and saveable
- Big or shared screen state belongs in a ViewModel, not in either`,
    redFlags: `- Uses \`rememberSaveable\` everywhere "just in case"
- Puts a large list into \`rememberSaveable\` and hits \`TransactionTooLargeException\``,
  },
  {
    id: 'tech-13',
    type: 'technical',
    num: 13,
    difficulty: 'H',
    star: false,
    section: 'Jetpack',
    title: 'Explain `LaunchedEffect`, `SideEffect`, `DisposableEffect`.',
    tags: [ 'compose', 'effects', 'coroutines' ],
    related: [ 'tech-138', 'tech-14' ],
    keyPoints: `| Effect | Trigger | Cleanup | Use case |
|---|---|---|---|
| \`LaunchedEffect(key)\` | key changes | coroutine cancelled | Async work tied to state (fetch on ID change) |
| \`SideEffect\` | every recomposition | none | Sync Compose state to non-Compose code |
| \`DisposableEffect(key)\` | key changes | \`onDispose\` block | Register/unregister listeners |`,
    answer: `- \`LaunchedEffect(key)\` restarts on key change and cancels its coroutine — async work driven by state
- \`SideEffect\` runs after every recomposition with no cleanup; use it to push Compose state outward
- \`DisposableEffect(key)\` exposes \`onDispose\`, the place to unregister listeners`,
    redFlags: `- Puts network calls directly in composable body (outside any effect)`,
  },
  {
    id: 'tech-14',
    type: 'technical',
    num: 14,
    difficulty: 'M',
    star: true,
    section: 'Concurrency',
    title: 'What does `suspend` actually mean? What happens when a coroutine suspends?',
    tags: [ 'coroutines', 'concurrency' ],
    related: [ 'tech-15', 'tech-16', 'tech-17' ],
    keyPoints: `- \`suspend\` marks a function that can be paused without blocking the thread
- Under the hood: CPS (continuation-passing style) transformation by compiler
- Thread is released while suspended, resumed on a different thread (or same, depending on dispatcher)`,
    answer: `- Marks a function that may pause partway without holding on to its thread
- The compiler achieves this with a continuation-passing style (CPS) rewrite
- On resume the thread may be a different one, depending on the dispatcher`,
    followUp: `**Follow-up:** Does suspending a coroutine block the thread?
> No — that's the entire point. Thread is free to do other work.`,
    redFlags: `- Thinks \`suspend\` = runs on background thread automatically
- Confuses blocking with suspending`,
  },
  {
    id: 'tech-15',
    type: 'technical',
    num: 15,
    difficulty: 'M',
    star: true,
    section: 'Concurrency',
    title: '`Dispatchers.IO` vs `Dispatchers.Default` vs `Dispatchers.Main` — when do you use each?',
    tags: [ 'coroutines', 'threading' ],
    related: [ 'tech-14', 'tech-16' ],
    keyPoints: `- \`Main\`: UI updates, observing state
- \`IO\`: network, database, file I/O (optimized for blocking, large thread pool)
- \`Default\`: CPU-intensive work (sorting, JSON parsing, computation) — thread pool = CPU count`,
    answer: `- Ask one question: blocking I/O, CPU work, or UI? — the answer picks the dispatcher
- Switch with \`withContext\` inside the suspend function so every caller can stay on Main safely
- Never block Main, and don't park long CPU loops on IO's large pool`,
    followUp: `**Follow-up:** What's \`Dispatchers.Unconfined\`?
> Runs in caller's thread until first suspension, then resumes in whatever thread. Mostly for testing.`,
    redFlags: `- Uses \`Dispatchers.IO\` for everything including computation`,
  },
  {
    id: 'tech-16',
    type: 'technical',
    num: 16,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: '`launch` vs `async` — what\'s the difference?',
    tags: [ 'coroutines', 'concurrency' ],
    related: [ 'tech-14', 'tech-17' ],
    keyPoints: `- \`launch\`: fire-and-forget, returns \`Job\`
- \`async\`: returns \`Deferred<T>\`, call \`.await()\` to get result
- Use \`async\` when you need the return value or want to run things in parallel and join results`,
    answer: `- Need a result, or several things in parallel → \`async\`; otherwise → \`launch\`
- Start all the \`async\`s before the first \`await\`, or you have written sequential code
- Remember \`async\` holds its exception until \`await\` — someone must await it`,
    followUp: `**Follow-up:** How do you run two network calls in parallel and wait for both?
\`\`\`kotlin
val a = async { fetchUserProfile() }
val b = async { fetchUserFeed() }
val profile = a.await()
val feed = b.await()
\`\`\``,
    redFlags: `- Uses \`async\` + \`await\` immediately (equivalent to sequential, defeats the purpose)
- Starts an \`async\` whose result is never awaited, so its failure is silently lost`,
  },
  {
    id: 'tech-17',
    type: 'technical',
    num: 17,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'What is structured concurrency?',
    tags: [ 'coroutines', 'concurrency' ],
    related: [ 'tech-14', 'tech-16' ],
    keyPoints: `- Coroutines are scoped — child coroutines inherit parent scope
- If parent is cancelled, all children are cancelled
- If child fails (unhandled exception), parent and siblings are cancelled
- Prevents leaked coroutines`,
    answer: `- Coroutines live in a scope tree; children inherit the enclosing parent scope
- Cancel the parent and every child goes with it
- An unhandled child exception takes down the parent and siblings, so nothing leaks past its owner`,
    followUp: `**Follow-up:** What is a \`SupervisorScope\` and when would you use it?
> Child failures don't propagate to parent or siblings. Use when you want siblings to be independent (e.g., parallel independent tasks where one failing shouldn't cancel others).`,
    redFlags: `- Uses \`GlobalScope\` (leaks coroutines)`,
  },
  {
    id: 'tech-18',
    type: 'technical',
    num: 18,
    difficulty: 'M',
    star: true,
    section: 'Networking & Data',
    title: 'How does Retrofit work?',
    tags: [ 'networking', 'retrofit' ],
    related: [ 'tech-19', 'tech-20' ],
    keyPoints: `- Retrofit uses a \`ServiceInterface\` with annotations (\`@GET\`, \`@POST\`, etc.)
- At runtime, \`Proxy\` creates implementation, delegates to \`OkHttp\` for actual HTTP
- Converters (Gson, Moshi, Kotlinx Serialization) handle JSON ↔ model mapping
- Can return \`Call<T>\`, \`Flow<T>\`, \`suspend T\` depending on adapter`,
    answer: `- Think of Retrofit as a typed façade: you describe the API, it generates the calls
- All transport concerns (auth, retries, logging, caching) belong in the OkHttp client underneath
- Prefer \`suspend\` functions returning models or \`Response<T>\` in coroutine code over \`Call<T>\` callbacks`,
    followUp: `**Follow-up:** What's the role of \`OkHttp\` interceptors?
> Intercept requests/responses — add auth headers, log, retry, modify`,
    redFlags: `- Thinks Retrofit does the HTTP call itself
- Builds a new \`Retrofit\`/\`OkHttpClient\` per request, losing the shared connection pool and cache`,
  },
  {
    id: 'tech-19',
    type: 'technical',
    num: 19,
    difficulty: 'M',
    star: false,
    section: 'Networking & Data',
    title: 'When would you use Room vs DataStore vs SharedPreferences?',
    tags: [ 'storage', 'data' ],
    related: [ 'tech-18', 'tech-100' ],
    keyPoints: `- \`SharedPreferences\`: simple key-value, small amount of data, but synchronous and not type-safe
- \`DataStore\` (Proto or Preferences): async, coroutines-based, type-safe, replaces SharedPreferences
- \`Room\`: relational data, queries, migrations, large datasets`,
    answer: `- Relational data or anything you query → Room
- Small settings and flags → DataStore (Preferences for loose keys, Proto for a typed schema)
- Keep \`SharedPreferences\` only for legacy code you haven't migrated yet`,
    followUp: `**Follow-up:** What's the problem with \`SharedPreferences\` on the main thread?
> \`commit()\` is synchronous and blocks. \`apply()\` is async but has no error handling. \`DataStore\` is fully async.`,
    redFlags: `- Uses SharedPreferences for large datasets
- Reads SharedPreferences on the main thread during startup and blames "slow Application.onCreate"`,
  },
  {
    id: 'tech-20',
    type: 'technical',
    num: 20,
    difficulty: 'H',
    star: false,
    section: 'Networking & Data',
    title: 'How do you handle auth token refresh without race conditions?',
    tags: [ 'networking', 'concurrency', 'security' ],
    related: [ 'sd-9', 'tech-18', 'tech-37' ],
    keyPoints: `- \`Mutex\` or \`synchronized\` to ensure only one refresh happens at a time
- OkHttp \`Authenticator\` interface for automatic retry on 401
- Queue subsequent requests while refresh is in progress, release all after success`,
    answer: `- Guard the refresh with \`Mutex\`/\`synchronized\` so concurrent 401s produce one token fetch
- OkHttp's \`Authenticator\` is the hook: it re-runs the rejected call once a fresh token exists
- Park the other in-flight calls during the refresh, replay them all after it succeeds`,
    redFlags: `- Proposes refreshing token inside every request independently`,
  },
  {
    id: 'tech-22',
    type: 'technical',
    num: 22,
    difficulty: 'M',
    star: false,
    section: 'Architecture',
    title: 'How would you paginate a large list?',
    tags: [ 'networking', 'ui', 'system-design' ],
    related: [ 'sd-5', 'tech-18', 'tech-101' ],
    keyPoints: `- Jetpack Paging 3: \`PagingSource\` defines how to load pages, \`Pager\` creates \`Flow<PagingData>\`, \`LazyPagingItems\` in Compose
- Manual: cursor-based or offset-based, load next page when near bottom of list`,
    answer: `- Paging 3: \`PagingSource\` loads pages, \`Pager\` emits \`Flow<PagingData>\`, bound via \`LazyPagingItems\`
- Hand-rolled alternative: cursor or offset keys, fetch the next chunk as the list nears its end`,
    followUp: `**Follow-up:** What's the difference between offset and cursor-based pagination?
> Offset can miss/duplicate items if data changes between pages. Cursor (stable ID) is consistent.`,
    redFlags: `- Proposes loading all data and paginating locally`,
  },
  {
    id: 'tech-23',
    type: 'technical',
    num: 23,
    difficulty: 'M',
    star: true,
    section: 'Engineering',
    title: 'How do you unit test a ViewModel?',
    tags: [ 'testing', 'coroutines', 'viewmodel' ],
    related: [ 'tech-24', 'tech-75' ],
    keyPoints: `- Use \`TestCoroutineDispatcher\` / \`StandardTestDispatcher\` with \`runTest\`
- Inject fake/mock repository
- Assert on \`StateFlow\` values using \`Turbine\` or \`toList()\`
- \`TestCoroutineScheduler\` to control time

\`\`\`kotlin
@Test
fun \`shows error state when fetch fails\`() = runTest {
    val vm = FeedViewModel(FakeRepository(shouldFail = true))
    vm.uiState.test {
        assertEquals(UiState.Loading, awaitItem())
        assertEquals(UiState.Error, awaitItem())
    }
}
\`\`\``,
    answer: `- \`runTest\` with \`StandardTestDispatcher\` drives coroutines; \`TestCoroutineScheduler\` controls time
- Inject a fake repository so the ViewModel never touches the real data layer
- Assert \`StateFlow\` emissions with Turbine (\`awaitItem\`) or \`toList()\` — Loading first, then Error`,
    redFlags: `- Tests ViewModel without injecting dependencies (can't mock)`,
  },
  {
    id: 'tech-24',
    type: 'technical',
    num: 24,
    difficulty: 'E',
    star: false,
    section: 'Engineering',
    title: 'Mockito vs MockK — which do you prefer and why?',
    tags: [ 'testing', 'mocking' ],
    related: [ 'tech-23', 'tech-61' ],
    keyPoints: `- MockK: Kotlin-native, supports \`object\`, \`companion object\`, \`extension functions\`, coroutines. Better for Kotlin projects.
- Mockito: Java-first, but has \`mockito-kotlin\` wrapper
- Preference: MockK for Kotlin codebases`,
    answer: `- On a Kotlin codebase, default to MockK — it covers the Kotlin constructs you'll actually need to stub
- Stay on Mockito (with \`mockito-kotlin\`) in mixed Java/Kotlin code where the team already knows it
- Either way, keep mocking to boundaries; the library matters less than what you mock`,
    redFlags: `- Uses Mockito with Java-style mock setup in Kotlin
- Reaches for \`mockkStatic\`/\`mockkObject\` to test code that should simply take the dependency as a parameter`,
  },
  {
    id: 'tech-25',
    type: 'technical',
    num: 25,
    difficulty: 'M',
    star: true,
    section: 'Engineering',
    title: 'What is dependency injection and why use it?',
    tags: [ 'di', 'koin', 'testing' ],
    related: [ 'tech-26', 'tech-27' ],
    keyPoints: `- DI = providing dependencies to a class rather than having it create them
- Benefits: testability (swap real for fake), decoupling, single source of truth for object creation
- Forms: constructor injection (preferred — dependencies are explicit and the object is never half-built), field/setter injection (only when something else constructs the object), method injection (a dependency needed for one call)
- It is a pattern, not a library: passing collaborators into constructors by hand ("manual DI" from a composition root such as the \`Application\`) is already DI — frameworks only automate the wiring (Hilt vs Koin: tech-65, service locator risks: tech-51)`,
    answer: `- Default to constructor parameters for every collaborator a class uses
- Decide object creation in one place (the composition root) instead of inside the classes that use them
- Pick a framework only once hand-wiring gets painful — the pattern comes first`,
    followUp: `**Follow-up:** Constructor injection is preferred — so why do Activities and Fragments use field injection?
> The framework instantiates them through a no-arg constructor (and recreates them after rotation or process death), so you cannot pass arguments in. Hilt's \`@AndroidEntryPoint\` therefore injects \`@Inject lateinit var\` fields in \`onCreate\`/\`onAttach\`. Everything you construct yourself should still use constructor injection.`,
    redFlags: `- Thinks DI = using a framework (not the pattern itself)
- Uses field injection with \`lateinit var\` in classes they construct themselves`,
  },
  {
    id: 'tech-26',
    type: 'technical',
    num: 26,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'In Koin, what is the difference between `single`, `factory`, and `scoped`?',
    tags: [ 'di', 'koin' ],
    related: [ 'tech-25', 'tech-27' ],
    keyPoints: `- \`single\`: one instance for the entire app lifetime (singleton)
- \`factory\`: new instance every time it's requested
- \`scoped\`: one instance per scope lifetime (e.g., per screen, per user session)`,
    answer: `- Default to \`factory\`; promote to \`single\` only for genuinely app-wide, stateless or expensive objects
- Use \`scoped\` when state must be shared inside a bounded lifetime (a flow, a session) and then dropped
- Never let a longer-lived definition capture a shorter-lived one`,
    followUp: `**Follow-up:** When would you use \`factory\` over \`single\`?
> When each caller needs its own isolated state — e.g., a ViewModel, a presenter that holds screen-specific state

**Follow-up:** What happens if you inject a \`factory\` dependency into a \`single\`?
> The \`single\` captures the first factory instance and holds it — effectively becomes a singleton. Classic scoping bug.`,
    redFlags: `- Makes everything \`single\` and then leaks per-screen state across screens
- Opens Koin scopes and never closes them`,
  },
  {
    id: 'tech-27',
    type: 'technical',
    num: 27,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'How do you structure Koin modules in a multi-module Android project?',
    tags: [ 'di', 'koin', 'modularization' ],
    related: [ 'sd-20', 'tech-25', 'tech-26' ],
    keyPoints: `- Each feature module exports its own \`Module\` via a top-level function (e.g., \`getFeedKoinModule()\`)
- App module collects and loads all modules: \`startKoin { modules(getFeatureAModule(), getFeatureBModule()) }\`
- Avoid cross-module direct dependencies — depend on interfaces defined in contract modules`,
    answer: `- Every feature module ships its own \`Module\`, returned by a function like \`getFeedKoinModule()\`
- The app module gathers them all in one \`startKoin { modules(...) }\` call
- Cross-module access goes through interfaces in contract modules, never direct implementation deps`,
    followUp: `**Follow-up:** How do you avoid circular module dependencies?
> Contract/interface modules that neither module owns. Feature A and B both depend on the contract, not each other.`,
    redFlags: `- Puts all DI in one giant module file`,
  },
  {
    id: 'tech-28',
    type: 'technical',
    num: 28,
    difficulty: 'M',
    star: false,
    section: 'Jetpack',
    title: 'What is Jetpack Navigation and what problem does it solve?',
    tags: [ 'navigation', 'architecture' ],
    related: [ 'sd-31', 'tech-29' ],
    keyPoints: `- Navigation component provides a graph-based approach to screen transitions
- Handles backstack management, deep links, transition animations, safe args
- Single \`NavController\` per nav graph; avoids manual \`FragmentTransaction\` management`,
    answer: `- Use Navigation whenever a screen flow is more than a couple of destinations — a declared graph beats hand-written transactions
- Pass ids through typed arguments, never whole objects
- Let the graph own deep links and the back stack instead of re-implementing them`,
    followUp: `**Follow-up:** How do you pass data between destinations safely?
> Safe Args plugin generates typed argument classes, avoiding stringly-typed bundles and runtime crashes`,
    redFlags: `- Still manually doing \`supportFragmentManager.beginTransaction()\`
- Passes large objects as navigation arguments instead of an id to reload`,
  },
  {
    id: 'tech-29',
    type: 'technical',
    num: 29,
    difficulty: 'M',
    star: false,
    section: 'Jetpack',
    title: 'How do you handle deep links in Android?',
    tags: [ 'navigation', 'deep-links' ],
    related: [ 'sd-31', 'tech-28' ],
    keyPoints: `- Declare \`<deepLink>\` in nav graph or \`<intent-filter>\` in manifest
- Navigation component handles matching URL → destination automatically
- Handle in \`Activity.onCreate\` and \`onNewIntent\` for single-task activities`,
    answer: `- Declare links on the destination (nav graph) so the back stack is synthesized for you
- Handle both entry points: a cold start through \`onCreate\` and a running \`singleTask\` host through \`onNewIntent\`
- Treat every link as untrusted input — validate parameters before navigating`,
    followUp: `**Follow-up:** What's the difference between explicit and implicit deep links?
> Explicit: programmatic navigation via \`NavController\`. Implicit: triggered by external URL (web, push notification) via intent matching.`,
    redFlags: `- Parses the URL by hand in the Activity instead of declaring it on the destination
- Trusts deep-link parameters (ids, redirect URLs) without validation`,
  },
  {
    id: 'tech-30',
    type: 'technical',
    num: 30,
    difficulty: 'M',
    star: true,
    section: 'Jetpack',
    title: 'WorkManager vs Service vs JobScheduler — when do you use each?',
    tags: [ 'background', 'workmanager' ],
    related: [ 'sd-18', 'tech-31', 'tech-32' ],
    keyPoints: `- \`WorkManager\`: deferrable, guaranteed execution even after app restart or reboot. Best for: sync, upload, cleanup
- \`Service\` (Foreground): user-visible long-running work (music playback, location tracking)
- \`JobScheduler\`: system-level job scheduling (API 21+); WorkManager wraps it internally
- Coroutines/threads: for work that only needs to run while app is alive`,
    answer: `- Must finish even if the app dies → WorkManager
- User is watching it happen right now → foreground Service
- Only matters while the screen is alive → a coroutine in the right scope; call JobScheduler directly almost never`,
    followUp: `**Follow-up:** What guarantees does WorkManager provide that a plain coroutine doesn't?
> WorkManager persists work to a database — survives process death, reboots, and OOM kills. Coroutines die with the process.`,
    redFlags: `- Uses WorkManager for everything including real-time work
- Starts a background Service for periodic sync on Android 8+ and hits background-execution limits`,
  },
  {
    id: 'tech-31',
    type: 'technical',
    num: 31,
    difficulty: 'M',
    star: false,
    section: 'Jetpack',
    title: 'How do you chain work in WorkManager?',
    tags: [ 'background', 'workmanager' ],
    related: [ 'tech-30' ],
    keyPoints: `\`\`\`kotlin
WorkManager.getInstance(context)
    .beginWith(uploadWorker)
    .then(notifyWorker)
    .enqueue()
\`\`\`
- \`beginWith\` + \`then\` creates sequential chain
- \`beginWith(listOf(...))\` runs multiple workers in parallel then joins
- Output of one worker can be passed as input to the next via \`Data\``,
    answer: `- Sequence steps with \`beginWith(worker).then(next)\`, then \`enqueue()\`
- \`beginWith(listOf(...))\` fans several workers out in parallel and joins them before the next step
- A worker returns output \`Data\`, which becomes the input of the worker after it`,
    redFlags: `- Has only used one-off \`enqueue\`, never chained`,
  },
  {
    id: 'tech-32',
    type: 'technical',
    num: 32,
    difficulty: 'E',
    star: false,
    section: 'Android Core',
    title: 'What are the different types of Android Services?',
    tags: [ 'services', 'background' ],
    related: [ 'tech-30', 'tech-33' ],
    keyPoints: `- **Started service**: runs until it stops itself or is stopped (\`startService\`)
- **Bound service**: clients bind to it, lifecycle tied to bound clients (\`bindService\`)
- **Foreground service**: shows a persistent notification, higher process priority (music, navigation)
- **IntentService** (deprecated): was a started service that handles work on a background thread — replaced by WorkManager + coroutines`,
    answer: `- Choose by who controls the lifetime: the service itself (started), its clients (bound), or the user-visible notification (foreground)
- Reach for a foreground service only for work the user knowingly keeps running
- New background jobs go to WorkManager, never a new \`IntentService\``,
    followUp: `**Follow-up:** When would you use a foreground service vs WorkManager?
> Foreground for ongoing user-visible work where the user expects it to keep running (music, navigation). WorkManager for fire-and-forget guaranteed work.`,
    redFlags: `- Runs long work in a plain started service and is surprised when Android 8+ kills it in the background
- Starts a foreground service without declaring its \`foregroundServiceType\` on Android 14+`,
  },
  {
    id: 'tech-33',
    type: 'technical',
    num: 33,
    difficulty: 'E',
    star: false,
    section: 'Android Core',
    title: 'What is a BroadcastReceiver? What are the two ways to register one?',
    tags: [ 'broadcast', 'android-components' ],
    related: [ 'tech-32', 'tech-70' ],
    keyPoints: `- \`BroadcastReceiver\`: responds to system-wide or app-level broadcast events (network change, boot completed, battery low)
- **Manifest registration**: receives broadcasts even when app is not running (limited by Android 8+ background restrictions)
- **Dynamic registration**: register in code (\`registerReceiver\`), only active while registered, must unregister to avoid leaks`,
    answer: `- Prefer runtime registration tied to a lifecycle; reserve manifest receivers for the few system broadcasts still allowed
- Pair every \`registerReceiver\` with an unregister in the mirror callback
- For "run something when X happens in the background", reach for WorkManager constraints instead`,
    followUp: `**Follow-up:** What did Android 8 change about broadcast receivers?
> Manifest-registered receivers for implicit broadcasts are mostly blocked. Apps must use dynamic registration or JobScheduler/WorkManager.`,
    redFlags: `- Doesn't unregister dynamically registered receivers
- Registers a manifest receiver for \`CONNECTIVITY_ACTION\` on Android 8+ and wonders why it never fires`,
  },
  {
    id: 'tech-34',
    type: 'technical',
    num: 34,
    difficulty: 'M',
    star: false,
    section: 'Performance & Security',
    title: 'What is overdraw and how do you fix it?',
    tags: [ 'performance', 'rendering', 'ui' ],
    related: [ 'tech-35', 'tech-114' ],
    keyPoints: `- Overdraw = pixel drawn more than once per frame (background stacked under background)
- Detected with "Debug GPU Overdraw" in developer options (red = 4x overdraw)
- Fix by: removing unnecessary backgrounds, using \`clipRect\` in custom views, flattening view hierarchy`,
    answer: `- Overdraw means a pixel is painted repeatedly in one frame, usually stacked backgrounds
- "Debug GPU Overdraw" in developer options reveals it; red marks 4x repaint regions
- Fixes: drop redundant backgrounds, \`clipRect\` inside custom drawing, flatten the view tree`,
    followUp: `**Follow-up:** How does Compose help with overdraw vs View system?
> Compose's layout system naturally avoids overdraw because it composites correctly; also no XML backgrounds stacked unintentionally.`,
    redFlags: `- Leaves the theme's window background in place under a full-screen opaque layout background
- Guesses at overdraw instead of checking the Debug GPU Overdraw overlay`,
  },
  {
    id: 'tech-35',
    type: 'technical',
    num: 35,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'What is jank? How do you detect and fix it?',
    tags: [ 'performance', 'rendering', 'profiling' ],
    related: [ 'tech-34', 'tech-9' ],
    keyPoints: `- Jank = dropped frames, UI stutters when frame takes >16ms (60fps budget)
- Detection: Android Studio Profiler (CPU trace), Perfetto, \`FrameMetrics\` API
- Common causes: main-thread IO, expensive \`onDraw\`, deep view hierarchy, layout inflation on scroll`,
    answer: `- Name the frame budget for the actual refresh rate, then find which frames miss it — measure before fixing
- Fix main-thread work first; it is the most common cause and the cheapest to remove
- Track jank in production too, since lab devices hide real-world stutter`,
    followUp: `**Follow-up:** What tools do you use in production to catch jank?
> Firebase Performance, custom \`FrameMetricsAggregator\` reporting, Android Vitals (Play Console)`,
    redFlags: `- Tries fixes by intuition without capturing a trace
- Tests only on a flagship device and ships stutter to low-end phones`,
  },
  {
    id: 'tech-37',
    type: 'technical',
    num: 37,
    difficulty: 'M',
    star: false,
    section: 'Performance & Security',
    title: 'How do you securely store sensitive data on Android?',
    tags: [ 'security', 'storage' ],
    related: [ 'tech-164', 'tech-161' ],
    keyPoints: `- **Keystore**: store cryptographic keys, never extracted from hardware-backed storage
- **Jetpack Security (EncryptedSharedPreferences / EncryptedFile) is deprecated — no longer the primary recommendation**: use a Keystore-backed master key with app-level AES-GCM (or a maintained community replacement) to encrypt values at rest
- Never store tokens in plain SharedPreferences or files
- Don't hardcode secrets in source — use server-side token exchange`,
    answer: `- Keys belong in the Keystore — hardware-backed, so they never leave as plaintext
- \`EncryptedSharedPreferences\`/\`EncryptedFile\` (Jetpack Security) is deprecated — legacy, not the default
- Encrypt at rest with Keystore-backed AES-GCM; no plaintext tokens in prefs, no secrets in source`,
    followUp: `**Follow-up:** What's wrong with storing auth tokens in SharedPreferences?
> Unencrypted on rooted devices. On Android 6+, use EncryptedSharedPreferences or Keystore-backed storage.`,
    redFlags: `- Stores tokens in plain SharedPreferences or hardcoded strings`,
  },
  {
    id: 'tech-40',
    type: 'technical',
    num: 40,
    difficulty: 'M',
    star: true,
    section: 'Kotlin',
    title: 'What is an inline function? When would you use `reified`?',
    tags: [ 'kotlin', 'advanced', 'generics' ],
    related: [ 'tech-1', 'tech-4' ],
    keyPoints: `- Inline functions have their bytecode copied to call sites — no lambda allocation overhead
- \`reified\` type params let you use \`T::class\` at runtime inside inline functions — normally type params are erased by the JVM`,
    answer: `- \`inline\` copies the body into each call site — no lambda allocation overhead
- \`reified\` lets an inline function touch \`T::class\` at runtime despite JVM erasure`,
    followUp: `**Follow-up:** What's the performance cost of non-inline lambdas?
> Each lambda creates an anonymous class instance; inline avoids that allocation entirely.`,
    redFlags: `- Thinks \`reified\` works on non-inline functions`,
  },
  {
    id: 'tech-42',
    type: 'technical',
    num: 42,
    difficulty: 'M',
    star: false,
    section: 'Kotlin',
    title: 'What is the difference between `==` and `===` in Kotlin?',
    tags: [ 'kotlin', 'basics' ],
    related: [ 'tech-2', 'tech-1' ],
    keyPoints: `- \`==\` calls \`equals()\` (structural equality)
- \`===\` checks referential equality (same object in memory)
- For primitives, \`===\` compares values since they're unboxed by the compiler`,
    answer: `- \`==\` compares structure via \`equals()\`; \`===\` requires the identical object
- Trap: primitives get unboxed, so \`===\` ends up comparing their values`,
    followUp: `**Follow-up:** When would \`==\` and \`===\` give different results?
> Two separate \`data class\` instances with the same fields: \`==\` is true, \`===\` is false.`,
    redFlags: `- Thinks \`==\` is reference equality (Java reflex)`,
  },
  {
    id: 'tech-43',
    type: 'technical',
    num: 43,
    difficulty: 'H',
    star: true,
    section: 'Jetpack',
    title: 'How does Compose manage recomposition scope? What is `CompositionLocal`?',
    tags: [ 'compose', 'advanced', 'state' ],
    related: [ 'tech-138', 'tech-12' ],
    keyPoints: `- Recomposition is scoped — only composables that read changed state recompose, not the whole tree
- \`CompositionLocal\` provides implicit data down the composition tree without passing params explicitly (e.g., \`MaterialTheme\`, \`LocalContext\`)
- Use sparingly — makes data flow implicit and harder to track`,
    answer: `- Invalidation stays narrow — just the composables that read the altered value rerun, never the whole tree
- \`CompositionLocal\` passes values implicitly to descendants, as \`MaterialTheme\` and \`LocalContext\` do
- Reach for it sparingly — implicit inputs are harder to trace than parameters`,
    followUp: `**Follow-up:** When would you prefer CompositionLocal over passing a parameter?
> Cross-cutting concerns (theme, locale, analytics) that many composables need but shouldn't be in every function signature.`,
    redFlags: `- Passes everything as props for no reason
- Uses CompositionLocal for regular business data flow`,
  },
  {
    id: 'tech-44',
    type: 'technical',
    num: 44,
    difficulty: 'H',
    star: false,
    section: 'Jetpack',
    title: 'How do you create a custom `Modifier` in Compose?',
    tags: [ 'compose', 'advanced', 'ui' ],
    related: [ 'tech-138', 'tech-13' ],
    keyPoints: `- Implement \`Modifier.Element\` or use \`Modifier.composed {}\` for stateful modifiers
- \`drawBehind\`, \`drawWithContent\`: custom drawing behind or over content
- \`layout\`: change measurement and placement
- \`pointerInput\`: gesture detection`,
    answer: `- Implement \`Modifier.Element\`, or \`Modifier.composed {}\` when the modifier needs its own state
- \`drawBehind\` and \`drawWithContent\` handle custom painting under or over the content
- \`layout\` rewrites measurement and placement; \`pointerInput\` adds gestures`,
    followUp: `**Follow-up:** What's the difference between \`Modifier.layout\` and \`Modifier.drawBehind\`?
> \`layout\` changes how the composable is measured and placed. \`drawBehind\` draws behind the content without affecting layout at all.`,
    redFlags: `- Only uses built-in modifiers`,
  },
  {
    id: 'tech-45',
    type: 'technical',
    num: 45,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'What is Clean Architecture and how do you apply it to Android?',
    tags: [ 'architecture', 'clean-architecture', 'mvvm' ],
    related: [ 'tech-75', 'tech-102' ],
    keyPoints: `- Three layers: Presentation (ViewModel + UI), Domain (UseCases + entities, pure Kotlin, no Android deps), Data (Repositories, API, DB)
- Dependency rule: outer layers depend on inner layers, never the reverse
- UseCases encapsulate single business operations and are reusable across ViewModels`,
    answer: `- Apply it as a dependency direction, not a folder layout: business rules must compile without Android
- Add a use case only for real business operations; don't mandate one per repository call (trade-off: tech-132)
- Start with layers as packages and split into modules when compile-time enforcement is worth the build cost`,
    followUp: `**Follow-up:** Does Clean Architecture require a separate Gradle module per layer?
> No — layers can be packages. Separate modules make the dependency rule compiler-enforced (a \`:domain\` module with no Android plugin cannot import \`Context\`), at the cost of more build configuration.`,
    redFlags: `- Puts business logic in ViewModel or Repository
- Lets Android types (\`Context\`, \`Parcelable\`, Room annotations) leak into domain entities`,
  },
  {
    id: 'tech-46',
    type: 'technical',
    num: 46,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'What is Unidirectional Data Flow (UDF)? How does MVI implement it strictly?',
    tags: [ 'architecture', 'udf', 'mvi', 'state', 'compose' ],
    related: [ 'tech-75', 'tech-45', 'tech-157' ],
    keyPoints: `- **UDF (Unidirectional Data Flow)**: state flows down, events flow up — one direction, no bidirectional binding loops
- **Jetpack UDF**: a state holder exposes one immutable UI-state stream (StateFlow) and receives events as plain function calls
- **MVI (Model-View-Intent)**: the strict form of UDF — a single immutable State object per screen, every user action modeled as an Intent, run through a pure reducer (current state + intent → new state)
- **Compose state hoisting**: same UDF idea at composable scale — state down as parameters, events up as lambdas
- **Payoff**: every visual change traces to an event and a state transition — testable without a device, replayable, debuggable with state logs
- **Cost**: one mega state object churns recomposition when unrelated fields change — slice the state or split snapshot state objects per region`,
    answer: `- If you can't trace a pixel back to one event and one state transition, the flow isn't unidirectional
- Apply the same rule at every scale: screen state holder, then hoisted composables
- Reach for strict MVI when you need that guarantee enforced by types, not by convention`,
    followUp: `**Follow-up:** What's a "reducer" in MVI?
> A pure function: \`(currentState, intent) → newState\`. No side effects.

**Follow-up:** What is a Side Effect in MVI and how do you handle it?
> One-shot events that shouldn't be replayed (navigation, snackbar). Use a separate \`SharedFlow<Effect>\` alongside the \`StateFlow<State>\`.`,
    redFlags: `- Two-way binds a text field to ViewModel state and the value ping-pongs (a UDF loop)
- Puts side effects (navigation) in the State object
- Mutates state directly instead of emitting new state
- Confuses Intent (user action) with Android's \`android.content.Intent\``,
  },
  {
    id: 'tech-47',
    type: 'technical',
    num: 47,
    difficulty: 'M',
    star: true,
    section: 'Engineering',
    title: 'How do you test Compose UI? What is the `ComposeTestRule`?',
    tags: [ 'testing', 'compose', 'ui' ],
    related: [ 'tech-23', 'tech-24' ],
    keyPoints: `- Use \`createComposeRule()\` to set content and interact with it
- API: \`onNodeWithText()\`, \`performClick()\`, \`assertIsDisplayed()\` via SemanticsNode tree
- Screenshot testing: Paparazzi or Roborazzi`,
    answer: `- \`createComposeRule()\` installs the content you then drive and assert on
- Match through the semantics tree: \`onNodeWithText()\` plus \`performClick()\`, \`assertIsDisplayed()\`
- For visual regressions use screenshot tooling: Paparazzi or Roborazzi`,
    followUp: `**Follow-up:** How do you wait for async operations in Compose tests?
> \`rule.mainClock.advanceTimeBy(ms)\` to advance the clock manually, or \`rule.waitUntil { condition }\` to poll.`,
    redFlags: `- Has only ever tested ViewModels
- No UI testing experience at all`,
  },
  {
    id: 'tech-51',
    type: 'technical',
    num: 51,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'Why is a service locator (Koin-style get()) riskier than constructor injection?',
    tags: [ 'di', 'service-locator', 'koin', 'hilt' ],
    related: [ 'tech-25', 'tech-26', 'tech-27', 'tech-65' ],
    keyPoints: `- A service locator resolves dependencies at the call site (get<T>()), so the dependency graph is invisible in signatures
- Constructor injection makes every requirement explicit — with Hilt/Dagger a missing binding is a compile error, not a runtime surprise
- The classic failure mode: get<T>() throws only when the code first runs, so untested paths ship crashes
- Hidden dependencies break refactor safety: rename or remove a class and nothing points at the broken get() call sites
- Testing follows from the same property: constructor parameters take fakes directly, while get() demands a booted Koin graph or module overrides per test
- Scoping is runtime bookkeeping (close the scope yourself or leak) versus Hilt tying lifetimes to Android components via annotations
- The honest tradeoff: service locators buy simplicity and runtime flexibility (plugin/module boundaries, small prototypes); the price is late failure detection — not a verdict against Koin itself`,
    answer: `- \`get<T>()\` resolves at the call site, so a signature hides what a class actually needs
- Failure waits until first execution: an untested path ships a crash, where Dagger/Hilt fail the build
- Hidden deps also break refactors (nothing flags stale \`get()\` sites) and leak scopes you must close`,
    followUp: `**Follow-up:** What does "compile-time safety" mean for DI?
> Hilt generates code at build time — missing bindings are compile errors, not runtime crashes. Koin only fails when the dependency is first requested.`,
    redFlags: `- Thinks Koin and Hilt are equivalent in safety`,
  },
  {
    id: 'tech-52',
    type: 'technical',
    num: 52,
    difficulty: 'H',
    star: true,
    section: 'Concurrency',
    title: 'Explain Flow operators: `map`, `flatMapLatest`, `combine`, `zip`, `debounce`. When do you use each?',
    tags: [ 'coroutines', 'flow', 'advanced' ],
    related: [ 'tech-14', 'tech-136', 'tech-16' ],
    keyPoints: `- \`map\`: transforms each emission
- \`flatMapLatest\`: cancels previous inner flow on new emission (great for search-as-you-type)
- \`combine\`: emits when ANY upstream emits, using the latest value from each source
- \`zip\`: pairs emissions 1:1 — waits for both to emit before producing a pair
- \`debounce\`: delays emission until the source is quiet for X ms (throttling search input)`,
    answer: `- \`map\` transforms each value; \`debounce\` waits for X ms of silence, good for search fields
- \`flatMapLatest\` abandons the prior inner flow on each new value — the type-as-you-search operator
- \`zip\` waits on both sides and pairs 1:1; \`combine\` fires on any source change using each latest value`,
    followUp: `**Follow-up:** When would you use \`flatMapLatest\` vs \`combine\`?
> \`flatMapLatest\`: sequential dependent requests where only the latest matters (search). \`combine\`: two independent state streams that should be merged into one combined state.`,
    redFlags: `- Only knows \`map\` and \`filter\``,
  },
  {
    id: 'tech-53',
    type: 'technical',
    num: 53,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What does "lifecycle-aware" mean, and how do you scope work to a lifecycle correctly?',
    tags: [ 'lifecycle', 'coroutines', 'flow' ],
    related: [ 'tech-6', 'tech-13', 'tech-138', 'tech-89' ],
    keyPoints: `- Lifecycle-aware components observe Lifecycle events and do work only while the owner is at least STARTED
- The classic bug: lifecycleScope.launch { flow.collect() } keeps collecting while backgrounded — gate with repeatOnLifecycle(STARTED) so collection pauses off-screen
- repeatOnLifecycle re-runs its block on every STARTED; launchWhenStarted cancels at STOP and a suspended collect never resumes — use it only for single suspending calls
- ProcessLifecycleOwner gives app-level foreground/background observation (sessions, timeouts) instead of per-screen wiring
- The Compose equivalents: DisposableEffect ties resource cleanup to composition, and collectAsStateWithLifecycle handles STARTED-aware collection
- The leak pattern to name: an observer registered on a longer-lived lifecycle that captures the Activity — remove the observer in onDestroy or scope it to the right owner`,
    answer: `- Collect UI flows only inside \`repeatOnLifecycle(STARTED)\` (or \`collectAsStateWithLifecycle\` in Compose)
- Let the lifecycle, not manual flags, decide when work starts and stops
- Treat \`launchWhenX\` as legacy — never use it for streams`,
    followUp: `**Follow-up:** Why is launchWhenStarted discouraged in favor of repeatOnLifecycle?
> A suspending point inside the block (like flow.collect) is cancelled at STOP and never resumes — later STARTED events do not re-enter the block. repeatOnLifecycle restarts the whole block each time the state reaches STARTED, so collection genuinely pauses and resumes.`,
    redFlags: `- Collects Flows in lifecycleScope.launch with no STARTED gating
- Registers LifecycleEventObservers but never removes them`,
  },
  {
    id: 'tech-54',
    type: 'technical',
    num: 54,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'What is the Android rendering pipeline? What causes dropped frames at each stage?',
    tags: [ 'performance', 'rendering', 'advanced', 'profiling', 'pipeline' ],
    related: [ 'tech-34', 'tech-35', 'tech-8' ],
    keyPoints: `- Pipeline stages: Input → Animation → Measure → Layout → Draw → GPU (RenderThread) → Display
- Dropped frames occur when any stage takes >16ms (60fps budget)
- Common causes by stage: main thread IO (Input), expensive \`onDraw\` (Draw), deep view hierarchy (Measure/Layout), texture uploads (GPU)
- Tools: Systrace/Perfetto reveals which stage is the bottleneck`,
    answer: `- A frame is a relay: the budget is shared by every stage, so find the stage that overran before optimizing
- Main-thread stages (input, measure/layout, draw recording) and GPU-side stages need different fixes
- Diagnose from a trace, not intuition — the slow stage is usually not the one you suspected`,
    followUp: `**Follow-up:** What is the RenderThread and why was it introduced?
> RenderThread offloads GPU work from the main thread. Introduced in Android 5.0 so animations can continue even when the main thread is briefly busy.`,
    redFlags: `- Blames every dropped frame on "too much work" without saying which stage — main thread or RenderThread/GPU — blew the budget
- Assumes the budget is always 16ms — on a 90Hz or 120Hz display it is ~11ms or ~8ms`,
  },
  {
    id: 'tech-57',
    type: 'technical',
    num: 57,
    difficulty: 'H',
    star: false,
    section: 'Kotlin',
    title: 'Explain Kotlin coroutine `Flow` cold vs hot streams.',
    tags: [ 'coroutines', 'flow', 'advanced', 'kotlin' ],
    related: [ 'tech-14', 'tech-44', 'tech-136' ],
    keyPoints: `- Cold flow: starts executing when collected; each collector gets its own independent stream. Created with \`flow { }\` builder.
- Hot flow: exists independently of collectors; emits whether or not someone is listening. \`StateFlow\` and \`SharedFlow\` are hot.
- Cold → hot: \`stateIn()\` or \`shareIn()\` operators convert a cold flow to hot, managing the upstream lifetime with a scope.`,
    answer: `- Cold: production begins at collection; every collector drives a separate stream
- Hot: exists without collectors, emitting either way — \`StateFlow\`, \`SharedFlow\`
- \`stateIn()\`/\`shareIn()\` promote cold→hot, with a scope governing upstream lifetime`,
    followUp: `**Follow-up:** What is \`stateIn(scope, started, initialValue)\` and why would you use it?
> Converts a cold upstream flow (e.g., a Room query) to a \`StateFlow\`. The \`started\` param controls when upstream collection begins — \`WhileSubscribed(5000)\` is standard: keeps upstream alive for 5s after last subscriber (survives config change, dies on background).`,
    redFlags: `- Collects a cold \`Flow\` in \`init {}\` of a ViewModel (no lifecycle awareness)
- Thinks all Flows are hot`,
  },
  {
    id: 'tech-58',
    type: 'technical',
    num: 58,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'How do you implement biometric authentication on Android?',
    tags: [ 'security', 'biometric', 'android-components' ],
    related: [ 'tech-37', 'tech-164', 'tech-9' ],
    keyPoints: `- Use \`BiometricPrompt\` (AndroidX) — unified API for fingerprint, face, iris
- \`BiometricManager.canAuthenticate(authenticators)\` — check device capability before showing prompt
- Callback: \`onAuthenticationSucceeded\`, \`onAuthenticationError\`, \`onAuthenticationFailed\`
- Crypto layer: authenticate with a \`CryptoObject\` wrapping a \`Cipher\` backed by a key in Android Keystore — ensures biometric gate is cryptographically enforced`,
    answer: `- Always gate something real: unlock a Keystore key via \`CryptoObject\`, otherwise the prompt is cosmetic
- Check capability up front and offer a device-credential fallback instead of dead-ending the user
- Use \`BiometricPrompt\` only; never talk to fingerprint hardware directly`,
    followUp: `**Follow-up:** What's the difference between \`BIOMETRIC_STRONG\` and \`BIOMETRIC_WEAK\`?
> Strong: Class 3 biometric, usable with \`CryptoObject\` (cryptographic binding). Weak: Class 2, lower security, cannot bind to a crypto key.`,
    redFlags: `- Uses deprecated \`FingerprintManager\` directly
- Shows biometric prompt but doesn't cryptographically enforce it (gate can be bypassed)`,
  },
  {
    id: 'tech-59',
    type: 'technical',
    num: 59,
    difficulty: 'E',
    star: false,
    section: 'Android Core',
    title: 'What is a `ContentProvider`? When would you use one?',
    tags: [ 'android-components', 'storage', 'security' ],
    related: [ 'tech-19', 'tech-37' ],
    keyPoints: `- \`ContentProvider\` exposes structured data to other apps via a content URI (\`content://authority/table\`)
- Used for: sharing data across apps (Contacts, MediaStore), \`FileProvider\` for sharing files securely via Intent
- Query interface mirrors SQLite: \`query()\`, \`insert()\`, \`update()\`, \`delete()\``,
    answer: `- Reach for a \`ContentProvider\` only when another app (or the system) must read your data
- For sharing a file, use \`FileProvider\` with temporary URI grants — never a raw path
- Inside your own app, go straight to Room/DAOs`,
    followUp: `**Follow-up:** When must you use \`FileProvider\` instead of direct file path?
> Android 7.0+ blocks \`file://\` URIs in Intents. \`FileProvider\` wraps the path as a \`content://\` URI with temporary permission.

**Follow-up:** Do you need a ContentProvider to access your own app's Room database?
> No — ContentProvider is for cross-app sharing. Internal data access goes directly through the DAO.`,
    redFlags: `- Creates a ContentProvider for internal app data
- Exports a provider (\`android:exported="true"\`) without read/write permissions`,
  },
  {
    id: 'tech-60',
    type: 'technical',
    num: 60,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'How do you speed up Android Gradle builds?',
    tags: [ 'build', 'gradle', 'performance', 'tooling' ],
    related: [ 'sd-23', 'tech-161', 'tech-43' ],
    keyPoints: `- Enable configuration cache (\`org.gradle.configuration-cache=true\`) — skips Gradle configuration phase on repeat builds
- Enable build cache (\`org.gradle.caching=true\`) — reuses task outputs across builds and CI
- Modularize — feature modules compile independently; only changed modules recompile
- Use \`kotlin.incremental=true\` and \`kapt.incremental.apt=true\`
- Replace \`kapt\` with \`ksp\` (Kotlin Symbol Processing) — significantly faster annotation processing
- R8/ProGuard only in release builds (not debug)`,
    answer: `- Profile first with a build scan; optimize the phase that actually dominates
- Turn on the free wins (build and configuration cache, KSP over kapt) before restructuring anything
- Then invest in module structure so a typical change recompiles as little as possible`,
    followUp: `**Follow-up:** What is the difference between kapt and ksp?
> kapt converts Kotlin to Java stubs then runs Java annotation processors — slow. ksp processes Kotlin directly without stubs — 2–3× faster.`,
    redFlags: `- Upgrades hardware or CI machines before profiling where the build time goes
- Does expensive work (network calls, \`git\` commands) at configuration time in build scripts`,
  },
  {
    id: 'tech-61',
    type: 'technical',
    num: 61,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'What is a fake vs a mock? When do you use each in Android tests?',
    tags: [ 'testing', 'mocking', 'architecture' ],
    related: [ 'tech-23', 'tech-24' ],
    keyPoints: `- Mock: generated object (MockK/Mockito) where you define return values per call. Tight coupling to method calls — fragile if internals change.
- Fake: real but simplified implementation (e.g., \`FakeRepository\` backed by \`HashMap\`). More resilient to refactors, better for integration-style tests.
- Rule: mock infrastructure boundaries (HTTP client, DB). Fake domain abstractions (Repository, Cache).`,
    answer: `- Default to fakes for your own abstractions; they survive refactors
- Mock only at edges you don't own or where the interaction itself is the behaviour
- If a test breaks after a refactor that didn't change behaviour, it was over-mocked`,
    followUp: `**Follow-up:** What is the Arrange-Act-Assert pattern?
> Arrange: set up dependencies and state. Act: invoke the system under test. Assert: verify output/state/interactions.`,
    redFlags: `- Mocks everything including simple data classes
- Writes tests that verify private implementation details via mocks (over-mocking)`,
  },
  {
    id: 'tech-62',
    type: 'technical',
    num: 62,
    difficulty: 'H',
    star: false,
    section: 'Performance & Security',
    title: 'How does the Android Keystore work? What guarantees does it provide?',
    tags: [ 'security', 'keystore', 'biometric', 'advanced' ],
    related: [ 'tech-37', 'tech-164', 'tech-58' ],
    keyPoints: `- Android Keystore stores cryptographic keys in a secure hardware enclave (TEE or StrongBox) — keys never leave hardware in plaintext
- Generate a key: \`KeyPairGenerator\` or \`KeyGenerator\` with \`KeyStore.getInstance("AndroidKeyStore")\`
- Specify constraints: \`userAuthenticationRequired\`, \`invalidatedByBiometricEnrollment\`, \`keyValidityDuration\`
- Use cases: Keystore master key protecting app-level field encryption, biometric crypto gates, HTTPS client certificates`,
    answer: `- Put key material in the Keystore and keep only ciphertext in app storage
- Add constraints (user auth, biometric-enrollment invalidation, validity window) to match the threat model
- Plan for key loss — design data so a wiped key means re-login, not a crash`,
    followUp: `**Follow-up:** What happens to a Keystore key if the user enrolls a new fingerprint?
> If \`invalidatedByBiometricEnrollment = true\`, the key is permanently deleted — prevents an attacker adding a fingerprint to bypass auth.`,
    redFlags: `- Stores encrypted keys in SharedPreferences (no hardware protection)
- Assumes Keystore keys survive app uninstall, or migrate to a new device through backup/restore`,
  },
  {
    id: 'tech-63',
    type: 'technical',
    num: 63,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'How do Baseline Profiles improve app startup? How do you generate one?',
    tags: [ 'performance', 'startup', 'profiling', 'advanced', 'baseline-profile' ],
    related: [ 'tech-35', 'tech-114', 'tech-161', 'tech-110' ],
    keyPoints: `- Baseline Profiles pre-compile a subset of app bytecode to native (AOT) at install time, reducing JIT compilation during first run
- Result: published measurements land around 20–40% faster startup and less jank on cold start and early interactions (better time-to-interactive) — the effect varies with app size, device tier, and Android version
- Coverage is exact: only the methods listed in the profile are precompiled; any path you did not record still starts interpreted/JIT
- Generation: use \`BaselineProfileRule\` (Macrobenchmark library) on a real device or emulator to record a startup journey plus critical user journeys, output \`baseline-prof.txt\`, commit to source
- AGP bundles the profile into the APK/AAB. Play Store pre-compiles it on device.`,
    answer: `- Treat a Baseline Profile as the default first fix for slow cold start and first-interaction jank
- Profile the journeys users actually hit first — anything you don't record gets no benefit
- Regenerate it whenever those journeys change; a stale profile silently stops paying off`,
    followUp: `**Follow-up:** What is the difference between a Baseline Profile and a Startup Profile?
> Both are the same format. "Startup Profile" is a term used when the profile covers only cold start paths. Baseline Profile may also cover critical user journeys beyond startup.`,
    redFlags: `- Thinks Baseline Profiles are only for library code
- Expects R8 alone to fix startup — R8 shrinks and optimizes bytecode but does nothing about interpreting/JIT-compiling it on first run`,
  },
  {
    id: 'tech-64',
    type: 'technical',
    num: 64,
    difficulty: 'M',
    star: false,
    section: 'Jetpack',
    title: 'How do you handle different screen sizes and orientations in Compose?',
    tags: [ 'compose', 'ui', 'responsive', 'adaptive' ],
    related: [ 'tech-138', 'tech-34' ],
    keyPoints: `- \`WindowSizeClass\` (Material3) — compact / medium / expanded buckets for width and height
- \`BoxWithConstraints\` for local size-aware layouts
- Adaptive layouts: \`NavigationSuiteScaffold\` auto-switches between bottom nav (compact) and side rail (expanded)
- \`LocalConfiguration.current\` for raw screen info (less preferred)
- Avoid hardcoded dp values for major layout decisions — use \`WindowSizeClass\` instead`,
    answer: `- Branch layout on window size classes, not device type or orientation
- Decide at the top of the screen and pass the decision down; use local constraints only for leaf components
- Test compact, medium and expanded widths as part of the normal workflow`,
    followUp: `**Follow-up:** How do you test layout on different screen sizes without a device?
> Android Studio preview with \`@PreviewScreenSizes\` annotation or Resizable Emulator.`,
    redFlags: `- Hardcodes layout for phone only
- Uses \`Resources.getSystem().displayMetrics\` directly in composables`,
  },
  {
    id: 'tech-65',
    type: 'technical',
    num: 65,
    difficulty: 'H',
    star: false,
    section: 'Engineering',
    title: 'Hilt vs Koin — architecture, tradeoffs, when to pick each.',
    tags: [ 'di', 'hilt', 'koin', 'architecture' ],
    related: [ 'tech-25', 'tech-26', 'tech-27' ],
    keyPoints: `- The safety difference (build-time graph validation vs failure on first \`get()\`) is covered in tech-51 and tech-168; this is the team/project decision around it
- Hilt: Dagger underneath — steep learning curve, kapt/KSP codegen adds build time, Android-only
- Koin: plain Kotlin DSL, fast to learn, no codegen, runs on Kotlin Multiplatform
- Hilt integrates with \`@HiltViewModel\`, \`@AndroidEntryPoint\`, Compose navigation, WorkManager — all via Android Jetpack
- Koin integrates with \`viewModel\`, \`get()\`, easy for KMM

**When to pick:**
- Hilt: large team, high correctness bar, full Android project
- Koin: rapid prototyping, KMM shared code, small team with Kotlin familiarity`,
    answer: `- Choose on team and platform, not taste: Android-only and many contributors → Hilt
- Kotlin Multiplatform shared code or a small, fast-moving team → Koin
- Whichever you pick, keep classes on constructor injection so switching later is a wiring change`,
    redFlags: `- Proposes migrating a working codebase from one to the other with no concrete pain point driving it
- Uses Hilt without understanding the Dagger component hierarchy underneath`,
  },
  {
    id: 'tech-67',
    type: 'technical',
    num: 67,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'Walk me through the Fragment lifecycle. What\'s the difference between `onCreateView` and `onViewCreated`?',
    tags: [ 'fragments', 'lifecycle' ],
    related: [ 'tech-6', 'tech-53' ],
    keyPoints: `- \`onAttach\` → \`onCreate\` → \`onCreateView\` → \`onViewCreated\` → \`onStart\` → \`onResume\`
- \`onPause\` → \`onStop\` → \`onDestroyView\` → \`onDestroy\` → \`onDetach\`
- \`onCreateView\`: inflate and return the layout — keep it lightweight (no binding to views here)
- \`onViewCreated\`: called immediately after; safe to access views, set up observers, click listeners
- Key: views are destroyed in \`onDestroyView\` but the Fragment instance lives on (backstack). Null ViewBinding reference in \`onDestroyView\` to avoid leaks.`,
    answer: `- Put view wiring in \`onViewCreated\` and view teardown in \`onDestroyView\`
- Remember the fragment outlives its view on the back stack — never hold view references past it
- Observe with \`viewLifecycleOwner\`, not the fragment itself`,
    followUp: `**Follow-up:** What survives a config change in a Fragment?
> A \`ViewModel\` scoped to the Fragment survives. Fragment arguments (\`setArguments\`) survive as they're in the Bundle.`,
    redFlags: `- Sets up observers or click listeners in \`onCreateView\` instead of \`onViewCreated\`
- Holds a ViewBinding reference past \`onDestroyView\` (memory leak)`,
  },
  {
    id: 'tech-68',
    type: 'technical',
    num: 68,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'How do Fragments communicate with each other and with their host Activity?',
    tags: [ 'fragments', 'architecture', 'viewmodel' ],
    related: [ 'tech-75', 'tech-67' ],
    keyPoints: `- **Shared ViewModel** (recommended): two fragments in the same activity share a ViewModel scoped to the activity — state flows through the VM, no direct references
- **Fragment Result API** (Jetpack): \`setFragmentResult\` / \`setFragmentResultListener\` — decoupled, safe for back-stack scenarios
- **Interface listener** (legacy): Fragment defines a listener interface, Activity implements it, Fragment calls it via \`requireActivity() as MyListener\` — tightly coupled`,
    answer: `- Share state through an activity-scoped ViewModel; send one-off results through the Fragment Result API
- Keep fragments ignorant of each other and of the concrete host Activity
- Treat direct Activity casts and event buses as legacy to migrate away from`,
    followUp: `**Follow-up:** Why is the interface approach considered legacy?
> Fragment holds a direct reference to the Activity, creating tight coupling and making unit tests hard. SharedViewModel and Fragment Result API are fully decoupled.`,
    redFlags: `- Calls \`getActivity().someField\` directly from a Fragment
- Uses global event buses (RxBus, EventBus) — hard to reason about, global state`,
  },
  {
    id: 'tech-69',
    type: 'technical',
    num: 69,
    difficulty: 'E',
    star: true,
    section: 'Android Core',
    title: 'What is the difference between Explicit and Implicit Intents?',
    tags: [ 'intents', 'android-components' ],
    related: [ 'tech-70', 'tech-32', 'tech-33' ],
    keyPoints: `- **Explicit Intent**: specifies the exact component class to start — used for in-app navigation (\`Intent(this, DetailActivity::class.java)\`)
- **Implicit Intent**: specifies an action and lets Android find a matching app — used for system actions (\`Intent(Intent.ACTION_VIEW, uri)\`)
- Android resolves implicit intents by matching against all installed apps' \`<intent-filter>\` declarations`,
    answer: `- Explicit names the target class — \`Intent(this, DetailActivity::class.java)\`, in-app
- Implicit names an action/data and Android finds a handler — \`ACTION_VIEW\` style
- Resolution matches against installed apps' \`<intent-filter>\` declarations`,
    followUp: `**Follow-up:** Why prefer explicit intents for in-app navigation?
> Implicit intents rely on string matching — another app could intercept them. Explicit intents are type-safe and predictable.

**Follow-up:** What happens if no app handles an implicit intent?
> \`ActivityNotFoundException\` at runtime. Always check \`intent.resolveActivity(packageManager) != null\` before \`startActivity\`.`,
    redFlags: `- Uses implicit intents for in-app navigation
- Doesn't guard against the no-handler case`,
  },
  {
    id: 'tech-70',
    type: 'technical',
    num: 70,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What is an Intent Filter? How does Android resolve implicit intents?',
    tags: [ 'intents', 'android-components', 'manifest' ],
    related: [ 'tech-69', 'tech-33' ],
    keyPoints: `- \`<intent-filter>\` declared in \`AndroidManifest.xml\` — tells the system "my component handles intents with this action, category, and data"
- Matching rules: action test, category test, data test — all three must pass
- \`CATEGORY_DEFAULT\` must be in the filter for an Activity to receive implicit intents via \`startActivity\`
- If multiple apps match, the system shows a chooser`,
    answer: `- Declare filters as narrowly as you can — every extra action or data pattern is a new entry point into your app
- Remember implicit \`startActivity\` needs \`CATEGORY_DEFAULT\`, the most common reason a filter "doesn't match"
- Prefer explicit intents inside your own app; implicit ones are for cross-app handoff`,
    followUp: `**Follow-up:** What is \`action.MAIN\` + \`category.LAUNCHER\`?
> Marks the entry-point Activity — appears in the device launcher. Every app needs exactly one.`,
    redFlags: `- Uses implicit intents to navigate between screens of their own app
- Declares a broad filter on an exported Activity without validating incoming extras`,
  },
  {
    id: 'tech-71',
    type: 'technical',
    num: 71,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'What is a Task and Back Stack? What does `launchMode` do?',
    tags: [ 'lifecycle', 'activity', 'navigation' ],
    related: [ 'tech-6', 'tech-28', 'tech-29' ],
    keyPoints: `- **Task**: a stack of Activities the user navigates through. Back press pops the stack.
- \`launchMode\` controls instance creation:
  - \`standard\` (default): always creates a new instance
  - \`singleTop\`: reuses the existing instance if it's already on top — calls \`onNewIntent()\`
  - \`singleTask\`: one instance per task — brings to front, clears everything above it, calls \`onNewIntent()\`
  - \`singleInstance\`: one instance in its own dedicated task`,
    answer: `- Leave \`standard\` as the default and change \`launchMode\` only for a concrete duplicate-instance problem
- Any non-standard mode means handling \`onNewIntent()\`, or the new data is silently ignored
- In single-activity apps most of this moves into the navigation back stack instead`,
    followUp: `**Follow-up:** When would you use \`singleTop\`?
> Push notifications that open a detail screen — prevents duplicate activities when the user is already on that screen.`,
    redFlags: `- Thinks \`singleTask\` and \`singleInstance\` are the same
- Sets \`singleInstance\` on a normal screen and breaks Back and Recents behaviour`,
  },
  {
    id: 'tech-72',
    type: 'technical',
    num: 72,
    difficulty: 'M',
    star: true,
    section: 'Networking & Data',
    title: 'Explain Room\'s key components: `@Entity`, `@Dao`, `@Database`, `@TypeConverter`. How do you handle schema migrations?',
    tags: [ 'storage', 'room', 'data' ],
    related: [ 'sd-8', 'tech-19', 'sd-18' ],
    keyPoints: `- \`@Entity\`: maps a Kotlin class to a DB table. Fields map to columns; use \`@PrimaryKey\`, \`@ColumnInfo\`, \`@Embedded\`, \`@Relation\`.
- \`@Dao\`: interface with \`@Query\`, \`@Insert\`, \`@Update\`, \`@Delete\` — Room generates the implementation. Can return \`Flow<T>\` for reactive queries.
- \`@Database\`: abstract class extending \`RoomDatabase\`, lists entities and schema version.
- \`@TypeConverter\`: converts non-primitive types Room can't store natively (e.g., \`Date\` ↔ \`Long\`)
- Migrations: \`addMigrations(Migration(1, 2) { db -> db.execSQL("ALTER TABLE ...") })\`. \`fallbackToDestructiveMigration()\` only in dev.`,
    answer: `- Keep DAOs pure data access — queries in, \`Flow\`/\`suspend\` out, no networking or business rules
- Treat every schema version bump as a release item: migration plus test, never a destructive fallback in production
- Add a \`@TypeConverter\` only for simple value types; model real relationships with tables`,
    followUp: `**Follow-up:** What happens if you bump the DB version without providing a migration?
> Room throws \`IllegalStateException\` at runtime — you must provide a migration or use \`fallbackToDestructiveMigration()\` (wipes all data).`,
    redFlags: `- Makes network calls inside a DAO
- Uses \`fallbackToDestructiveMigration()\` in production
- Serializes whole object graphs into a JSON column through a TypeConverter instead of modelling tables`,
  },
  {
    id: 'tech-73',
    type: 'technical',
    num: 73,
    difficulty: 'E',
    star: true,
    section: 'Android Core',
    title: 'What is ViewBinding? How does it compare to `findViewById` and DataBinding?',
    tags: [ 'ui', 'viewbinding', 'fragments' ],
    related: [ 'tech-67', 'tech-8' ],
    keyPoints: `- **ViewBinding**: generates a binding class per XML layout at compile time — type-safe, null-safe view access. Enable with \`buildFeatures { viewBinding = true }\`.
- **\`findViewById\`**: no type safety, returns nullable, verbose, prone to \`ClassCastException\`.
- **DataBinding**: superset of ViewBinding — supports two-way binding expressions in XML and \`@BindingAdapter\`. More powerful but more complex.

\`\`\`kotlin
// Fragment pattern — null in onDestroyView to prevent leaks
private var _binding: FragmentHomeBinding? = null
private val binding get() = _binding!!
override fun onCreateView(i, c, s) = FragmentHomeBinding.inflate(i, c, false).also { _binding = it }.root
override fun onDestroyView() { super.onDestroyView(); _binding = null }
\`\`\``,
    answer: `- Use ViewBinding for every View-based screen; there is no reason for new \`findViewById\`
- Pick DataBinding only if you truly want expressions in XML — most teams don't
- In Fragments, scope the binding to the view lifecycle`,
    followUp: `**Follow-up:** How do you reuse an existing ViewBinding layout inside a Compose screen?
> Use the \`AndroidViewBinding(MyLayoutBinding::inflate) { ... }\` composable from \`androidx.compose.ui:ui-viewbinding\` — it inflates the layout once and hands you the binding in the update block, a common bridge during XML → Compose migration.`,
    redFlags: `- Still using \`findViewById\` in new code
- Doesn't null the binding in \`onDestroyView\``,
  },
  {
    id: 'tech-74',
    type: 'technical',
    num: 74,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'What is the Repository Pattern? Why does it sit between ViewModel and data sources?',
    tags: [ 'architecture', 'repository', 'mvvm', 'clean-architecture' ],
    related: [ 'tech-75', 'tech-45', 'sd-18' ],
    keyPoints: `- Repository abstracts all data access behind a single API — ViewModel doesn't know whether data comes from network, cache, or DB
- Responsibilities: coordinate multiple sources (Retrofit + Room), enforce caching strategy, expose clean \`Flow<T>\` or suspend functions
`,
    answer: `- Put the "where does this data come from" decision in exactly one class per data type
- Expose domain types and \`Flow\`/\`suspend\` APIs — nothing Retrofit- or Room-shaped leaks upward
- If a ViewModel can tell whether data came from cache, the abstraction has failed`,
    followUp: `**Follow-up:** Network and Room both have the data — which one does the UI read?
> Room only. The network response is written into the DB and the UI observes the DAO \`Flow\` through the repository, so there is a single source of truth and online/offline states can't diverge. Offline-first sync and conflict handling build on this (sd-18).`,
    redFlags: `- ViewModel calls Retrofit or Room directly
- Repository mixes network, DB, and UI logic in one class`,
  },
  {
    id: 'tech-75',
    type: 'technical',
    num: 75,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'Compare MVC, MVP, and MVVM architecture patterns in Android — what are the key differences and when to use each?',
    tags: [ 'architecture', 'mvc', 'mvp', 'mvvm', 'viewmodel' ],
    related: [ 'tech-46', 'tech-45', 'ds-1', 'tech-6' ],
    keyPoints: `- **MVC (Model-View-Controller)**:
  - Controller handles user input and updates Model
  - View and Controller both depend on Model
  - View updates when Model changes (Observer pattern)
  - Highest coupling to Android Framework (activities/fragments as Controller)
- **MVP (Model-View-Presenter)**:
  - Presenter holds a direct reference to a View interface
  - View is passive — forwards events to Presenter, Presenter calls back View methods
  - Testable: inject a mock View interface in unit tests
  - Downside: Presenter must manage View lifecycle; tight interface coupling
- **MVVM (Model-View-ViewModel)**:
  - ViewModel exposes observable state (\`StateFlow\`/\`LiveData\`); View observes — no direct reference
  - ViewModel survives config changes naturally, no View lifecycle concerns
  - Google Jetpack made MVVM idiomatic on Android
  - What belongs in each layer: **Model** = data + business logic (repositories); **ViewModel** = UI state, calls the repository, ideally no Android framework imports; **View** = renders observed state and forwards events to the VM
- **Decision Guide**:
  - MVC: Simple apps, learning Android basics
  - MVP: When you need better testability than MVC
  - MVVM: Default choice for modern Android apps (Jetpack Compose)`,
    answer: `- The axis that separates them is who holds a reference to whom — each step removes the logic layer's grip on the View
- Pick MVVM for new Android work: Jetpack's lifecycle support removes the Presenter's attach/detach bookkeeping
- Meet MVP in legacy code with respect — its View-interface contract is still perfectly testable`,
    followUp: `**Follow-up:** How does Jetpack Compose influence the choice between these patterns?
> Compose encourages MVVM or MVI due to its declarative nature and state hoisting principles. ViewModel works naturally with Compose's state management (remember, collectAsStateWithLifecycle)`,
    redFlags: `- Thinks MVC is obsolete for all Android development
- Believes MVP requires no interfaces or contracts
- Puts network calls directly in the Activity/Fragment and calls it "MVC"`,
  },
  {
    id: 'tech-76',
    type: 'technical',
    num: 76,
    difficulty: 'M',
    star: true,
    section: 'Kotlin',
    title: 'What are Kotlin property delegates? Explain `by lazy`, `by Delegates.observable`, and custom delegates.',
    tags: [ 'kotlin', 'delegates', 'advanced' ],
    related: [ 'tech-1', 'tech-40' ],
    keyPoints: `- The \`by\` keyword delegates property \`get()\`/\`set()\` to a delegate object implementing \`getValue\`/\`setValue\`
- \`by lazy { }\`: computed once on first access, result cached. Thread-safe by default (\`SYNCHRONIZED\`). \`val\` only.
- \`by Delegates.observable(initial) { _, old, new -> }\`: calls the lambda on every assignment. Useful for change notifications.
- \`by Delegates.vetoable(initial) { _, old, new -> bool }\`: like observable but can reject the new value
- Custom delegate: implement \`ReadWriteProperty<R, T>\` (or \`ReadOnlyProperty\` for \`val\`)`,
    answer: `- \`by\` routes property get/set into \`getValue\`/\`setValue\`; custom: \`ReadWriteProperty\`
- \`by lazy\`: \`val\`-only, computes on first access and caches; SYNCHRONIZED by default
- \`Delegates.observable\` fires per assignment; \`vetoable\` can reject the incoming value`,
    followUp: `**Follow-up:** Why prefer \`by lazy\` over \`lateinit var\`?
> \`lazy\` is thread-safe, never throws \`UninitializedPropertyAccessException\`, and is \`val\` (immutable reference). \`lateinit var\` is mutable and throws if accessed before initialization.`,
    redFlags: `- Confuses \`lazy\` (computed on demand) with \`lateinit\` (initialized later by code)`,
  },
  {
    id: 'tech-77',
    type: 'technical',
    num: 77,
    difficulty: 'H',
    star: true,
    section: 'Concurrency',
    title: 'How does exception handling differ between `launch` and `async`? What is `CoroutineExceptionHandler`?',
    tags: [ 'coroutines', 'concurrency', 'advanced' ],
    related: [ 'tech-14', 'tech-16', 'tech-17' ],
    keyPoints: `- \`launch\`: uncaught exceptions propagate immediately to the parent scope — crash the app or trigger \`CoroutineExceptionHandler\`
- \`async\`: exceptions are stored inside the \`Deferred\`, only rethrown when \`.await()\` is called. Must wrap \`.await()\` in try/catch.
- \`CoroutineExceptionHandler\`: a \`CoroutineContext\` element attached to a root coroutine — handles uncaught exceptions from \`launch\`. Does NOT catch exceptions from \`async\`.

\`\`\`kotlin
val handler = CoroutineExceptionHandler { _, e -> log(e) }
scope.launch(handler) { throw IOException() } // caught by handler

val d = scope.async { throw IOException() }   // NOT caught here
try { d.await() } catch (e: IOException) { }  // caught here
\`\`\``,
    answer: `- An exception escaping \`launch\` goes up at once — process crash or a \`CoroutineExceptionHandler\`
- \`async\` parks the failure in the \`Deferred\`; \`.await()\` rethrows it, so guard that call with try/catch
- The handler is a context element on a root coroutine and never sees failures coming from \`async\``,
    followUp: `**Follow-up:** What happens to siblings when one \`launch\` throws?
> With a regular \`Job\`, failure cancels the parent and all siblings. With \`SupervisorJob\`, siblings are independent.`,
    redFlags: `- Wraps the \`launch\` body in try/catch and assumes all exceptions are handled
- Attaches \`CoroutineExceptionHandler\` to \`async\` expecting it to catch the exception`,
  },
  {
    id: 'tech-78',
    type: 'technical',
    num: 78,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'RxJava vs Kotlin Coroutines — why did the Android ecosystem shift?',
    tags: [ 'coroutines', 'rxjava', 'concurrency' ],
    related: [ 'tech-14', 'tech-136', 'tech-52' ],
    keyPoints: `- **RxJava**: reactive streams, rich operators (\`map\`, \`flatMap\`, \`zip\`, \`combineLatest\`), everything is \`Observable\`/\`Single\`/\`Completable\`. Steep learning curve; manual subscription lifecycle (\`CompositeDisposable\`).
- **Coroutines + Flow**: sequential-looking async code, simpler mental model, structured concurrency prevents leaks, first-class Kotlin support, \`Flow\` replaces \`Observable\`
- Why coroutines won: Google Jetpack adopted coroutines as default, simpler threading model, easier onboarding, no library overhead`,
    answer: `- RxJava: rich operators over \`Observable\`/\`Single\`, but a steep model and manual \`CompositeDisposable\`
- Coroutines read sequentially, are native Kotlin, and \`Flow\` replaces \`Observable\`; structure curbs leaks
- Jetpack made them the default, with simpler threading and no library dependency`,
    followUp: `**Follow-up:** Is RxJava dead?
> No — widely used in legacy codebases. Interop exists: \`flow.asObservable()\`, \`observable.asFlow()\`. New projects default to coroutines.`,
    redFlags: `- Thinks coroutines and RxJava are fully equivalent with no trade-offs`,
  },
  {
    id: 'tech-80',
    type: 'technical',
    num: 80,
    difficulty: 'M',
    star: true,
    section: 'Engineering',
    title: 'What is Espresso? What can you test with it vs unit tests?',
    tags: [ 'testing', 'espresso', 'ui' ],
    related: [ 'tech-23', 'tech-47' ],
    keyPoints: `- Espresso: Android UI testing framework — runs on a real device or emulator and drives actual UI interactions
- Core API: \`onView(matcher).perform(action).check(assertion)\`
  - \`ViewMatchers\`: \`withId(R.id.button)\`, \`withText("Submit")\`, \`isDisplayed()\`
  - \`ViewActions\`: \`click()\`, \`typeText("hello")\`, \`swipeUp()\`
  - \`ViewAssertions\`: \`matches(isDisplayed())\`, \`doesNotExist()\`
- Espresso auto-synchronizes with the main thread — waits for UI to be idle before each action

**Unit tests vs Espresso:**
- Unit tests: fast (JVM only, no device), test logic in isolation (ViewModel, Repository)
- Espresso: slow (emulator required), verifies real UI behavior end-to-end`,
    answer: `- Keep Espresso for user-journey and integration checks; put logic tests on the JVM
- Rely on its idle synchronisation — register idling resources instead of adding sleeps
- Fake the network and data layer so UI tests are deterministic`,
    followUp: `**Follow-up:** How do you test a screen that fetches data from the network?
> Replace the real repository with a fake via DI (Hilt test components). Espresso tests should never hit the real network.`,
    redFlags: `- Tries to use Espresso for business logic that belongs in unit tests
- Adds \`Thread.sleep()\` to fix flaky Espresso tests`,
  },
  {
    id: 'tech-81',
    type: 'technical',
    num: 81,
    difficulty: 'E',
    star: false,
    section: 'Engineering',
    title: 'What does JUnit 4 provide in Android? Explain `@Test`, `@Before`, `@After`, and `@Rule`.',
    tags: [ 'testing', 'junit' ],
    related: [ 'tech-23', 'tech-24' ],
    keyPoints: `- \`@Test\`: marks a method as a test case — JUnit runs it
- \`@Before\`: runs before each \`@Test\` — setup (instantiate the class under test, configure mocks)
- \`@After\`: runs after each \`@Test\` — teardown (close resources)
- \`@BeforeClass\` / \`@AfterClass\`: run once per class — for expensive one-time setup (e.g., in-memory DB creation)
- \`@Rule\`: applies a \`TestRule\` that wraps each test. Common rules:
  - \`InstantTaskExecutorRule\`: makes LiveData/Architecture Components execute synchronously
  - \`MainCoroutineRule\` (custom): calls \`Dispatchers.setMain(StandardTestDispatcher())\` before each test and \`Dispatchers.resetMain()\` after (the older \`TestCoroutineDispatcher\` is deprecated)`,
    answer: `- Keep per-test setup in \`@Before\` so tests never depend on each other's state
- Move reusable setup/teardown (Main dispatcher, LiveData executor, temp folders) into a \`TestRule\`, not a base class
- Reserve \`@BeforeClass\` for genuinely expensive one-time fixtures`,
    followUp: `**Follow-up:** What is the difference between \`@Rule\` and \`@ClassRule\`?
> \`@Rule\` wraps every test method; \`@ClassRule\` wraps the whole class once and must be a static field (in Kotlin, a \`@JvmField\` in a \`companion object\`). Use it for fixtures like a server or database that are expensive to start per test.`,
    redFlags: `- Shares mutable state between tests through fields that \`@Before\` doesn't reset
- Builds a deep test base-class hierarchy instead of composable rules`,
  },
  {
    id: 'tech-82',
    type: 'technical',
    num: 82,
    difficulty: 'M',
    star: true,
    section: 'Jetpack',
    title: 'How does Firebase Cloud Messaging (FCM) work? How do foreground vs background delivery differ?',
    tags: [ 'firebase', 'push-notifications', 'background' ],
    related: [ 'tech-30', 'tech-32' ],
    keyPoints: `- FCM delivery: your backend → FCM servers → Google Play Services → your app
- Two message types:
  - **Notification message**: FCM SDK displays it automatically when app is backgrounded. Delivered to \`onMessageReceived()\` only when foregrounded.
  - **Data message**: always delivered to \`FirebaseMessagingService.onMessageReceived()\` — your code handles display in all states
- Implement \`FirebaseMessagingService\`: override \`onMessageReceived(message)\` for foreground, and \`onNewToken(token)\` to push the device token to your server
- Device token: unique per device/install. Required to target a specific device.`,
    answer: `- Send data messages when the app must decide what to show; notification messages only for simple broadcast alerts
- Upload the token from \`onNewToken()\` every time — it changes on reinstall, restore and data clear
- Don't treat push as guaranteed delivery; sync real state on app open`,
    followUp: `**Follow-up:** What happens to data messages when the app is force-killed?
> High-priority data messages may wake the app. Normal priority may be delayed or dropped — not guaranteed.`,
    redFlags: `- Sends notification messages and is surprised \`onMessageReceived()\` never runs in the background
- Uses FCM as a reliable queue for business-critical state`,
  },
  {
    id: 'tech-83',
    type: 'technical',
    num: 83,
    difficulty: 'E',
    star: false,
    section: 'Jetpack',
    title: 'What is Firebase Crashlytics? How do you log non-fatal issues?',
    tags: [ 'firebase', 'debugging', 'monitoring' ],
    related: [ 'sd-15', 'tech-35', 'tech-9' ],
    keyPoints: `- Crashlytics: crash reporting SDK — automatically captures uncaught exceptions with stack trace, device info, and OS version
- Non-fatal: \`FirebaseCrashlytics.getInstance().recordException(throwable)\` — tracks caught exceptions without crashing
- Breadcrumbs: \`.log("User tapped checkout")\` — visible in the crash timeline
- Custom context: \`.setCustomKey("user_id", userId)\` — attached to every crash report for that session`,
    answer: `- Uncaught exceptions are collected automatically, along with stack, device, and OS data
- For a caught problem use \`recordException(throwable)\` — tracked without any crash
- \`.log(...)\` adds timeline breadcrumbs; \`.setCustomKey(...)\` attaches context to later reports`,
    followUp: `**Follow-up:** When would you use \`recordException\` instead of letting it crash?
> Caught exceptions you handle gracefully but want visibility into: network errors you retry silently, JSON parsing fallbacks, optional feature failures.`,
    redFlags: `- Swallows exceptions in catch blocks without any logging`,
  },
  {
    id: 'tech-84',
    type: 'technical',
    num: 84,
    difficulty: 'E',
    star: false,
    section: 'Performance & Security',
    title: 'What is ktlint? How does detekt differ?',
    tags: [ 'code-quality', 'linting', 'build' ],
    related: [ 'tech-161', 'tech-116' ],
    keyPoints: `- **ktlint**: enforces Kotlin code *formatting* — indentation, spacing, import ordering, brace placement. Auto-fixes with \`ktlintFormat\`.
- **detekt**: static analysis for code *quality* — finds code smells: excessive function length, magic numbers, naked \`!!\`, high complexity. Not about formatting.
- In CI: run both. \`ktlintCheck\` for style, \`detekt\` for quality.
- Both have Gradle plugins; gate CI builds on violations.`,
    answer: `- Run both — they catch different classes of problem, and neither replaces code review
- Auto-fix formatting so humans never discuss whitespace in review
- Baseline detekt on legacy code, then fail CI only on new issues`,
    followUp: `**Follow-up:** How do you auto-format on commit?
> Use the ktlint Gradle plugin's \`addKtlintCheckGitPreCommitHook\` task or a tool like \`lefthook\` to format staged files before each commit.`,
    redFlags: `- Thinks formatting and static analysis are the same thing
- Suppresses detekt rules wholesale instead of tuning or baselining them`,
  },
  {
    id: 'tech-85',
    type: 'technical',
    num: 85,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What problems does ConstraintLayout solve? Explain chains, barriers, and guidelines.',
    tags: [ 'ui', 'layouts', 'performance' ],
    related: [ 'tech-8', 'tech-34' ],
    keyPoints: `- ConstraintLayout creates a flat view hierarchy for complex layouts — avoids nested \`LinearLayout\`/\`RelativeLayout\` which cause multiple measure passes
- Each view is positioned by constraints (edges connected to parent or sibling views)
- **Chains**: group views along an axis and distribute space between them. Styles: \`spread\` (even spacing), \`spread_inside\` (space between, not at edges), \`packed\` (grouped together)
- **Guidelines**: invisible reference lines at a fixed dp or percentage from an edge — align multiple views to the same position
- **Barriers**: virtual line that tracks the edge of the largest referenced child — use when a sibling's size is dynamic (e.g., localized text of varying length)`,
    answer: `- Use ConstraintLayout to flatten a View-based screen that would otherwise nest several layouts
- Reach for barriers whenever sibling sizes are dynamic (localised text); guidelines for fixed proportions
- In Compose, use it only when Row/Column/Box genuinely can't express the relationships`,
    followUp: `**Follow-up:** When would you use MotionLayout?
> MotionLayout extends ConstraintLayout and adds transitions between constraint sets. Use for complex, multi-step animations coordinated across multiple views.

**Note:** In Compose-only projects, ConstraintLayout is largely replaced by \`Box\`, \`Row\`, \`Column\`.`,
    redFlags: `- Uses deeply nested \`LinearLayout\` stacks for complex UIs
- Hard-codes widths for localized labels instead of constraining to a barrier`,
  },
  {
    id: 'tech-86',
    type: 'technical',
    num: 86,
    difficulty: 'E',
    star: false,
    section: 'Android Core',
    title: 'What is the difference between `Parcelable` and `Serializable`?',
    tags: [ 'android', 'ipc', 'fundamentals', 'parcelable' ],
    related: [ 'tech-4', 'tech-28' ],
    keyPoints: `- **Serializable**: Java interface — no code needed, reflection-based. Very slow (~10x slower), generates garbage. Avoid in Android.
- **Parcelable**: Android-specific interface. Explicit \`writeToParcel()\` / \`createFromParcel()\`. Zero reflection, optimized for IPC/Binder. Use for \`Intent\` extras, \`Bundle\` args, and IPC.
- \`@Parcelize\` Kotlin plugin: auto-generates Parcelable boilerplate from data class properties — preferred approach.
- Rule: always use \`Parcelable\` (or \`@Parcelize\`) in Android. \`Serializable\` only when interoperating with Java libraries that require it.`,
    answer: `- \`Serializable\` leans on reflection — about 10x slower and garbage-heavy; avoid it
- \`Parcelable\` writes fields explicitly, reflection-free, built for Binder/IPC and Bundles
- \`@Parcelize\` removes the boilerplate; use \`Serializable\` only for Java interop`,
    followUp: `**Follow-up:** What's the difference between \`@Parcelize\` and implementing \`Parcelable\` manually?
> \`@Parcelize\` generates the boilerplate at compile time. Manual implementation gives more control (versioning, custom order) but is tedious and error-prone.`,
    redFlags: `- Uses \`Serializable\` everywhere because it's "easier"`,
  },
  {
    id: 'tech-88',
    type: 'technical',
    num: 88,
    difficulty: 'M',
    star: true,
    section: 'Concurrency',
    title: 'What are `Handler`, `Looper`, and `MessageQueue`? How do they relate to the main thread?',
    tags: [ 'threading', 'handler', 'looper', 'fundamentals' ],
    related: [ 'tech-13', 'tech-89' ],
    keyPoints: `- **Looper**: a thread-local infinite loop that continuously reads from a \`MessageQueue\`. The main thread has one by default (\`Looper.getMainLooper()\`). Background threads don't — you must call \`Looper.prepare()\` + \`Looper.loop()\` to add one.
- **MessageQueue**: a FIFO queue of \`Message\`/\`Runnable\` objects. One per Looper.
- **Handler**: posts \`Message\` or \`Runnable\` objects onto a \`MessageQueue\`. Tied to the Looper of the thread it was created on.
  - \`handler.post { }\` — runs on the handler's thread
  - \`handler.postDelayed({ }, delayMs)\` — delayed execution

Classic pattern to update UI from a background thread:
\`\`\`kotlin
Handler(Looper.getMainLooper()).post { updateUI() }
\`\`\``,
    answer: `- A \`Looper\` is a thread-bound infinite loop draining one \`MessageQueue\`; only main gets one automatically
- Give a background thread one via \`Looper.prepare()\` plus \`Looper.loop()\`
- A \`Handler\` posts to its thread queue; \`Handler(Looper.getMainLooper()).post { }\` reaches UI`,
    followUp: `**Follow-up:** Why are coroutines preferred over \`Handler\` for async work today?
> \`Handler\` is low-level and verbose. Coroutines with \`withContext(Dispatchers.Main)\` achieve the same thread switch with structured concurrency, cancellation, and cleaner syntax.`,
    redFlags: `- Confuses \`Handler\` (dispatcher) with \`Looper\` (loop mechanism)
- Would call \`Handler\` on a background thread without \`Looper.prepare()\``,
  },
  {
    id: 'tech-89',
    type: 'technical',
    num: 89,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'What is `viewModelScope` vs `lifecycleScope` vs `GlobalScope`?',
    tags: [ 'coroutines', 'viewmodel', 'lifecycle', 'scope' ],
    related: [ 'tech-13', 'tech-14', 'tech-17' ],
    keyPoints: `- **\`viewModelScope\`**: tied to the ViewModel's lifecycle. Auto-cancelled when \`ViewModel.onCleared()\` is called (Activity/Fragment finished). Best for data loading and business logic in ViewModels.
- **\`lifecycleScope\`**: tied to a \`LifecycleOwner\` (Activity or Fragment). Auto-cancelled when the owner is destroyed. Use with \`repeatOnLifecycle(STARTED)\` to safely collect Flows in UI.
- **\`GlobalScope\`**: tied to the app process — never cancelled automatically. Almost always wrong in UI code. Causes leaks if a coroutine outlives its UI. Only for truly fire-and-forget app-level work (rare).

\`\`\`kotlin
// ViewModel — safe
viewModelScope.launch { repo.fetchData() }

// Fragment — safe Flow collection
lifecycleScope.launch {
    repeatOnLifecycle(Lifecycle.State.STARTED) {
        viewModel.uiState.collect { render(it) }
    }
}
\`\`\``,
    answer: `- Pick the scope whose lifetime matches the work: data loading in \`viewModelScope\`, UI collection in \`lifecycleScope\` + \`repeatOnLifecycle\`
- If the work must outlive the screen, it belongs in WorkManager or an injected app scope — not \`GlobalScope\`
- Treat any \`GlobalScope\` in review as a bug until proven otherwise`,
    followUp: `**Follow-up:** What's the difference between \`launchWhenStarted\` and \`repeatOnLifecycle\`?
> \`launchWhenStarted\` suspends (pauses) collection when stopped but keeps the coroutine alive. \`repeatOnLifecycle\` cancels the inner block on stop and relaunches on start — safer, avoids retaining upstream state.`,
    redFlags: `- Uses \`GlobalScope\` in UI code
- Collects Flow in Fragment without \`repeatOnLifecycle\` — stale updates while backgrounded`,
  },
  {
    id: 'tech-90',
    type: 'technical',
    num: 90,
    difficulty: 'M',
    star: true,
    section: 'Kotlin',
    title: 'What is the difference between `StateFlow` and `SharedFlow`?',
    tags: [ 'flow', 'stateflow', 'sharedflow', 'coroutines' ],
    related: [ 'tech-136', 'tech-91' ],
    keyPoints: `- **StateFlow**: always has a current value. New collectors immediately receive the latest value (hot, stateful). Equality-checked — same value won't re-emit. Created with \`MutableStateFlow(initialValue)\`.
  - Use for: UI state, latest known value (isLoading, list items)
- **SharedFlow**: no initial value, no current-value concept. Configurable replay cache (\`replay = N\`). Does not check equality. Created with \`MutableSharedFlow()\`.
  - Use for: one-time events (navigation, toasts, analytics)

| | StateFlow | SharedFlow |
|---|---|---|
| Initial value | Required | None |
| Replay on collect | Latest value | \`replay\` param |
| Equality check | Yes (skips duplicates) | No |
| Use case | UI state | Events / effects |`,
    answer: `- \`StateFlow\`: mandatory initial value, replays the latest, skips duplicate emissions
- \`SharedFlow\`: no current value; \`replay = N\`, equality unchecked
- UI state (\`isLoading\`, lists) → StateFlow; nav/toast/analytics events → SharedFlow`,
    followUp: `**Follow-up:** Why is using \`StateFlow\` for navigation events problematic?
> StateFlow replays its latest value to every new collector. A navigation event would re-trigger after rotation — causing double-navigation.`,
    redFlags: `- Uses \`StateFlow\` for one-time events (toasts, navigation)`,
  },
  {
    id: 'tech-91',
    type: 'technical',
    num: 91,
    difficulty: 'H',
    star: false,
    section: 'Kotlin',
    title: 'Explain key Flow operators: `flatMapLatest`, `combine`, `zip`, `buffer`, and `conflate`.',
    tags: [ 'flow', 'operators', 'coroutines', 'advanced' ],
    related: [ 'tech-136', 'tech-52', 'tech-90' ],
    keyPoints: `- **\`flatMapLatest\`**: maps each emission to a new Flow, cancels the previous inner Flow when a new emission arrives. Classic use: search queries — new keystroke cancels the in-flight API call.
- **\`combine\`**: collects the latest value from N Flows and emits whenever any of them emits. All Flows must have emitted at least once.
- **\`zip\`**: pairs emissions from two Flows one-to-one. Waits for both to emit before producing a pair — slower Flow dictates pace.
- **\`buffer\`**: adds a buffer between producer and collector so they run concurrently. Producer doesn't wait for collector to finish processing.
- **\`conflate\`**: drops intermediate emissions if collector is too slow — only processes the latest. Useful for UI updates where stale frames are irrelevant.

\`\`\`kotlin
// flatMapLatest: cancel in-flight search on new keystroke
searchQuery
    .debounce(300)
    .flatMapLatest { query -> repo.search(query) }
    .collect { updateResults(it) }
\`\`\``,
    answer: `- \`flatMapLatest\` swaps inner flows and cancels the prior one — keystroke search
- \`combine\` pairs latest values (every source must emit once); \`zip\` waits for both, 1:1
- \`buffer\` lets the producer run ahead; \`conflate\` keeps only the latest when collection lags`,
    followUp: `**Follow-up:** When would you use \`conflate\` vs \`buffer\`?
> \`conflate\` drops intermediate values — fine for UI state where only the latest matters. \`buffer\` keeps all values but decouples producer from consumer speed.`,
    redFlags: `- Uses deprecated \`flatMap\` instead of \`flatMapLatest\`
- Confuses \`zip\` (1:1 pairing) with \`combine\` (latest from all)`,
  },
  {
    id: 'tech-92',
    type: 'technical',
    num: 92,
    difficulty: 'M',
    star: true,
    section: 'Jetpack',
    title: 'What is `derivedStateOf` and when should you use it?',
    tags: [ 'compose', 'state', 'performance', 'recomposition' ],
    related: [ 'tech-10', 'tech-138', 'tech-93' ],
    keyPoints: `- \`derivedStateOf { }\`: creates a Compose state object whose value is only recalculated when its **inputs** (state reads inside the lambda) change — not every time the enclosing composable recomposes.
- Without it: the derived computation runs on every recomposition. With it: recomposition only triggers downstream when the **result** actually changes.
- Use when: a derived value is expensive to compute, or its inputs change more frequently than the derived value.

\`\`\`kotlin
// Without derivedStateOf — recalculated every recomposition
val isButtonEnabled = someList.isNotEmpty() && inputText.isNotBlank()

// With derivedStateOf — recomputes only when someList or inputText changes
val isButtonEnabled by remember {
    derivedStateOf { someList.isNotEmpty() && inputText.isNotBlank() }
}
\`\`\``,
    answer: `- Builds a \`State\` recomputed only when state read inside its lambda changes, not each host recomposition
- Without it the expression reruns on each recomposition; with it only a changed result propagates
- Pay for it when deriving is costly or inputs churn far faster than the derived value`,
    followUp: `**Follow-up:** Is \`remember { derivedStateOf { } }\` always better than a plain calculation?
> No — it has overhead. Only worthwhile when inputs change frequently but the result changes rarely, or the computation is expensive. For simple one-liners that always match input changes, plain code is cleaner.`,
    redFlags: `- Uses it everywhere without understanding the cost
- Doesn't wrap it in \`remember { }\` — loses the caching benefit`,
  },
  {
    id: 'tech-93',
    type: 'technical',
    num: 93,
    difficulty: 'M',
    star: false,
    section: 'Jetpack',
    title: 'What is `CompositionLocal`? How and when do you use it?',
    tags: [ 'compose', 'compositionlocal', 'theming' ],
    related: [ 'tech-10', 'tech-92' ],
    keyPoints: `- \`CompositionLocal\`: implicit data-passing mechanism in Compose — provides a value at a point in the tree that any descendant can read without explicit parameter passing.
- Defined with \`compositionLocalOf { defaultValue }\` (the default factory runs when no Provider is in scope — it does not throw unless the factory itself throws) or \`staticCompositionLocalOf\` (for values that change rarely — doesn't track reads).
- Provided via \`CompositionLocalProvider(LocalX provides value) { ... }\` and read with \`LocalX.current\`.
- Built-in examples: \`LocalContext\`, \`LocalDensity\`, \`LocalContentColor\`, \`LocalFocusManager\`

\`\`\`kotlin
val LocalUserPrefs = compositionLocalOf<UserPrefs> { error("No UserPrefs provided") }

// Provide in parent
CompositionLocalProvider(LocalUserPrefs provides prefs) {
    ChildScreen() // reads LocalUserPrefs.current anywhere below
}
\`\`\``,
    answer: `- Declare via \`compositionLocalOf { default }\`; with no provider above, that default factory executes
- Descendants read it via \`LocalX.current\` — no parameter plumbing; \`LocalDensity\` ships built in
- \`staticCompositionLocalOf\` skips read tracking, so use it only for values that rarely change`,
    followUp: `**Follow-up:** When should you NOT use \`CompositionLocal\`?
> Avoid for data that legitimately flows through the UI — use explicit params instead. CompositionLocal makes data flow implicit and harder to trace or test. Reserve it for cross-cutting concerns: theme, locale, analytics, navigation.`,
    redFlags: `- Uses CompositionLocal to avoid passing parameters — creates hidden dependencies
- Uses \`compositionLocalOf\` for a value that never changes (should be \`staticCompositionLocalOf\`)`,
  },
  {
    id: 'tech-94',
    type: 'technical',
    num: 94,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'How do you create a custom View? Explain `onMeasure`, `onLayout`, and `onDraw`.',
    tags: [ 'custom-view', 'canvas', 'ui', 'drawing' ],
    related: [ 'tech-85', 'tech-34' ],
    keyPoints: `- Extend \`View\` (or a subclass), then override the three key callbacks:
- **\`onMeasure(widthSpec, heightSpec)\`**: calculate your view's desired size. Call \`setMeasuredDimension(w, h)\`. Respect \`MeasureSpec\` modes: \`EXACTLY\` (fixed size), \`AT_MOST\` (wrap), \`UNSPECIFIED\` (unconstrained).
- **\`onLayout(changed, l, t, r, b)\`**: position children — only relevant for custom \`ViewGroup\`.
- **\`onDraw(canvas: Canvas)\`**: draw content using \`Paint\`. Common calls: \`drawRect\`, \`drawCircle\`, \`drawText\`, \`drawPath\`, \`drawBitmap\`.
- Declare XML attributes in \`res/values/attrs.xml\` as \`<declare-styleable>\` and read with \`context.obtainStyledAttributes()\`.
- **\`invalidate()\`**: triggers \`onDraw\` (visual update, no re-measure). **\`requestLayout()\`**: triggers full measure + layout + draw pass.`,
    answer: `- \`onMeasure\`: handle \`EXACTLY\`/\`AT_MOST\`/\`UNSPECIFIED\`, call \`setMeasuredDimension\`
- \`onLayout\` positions children (ViewGroups only); \`onDraw\` renders onto a \`Canvas\`
- \`invalidate()\` re-draws; \`requestLayout()\` re-runs measure, layout, and draw`,
    followUp: `**Follow-up:** What's the difference between \`invalidate()\` and \`requestLayout()\`?
> \`invalidate()\` only redraws — runs \`onDraw\` without re-measuring. Use when visual state changes but size doesn't (color change). \`requestLayout()\` forces full re-measure — use when size could change.`,
    redFlags: `- Allocates \`Paint\` or \`Bitmap\` objects inside \`onDraw\` — GC pressure every frame
- Calls \`requestLayout()\` when \`invalidate()\` would suffice`,
  },
  {
    id: 'tech-95',
    type: 'technical',
    num: 95,
    difficulty: 'H',
    star: true,
    section: 'Android Core',
    title: 'What happens during process death? How do you handle state restoration with `SavedStateHandle`?',
    tags: [ 'process-death', 'state', 'savedstatehandle', 'lifecycle', 'viewmodel', 'advanced' ],
    related: [ 'tech-3', 'tech-6', 'tech-12', 'tech-75', 'tech-155', 'tech-160' ],
    keyPoints: `- Android can kill an app's process at any time when backgrounded (to reclaim memory). When the user returns, Android recreates the Activity stack from scratch using the saved instance state.
- **What survives**: the \`Bundle\` from \`onSaveInstanceState\` (OSIS). Must be serializable, < ~1MB — only small, lightweight UI state belongs there (selected tab, scroll position, typed text).
- **What does NOT survive**: ViewModel instances, in-memory cache, coroutine state, any runtime objects.
- **\`SavedStateHandle\`**: injected into ViewModel automatically by Jetpack. A key-value store backed by \`onSaveInstanceState\`. Survives both config changes and process death — ViewModel-scoped, yet Bundle-backed.
- **Compose**: \`rememberSaveable\` is the composable-level equivalent — it writes into the same saved-state Bundle.
- **Large data**: don't carry it through the Bundle. Save an ID only and reload from the DB on restore.

| Scenario | ViewModel | OSIS / SavedStateHandle |
|---|---|---|
| Rotation | ✅ | ✅ |
| Process death | ❌ | ✅ |
| Large objects | ✅ | ❌ (1MB limit) |

\`\`\`kotlin
class SearchViewModel(private val state: SavedStateHandle) : ViewModel() {
    // Automatically saved and restored across process death
    var query by state.saveable { mutableStateOf("") }
    // Or as a Flow
    val query = state.getStateFlow("query", "")
}
\`\`\`

- **Testing process death**: \`adb shell am kill <package>\` while backgrounded, then return via Recents — or Developer Options → "Don't keep activities" to force recreation on every background/foreground.`,
    answer: `- Design every screen assuming its process will die in the background — rotation passing is not proof
- Rule of thumb: ids, query text and selections go in \`SavedStateHandle\`; everything heavier gets re-fetched
- Make a process-death round trip part of the test plan for any screen holding user input`,
    followUp: `**Follow-up:** How do you verify your ViewModel was reconstructed after process death?
> After process death, \`SavedStateHandle\` has restored values but the ViewModel instance is new. Check by logging in \`init {}\` and inspecting \`SavedStateHandle\` for expected keys.`,
    redFlags: `- Only handles rotation and has never exercised a process-death round trip in their app
- Stores large objects, bitmaps or non-Parcelable data in \`SavedStateHandle\` / \`onSaveInstanceState\``,
  },
  {
    id: 'tech-96',
    type: 'technical',
    num: 96,
    difficulty: 'M',
    star: true,
    section: 'Networking & Data',
    title: 'What are OkHttp Interceptors? Explain Application vs Network interceptors.',
    tags: [ 'networking', 'okhttp', 'retrofit', 'interceptor' ],
    related: [ 'tech-19', 'tech-20', 'tech-164' ],
    keyPoints: `- OkHttp interceptors form a chain applied to every request/response: each link can rewrite the request, call \`chain.proceed()\` to hand it on (or short-circuit with its own response), then inspect or rewrite the response on the way back. Two types:
- **Application interceptors** (\`addInterceptor\`): run before the network. See the original request. Don't observe redirects or retries. Called once per \`call.execute()\`.
  - Use for: adding auth headers, logging request data, adding common headers
- **Network interceptors** (\`addNetworkInterceptor\`): run just before/after the actual TCP connection. Observe real wire data including redirects. Not called for cached responses.
  - Use for: monitoring actual bytes transferred, injecting headers that must be on the wire

\`\`\`kotlin
val client = OkHttpClient.Builder()
    .addInterceptor { chain ->
        val request = chain.request().newBuilder()
            .header("Authorization", "Bearer $token")
            .build()
        chain.proceed(request)
    }
    .build()
\`\`\``,
    answer: `- Default to an application interceptor for app concerns: auth headers, common headers, request logging
- Use a network interceptor only when you must see what actually hits the wire — redirects, real bytes
- Keep token-refresh-and-retry logic application-side (or in an \`Authenticator\`), never per network hop`,
    followUp: `**Follow-up:** How would you implement automatic token refresh using an interceptor?
> In an application interceptor: proceed with the request → if 401, refresh the token → retry the request with the new token. Use a \`Mutex\` to prevent concurrent refresh races.`,
    redFlags: `- Adds auth headers in Retrofit \`@Headers\` annotation (not dynamic, can't rotate tokens)
- Registers a body-level logging interceptor as a network interceptor in release builds, leaking tokens and PII to logcat`,
  },
  {
    id: 'tech-97',
    type: 'technical',
    num: 97,
    difficulty: 'M',
    star: false,
    section: 'Networking & Data',
    title: 'How does Coil (or Glide) handle image loading, caching, and memory? What are the caching layers?',
    tags: [ 'coil', 'glide', 'images', 'caching', 'performance' ],
    related: [ 'ds-23', 'sd-3', 'tech-34', 'tech-98' ],
    keyPoints: `- Image loading libraries (Coil, Glide, Picasso) handle: async download, decoding, resizing to display size, and multi-level caching.
- **Caching layers:**
  1. **Memory cache**: decoded \`Bitmap\` objects in RAM — instant access, LRU eviction
  2. **Disk cache**: raw or transformed bytes on storage — avoids re-downloading, survives process kill
- **Coil** (Kotlin-first, Coroutines-based): \`AsyncImage(model = url, ...)\` in Compose or \`imageView.load(url)\`. Integrates with \`OkHttpClient\` for HTTP cache-control headers.
- **Glide**: Java-based, mature, powerful with custom \`ModelLoader\` and \`Transformation\` APIs.
- Both: lifecycle-aware (pause on stop, cancel on destroy), crossfade, placeholder/error images, resize/crop transformations.

\`\`\`kotlin
// Coil in Compose
AsyncImage(
    model = ImageRequest.Builder(context)
        .data(url)
        .crossfade(true)
        .build(),
    contentDescription = "User avatar"
)
\`\`\``,
    answer: `- Two tiers: decoded \`Bitmap\`s in an LRU memory cache, then disk bytes that outlive the process
- Pipeline is fetch, decode, resize toward the view size; both libs cancel work on destroy
- \`Coil\`: coroutines, \`AsyncImage\`/\`load\`, \`OkHttp\` cache headers. \`Glide\`: \`ModelLoader\`/\`Transformation\``,
    followUp: `**Follow-up:** Why does Glide need a \`RequestManager\` tied to a lifecycle?
> So it can automatically pause loading when the UI is stopped and cancel in-flight requests when the Activity/Fragment is destroyed — prevents crashes from updating destroyed views.`,
    redFlags: `- Manually loads bitmaps on the main thread
- Creates a new \`OkHttpClient\` per image load instead of sharing one`,
  },
  {
    id: 'tech-98',
    type: 'technical',
    num: 98,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'What causes `OutOfMemoryError` with bitmaps? How do you load large images efficiently?',
    tags: [ 'memory', 'bitmap', 'oom', 'performance' ],
    related: [ 'tech-34', 'tech-97' ],
    keyPoints: `- Bitmaps are large: a 12MP photo = 12M × 4 bytes (ARGB_8888) ≈ 48MB in RAM — far larger than most heap budgets.
- **Root causes of OOM:**
  - Loading full-resolution images without downsampling to display size
  - Caching too many bitmaps without respecting available memory
  - Holding references to large bitmaps after the view is gone
- **Solutions:**
  - \`BitmapFactory.Options.inSampleSize\`: load a scaled-down version — halving both dimensions = 4× smaller
  - \`BitmapFactory.Options.inPreferredConfig = RGB_565\`: 2 bytes/pixel instead of 4 — half the memory (no alpha)
  - Use image loading libraries (Coil/Glide) — they handle sampling and caching automatically
  - \`bitmap.recycle()\` for explicitly managed bitmaps (rarely needed with modern GC)`,
    answer: `- Always decode at display size, never at source size
- Let an image library (Coil/Glide) own decoding, pooling and caching instead of hand-rolling it
- Size in-memory caches from available memory, and profile native memory for bitmap OOMs`,
    followUp: `**Follow-up:** How does Android's memory model handle bitmaps since Android 8.0?
> Since Oreo, Bitmap pixel data is allocated in native memory (not Java heap). Bitmaps are still GC'd when the Java object is collected. This reduces Java heap pressure but native heap is still bounded — OOM is still possible.`,
    redFlags: `- Loads full-resolution images directly into an \`ImageView\` without sampling
- Thinks \`bitmap.recycle()\` is required for every bitmap in modern Android`,
  },
  {
    id: 'tech-99',
    type: 'technical',
    num: 99,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What is the difference between Activity Context and Application Context? When does it matter?',
    tags: [ 'context', 'memory-leak', 'fundamentals' ],
    related: [ 'tech-85', 'tech-95' ],
    keyPoints: `- Android has a hierarchy of \`Context\` objects: \`Application\` → \`Activity\` → \`Service\`.
- **Application Context** (\`applicationContext\`): tied to the app process lifetime. Safe to hold long-term in singletons.
- **Activity Context** (\`this\` in Activity): tied to the Activity lifecycle. Holds a reference to the window, theme, and view hierarchy.

| Operation | Correct Context |
|---|---|
| Inflate layouts / show dialogs | Activity context |
| Start a Service / Broadcast | Either |
| Room database / SharedPreferences | Application context |
| Singleton holding context | Application context (avoids memory leak) |
| \`getSystemService(WINDOW_SERVICE)\` | Activity context |

- **Memory leak**: passing Activity context to a singleton → singleton outlives Activity → GC can't collect Activity (and its entire view tree).`,
    answer: `- Application context spans the whole process — safe to hold in singletons
- Activity context carries window, theme, view tree — required for inflating or dialogs
- An Activity leaked into a singleton pins its view tree; Room/SharedPrefs prefer Application`,
    followUp: `**Follow-up:** Can you get \`ApplicationContext\` inside a ViewModel?
> Yes — inject \`Application\` or use \`AndroidViewModel\` which provides it. Never reference Activity from ViewModel — ViewModel outlives Activity on config changes.`,
    redFlags: `- Passes Activity context to a singleton
- Uses Activity context for long-lived objects like Room database or image loading singletons`,
  },
  {
    id: 'tech-100',
    type: 'technical',
    num: 100,
    difficulty: 'M',
    star: true,
    section: 'Networking & Data',
    title: 'What is Jetpack DataStore? How does Preferences DataStore differ from Proto DataStore?',
    tags: [ 'datastore', 'preferences', 'storage', 'coroutines' ],
    related: [ 'tech-19', 'tech-22' ],
    keyPoints: `- DataStore: Jetpack replacement for \`SharedPreferences\`. Two variants:
  - **Preferences DataStore**: schema-less key-value store using typed \`Preferences.Key<T>\`. Similar to SharedPreferences but fully async.
  - **Proto DataStore**: schema-defined via Protocol Buffers. Type-safe, versioned, recommended for complex structured data.
- **Key advantages over SharedPreferences:**
  - Async by default (Kotlin coroutines + Flow) — no \`apply()\`/\`commit()\` ambiguity
  - Atomic writes — no corruption risk from \`apply()\` then crash
  - Flow-based reading — reactive, no callbacks

\`\`\`kotlin
val Context.dataStore by preferencesDataStore(name = "settings")
val DARK_MODE = booleanPreferencesKey("dark_mode")

// Write
context.dataStore.edit { prefs -> prefs[DARK_MODE] = true }

// Read as Flow
val isDark: Flow<Boolean> = context.dataStore.data.map { it[DARK_MODE] ?: false }
\`\`\``,
    answer: `- Preferences variant: schema-less but typed via \`Preferences.Key<T>\`, fully asynchronous
- Proto variant: schema comes from Protocol Buffers, typed and versioned, for structured data
- Against \`SharedPreferences\`: coroutine + \`Flow\` reads, atomic writes, no \`apply()\` corruption`,
    followUp: `**Follow-up:** When would you still use SharedPreferences over DataStore?
> Only in legacy code where async migration isn't worth the churn, or when integrating with libraries that require SharedPreferences directly. All new code should use DataStore.`,
    redFlags: `- Still creates new \`SharedPreferences\` usage in modern code
- Uses \`commit()\` on the main thread`,
  },
  {
    id: 'tech-101',
    type: 'technical',
    num: 101,
    difficulty: 'M',
    star: false,
    section: 'Networking & Data',
    title: 'What is the Paging 3 library? Explain `PagingSource`, `RemoteMediator`, and `PagingData`.',
    tags: [ 'paging', 'jetpack', 'recycler', 'compose' ],
    related: [ 'tech-8', 'tech-22' ],
    keyPoints: `- Paging 3: Jetpack library for loading large datasets incrementally. Kotlin coroutines + Flow based.
- **\`PagingSource<Key, Value>\`**: defines how to load a single page. Override \`load(params)\` — returns \`LoadResult.Page\` with data + next/prev keys, or \`LoadResult.Error\` on failure.
- **\`PagingData<T>\`**: container of paginated data. Emitted as a \`Flow<PagingData<T>>\` from a \`Pager\`.
- **\`RemoteMediator\`**: for network + local DB hybrid (offline-first). Loads pages from network into Room; UI always reads from Room. Handles the "boundary" when the local cache is exhausted.
- **UI side:** \`LazyPagingItems\` in Compose (\`collectAsLazyPagingItems()\`) or \`PagingDataAdapter\` in RecyclerView — both handle append/prepend loading states automatically.`,
    answer: `- Use Paging 3 for any unbounded list instead of a hand-rolled scroll listener
- Network-only list → a \`PagingSource\`; offline-capable list → Room \`PagingSource\` + \`RemoteMediator\`
- Always render \`LoadState\` (loading, error, retry) — the library hands it to you`,
    followUp: `**Follow-up:** With \`RemoteMediator\`, what must you persist besides the items themselves?
> Remote keys — the next/previous network page key per item or per query (typically a \`RemoteKeys\` table written in the same transaction). Without them the mediator cannot know which network page follows the last cached row after process death, and APPEND/PREPEND breaks.`,
    redFlags: `- Implements manual pagination with a scroll listener and offset counter
- Doesn't handle \`LoadState\` in the UI — no loading spinner or error message`,
  },
  {
    id: 'tech-102',
    type: 'technical',
    num: 102,
    difficulty: 'H',
    star: true,
    section: 'Architecture',
    title: 'What is multi-module Android architecture? What are the benefits and how do you structure modules?',
    tags: [ 'multi-module', 'architecture', 'gradle', 'modularization' ],
    related: [ 'sd-20', 'sd-23', 'tech-53', 'tech-54', 'tech-46', 'tech-157' ],
    keyPoints: `- Multi-module: splitting the app into separate Gradle modules (\`:app\`, \`:feature:feed\`, \`:core:network\`, \`:core:ui\`, etc.) instead of one monolithic \`:app\`.
- **Benefits:**
  - Faster incremental builds — only rebuild changed modules
  - Enforced layer boundaries — \`:feature:checkout\` can't accidentally depend on \`:feature:profile\`
  - Parallel module compilation
  - Team ownership — each module can have a clear owner
  - Enables Play Feature Delivery (download optional features on demand)
- **Common structure:**
  - \`:app\` — thin shell, Activity entrypoints, DI setup
  - \`:feature:X\` — UI + ViewModel for a feature area
  - \`:core:network\` — Retrofit, OkHttp, API interfaces
  - \`:core:domain\` — use cases, domain models (pure Kotlin, no Android)
  - \`:core:ui\` — shared Compose components, theme
  - \`:core:data\` — repositories, Room, DataStore
- **Navigation**: feature modules expose route constants; \`:app\` or a \`:core:navigation\` module owns the \`NavHost\`.`,
    answer: `- Split one \`:app\` into \`:feature:X\` plus \`:core:network/data/domain/ui\`; \`:app\` stays a thin shell
- Wins: incremental and parallel builds, boundaries a compiler enforces, clear module owners
- \`:core:domain\` is pure Kotlin; features expose routes, \`NavHost\` sits in \`:app\` or \`:core:navigation\``,
    followUp: `**Follow-up:** How do you share a ViewModel across feature modules?
> Scope it to a \`NavGraph\` (\`navGraphViewModel()\`) or use an application-level state holder in a shared \`:core\` module. Feature modules must not directly import each other.`,
    redFlags: `- Everything in one \`:app\` module
- Circular dependencies between modules
- Feature modules that import other feature modules directly`,
  },
  {
    id: 'tech-104',
    type: 'technical',
    num: 104,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What is Android Accessibility? How do you make a Compose UI accessible?',
    tags: [ 'accessibility', 'a11y', 'compose', 'talkback' ],
    related: [ 'tech-10', 'tech-85' ],
    keyPoints: `- Android Accessibility enables users with disabilities to use apps via assistive technologies like **TalkBack** (screen reader) and **Switch Access** (motor impairment).
- **Key practices:**
  - \`contentDescription\`: text TalkBack reads for icons and images. Set to \`null\` for decorative elements.
  - Minimum touch target: 48dp × 48dp
  - Logical focus order — swipe/tab order must match visual reading order
  - Don't rely on color alone to convey information
- **In Compose:**
  - \`Modifier.semantics { }\`: add or merge accessibility information
  - \`role = Role.Button\`: tells TalkBack how to announce the element
  - \`mergeDescendants = true\`: merge child semantics into parent for complex components

\`\`\`kotlin
Icon(
    painter = painterResource(R.drawable.ic_close),
    contentDescription = "Close dialog"  // required for non-decorative icons
)

Box(
    Modifier.semantics {
        role = Role.Button
        contentDescription = "Play video"
    }
)
\`\`\``,
    answer: `- Treat accessibility as a definition-of-done item for every screen, not a later audit
- Give every interactive element a label, a role and a 48dp target; merge semantics so TalkBack reads one sensible unit
- Verify by actually navigating with TalkBack, backed by automated checks in tests`,
    followUp: `**Follow-up:** How do you test accessibility in your app?
> Enable TalkBack on a device and navigate by swiping. Use the Accessibility Scanner app (Google) to auto-detect issues. In Compose: \`composeTestRule.onNode(hasContentDescription("...")).assertIsDisplayed()\`.`,
    redFlags: `- Never tested with TalkBack
- Omits \`contentDescription\` on icon-only buttons
- Hard-codes touch targets smaller than 48dp`,
  },
  {
    id: 'tech-105',
    type: 'technical',
    num: 105,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What is a Gradle build variant? Explain build types, product flavors, and `BuildConfig`.',
    tags: [ 'gradle', 'build-variants', 'build-types', 'flavors' ],
    related: [ 'tech-84', 'tech-163', 'tech-106' ],
    keyPoints: `- **Build Types**: define build behavior. Defaults: \`debug\` (debuggable, no minification) and \`release\` (minified, signed). Can add custom types like \`staging\` or \`benchmark\`.
- **Product Flavors**: define different versions of the same app. Grouped into \`flavorDimensions\`.
  - Example: \`free\` vs \`paid\`, or \`mock\` vs \`prod\` (backend environment)
- **Build Variant**: the combination of a build type + product flavor — e.g., \`prodRelease\`, \`mockDebug\`.
- **\`BuildConfig\`**: auto-generated class with one set of fields per variant. Add custom fields via \`buildConfigField\`.

\`\`\`kotlin
flavorDimensions += "env"
productFlavors {
    create("prod") {
        dimension = "env"
        buildConfigField("String", "BASE_URL", ""https://api.prod.com"")
    }
    create("mock") {
        dimension = "env"
        buildConfigField("String", "BASE_URL", ""http://localhost:8080"")
    }
}
\`\`\``,
    answer: `- Build types answer "how is it built" (debuggable, minified, signed); flavors answer "which app or environment"
- Keep flavor dimensions few — variants multiply and slow every build
- Put per-variant values in \`buildConfigField\`/resources, never \`if (BuildConfig.FLAVOR == ...)\` scattered in code`,
    followUp: `**Follow-up:** How do you use source sets to have flavor-specific implementations?
> Source sets merge rather than override: a class with the same package+name in both \`src/main/java/\` and \`src/prod/java/\` is a duplicate-class build error. Keep the shared interface in main, give each flavor source set its own implementation class, and each variant compiles exactly one — that is the flavor-specific pattern.`,
    redFlags: `- Hardcodes environment URLs in main source code
- Adds a new flavor dimension for every toggle and ends up with dozens of variants`,
  },
  {
    id: 'tech-106',
    type: 'technical',
    num: 106,
    difficulty: 'M',
    star: false,
    section: 'Android Core',
    title: 'What is a Gradle version catalog? What problem does it solve?',
    tags: [ 'gradle', 'version-catalog', 'dependency-management', 'build' ],
    related: [ 'tech-84', 'tech-105' ],
    keyPoints: `- **Version Catalog** (\`gradle/libs.versions.toml\`): a centralized dependency declaration file — defines versions, libraries, and plugins once, referenced by type-safe accessors in all \`build.gradle.kts\` files.
- **Problem it solves**: in multi-module projects, each module previously declared its own dependency strings. Version drift between modules caused subtle bugs. Copy-pasting version strings was error-prone.
- **Structure:**

\`\`\`toml
[versions]
kotlin = "2.0.0"
compose = "1.7.0"

[libraries]
compose-ui = { group = "androidx.compose.ui", name = "ui", version.ref = "compose" }
kotlin-stdlib = { module = "org.jetbrains.kotlin:kotlin-stdlib", version.ref = "kotlin" }

[plugins]
android-application = { id = "com.android.application", version = "8.4.0" }
\`\`\`

- **Usage in module**: \`implementation(libs.compose.ui)\` — compile-time checked accessor.
- Tooling: Renovate, Dependabot, and the Gradle Versions plugin can all auto-update \`.toml\` files.`,
    answer: `- Adopt a version catalog as soon as there is more than one module
- Put only coordinates and versions in it; shared build logic goes in convention plugins
- Let Renovate or Dependabot bump the catalog so upgrades land as one reviewable change`,
    followUp: `**Follow-up:** What's the difference between version catalog and \`buildSrc\`?
> \`buildSrc\` is a Gradle subproject for sharing build logic (custom tasks, convention plugins). Version catalog is purely for dependency declarations — simpler, no Kotlin code. They're complementary: version catalog for versions, \`buildSrc\`/convention plugins for reusable build logic.`,
    redFlags: `- Still uses a \`Versions.kt\` file in \`buildSrc\` instead of the official TOML catalog
- Pins the same library to different versions in different modules "because it works"`,
  },
  {
    id: 'tech-107',
    type: 'technical',
    num: 107,
    difficulty: 'H',
    star: true,
    section: 'Kotlin',
    title: 'How does the Kotlin compiler implement `suspend` functions? Explain CPS transform and the state machine.',
    tags: [ 'coroutines', 'kotlin', 'internals', 'advanced', 'cps' ],
    related: [ 'tech-13', 'tech-14', 'tech-112' ],
    keyPoints: `- The Kotlin compiler transforms every \`suspend\` function using **Continuation Passing Style (CPS)**: the function receives an additional \`Continuation<T>\` parameter — a callback invoked when the function completes or resumes.
- Each \`suspend\` function is compiled into a **state machine** — a class implementing \`Continuation\` with a \`label\` field tracking the last suspension point. \`resumeWith()\` re-enters the function at the correct label.

\`\`\`kotlin
// Source
suspend fun fetchUser(): User {
    val token = getToken()       // suspension point 0 → 1
    return api.getUser(token)    // suspension point 1 → DONE
}

// Simplified compiled form
fun fetchUser(cont: Continuation<User>): Any? {
    val state = cont as? FetchState ?: FetchState(cont)
    when (state.label) {
        0 -> { state.label = 1; return getToken(state) }
        1 -> { val token = state.result as String
               state.label = 2; return api.getUser(token, state) }
    }
}
\`\`\`

- **Suspension**: when a coroutine suspends, its stack frame is saved as a heap object (the \`Continuation\`). The thread is released immediately — returning \`COROUTINE_SUSPENDED\`.
- **Scheduling**: a \`CoroutineDispatcher\` decides which thread calls \`continuation.resume()\`. No thread is held during suspension.`,
    answer: `- CPS: the compiler threads a hidden \`Continuation<T>\` callback through every suspend call
- Body becomes a state machine; \`label\` marks where \`resumeWith()\` re-enters
- Suspending moves the frame into a heap Continuation, returns \`COROUTINE_SUSPENDED\`, frees the thread`,
    followUp: `**Follow-up:** Why are coroutines far cheaper than threads?
> A suspended coroutine is just a heap object. No OS thread is blocked. Millions of coroutines can coexist where only thousands of threads are feasible.`,
    redFlags: `- Thinks coroutines are syntactic sugar with no runtime machinery
- Believes a thread is blocked during \`delay()\` or network IO`,
  },
  {
    id: 'tech-108',
    type: 'technical',
    num: 108,
    difficulty: 'H',
    star: true,
    section: 'Jetpack',
    title: 'How does Compose internally track state and skip recomposition? Explain the slot table and stability.',
    tags: [ 'compose', 'internals', 'recomposition', 'slot-table', 'stability' ],
    related: [ 'tech-10', 'tech-138', 'tech-92', 'tech-120' ],
    keyPoints: `- Compose maintains a **slot table** (backed by a gap buffer array) that records the tree of composable calls, their parameters, and remembered values. Each composable occupies a group of slots.
- **Initial composition**: slot table is written — composable parameters and \`remember\` values stored.
- **Recomposition**: Compose compares new parameters to stored values using \`==\`. If stable inputs haven't changed, the composable is **skipped** entirely.
- **Recomposition scope**: the smallest composable boundary that can recompose independently. State changes only invalidate scopes that directly read the changed state — not the whole tree.
- **Stability** determines skippability:
  - \`@Immutable\`: all public properties are \`val\` and stable — Compose trusts it never changes
  - \`@Stable\`: properties can change but doing so triggers recomposition
  - Primitives and \`String\` are stable. \`List<T>\` and \`Map<K,V>\` are **NOT** — use \`ImmutableList\` from Kotlinx Collections Immutable
  - Classes from other modules are often treated as unstable unless annotated
- **Compose compiler reports**: enabling \`reportsEnabled\` on the composeCompiler Gradle extension emits per-function skippable/restartable status; the community \`composables\` analyzer prints the same as \`composables.txt\``,
    answer: `- A slot table over a gap buffer records composable calls, their arguments, and \`remember\`ed values
- Invalidation compares new arguments to stored ones with \`==\`; equal stable inputs mean the call is skipped
- Skippability hinges on stability: \`@Immutable\` promises no change, \`@Stable\` means changes still notify`,
    followUp: `**Follow-up:** What does \`@Stable\` actually promise to the Compose compiler?
> Two instances that compare equal produce equal composition results, and public property changes always trigger recomposition. The compiler can then trust those properties won't silently change without notifying Compose.`,
    redFlags: `- Thinks all composables always recompose when parent recomposes
- Mutates a \`mutableListOf()\` held in state and wonders why the UI never updates — the snapshot system only sees writes to \`State\` objects`,
  },
  {
    id: 'tech-109',
    type: 'technical',
    num: 109,
    difficulty: 'H',
    star: false,
    section: 'Android Core',
    title: 'How does Android Binder IPC work? What are its limits and how does AIDL fit in?',
    tags: [ 'binder', 'ipc', 'aidl', 'internals', 'android' ],
    related: [ 'tech-86', 'tech-95' ],
    keyPoints: `- **Binder**: Android's primary IPC kernel driver. Transfers data between processes using a shared kernel buffer mapped into both processes via \`mmap\` — avoids a double copy (unlike socket/pipe IPC).
- **Call flow**: client calls a proxy method → marshals args into a \`Parcel\` → Binder driver copies Parcel into the kernel buffer → server's Binder thread pool picks it up → unmarshals and dispatches → result travels back the same way.
- **AIDL** (Android Interface Definition Language): defines the IPC interface in a \`.aidl\` file. The build system generates a **Proxy** (client-side stub) and **Stub** (server-side abstract class) in Java/Kotlin.
- **Transaction limit**: ~1MB per Binder transaction. Passing large bitmaps or arrays throws \`TransactionTooLargeException\`. Use \`ContentProvider\` + \`ParcelFileDescriptor\` (file descriptor over Binder) for large data.
- **Thread pool**: each process has a Binder thread pool (max 15 threads) to serve incoming calls. \`oneway\` AIDL methods are fire-and-forget — no return, no blocking of the client.
- **Security**: Binder exposes \`Binder.getCallingUid()\` / \`getCallingPid()\` — used by system services for permission checks without trusting the caller.`,
    answer: `- Budget every cross-process call: it is a synchronous kernel round trip with a ~1MB shared ceiling
- Move bulk data by file descriptor, not by value in a Parcel
- Check the caller's UID in any exported Binder service; never trust arguments alone`,
    followUp: `**Follow-up:** How does \`ContentProvider\` avoid the 1MB Binder limit?
> It returns a \`ParcelFileDescriptor\` over Binder — just the file descriptor, not the data. The client reads from the file/pipe directly, bypassing the Binder transaction buffer entirely.`,
    redFlags: `- Thinks Binder is just RPC with no understanding of the kernel mechanism
- Passes bitmaps or large lists through Intent extras or saved state and ships \`TransactionTooLargeException\``,
  },
  {
    id: 'tech-110',
    type: 'technical',
    num: 110,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'How does the ART runtime work? Explain AOT, JIT, and profile-guided optimization.',
    tags: [ 'art', 'runtime', 'jit', 'aot', 'performance', 'internals', 'baseline-profile' ],
    related: [ 'tech-34', 'tech-114' ],
    keyPoints: `- **Dalvik** (pre-Android 5): JIT-only interpreter. Bytecode compiled to native at runtime, fresh every launch.
- **ART evolution:**
  - **Android 5-6**: AOT-only. Full \`.dex\` → native compilation at install (\`dex2oat\`). Fast execution, but slow installs and large storage footprint.
  - **Android 7+**: Hybrid JIT + AOT. App starts with interpreted/JIT execution. The runtime collects a **profile** (.prof) of hot methods. A background \`dex2oat\` job compiles hot code to native. Balances install speed vs runtime performance.
  - **Android 9+**: Profile-guided optimization. Apps can ship **Baseline Profiles** (pre-built \`.prof\`) — ART compiles them at install so first-launch code is already optimized.

\`\`\`
Install → JIT (collect profile) → background dex2oat → AOT compiled methods
            ↑
    Baseline Profile: skip JIT for critical paths at first launch
\`\`\`

- **Baseline Profiles**: defined in \`src/main/baseline-prof.txt\` or generated by Macrobenchmark. Distributed in the APK. Reduces cold startup time and first-scroll jank.`,
    answer: `- Dalvik interpreted and JIT-compiled afresh each launch; Android 5–6 ART did full \`dex2oat\` AOT
- That AOT ran fast but installed slowly and ate storage, so Android 7+ mixes JIT with a hot \`.prof\`
- Android 9+ is profile-guided: a shipped Baseline Profile means first launch is already optimized`,
    followUp: `**Follow-up:** Why does ART recompile after an OTA update?
> The OTA may change the ART runtime itself. On the first boot post-OTA, ART recompiles apps in the background using their saved profiles — users get fast execution after the first boot without reinstalling.`,
    redFlags: `- Thinks ART is AOT-only (ignores the JIT + profile hybrid since Android 7)`,
  },
  {
    id: 'tech-111',
    type: 'technical',
    num: 111,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'How does R8 shrink and obfuscate code? What are keep rules and how do you debug release-only crashes?',
    tags: [ 'r8', 'proguard', 'obfuscation', 'shrinking', 'build', 'security' ],
    related: [ 'tech-161', 'tech-84' ],
    keyPoints: `- **R8** (replaced ProGuard, enabled by default since AGP 3.4): runs on release builds, performs three passes:
  1. **Shrinking** (tree-shaking): removes unreachable classes, methods, fields. Starts from entry points declared in the manifest (Activities, Services, etc.).
  2. **Obfuscation**: renames classes/methods/fields to short names (\`a\`, \`b\`, \`c\`) — reduces binary size, complicates decompilation.
  3. **Optimization**: inlines methods, removes dead code branches, simplifies control flow.
- **Keep rules** (\`proguard-rules.pro\`): tell R8 what to preserve.
  - \`@Keep\`: annotation on a class/member — survives shrinking and renaming
  - \`-keep class com.example.Model { *; }\` — preserve class and all members
  - \`-keepnames\` — preserve name but still allow removal if unused
  - Library \`consumer-rules.pro\`: rules bundled inside AARs, automatically applied to consuming apps
- **Reflection-based libraries** (Retrofit, Gson, Room): R8 can't trace reflective usage → requires keep rules for model classes
- **Debugging release crashes**: each R8 run produces \`build/outputs/mapping/release/mapping.txt\`. Use \`retrace\` (Android SDK) to de-obfuscate stack traces back to original names. Upload \`mapping.txt\` to Firebase Crashlytics — crashes auto-deobfuscated.`,
    answer: `- Release-only R8 runs three passes: shrink from manifest entry points, rename, then optimize
- Reflection (Gson, Retrofit, Room) is invisible to it, so \`-keep\` and \`@Keep\` rules must say otherwise
- Each build emits \`mapping.txt\`; feed it to \`retrace\` or Crashlytics to read obfuscated stacks`,
    followUp: `**Follow-up:** What does \`-keepclassmembers\` do vs \`-keep\`?
> \`-keep\` preserves the class AND its members. \`-keepclassmembers\` preserves members of a class but still allows the class itself to be removed if unused. Use \`-keepclassmembers\` for serialization fields to avoid accidental class removal.`,
    redFlags: `- Adds \`-keep class ** { *; }\` to "fix" crashes — disables all R8 shrinking
- Publishes a library without \`consumer-rules.pro\`, pushing its keep-rule work onto every consuming app`,
  },
  {
    id: 'tech-112',
    type: 'technical',
    num: 112,
    difficulty: 'H',
    star: true,
    section: 'Concurrency',
    title: 'How does coroutine cancellation work internally? What does "cooperative" mean and what are the pitfalls?',
    tags: [ 'coroutines', 'cancellation', 'advanced', 'internals', 'structured-concurrency' ],
    related: [ 'tech-13', 'tech-14', 'tech-107' ],
    keyPoints: `- Coroutine cancellation is **cooperative**: a coroutine is only cancelled at **suspension points**. A CPU-bound loop with no \`suspend\` calls will run to completion even after its scope is cancelled.
- **Mechanism**: \`job.cancel()\` sets the job's state to \`Cancelling\` and throws \`CancellationException\` at the next suspension point inside the coroutine. \`CancellationException\` is special — it does NOT propagate to parent coroutines (unlike other exceptions which cancel the whole scope under a regular \`Job\`).
- **Checking cancellation in tight loops**: \`ensureActive()\` (throws if cancelled) or \`yield()\` (suspends briefly, checks cancellation, lets other coroutines run).
- **\`withContext(NonCancellable)\`**: runs a block even after cancellation — for cleanup that must complete (DB close, analytics flush).
- **Never swallow \`CancellationException\`**: catching it and not rethrowing breaks structured concurrency — the coroutine silently keeps running after its scope is cancelled.

\`\`\`kotlin
// Uncooperative — never actually cancels:
launch { while (true) { compute() } }  // no suspension point

// Cooperative:
launch { while (isActive) { ensureActive(); compute() } }

// Guaranteed cleanup after cancellation:
launch {
    try { doWork() }
    finally { withContext(NonCancellable) { db.close() } }
}

// WRONG — swallowing cancellation:
try { delay(1000) } catch (e: CancellationException) { /* ignore */ }  // breaks cancellation
\`\`\``,
    answer: `- Assume cancellation is only a request — long CPU work must check for it explicitly
- Put must-run cleanup in \`finally\`, wrapped in \`NonCancellable\` if it has to suspend
- Rethrow \`CancellationException\` wherever you catch broadly`,
    followUp: `**Follow-up:** What happens to sibling coroutines when one throws a non-cancellation exception?
> Under a regular \`Job\`, the exception cancels the parent, which then cancels all siblings. Under \`SupervisorJob\`, sibling failure is isolated — the parent and siblings continue. Use \`supervisorScope {}\` for independent child tasks.`,
    redFlags: `- Wraps suspend calls in \`runCatching { }\` or \`catch (e: Exception)\` and swallows cancellation by accident
- Doesn't use \`ensureActive()\` in CPU-bound work`,
  },
  {
    id: 'tech-113',
    type: 'technical',
    num: 113,
    difficulty: 'H',
    star: false,
    section: 'Concurrency',
    title: 'How do you write thread-safe code in Android? Explain `Mutex`, `AtomicReference`, and common race condition patterns.',
    tags: [ 'threading', 'thread-safety', 'mutex', 'race-conditions', 'concurrency' ],
    related: [ 'tech-13', 'tech-14', 'tech-112' ],
    keyPoints: `- Race conditions occur when multiple threads access shared mutable state without synchronization.
- **Common Android race patterns:**
  - Writing a \`var\` from multiple coroutines — reads and writes aren't atomic
  - Non-atomic check-then-act: \`if (cache == null) cache = compute()\` from two threads
  - \`ArrayList\` modified from background threads (not thread-safe)
  - ViewModel state updated from both main thread and background coroutine
- **Solutions:**
  - \`Mutex\` (coroutine-aware): \`mutex.withLock { }\` — **suspends** (not blocks) while waiting. Correct choice inside coroutines.
  - \`synchronized\` / \`@Synchronized\`: JVM monitor lock — **blocks the thread**. Dangerous on \`Dispatchers.Main\` or a single-threaded dispatcher.
  - \`AtomicInteger\`, \`AtomicReference\`, \`AtomicBoolean\`: lock-free CAS operations. For simple counters and references only.
  - \`ConcurrentHashMap\`: thread-safe map with per-segment locking.
  - \`StateFlow\` on a single dispatcher: confine all mutations to one dispatcher (\`Dispatchers.Default\`) — no lock needed if only one writer.

\`\`\`kotlin
// Wrong — race on count:
class Counter { var count = 0 }

// Right with coroutines:
class Counter {
    private val mutex = Mutex()
    private var count = 0
    suspend fun increment() = mutex.withLock { count++ }
    suspend fun get() = mutex.withLock { count }
}
\`\`\``,
    answer: `- Shared mutable state is the root: \`var\` writes, check-then-act, \`ArrayList\` touched from threads
- \`Mutex.withLock { }\` suspends instead of blocking, which makes it the coroutine-correct guard
- \`synchronized\` blocks the thread, risky on Main; atoms fit counters, \`ConcurrentHashMap\` fits maps`,
    followUp: `**Follow-up:** Is a coroutine \`Mutex\` reentrant?
> No. Calling \`mutex.withLock { }\` again from inside a block that already holds the same \`Mutex\` suspends forever — a self-deadlock — whereas \`synchronized\` is reentrant. Keep the locked section small and never call back into code that takes the same lock.`,
    redFlags: `- Uses \`synchronized\` inside a \`Dispatchers.Main\` coroutine
- Accesses a \`HashMap\` from multiple threads
- Thinks \`val\` makes an object thread-safe (the reference is immutable; the object may not be)`,
  },
  {
    id: 'tech-114',
    type: 'technical',
    num: 114,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'How do you optimize Android app startup? Explain cold vs warm launch, App Startup library, and key bottlenecks.',
    tags: [ 'performance', 'startup', 'app-startup', 'cold-start', 'baseline-profile' ],
    related: [ 'tech-34', 'tech-110', 'tech-35', 'tech-63', 'tech-146' ],
    keyPoints: `- **Launch types:**
  - **Cold start**: process doesn't exist → fork → class loading → \`Application.onCreate()\` → \`Activity.onCreate()\` → first frame drawn. Most expensive. Target < 500ms.
  - **Warm start**: process alive, Activity destroyed → recreate Activity → first frame. Medium cost.
  - **Hot start**: process alive, Activity in backstack → \`onRestart()\`. Cheapest.
- **Common cold start bottlenecks:**
  - Heavy synchronous work in \`Application.onCreate()\` — blocking the main thread
  - Many libraries using \`ContentProvider\` for auto-initialization (each ContentProvider starts before \`Application.onCreate()\`)
  - Large classes not yet compiled to native (JIT cold path)
- **App Startup library**: replaces N separate ContentProviders with one shared \`InitializationProvider\`. Each library implements \`Initializer<T>\`, declares dependencies, and the framework initializes them in order — drastically reducing ContentProvider overhead.
- **Key optimizations:**
  1. Move non-critical init out of \`Application.onCreate()\` to lazy/background
  2. Use Baseline Profiles to pre-compile hot startup code
  3. Use App Startup library to consolidate ContentProvider overhead
  4. Add \`androidx.tracing.Trace.beginSection()\` / \`endSection()\` around startup work to identify hotspots in Android Studio Profiler
- **Measuring**: \`adb shell am start-activity -W\` for TotalTime. Macrobenchmark with \`StartupTimingMetric\` for automated regression detection. Call \`reportFullyDrawn()\` once real content is on screen so time-to-full-display is measured, not just the first frame; Android Studio Profiler and Perfetto show where the time goes.`,
    answer: `- Optimize cold start first — warm and hot starts are subsets of it
- Keep the main thread before the first frame for work the first screen needs; defer or background the rest
- Measure with a reproducible benchmark before and after each change, and gate regressions in CI`,
    followUp: `**Follow-up:** A library auto-initializes through App Startup but you want it lazy. How?
> Remove its entry from the merged manifest — keep \`InitializationProvider\` with \`tools:node="merge"\` and mark that initializer's \`<meta-data>\` \`tools:node="remove"\` — then call \`AppInitializer.getInstance(context).initializeComponent(TheInitializer::class.java)\` at the point the feature is first needed.`,
    redFlags: `- Does all SDK initialization synchronously in \`Application.onCreate()\`
- Makes network calls or heavy DI graph construction on the main thread during launch
- Tunes startup by feel, never measuring it with tooling`,
  },
  {
    id: 'tech-115',
    type: 'technical',
    num: 115,
    difficulty: 'H',
    star: false,
    section: 'Performance & Security',
    title: 'What is Jetpack Macrobenchmark? How does it differ from Microbenchmark and what can it measure?',
    tags: [ 'macrobenchmark', 'performance', 'benchmarking', 'testing', 'startup' ],
    related: [ 'tech-34', 'tech-114', 'tech-110' ],
    keyPoints: `- **Macrobenchmark**: measures whole-app, user-facing performance from outside the app process — startup time, scrolling jank, interaction latency. Runs on a real device.
- **vs Microbenchmark** (\`androidx.benchmark\`): Microbenchmark measures isolated code (a DAO query, a sorting algorithm) inside the app process. Macrobenchmark measures end-to-end user flows.
- **Key APIs:**
  - \`MacrobenchmarkRule\` + \`@Test\`
  - \`benchmarkRule.measureRepeated(packageName, metrics, startupMode, iterations) { ... }\`
  - \`StartupMode.COLD / WARM / HOT\`
  - \`metrics\`: \`StartupTimingMetric()\`, \`FrameTimingMetric()\`, \`TraceSectionMetric("label")\`
  - UI interaction: \`pressHome()\`, \`startActivityAndWait()\`, \`device.findObject(...).scroll(...)\`

\`\`\`kotlin
@Test fun coldStartup() = benchmarkRule.measureRepeated(
    packageName = "com.example.app",
    metrics = listOf(StartupTimingMetric()),
    startupMode = StartupMode.COLD,
    iterations = 5
) {
    pressHome()
    startActivityAndWait()
}
\`\`\`

- Requires a \`benchmark\` build variant — runs against a **non-debuggable, profileable** build for accurate results. Results are reported in Android Studio and as JSON.
- Can also generate Baseline Profiles via \`BaselineProfileRule\`.`,
    answer: `- It measures the app from another process on a real device: launch time, scroll jank, interactions
- Microbenchmark (\`androidx.benchmark\`) instead times isolated code inside the process
- Needs a profileable, non-debuggable \`benchmark\` variant; see \`measureRepeated\`, \`StartupMode.COLD\``,
    followUp: `**Follow-up:** Why can't you run Macrobenchmark against a debuggable build?
> Debuggable builds have JIT overhead, extra validations, and aren't eligible for ART profile-guided compilation. Results are artificially slower and don't represent production behavior.`,
    redFlags: `- Uses \`System.currentTimeMillis()\` to measure startup
- Tries to run benchmarks in a debug build`,
  },
  {
    id: 'tech-116',
    type: 'technical',
    num: 116,
    difficulty: 'H',
    star: true,
    section: 'Engineering',
    title: 'How do you write a custom Android Lint rule? What are `Detector`, `Issue`, and `IssueRegistry`?',
    tags: [ 'lint', 'custom-lint', 'static-analysis', 'code-quality', 'build' ],
    related: [ 'tech-84', 'tech-111' ],
    keyPoints: `- Android Lint is extensible — you can write project-specific rules (e.g., "never use \`GlobalScope\`", "all \`Toast\` calls must use extension function", "don't call \`Log.d\` in release").
- **Structure:**
  1. Create a separate module (\`:lint-checks\`) with \`compileOnly("com.android.tools.lint:lint-api:...")\`
  2. Write a \`Detector\` subclass implementing the relevant \`Scanner\` interface (\`SourceCodeScanner\`, \`XmlScanner\`, \`ResourceFolderScanner\`)
  3. Define an \`Issue\` with ID, severity, category, and explanation
  4. Register issues in an \`IssueRegistry\` subclass
  5. App module: \`lintChecks(project(":lint-checks"))\`

\`\`\`kotlin
class GlobalScopeDetector : Detector(), SourceCodeScanner {
    companion object {
        val ISSUE = Issue.create(
            id = "GlobalScopeUsage",
            briefDescription = "Avoid GlobalScope",
            explanation = "Use viewModelScope or lifecycleScope instead.",
            category = Category.CORRECTNESS,
            severity = Severity.ERROR,
            implementation = Implementation(GlobalScopeDetector::class.java,
                                            Scope.JAVA_FILE_SCOPE)
        )
    }
    override fun getApplicableReferenceNames() = listOf("GlobalScope")
    override fun visitReference(context: JavaContext, ref: UReferenceExpression, el: PsiElement) {
        context.report(ISSUE, ref, context.getLocation(ref), "Avoid GlobalScope")
    }
}
\`\`\`

- **Testing**: use \`LintDetectorTest\` from \`lint-tests\`. Write JUnit tests with inline source strings and assert expected \`LintResult\` — warnings at specific lines.`,
    answer: `- Lives in its own \`:lint-checks\` module with \`compileOnly\` lint-api; app adds \`lintChecks(project(...))\`
- A \`Detector\` implements a scanner (\`SourceCodeScanner\`, \`XmlScanner\`) and reports an \`Issue\`
- \`IssueRegistry\` lists the issues; prove the rule with \`LintDetectorTest\` asserting \`LintResult\``,
    followUp: `**Follow-up:** How do you suppress a custom Lint warning on a specific call site?
> \`@SuppressLint("GlobalScopeUsage")\` on the element, or \`// noinspection GlobalScopeUsage\` comment above the line. Both suppress by Issue ID.`,
    redFlags: `- Enforces code patterns only through code review, never tooling`,
  },
  {
    id: 'tech-117',
    type: 'technical',
    num: 117,
    difficulty: 'H',
    star: true,
    section: 'Kotlin',
    title: 'How does cold Flow handle backpressure? Explain `buffer`, `conflate`, `collectLatest`, and upstream cancellation.',
    tags: [ 'flow', 'coroutines', 'cold-stream', 'backpressure', 'advanced' ],
    related: [ 'tech-136', 'tech-90', 'tech-91', 'tech-112' ],
    keyPoints: `- **Cold Flow**: each \`collect {}\` call starts the producer from scratch in the same coroutine. The producer and collector are in the same call stack — producer suspends at each \`emit()\` until the collector processes it. This is **built-in backpressure**: producer can never outrun consumer.
- **\`buffer(capacity)\`**: decouples producer and consumer into separate coroutines with a channel buffer between them. Producer emits freely up to capacity; collector reads at its own pace. Removes backpressure — producer can get ahead.
- **\`conflate()\`**: producer runs freely; if collector is busy, intermediate values are dropped — only the latest is delivered. Use when only the most recent state matters (UI rendering).
- **\`collectLatest {}\`**: starts a new block for each emission, cancelling the previous invocation. Use for search — new query cancels the in-flight processing of the old one.
- **Upstream cancellation**: when the collector's scope cancels, \`CancellationException\` propagates upstream into the flow builder's \`emit()\`. The producer should use \`finally {}\` for cleanup.

\`\`\`kotlin
// Built-in backpressure — producer waits for consumer:
flow { repeat(1000) { emit(it) } }.collect { delay(100) }  // producer waits

// Decouple with buffer:
flow { repeat(1000) { emit(it) } }.buffer(50).collect { delay(100) }  // producer fills buffer

// Only latest matters:
flow { repeat(1000) { emit(it) } }.conflate().collect { delay(100) }  // skips most

// Cancel stale processing:
searchQuery.collectLatest { query -> delay(300); search(query) }  // cancels old on new query
\`\`\``,
    answer: `- By default \`emit()\` suspends until the collector finishes; \`buffer(n)\` breaks that coupling
- \`conflate()\` delivers only the newest to a busy collector; \`collectLatest\` cancels stale blocks
- Scope cancellation propagates upstream into \`emit()\` — clean up via \`finally\``,
    followUp: `**Follow-up:** What happens if you \`collect\` a cold Flow from two coroutines simultaneously?
> Each \`collect\` gets an independent producer — the flow runs twice, completely separately. For shared execution (one producer, many consumers), use \`shareIn()\` to convert to a \`SharedFlow\`.`,
    redFlags: `- Thinks cold Flow has SharedFlow's sharing semantics
- Adds \`buffer()\` to every cold Flow by reflex, removing the natural backpressure instead of choosing it
- Confuses \`conflate()\` (drop intermediates) with \`collectLatest\` (cancel previous processing)`,
  },
  {
    id: 'tech-118',
    type: 'technical',
    num: 118,
    difficulty: 'H',
    star: false,
    section: 'Performance & Security',
    title: 'What is the Play Integrity API? How do you implement root/tamper detection and what are its limits?',
    tags: [ 'security', 'play-integrity', 'root-detection', 'tampering', 'attestation' ],
    related: [ 'tech-37', 'tech-164', 'tech-42' ],
    keyPoints: `- **Play Integrity API** (replaced SafetyNet Attestation): lets an app ask Google to attest that it runs on a genuine Android device, with an unmodified app binary, installed from the Play Store.
- **Verdict payload contains:**
  - \`deviceIntegrity\`: hardware attestation level (\`MEETS_STRONG_INTEGRITY\` = hardware-backed, hardest to spoof)
  - \`appIntegrity\`: signing certificate matches Play Store record
  - \`accountDetails\`: Play license for the app
- **Correct flow** (server-side verification is mandatory):
  1. App generates a one-time nonce
  2. Calls Integrity API → receives signed token
  3. Sends token to YOUR backend
  4. Backend calls Google's API to verify → receives verdict JSON
  5. Backend grants/denies access based on verdict
- **Client-side root detection** (layered, defense-in-depth):
  - Check for \`su\` binary in known paths
  - Check for Magisk/SuperSU/Zygisk packages installed
  - \`RootBeer\` library: aggregates many checks
  - These are all bypassable by Magisk DenyList, LSPosed — treat as signal, not guarantee
- **Play Integrity** \`MEETS_STRONG_INTEGRITY\` (hardware attestation) is significantly harder to bypass — requires a compromised TEE/bootloader.`,
    answer: `- Play Integrity replaced SafetyNet Attestation; it attests genuine device, unmodified binary, Play install
- Verdict fields: \`deviceIntegrity\` level, \`appIntegrity\` signature match, \`accountDetails\` license
- Verify the token server-side against a one-time nonce; \`MEETS_STRONG_INTEGRITY\` is hardware-backed`,
    followUp: `**Follow-up:** What are the privacy considerations of Play Integrity?
> Requests are tied to the Google account. Avoid storing full verdict payloads long-term. Don't silently deny service for \`MEETS_BASIC_INTEGRITY\` failures without clear user communication — many legitimate users on custom ROMs would be affected.`,
    redFlags: `- Relies solely on client-side \`su\` binary checks (trivially bypassed)
- Verifies the integrity token on the client (defeats the purpose — token must go to YOUR server)`,
  },
  {
    id: 'tech-119',
    type: 'technical',
    num: 119,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'How do memory leaks happen in Android? How does LeakCanary detect them and what patterns should you know?',
    tags: [ 'memory-leak', 'leakcanary', 'heap-dump', 'performance', 'gc' ],
    related: [ 'tech-9', 'tech-34', 'tech-98', 'tech-99', 'tech-10' ],
    keyPoints: `- A memory leak is an object the GC cannot collect because something still holds a reference to it — even though the app no longer needs it.
- **Most common Android leak patterns:**
  - **Static field holding Activity/View**: \`companion object { var ctx: Context }\` — Activity can't be GC'd as long as the process lives
  - **Anonymous inner class**: holds an implicit \`this\` reference to the outer Activity/Fragment
  - **Handler + delayed message**: message holds handler → handler (inner class) holds Activity
  - **Listener not unregistered**: \`LocationManager\`, \`SensorManager\`, \`BroadcastReceiver\` registered but never removed in \`onPause\`/\`onDestroy\`
  - **ViewModel holding Activity context**: ViewModel survives config change; Activity is recreated
  - **Coroutine referencing Activity via closure**: coroutine in a leaked scope captures the Activity
- **Standard fixes**: null the view binding in \`onDestroyView\`, unregister listeners in the matching teardown callback, keep only the application context in anything long-lived
- **LeakCanary detection**: watches objects that should be GC'd (Activities, Fragments, ViewModels) after destruction. Wraps them in a \`WeakReference\`. After 5s, triggers GC. If the WeakReference's referent is still non-null → heap dump → parses the shortest reference path from a GC root to the leaking object → shows it in a human-readable notification.
- **Heap dump analysis** beyond LeakCanary: Android Studio Profiler → "Capture heap dump", or \`Memory Analyzer Tool (MAT)\` for deep retained-size analysis.`,
    answer: `- Run LeakCanary on every debug build so leaks surface during development, not in production
- Fix leaks at the owner: whoever registers or captures must release at the matching lifecycle event
- Judge severity by retained size, not by the number of leak reports`,
    followUp: `**Follow-up:** What's the difference between shallow size and retained size in a heap dump?
> **Shallow size**: the memory consumed by the object itself (its fields only). **Retained size**: the total memory that would be freed if this object were GC'd — includes all objects exclusively reachable through it. Retained size identifies the real impact of a leak.`,
    redFlags: `- Stores Activity context in a singleton or companion object
- Doesn't unregister listeners in \`onPause\`/\`onDestroy\`
- Treats every LeakCanary report as noise and never reads the reference chain`,
  },
  {
    id: 'tech-120',
    type: 'technical',
    num: 120,
    difficulty: 'H',
    star: true,
    section: 'Jetpack',
    title: 'How do you prevent unnecessary recomposition in Compose? Explain stability, lambda capture, and `remember` semantics.',
    tags: [ 'compose', 'performance', 'recomposition', 'stability', 'remember', 'advanced' ],
    related: [ 'tech-10', 'tech-138', 'tech-92', 'tech-108' ],
    keyPoints: `- **Skippability**: Compose skips recomposing a function if all parameters are stable and haven't changed. Unstable parameters force recomposition every time.
- **What makes a type unstable** (Compose compiler assumes unstable by default unless proven otherwise):
  - \`List<T>\`, \`Map<K,V>\` — mutable interface, even if \`val\`. Use \`ImmutableList\`/\`ImmutableMap\` from \`kotlinx-collections-immutable\`
  - Classes from other modules without \`@Stable\`/\`@Immutable\`
  - Data classes with \`var\` properties
- **Lambda capture trap**: a lambda created inline in a composable is a new instance each recomposition → unstable parameter → forces recomposition of the child. Wrap in \`remember {}\` to stabilize.
- **\`remember\` semantics**: caches a value across recompositions of the same composable instance. Re-runs only when \`key\` changes. Does NOT persist across Activity recreation — use \`rememberSaveable\` for that.
- **\`derivedStateOf\`**: use when a derived value changes less often than its inputs. Prevents recomposition on every input change if the derived result is the same.
- **Compose compiler metrics** (\`-Pcompose.metrics.enabled=true\`): emits \`composables.txt\` and \`composables.csv\` — shows each function's stability classification, whether it's restartable, and whether it's skippable.

\`\`\`kotlin
// Unstable lambda — new instance every recomposition:
Button(onClick = { doSomething(item) })  // forces Button to recompose

// Stable lambda:
val onClick = remember(item) { { doSomething(item) } }
Button(onClick = onClick)  // Button can now skip if other state changes
\`\`\``,
    answer: `- A call recomposes only if some parameter is unstable or changed — equality plus stability enable the skip
- Unstable by default: \`List\`/\`Map\` even as \`val\`, classes from other modules, data classes with \`var\`
- An inline lambda is a fresh instance each pass; wrap it in \`remember {}\` to restore skipping`,
    followUp: `**Follow-up:** What does the Compose compiler mean by "restartable but not skippable"?
> Restartable = the composable has a scope boundary — Compose can restart recomposition here independently of the parent. Not skippable = an input parameter is unstable, so the composable must always re-execute when its parent recomposes. Fix: make the parameter type \`@Stable\` or \`@Immutable\`.`,
    redFlags: `- Passes raw \`List<T>\` to a composable and wonders why it always recomposes
- Creates lambdas inline in composables without \`remember\``,
  },
  {
    id: 'tech-121',
    type: 'technical',
    num: 121,
    difficulty: 'H',
    star: true,
    section: 'Jetpack',
    title: 'How does Compose handle recomposition and state observation at the compiler level?',
    tags: [ 'compose', 'internals', 'recomposition' ],
    related: [ 'tech-138', 'tech-108', 'tech-120' ],
    keyPoints: `- Compose uses a slot table (gap buffer) to track composable calls and their parameters
- The compiler generates code that compares new parameter values to stored values using ==
- If all inputs are stable and unchanged, the composable is skipped entirely
- State reads inside composable body trigger recomposition of only the reading scope
- @Stable/@Immutable annotations tell the compiler a type is safe to skip`,
    answer: `- Call sites plus the arguments each received are recorded in a slot table over a gap buffer
- Compiled code tests incoming arguments against the stored ones with \`==\` and skips when they match
- Only the scope that read a changed value invalidates; \`@Stable\`/\`@Immutable\` certify a type as safe to skip`,
    followUp: `**Follow-up:** What is the difference between restartable and skippable?
> Restartable = can restart independently. Skippable = can be skipped when inputs unchanged. A composable can be restartable but not skippable if inputs are unstable.`,
    redFlags: `- Thinks Compose redraws everything like invalidate()`,
  },
  {
    id: 'tech-122',
    type: 'technical',
    num: 122,
    difficulty: 'H',
    star: true,
    section: 'Concurrency',
    title: 'Explain Kotlin Flow backpressure and how cold streams handle it natively.',
    tags: [ 'flow', 'coroutines', 'backpressure' ],
    related: [ 'tech-136', 'tech-91', 'tech-117' ],
    keyPoints: `- Cold Flow: producer suspends at emit() until collector processes — built-in backpressure
- buffer() decouples producer/consumer with a channel
- conflate() drops intermediates, keeps only latest
- collectLatest() cancels previous block on new emission
- SharedFlow (hot) has no built-in backpressure — uses replay/buffer config`,
    answer: `- Cold flows self-regulate: the producer suspends at \`emit\` until the collector consumes
- \`buffer()\` inserts a channel so producer and consumer run apart; \`conflate()\` keeps just the newest
- \`collectLatest\` cancels the running block per new value; hot \`SharedFlow\` relies on replay/buffer`,
    redFlags: `- Uses buffer() everywhere without understanding backpressure
- Confuses cold and hot flow semantics`,
  },
  {
    id: 'tech-130',
    type: 'technical',
    num: 130,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'What is the difference between Activity, Fragment, and Composable lifecycle management?',
    tags: [ 'lifecycle', 'compose', 'fragment' ],
    related: [ 'tech-53', 'tech-67' ],
    keyPoints: `- Activity: OS entry point, full lifecycle (onCreate/onStart/onResume/onPause/onStop/onDestroy)
- Fragment: tied to Activity lifecycle but has parallel lifecycle; onDestroyView destroys view but instance lives
- Composable: composition-based; lifecycle = enter/leave composition; managed by Compose runtime
- Composable uses LaunchedEffect/DisposableEffect instead of lifecycle callbacks`,
    answer: `- Activity: the OS entry point with the canonical onCreate→onDestroy chain
- Fragment: parallel lifecycle on top; \`onDestroyView\` drops views while the instance lives on
- Composable: lifecycle = entering/leaving composition; \`LaunchedEffect\`/\`DisposableEffect\` do cleanup`,
    redFlags: `- Tries to manage composable with Activity callbacks`,
  },
  {
    id: 'tech-132',
    type: 'undefined',
    num: 132,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'Is the domain layer (use cases) in Clean Architecture worth it on Android? Argue both sides.',
    tags: [ 'walmart', 'architecture', 'clean-architecture' ],
    related: [ 'tech-46', 'tech-74', 'tech-157' ],
    keyPoints: `- For: beyond the textbook reuse/testability case (tech-45), a domain layer decouples ViewModels from repository shape — repositories can be split, merged or re-cached without touching presentation code
- Against: boilerplate (one class per operation), pass-through mappers, slows simple CRUD screens
- Senior take: use cases earn their place for multi-step orchestration (checkout pricing rules, offline sync policy), not one-line repo delegation`,
    answer: `- Make the domain layer optional per feature, not a project-wide mandate
- Add a use case the moment logic spans repositories or is shared by screens; skip it for one-line delegation
- Say the cost out loud in the interview — the all-or-nothing answer is the weak one`,
    followUp: `**Follow-up:** Where does mapping live?
> At layer boundaries; DTOs never leak past the data layer, domain models never carry Retrofit/Room annotations`,
    redFlags: `- All-or-nothing stance with no cost acknowledgment
- Lets Room entities reach the UI layer`,
  },
  {
    id: 'tech-134',
    type: 'undefined',
    num: 134,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'Explain Hilt\'s component hierarchy and scoping. What breaks if you put things in the wrong scope?',
    tags: [ 'walmart', 'hilt', 'dagger', 'dependency-injection', 'di', 'advanced' ],
    related: [ 'tech-102', 'tech-75', 'tech-155', 'tech-25', 'tech-51' ],
    keyPoints: `- SingletonComponent (app) → ActivityRetainedComponent (survives config change) → two child branches: ViewModelComponent (one per @HiltViewModel) and ActivityComponent → FragmentComponent → ViewComponent — ViewModelComponent is a sibling of ActivityComponent under ActivityRetainedComponent, not a link between them
- Scopes: @Singleton, @ActivityRetainedScoped, @ViewModelScoped, @ActivityScoped, @FragmentScoped — a binding is injectable only where its scope is visible
- Lifetime examples: \`@Singleton\` = one instance for the whole app process; \`@ActivityScoped\` = one per Activity instance, recreated on every configuration change; \`@ActivityRetainedScoped\` survives that recreation
- Entry annotations: \`@HiltAndroidApp\` on the \`Application\` triggers codegen and creates the \`SingletonComponent\` (required); \`@AndroidEntryPoint\` enables field injection in Activities/Fragments/Views/Services; \`@HiltViewModel\` lets a ViewModel use an \`@Inject\` constructor inside \`ViewModelComponent\`; \`@Module\` + \`@InstallIn(XComponent::class)\` contributes bindings to a component
- Wrong-scope failures: @ActivityScoped dependency into a ViewModel = compile error; heavy cache @ActivityScoped leaks per rotation; @Singleton holding a Context must hold only the application context
`,
    answer: `- Default to unscoped; add the narrowest scope whose lifetime matches the state you need to share
- Anything a ViewModel consumes must be bound at \`ViewModelComponent\` or an ancestor of it
- If a \`@Singleton\` needs a \`Context\`, it gets \`@ApplicationContext\` — nothing else`,
    followUp: `**Follow-up:** What does @ViewModelScoped give you over @Singleton?
> Instance shared within one ViewModel's graph, recreated with the VM — right lifetime for per-screen use-case state`,
    redFlags: `- Tries to inject \`@ActivityContext\` into a \`@Singleton\` and "fixes" the compile error by passing the Activity in manually
- Marks everything \`@Singleton\` "to be safe", turning per-screen state into process-wide state
- Treats scopes as a sharing knob only, ignoring that they define lifetime`,
  },
  {
    id: 'tech-136',
    type: 'undefined',
    num: 136,
    difficulty: 'M',
    star: true,
    section: 'Jetpack',
    title: 'LiveData vs StateFlow vs SharedFlow — pick per use case and justify.',
    tags: [ 'walmart', 'flow', 'stateflow', 'livedata', 'jetpack', 'coroutines', 'state', 'viewmodel', 'architecture' ],
    related: [ 'tech-12', 'tech-83', 'tech-121', 'tech-138', 'tech-14', 'tech-15', 'tech-44', 'tech-17', 'tech-23', 'tech-90' ],
    keyPoints: `- StateFlow: hot, always-has-value, conflated — state semantics, the default for UiState in Kotlin-first code
- SharedFlow: hot, configurable replay/buffer — event semantics (one-shot events with replay 0 + buffer)
- LiveData: lifecycle-aware out of the box, Java-friendly; fine for legacy XML screens but no operators, main-thread bound
- Plain \`Flow\`: cold and lazy — each collector runs its own pipeline; the right shape for repository/data pipelines, turned hot at the ViewModel edge
- Collect stateFlow with repeatOnLifecycle(STARTED) so background work stops
- Expose a private \`MutableStateFlow\` as \`StateFlow\` via \`asStateFlow()\` so callers can't mutate it
`,
    answer: `- Screen state → \`StateFlow\`; fire-once effects → \`SharedFlow\`/\`Channel\`; data pipelines → cold \`Flow\`
- Keep \`LiveData\` only where Java or legacy XML binding forces it; don't start new code on it
- Whatever you pick, collect it lifecycle-aware so a backgrounded screen stops working`,
    followUp: `**Follow-up:** Why \`stateIn(scope, WhileSubscribed(5000), initial)\`?
> Survives rotation without refetch, stops upstream when UI leaves, conflates rapid emissions

**Follow-up:** What happens if you collect a \`SharedFlow\` with replay=0 and the event was emitted before collection started?
> The subscriber misses it — SharedFlow with no replay doesn't cache. This is intentional for fire-once events.`,
    redFlags: `- Uses LiveData + coroutines everywhere with no migration rationale
- Collects flows in lifecycleScope without repeatOnLifecycle
- Exposes \`MutableLiveData\`/\`MutableStateFlow\` publicly from the ViewModel
- Uses \`SharedFlow\` for UI state and loses the current-value guarantee
- Uses \`LiveData\` inside a repository`,
  },
  {
    id: 'tech-138',
    type: 'undefined',
    num: 138,
    difficulty: 'M',
    star: true,
    section: 'Jetpack',
    title: 'What triggers recomposition in Compose, and how do you diagnose and fix performance problems?',
    tags: [ 'walmart', 'compose', 'performance', 'jetpack', 'state' ],
    related: [ 'tech-92', 'tech-108', 'tech-144', 'tech-12', 'tech-13', 'tech-120' ],
    keyPoints: `- Recomposition triggers: a read of changed state (MutableState, derivedStateOf, collectAsState values) within a composition scope
- Stability: @Stable/@Immutable contracts; unstable params (List, lambdas not remembered) defeat skipping
- Diagnosis: Layout Inspector recomposition counts, composition tracing in Perfetto
- Fixes: state hoisting, derivedStateOf for computed reads, remember for expensive objects, immutable data classes, deferred reads via lambdas, stable \`key()\`s on list items so siblings can skip
`,
    answer: `- Measure recomposition counts before changing code — most "slow Compose" hunches are wrong
- Fix the widest scope first: read state as late and as low in the tree as possible
- Only then chase stability annotations and remembered lambdas for the hot composables`,
    followUp: `**Follow-up:** Deferred state reads — why do they help?
> Reading state inside a lambda narrows the recomposition scope to that block instead of the whole composable`,
    redFlags: `- Sprinkles \`remember\`/\`@Stable\` on every parameter by reflex instead of measuring which composables actually over-recompose
- Debugs jank with logging instead of tooling`,
  },
  {
    id: 'tech-139',
    type: 'undefined',
    num: 139,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'Explain structured concurrency and coroutine exception handling. What are supervisorScope vs coroutineScope?',
    tags: [ 'walmart', 'coroutines', 'concurrency', 'kotlin' ],
    related: [ 'tech-14', 'tech-52', 'tech-88', 'ds-46' ],
    keyPoints: `- Structured concurrency: coroutines form a scope hierarchy; cancellation propagates down, failure propagates up per Job semantics
- coroutineScope: any child failure cancels the parent and siblings (fail-fast)
- supervisorScope: children fail independently — right for parallel independent calls (price + stock + promo)
- Exceptions: launch → CoroutineExceptionHandler at the root; async → surfaces at await; try/catch around await is mandatory
- CancellationException must never be swallowed — rethrow
`,
    answer: `- Decide per feature whether sibling tasks are jointly required (fail-fast) or independent (supervise)
- Put error handling where the exception actually surfaces: at \`await\` for \`async\`, a root handler for \`launch\`
- Never let error handling swallow cancellation`,
    followUp: `**Follow-up:** A \`launch\`ed child of \`supervisorScope\` throws and nothing handles it — what happens?
> The failure is not propagated to the parent, so it goes to the child's \`CoroutineExceptionHandler\`, or, if there is none, to the thread's uncaught-exception handler — which crashes an Android app. Supervised \`launch\` children still need a handler or their own \`try/catch\`.`,
    redFlags: `- Catches all exceptions generically and continues
- Wraps independent parallel calls in \`coroutineScope\`, so one failed widget blanks the whole screen`,
  },
  {
    id: 'tech-140',
    type: 'undefined',
    num: 140,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'Cold vs hot Flows — what do stateIn/ShareIn actually solve, and what are the SharingStarted trade-offs?',
    tags: [ 'walmart', 'flow', 'coroutines', 'kotlin' ],
    related: [ 'tech-15', 'tech-136' ],
    keyPoints: `- Cold: each collector re-runs the builder (flow { }, Retrofit-generated flows) — one upstream per collector
- Hot: shared upstream, multi-cast (StateFlow, SharedFlow)
- stateIn/ShareIn convert cold → hot: upstream runs once while shared; WhileSubscribed stops it with no collectors
- Eagerly vs Lazily vs WhileSubscribed(5000): startup preheat vs first-collector vs rotation-tolerant lazy
- replay + extraBufferCapacity trade late-collector completeness against memory and back-pressure
`,
    answer: `- Cold: every collector starts its own builder run, so \`flow { }\` and Retrofit work repeat per subscriber
- \`stateIn\`/\`shareIn\` make it hot so one upstream run is multicast to all collectors
- \`Eagerly\` preheats, \`Lazily\` waits for the first collector, \`WhileSubscribed(5000)\` tolerates rotation`,
    followUp: `**Follow-up:** Why does \`stateIn\` demand an initial value while \`shareIn\` doesn't?
> \`stateIn\` produces a \`StateFlow\`, which must always hold a current value (and de-duplicates equal ones); \`shareIn\` produces a \`SharedFlow\` with configurable replay and no current value. Use \`shareIn\` for event streams or when no sensible initial state exists.`,
    redFlags: `- Thinks StateFlow is cold
- Uses Eagerly everywhere and never stops upstream`,
  },
  {
    id: 'tech-142',
    type: 'undefined',
    num: 142,
    difficulty: 'M',
    star: false,
    section: 'Networking & Data',
    title: 'How do you ship a Room schema migration safely? Destructive vs auto vs manual.',
    tags: [ 'walmart', 'room', 'database', 'testing' ],
    related: [ 'tech-19', 'tech-72', 'sd-18' ],
    keyPoints: `- Versioned migrations with Migration objects; @AutoMigration for simple adds/renames with exportSchema=true
- Manual SQL for data transforms; test with MigrationTestHelper against exported schemas in CI
- Destructive fallback acceptable only for caches, never user data (cart, drafts)
- Ship a migration in a release BEFORE any destructive change lands
`,
    answer: `- Bump versions with \`Migration\` objects; \`@AutoMigration\` covers simple adds when \`exportSchema\` is true
- Validate each path in CI with \`MigrationTestHelper\` against the exported schema JSON
- Destructive fallback is acceptable for caches only; land the migration a release before any wipe`,
    followUp: `**Follow-up:** Why is exportSchema=true non-negotiable for production Room?
> Auto-migrations and migration tests both derive from the exported schema history`,
    redFlags: `- fallbackToDestructiveMigration on user-data DBs
- No migration tests`,
  },
  {
    id: 'tech-143',
    type: 'undefined',
    num: 143,
    difficulty: 'M',
    star: true,
    section: 'Engineering',
    title: 'Walk through how you would build Walmart\'s CountryViewer take-home: fetch JSON, render a RecyclerView list, survive rotation, handle errors.',
    tags: [ 'walmart', 'take-home', 'recyclerview', 'architecture', 'interview-prep' ],
    related: [ 'tech-23', 'tech-60', 'tech-157' ],
    keyPoints: `- This is a real Walmart Android assignment (2022): fetch a country list (name, region, code, capital) → render in a RecyclerView in JSON order → robust error/edge-case handling → survive rotation AND background activity destruction. Graded on code quality of what you choose to build, not feature count
- Architecture: ViewModel + StateFlow UiState (Loading/Success/Error), Repository over Retrofit, list in a Fragment or Compose
- Rotation: state in ViewModel; process death via SavedStateHandle or an explicit refetch policy
- Errors: typed UiState.Error with retry; empty state; malformed items tolerated (skip or placeholder — never crash)
`,
    answer: `- Optimize for reviewable quality over feature count — a small, clean, tested slice beats a sprawling one
- Make every state explicit (loading, content, empty, error-with-retry) and prove it survives rotation and process death
- Call out your trade-offs in the README; graders read the reasoning as closely as the code`,
    followUp: `**Follow-up:** The list were 100K items — what changes?
> Paging 3 with a Room-backed boundary callback, DiffUtil recycling, image prefetch windows`,
    redFlags: `- Loads JSON on the main thread or in onCreate without lifecycle handling
- No error or empty states
- State lost on rotation`,
  },
  {
    id: 'tech-144',
    type: 'undefined',
    num: 144,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'What does a sane Android test pyramid look like, and which tools belong at each layer?',
    tags: [ 'walmart', 'testing', 'quality' ],
    related: [ 'tech-25', 'tech-65', 'tech-116', 'tech-61' ],
    keyPoints: `- Unit (JVM: JUnit, Turbine for flows, coroutines runTest): ViewModels, use cases, mappers — fast, in the thousands
- Integration: Room in-memory, MockWebServer, Hilt test components
- UI: Compose testing APIs or Espresso — few, journey-level; screenshot tests (Paparazzi/Roborazzi) for visual regression
- Which test double to use at each boundary is its own question (fakes vs mocks: tech-61)
`,
    answer: `- Push each check down to the cheapest layer that can catch the bug; most should never need a device
- Spend device time only on journeys that cross real framework boundaries
- Treat a slow or flaky suite as a pyramid-shape problem, not a CI-hardware problem`,
    followUp: `**Follow-up:** Why inject dispatchers instead of hard-coding Dispatchers.IO?
> Testability — swap to a StandardTestDispatcher under runTest; also enables per-module threading guarantees`,
    redFlags: `- Inverted pyramid (mostly instrumentation tests)
- Tests ViewModels on an emulator when a JVM test with \`runTest\` would do`,
  },
  {
    id: 'tech-146',
    type: 'undefined',
    num: 146,
    difficulty: 'H',
    star: false,
    section: 'Performance & Security',
    title: 'Cold start is 3s and the target is under 1s — what do you actually do?',
    tags: [ 'walmart', 'performance', 'startup', 'baseline-profiles' ],
    related: [ 'tech-34', 'tech-98', 'tech-114' ],
    keyPoints: `- Measure first: Perfetto/macrobenchmark traces to see startup phases (Application.onCreate, activity inflate, first frame)
- Baseline Profiles: precompile hot paths (first-frame render, critical parsing) — usually the single biggest win
- App Startup library to sequence lazy initializers; move non-critical SDK init off the critical path (async or post-first-frame)
- Cut work: trim the startup DI graph, defer analytics, R8 full mode, no blocking disk/network in onCreate
- Guard: startup benchmarks in CI to prevent regressions
`,
    answer: `- Spend the first day measuring — a phase-by-phase trace tells you which of the three seconds to attack first
- Take the big structural wins first (Baseline Profile, deferred SDK init), then trim the remainder
- Lock the result in with a CI benchmark, or the 3s comes back within a quarter`,
    followUp: `**Follow-up:** The lab benchmark now says 900ms — how do you know real users see it?
> Watch field data: Android Vitals startup metrics and an app-start trace (e.g. Firebase Performance) ending at \`reportFullyDrawn()\`, segmented by device tier. Lab macrobenchmarks guard against regressions; P50/P90 on low-end devices is the real target.`,
    redFlags: `- Random micro-optimizations with no trace evidence
- Ships startup work in Application.onCreate without measuring`,
  },
  {
    id: 'tech-147',
    type: 'undefined',
    num: 147,
    difficulty: 'M',
    star: false,
    section: 'Performance & Security',
    title: 'A screen shows memory growth on every rotation until it ANRs — how do you find and fix the leak?',
    tags: [ 'walmart', 'memory-leak', 'performance', 'lifecycle' ],
    related: [ 'tech-164', 'tech-62', 'tech-114' ],
    keyPoints: `- Reproduce and capture a heap dump; LeakCanary on debug builds auto-dumps and shows the reference chain
- Usual suspects: listeners/callbacks registered on the Activity, non-static inner Handler/AsyncTask, coroutine scope tied to the Activity, static View/Context refs, undisposed Rx subscriptions
- Fix pattern: lifecycle-aware registration (viewLifecycleOwner in fragments), scope work to viewModelScope, static inner classes + WeakReference where a Handler is required
- ANR link: leaked Activity keeps work alive; after fixing the leak, profile remaining jank separately
`,
    answer: `- Prove the leak before fixing it: rotate repeatedly, then read the reference chain from a heap dump
- Fix the owner, not the symptom — tie each registration and coroutine to the lifecycle that should end it
- Re-measure after the fix; remaining ANR time is a separate jank problem`,
    followUp: `**Follow-up:** Fragment listener registered in onViewCreated vs onAttach — which owner?
> viewLifecycleOwner for view-scoped work; onAttach-time registration uses the fragment lifecycle and cleans up in onDestroy`,
    redFlags: `- Fixes symptoms with restart hacks
- Calls \`System.gc()\` or bumps \`largeHeap\` to hide the growth`,
  },
  {
    id: 'tech-148',
    type: 'technical',
    num: 148,
    difficulty: 'E',
    star: false,
    section: 'Networking & Data',
    title: 'How does HTTP caching work on Android, and when do conditional requests (`ETag` / `If-None-Match`) help?',
    tags: [ 'networking', 'http', 'caching', 'okhttp' ],
    related: [ 'tech-18', 'tech-96', 'tech-97' ],
    keyPoints: `- Two mechanisms: **freshness** (\`Cache-Control: max-age=300\`) reuses a stored response with zero network; **revalidation** (\`ETag\`) asks the server whether the stale copy is still valid
- Client sends \`If-None-Match: "<etag>"\`; a \`304 Not Modified\` carries no body — it saves bandwidth, not the round trip
- OkHttp caches transparently once configured: \`OkHttpClient.Builder().cache(Cache(dir, 10L * 1024 * 1024))\` — storing, honoring \`Cache-Control\`, and sending conditional GETs automatically
- Offline reads: \`CacheControl.FORCE_CACHE\` serves the stored copy even when expired; \`FORCE_NETWORK\` skips the cache to refresh
- Strong vs weak validators: \`ETag\` catches same-second edits; \`Last-Modified\`/\`If-Modified-Since\` is the 1-second-granularity fallback
- Only GET/HEAD are cacheable; a response fetched with an \`Authorization\` header is stored only when cache directives explicitly allow it
- \`private\` responses stay client-side only; missing \`Vary\` handling breaks gzipped or content-negotiated payloads
- Auth-heavy product APIs often want \`no-store\` here and a Room cache instead — the HTTP cache is for idempotent reads, not offline-first writes`,
    answer: `- \`Cache-Control\` freshness reuses a stored response without network; \`ETag\`/\`If-None-Match\` revalidation answers \`304\` with no body
- OkHttp does both automatically once you set \`Builder().cache(Cache(dir, size))\`; \`FORCE_CACHE\` covers offline reads
- 304 saves bytes, not round trips — real offline-first data belongs in Room, not just the HTTP cache`,
    followUp: `**Follow-up:** The endpoint sends no \`ETag\` — what else can you use?
> \`Last-Modified\` with \`If-Modified-Since\` is the weaker fallback; \`stale-while-revalidate\` (supported by many CDNs) renders the cached copy and refreshes in the background`,
    redFlags: `- Claims a 304 saves latency — it is still a full round trip; only the body is saved
- Conflates freshness with revalidation, or hand-rolls a response cache when OkHttp's disk cache would do
- Caches authenticated writes and calls that offline-first`,
  },
  {
    id: 'tech-149',
    type: 'technical',
    num: 149,
    difficulty: 'M',
    star: true,
    section: 'Networking & Data',
    title: 'How do you retry failed requests on a flaky mobile network without double-submitting an order?',
    tags: [ 'networking', 'okhttp', 'resilience', 'coroutines' ],
    related: [ 'tech-18', 'tech-20' ],
    keyPoints: `- Classify failures first: transient (\`SocketTimeoutException\`, \`ConnectException\`, 408/429/502/503) is retryable; terminal (400/403/404) is not, and 401 belongs to the token-refresh path, not the retry loop
- Exponential backoff with jitter — 1s, 2s, 4s plus a random offset so the whole fleet does not stampede the recovering server; honor \`Retry-After\` on 429/503
- OkHttp \`retryOnConnectionFailure(true)\` only covers connection-level fallback (route failover, stale pooled connections) — it never retries a 500 response
- Put the policy in exactly one layer; repository-side example:
\`\`\`kotlin
.retryWhen { cause, attempt ->
  if (attempt >= 3 || !cause.isTransient()) return@retryWhen false
  delay((1L shl attempt.toInt()) * 1_000 + Random.nextLong(500))
  true
}
\`\`\`
- Idempotency: GET/PUT/DELETE are idempotent by contract; retrying a POST that creates an order risks a double charge — send a client-generated idempotency-key header the server dedupes
- Keep the loop cancellable (\`viewModelScope\`; stop when the user leaves the screen) and add a retry budget so one broken endpoint cannot flood retries
- Retries that must survive process death are durable work, not in-memory loops: WorkManager with a \`NetworkConstraint\` and \`BackoffCriteria(EXPONENTIAL, 30s)\``,
    answer: `- Retry only transient failures with exponential backoff + jitter, honor \`Retry-After\`, cap attempts — 401 goes to refresh, 4xx stay terminal
- OkHttp connection retry is not HTTP-status retry: keep one policy layer, typically a repository \`retryWhen\`
- Non-idempotent POSTs need an idempotency key; retries that must outlive the process belong in WorkManager`,
    redFlags: `- Retries POSTs without an idempotency key, risking double orders or double charges
- Fixed-interval or unbounded retry storms; two layers (interceptor + repository) both retrying the same call`,
  },
  {
    id: 'tech-150',
    type: 'technical',
    num: 150,
    difficulty: 'H',
    star: false,
    section: 'Networking & Data',
    title: 'The backend keeps evolving its JSON — how do you keep the Android client from crashing on new fields, and roll API changes out safely?',
    tags: [ 'networking', 'serialization', 'retrofit', 'api' ],
    related: [ 'tech-18', 'tech-100', 'tech-142' ],
    keyPoints: `- Assume old APKs live forever: a client shipped six months ago cannot be force-updated, so parsing must be a tolerant reader
- Unknown fields: kotlinx \`Json { ignoreUnknownKeys = true }\`; Gson and Moshi ignore them by default; Jackson needs \`FAIL_ON_UNKNOWN_PROPERTIES\` off or \`@JsonIgnoreProperties(ignoreUnknown = true)\`
- The real crasher is enums and sealed discriminators: a new server value throws \`JsonDataException\`/\`UnknownValueException\` — fix with kotlinx \`coerceInputValues = true\` (default on unknown enum), Moshi 1.13+ fallback enum adapters, or an \`UNKNOWN\` branch in the sealed hierarchy
- Kotlin nullability is the enforcement point: new fields enter as nullable-with-default; tightening later is safe, relaxing a non-null field is a breaking change for clients that trusted it
- Backend rules: additive changes only — renames, type changes, and removals are breaking; dual-write plus a deprecation window, negotiated via \`Accept-Version\` / \`X-Client-Version\` headers
- Ship order: tolerant client first, server flips after; a Crashlytics breadcrumb around deserialization turns a bad contract change into a monitored alert instead of a mystery crash wave
- When a breaking change is unavoidable, version the path (\`/v2\`) and run v1 + v2 side by side until telemetry shows old-client traffic decays below the sunset threshold
- Lock the contract: OpenAPI/proto-generated models plus CI compatibility tests (current schema vs the last N shipped client versions) — hand-written DTOs drift silently`,
    answer: `- Turn on tolerant parsing (\`ignoreUnknownKeys\`) and give enums/sealed discriminators a fallback branch — unknown values must never crash an old client
- Field additions are safe; renames, type changes, removals are breaking: deprecation windows, version headers, tolerant client ships first
- Enforce the contract with generated models and CI schema-compat tests, and alert on deserialization errors like crashes`,
    redFlags: `- Every DTO field non-nullable with no default — one new server enum value crashes old clients
- Believes client and server deploy together, or that \`ignoreUnknownKeys\` alone also covers enum and discriminator breaks`,
  },
  {
    id: 'tech-151',
    type: 'technical',
    num: 151,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'Single-activity vs multi-activity: how would you architect navigation for a large app?',
    tags: [ 'architecture', 'navigation', 'activity', 'compose' ],
    related: [ 'tech-28', 'tech-71', 'tech-6' ],
    keyPoints: `- Google app-architecture default: one thin host \`Activity\` + Navigation Component (Views) or Compose \`NavHost\`; destinations are Fragments/Composables and the back stack is explicit \`NavBackStackEntry\` data
- Deep links declared per destination (\`<deep-link>\` / \`navDeepLink\`) build the parent stack automatically — Up and history behave without launcher activities per screen
- What single-activity buys: one window story (insets, IME, \`OnBackPressedDispatcher\`/predictive back), custom transitions, shared \`ViewModelStoreOwner\` boundaries, no activity relaunch per hop
- What multi-activity still buys: OS-managed memory relief (back-stack activities destroyed under pressure and restored via \`onSaveInstanceState\` for free), true task/\`launchMode\`/\`taskAffinity\`/PiP semantics, hard isolation for system-integrated features (custom tabs, camera, assistant)
- Single-activity risks: the host turns into a god object if nav plumbing is not extracted; every screen shares one crash/process window; the deep-link matrix needs explicit tests
- Multi-module apps wire features through navigation contracts / route strings instead of direct destination-class imports — that is what lets feature modules compile independently (tech-102)
- Legacy external contracts (other apps starting \`PaymentActivity\`) survive a migration: keep those activities as thin adapters that navigate into the graph
- Compose reality: single-activity is near-universal (\`setContent\` + \`NavHost\`); cross-screen results move from \`startActivityForResult\` to shared state or \`rememberLauncherForActivityResult\``,
    answer: `- Default to one thin host \`Activity\` + Navigation/\`NavHost\`: explicit back stack, declarative deep links, unified insets and predictive-back handling
- Multi-activity wins where the OS helps: free memory-pressure restore, task/PiP semantics, hard isolation for camera or custom-tab features
- Keep the host logic-free; cross-module navigation goes through contracts, never direct destination imports`,
    followUp: `**Follow-up:** How do deep links land mid-graph with Up still working?
> The nav graph declares the parent hierarchy; the framework builds the missing back stack entries on the way to the deep destination`,
    redFlags: `- Sprinkles \`startActivity\` calls between feature screens with no graph or back-stack story
- Picks multi-activity "because that is how it started" and cannot name what single-activity gives up`,
  },
  {
    id: 'tech-153',
    type: 'technical',
    num: 153,
    difficulty: 'E',
    star: false,
    section: 'Concurrency',
    title: 'What is the main thread, and why must UI work stay on it?',
    tags: [ 'concurrency', 'main-thread', 'ui', 'basics' ],
    related: [ 'tech-15', 'tech-88', 'tech-9' ],
    keyPoints: `- Every Android app starts one main thread running a \`Looper\` + \`MessageQueue\`: input events, drawing callbacks, and \`Activity\`/\`Fragment\` lifecycle callbacks all execute as messages on it
- The widget toolkit is not thread-safe: \`View\` mutation is allowed only from the thread that created the hierarchy; violating it throws \`CalledFromWrongThreadException\` from \`ViewRootImpl.checkThread()\`
- The single-threaded flip side: lifecycle and \`onClick\` code needs no locking — but anything blocking the thread stalls input and drawing, and ANRs fire at 5s input / 10s broadcast (tech-9)
- Frame budgets are spent here too: vsync/\`Choreographer\` callbacks run on main, so measure/layout/draw must fit in ~16ms at 60Hz (tech-54)
- Pattern: run work off-main (\`withContext(Dispatchers.IO)\`), post results back (\`withContext(Dispatchers.Main)\`); \`viewModelScope\` and \`lifecycleScope\` already default to Main (tech-15)
- Only one main thread per process — background threads never own it; post to it, do not touch its views directly
- Legacy idioms still in codebases: \`runOnUiThread\`, \`Handler(Looper.getMainLooper()).post\`, \`View.post\` (tech-88)
- Debug guard: \`StrictMode\` thread policy in debug builds flags accidental main-thread disk/network before users do`,
    answer: `- The main thread runs a \`Looper\`/\`MessageQueue\` executing input, drawing, and lifecycle callbacks
- \`View\` APIs are not thread-safe — off-thread mutation throws; blocking main past the timeout shows the ANR dialog
- Work belongs on \`Dispatchers.IO\`, results posted back with \`withContext(Dispatchers.Main)\``,
    redFlags: `- Says updating a \`TextView\` from a background thread "usually works fine"
- Cannot connect main-thread blocking to the ANR dialog`,
  },
  {
    id: 'tech-154',
    type: 'technical',
    num: 154,
    difficulty: 'E',
    star: false,
    section: 'Concurrency',
    title: 'What is a coroutine, and how is it different from a thread?',
    tags: [ 'concurrency', 'coroutines', 'basics', 'kotlin' ],
    related: [ 'tech-14', 'tech-16', 'tech-107' ],
    keyPoints: `- A thread is an OS scheduling unit with its own stack (hundreds of KB–MB reserved); blocking one idles the whole thread, and you sustain dozens
- A coroutine is a lightweight, cancellable task that runs *on* threads — thousands fit on a small pool because suspending returns control instead of blocking
- At a suspension point the continuation is stored and the thread is released for other work; resume happens later on whatever thread the dispatcher supplies (the CPS machinery is tech-107)
- \`Dispatchers.Main\`/\`IO\`/\`Default\` choose the backing threads; a coroutine owns none, so a \`suspend\` call never blocks its caller thread
- Structured concurrency: coroutines belong to a \`Job\` in a scope (\`viewModelScope\`) and cancel together with it; a raw \`Thread\` or \`GlobalScope.launch\` is an orphan someone must clean up manually (tech-17, tech-89)
- Failure model differs too: an uncaught exception on a raw thread kills it; in a scope the \`Job\` propagates failure per \`coroutineScope\`/\`supervisorScope\` rules (tech-139)
- RxJava comparison: coroutines replace single-use Observable chains with sequential-looking code plus lifecycle-bound cancellation (tech-78)
- Never block inside a coroutine (\`Thread.sleep\`, sync socket IO) — that puts the thread back; use suspending APIs, and keep \`runBlocking\` for \`main()\` bridges and tests`,
    answer: `- Threads are heavyweight OS resources; coroutines are lightweight tasks multiplexed over a dispatcher pool
- Suspending stores the continuation and releases the thread; the dispatcher decides where it resumes
- Scopes tie coroutines to a \`Job\`, so UI-bound work cancels with its owner instead of leaking`,
    redFlags: `- Says a coroutine "runs on its own thread" — it is scheduled on one
- Launches from \`GlobalScope\` or spawns raw threads in a ViewModel with no cancellation story`,
  },
  {
    id: 'tech-155',
    type: 'technical',
    num: 155,
    difficulty: 'E',
    star: false,
    section: 'Jetpack',
    title: 'What is a ViewModel and how does it survive a configuration change?',
    tags: [ 'jetpack', 'viewmodel', 'lifecycle', 'state', 'walmart' ],
    related: [ 'tech-6', 'tech-95', 'tech-138', 'tech-82', 'tech-120' ],
    keyPoints: `- Holds UI state and in-flight work so rotation does not refetch or reseed everything in \`onCreate\`
- Mechanism: \`ComponentActivity\` keeps a \`ViewModelStore\`; on a configuration change the Activity instance is destroyed, but the store is handed to the new instance — the ViewModel never lived inside the dying object, it lived in the retained store
- Scope equals lifetime: resolve from the right \`ViewModelStoreOwner\` — \`by viewModels()\` (this screen), \`by activityViewModels()\` (shared across fragments), \`by navGraphViewModels()\` (a nested back stack)
- Framework contract: never reference a \`View\` or \`Activity\` — the ViewModel outlives them, so it leaks the destroyed instance and can crash emitting into it after destroy; \`AndroidViewModel\` is the exception only for Application context, otherwise inject app-scoped dependencies
- One-shot UI events (navigate, show a snackbar) leave through a \`Channel\` or \`SharedFlow\` the UI collects — never through a callback the Activity registers on the ViewModel
- \`onCleared()\` fires when the owner truly finishes — cancel \`viewModelScope\` work, close listeners and cursors; that coupling is what makes coroutines leak-safe here (tech-89)
- State restoration pairs: the ViewModel keeps heavy objects across config change; \`SavedStateHandle\` keeps a small Bundle-serializable map across process death (tech-95) — nav args, query text, selection ids belong there; large lists do not (refetch them from DB/cache)
- Factory injection (Hilt \`@HiltViewModel\`) is how you get a repository into it without a Context
- Testability: with injected dependencies and no framework imports, a ViewModel is a plain JVM class — JUnit + Turbine, no device (tech-23)`,
    answer: `- Anything that must outlive a rotation — UI state, in-flight loads — lives in the ViewModel, never the Activity
- Choose the owner on purpose: it decides who shares the instance and when \`onCleared()\` runs
- Treat it as rotation insurance only; pair it with \`SavedStateHandle\` for process death`,
    followUp: `**Follow-up:** A Fragment is replaced and pushed onto the back stack — is its ViewModel cleared?
> No. Its view is destroyed, but the \`FragmentManager\` keeps the fragment's \`ViewModelStore\` while the entry is on the back stack; \`onCleared()\` runs only when the fragment is popped or removed for good. That is why collecting in \`viewLifecycleOwner\`, not the fragment, matters.`,
    redFlags: `- Stores an \`Activity\`, \`View\`, or fragment callback reference inside it
- Resolves a shared ViewModel with \`by viewModels()\` in two fragments and wonders why they don't see the same state`,
  },
  {
    id: 'tech-156',
    type: 'technical',
    num: 156,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'What are `Provides` and `Binds` in Dagger, and when do you use each?',
    tags: [ 'dagger', 'dependency-injection', 'notion' ],
    related: [ 'tech-25', 'tech-168' ],
    keyPoints: `- \`@Provides\` decorates a concrete method inside a \`@Module\` that manually builds and returns the dependency — you write the body
- \`@Binds\` decorates an abstract method with no body: it just tells Dagger which implementation satisfies an interface, and only works when that implementation already has an \`@Inject\` constructor
- \`Provides\` is required for anything you don't own or that needs construction logic — third-party SDK types, \`Retrofit\`/\`OkHttpClient\` builder chains, \`@Singleton\` instances assembled from several other bindings
- \`Binds\` is required to live in an abstract \`@Module\` (or a \`@Module interface\`), since abstract methods can't sit in a concrete class
- \`Binds\` generates less code: Dagger elides an extra factory and just points the interface binding at the existing constructor factory, which also compiles faster
- Mixing both in one module needs Kotlin's \`@Module\` composed of an abstract class/interface for \`Binds\` plus a companion object for \`Provides\`, since a single interface can't hold static provider methods`,
    answer: `- \`@Provides\`: concrete method that manually constructs and returns a dependency — for types you don't own or that need real construction logic
- \`@Binds\`: abstract method that maps an interface to an \`@Inject\`-constructed implementation, with no body
- Prefer \`Binds\` whenever it applies — smaller generated surface and faster compiles; fall back to \`Provides\` for anything requiring actual object-building code`,
    followUp: `**Follow-up:** Why is \`Binds\` preferred over \`Provides\` whenever both would work?
> Less generated code — no redundant factory — and it reads as a direct statement of intent ("this interface is satisfied by this impl"). Dagger's own style guide recommends \`Binds\` whenever the target type already has an \`@Inject\` constructor.`,
    redFlags: `- Uses \`@Provides\` to wire an interface to an impl that already has an \`@Inject\` constructor, unaware \`Binds\` exists for exactly that
- Tries to put logic inside a \`@Binds\` method — it must be abstract with no body; logic belongs in \`@Provides\``,
  },
  {
    id: 'tech-157',
    type: 'technical',
    num: 157,
    difficulty: 'M',
    star: true,
    section: 'Architecture',
    title: 'MVVM vs MVI — what\'s the architectural difference?',
    tags: [ 'architecture', 'mvvm', 'mvi', 'notion', 'walmart', 'state' ],
    related: [ 'tech-151', 'tech-45', 'tech-46', 'tech-102', 'tech-132' ],
    keyPoints: `- MVVM: the View observes several independent streams exposed by the ViewModel — one \`StateFlow\`/\`LiveData\` per piece of state; the screen's overall state is implicit, assembled from N separate emissions
- MVI: the View observes a single immutable \`State\` object per screen; every user action is modeled as an \`Intent\`, run through a pure reducer, producing the next \`State\` — strictly unidirectional
- MVI makes the data flow explicit and enforceable in code (\`Intent -> Reducer -> State -> View\`); MVVM only conventionally encourages one-way binding, nothing stops a ViewModel method from mutating state ad hoc
- Consistency: MVI's single state object updates atomically, so a composable recomposition always sees a coherent snapshot; MVVM's scattered observables can update at different times within one frame (tearing)
- Debuggability: an MVI \`State\` is a plain data class you can log, diff, and replay for a bug report; MVVM state is reconstructed by hand from several sources
- Cost: MVI adds boilerplate — sealed \`Intent\`, sealed \`State\`, a reducer function — and can feel heavy for a simple screen with two fields
- Both are typically built on the same Kotlin/Compose primitives (\`StateFlow\`, \`collectAsStateWithLifecycle\`); MVI is best read as MVVM plus a stricter, consolidated state discipline, not a different stack
- **When MVI earns its complexity** (e.g. a large retail app like Walmart's):
  - State is highly interdependent — feed + cart badge + promo banner must never disagree
  - You need time-travel / replay debuggability from logged states
  - Many teams touch the same screens and need one enforced pattern
- **When MVVM wins**: simple screens, iteration speed matters, reducer boilerplate outweighs the control`,
    answer: `- Default to MVVM with a single \`UiState\` per screen; upgrade to full MVI only when the screen's state is interdependent
- Pay the reducer boilerplate where consistency and replayable state are worth more than velocity
- In interviews, frame MVI as a stricter discipline on the same primitives, not a rival framework`,
    followUp: `**Follow-up:** What is "tearing" and why does MVI avoid it?
> When independent state fields are published as separate emissions, a recomposition can render a frame mixing an updated field with a stale one. A single immutable state object updates in one atomic emission, so every recomposition sees a fully consistent snapshot.

**Follow-up:** How do you migrate a ViewModel-based screen to MVI incrementally?
> Collapse exposed streams into one UiState first (MVVM with single state), then introduce an intent/reducer layer on top — no big-bang rewrite.`,
    redFlags: `- Describes MVI as "MVVM with a different name" and can't name the reducer or the single-state contract
- Proposes mutating the state object in place instead of emitting a new one
- Presents MVI as strictly better and would impose it on a two-field settings screen`,
  },
  {
    id: 'tech-158',
    type: 'technical',
    num: 158,
    difficulty: 'H',
    star: true,
    section: 'Concurrency',
    title: 'What is `SupervisorScope` and how does it differ from structured concurrency\'s default failure propagation?',
    tags: [ 'coroutines', 'concurrency', 'supervisorscope', 'notion' ],
    related: [ 'tech-17' ],
    keyPoints: `- Default structured concurrency uses a regular \`Job\`: any child's unhandled exception cancels its parent, and a cancelled parent cancels every other child — one failure takes the whole subtree down
- \`supervisorScope { ... }\` (or a coroutine with a \`SupervisorJob\`) breaks upward propagation: a child failing does not cancel the supervisor or its siblings, so each direct child fails independently
- Cancellation still flows downward as normal — cancelling the supervisor itself, or its own parent, still cancels every child underneath it; supervision only changes which direction *failures* travel, not which direction *cancellation* travels
- Supervision only breaks propagation for **direct children** of the supervisor job — a failure inside a child's own nested \`coroutineScope\` still cancels that child's subtree normally before it surfaces
- Exceptions aren't swallowed for free: a \`launch\`ed child under a supervisor still needs a \`CoroutineExceptionHandler\` (or the exception crashes the process as usual); an \`async\` child's exception is deferred until \`.await()\` and must be caught there individually
- Textbook use: firing several independent, unrelated calls in parallel — e.g. a dashboard fetching four widgets — where one failing shouldn't take the rest down: \`supervisorScope { launch { fetchA() }; launch { fetchB() } }\`
- \`viewModelScope\`/\`lifecycleScope\` use a regular \`Job\` by default; supervision is opted into per subtree with \`supervisorScope\`, never globally`,
    answer: `- A regular scope propagates a child's failure up to cancel the parent and every sibling; \`supervisorScope\`/\`SupervisorJob\` stops that upward propagation so siblings keep running
- Downward cancellation is unaffected — cancelling the supervisor (or its parent) still cancels its children as usual
- Exceptions still need explicit handling: a \`CoroutineExceptionHandler\` per \`launch\`, or a try/catch around each \`async\` result at \`.await()\``,
    followUp: `**Follow-up:** You \`launch\` a child inside \`supervisorScope\` and it throws, with no \`CoroutineExceptionHandler\` installed anywhere. What happens?
> It still crashes the process as an uncaught exception — supervision only stops the failure from cancelling siblings, it does not catch or swallow it. A handler is still required to handle it gracefully.`,
    redFlags: `- Believes \`supervisorScope\` swallows exceptions automatically, with nothing more to do
- Thinks supervision also blocks downward cancellation from a cancelled parent`,
  },
  {
    id: 'tech-159',
    type: 'technical',
    num: 159,
    difficulty: 'M',
    star: true,
    section: 'Kotlin',
    title: 'Explain covariance in Kotlin generics (`out`/`in`).',
    tags: [ 'kotlin', 'generics', 'variance', 'notion' ],
    related: [  ],
    keyPoints: `- Generics are invariant by default: \`List<Dog>\` is not treated as a \`List<Animal>\` even though \`Dog\` is an \`Animal\`, because the compiler can't assume the container is read-only
- \`out T\` marks a type parameter covariant: \`Producer<Dog>\` becomes assignable to \`Producer<Animal>\` — but the compiler restricts \`T\` to "out" positions only (return types), never as a function parameter, enforced at declaration time
- \`in T\` marks a type parameter contravariant: \`Consumer<Animal>\` becomes assignable to \`Consumer<Dog>\` — \`T\` is restricted to "in" positions only (function parameters), never as a return type
- Built-in examples: \`List<out E>\` is covariant (read-only, so safe), \`MutableList<E>\` stays invariant (needs \`T\` in both \`add(T)\` and \`get(): T\`), \`Comparable<in T>\` is contravariant
- Use-site variance (\`Array<out T>\`, \`Array<in T>\` at a call site) covers cases where the class itself wasn't declared with variance — Kotlin's equivalent of Java's wildcard types
- Mnemonic carried over from Java's PECS: Producer Extends → \`out\`; Consumer Super → \`in\` — if you only read \`T\` out, mark it \`out\`; if you only feed \`T\` in, mark it \`in\``,
    answer: `- \`out T\` = covariant: \`T\` may only appear in output positions, so \`Box<Sub>\` can substitute for \`Box<Super>\`
- \`in T\` = contravariant: \`T\` may only appear in input positions, so \`Box<Super>\` can substitute for \`Box<Sub>\`
- Kotlin checks this at the declaration, not just at use sites like Java wildcards; \`List\` is declared \`out\`, \`Comparable\` is declared \`in\`, and \`MutableList\` has to stay invariant since it both produces and consumes \`T\``,
    followUp: `**Follow-up:** Why can't \`MutableList<T>\` be declared \`out T\`?
> \`add(element: T)\` uses \`T\` as a parameter — an "in" position — which a covariant declaration statically forbids. The compiler rejects it right at the class declaration, not at a call site.`,
    redFlags: `- Mixes up which of \`out\`/\`in\` is which, or treats them as documentation only with no compiler enforcement`,
  },
  {
    id: 'tech-160',
    type: 'technical',
    num: 160,
    difficulty: 'M',
    star: true,
    section: 'Android Core',
    title: 'What is process death, and how do you recover state after it?',
    tags: [ 'process-death', 'lifecycle', 'state', 'notion' ],
    related: [ 'tech-95', 'tech-155' ],
    keyPoints: `- Process death is the OS killing the app's entire process — not just finishing an \`Activity\` — to reclaim memory while the app is backgrounded; the \`Application\`, all static state, singletons, and in-memory caches are gone, not just the current screen
- Driven by \`ActivityManager\`'s low-memory killer using \`oom_adj\`/importance scores: a cached background process with no visible components is the first to go when the foreground app needs memory
- Different from a user swiping the app away from Recents (also kills the process, same recovery story) and different from an app crash (which the user perceives immediately, vs. process death which is silent until they return)
- The system still intends to bring the user back to where they were, so it calls \`onSaveInstanceState(Bundle)\` on the way out and restores that \`Bundle\` into the recreated \`Activity\`/\`Fragment\` — but only small, Parcelable-safe data belongs there (~1MB Binder transaction ceiling)
- Recovery path on Android: \`SavedStateHandle\` in a ViewModel is a Bundle-backed key-value store that survives process death (unlike the rest of the ViewModel, which does not) — re-fetch or re-derive anything heavier from it, don't try to persist it directly
- Anything not cheaply reconstructible (form drafts, large lists, in-flight upload progress) needs its own durable store — a Room table, DataStore, or a WorkManager-persisted job — because \`SavedStateHandle\` is not a general persistence layer
- Test it deliberately: \`adb shell am kill <package>\` (or "Don't keep activities" + background) simulates process death far more reliably than trusting it to happen organically during manual testing`,
    answer: `- Process death is the OS killing the whole backgrounded process under memory pressure, wiping everything in memory including the ViewModel — only \`onSaveInstanceState\`'s small Bundle and disk-backed data survive
- Recover cheap UI state through \`SavedStateHandle\`, which is Bundle-backed and restored into the recreated ViewModel automatically
- Anything heavier belongs in real persistence (Room/DataStore/WorkManager) — reconstruct it on return rather than trying to carry it through the Bundle`,
    followUp: `**Follow-up:** How do you verify a fix for process-death state loss actually works?
> Enable "Don't keep activities" in Developer Options, background the app mid-flow, then return — Android recreates the process on return just like it would after a real background kill, giving a repeatable test for \`SavedStateHandle\` and \`onSaveInstanceState\` coverage.`,
    redFlags: `- Conflates process death with a simple configuration change and expects the ViewModel instance itself to survive
- Tries to stuff large objects (bitmaps, big lists) into \`onSaveInstanceState\`'s \`Bundle\` and hits \`TransactionTooLargeException\``,
  },
  {
    id: 'tech-161',
    type: 'technical',
    num: 161,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'What is R8 and how does it differ from ProGuard?',
    tags: [ 'r8', 'proguard', 'build', 'notion', 'security' ],
    related: [ 'tech-25', 'tech-37', 'tech-111' ],
    keyPoints: `- Both are whole-program optimizers that run three passes over release bytecode: shrinking (remove unreachable code/resources from declared entry points), obfuscation (rename classes/methods/fields to short symbols), optimization (inline, prune dead branches, merge classes)
- ProGuard operates on Java bytecode as a separate, general-purpose tool; R8 is Google's replacement, built directly into Android Gradle Plugin, and it also performs desugaring and dexing in the same pass — one tool instead of ProGuard-then-dx/d8
- R8 does whole-program static analysis across the compile unit rather than ProGuard's more file-local passes, so it finds more dead code and produces smaller, sometimes measurably faster-executing output
- Both consume the same \`proguard-rules.pro\` keep-rule syntax — R8 was designed as a drop-in replacement, so existing rule files mostly just work
- R8 "full mode" (default since AGP 3.6+) goes further than ProGuard-compatible mode: more aggressive optimization, occasionally surfacing rule gaps that ProGuard-compatible mode masked, particularly around reflection (Gson/Retrofit models, \`Class.forName\`)
- Neither tool can see into reflection: anything reached only via \`Class.forName\`, \`@Keep\`-worthy Gson model fields, or Room-generated code needs explicit \`-keep\` rules or \`@Keep\` annotations, or it gets stripped/renamed and breaks at runtime only in release builds
- Every release build emits \`mapping.txt\` — required to \`retrace\` obfuscated stack traces or symbolicate Crashlytics reports; losing that file makes a production-only crash nearly undebuggable`,
    answer: `- On a modern Android build the question is moot: R8 is what runs, and your existing ProGuard rule files carry over
- Budget keep-rule work when moving to full mode or a new AGP — its stricter analysis breaks reflection paths ProGuard tolerated
- Archive \`mapping.txt\` for every release as a build artifact; without it a production crash is unreadable`,
    followUp: `**Follow-up:** A crash only reproduces in the release build, never in debug. Where do you start?
> Assume R8 stripped or renamed something reflection-dependent — check for missing \`-keep\` rules around Gson/Retrofit models first, then retrace the obfuscated stack trace against that build's \`mapping.txt\` to see what symbol actually threw.`,
    redFlags: `- Treats obfuscation as a security control — it only raises the cost of reading decompiled code; API keys and secrets in the APK remain extractable
- "Fixes" a release-only crash with \`-keep class ** { *; }\`, disabling shrinking wholesale instead of finding the missing specific rule`,
  },
  {
    id: 'tech-162',
    type: 'technical',
    num: 162,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'What is a "frozen frame" and how do you diagnose one?',
    tags: [ 'performance', 'jank', 'anr', 'notion' ],
    related: [ 'tech-9' ],
    keyPoints: `- A frozen frame is Android Vitals' term for a single frame that takes longer than 700ms to render — well past ordinary jank (a dropped frame past the ~16ms budget) but short of a full ANR (5s of blocked input)
- It reads to the user as the app momentarily hanging: touch feedback stops, animations stall, then everything catches up at once — common right after a screen transition or a heavy synchronous callback
- Typical causes: a large synchronous main-thread operation triggered by a lifecycle callback (bitmap decode, JSON parse, DB query without \`Dispatchers.IO\`), a blocking \`Binder\` call to another process, or excessive layout/measure work on a deeply nested view tree during a transition
- Diagnosis starts the same as any jank: Android Studio Profiler CPU trace or a Perfetto trace of the affected window, looking for one abnormally long main-thread slice rather than many small ones
- \`FrameMetrics\`/\`JankStats\` (Jetpack) instrument this in production, bucketing frame durations and reporting frozen-frame rate per screen — Play Console's Android Vitals surfaces the same metric aggregated across the install base, which is often the first signal a team actually sees
- Fix pattern mirrors jank fixes but targets the single worst offender: move the blocking call off main, defer non-critical \`onCreate\`/\`onResume\` work past first frame, or break one large synchronous unit of work into smaller chunks that yield back to the Looper`,
    answer: `- Treat frozen frames as their own bug class: one catastrophic stall, not general slowness
- Hunt for the single longest main-thread slice in a trace and move or defer exactly that work
- Watch the Vitals frozen-frame rate per screen so regressions are caught after release`,
    followUp: `**Follow-up:** How is a frozen frame different from an ANR in the system's eyes?
> Both are main-thread stalls measured on a continuum — a frozen frame is a slow single frame (>700ms) that still resolves on its own, while an ANR is the process staying unresponsive to input for 5s (or a broadcast for longer), triggering the OS dialog. Frozen frames are the early-warning signal before a stall escalates into an ANR.`,
    redFlags: `- Conflates a frozen frame with an ANR, or ignores the separate Android Vitals frozen-frame metric
- Jumps straight to a fix without a trace, guessing at the cause`,
  },
  {
    id: 'tech-163',
    type: 'technical',
    num: 163,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'What are Android App Bundles and why use them over APKs?',
    tags: [ 'app-bundle', 'build', 'play-store', 'notion', 'aab', 'apk', 'dynamic-delivery', 'security', 'advanced' ],
    related: [ 'tech-84', 'tech-105', 'tech-161', 'tech-114' ],
    keyPoints: `- An \`.aab\` is a publishing format, not an installable one — it bundles every density, language, and ABI resource variant plus metadata, and is uploaded to Play instead of an APK
- Play's backend uses it to run "dynamic delivery": it generates and signs per-device split APKs (base + density/language/ABI splits) on the fly, so a given install only downloads the resources that device actually needs
- The typical payoff is a meaningfully smaller download than a universal APK (Google cites ~15% on average), since a single-ABI, single-density, single-language device no longer pulls every other variant bundled together — e.g. only \`xxhdpi\` + \`arm64-v8a\` + \`en\` instead of every density, ABI and locale
- Bundles are what unlocks Play Feature Delivery: dynamic feature modules that install on-demand, conditionally, or deferred, rather than being baked into the base install — the same modularization that powers instant experiences
- You can't sideload an \`.aab\` directly; \`bundletool build-apks --bundle=app.aab --output=app.apks\` generates local device-matched split APKs for testing the same delivery Play would produce (add \`--connected-device\`, then \`bundletool install-apks\`, to install exactly what an attached device would get)
- Required for any new app on Play since August 2021 — App Signing by Google Play (Play holds/rotates the signing key) is a prerequisite, since Play needs to sign the splits it generates per device
- Trade-off: debugging split-specific issues (a resource missing on one density/ABI combination but not others) is a class of bug that a universal APK build never surfaces locally`,
    answer: `- Ship AABs — for new Play apps it isn't optional, and users get smaller downloads for free
- Enrol in Play App Signing and keep \`bundletool\` in the release checklist to reproduce what devices receive
- Use the bundle to split rarely used features into on-demand modules once the base install size matters`,
    followUp: `**Follow-up:** When do you still need a universal APK?
> For distribution outside Play — QA sideloads, enterprise MDM, other stores. \`bundletool build-apks --bundle=app.aab --mode=universal\` packs every split into one APK, giving up the per-device size win.`,
    redFlags: `- Describes an AAB as "a bigger APK" rather than an input Play turns into per-device splits
- Tests only a universal debug APK and first discovers split-specific missing-resource bugs from production reports
- Refuses to enrol in Play App Signing because they want to keep sole custody of the key — without it Play cannot sign the splits it generates`,
  },
  {
    id: 'tech-164',
    type: 'technical',
    num: 164,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'What is SSL pinning and how do you implement it?',
    tags: [ 'security', 'ssl-pinning', 'networking', 'notion' ],
    related: [ 'tech-165', 'sd-9', 'tech-20', 'tech-37' ],
    keyPoints: `- Standard TLS already validates that the server's certificate chains to a trusted root — pinning adds a second, app-specific check: the app also verifies the cert (or its public key) matches a value baked into the app itself
- Defeats attacks where a device trusts a rogue CA — a user-installed root cert (proxy tools like Charles/mitmproxy, or a compromised/malicious CA) that would otherwise let a man-in-the-middle present a "valid" chain
- Two pinning strategies: pin the leaf certificate (breaks the moment the cert rotates) or pin the public key (\`SPKI\` hash) of an intermediate/root in the chain — public-key pinning survives cert renewal as long as the same key is reused, and is the generally recommended approach
- OkHttp implementation: \`CertificatePinner.Builder().add("api.example.com", "sha256/AAAA...=").build()\` attached to the \`OkHttpClient\`; network security config XML (\`<pin-set>\` in \`network_security_config.xml\`) offers a manifest-driven, no-code alternative
- Operational risk is real: pin the wrong thing, or the backend rotates certs without a coordinated app update, and every pinned client hard-fails all network calls — mitigated by pinning at least two keys (current + backup/next) and setting an \`expiration\` on the pin set so an old pin doesn't outlive its rotation plan
- Pinning protects the transport layer; it does not replace server-side auth, and it's largely ineffective against an attacker with root on the device itself (they can hook the TLS stack or patch the app) — it's aimed specifically at network-position attackers`,
    answer: `- Pin when a network-position attacker is in your threat model (payments, health, auth) — not by reflex
- Pin public keys with a backup and an expiry, and agree the rotation plan with the backend before shipping
- Don't sell it as device security: it stops a proxy on the network path, not a rooted phone`,
    followUp: `**Follow-up:** What happens to existing installs if the backend rotates its certificate without warning, and the app only has the old pin?
> Every pinned request fails closed — \`SSLPeerUnverifiedException\` — until an app update ships the new pin. That's exactly why teams pin a backup key alongside the current one and stage rotations behind a deprecation window before the old pin expires.`,
    redFlags: `- Pins the leaf certificate with no backup pin and no rotation plan
- Assumes HTTPS alone stops a MITM, even on a device where a user-installed proxy CA is trusted`,
  },
  {
    id: 'tech-165',
    type: 'technical',
    num: 165,
    difficulty: 'M',
    star: false,
    section: 'Networking & Data',
    title: 'What is Protobuf and when would you choose it over JSON?',
    tags: [ 'protobuf', 'serialization', 'networking', 'notion' ],
    related: [ 'tech-18' ],
    keyPoints: `- Protocol Buffers is a binary, schema-first serialization format: you write a \`.proto\` file defining messages and field numbers, and codegen produces typed classes for every target language from the same schema
- Binary + field-number encoding (not field names) makes payloads significantly smaller and faster to parse than JSON — no text tokenizing, no key strings repeated per object
- Schema evolution is built in: fields carry stable numeric tags, so adding a new optional field is forward/backward compatible by design as long as you never reuse or renumber a tag — a much stricter contract than JSON's implicit, easy-to-break shape
- Cost: it isn't human-readable on the wire (needs the \`.proto\` schema to decode for debugging, unlike curl-and-eyeball JSON), and it adds a codegen step to the build for every consumer
- On Android it pairs naturally with gRPC (HTTP/2 streaming, bidirectional streams, strongly typed RPC contracts) rather than plain REST/Retrofit, though Retrofit does have a protobuf converter for REST-style use
- Choose JSON when: the API is public/third-party facing, human debuggability matters, payloads are small, or the team wants zero schema-build tooling — choose Protobuf when: internal service-to-service or app-to-backend traffic is high volume, low-latency, or already gRPC-based, and both ends can commit to schema discipline`,
    answer: `- Protobuf is a binary, schema-first format: a \`.proto\` file generates typed classes, and messages encode by numeric field tag instead of JSON's text keys
- It's smaller and faster to parse, with built-in forward/backward compatibility as long as tag numbers are never reused — at the cost of readability and a required codegen step
- Reach for it on high-volume internal or gRPC traffic; stick with JSON for public APIs and anything that benefits from easy human debugging`,
    followUp: `**Follow-up:** How does Protobuf keep old and new clients compatible when the schema changes?
> Every field is tagged with a permanent numeric id, not matched by name. Adding a new field is safe for old clients (they just ignore the unknown tag) as long as it's optional; the one hard rule is never reuse or repurpose a tag number, since that would corrupt data between schema versions.`,
    redFlags: `- Treats Protobuf as a drop-in JSON replacement and forgets the schema/codegen step every consumer needs
- Reuses or renumbers a field tag while "cleaning up" a \`.proto\` file, silently corrupting old clients`,
  },
  {
    id: 'tech-166',
    type: 'technical',
    num: 166,
    difficulty: 'M',
    star: true,
    section: 'Performance & Security',
    title: 'What is Single Sign-On (SSO) and how would you implement it in an Android app?',
    tags: [ 'sso', 'security', 'auth', 'notion' ],
    related: [ 'tech-164' ],
    keyPoints: `- SSO lets a user authenticate once with an identity provider (IdP) and reuse that session across multiple apps/services, instead of holding separate credentials and login flows per app
- Standard mechanism on Android: OAuth 2.0 Authorization Code flow with PKCE, run through \`AppAuth\`/Custom Tabs rather than a \`WebView\` — Custom Tabs shares the browser's cookie jar, so if the user already has an active IdP session in Chrome, the flow can skip the login screen entirely
- Why not a \`WebView\` for the auth step: it can't share session state with the browser, gives the host app a chance to intercept credentials, and Google explicitly disallows OAuth flows in embedded WebViews for sensitive scopes
- Token handling after login: exchange the authorization code for an access + refresh token pair server-side (or via PKCE without a client secret on-device), store them in \`EncryptedSharedPreferences\`/Android Keystore-backed storage, never in plain \`SharedPreferences\`
- Cross-app SSO on the same device can also go through \`AccountManager\` (shared account + auth-token caching across apps from the same publisher) or a shared backend session cookie via Custom Tabs, depending on whether the apps are first-party or third-party relative to the IdP
- Silent re-auth: a valid refresh token lets the app renew the access token without prompting the user again; when the refresh token itself expires or is revoked, fall back to the interactive flow
- Logout must be symmetric — clearing local tokens without also hitting the IdP's logout/session-revocation endpoint leaves a live session other apps can still ride on`,
    answer: `- Never build your own login UI for a third-party identity provider — hand off to the system browser via AppAuth
- Treat tokens as secrets: encrypted storage, silent refresh, server-side revocation on logout
- Test the "already signed in elsewhere" path; it's the whole point of SSO`,
    followUp: `**Follow-up:** Why is Chrome Custom Tabs specifically important for SSO, beyond just "it's a browser"?
> It shares Chrome's cookie jar and session state with the rest of the device. If the user is already signed into the IdP in their regular browser, Custom Tabs inherits that session and can skip the login prompt — a \`WebView\` starts from a blank, isolated cookie store every time.`,
    redFlags: `- Implements the OAuth login flow inside a \`WebView\` instead of Custom Tabs/AppAuth
- Stores access/refresh tokens in plain \`SharedPreferences\` with no encryption`,
  },
  {
    id: 'tech-167',
    type: 'technical',
    num: 167,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'What is Multidex and when do you need it?',
    tags: [ 'multidex', 'build', 'dex', 'notion' ],
    related: [ 'tech-163' ],
    keyPoints: `- A single classic \`.dex\` file can address at most 65,536 (2^16) methods — the "64K method limit" — because method references inside a dex use a 16-bit index; cross that and the build fails with a \`DexIndexOverflowException\` (or, before D8, \`dx\`)
- Multidex is the mechanism that splits compiled code across multiple \`.dex\` files (\`classes.dex\`, \`classes2.dex\`, ...) instead of one, so the app can exceed 64K total methods
- With \`minSdkVersion\` ≥ 21, the platform (ART) natively supports loading multiple dex files — enabling it is just \`android.defaultConfig.multiDexEnabled = true\` in Gradle, no runtime library needed
- Below API 21 (Dalvik), the runtime only loads the primary dex at startup, so you additionally need the \`androidx.multidex:multidex\` support library and either extend \`MultiDexApplication\` or call \`MultiDex.install(this)\` in \`attachBaseContext\` to patch in the secondary dex files after launch
- Practical trigger point: large apps, heavy multi-module codebases, or pulling in big third-party SDKs (Firebase, Google Play services, AWS) push past 64K quickly even with a modest first-party codebase
- Multidex is a symptom fix, not a size fix — R8/ProGuard shrinking to remove unused code/methods is the real lever on app size and startup, since more dex files also means more classloading and, pre-API-21, a real measurable app-startup cost from the runtime patching step
- Modern App Bundles interact with this too: AGP's dex splitting is automatic for API 21+ targets, so most teams today only think about Multidex explicitly when supporting a \`minSdkVersion\` below 21`,
    answer: `- A single dex file caps out at 65,536 referenceable methods; Multidex splits compiled code across several \`.dex\` files so the app can exceed that
- API 21+ (ART) supports it natively — just \`multiDexEnabled = true\`; below 21 (Dalvik) also needs the multidex support library and \`MultiDex.install()\`/\`MultiDexApplication\`
- Treat it as a symptom of a large method count, not a fix in itself — R8/ProGuard shrinking is what actually reduces size and the pre-API-21 startup cost multidex patching adds`,
    followUp: `**Follow-up:** Why does enabling Multidex sometimes make cold-start noticeably slower on old devices specifically?
> Pre-API-21, the \`MultiDex.install()\` call happens in \`attachBaseContext\`, before anything else in the app runs — it has to read and patch in every secondary dex file synchronously at process start, which is pure added latency Dalvik devices pay that ART devices with native multidex support don't.`,
    redFlags: `- Enables Multidex reflexively without knowing it's a symptom of the 64K method limit, or without trying R8 shrinking first`,
  },
  {
    id: 'tech-168',
    type: 'technical',
    num: 168,
    difficulty: 'H',
    star: true,
    section: 'Architecture',
    title: 'How does Dagger work internally (component graph, codegen)?',
    tags: [ 'dagger', 'dependency-injection', 'internals', 'notion' ],
    related: [ 'tech-25', 'tech-156' ],
    keyPoints: `- Dagger is an annotation processor, not a reflection-based framework: at compile time it reads \`@Module\`, \`@Component\`, \`@Inject\`, \`@Provides\`/\`@Binds\` annotations and generates plain Java/Kotlin source implementing the wiring — there is no runtime graph traversal or reflection cost
- A \`@Component\` interface declares the graph's entry points; Dagger generates a \`DaggerXComponent\` class (a \`Builder\`/\`Factory\` plus a concrete implementation) that is the actual dependency graph, built once at app startup
- For every injectable type, Dagger generates a \`Factory\`/\`Provider\` class implementing \`get()\`, which recursively calls the factories of that type's own dependencies — the "graph" is really a tree of generated \`Factory\` objects wired together as plain constructor calls, not a data structure walked at runtime
- Missing binding or a dependency cycle is a **compile error**, not a runtime crash — the processor statically proves the graph is satisfiable before generating any code, which is Dagger's main selling point over reflection-based DI (Guice) or service locators (Koin)
- Scoping (\`@Singleton\`, custom \`@Scope\` annotations) is implemented as simple \`if (cached == null) cached = create()\` double-checked-ish caching inside the generated \`Provider\`, tied to the lifetime of whichever \`@Component\` instance holds that scope — not magic, just a cache field
- \`@Subcomponent\`s generated as nested classes hold a reference to their parent component for bindings they don't provide themselves, implementing scoped hierarchies (e.g. \`ApplicationComponent\` → \`ActivityComponent\` → \`FragmentComponent\`) as plain object composition
- Hilt sits on top of Dagger: it generates the component hierarchy and standard Android entry-point wiring (\`@AndroidEntryPoint\`, predefined \`@InstallIn\` scopes) that teams used to hand-write themselves, so Hilt's internals are Dagger's internals plus a fixed component tree`,
    answer: `- Explain Dagger as "a compiler that writes the wiring code you would have written by hand"
- When a Dagger build error appears, read it as a graph proof failure — fix the binding, don't suppress
- Treat Hilt as Dagger with a pre-agreed component tree, not a different technology`,
    followUp: `**Follow-up:** How do you get a value that only exists at runtime (the \`Application\`, a config object) into a Dagger graph?
> Declare it as an \`@BindsInstance\` parameter on the component's \`@Component.Factory\` (or \`Builder\`). The instance becomes a graph node without any module or \`@Provides\` method — this is how Hilt exposes the \`Application\` and \`@ApplicationContext\`.`,
    redFlags: `- Thinks Dagger works via runtime reflection like some older DI frameworks
- Works around a missing-binding error by making the dependency nullable or fetching it manually`,
  },
  {
    id: 'tech-169',
    type: 'technical',
    num: 169,
    difficulty: 'M',
    star: false,
    section: 'Concurrency',
    title: 'What is a concurrent HashMap and when would you use one on Android?',
    tags: [ 'concurrency', 'concurrenthashmap', 'thread-safety', 'notion' ],
    related: [ 'tech-158' ],
    keyPoints: `- \`java.util.HashMap\` isn't thread-safe: concurrent structural modification from multiple threads (resize during a put, for instance) can corrupt internal state or even infinite-loop in older JVMs — reads racing writes give undefined results, not just stale data
- \`ConcurrentHashMap\` gives thread-safe reads and writes without requiring the caller to synchronize the whole map: it segments locking internally (bucket/bin-level locking, not one global lock like \`Collections.synchronizedMap\`), so unrelated keys can be written concurrently with real parallelism
- Reads are largely lock-free — \`get()\` doesn't block behind a writer on a different bucket — which is why it outperforms a globally \`synchronized\` map under read-heavy concurrent access
- Iteration is weakly consistent, not fail-fast: iterating while another thread mutates the map never throws \`ConcurrentModificationException\`, but the iteration may or may not reflect a concurrent change — it's a snapshot-ish view, not a guaranteed-current one
- \`putIfAbsent\`, \`computeIfAbsent\`, \`merge\` give atomic compound operations (check-then-act in one call) that a plain \`HashMap\` needs external locking to do safely — this is usually the actual reason to reach for it, not raw throughput
- On Android, real uses are narrower than they sound: an in-memory cache written from multiple coroutine dispatchers/threads (e.g. an image or network response cache keyed by URL), or a registry of active listeners/callbacks mutated from different threads — most app-level state should instead live behind \`StateFlow\`/a repository with a single writer, since reaching for \`ConcurrentHashMap\` everywhere is usually a sign the concurrency model itself needs rethinking
- Kotlin coroutines offer an alternative for the same problem: confine mutable state to a single coroutine (an actor-like pattern) or wrap access in a \`Mutex\`, which is often a cleaner fit than a raw concurrent collection inside coroutine-based code`,
    answer: `- Plain \`HashMap\` isn't thread-safe; \`ConcurrentHashMap\` gives lock-free-ish reads and fine-grained (bucket-level) locked writes instead of one global lock, so it scales far better than \`Collections.synchronizedMap\` under concurrent access
- Its real value is atomic compound operations (\`computeIfAbsent\`, \`merge\`) plus weakly-consistent iteration that never throws \`ConcurrentModificationException\`
- On Android it fits a cache or listener registry touched from multiple threads/dispatchers; for most app state, prefer a single-writer model (\`StateFlow\`, a \`Mutex\`-guarded critical section) over sprinkling concurrent collections through the codebase`,
    followUp: `**Follow-up:** If \`ConcurrentHashMap\` already handles thread safety, why would you still use a \`Mutex\` around a \`HashMap\` in coroutine code?
> \`ConcurrentHashMap\` only makes the *map itself* thread-safe for single operations — it doesn't make a multi-step sequence (read, compute, conditionally write two different keys) atomic. A \`Mutex\` around a plain map protects the whole critical section; for a single compound map operation, \`computeIfAbsent\`/\`merge\` on a \`ConcurrentHashMap\` is usually simpler and cheaper.`,
    redFlags: `- Uses \`ConcurrentHashMap\` just as a reflexive "thread safety" reflex without knowing what it actually locks (bucket-level, not global)
- Relies on \`ConcurrentModificationException\` to detect concurrent edits, which a \`ConcurrentHashMap\` iteration never throws`,
  },
  {
    id: 'tech-170',
    type: 'technical',
    num: 170,
    difficulty: 'M',
    star: false,
    section: 'Kotlin',
    title: 'Why is multiple inheritance not supported in Kotlin/Java, and what is the diamond problem?',
    tags: [ 'kotlin', 'inheritance', 'oop', 'notion' ],
    related: [  ],
    keyPoints: `- The diamond problem: class \`D\` inherits from both \`B\` and \`C\`, which both inherit from \`A\` and both override the same method from \`A\` differently — if \`D\` inherited both implementations directly, the compiler/runtime has no unambiguous rule for which one \`D\` should get
- Kotlin and Java both forbid multiple *class* inheritance for exactly this reason — \`class D : B, C\` isn't legal syntax at all — sidestepping the ambiguity by construction rather than defining a resolution rule for it
- Both languages do allow multiple *interface* inheritance, because until default methods existed, interfaces only declared contracts with no implementation to conflict over
- Java 8+ and Kotlin both now allow default/body implementations in interfaces, which reintroduces a narrower version of the diamond problem — solved by making it a compile error: if a class implements two interfaces with the same default method signature, it *must* override that method itself to disambiguate
- Kotlin's specific resolution syntax for that case is \`super<InterfaceName>.methodName()\` inside the overriding method, letting the class explicitly pick (or combine) which parent implementation to defer to
- Kotlin gets most of the practical value of "multiple inheritance" through composition-friendly features instead: interface delegation (\`class D : C by cImpl\`) forwards an interface's implementation to a held instance without inheriting from a class, avoiding the diamond entirely while still reusing implementation
- Design takeaway: this is why "favor composition over inheritance" is more than a style preference on the JVM — inheritance chains are inherently single-rooted, so shared behavior across unrelated hierarchies has to go through interfaces/delegation, not a second base class`,
    answer: `- The diamond problem: two parents override the same inherited method differently, and a child inheriting both has no unambiguous choice — so Kotlin/Java disallow multiple class inheritance outright
- Multiple interface inheritance is allowed since interfaces historically had no implementation to conflict over; default methods reintroduced a narrower version of the problem, resolved as a forced compile-time override with \`super<InterfaceName>.method()\`
- Kotlin favors composition for the same goal — interface delegation (\`by\`) reuses implementation without inheriting from a second class, sidestepping the diamond entirely`,
    followUp: `**Follow-up:** Show the actual disambiguation syntax Kotlin forces when two interfaces supply conflicting default implementations.
> \`class D : B, C { override fun foo() { super<B>.foo(); /* or super<C>.foo(), or custom logic */ } }\` — Kotlin refuses to compile until \`D\` explicitly overrides \`foo()\` and picks (or merges) an implementation via \`super<InterfaceName>.foo()\`.`,
    redFlags: `- Can't state what the diamond problem actually is, beyond "multiple inheritance is bad"
- Claims Kotlin forbids implementing two interfaces with the same default method, instead of disambiguating with \`super<Type>.method()\``,
  },
  {
    id: 'tech-171',
    type: 'technical',
    num: 171,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'What security measures apply when building for a regulated (e.g. healthcare) domain?',
    tags: [ 'security', 'compliance', 'hipaa', 'notion' ],
    related: [ 'tech-164', 'tech-166' ],
    keyPoints: `- Data classification first: identify what actually counts as regulated data (PHI under HIPAA, PII more broadly) versus ordinary app data — regulated fields need stricter handling end-to-end, not a blanket policy applied uniformly to everything
- Encryption at rest: no regulated field in plain \`SharedPreferences\` or an unencrypted SQLite/Room database — use \`EncryptedSharedPreferences\`/\`EncryptedFile\` (Jetpack Security) or SQLCipher-backed Room, with keys managed through Android Keystore so raw key material never lives in app memory or code
- Encryption in transit: TLS is the floor, not the ceiling — add certificate/public-key pinning for backend traffic carrying regulated data, and disable cleartext traffic entirely via \`network_security_config.xml\` (\`cleartextTrafficPermitted="false"\`)
- Minimize exposure surface: don't log regulated data (even to Logcat in debug builds — it's been the source of real HIPAA violations), strip it from crash reports/analytics payloads, and set \`FLAG_SECURE\` on screens displaying it to block screenshots and the Recents-screen thumbnail
- Session and access control: short session timeouts with re-authentication for sensitive actions, biometric/device-credential gating (\`BiometricPrompt\`) before revealing regulated data on app resume, and server-side authorization checks — client-side gating is UX, never the actual security boundary
- Auditability: regulated frameworks typically require an audit trail of who accessed what and when — that's a backend/API responsibility the client has to support by including proper identity context on every request, not something the app can fake locally
- Device posture: consider root/jailbreak and tamper detection (\`SafetyNet\`/Play Integrity API) to decide whether to degrade functionality on a compromised device, and code obfuscation (R8 full mode) to raise the bar against reverse-engineering the client
- None of this is optional add-on work bolted on at the end — regulated-domain apps typically need a signed-off threat model and a compliance review (legal/security team, not just engineering) before the first regulated field is even stored`,
    answer: `- Classify what's actually regulated, then encrypt it at rest (Keystore-backed \`EncryptedSharedPreferences\`/SQLCipher) and in transit (TLS plus pinning, no cleartext)
- Minimize exposure: no regulated data in logs, crash reports, or analytics; \`FLAG_SECURE\` on screens showing it; short sessions with biometric re-auth as a UX gate, never the real security boundary
- Compliance is broader than the client: audit trails and authorization live server-side, device-tamper checks (Play Integrity) and R8 obfuscation raise the bar, and a formal security/legal review should sign off before regulated data is ever stored`,
    followUp: `**Follow-up:** Why is client-side biometric gating "UX, never the actual security boundary"?
> \`BiometricPrompt\` runs entirely on-device and can be bypassed on a compromised/rooted device or by directly calling the underlying API on a repackaged app — it's a convenience gate for legitimate users, not proof of identity to the server. The server must independently authorize every request regardless of what the client claims happened locally.`,
    redFlags: `- Treats HTTPS alone as "we're compliant" with no mention of at-rest encryption, logging discipline, or \`FLAG_SECURE\`
- Proposes handling compliance entirely in engineering with no mention of a security/legal review or an audit-trail requirement`,
  },
  {
    id: 'tech-172',
    type: 'technical',
    num: 172,
    difficulty: 'M',
    star: false,
    section: 'Engineering',
    title: 'How would you design and publish a reusable library to a Maven repo?',
    tags: [ 'gradle', 'maven', 'library', 'notion' ],
    related: [ 'tech-167' ],
    keyPoints: `- Start with API design, not build config: a public library's surface is a contract other teams compile against — keep it small and stable, mark everything not meant for external use \`internal\`, and treat any public function/class signature change as a breaking change requiring a major version bump
- Module setup: \`com.android.library\` (or \`kotlin("jvm")\` for a pure-Kotlin module) instead of \`com.android.application\`, producing an \`.aar\`/\`.jar\` rather than an installable app
- Publishing config uses the \`maven-publish\` Gradle plugin: declare a \`MavenPublication\` naming \`groupId\`/\`artifactId\`/\`version\`, wire the release build's output (\`components.release\` for an AAR) into it, and point \`repositories { maven { url = ... } }\` at the target — an internal Nexus/Artifactory for a private org library, or Maven Central (via Sonatype OSSRH) for public ones
- Semantic versioning discipline matters more for a library than an app: consumers pin a version and expect \`MAJOR.MINOR.PATCH\` to mean what it says — breaking API changes bump major, additive features bump minor, fixes bump patch
- Public/Central publishing has extra requirements beyond a private repo: GPG-signed artifacts, a published Javadoc/sources jar alongside the binary, and complete POM metadata (license, SCM URL, developer info) — Nexus/Sonatype validation will reject an incomplete POM
- Local iteration loop before ever publishing a real version: \`./gradlew publishToMavenLocal\` publishes to the local \`~/.m2\` cache so a consuming project can depend on it via \`mavenLocal()\` for fast feedback
- CI should gate a publish behind the same checks as any release: full test suite, API-compatibility check (a tool like \`kotlinx-binary-compatibility-validator\` catches accidental breaking changes to the public surface before they ship), and a tagged release triggering the actual \`publish\` task rather than every merge to main`,
    answer: `- Design the public API surface deliberately (minimal, \`internal\` by default) since consumers compile against it directly; use \`com.android.library\`/\`kotlin("jvm")\` to produce an \`.aar\`/\`.jar\`
- Configure \`maven-publish\` with a \`MavenPublication\` wired to the release component, pointed at an internal repo or Maven Central via Sonatype OSSRH for public libraries, following strict semantic versioning
- Iterate locally with \`publishToMavenLocal\`; gate real publishes in CI behind tests plus a binary-compatibility check, triggered from a tagged release rather than every merge`,
    followUp: `**Follow-up:** How do you catch an accidental breaking change to your library's public API before it ships?
> A binary-compatibility validator (e.g. Kotlin's \`binary-compatibility-validator\` plugin) snapshots the public API surface into a checked-in \`.api\` file and fails the build if a change to it isn't explicitly acknowledged — it catches an accidentally-widened visibility modifier or a changed signature that CI's functional tests wouldn't necessarily notice.`,
    redFlags: `- Publishes real versions just to try a change instead of iterating with \`publishToMavenLocal\`
- Ships breaking API changes as patch bumps`,
  },
  {
    id: 'tech-175',
    type: 'technical',
    num: 175,
    difficulty: 'H',
    star: true,
    section: 'Architecture',
    title: 'How would you build a minimal dependency-injection container from scratch? What does Dagger/Hilt automate that you\'d have to do by hand?',
    tags: [ 'di', 'dagger', 'internals', 'notion' ],
    related: [ 'tech-25', 'tech-168' ],
    keyPoints: `- Core data structure: a registry (\`Map<KClass<*>, () -> Any>\`) mapping a requested type to a provider function that knows how to construct it
- Resolution: given a type, look up its provider, recursively resolve *that provider's* constructor parameters the same way — this recursive walk is what Dagger's codegen and a reflection-based container both have to do, one at compile time and one at runtime
- Constructor injection by hand: without codegen or reflection, register providers manually — \`register<UserRepository> { UserRepositoryImpl(get<ApiService>(), get<UserDao>()) }\` — this manual \`get<T>()\` inside a provider is precisely what Hilt's generated Factory classes and Koin's DSL both do for you
- How a hand-rolled container fails: a circular dependency surfaces only as a \`StackOverflowError\` from the recursive resolve, and a missing registration as a runtime \`NoSuchElementException\` — Dagger turns both into build errors and emits the resolution code as plain generated classes (how: tech-168)
- Multibindings (\`@IntoSet\`/\`@IntoMap\`) map to a hand-rolled container needing the registry's value type to itself be a \`MutableList\`/\`MutableMap\` that multiple \`register\` calls append to, keyed by the target type`,
    answer: `- Frame DI as mechanics, not magic: a registry plus recursive resolution is the whole idea
- A hand-rolled container is fine for a small app or a test harness; its errors just arrive late
- Reach for Dagger/Hilt when the graph is big enough that late cycle/missing-binding failures and manual registration hurt`,
    followUp: `**Follow-up:** Why does a hand-rolled reflection-based DI container tend to be slower at app startup than Dagger?
> Reflection-based resolution (Koin's underlying mechanism before its recent compile-time mode) walks the dependency graph and does constructor lookups via reflection at first-use time — this cost is paid at runtime, often during cold start. Dagger's generated \`Factory\` classes are plain constructor calls the JIT/AOT compiler can inline, so the graph-walking cost is paid once, at compile time, not on every app launch.`,
    redFlags: `- Thinks DI frameworks are magic rather than mechanical registry + resolution
- Builds the container as a global mutable map that tests share and never reset`,
  },
  {
    id: 'tech-176',
    type: 'technical',
    num: 176,
    difficulty: 'M',
    star: false,
    section: 'Architecture',
    title: 'How would you implement a minimal Observable/data-binding primitive from scratch — what LiveData and StateFlow are actually doing underneath?',
    tags: [ 'architecture', 'internals', 'observer-pattern', 'notion' ],
    related: [ 'tech-136', 'tech-138' ],
    keyPoints: `- Minimum viable shape: a value holder plus a mutable list of listener callbacks; \`setValue(x)\` stores the value and iterates the listener list invoking each with the new value
- Subscription returns a handle (or the listener reference itself) so a caller can unsubscribe — without this you leak every subscriber for the observable's lifetime, the exact bug LiveData's lifecycle-awareness exists to prevent
- LiveData's actual addition over this minimal version: it wraps the plain observer list with \`LifecycleOwner\` awareness — internally it keeps a \`LifecycleBoundObserver\` wrapper per subscriber that checks \`lifecycle.currentState.isAtLeast(STARTED)\` before dispatching, and auto-removes itself on \`ON_DESTROY\` via a \`LifecycleObserver\` callback, which is why LiveData never needs manual unsubscribe in an Activity/Fragment
- StateFlow's addition: it's a \`SharedFlow\` under the hood with \`replay = 1\` and distinct-until-changed semantics baked in — a "current value" concept a bare Observer pattern doesn't have unless you add it (store \`lastValue\`, immediately invoke a new subscriber with it)
- Thread-safety a real implementation needs that a toy one skips: the listener list itself needs to be a \`CopyOnWriteArrayList\` or synchronized structure, since \`setValue\` iterating it while another thread concurrently subscribes/unsubscribes is a \`ConcurrentModificationException\` waiting to happen`,
    answer: `- Explain reactive holders as "a stored value plus a callback list" — everything else is policy on top
- Name the policies that matter in production: lifecycle gating, main-thread dispatch, equality de-duplication, thread safety
- Use that model to predict behaviour (missed events, duplicate emissions) instead of memorising API rules`,
    followUp: `**Follow-up:** Why does LiveData enforce main-thread-only \`setValue()\`, while \`postValue()\` exists as an escape hatch?
> LiveData dispatches to observers synchronously on whatever thread called \`setValue()\` — since observers are typically UI code, that must be the main thread. \`postValue()\` exists for background threads: it posts the value update to the main thread via a Handler rather than dispatching immediately, and multiple rapid \`postValue()\` calls before the main thread catches up coalesce to just the last value.`,
    redFlags: `- Describes LiveData/StateFlow only by their public API, with no model of what's happening inside \`setValue\`
- Implements the listener list with a plain \`ArrayList\` and hits \`ConcurrentModificationException\` when a listener unsubscribes during dispatch`,
  },
  {
    id: 'tech-177',
    type: 'technical',
    num: 177,
    difficulty: 'M',
    star: false,
    section: 'Performance & Security',
    title: '`SparseArray` vs `HashMap<Integer, V>` — when does the Android-specific collection actually win, and when is it a premature micro-optimization?',
    tags: [ 'performance', 'collections', 'memory', 'notion' ],
    related: [ 'tech-10', 'ds-10' ],
    keyPoints: `- \`HashMap<Integer, V>\` autoboxes every \`int\` key to an \`Integer\` object — each key is a separate heap allocation, plus hash-bucket overhead (array of buckets, linked/tree nodes for collisions)
- \`SparseArray<V>\` stores keys as a raw \`int[]\` array (no boxing) and values as a parallel \`Object[]\` array, kept sorted by key — lookup is binary search, O(log n), not the HashMap's average O(1)
- The actual tradeoff: SparseArray wins on memory (no boxed Integer objects, no bucket/node overhead) but loses on lookup speed at scale — Android's own documentation says the memory win only clearly beats the O(1)-vs-O(log n) tradeoff below roughly a few thousand entries
- Insertion/removal on SparseArray is O(n) (array shift), not O(1) like HashMap's bucket insert — a SparseArray used as a frequently-mutated large collection can be *slower* than a HashMap despite using less memory
- Where it genuinely wins: small-to-medium collections keyed by primitive \`int\` that live for a while (e.g. a \`ViewHolder\` type-to-count map, tracking sparse indices in a \`RecyclerView\`), especially in memory-constrained contexts where GC pressure from boxed Integers matters more than raw throughput
- \`LongSparseArray\` and \`SparseBooleanArray\`/\`SparseIntArray\` exist for the same reason — avoid boxing \`Long\`/\`Boolean\`/\`Integer\` values too, not just keys`,
    answer: `- \`SparseArray\` trades HashMap's O(1) average lookup for O(log n) binary search, in exchange for avoiding \`Integer\` autoboxing and bucket/node overhead
- It wins on memory for small-to-medium int-keyed collections; it loses on both lookup (log n vs O(1)) and insertion (O(n) array shift vs O(1) bucket insert) at scale
- Right call for a few hundred-to-low-thousands entries under memory pressure; wrong call as a default replacement for HashMap in a hot, large, or insert-heavy path`,
    followUp: `**Follow-up:** Would you reach for SparseArray in a hot path processing tens of thousands of entries per frame?
> No — the O(log n) binary-search lookup and O(n) insertion cost lose to HashMap's O(1) average case at that scale, even accounting for boxing overhead. SparseArray is a small/medium-collection memory optimization, not a general HashMap replacement; using it as a default "because it's Android-native" without measuring is the premature-optimization trap.`,
    redFlags: `- Recommends \`SparseArray\` universally "because it's more efficient" without naming the actual tradeoff (memory vs lookup speed)`,
  },
  {
    id: 'tech-178',
    type: 'technical',
    num: 178,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'Walk through Android\'s memory model: what lives on the stack vs the heap, and how does ART\'s generational GC actually work?',
    tags: [ 'memory', 'gc', 'art', 'internals', 'notion' ],
    related: [ 'tech-10', 'tech-119' ],
    keyPoints: `- Stack: one per thread, holds primitive local variables and object *references* (not the objects themselves) plus the call frame (return address, method parameters) — freed automatically when a method returns, no GC involvement, extremely cheap
- Heap: shared across all threads, holds every object instance (including boxed primitives) — this is what the garbage collector manages, and it's the thing that fills up and triggers GC pauses or OOM
- ART's generational hypothesis: most objects die young (a short-lived lambda, a temporary list) — so ART splits the heap into a young generation (where new allocations land) and an old/tenured generation (objects that survived several young-gen collections)
- Young-gen collection is fast and frequent: since most objects there are already garbage, a copying collector can just find the few survivors and move them, rather than scanning the whole heap
- Old-gen collection is a full concurrent mark-sweep pass — much more expensive, but happens far less often because surviving objects tend to actually stay alive (a \`Singleton\`, an \`Application\`-scoped cache)
- ART (since Android 5.0) replaced Dalvik's JIT-only model with AOT compilation at install time (\`dex2oat\`) plus a JIT for further-optimizing hot paths at runtime — this is orthogonal to the memory model but frequently confused with it: AOT/JIT affects *execution speed*, generational GC affects *memory reclamation*
- Since Android 8.0 (Oreo), Bitmap pixel data moved off the Java heap into native memory — this is why large bitmaps used to cause \`OutOfMemoryError\` even with heap headroom, and why native-heap leaks (not visible in a plain Java heap dump) are a distinct failure mode from tech-10's Java-object leak causes`,
    answer: `- Keep allocation churn off hot paths (draw, bind, scroll) — young-gen GC is cheap, but not free on a 16ms budget
- Treat long-lived caches as old-gen citizens: size them deliberately and clear them on memory pressure
- For bitmap-heavy OOMs, profile native memory as well as the Java heap`,
    followUp: `**Follow-up:** Why can an app OOM even when \`Runtime.getRuntime().freeMemory()\` shows headroom?
> \`freeMemory()\` reports free space within the current Java heap allocation, not the hard per-app heap ceiling (\`getMemoryClass()\`) nor native heap usage. A large native allocation (bitmap pixel data since Oreo, or a native library leak) can exhaust the process's actual memory budget while the Java heap itself still looks fine — this is exactly why bitmap-heavy OOMs need the native heap profiler, not just a Java heap dump.`,
    redFlags: `- Conflates "stack vs heap" with "AOT vs JIT" — they answer different questions (memory location vs execution strategy)
- Allocates objects inside \`onDraw\` or \`onBindViewHolder\` and blames "the GC" for jank
- Diagnoses bitmap OOMs purely from a Java heap dump`,
  },
  {
    id: 'tech-179',
    type: 'technical',
    num: 179,
    difficulty: 'M',
    star: false,
    section: 'Architecture',
    title: 'What is EventBus (pub/sub for Android)? Why has the pattern largely fallen out of favor in modern Kotlin codebases?',
    tags: [ 'architecture', 'eventbus', 'notion' ],
    related: [ 'tech-136', 'tech-17' ],
    keyPoints: `- Core idea: a global singleton bus — components \`register()\` to receive events and \`post(event)\` to broadcast one, completely decoupling the publisher from any knowledge of who's listening (unlike a direct callback/interface reference)
- greenrobot's \`EventBus\` (the library most commonly meant by the name) used reflection or annotation-processed \`@Subscribe\` methods to route posted events to the right handlers by event type, with configurable thread delivery (\`POSTING\`, \`MAIN\`, \`BACKGROUND\`, \`ASYNC\`)
- Why it fell out of favor: the same total decoupling that makes it convenient makes the app's data flow untraceable — "who's listening for this event, and in what order" isn't discoverable from reading the posting site, unlike a typed \`SharedFlow<Event>\` where consumers are visible from the type's usages
- Structured-concurrency conflict: EventBus's global bus has no relationship to Android lifecycles or coroutine scopes — the library needs its own manual \`register()\`/\`unregister()\` lifecycle calls (classic leak source if forgotten), whereas a \`SharedFlow\` collected inside \`lifecycleScope\`/\`viewModelScope\` is automatically cancelled when its scope ends
- The modern replacement isn't "nothing," it's \`SharedFlow\`/\`Channel\` for the same pub/sub need — same decoupling, but type-safe (compile-time-checked event types vs reflection-based dispatch), lifecycle-integrated via structured concurrency, and testable without a real bus singleton
- Legitimate remaining use case: cross-cutting concerns spanning many unrelated modules where wiring an explicit \`SharedFlow\` dependency into every consumer would be more coupling than the decoupled bus — but even then, most codebases prefer an explicit shared repository/use-case over a bus today`,
    answer: `- Don't introduce a global event bus in new code
- For one-off events use a scoped \`SharedFlow\`/\`Channel\`; for state use \`StateFlow\` — both have an owner you can find
- When migrating legacy EventBus code, replace one event type at a time behind a small interface`,
    followUp: `**Follow-up:** What's the specific leak EventBus caused that \`SharedFlow\` collected in \`lifecycleScope\` avoids by construction?
> A \`Fragment\`/\`Activity\` calling \`EventBus.getDefault().register(this)\` in \`onStart()\` but never \`unregister()\` in the matching \`onStop()\` (or crashing before reaching it) keeps that Fragment/Activity referenced by the bus's internal subscriber map for the app's lifetime — a classic static-reference leak. \`lifecycleScope.launch { flow.collect { ... } }\` ties collection to the lifecycle automatically; when the scope is cancelled, the collector — and any reference it held — is released with it, no manual unregister step to forget.`,
    redFlags: `- Recommends EventBus for new code without acknowledging the SharedFlow/Channel alternative
- Registers in \`onStart\` and unregisters in \`onDestroy\` — mismatched callbacks that deliver events to a stopped screen
- Can't articulate why "totally decoupled" data flow is a debugging liability, not purely a feature`,
  },
  {
    id: 'tech-180',
    type: 'technical',
    num: 180,
    difficulty: 'H',
    star: true,
    section: 'Performance & Security',
    title: 'What security risks does `WebView` introduce, and how do you mitigate them — specifically `addJavascriptInterface`?',
    tags: [ 'webview', 'security', 'notion' ],
    related: [ 'tech-164', 'tech-171' ],
    keyPoints: `- \`addJavascriptInterface(obj, name)\` exposes a Kotlin/Java object's \`@JavascriptInterface\`-annotated methods directly to any JavaScript running inside the WebView — if that WebView ever loads untrusted or attacker-influenced content, the attacker's JS can call your native code
- The historical CVE class (pre-API 17, and any un-annotated exposure even after): before \`@JavascriptInterface\` annotation enforcement was added in API 17 (Android 4.2), *every* public method on the bridged object was callable from JS via Java reflection — including things like \`Runtime.exec()\` reachability through reflection gadgets, letting a malicious page achieve arbitrary code execution
- Mitigations beyond the annotation: only load trusted, first-party content in any WebView with a JS bridge attached; validate/whitelist the origin before \`loadUrl()\` if the URL is ever attacker-influenced (deep link, intent extra); never bridge a method that performs a sensitive action (file access, payment, credential read) without additional per-call validation on the native side, since the bridge itself has no origin-checking built in
- \`setJavaScriptEnabled(true)\` is required for the bridge to work at all — if a WebView doesn't need to run JS (e.g. rendering static trusted HTML), leaving it disabled removes this entire attack surface by default
- Mixed content and cleartext traffic: a WebView loading \`https://\` content that pulls a sub-resource over \`http://\` (mixed content) or any WebView allowed to load \`http://\` URLs at all (governed by \`usesCleartextTraffic\` in the network security config) both weaken the origin/integrity guarantees the JS bridge risk analysis assumes
- File-access risk: \`setAllowFileAccess\`/\`setAllowFileAccessFromFileURLs\` defaults have tightened across API levels specifically because a WebView with file-URL access plus a JS bridge could let malicious JS read arbitrary app-private files — disable both unless the WebView specifically needs to render local files`,
    answer: `- \`addJavascriptInterface\` exposes native methods to any JS the WebView runs — dangerous the moment the WebView can load untrusted or attacker-influenced content
- Pre-API-17, ALL public methods were reflectively callable from JS (CVE-class arbitrary code execution); \`@JavascriptInterface\` annotation scoping is mandatory now, but doesn't replace origin validation
- Mitigate with: origin allowlisting before \`loadUrl()\`, disabling JS/file-access unless actually needed, never bridging sensitive native actions without per-call validation on the native side`,
    followUp: `**Follow-up:** Your app loads a WebView pointed at a URL that came from a deep link. What's the actual attack path if you've also called \`addJavascriptInterface\`?
> A malicious app sends a deep link with a URL pointing to an attacker-controlled page instead of your trusted domain. If that URL isn't validated against an allowlist before \`loadUrl()\`, the WebView renders the attacker's page — which now has direct JS access to whatever native methods you bridged via \`addJavascriptInterface\`, turning a URL-spoofing issue into native code execution. The fix is validating the URL's origin before load, not just trusting whatever the deep link contained.`,
    redFlags: `- Uses \`addJavascriptInterface\` without mentioning the \`@JavascriptInterface\` annotation requirement or origin validation
- Keeps \`minSdk\` below 17 support paths with a JS bridge enabled, re-opening the reflection-based exposure
- Enables JS/file access on a WebView "just in case" without scoping it to what the WebView actually needs to render`,
  },
  {
    id: 'tech-181',
    type: 'technical',
    num: 181,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'How does the Builder pattern show up in Android SDK classes, and when would you write your own?',
    tags: [ 'design-patterns', 'creational', 'android-sdk' ],
    related: [ 'tech-182', 'tech-183', 'tech-184' ],
    keyPoints: `- **Android SDK Builders you use daily:** \`AlertDialog.Builder\`, \`NotificationCompat.Builder\`, \`Retrofit.Builder\`, \`RoomDatabase.Builder\`, \`OkHttpClient.Builder\`, \`WorkRequest.Builder\` — all share the same fluent API shape: optional setters return \`this\`, required params go in the constructor or a \`build()\` method
- **Why Android uses it:** construction with many optional configs (priority, channel, timeout, retry policy, interceptors) without telescoping constructors; validation happens in \`build()\` so invalid combos fail fast
- **Writing your own:** use when your class has 4+ optional parameters, or when construction logic is complex (e.g. a \`UserProfile.Builder\` that computes derived fields, validates email format, sets defaults). Kotlin’s \`apply {}\` and default args reduce the need, but Builder still wins for:
  - Immutable result (all fields \`val\`)
  - Validation that depends on multiple fields together
  - Multiple representation targets (e.g. same builder produces JSON, ProtoBuf, and Room entity)
- **Kotlin-specific alternatives:** data class with default args + \`copy()\`, or a DSL with \`apply {}\` — prefer these for simple cases; Builder remains the right tool when the construction process itself has logic
- **Thread-safety note:** the Builder instance itself is NOT thread-safe; confine to one thread or synchronize. The built object can be immutable and thus thread-safe`,
    answer: `- In Kotlin, start with named and default arguments; reach for a Builder only when construction needs validation or staged steps
- Keep the built object immutable and validate everything in \`build()\`
- Recognise SDK Builders as the reason those APIs stay source-compatible as options grow`,
    complexity: `- Time: O(1) construction (design-time pattern)
- Space: O(1) — Builder is a temporary object, discarded after build()`,
    followUp: `**Follow-up:** Why doesn’t \`AlertDialog\` just use a constructor with default arguments instead of a Builder?
> Because \`AlertDialog\` has ~15 optional configuration knobs (title, message, icon, buttons, list items, custom view, cancelable, onDismissListener, etc.). A constructor with 15 default args is unreadable at the call site — \`new AlertDialog(ctx, null, null, "Hi", null, null, true, ...)\` — and you can’t validate combinations (e.g. single-choice list + custom view is invalid). Builder groups related config, validates in \`build()\`, and reads fluently.`,
    redFlags: `- Thinks Builder is "just for Java" — Kotlin codebases still use it for complex construction (Retrofit, Room, OkHttp are Kotlin-first)
- Creates a Builder for a class with 2-3 parameters — just use default args
- Makes Builder methods not return \`this\`, breaking fluent chaining
- Doesn’t validate in \`build()\`, letting invalid object states slip through`,
  },
  {
    id: 'tech-182',
    type: 'technical',
    num: 182,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Where does the Factory pattern appear in Android, and how does `ViewModelProvider.Factory` differ from a simple factory function?',
    tags: [ 'design-patterns', 'creational', 'android-sdk', 'viewmodel' ],
    related: [ 'tech-181', 'tech-183', 'tech-25' ],
    keyPoints: `- **Android SDK factories you interact with:** \`Fragment.instantiate()\` (legacy), \`FragmentFactory\` (since API 28), \`ViewModelProvider.Factory\`, \`RecyclerView.Adapter\` (creates \`ViewHolder\`s), \`ContentProvider\` (creates \`Cursor\`s), \`PagerAdapter\` (creates pages)
- **\`ViewModelProvider.Factory\` vs simple factory function:** a factory function \`() -> ViewModel\` works for parameterless VMs. \`Factory\` exists because ViewModels often need constructor args (\`SavedStateHandle\`, repository, use case) — \`Factory.create(modelClass, extras)\` receives the \`CreationExtras\` (which includes \`SavedStateHandle\`) so Hilt/Koin can inject dependencies *and* the framework can pass framework-provided args
- **The \`CreationExtras\` contract:** since Activity 1.5.0/Fragment 1.5.0, \`ViewModelProvider.Factory.create(Class<T>, CreationExtras)\` is the only method. \`CreationExtras\` is a key-value store containing \`SavedStateHandle\`, \`ViewModelStore\`, \`defaultArgs\` — this is how a single factory interface supports both manual injection and DI frameworks without knowing about each other
- **Abstract Factory in Android:** \`ViewModelProvider.Factory\` is effectively an Abstract Factory — it produces a family of related objects (any \`ViewModel\` subtype) without the caller knowing the concrete classes. Hilt’s generated \`ViewModelFactory\` implements this interface
- **When to write a custom Factory:** you have a ViewModel with non-DI constructor args (e.g. a \`userId\` passed from a previous screen) that can’t come from Hilt. Your factory pulls the DI deps from Hilt *and* adds the runtime arg: \`MyViewModelFactory @Inject constructor(private val repo: UserRepository) : ViewModelProvider.Factory { override fun create(modelClass, extras) = MyViewModel(repo, extras[USER_ID_KEY]!!) }\``,
    answer: `- Use Hilt's \`@HiltViewModel\` by default; write a custom factory only for runtime arguments DI can't know
- When you do, build on \`CreationExtras\` (or assisted injection) so \`SavedStateHandle\` keeps working
- Use \`FragmentFactory\` whenever a Fragment needs constructor dependencies`,
    complexity: `- Time: O(1) factory lookup
- Space: O(1) per ViewModel instance`,
    followUp: `**Follow-up:** Why can’t Hilt just inject the \`userId\` directly into the ViewModel constructor?
> Because \`userId\` is a runtime value from a navigation argument or intent extra — it doesn’t exist at the composition root where Hilt builds the object graph. The Factory pattern lets you split: Hilt provides the long-lived dependencies (repositories, use cases) at graph-creation time, and the Factory adds the short-lived runtime args at ViewModel-creation time.`,
    redFlags: `- Implements \`ViewModelProvider.Factory\` but ignores \`CreationExtras\`, breaking SavedStateHandle and defaultArgs
- Uses a factory function \`() -> MyViewModel\` for a VM that needs \`SavedStateHandle\` — crashes on process death/recreation
- Passes Fragment constructor arguments directly instead of through \`FragmentFactory\` or arguments, crashing on recreation`,
  },
  {
    id: 'tech-183',
    type: 'technical',
    num: 183,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'How does the Decorator pattern appear in Android — `ContextWrapper`, streams, and `RecyclerView.ItemDecoration`?',
    tags: [ 'design-patterns', 'structural', 'android-sdk' ],
    related: [ 'tech-182', 'tech-184', 'tech-185' ],
    keyPoints: `- **\`ContextWrapper\` (the classic Decorator):** wraps a base \`Context\` and delegates all calls to it, allowing you to override specific behaviors (\`getResources()\`, \`getTheme()\`, \`getPackageName()\`) without subclassing \`ContextImpl\`. Used by \`ContextThemeWrapper\` (theming), \`Activity\` (adds window/token), \`Service\`, \`Application\` — every Android component is a decorated Context
- **Java/Kotlin streams:** \`BufferedInputStream\`, \`GZIPInputStream\`, \`CipherInputStream\`, \`DataInputStream\` all wrap an \`InputStream\` and add behavior (buffering, compression, encryption, typed reads) — this is the textbook Decorator pattern, and Android uses it heavily for network/disk I/O
- **\`RecyclerView.ItemDecoration\`:** NOT a classic Decorator (doesn’t wrap the Adapter), but applies the same principle — adds visual offsets, dividers, or drawing *around* items without modifying the Adapter or ViewHolder. Multiple decorations stack: \`rv.addItemDecoration(divider); rv.addItemDecoration(gridSpacing)\` — each draws independently
- **\`TextView\` spans:** \`ForegroundColorSpan\`, \`BackgroundColorSpan\`, \`ClickableSpan\`, \`UnderlineSpan\` decorate a \`Spannable\` with rendering behavior — multiple spans compose on the same text
- **When to use vs inheritance:** Decorator wins when you need to combine behaviors dynamically at runtime (e.g. a stream that’s *both* buffered *and* compressed). Inheritance locks you into a single combination at compile time
- **Android anti-pattern:** wrapping \`Context\` just to access a single system service — prefer \`context.getSystemService()\` directly; \`ContextWrapper\` adds memory overhead and can leak if held too long`,
    answer: `- Reach for a decorator when behaviours must stack independently at runtime
- Prefer composition (wrapping) over a subclass per combination
- Recognise the framework's own decorators so you extend them instead of fighting them`,
    complexity: `- Time: O(1) per decorator layer (delegation is a single call)
- Space: O(n) where n = number of stacked decorators (each holds a reference)`,
    followUp: `**Follow-up:** Why does \`ContextWrapper\` exist if it can leak and adds overhead — why not just subclass \`Context\`?
> Because \`Context\` is an abstract class whose concrete implementation (\`ContextImpl\`) is internal to the framework. You *cannot* subclass \`ContextImpl\` — it’s package-private. \`ContextWrapper\` is the framework’s sanctioned extension point: it delegates to the real ContextImpl while letting you override only what you need. The leak risk is real — never hold a ContextWrapper longer than its wrapped Context’s lifecycle.`,
    redFlags: `- Thinks \`ContextWrapper\` is just for theming — it’s how every Activity/Service/Application gets its Context behavior
- Uses \`ContextWrapper\` to access a single system service — \`context.getSystemService()\` is simpler and leak-free
- Confuses \`ItemDecoration\` with a classic Decorator — it doesn’t wrap the Adapter, it draws *around* items via a callback`,
  },
  {
    id: 'tech-184',
    type: 'technical',
    num: 184,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'What is the Adapter pattern in Android — `ListAdapter`, `CursorAdapter`, `ArrayAdapter`, and `RecyclerView.Adapter`?',
    tags: [ 'design-patterns', 'structural', 'android-sdk', 'recyclerview' ],
    related: [ 'tech-183', 'tech-185', 'tech-8' ],
    keyPoints: `- **\`RecyclerView.Adapter\` IS the Adapter pattern:** it adapts a data source (List, Cursor, Flow, PagingSource) to the \`RecyclerView\`’s ViewHolder protocol (\`onCreateViewHolder\`, \`onBindViewHolder\`, \`getItemCount\`). The RecyclerView doesn’t know about your data model — it only knows \`ViewHolder\` and positions
- **\`ListAdapter\` (and \`AsyncListDiffer\`):** adapts a \`List<T>\` to \`RecyclerView.Adapter\` with built-in diffing via \`DiffUtil.ItemCallback\`. You provide the diffing logic; it handles animations and dispatch. This is an Adapter *around* your List data
- **\`ArrayAdapter\` / \`CursorAdapter\` / \`SimpleCursorAdapter\` (legacy):** adapt \`Array\` or \`Cursor\` to \`ListView\`’s \`Adapter\` interface. \`CursorAdapter\` is a two-way adapter: it maps Cursor columns → View fields (\`bindView\`) AND handles \`Cursor\` lifecycle (\`changeCursor\`, \`swapCursor\`)
- **\`PagerAdapter\` / \`FragmentStateAdapter\`:** adapt a collection of Views/Fragments to a pager — \`PagerAdapter\` for the legacy \`ViewPager\`, \`FragmentStateAdapter\` (itself a \`RecyclerView.Adapter\`) for \`ViewPager2\` — different contracts, not interchangeable
- **Your custom Adapters:** when you write \`class MyAdapter(list: List<Item>) : RecyclerView.Adapter<MyVH>() { ... }\`, YOU are implementing the Adapter pattern — adapting your domain model to the RecyclerView’s rendering contract
- **Object vs Class Adapter:** Android almost exclusively uses *Object Adapter* (composition — your Adapter *has a* data source). Class Adapter (inheritance) would mean \`class MyAdapter extends MyDataSource\` — never done in Android because data sources (List, Cursor, Flow) are final or not meant to be extended
- **Common mistake:** putting business logic (filtering, sorting, network calls) inside the Adapter. Adapter’s job is *presentation mapping only* — data transformation belongs in ViewModel/Repository`,
    answer: `- Default to \`ListAdapter\` for list data; drop to a raw \`RecyclerView.Adapter\` only for non-List sources or custom animation control
- Keep adapters dumb: map data to views, nothing more
- Do filtering, sorting and fetching upstream in the ViewModel or repository`,
    complexity: `- Time: onCreateViewHolder O(1) amortized (ViewHolder pool); onBindViewHolder O(1) per item
- Space: O(v) where v = number of visible ViewHolders (recycled pool)`,
    followUp: `**Follow-up:** \`ListAdapter\` already uses \`DiffUtil\` — why would you ever need a custom \`RecyclerView.Adapter\` instead of just \`ListAdapter\`?
> \`ListAdapter\` assumes a single \`List<T>\` data source. If your data comes from a \`Cursor\`, a \`PagingSource\`, multiple merged lists, or a custom data structure that isn’t a List, \`ListAdapter\` doesn’t fit. Also, \`ListAdapter\` forces you into its diffing model — if you need fine-grained control over animations (e.g. predictive animations for drag-and-drop), a raw \`RecyclerView.Adapter\` with manual \`notifyItemRangeChanged\` gives you that control.`,
    redFlags: `- Puts filtering/sorting/network calls inside \`onBindViewHolder\` — Adapter is a View mapper, not a data processor
- Reimplements diffing by hand with \`notifyItemChanged\` bookkeeping when \`ListAdapter\` would do it
- Uses \`ArrayAdapter\` or \`CursorAdapter\` in new code — they target legacy \`ListView\``,
  },
  {
    id: 'tech-185',
    type: 'technical',
    num: 185,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Where do Singletons actually appear in Android, and why is DI (Hilt/Koin) preferred over rolling your own?',
    tags: [ 'design-patterns', 'creational', 'android-sdk', 'di' ],
    related: [ 'tech-184', 'tech-186', 'tech-175', 'tech-99' ],
    keyPoints: `- **Framework Singletons you use daily:** \`Application\` subclass (process-global), \`ProcessLifecycleOwner.get()\`, \`WorkManager.getInstance(context)\`, \`MediaController.getInstance()\`, \`FirebaseAnalytics.getInstance()\`, \`Crashlytics.getInstance()\` — these are *true* Singletons enforced by the framework/process lifecycle
- **Why DI replaces hand-rolled Singletons:** a \`@Singleton\` in Hilt/Koin is scoped to a component (Application, Activity, Fragment) — not truly global. This gives you:
  - Testability: swap implementations in tests via a test module
  - Lifecycle alignment: Activity-scoped singletons die with the Activity
  - No static state leakage across tests
- **When you still see a hand-rolled Singleton:** database instances (\`Room.databaseBuilder().build()\` creates a *new* instance on every call, so apps wrap it in a singleton), \`OkHttpClient\` (expensive to create), \`Retrofit\` instance, \`Gson\` — these are *expensive-to-create* objects that are effectively singletons but should still be provided via DI, not a static \`getInstance()\`
- **Kotlin \`object\` declaration:** compiles to a singleton with lazy thread-safe initialization (via \`INSTANCE\` field + static initializer). Fine for stateless utilities (\`object JsonUtils\`), dangerous for stateful things — tests can’t reset it
- **Android-specific Singleton pitfalls:**
  - A singleton that needs a \`Context\` may hold only the application context (why: tech-99)
  - Process death: a Singleton in memory doesn’t survive process kill; persisted state needs \`DataStore\`/\`SharedPreferences\`/\`Room\`
  - Multi-process apps: a Singleton in one process is NOT shared with other processes (each process has its own heap)
- **The real rule:** if it holds state or has a lifecycle, it belongs in DI. If it’s a stateless utility, \`object\` is fine. Never write \`static getInstance()\` in Android code`,
    answer: `- Stateful or lifecycle-bound → provide it through DI as a scoped binding; stateless utility → a Kotlin \`object\` is fine
- Expensive shared objects (OkHttpClient, Retrofit, the Room DB) are still one-per-process — DI just owns that decision
- Never hand-write a \`static getInstance()\`: it hides the dependency and can't be swapped in tests`,
    complexity: `- Time: O(1) access
- Space: O(1) single instance; but DI scopes add per-component overhead`,
    followUp: `**Follow-up:** What actually goes wrong if two parts of the app each call \`Room.databaseBuilder(...).build()\` for the same file?
> You get two \`RoomDatabase\` instances with separate connection pools and separate invalidation trackers: a write through one does not notify \`Flow\`/\`LiveData\` queries observing the other, so the UI goes stale, and concurrent writers can hit \`SQLITE_BUSY\`. That is why the database is provided once, as a \`@Singleton\` binding in \`SingletonComponent\` — the DI graph, not a static field, guarantees one instance.`,
    redFlags: `- Writes \`class MySingleton { companion object { @Volatile private var INSTANCE: MySingleton? = null; fun getInstance() = INSTANCE ?: synchronized(this) { INSTANCE ?: MySingleton().also { INSTANCE = it } } } }\` in 2024 — just use \`object\` or DI
- Keeps mutable state in a Kotlin \`object\` and then fights flaky tests that leak state into each other
- Expects a singleton to be shared across the app's \`:remote\` processes`,
  },
  {
    id: 'tech-186',
    type: 'technical',
    num: 186,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Single Responsibility Principle in Android — splitting a God ViewModel into Repository, Mapper, Navigator, and UseCase',
    tags: [ 'solid-principles', 'architecture', 'viewmodel' ],
    related: [ 'tech-187', 'tech-188' ],
    keyPoints: `- **The Android SRP violation:** a \`UserProfileViewModel\` that:
  1. Calls \`Retrofit\` to fetch user data (networking)
  2. Maps DTO → domain model (mapping)
  3. Saves to \`Room\` (persistence)
  4. Handles \`Navigation\` to edit screen (navigation)
  5. Shows \`Snackbar\` on error (UI side-effects)
  This class has 5 reasons to change: API changes, schema changes, DB changes, nav graph changes, UX changes
- **Proper split (each has ONE reason to change):**
  - \`UserRepository\` interface + \`UserRepositoryImpl\` — networking + caching + DTO mapping (data source changes)
  - \`UserMapper\` — DTO → domain model conversion (model changes)
  - \`GetUserUseCase\` — orchestrates repo + mapper, applies business rules (business logic changes)
  - \`ProfileNavigator\` interface + impl — navigation actions (nav graph changes)
  - \`UserProfileViewModel\` — holds UI state (\`StateFlow<UserProfileUiState>\`), delegates to UseCase, calls Navigator (UI/state changes)
- **Why this matters in Android:**
  - \`ViewModel\` survives config changes — if it does networking/DB directly, you leak connections or duplicate work on rotation
  - \`Repository\` is testable with a fake; \`ViewModel\` is testable with a fake UseCase
  - Navigation in ViewModel couples it to the NavController — extract a \`Navigator\` interface
- **Granularity guide:** if you can’t name the class without “And” or “Manager”, it’s probably doing too much. “UserRepositoryAndMapper” → split. “NetworkManager” → split into Retrofit service + Repository`,
    answer: `- Count reasons to change: if a ViewModel changes for API, schema, navigation and UX edits, split it
- Split along those axes and leave the ViewModel as the thin state holder that wires them together
- Stop splitting when a class has one reason to change — "Manager" or "And" in a name is the cue to look again`,
    complexity: `- Conceptual overhead: minimal — refactoring to SRP reduces bugs, doesn’t add runtime cost`,
    followUp: `**Follow-up:** Where does the \`UserMapper\` live — in the Repository, the UseCase, or its own module?
> In its own module (or package) — the Mapper is a pure function (DTO → Domain) with no dependencies. It’s used by the Repository (when converting network response) AND by the UseCase (when converting cached DB entity). If it lives inside Repository, the UseCase can’t reuse it without depending on Repository. If it’s separate, both depend on the pure Mapper — clean dependency direction.`,
    redFlags: `- Keeps networking/DB logic in ViewModel “because it’s simpler” — survives rotation but leaks connections and duplicates work
- Calls \`NavController.navigate()\` directly in ViewModel — couples ViewModel to navigation graph, untestable without a real NavController
- Creates a “UserManager” that does everything — the “And” in the name is the smell
- Doesn’t extract a Mapper, so DTO↔Domain conversion is duplicated in Repository and UseCase`,
  },
  {
    id: 'tech-187',
    type: 'technical',
    num: 187,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Open/Closed Principle in Android — sealed hierarchies for RecyclerView, plugin architectures, and feature modules',
    tags: [ 'solid-principles', 'architecture', 'recyclerview' ],
    related: [ 'tech-186', 'tech-188' ],
    keyPoints: `- **The Android OCP violation:** a \`RecyclerView.Adapter\` with a giant \`when (item.viewType) { TYPE_HEADER -> ...; TYPE_USER -> ...; TYPE_AD -> ... }\` in \`onBindViewHolder\`. Adding a 4th item type means:
  1. Modify the \`when\` in \`onBindViewHolder\`
  2. Modify \`getItemViewType\`
  3. Modify \`onCreateViewHolder\`
  4. Risk breaking existing types
- **OCP-compliant fix: sealed class hierarchy + delegate adapters**

\`\`\`kotlin
sealed interface ListItem {
    data class Header(val title: String) : ListItem
    data class User(val profile: UserProfile) : ListItem
    data class Ad(val campaign: AdCampaign) : ListItem
}

class HeaderAdapter : ListItemAdapter<ListItem.Header> { ... }
class UserAdapter : ListItemAdapter<ListItem.User> { ... }
class AdAdapter : ListItemAdapter<ListItem.Ad> { ... }

class CompositeAdapter(private val delegates: List<ListItemAdapter<*>>) : RecyclerView.Adapter<Any>() { ... }
\`\`\`

  Adding a 5th type = new sealed subclass + new delegate adapter. ZERO changes to existing code
- **Plugin architecture / feature modules:** dynamic feature modules (\`dynamicFeatures = [":feature:chat", ":feature:payments"]\`) are OCP at the module level — the base app doesn’t know about the features; features register themselves via a common interface (e.g. \`FeatureModule.initialize(context)\`). Adding a feature = new module, no base app changes
- **Hilt modules as OCP:** a library defines \`@InstallIn(SingletonComponent::class) interface AnalyticsModule { @Binds fun bindTracker(impl: FirebaseTracker): Tracker }\`. App adds a new tracker by adding a new module implementing \`Tracker\` — the library code never changes
- **When NOT to over-apply:** a simple \`when\` with 2-3 cases that never change is fine. OCP has a cost (indirection, more files). Apply where change is *frequent* or *unpredictable*`,
    answer: `- Spend OCP where new variants keep arriving (list item types, features, analytics sinks) — not on a stable two-case \`when\`
- Make the extension point additive: one sealed subtype plus one delegate per variant, existing code untouched
- Module and DI boundaries are the same idea at a larger scale: a new feature or tracker is a new module`,
    complexity: `- Conceptual overhead: more classes/files, but each change is isolated and safe
- Runtime: O(1) delegate lookup via map or when on sealed type`,
    followUp: `**Follow-up:** What’s the runtime cost of the delegate-adapter approach vs a single Adapter with a when()?
> Negligible. \`CompositeAdapter\` typically uses a \`Map<Int, ListItemAdapter<*>>\` keyed by \`viewType\` — \`onBindViewHolder\` does a map lookup (O(1)) and delegates. The \`when\` in a monolithic adapter is also O(1). The difference is compile-time safety: sealed class guarantees exhaustive handling; a \`when\` on an Int viewType can miss a case silently.`,
    redFlags: `- Applies sealed hierarchy + delegates to a 2-item-type list that never changes — YAGNI
- Creates a new interface for every tiny variation instead of using sealed classes
- Thinks OCP means “never modify any class ever” — it means “extend without modifying *the code that changes frequently*”
- Treats SOLID as a checklist to apply uniformly rather than a set of tensions to balance (e.g. over-applying ISP fragments a simple callback into five interfaces for no real benefit)`,
  },
  {
    id: 'tech-188',
    type: 'technical',
    num: 188,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Liskov Substitution Principle in Android — Repository test doubles, behavioural contracts like main-safety, and ViewModel fakes',
    tags: [ 'solid-principles', 'architecture', 'testing' ],
    related: [ 'tech-187', 'tech-189', 'tech-61' ],
    keyPoints: `- **LSP in plain terms:** if code works with a \`UserRepository\` interface, it must work identically with \`FakeUserRepository\` (test), \`OfflineUserRepository\` (offline mode), and \`RealUserRepository\` (production). No “but the fake throws on this method”
- **Android LSP violation #1: incomplete test doubles**

\`\`\`kotlin
interface UserRepository { suspend fun getUser(id: String): Result<User>; suspend fun updateProfile(p: Profile): Result<Unit> }
class FakeUserRepository : UserRepository {
    override suspend fun getUser(id: String) = Result.success(User(...))
    override suspend fun updateProfile(p: Profile) = throw NotImplementedError() // VIOLATION
}
\`\`\`

  A test using \`getUser\` passes; a test using \`updateProfile\` crashes. The fake is NOT substitutable
- **Fix:** implement every method with real (in-memory) behaviour, even if simplified — and run the fake through the same contract tests as the real implementation
- **Android LSP violation #2: a broken behavioural contract** — the signatures match, the promise doesn't. \`UserRepository\` promises its \`suspend\` functions are main-safe; an \`OfflineUserRepository\` that does blocking disk IO without \`withContext(Dispatchers.IO)\` compiles fine but ANRs when the ViewModel calls it from \`viewModelScope\` (Main). Same with \`observeUser(): Flow<User>\` documented as "re-emits on every change": an implementation that emits once and completes silently breaks every caller that expects live updates. LSP is about honouring preconditions, postconditions and invariants — not just types (sealed-\`when\` exhaustiveness, by contrast, is a compiler check, not an LSP concern)
- **Android LSP violation #3: ViewModel fakes that don’t honor \`viewModelScope\`** — a fake ViewModel that doesn’t cancel its work when \`onCleared()\` is called breaks the contract that \`viewModelScope\` enforces
- **Composition over inheritance:** the classic \`Bird → Ostrich\` violation. In Android, prefer \`interface Repository\` + implementations over \`abstract class BaseRepository\` — composition (DI) avoids LSP traps entirely`,
    answer: `- Judge substitutability by behaviour, not by whether it compiles — threading, completion and error promises are part of the contract
- Write the contract down once as a shared test suite and run every implementation, fakes included, through it
- Prefer interface + DI composition over deep \`Base*\` class hierarchies; there is less inherited behaviour to break`,
    complexity: `- Conceptual: zero runtime cost — it’s a design-time contract
- Testing: one abstract contract-test class, subclassed once per implementation`,
    followUp: `**Follow-up:** Does a MockK \`mockk<UserRepository>()\` make a test double LSP-compliant for free?
> No. A strict \`mockk<T>()\` throws \`MockKException\` on any call you haven't stubbed with \`every { }\`; only \`mockk<T>(relaxed = true)\` returns defaults (\`0\`, \`false\`, empty, or a nested relaxed mock). Neither encodes the real behavioural contract — a relaxed mock returning an empty user for every id is still not substitutable for the real repository. A hand-written fake, by contrast, stops compiling the moment the interface gains an abstract method, which is a useful forcing function.`,
    redFlags: `- Writes a \`FakeRepository\` that throws \`NotImplementedError\` on half the methods
- Adds a new interface method with a default body and never checks what the fake now silently inherits
- Uses \`abstract class BaseRepository\` with concrete methods — forces subclasses into an inheritance hierarchy that violates LSP when they override incorrectly
- Never runs the fake through the same contract tests as the real implementation — a fake is code that needs tests too`,
  },
  {
    id: 'tech-189',
    type: 'technical',
    num: 189,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Interface Segregation Principle in Android — fat callbacks vs focused lambdas, LifecycleObserver, and callback fragmentation',
    tags: [ 'solid-principles', 'architecture', 'callbacks' ],
    related: [ 'tech-188', 'tech-190' ],
    keyPoints: `- **The Android ISP violation:** a fat callback interface

\`\`\`kotlin
interface ApiCallback<T> {
    fun onSuccess(data: T)
    fun onError(error: Throwable)
    fun onProgress(percent: Int)
    fun onCancelled()
    fun onRetry(attempt: Int)
}
\`\`\`

  Every caller must implement all 5 methods — even if it only cares about \`onSuccess\`. Result: empty stubs, copy-paste boilerplate, “implement interface” generates 5 methods you delete 4 of
- **ISP fix #1: split into focused single-method interfaces (or lambdas)**

\`\`\`kotlin
typealias OnSuccess<T> = (T) -> Unit
typealias OnError = (Throwable) -> Unit
typealias OnProgress = (Int) -> Unit
// Caller passes only what it needs: repo.fetch { onSuccess = { ... }, onError = { ... } }
\`\`\`

  Or nullable lambdas: \`fun fetch(onSuccess: OnSuccess<T>? = null, onError: OnError? = null, onProgress: OnProgress? = null)\`
- **ISP fix #2: \`LifecycleObserver\` and \`DefaultLifecycleObserver\`** — \`LifecycleObserver\` itself is a *marker* interface with no methods (events used to arrive via the now-deprecated \`@OnLifecycleEvent\` annotations). \`DefaultLifecycleObserver\` extends it with six callbacks — \`onCreate\`, \`onStart\`, \`onResume\`, \`onPause\`, \`onStop\`, \`onDestroy\` — each with an empty default body, so you override ONLY the events you care about. (\`LifecycleEventObserver\` is the single-method alternative: one \`onStateChanged(owner, event)\`.) This is ISP in the framework itself
- **ISP fix #3: \`RecyclerView.Adapter\` callbacks** — \`onBindViewHolder\`, \`onCreateViewHolder\`, \`getItemCount\` are separate methods. A \`ListAdapter\` only requires \`onCreateViewHolder\` + \`onBindViewHolder\` + \`DiffCallback\`; \`getItemCount\` is already implemented from the submitted list. You don’t implement what you don’t need
- **When NOT to over-segment:** a callback with 2-3 methods that are *always* used together (e.g. \`onResult(success: Boolean, data: T?)\`) is fine. ISP applies when callers *consistently* ignore subsets of methods`,
    answer: `- Segregate when callers consistently ignore part of an interface; the empty stubs are the signal
- In Kotlin the cheapest fix is lambdas or default method bodies — not a new interface per method
- Keep methods that are always used together in one contract; splitting those is fragmentation`,
    complexity: `- Zero runtime cost — it’s about API surface, not execution
- Lambda allocation: negligible (single object per call site)`,
    followUp: `**Follow-up:** Why does \`DefaultLifecycleObserver\` use six empty default methods instead of six separate one-method interfaces?
> Because a \`LifecycleOwner\` registers *one* observer that receives multiple events over its lifetime. Splitting into six interfaces would mean registering six separate observers — more boilerplate, more registration calls, and the lifecycle events are inherently related (a component that cares about \`ON_START\` usually also cares about \`ON_STOP\`). Empty defaults give you the best of both: single registration, but implement only what you need.`,
    redFlags: `- Creates \`OnSuccessListener\`, \`OnErrorListener\`, \`OnProgressListener\` as separate interfaces but then requires all 3 in the caller anyway — that’s not segregation, that’s fragmentation
- Still writes \`@OnLifecycleEvent\`-annotated methods on a bare \`LifecycleObserver\` (deprecated, reflection/kapt-based) instead of \`DefaultLifecycleObserver\`
- Uses a fat callback “for consistency” even when 80% of callers only use \`onSuccess\`
- Over-segments a simple \`onResult(success, data)\` into two lambdas — adds ceremony for no benefit`,
  },
  {
    id: 'tech-190',
    type: 'technical',
    num: 190,
    difficulty: 'M',
    star: true,
    section: 'Patterns & Principles',
    title: 'Dependency Inversion Principle in Android — Hilt modules, Repository interfaces, and why ViewModels never construct Retrofit/Room',
    tags: [ 'solid-principles', 'architecture', 'di', 'hilt' ],
    related: [ 'tech-185', 'tech-189', 'tech-45' ],
    keyPoints: `- **The Android DIP violation:** a \`UserProfileViewModel\` that does \`private val retrofit = Retrofit.Builder()...build(); private val api = retrofit.create(ApiService::class.java)\` — the ViewModel (high-level policy) depends on Retrofit/OkHttp/Room (low-level details). Changing the network lib means changing the ViewModel
- **DIP fix: depend on abstractions, not concretions**

\`\`\`kotlin
// Abstraction (owned by high-level module — the domain)
interface UserRepository {
    suspend fun getUser(id: String): Result<User>
}

// Low-level implementation (owned by data module)
class UserRepositoryImpl @Inject constructor(
    private val api: ApiService,  // Retrofit detail
    private val dao: UserDao      // Room detail
) : UserRepository { ... }

// High-level module (ViewModel) depends ONLY on the interface
@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val repo: UserRepository  // NOT Retrofit, NOT Room
) : ViewModel() { ... }
\`\`\`

- **Hilt modules wire the inversion:** the \`@Module\` that binds \`UserRepository\` to \`UserRepositoryImpl\` lives in the *data* module (low-level). The \`ViewModel\` (in \`feature\` or \`presentation\` module) has no dependency on the data module — it only sees the interface
- **Why this enables testability:** test module binds \`UserRepository\` to \`FakeUserRepository\`. ViewModel test uses the fake — no network, no DB, deterministic
- **Why this enables swap:** offline mode = bind \`UserRepository\` to \`OfflineUserRepository\`. Different build flavor = bind to \`MockUserRepository\`. ViewModel code unchanged
- **The rule:** \`ViewModel\` constructor params = ONLY interfaces from the domain layer. If you see \`Retrofit\`, \`RoomDatabase\`, \`OkHttpClient\`, \`SharedPreferences\`, \`WorkManager\` in a ViewModel constructor — that’s a DIP violation. Wrap them in a Repository/UseCase interface`,
    answer: `- Review test: read a ViewModel's constructor — any framework or IO type there is a DIP violation
- Let the consumer own the interface and the data layer implement it; the module arrows then follow Clean Architecture's inward rule (tech-45)
- Swapping fakes, offline or flavor-specific implementations without touching the ViewModel is the payoff`,
    complexity: `- Zero runtime cost — DI resolution happens once at component creation
- Compile-time: Hilt validates bindings at build, catches missing bindings early`,
    followUp: `**Follow-up:** Which SOLID principle does Dependency Injection most directly serve?
> Dependency Inversion — DI frameworks (Hilt, Koin) are mechanical tools for wiring abstractions to implementations at the composition root, but the principle itself is about depending on interfaces, which DI just automates. You can honour DIP with hand-written constructors and no framework at all.`,
    redFlags: `- Passes \`Retrofit\`, \`RoomDatabase\`, \`OkHttpClient\`, \`SharedPreferences\` to a ViewModel constructor
- Defines the Repository interface in the data module (backwards — interface belongs to the consumer/domain)
- Uses \`@Inject\` constructor on ViewModel but the provided type is a concrete class, not an interface
- Thinks DIP = “use interfaces” — it’s “high-level modules should not depend on low-level modules; both depend on abstractions”`,
  },
]
);
