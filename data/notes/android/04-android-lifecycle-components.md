# 🔄 Lifecycle, Context & Components

*How Android creates, pauses and kills your UI. Covers Activity/Fragment lifecycle, config changes, process death, Context, Intents and the back stack.*

## 🔁 Activity & Fragment lifecycle
<!-- related: tech-6, tech-67, tech-130, tech-53 -->

```mermaid
flowchart LR
  C["onCreate"] --> S["onStart"] --> R["onResume"]
  R --> P["onPause"] --> St["onStop"] --> D["onDestroy"]
  St -->|"back to app"| Rs["onRestart"] --> S
```

- 📖 [Lifecycle](https://www.geeksforgeeks.org/android/activity-lifecycle-in-android-with-demo-app/): Activity/Fragment lifecycle, configuration changes.
- **Visible**: `onStart`–`onStop`. **Foreground/interactive**: `onResume`–`onPause`.
- Fragments add `onCreateView` / `onDestroyView` — the **view** lifecycle is shorter than the fragment's; observe with `viewLifecycleOwner`.
- [Lifecycle](https://www.geeksforgeeks.org/android/lifecycle-in-android-architecture-components/)-aware = components observe `Lifecycle` (via `LifecycleOwner`) instead of overriding callbacks.

> 🔑 Keep `onPause` fast — the next Activity's `onResume` waits for it.

## 🔃 Config changes & process death
<!-- related: tech-155, tech-95, tech-12 -->

| Event | What dies | What survives |
|---|---|---|
| Rotation / locale / dark mode | Activity + views | `ViewModel`, saved state |
| Process death (low memory in background) | Everything in memory | `SavedStateHandle`, `onSaveInstanceState` bundle, disk |
| User swipes away / back | Activity + ViewModel | Only disk |

- [`ViewModel`](https://www.geeksforgeeks.org/android/viewmodel-in-android-architecture-components/) lives in a `ViewModelStore` retained across config changes — **not** process death.
- `SavedStateHandle` / `rememberSaveable` — small keys (ids, query text), not lists or bitmaps (~1 MB Binder limit).
- Test process death: *Don't keep activities* or `adb shell am kill <pkg>` while backgrounded.

## 🧭 Context
<!-- related: tech-99, tech-119 -->

| | Application Context | Activity Context |
|---|---|---|
| Lifetime | Process | Activity |
| Theme/resources | App theme | Activity theme |
| Can start Activity / show dialog | No dialogs; Activity needs `NEW_TASK` | Yes |
| Safe to hold long-term | Yes | No — leak risk |

- Singletons, repositories, DB: Application context. Inflating views, dialogs: Activity context.
- `getSystemService()` — obtain system managers (connectivity, notifications, alarms).
- 📖 [Context](https://www.geeksforgeeks.org/android/what-is-context-in/android/): Application vs. Activity, getting system services.

## 📨 Intents, filters, back stack
<!-- related: tech-69, tech-70, tech-71, tech-29, tech-200, tech-199 -->

- 📖 [Intents](https://www.geeksforgeeks.org/android/what-is-intent-in-android/): explicit vs. implicit, intent filters, pending intents.
- **Explicit** Intent — names the component (in-app navigation).
- **Implicit** Intent — declares an action/data; the system resolves via **intent filters** (action + category + data).
- **PendingIntent** — a token letting another app/system (notifications, alarms) fire your Intent with your identity; declare `FLAG_IMMUTABLE` unless mutation is needed.
- **[Task and Back Stack](https://www.geeksforgeeks.org/android/task-and-back-stack-in-android/)** — a task is a stack of Activities.

| [Launch Mode](https://www.geeksforgeeks.org/android/what-is-android-activity-launchmode/) | Behaviour |
|---|---|
| `standard` | New instance every time |
| `singleTop` | Reuse if already on top (`onNewIntent`) |
| `singleTask` | One instance in its task; clears above it |
| `singleInstance` | Alone in its own task |

### 🔗 Deep links vs App Links
- **Deep link**: an intent filter with `ACTION_VIEW`, `BROWSABLE` and a `data` URI (custom scheme or `http(s)`). Any app can claim the same URI, so the user may see a chooser.
- **App Link**: an `https` deep link with `android:autoVerify="true"`; the domain proves ownership through `https://<domain>/.well-known/assetlinks.json` listing the package and signing-cert SHA-256. Verified links open the app directly.
- Android 12+ does not show a chooser for unverified web links — they open in the browser, so a broken `assetlinks.json` silently sends users to the web.
- Navigation: `navDeepLink { uriPattern = "https://example.com/item/{id}" }` on a destination; arguments are parsed from the URI and the back stack is synthesised.
- Validate every deep-link argument: links are untrusted input from outside the app.

### ◀️ Predictive back
- The system shows a preview of where Back goes (home, previous Activity, or an in-app animation) while the user drags — so the app must declare intent **before** the gesture ends.
- `onBackPressed()` / `KEYCODE_BACK` interception is deprecated: register an `OnBackPressedCallback` (enable it only while you actually consume Back) or Compose `BackHandler` / `PredictiveBackHandler` for progress-driven animations.
- Opt in with `android:enableOnBackInvokedCallback="true"` (available since Android 13). Targeting Android 16 (SDK 36) it is on by default: `onBackPressed()` is no longer called and `KEYCODE_BACK` is not dispatched, so unmigrated back logic silently stops running.

### 📱 Edge-to-edge and insets
- Targeting SDK 35, apps are drawn **edge-to-edge** by default: content goes behind the status and navigation bars, and colour APIs for the bars are ignored.
- Call `enableEdgeToEdge()` for consistent behaviour on older versions, then pad content by **insets**: `Scaffold` passes `innerPadding`; otherwise `Modifier.windowInsetsPadding(WindowInsets.safeDrawing)` or `systemBarsPadding()`; Views use `ViewCompat.setOnApplyWindowInsetsListener`.
- Handle the IME (`imePadding()`), display cutouts, and keep backgrounds full-bleed while text and touch targets stay inside the safe area.

## 📦 Other components
<!-- related: tech-33, tech-59, tech-86 -->

- **[BroadcastReceiver](https://www.geeksforgeeks.org/android/broadcast-receiver-in-android-with-example/)** — manifest (limited since O) or runtime-registered; `onReceive` has ~10 s and runs on main.
- **ContentProvider** — structured cross-app data with URI permissions; also used for init hooks.
- 📖 [developer.android.com/guide](https://developer.android.com/guide) — app fundamentals and components.
- **Parcelable** over Serializable for IPC/bundles — no reflection, faster.
- **[Notifications](https://www.geeksforgeeks.org/android/how-to-push-notification-in-android/)** — channels (O+) set importance per category; `POST_NOTIFICATIONS` runtime permission (13+; see [Permissions](https://www.geeksforgeeks.org/android/how-to-enable-notification-runtime-permission-in-android-13/)); heads-up for high importance; group with `setGroup` + summary.
