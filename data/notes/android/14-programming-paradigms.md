# 🧭 Programming paradigms: OOP, functional, reactive

*Three ways to structure code and how modern Android blends them — what each buys you, what it costs, and how Kotlin lets you mix them.*

## 🧱 Object-oriented
<!-- related: tech-187, tech-183, tech-184 -->

- **Encapsulation** hides state behind an interface; **abstraction** exposes only what callers need; **inheritance** reuses behaviour through an is-a hierarchy; **polymorphism** lets one call site work with many implementations.
- **Composition over inheritance** — hold a collaborator and delegate instead of extending. Kotlin makes this cheap with `by` delegation: `class Logger(out: Sink) : Sink by out`.
- Inheritance couples subclass to parent internals (the fragile base class problem); `final`-by-default in Kotlin pushes you toward composition.
- Interfaces + dependency injection give the testability that deep hierarchies cannot.

## 🧮 Functional
<!-- related: tech-78 -->

- **Pure functions** — same input, same output, no side effects → trivially testable and safe to run on any thread.
- **Immutability** — `val`, `data class` + `copy()`, read-only `List`; state changes by producing a new value, which is what makes `StateFlow` diffing and Compose recomposition skipping reliable.
- **First-class functions** — lambdas, function types `(A) -> B`, **higher-order functions** (`map`, `filter`, `fold`), and `inline` to avoid lambda allocation.
- **Sealed types** model "one of N" states; `when` over them is exhaustive, so adding a case is a compile error at every handler.
- Costs: allocation churn if you copy large structures per update; chains of `map/filter` on big collections create intermediates — use `Sequence` for lazy pipelines.

```kotlin
sealed interface UiState {
    data object Loading : UiState
    data class Content(val items: List<Item>) : UiState
    data class Error(val message: String) : UiState
}

fun reduce(state: UiState, event: Event): UiState = when (event) {
    is Event.Loaded -> UiState.Content(event.items)
    is Event.Failed -> UiState.Error(event.message)
}
```

> 🔑 A reducer is a pure function `(State, Event) -> State`; side effects live outside it.

## 🌊 Reactive
<!-- related: tech-78 -->

- Model **streams of values over time** and declare how they transform; consumers react instead of polling.
- Android toolbox: `Flow` / `StateFlow` / `SharedFlow`, Compose's `State`, `LiveData`, and (legacy) RxJava `Observable`/`Flowable`.
- Core concerns: **backpressure** (slow consumer — buffer, conflate, `collectLatest`), **cold vs hot** (a cold `Flow` runs per collector; `StateFlow` is hot and replays the latest), **lifecycle** (`repeatOnLifecycle` so collection stops off-screen) and **error channels** (`catch`, `retry`).
- Operators like `combine`, `flatMapLatest`, `debounce` express "search as you type" in a few lines.

## 📊 Comparison

| | OOP | Functional | Reactive |
|---|---|---|---|
| Organises code around | objects with state + behaviour | functions over immutable data | data streams |
| State | encapsulated, mutable | explicit, immutable | flows through operators |
| Strength | modelling entities, DI, polymorphism | testability, concurrency safety | async events, UI binding |
| Risk | deep hierarchies, hidden mutation | allocation, steep for newcomers | lifecycle leaks, hard debugging |
| In Android | Activities, services, repositories | reducers, `data class`, collection ops | `Flow`, Compose state |

> 💡 Real apps are hybrid: OOP for module boundaries, functional cores for logic, reactive pipes between layers.

## 🔌 How they combine in MVVM/MVI

- Repository (object) exposes a `Flow<List<Item>>` (reactive) from Room.
- ViewModel maps it with pure functions into an immutable `UiState` and holds it in a `StateFlow`.
- UI renders state and emits events; the reducer produces the next state.
- Tests feed events into the reducer and assert state — no emulator needed.

> 📝 Practice: refactor a ViewModel with three mutable `var` fields into a sealed `UiState` and a single `reduce` function.
