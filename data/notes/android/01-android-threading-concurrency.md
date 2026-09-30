# 🧵 Threading & Concurrency on Android

*One UI thread, many workers. Covers processes vs threads, Handler/Looper, locks, deadlock and how the OS schedules work.*

## 🧱 Processes vs threads
<!-- related: tech-153, tech-109 -->

### 📊 Comparison

| | Process | Thread |
|---|---|---|
| Memory | Own address space | Shares the process heap |
| Cost to create | High (forked from Zygote) | Low |
| Communication | IPC — Binder, AIDL, Messenger | Shared memory + synchronization |
| Crash impact | Isolated | Takes the whole process down |
| Android use | `android:process` for isolation (media, sync) | Default for all background work |

- Every app runs in its own Linux process, forked from **Zygote** (preloaded classes → fast start).
- The **main (UI) thread** runs lifecycle callbacks, input, layout and draw.
- 📖 [Threads, Processes & Scheduling](https://www.geeksforgeeks.org/thread-in-operating-system/) — the OS view of threads.
- A second process buys isolation or memory headroom; the cost is IPC and duplicated singletons.

> 🔑 Never block the main thread with disk, network or heavy compute — ~5 s of unanswered input is an ANR.

## 🔁 Handler, Looper, MessageQueue
<!-- related: tech-88, tech-9 -->

### ⚙️ How the main thread loops

```mermaid
flowchart LR
  W["Worker thread"] -->|"handler.post(r)"| Q["MessageQueue"]
  Q --> L["Looper.loop()"]
  L -->|"dispatch"| H["Handler / Runnable"]
  H --> UI["UI update on main"]
```

- **Looper** — one per thread; loops over its **MessageQueue** forever.
- **Handler** — posts `Message`/`Runnable` to a specific Looper, optionally delayed.
- `Dispatchers.Main` is built on a main-thread Handler.
- `HandlerThread` — a worker with its own Looper: a serial background queue.

> 💡 A non-static inner Handler with delayed messages pins the Activity — use a static class + `WeakReference`, or `removeCallbacksAndMessages(null)` in `onDestroy`.

## 🛠️ From AsyncTask to coroutines
<!-- related: tech-78, tech-154 -->

| Tool | Status | Notes |
|---|---|---|
| [`AsyncTask`](https://www.geeksforgeeks.org/android/asynctasks-in-android/) | Deprecated | Leaked Activities, serial by default, lost results on rotation |
| `Thread` | Raw | No pooling, no cancellation story |
| `ThreadPoolExecutor` | Solid | Bounded pools, queues, rejection policies |
| [RxJava](https://www.geeksforgeeks.org/android/rxjava-for-android/) | Legacy-common | Rich operators, steep learning curve |
| [Coroutines](https://www.geeksforgeeks.org/android/kotlin-coroutines-on-android/) + Flow | Preferred | Structured, cancellable, lifecycle-scoped |

### 🏊 A bounded pool

```kotlin
val pool = ThreadPoolExecutor(
  2, 4, 30, TimeUnit.SECONDS,
  ArrayBlockingQueue(64),               // bounded queue = backpressure
  ThreadPoolExecutor.CallerRunsPolicy() // slow the producer when full
)
```

> 🔑 Unbounded queues hide overload until OOM — bound the pool **and** the queue, especially on low-memory devices.

## 🔒 Locks and synchronization
<!-- related: tech-113, tech-169 -->

| Primitive | Guarantees | Use |
|---|---|---|
| **Mutex / lock** | One holder at a time | Protect a critical section |
| **Semaphore** | At most N holders | Cap concurrent downloads/decoders |
| **Monitor** (`synchronized` + `wait/notify`) | Exclusion + condition waiting | Producer/consumer |
| **Atomic*** | Lock-free CAS on one variable | Counters, flags |
| **`@Volatile`** | Visibility, not atomicity | Stop flags, publishing a reference |
| `ConcurrentHashMap` | Thread-safe map, fine-grained locking | Shared caches |

- Coroutine code uses `kotlinx.coroutines.sync.Mutex` / `Semaphore` — they suspend instead of blocking a thread.
- Confinement beats locking: keep mutable state on one thread (`Dispatchers.Default.limitedParallelism(1)`).

## ☠️ Deadlock, livelock, starvation

### 🧩 Definitions
- **Deadlock** — threads wait on each other forever (A holds L1 wants L2; B holds L2 wants L1).
- **Livelock** — threads keep reacting to each other and make no progress (both keep backing off in step).
- **Starvation** — a thread never gets the resource because others always win.

### 🛡️ Avoidance
- **Lock ordering** — acquire locks in one global order.
- **Timeouts** — `tryLock(timeout)` then back off **with jitter** (jitter also breaks livelock).
- Hold locks briefly; never call foreign code (callbacks) while holding one.
- Main thread blocking on a worker that posts back to main — the classic Android deadlock → ANR.

> 📝 Practice: two threads transfer money between two accounts — make it deadlock-free.

## ⏱️ Scheduling fundamentals

- 📖 [Operating Systems](https://www.geeksforgeeks.org/operating-systems/operating-systems/) · [Scheduling fundamentals](https://www.geeksforgeeks.org/operating-systems/preemptive-and-non-preemptive-scheduling/): preemptive vs. cooperative, priority.
- **Preemptive** — the scheduler interrupts threads on a timer tick; Linux/Android threads are preempted.
- **Cooperative** — a task runs until it yields; coroutines are cooperative on top of preemptive threads.
- **Context switch** — save one thread's registers/state, load another's. Initiated by the **OS scheduler**, typically on a **hardware timer interrupt**, a blocking syscall, or a higher-priority thread becoming runnable.
- **Priority** — `Process.setThreadPriority(THREAD_PRIORITY_BACKGROUND)` keeps workers from stealing frames.
- Multi-core means real parallelism — shared mutable state needs synchronization even for "just one field".
