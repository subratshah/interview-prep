QuestionDB.register("system-design", [
  {
    id: "sd-1",
    type: "system-design",
    num: 1,
    difficulty: "M",
    star: true,
    section: "Mobile",
    title:
      "Design a social media feed (like Instagram) — mobile client architecture.",
    answer:
      '**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  UI[LazyColumn / Compose] -->|observes StateFlow| VM[FeedViewModel]\n  VM --> Repo[FeedRepository]\n  Repo --> Room[(Room DB)]\n  Repo --> API[Retrofit API]\n  API --> Server[Backend]\n  Room -->|single source of truth| VM\n  Worker[WorkManager] -->|background sync| Repo\n  Coil[Coil Image Loader] -->|disk + memory cache| UI\n```\n\n**Expected Answer:**\n- Layers: Compose UI → ViewModel (FeedUiState) → Repository → Room DB + Retrofit\n- Pagination via Paging 3. Background sync via WorkManager. Optimistic updates for likes.\n- Image loading via Coil with disk cache. Offline: show cached feed, queue mutations.\n- Single source of truth = Room DB. UI never reads directly from network.\n\n**Follow-up:** How do you handle real-time updates while scrolling?\n> WebSocket or SSE for new-post events. Show "X new posts" banner, prepend on tap.\n\n**Red flags:**\n- No caching strategy\n- No pagination\n- No offline support\n- Network call directly from UI',
    tags: ["mobile", "architecture", "networking", "pagination"],
    related: ["sd-2", "sd-3"],
    assumptions:
      "**Questions to ask the interviewer:**\n- DAU? (assume 100M)\n- Read-heavy or write-heavy? (assume 10:1 read-heavy)\n- Real-time updates needed, or pull-to-refresh acceptable?\n- Offline support required?\n- Personalized feed (following graph) or ranked/global?\n\n**Declared assumptions:**\n- 100M DAU, avg 20 feed views/day → 2B reads/day (~23K QPS)\n- Feed is personalized (following graph)\n- Images avg 500 KB, videos out of scope\n- Mobile-first (Android/iOS), backend already exists",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify requirements, state assumptions, confirm scope\n2. **(5–10 min)** Scale estimate: reads/day, storage per user, image bandwidth\n3. **(10–22 min)** High-level diagram: Compose → ViewModel → Repository → Room + Retrofit\n4. **(22–35 min)** Deep dive: Paging 3 strategy, image caching (Coil), offline queue\n5. **(35–42 min)** Trade-offs: cursor vs offset pagination, SSE vs WebSocket\n6. **(42–45 min)** Extend: how to handle viral/celebrity posts spiking the feed",
    considerations:
      '- **Consistency:** Stale feed is OK — eventual consistency acceptable for social media\n- **Pagination cursor:** Use item-ID cursor, not offset — stable under concurrent inserts\n- **Cache eviction:** Cap Room DB at ~50 posts; evict oldest unseen on insert\n- **Back-pressure:** Exponential backoff on WorkManager sync retries (Doze-mode safe)\n- **Image prefetch:** Preload next 2 pages of thumbnails while user reads current page\n- **Optimistic updates:** Like/unlike updates UI immediately, reverts on API failure\n- **Data freshness:** Show "X new posts" banner — don\'t auto-scroll, preserve reading position',
    tradeoffs:
      '| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Pagination | Cursor-based (Paging 3) | Offset-based | Stable under concurrent inserts; no "missing item" bug |\n| Real-time | SSE push | WebSocket | SSE is simpler for uni-directional new-post events |\n| Offline store | Room DB | DataStore | Room handles complex feed queries; DataStore is K/V only |\n| Background sync | WorkManager | AlarmManager | WorkManager respects Doze mode and battery constraints |\n| Image loading | Coil (coroutines) | Glide | Native coroutines support; smaller APK footprint |',
    alternatives:
      '**Alternative 1: No offline support (simpler)**\n- Pros: No sync logic, no conflict resolution\n- Cons: App useless on flaky network; fails typical interviewer "what if offline?" probe\n\n**Alternative 2: GraphQL instead of REST**\n- Pros: Flexible field selection, single endpoint, avoids over-fetching\n- Cons: Overkill for a feed; extra tooling (Apollo); mobile team complexity\n\n**Alternative 3: WebSocket for real-time instead of SSE**\n- Pros: Bi-directional, single connection for all real-time events\n- Cons: Heavier, harder to load balance; SSE is enough for uni-directional feed updates',
  },
  {
    id: "sd-2",
    type: "system-design",
    num: 2,
    difficulty: "H",
    star: true,
    section: "Mobile",
    title: "Design a chat/messaging app — mobile client.",
    answer:
      "**Architecture to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App\n  participant WS as WebSocket Server\n  participant Room as Room DB\n  App->>WS: connect + auth token\n  WS-->>App: missed messages since last_seen\n  App->>Room: cache messages\n  App->>WS: send message\n  WS-->>App: ack SENT\n  WS-->>App: peer delivers: DELIVERED\n  WS-->>App: peer reads: READ\n  Note over App,Room: States: SENDING to SENT to DELIVERED to READ\n```\n\n**Expected Answer:**\n- WebSocket for real-time messages. Room DB as source of truth.\n- Message states: sending → sent → delivered → read (optimistic UI).\n- Push notifications via FCM when app is backgrounded.\n- Media upload: presigned S3 URL, upload in background, send URL after success.\n- E2E encryption: store keys in Android Keystore.\n\n**Follow-up:** How do you handle message ordering when offline?\n> Assign client-side timestamp + sequence. Server reconciles and re-sequences. Client re-sorts on sync.\n\n**Red flags:**\n- Polling instead of WebSocket\n- No offline message queue\n- Loses messages on process death",
    tags: ["mobile", "real-time", "websocket", "architecture"],
    related: ["sd-1", "sd-3"],
    assumptions:
      "**Questions to ask the interviewer:**\n- 1:1 only, or group chats? Max group size?\n- End-to-end encrypted?\n- Message delivery guarantees: at-most-once vs at-least-once?\n- Read receipts / typing indicators?\n- Offline message storage — how long?\n\n**Declared assumptions:**\n- 1:1 and group chats up to 256 members\n- Server-side encryption (not E2E for simplicity)\n- At-least-once delivery with dedup on client\n- Read receipts + typing indicators required\n- Messages stored 30 days server-side",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify requirements: group size, encryption, delivery guarantees\n2. **(5–10 min)** Scale: messages/day, connection count (DAU × persistent WebSocket)\n3. **(10–22 min)** Architecture: WebSocket connection → message queue → Room DB\n4. **(22–35 min)** Deep dive: delivery receipts, typing indicators, offline queue\n5. **(35–42 min)** Trade-offs: WebSocket vs polling, Room vs in-memory\n6. **(42–45 min)** Edge cases: reconnect flow, message ordering on out-of-order delivery",
    considerations:
      "- **Message ordering:** Use server-assigned sequence IDs per conversation; clients sort locally\n- **Reconnect handling:** On reconnect, pull missed messages since last seen sequence ID\n- **Typing indicators:** Ephemeral — not stored in DB; SSE or WebSocket side-channel\n- **Battery drain:** Persistent WebSocket on mobile — use heartbeats + Doze-aware reconnect\n- **Offline queue:** Store unsent messages in Room; retry on reconnect with idempotency key\n- **Group fan-out:** Server fans out to all members; client receives via single connection",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Transport | WebSocket | HTTP long-polling | WebSocket is truly bi-directional; polling adds latency and battery drain |\n| Message store | Room DB | In-memory only | Room persists across restarts; in-memory lost on app kill |\n| Delivery guarantee | At-least-once + client dedup | Exactly-once | Exactly-once requires 2PC which is complex; client dedup is simpler |\n| Encryption | Server-side | E2E (Signal protocol) | E2E is gold standard but adds key management complexity |",
    alternatives:
      "**Alternative 1: XMPP / Matrix protocol**\n- Pros: Federated, open standard, battle-tested\n- Cons: Heavy protocol overhead; most companies build custom for control\n\n**Alternative 2: HTTP long-polling instead of WebSocket**\n- Pros: Works through all proxies/firewalls, simpler server\n- Cons: Higher latency, more battery drain, more server connections\n\n**Alternative 3: Firebase Realtime DB / Firestore**\n- Pros: Handles real-time sync, offline, reconnect out of the box\n- Cons: Vendor lock-in, cost at scale, less control over message ordering guarantees",
  },
  {
    id: "sd-3",
    type: "system-design",
    num: 3,
    difficulty: "M",
    star: false,
    section: "Mobile",
    title: "Design an image loading library (like Coil or Glide).",
    answer:
      "**Pipeline to draw:**\n\n```mermaid\nflowchart LR\n  Request[Image URL] --> Mem[Memory Cache]\n  Mem -->|hit| Display[ImageView / Composable]\n  Mem -->|miss| Disk[Disk Cache DiskLruCache]\n  Disk -->|hit| Decode[Decode + Transform background thread]\n  Disk -->|miss| Net[Network OkHttp]\n  Net --> Disk\n  Decode --> Mem\n  Decode --> Display\n```\n\n**Expected Answer:**\n- Three-layer cache: memory (LruCache ~15% heap) → disk (DiskLruCache) → network (OkHttp).\n- Pipeline: check memory → check disk → fetch network → decode on background thread → transform → display.\n- Cancel in-flight requests on View/Composable recycle. Placeholder + error states.\n\n**Follow-up:** How do you prevent OOM when loading large images?\n> Subsample with BitmapFactory.Options.inSampleSize calculated from target view size.\n\n**Red flags:**\n- No caching at all\n- Decodes on main thread\n- No request cancellation",
    tags: ["mobile", "performance", "caching", "images"],
    related: ["ds-23", "sd-1", "sd-4", "tech-97"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Supported image formats? (JPEG, PNG, WebP, GIF/animated?)\n- Transformations needed? (crop, resize, rounded corners)\n- Memory constraints? Target device RAM range?\n- Network layer: OkHttp-based or custom?\n- Should it be lifecycle-aware (cancel on Activity destroy)?\n\n**Declared assumptions:**\n- JPEG, PNG, WebP, animated GIF\n- Common transformations: resize, centerCrop, roundedCorners\n- Two cache tiers: memory (LRU) + disk (LRU)\n- OkHttp for networking, Coroutines for async\n- Lifecycle-aware via ViewModel / lifecycle scope",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** API surface: `imageLoader.load(url).into(imageView)`\n2. **(5–15 min)** Cache layers: memory LRU → disk LRU → network\n3. **(15–25 min)** Threading: coroutine dispatcher per load, bitmap pooling\n4. **(25–35 min)** Memory management: OOM handling, Bitmap.recycle, weak refs\n5. **(35–42 min)** Trade-offs: memory vs disk priority, decode formats\n6. **(42–45 min)** Extensions: placeholder, error state, fade animation",
    considerations:
      "- **Bitmap pooling:** Reuse Bitmap objects via BitmapPool to reduce GC pressure\n- **OOM handling:** Catch OutOfMemoryError, evict memory cache, retry with smaller sample size\n- **Lifecycle binding:** Cancel in-flight loads when lifecycle hits DESTROYED\n- **Cache key:** URL + size + transformations hash → unique cache key\n- **Disk cache size:** Default 250 MB; allow configuration; use LRU eviction\n- **Prefetching:** Support `prefetch(url)` API to warm cache ahead of scroll",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Memory eviction | LRU | LFU | LRU simpler; LFU better for repeated access patterns but harder to implement |\n| Disk format | Original bytes | Decoded bitmap | Store original to support different target sizes; decode on demand |\n| Threading | Coroutines | RxJava | Coroutines are idiomatic Kotlin, structured cancellation built-in |\n| HTTP layer | OkHttp | Custom | OkHttp handles connection pooling, TLS, redirects; no reason to rebuild |",
    alternatives:
      "**Alternative 1: Extend OkHttp ResponseBody caching**\n- Pros: Reuses OkHttp's disk cache mechanism\n- Cons: No memory tier, no transformation support, not image-specific\n\n**Alternative 2: Build on Coroutines + Kotlin Flow pipeline**\n- Pros: Reactive, backpressure-aware\n- Cons: Added complexity for a simple load-and-display use case",
  },
  {
    id: "sd-4",
    type: "system-design",
    num: 4,
    difficulty: "M",
    star: true,
    section: "Mobile",
    title: "Design an offline-first notes app.",
    answer:
      "**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  User[User Write] --> Room[(Room DB single source of truth)]\n  Room -->|Flow emission| UI[Compose UI]\n  Room --> Queue[Pending Sync Queue]\n  Queue --> Worker[WorkManager network required]\n  Worker -->|POST or PATCH| API[Backend API]\n  API -->|conflict?| Resolver[Conflict Resolver]\n  Resolver -->|server wins| Room\n  Resolver -->|no conflict| Ack[Mark synced]\n```\n\n**Expected Answer:**\n- Room as single source of truth. All writes go to DB first (optimistic), synced in background via WorkManager with exponential backoff.\n- Conflict resolution: last-write-wins via server timestamp, or CRDTs for collaborative notes.\n- Full-text search via Room FTS5. Sync state per note (synced/pending/error).\n\n**Follow-up:** How do you handle conflicts when two devices edit the same note?\n> Server timestamp comparison, or operational transforms if collaborative.\n\n**Red flags:**\n- Writes directly to server — loses data on network failure\n- No offline queue\n- No conflict strategy",
    tags: ["mobile", "offline", "sync", "architecture"],
    related: ["sd-1", "sd-2"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Multi-device sync? (assume yes — phone + tablet)\n- Real-time collaboration or single-user?\n- Conflict resolution strategy if edits made offline?\n- Rich text or plain text?\n- Max note size?\n\n**Declared assumptions:**\n- Single-user, multi-device\n- Plain text + markdown formatting\n- Offline-first: all writes go to local DB first, then sync\n- Last-write-wins conflict resolution (with timestamp)\n- Notes up to 1 MB each",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: multi-device, collaboration, conflict strategy\n2. **(5–12 min)** Local-first architecture: Room as single source of truth\n3. **(12–22 min)** Sync engine: WorkManager delta sync, dirty flag pattern\n4. **(22–33 min)** Conflict resolution: last-write-wins vs operational transform\n5. **(33–42 min)** Edge cases: delete + edit conflict, partial sync failure\n6. **(42–45 min)** Trade-offs: full sync vs delta sync",
    considerations:
      "- **Dirty flag:** Mark notes `syncPending = true` on local edit; sync clears it\n- **Delta sync:** Send only notes with `updatedAt > lastSyncTimestamp`; reduces bandwidth\n- **Soft deletes:** `deletedAt` timestamp instead of hard delete — needed for sync correctness\n- **Conflict detection:** Server uses vector clocks or `updatedAt` comparison\n- **Sync trigger:** On network change (ConnectivityManager) + periodic WorkManager job\n- **Merge strategy:** Show conflict UI if server version diverged significantly",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Conflict | Last-write-wins | CRDT / OT | LWW is simple; good enough for single-user notes |\n| Sync granularity | Delta (dirty flag) | Full sync | Delta is bandwidth-efficient; full sync is simpler but wasteful |\n| Persistence | Room DB | DataStore | Room supports complex note queries; DataStore is K/V only |\n| Background sync | WorkManager | Foreground service | WorkManager handles battery/Doze; foreground service wastes battery |",
    alternatives:
      "**Alternative 1: CRDTs (Conflict-free Replicated Data Types)**\n- Pros: Automatic merge without conflicts; no server coordination needed\n- Cons: More complex to implement; text CRDTs (Automerge, Yjs) have overhead\n\n**Alternative 2: Event sourcing**\n- Pros: Full audit trail, replay to any state\n- Cons: Storage grows unbounded; complex for a simple notes app\n\n**Alternative 3: Firebase Firestore offline sync**\n- Pros: Offline sync built-in, real-time updates, cross-device\n- Cons: Vendor lock-in, cost at scale, limited query flexibility",
  },
  {
    id: "sd-5",
    type: "system-design",
    num: 5,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title:
      "Design a pagination API for a mobile feed. Offset vs cursor — tradeoffs?",
    answer:
      "**Flow to draw:**\n\n```mermaid\nflowchart LR\n  UI[LazyColumn] --> Pager[Pager]\n  Pager --> Source[PagingSource]\n  Source -->|load page cursor=xyz limit=20| API[Backend API]\n  API --> Source\n  Source -->|LoadResult.Page nextKey=abc| Pager\n  Pager -->|PagingData| UI\n  UI -->|scroll near end| Pager\n```\n\n**Expected Answer:**\n- Offset: `?page=2&limit=20`. Simple but items can shift (new inserts cause duplicates/skips).\n- Cursor: `?after=item_id&limit=20`. Stable pointer — consistent even with real-time inserts. Can't jump to arbitrary page.\n- Mobile preference: cursor for live feeds, offset for static content.\n\n**Follow-up:** How do you implement infinite scroll with Paging 3?\n> `PagingSource.load()` receives `LoadParams` with cursor key, returns `LoadResult.Page` with next/prev keys.\n\n**Red flags:**\n- Always uses offset without knowing the consistency problem\n- No awareness of Paging 3",
    tags: ["api", "pagination", "networking"],
    related: ["sd-1", "sd-6", "tech-22"],
  },
  {
    id: "sd-6",
    type: "system-design",
    num: 6,
    difficulty: "H",
    star: false,
    section: "Infrastructure",
    title: "Design a rate limiter for a mobile API client.",
    answer:
      "**Flow to draw:**\n\n```mermaid\nflowchart LR\n  App[API Call] --> Interceptor[OkHttp Interceptor]\n  Interceptor -->|429 or 503| Parse[Parse Retry-After header]\n  Parse --> Backoff[Exponential Backoff + Jitter]\n  Backoff -->|wait| Retry[Retry Request]\n  Retry --> Interceptor\n  Interceptor -->|200| Response[API Response]\n  Interceptor --> Bucket[Token Bucket per endpoint]\n  Bucket -->|no tokens| Queue[Queue or reject]\n```\n\n**Expected Answer:**\n- Client-side: exponential backoff with jitter on 429/503. Respect `Retry-After` header. Token bucket per endpoint. OkHttp interceptor to queue or reject excess requests.\n- Server-side: token bucket or sliding window counter per user ID.\n\n**Follow-up:** What is exponential backoff with jitter?\n> wait = min(cap, base × 2^attempt) + random(0, wait). Jitter prevents thundering herd when many clients retry simultaneously.\n\n**Red flags:**\n- Retries immediately on failure\n- Ignores Retry-After header\n- No jitter (causes thundering herd)",
    tags: ["api", "networking", "resilience"],
    related: ["sd-5", "sd-7"],
  },
  {
    id: "sd-7",
    type: "system-design",
    num: 7,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title:
      "Design a caching strategy for a mobile app. What layers do you use?",
    answer:
      "**Layers to draw:**\n\n```mermaid\nflowchart LR\n  Request[Data Request] --> Mem[In-Memory LruCache]\n  Mem -->|hit| Return[Return to UI]\n  Mem -->|miss| Disk[Disk / Room DB]\n  Disk -->|hit| Return\n  Disk -->|miss| Net[Network OkHttp]\n  Net --> Disk\n  Disk --> Mem\n  Net -->|stale-while-revalidate| Stale[Serve stale immediately]\n  Stale --> Refresh[Refresh async]\n  Refresh --> Return\n```\n\n**Expected Answer:**\n- In-memory (LruCache — fast, cleared on kill), disk/Room (persistent), network (OkHttp cache).\n- Cache invalidation: TTL, stale-while-revalidate (show stale → refresh async → update UI), event-driven (server push).\n- LRU eviction for bounded memory.\n\n**Follow-up:** What is stale-while-revalidate?\n> Serve cached data immediately for fast UX. Fetch fresh data in background. Update UI when fresh data arrives. No loading spinner.\n\n**Red flags:**\n- No cache invalidation strategy\n- Caches everything forever\n- No eviction policy",
    tags: ["caching", "performance", "storage"],
    related: ["ds-23", "sd-3", "sd-4"],
  },
  {
    id: "sd-8",
    type: "system-design",
    num: 8,
    difficulty: "H",
    star: false,
    section: "Infrastructure",
    title: "Design a local full-text search feature over notes or messages.",
    answer:
      "**Pipeline to draw:**\n\n```mermaid\nflowchart LR\n  Input[Search Query] --> Debounce[Debounce 300ms]\n  Debounce --> FTS[Room FTS5 MATCH query + BM25 rank]\n  FTS --> Results[Ranked Results]\n  Write[Insert or Update Note] --> FTS_Index[(FTS Virtual Table auto-sync on write)]\n  FTS_Index --> FTS\n```\n\n**Expected Answer:**\n- Room FTS5: `@Fts4`/`@Fts5` annotation, `MATCH` queries with BM25 ranking. Incremental indexing on insert/update.\n- Debounce the search query (300ms) to avoid query-per-keystroke.\n- For very large datasets: Lucene or Algolia.\n\n**Follow-up:** How do you keep the FTS index in sync?\n> Room FTS tables auto-sync on insert/delete. For updates: delete + reinsert in a transaction.\n\n**Red flags:**\n- Uses `LIKE '%query%'` — no index, full O(n) scan\n- Runs search on main thread",
    tags: ["storage", "search", "room"],
    related: ["sd-4", "sd-7", "tech-72"],
  },
  {
    id: "sd-9",
    type: "system-design",
    num: 9,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "Design a secure authentication flow for a mobile app.",
    answer:
      "**OAuth2 PKCE flow to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App\n  participant Tab as Chrome Custom Tab\n  participant Auth as Auth Server\n  participant API as Your API\n  App->>App: generate code_verifier + code_challenge\n  App->>Tab: open /authorize?code_challenge=...\n  Tab->>Auth: user logs in\n  Auth-->>App: redirect with auth_code\n  App->>Auth: POST /token + code_verifier\n  Auth-->>App: access_token + refresh_token\n  App->>App: store in EncryptedSharedPreferences\n  App->>API: request + Bearer token\n  API-->>App: 401 expired\n  App->>Auth: refresh_token to new access_token\n```\n\n**Expected Answer:**\n- OAuth2/OIDC with PKCE for third-party auth. Store tokens in EncryptedSharedPreferences.\n- Access token (short-lived, 15 min) + refresh token (long-lived, 30 days).\n- Auto-refresh via OkHttp Authenticator on 401. Biometric for re-auth.\n- Certificate pinning for API calls.\n\n**Follow-up:** Why is PKCE needed for mobile OAuth?\n> Mobile apps can't keep a client secret private. PKCE replaces the secret with a code verifier/challenge pair verified server-side.\n\n**Red flags:**\n- Stores tokens in plain SharedPreferences\n- No token refresh\n- No PKCE for OAuth",
    tags: ["security", "auth", "networking"],
    related: ["sd-10", "sd-6", "tech-20", "tech-38"],
  },
  {
    id: "sd-10",
    type: "system-design",
    num: 10,
    difficulty: "H",
    star: false,
    section: "Infrastructure",
    title: "Design a file upload system for mobile (photos/videos to cloud).",
    answer:
      "**Flow to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App\n  participant API as Your API\n  participant S3 as Cloud Storage\n  App->>API: POST /upload-url (filename, size, mime)\n  API-->>App: presigned URL + upload_id\n  App->>S3: PUT file bytes directly multipart\n  S3-->>App: 200 OK + ETag per part\n  App->>API: POST /upload-complete (upload_id, ETags)\n  API->>S3: complete multipart upload\n  API-->>App: public file URL\n  Note over App,S3: WorkManager handles background and retry\n```\n\n**Expected Answer:**\n- Get presigned URL from server (avoids routing large payload through API). Upload directly to S3/GCS.\n- Use multipart upload for large files. Background via WorkManager (survives app kill).\n- Progress tracking via WorkInfo. Retry with exponential backoff. Notify server on completion.\n\n**Follow-up:** How do you resume an interrupted upload?\n> Multipart: server returns part ETags; client resumes from last successful part. Or ranged PUT with Content-Range header.\n\n**Red flags:**\n- Sends files through API server\n- No background handling — fails on app kill\n- No retry logic",
    tags: ["mobile", "networking", "storage", "background"],
    related: ["sd-2", "sd-9"],
  },
  {
    id: "sd-11",
    type: "system-design",
    num: 11,
    difficulty: "H",
    star: true,
    section: "Infrastructure",
    title:
      "How do you design a mobile app for performance at scale — 10M users?",
    answer:
      "**Stack to draw:**\n\n```mermaid\nflowchart LR\n  Client[Mobile Client] -->|WebP + gzip| CDN[CDN Edge]\n  CDN -->|cache hit| Client\n  CDN -->|cache miss| LB[Load Balancer]\n  LB --> API[API Servers]\n  API --> Redis[Redis Cache]\n  Redis -->|hit| API\n  API --> DB[(Database)]\n  Client --> FCM[FCM Push]\n  Client -->|batch on WiFi| Analytics[Analytics Pipeline]\n  Client --> Crashlytics[Crashlytics]\n```\n\n**Expected Answer:**\n- Client: lazy loading, Paging 3, WebP images, memory-efficient LazyColumn, Baseline Profiles.\n- CDN for static assets. API: edge caching, gzip/brotli compression, GraphQL field filtering.\n- Analytics: batch events, send on WiFi. AB testing: feature flags (Firebase Remote Config).\n- Crash reporting: Firebase Crashlytics. Performance monitoring: custom traces + Firebase Performance.\n\n**Follow-up:** How do you reduce install size for users on slow networks?\n> AAB splits (ABI, density, language), WebP images, R8 ProGuard, dynamic feature modules.\n\n**Red flags:**\n- No CDN\n- Fetches full payloads always\n- No monitoring strategy",
    tags: ["performance", "scalability", "mobile", "architecture"],
    related: ["sd-1", "sd-7"],
  },
  {
    id: "sd-12",
    type: "system-design",
    num: 12,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "Design a push notification system for a mobile app.",
    answer:
      "**Flow to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App\n  participant FCM as Firebase FCM\n  participant Server as App Server\n  App->>FCM: register to get device token\n  App->>Server: POST /register-token\n  Server->>FCM: send notification + token\n  FCM-->>App: foreground: onMessageReceived()\n  FCM-->>App: background: system tray notification\n  App->>App: deep link on tap via NavDeepLink\n  Note over App,FCM: Token refresh: onNewToken() to update server\n```\n\n**Expected Answer:**\n- FCM (Firebase Cloud Messaging) as transport. Server sends to FCM with device token. Client handles in `FirebaseMessagingService.onMessageReceived()`.\n- Foreground: in-app banner. Background: system notification. Token refresh: `onNewToken()` → update server.\n- Notification channels (Android 8+) for user control. Deep link on tap via NavDeepLink.\n\n**Follow-up:** How do you ensure delivery when device is offline?\n> FCM queues messages up to 4 weeks (TTL configurable). High-priority flag for time-sensitive messages.\n\n**Red flags:**\n- Uses polling instead of push\n- Doesn't handle token refresh\n- No notification channels (required Android 8+)",
    tags: ["mobile", "notifications", "android-components", "networking"],
    related: ["sd-1", "sd-2"],
  },
  {
    id: "sd-13",
    type: "system-design",
    num: 13,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design real-time location sharing (like Uber driver tracking).",
    answer:
      "**What to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App as Mobile App\n  participant WS as WebSocket Server\n  participant Cache as Redis\n  participant DB as Location DB\n  App->>WS: connect + auth token\n  loop Every 3s\n    App->>WS: sendLocation(lat, lng)\n    WS->>Cache: SET user:loc TTL=30s\n    WS->>DB: batch insert async\n    WS-->>App: nearby locations push\n  end\n```\n\n**Key design decisions:**\n- WebSocket (not polling) — persistent connection, low latency\n- Redis for hot location data (TTL = user appears offline after 30s)\n- Batch writes to DB to reduce write amplification\n- Geohash / S2 cells for efficient nearby-user queries\n- Driver goes offline → TTL expires → Redis auto-evicts\n\n**Follow-up:** How do you scale to 1M concurrent drivers?\n> Consistent-hash WebSocket servers by user region. Redis cluster per region. Fan-out: only push to users who queried that driver.\n\n**Red flags:**\n- HTTP polling (too many requests, high latency)\n- Writing every location update directly to DB\n- No TTL / stale location problem",
    tags: ["real-time", "websocket", "redis", "scalability"],
    related: ["sd-2", "sd-5"],
  },
  {
    id: "sd-14",
    type: "system-design",
    num: 14,
    difficulty: "M",
    star: true,
    section: "Classic",
    title: "Design a type-ahead / autocomplete search feature.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Input[Search Input] --> Debounce[Debounce 200ms]\n  Debounce --> Cache[In-Memory LRU Cache]\n  Cache -->|hit| Results[Dropdown Results]\n  Cache -->|miss| API[Search API]\n  API --> Trie[Prefix Trie Index]\n  Trie --> API\n  API --> Cache\n  API --> Results\n```\n\n**Key design decisions:**\n- Debounce 200ms — avoid query per keystroke\n- Client-side LRU cache — instant results for repeated prefixes\n- Server: Trie or inverted index for prefix lookup\n- Return top-N results sorted by frequency/relevance\n- Cancel in-flight requests when new keystroke arrives\n\n**Follow-up:** How do you rank autocomplete suggestions?\n> Global frequency (most searched), personalization (user history), recency boost, location context.\n\n**Red flags:**\n- No debounce — floods the API\n- No cancellation of stale requests\n- LIKE %query% full scan in DB",
    tags: ["search", "networking", "caching", "ux"],
    related: ["sd-7", "sd-5"],
  },
  {
    id: "sd-15",
    type: "system-design",
    num: 15,
    difficulty: "M",
    star: false,
    section: "Classic",
    title: "Design a crash reporting SDK (like Firebase Crashlytics).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Crash[Uncaught Exception or ANR] --> Handler[Global UncaughtExceptionHandler]\n  Handler --> Serialize[Serialize stacktrace + context]\n  Serialize --> LocalDB[Local SQLite queue]\n  Handler --> Restart[App restarts]\n  Restart --> Worker[WorkManager on next launch]\n  Worker -->|network available| Upload[Crash Ingestion API]\n  Upload --> Pipeline[Dedup + Grouping pipeline]\n  Pipeline --> Dashboard[Dev Dashboard]\n```\n\n**Key design decisions:**\n- Capture crash BEFORE app dies — no async work, pure synchronous write\n- Store to local DB (not memory) — survives process death\n- Upload on next launch via WorkManager (not during crash — unsafe)\n- Dedup server-side by stacktrace hash\n- Include: OS version, device model, app version, user ID (hashed), breadcrumbs\n\n**Follow-up:** How do you capture breadcrumbs (events leading to crash)?\n> Ring buffer in memory (e.g., last 50 events). Written to disk on crash.\n\n**Red flags:**\n- Tries to upload synchronously during crash handler\n- Stores PII in crash reports without hashing\n- No deduplication — one bug floods dashboard",
    tags: ["observability", "android-components", "background", "storage"],
    related: ["sd-10", "sd-12", "tech-83"],
  },
  {
    id: "sd-16",
    type: "system-design",
    num: 16,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design a mobile checkout / payment flow.",
    answer:
      "**What to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App as Mobile App\n  participant API as Payment API\n  participant PSP as Payment Processor\n  participant DB as Orders DB\n  App->>API: POST /checkout idempotency-key abc123\n  API->>DB: INSERT order PENDING\n  API->>PSP: charge(token, amount)\n  alt success\n    PSP-->>API: 200 charged\n    API->>DB: UPDATE order COMPLETE\n    API-->>App: receipt\n  else failure\n    PSP-->>API: error\n    API->>DB: UPDATE order FAILED\n    API-->>App: error + retry hint\n  end\n  Note over App,API: Retry with same key is safe\n```\n\n**Key design decisions:**\n- Idempotency key — safe retries on network failure, never double-charge\n- Order state machine: PENDING → COMPLETE | FAILED | REFUNDED\n- Never pass raw card data through your API — use PSP tokenization (Stripe Elements, Adyen)\n- Confirm payment client-side with 3DS / biometric before calling API\n- Server webhook from PSP as source of truth (not just API response)\n\n**Follow-up:** What if the API call succeeds but the app never receives the response?\n> App retries with same idempotency key → server detects duplicate → returns cached response. No double charge.\n\n**Red flags:**\n- No idempotency key\n- Passes raw card numbers to your backend\n- Trusts client-side confirmation without server verification",
    tags: ["payments", "security", "networking", "architecture"],
    related: ["sd-9", "sd-6"],
  },
  {
    id: "sd-17",
    type: "system-design",
    num: 17,
    difficulty: "H",
    star: false,
    section: "Classic",
    title:
      "Design an adaptive video streaming player (like YouTube / Netflix mobile).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  CDN[CDN Edge Node] -->|HLS or DASH segments| Buffer[Segment Buffer]\n  Buffer --> Decoder[Hardware Decoder]\n  Decoder --> Surface[SurfaceView or TextureView]\n  ABR[ABR Algorithm] -->|monitor| BW[Bandwidth Estimator]\n  BW -->|throughput| ABR\n  ABR -->|select bitrate| CDN\n  Buffer -->|buffer level| ABR\n```\n\n**Key design decisions:**\n- HLS or DASH for adaptive streaming — manifest lists all quality renditions\n- ABR (Adaptive Bitrate) algorithm: switch quality based on bandwidth + buffer health\n- Buffer 2 segments ahead; drop quality before buffer underrun (stall is worst UX)\n- ExoPlayer on Android: handles HLS, DASH, DRM, background audio, PiP\n- DRM: Widevine L1 (hardware) > L3 (software). L1 required for HD Netflix.\n- Pre-cache thumbnails at scrub-bar position via trick-play stream\n\n**Follow-up:** How do you minimize startup latency?\n> Start at lowest quality, ramp up fast. Preload first 2 segments before play begins.\n\n**Red flags:**\n- Fixed bitrate (no adaptation)\n- Downloads full video before playing\n- No DRM awareness for premium content",
    tags: ["media", "performance", "networking", "architecture"],
    related: ["sd-3", "sd-11"],
  },
  {
    id: "sd-18",
    type: "system-design",
    num: 18,
    difficulty: "M",
    star: true,
    section: "Mobile",
    title: "Design an offline-first sync engine for a mobile app.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  UI[User Action] --> Local[Room DB write]\n  Local --> Queue[Sync Queue pending ops]\n  Queue --> Worker[WorkManager sync job]\n  Worker -->|online| API[Backend API]\n  API -->|conflict| Resolver[Conflict Resolver]\n  Resolver -->|server wins| Local\n  Resolver -->|no conflict| Ack[Mark synced]\n  Worker -->|offline| Retry[Exponential backoff retry]\n  Retry --> Queue\n```\n\n**Key design decisions:**\n- Write-locally-first: every mutation writes to Room before touching network\n- Sync queue is durable (survives process death)\n- Each pending op has: type, payload, timestamp, retry count\n- Conflict resolution strategies: last-write-wins (timestamp), server-wins, merge (field-level)\n- WorkManager handles constraints: network required, backoff\n- Sync state per entity: SYNCED | PENDING | CONFLICT\n\n**Follow-up:** How do you handle deletes when offline?\n> Soft-delete: mark entity as deleted locally, sync tombstone to server. Server hard-deletes after propagation.\n\n**Red flags:**\n- Only reads from local, writes go directly to server\n- No conflict detection\n- Uses regular Thread or AsyncTask (doesn't survive app kill)",
    tags: ["offline", "sync", "architecture", "room", "background"],
    related: ["sd-4", "sd-7", "tech-30", "tech-49"],
  },
  {
    id: "sd-19",
    type: "system-design",
    num: 19,
    difficulty: "M",
    star: false,
    section: "Classic",
    title: "Design an A/B testing / feature flag system for mobile.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  App[App Launch] --> Fetch[Fetch experiment config]\n  Fetch --> Cache[Local cache TTL=1h]\n  Cache --> Assign[Assign user to variant]\n  Assign -->|user_id mod 100| Bucket[Bucket 0-49 control / 50-99 treatment]\n  Bucket --> Feature[Render feature variant]\n  Feature --> Event[Log exposure event]\n  Event --> Analytics[Analytics pipeline]\n  Analytics --> Dashboard[Experiment Dashboard]\n```\n\n**Key design decisions:**\n- Deterministic bucketing by user_id hash — same user always gets same variant\n- Fetch config on app launch, cache locally with TTL (reduces latency, works offline)\n- Log exposure event (not just action) — prevents novelty bias in analysis\n- Holdback group for measuring cumulative feature impact\n- Firebase Remote Config or LaunchDarkly for managed feature flags\n\n**Follow-up:** How do you avoid experiment pollution (multiple experiments interacting)?\n> Mutual exclusion layers: assign each user to only one experiment per layer.\n\n**Red flags:**\n- Random variant per session (user sees different things each time)\n- No exposure logging (can't compute statistical significance)\n- No holdback group",
    tags: ["growth", "architecture", "analytics", "networking"],
    related: ["sd-11", "sd-12"],
  },
  {
    id: "sd-20",
    type: "system-design",
    num: 20,
    difficulty: "H",
    star: true,
    section: "Staff / Platform",
    title:
      "Design an Android modularization strategy for a team of 50+ engineers. How do you structure modules and enforce boundaries?",
    answer:
      "**Module graph to draw:**\n\n```mermaid\nflowchart TD\n  App[:app] --> FeedF[:feature:feed]\n  App --> PayF[:feature:payments]\n  App --> ProfF[:feature:profile]\n  FeedF --> DS[:libs:design-system]\n  FeedF --> Net[:libs:network]\n  FeedF --> Ana[:libs:analytics]\n  PayF --> Net\n  PayF --> DS\n  FeedF --> DomainAPI[:core:domain-api]\n  PayF --> DomainAPI\n  Net --> DomainAPI\n```\n\n**Module types:**\n- `:app` — entry point, wires everything via DI, no business logic\n- `:feature:*` — vertical slices (feed, payments, profile) with own ViewModel/UI/nav. Never depend on each other.\n- `:libs:*` — horizontal cross-cutting concerns (network, analytics, design-system). No business logic.\n- `:core:domain-api` — interfaces and data models only. No implementation. Features depend on this, not on each other.\n\n**Enforcing boundaries:**\n- Dependency guard / `forbidden-modules` lint rule — CI fails if `:feature:feed` imports `:feature:payments`\n- Navigation via string routes or sealed interface in `:core:navigation` — features navigate by route, never by direct class reference, wired at `:app` level\n- Module owner per `CODEOWNERS` — required review from owner before cross-module changes\n\n**Build time impact:**\n- Parallel compilation — feature A and feature B build simultaneously\n- Only changed modules recompile — `AffectedModuleDetector` scopes CI to affected modules\n- Configuration cache + build cache — repeat builds in <2 min\n\n**Follow-up:** What's the difference between `:libs` and `:core`?\n> `:core` contains only interfaces/contracts (no implementation, no Android deps ideally). `:libs` contain implementations that depend on Android SDK. Features can depend on `:core` without pulling in Android.\n\n**Follow-up:** How do you handle shared DI across modules?\n> Each module exposes a Koin/Hilt module function. `:app` collects and loads all of them.\n\n**Red flags:**\n- Single monolithic `:app` module — no parallel compilation, everyone steps on each other\n- Feature modules depending directly on other feature modules\n- No dependency enforcement — conventions exist only as documentation, not as a CI gate",
    tags: ["modularization", "architecture", "staff", "build", "android"],
    related: ["behav-30", "sd-21", "sd-23", "tech-102", "tech-27"],
  },
  {
    id: "sd-21",
    type: "system-design",
    num: 21,
    difficulty: "H",
    star: true,
    section: "Staff / Platform",
    title:
      "Plan a migration from XML Views + Fragments to Jetpack Compose in a large production app with 50+ engineers actively contributing. How do you execute without stopping feature work?",
    answer:
      '**Migration phases to draw:**\n\n```mermaid\nflowchart LR\n  P1[Phase 1: Coexistence] --> P2[Phase 2: Leaf components]\n  P2 --> P3[Phase 3: Screens]\n  P3 --> P4[Phase 4: Navigation]\n  P4 --> Done[Done]\n  P1 -.->|Feature work never stops| P4\n```\n\n**Phase breakdown:**\n- **Phase 1 — Coexistence**: embed `ComposeView` inside existing Fragments; use `AndroidView` in Compose for legacy widgets. No UX change, no user risk.\n- **Phase 2 — Leaf components first**: migrate your design system (buttons, cards, list items) to Compose. Every team starts consuming them. Low blast radius.\n- **Phase 3 — Screen by screen**: migrate one full screen at a time, feature-flagged. Can roll back per screen.\n- **Phase 4 — Navigation last**: migrate from Fragment Navigation to Compose Navigation. Highest blast radius — do this last.\n\n**Key decisions:**\n- **Shared ViewModel**: works unchanged across both paradigms — no migration needed here\n- **Screenshot tests**: capture baseline before migration, compare after. Catch visual regressions before users do.\n- **Design system first**: prevents every team building their own Compose UI in parallel, creating fragmentation\n- **Staff role is the playbook, not the execution**: define strategy, build bridges, write migration guide, run office hours — feature teams own their own screens\n- **Never branch-and-rewrite**: main branch always has both. Feature work continues throughout.\n\n**Follow-up:** How long does this take at scale?\n> 1–3 years for a large app. Timeline is set by team capacity allocated, not technical complexity.\n\n**Follow-up:** Who does the actual screen migrations?\n> Individual feature teams own their screens. Staff engineer removes blockers, not the bottleneck.\n\n**Red flags:**\n- "We\'ll do a big-bang rewrite in a separate branch" — code diverges, never merges\n- No interop strategy — forces teams to stop shipping for months\n- Migrates Navigation in Phase 1 — highest risk should be last\n- No screenshot testing — regressions discovered by users in production',
    tags: ["compose", "migration", "staff", "architecture", "android"],
    related: ["behav-31", "sd-20", "sd-22"],
  },
  {
    id: "sd-22",
    type: "system-design",
    num: 22,
    difficulty: "H",
    star: true,
    section: "Staff / Platform",
    title:
      "Design a shared Android SDK that multiple internal teams will consume. What does good SDK design look like?",
    answer:
      "**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  AppA[:app-payments] --> PubAPI[:sdk:public-api]\n  AppB[:app-shopping] --> PubAPI\n  PubAPI --> Impl[:sdk:impl]\n  Impl --> Net[OkHttp / Ktor]\n  Impl --> DB[SQLite]\n  PubAPI --> Maven[Internal Artifactory]\n```\n\n**API design principles:**\n- **Minimal public surface** — use `internal` aggressively. Every public symbol is a contract you can never break without a major version bump.\n- **Builder pattern for config** — `SDK.Builder().setApiKey(key).setTimeout(30_000).build()`. Additive and backwards-compatible.\n- **No threading opinions** — expose `suspend` functions + `Flow`. Consumer chooses the dispatcher.\n- **Interface-first dependencies** — accept `Logger`, `NetworkClient` as interfaces. Don't hardcode implementations the consumer might already have.\n- **API compatibility check in CI** — `apiDump` + `apiCheck` (Kotlin Binary Compatibility Validator). Breaking changes fail the build.\n\n**Internal architecture:**\n- `:sdk:public-api` — interfaces and data classes only. Pure Kotlin, no Android SDK if possible.\n- `:sdk:impl` — implementation. Consumers reference `:public-api` only, never `:impl` directly.\n- Shade (relocate) conflicting transitive dependencies to avoid consumer dependency conflicts.\n\n**Distribution:**\n- Semantic versioning. Internal Maven (Artifactory / GitHub Packages). `libs.versions.toml` for consuming apps.\n- Mandatory CHANGELOG per release. Deprecation window before removal (min 2 minor versions).\n\n**Follow-up:** What's the most dangerous SDK design mistake?\n> Leaking implementation types into the public API — a public exception that extends an internal class, or a method returning an OkHttp Response. Consumers depend on it; you can never remove it.\n\n**Red flags:**\n- Public API returns or throws internal implementation types\n- SDK pulls in large transitive dependencies that conflict with consumers\n- No API compatibility check in CI — breaking changes merge silently\n- Hard-codes threading (creates global thread pools the consumer can't control)",
    tags: ["sdk", "staff", "architecture", "api-design", "android"],
    related: ["behav-30", "sd-20", "sd-24"],
  },
  {
    id: "sd-23",
    type: "system-design",
    num: 23,
    difficulty: "H",
    star: true,
    section: "Staff / Platform",
    title:
      "Design a CI/CD pipeline for a large Android team — from commit to Play Store.",
    answer:
      "**Pipeline to draw:**\n\n```mermaid\nflowchart LR\n  PR[Pull Request] --> Lint[ktlint + detekt 5m]\n  Lint --> UTest[Unit tests changed modules 10-15m]\n  UTest --> Build[Build debug APK]\n  Build --> Gate{PR Gate}\n  Gate -->|merged| Main[Main branch]\n  Main --> ITest[Instrumented tests sharded 45m]\n  ITest --> RelBuild[Build release AAB + sign]\n  RelBuild --> FDA[Firebase App Distribution to QA]\n  RelBuild --> Internal[Play Internal Track]\n  Internal --> Alpha[Alpha 1%]\n  Alpha --> Beta[Beta 20%]\n  Beta --> Prod[Production graduated rollout]\n```\n\n**Speed — PR feedback under 15 min:**\n- `AffectedModuleDetector` — only run tests for modules touched by the PR\n- Distributed Gradle build cache — 60-80% hit rate on CI\n- Shard instrumented tests across parallel emulators (Firebase Test Lab / Flank)\n\n**Correctness — main always green:**\n- Protected branch — direct push to main blocked\n- Merge queue — CI runs on the merged state (PR + latest main), not just the PR branch alone\n- Required code owners + API compatibility check\n\n**Deployment:**\n- Release AAB signed in CI using keystore stored in CI secrets\n- Gradle Play Publisher or Fastlane for automated Play Store upload\n- Graduated rollout: 1% → 5% → 20% → 100%. Monitor Firebase Crashlytics at each step. Halt automatically if crash rate spikes.\n- Firebase App Distribution for QA builds on every main merge\n\n**Follow-up:** How do you ship a hotfix without the full rollout pipeline?\n> Separate emergency track or use a server-side feature flag to disable the broken feature without a new release. Fast-track the AAB through internal → production at 1% then ramp.\n\n**Follow-up:** What causes slow CI and how do you fix it?\n> Running all tests on every PR (fix: AffectedModuleDetector). No cache (fix: remote Gradle cache). Not sharding instrumented tests (fix: Flank/Firebase Test Lab).\n\n**Red flags:**\n- Full test suite runs on every PR regardless of what changed\n- Manual Play Store upload — error-prone, bottlenecked on one person\n- No graduated rollout — a bad build hits 100% of users instantly",
    tags: ["ci-cd", "staff", "build", "android", "gradle", "tooling"],
    related: ["sd-20", "sd-22", "tech-102", "tech-60"],
  },
  {
    id: "sd-24",
    type: "system-design",
    num: 24,
    difficulty: "H",
    star: false,
    section: "Staff / Platform",
    title:
      "Design a mobile analytics / telemetry SDK — event collection, batching, and privacy compliance.",
    answer:
      "**Pipeline to draw:**\n\n```mermaid\nflowchart LR\n  Event[track event] --> Queue[In-memory queue]\n  Queue -->|N events OR T ms| Batch[Batch builder]\n  Batch --> SQLite[(Local SQLite queue)]\n  SQLite --> Worker[WorkManager flush job]\n  Worker -->|network available| API[Analytics Ingestion API]\n  API --> Pipeline[Stream processing]\n  Pipeline --> Dashboard[Dashboards]\n  Worker -->|fail| Backoff[Exponential backoff]\n  Backoff --> Worker\n```\n\n**Event schema:**\n- name, properties (Map<String,Any>), timestamp, session_id, user_id (hashed), device_id, app_version, os_version\n\n**Key design decisions:**\n- **Batching**: accumulate N events OR timeout T ms — whichever comes first. Reduces network calls by 10-100×. Default: 50 events or 30s.\n- **Local persistence**: SQLite before sending — events survive app kill and network failure\n- **Background flush**: WorkManager with network constraint + exponential backoff\n- **Sampling**: high-volume events (page views) sampled at SDK layer (e.g., 10%). Rare events (purchases, crashes) sent at 100%. Sampling rate configurable from server.\n- **Privacy**: hash user IDs before storage and sending. No PII in event properties — validated at SDK ingestion layer. GDPR delete endpoint removes all events for a hashed ID.\n- **Schema versioning**: version field in every payload. Backend ignores unknown fields. Old client events remain parseable.\n\n**Follow-up:** User has been offline for 3 days with 5,000 queued events. What happens?\n> Local queue is capped (e.g., 2,000 events). Oldest events dropped when cap is hit. On reconnect, flush in batches with backpressure.\n\n**Follow-up:** How do you test the SDK in isolation without sending real events?\n> Dry-run mode: events serialized and logged locally, not sent. Integration tests mock the ingestion server.\n\n**Red flags:**\n- One HTTP request per event — floods the network and drains battery\n- No local persistence — events lost on app kill\n- Stores raw PII in event properties\n- No sampling strategy for high-frequency events",
    tags: ["analytics", "sdk", "staff", "privacy", "background"],
    related: ["sd-15", "sd-22"],
  },
  {
    id: "sd-25",
    type: "system-design",
    num: 25,
    difficulty: "H",
    star: false,
    section: "Staff / Platform",
    title:
      "Design a GraphQL client layer for a mobile app. Compare tradeoffs vs REST.",
    answer:
      "**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  ComposeUI[Compose UI] -->|StateFlow| VM[ViewModel]\n  VM --> Repo[Repository]\n  Repo --> Apollo[Apollo Kotlin Client]\n  Apollo --> Cache[Normalized Cache]\n  Cache -->|cache hit| Repo\n  Apollo -->|cache miss| GQL[GraphQL API]\n  GQL --> Apollo\n  Apollo --> WS[WebSocket subscriptions]\n```\n\n**Apollo Kotlin specifics:**\n- Compile-time type-safe generated models from `.graphql` files + schema\n- Normalized cache: every object keyed by `__typename + id`. Objects shared across queries auto-merge. UI updates automatically when cache updates.\n- Fetch policies: `CacheFirst` (show cached, refresh async), `NetworkFirst` (always fresh), `NetworkOnly` (mutations)\n- Subscriptions over WebSocket with automatic reconnect\n- Persisted queries: send query hash instead of full query string — reduces request size, enables CDN caching\n- Optimistic UI: update cache immediately with expected result, auto-roll back if mutation fails\n\n**GraphQL vs REST tradeoffs:**\n\n| | GraphQL | REST |\n|---|---|---|\n| Over/under-fetching | Only requested fields | Fixed response shape |\n| Caching | Complex (no HTTP cache keys) | Simple (HTTP cache, CDN) |\n| Schema contract | Single typed schema | Multiple endpoints, often inconsistent |\n| Real-time | Built-in subscriptions | Requires separate WS layer |\n| Debugging | Harder (single endpoint) | Easy (URL = resource) |\n\n**Follow-up:** What is the N+1 problem in GraphQL?\n> A list query resolves each item's relations separately — 1 list query + N detail queries. Server solves with DataLoader to batch and deduplicate.\n\n**Red flags:**\n- Fetches all fields on every query (negates GraphQL's core benefit)\n- No normalized cache — re-fetches on every screen visit\n- Doesn't know what N+1 is",
    tags: ["graphql", "networking", "staff", "architecture", "apollo"],
    related: ["sd-5", "sd-7"],
  },
  {
    id: "sd-26",
    type: "system-design",
    num: 26,
    difficulty: "M",
    star: true,
    section: "Staff / Platform",
    title:
      "When would you choose Kotlin Multiplatform (KMP) over separate native apps? Design a KMP architecture — what do you share vs keep native?",
    answer:
      "**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  subgraph Android\n    AUI[Compose UI]\n    AVM[Android ViewModel]\n  end\n  subgraph iOS\n    IUI[SwiftUI]\n    IVM[iOS ViewModel]\n  end\n  AVM --> Shared\n  IVM --> Shared\n  subgraph Shared\n    UC[UseCases / Domain]\n    Repo[Repositories]\n    API[Ktor HTTP Client]\n    DB[SQLDelight]\n    Val[Validation / Formatting]\n  end\n  Shared --> Platform[expect / actual]\n  Platform --> AKS[Android Keystore]\n  Platform --> IKC[iOS Keychain]\n```\n\n**Share (high ROI):**\n- Business logic: UseCases, domain models, complex validation\n- Data layer: network (Ktor), local DB (SQLDelight)\n- Formatting: currency, dates, phone numbers\n- Analytics event definitions and tracking logic\n\n**Keep native (don't share):**\n- UI — Compose and SwiftUI have fundamentally different paradigms; interop is fragile\n- Navigation — each platform's model is deeply different\n- Platform APIs: permissions, biometrics, camera, push — bridge with `expect`/`actual` instead\n- Anything requiring deep OS integration\n\n**When to adopt KMP:**\n- ✅ Both platforms need the same features; comparable team sizes\n- ✅ Significant shared business logic (finance, complex validation, domain rules)\n- ✅ Greenfield project or clear architectural boundaries\n- ❌ Large existing codebase where KMP requires a rewrite\n- ❌ iOS team significantly larger or more opinionated about architecture\n- ❌ UI-heavy app with minimal shared logic — shared layer would be trivially thin\n\n**Follow-up:** What is `expect`/`actual`?\n> `expect` declares an interface in shared code. `actual` provides a platform-specific implementation. e.g., `expect fun generateUUID(): String` → `actual fun generateUUID() = UUID.randomUUID().toString()` on Android, and similarly on iOS.\n\n**Red flags:**\n- Tries to share UI through KMP without a clear, validated strategy\n- Chose KMP because it's trendy, not because the team structure and problem fit it\n- No clear boundary on shared vs native — \"we'll share everything\"",
    tags: ["kmp", "staff", "architecture", "cross-platform", "kotlin"],
    related: ["sd-20", "sd-22"],
  },
  {
    id: "sd-27",
    type: "system-design",
    num: 27,
    difficulty: "H",
    star: true,
    section: "Staff / Platform",
    title:
      "Design a feature flag and server-driven UI (SDUI) system for a mobile app at scale.",
    answer:
      "**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  Launch[App Launch] --> SDK[Feature Flag SDK]\n  SDK --> LocalCache[Local cache TTL=1h]\n  LocalCache --> Eval[Evaluate rules locally]\n  Eval --> Flag{Flag on?}\n  Flag -->|yes| New[New code path]\n  Flag -->|no| Old[Old code path]\n\n  ConfigServer[Config Server] --> Rules[Audience rules]\n  Rules --> Segment[user_id / %, app version, region]\n  ConfigServer --> SDUI[SDUI payload JSON]\n  SDUI --> Renderer[JSON to Compose renderer]\n  Renderer --> Fallback[Fallback UI if unknown schema]\n```\n\n**Feature flags:**\n- Fetch at app start, cache locally with TTL. Works offline from cache (defaults to safe values).\n- **Evaluation is local** — rules are downloaded, not evaluated per-request. Zero latency to check a flag.\n- Types: boolean kill-switch, multivariate (A/B/C), percentage rollout, targeting rules (user segment, app version, region)\n- **Emergency kill switch**: disable a broken feature instantly without an app release\n- **Flag lifecycle**: create → ramp → 100% → clean up. CI gate warns on flags older than 90 days. Removal is part of the feature's definition-of-done.\n\n**Server-driven UI (SDUI):**\n- Server returns JSON describing UI components and their properties. Mobile renderer maps schema → Compose composables.\n- Enables UI changes without an app release (critical for live commerce, emergency fixes, promos)\n- **Schema versioning is mandatory**: include `schemaVersion` in every payload. Unknown version → render fallback UI, not a crash.\n- **Fallback is mandatory**: if JSON fails to parse or component type is unknown, show a hardcoded default. Never crash on a bad payload.\n\n**Tradeoffs:**\n| | Feature Flags | SDUI |\n|---|---|---|\n| Use case | Toggle code paths | Change UI layout remotely |\n| Type safety | Strong (code already exists) | Weak (JSON at runtime) |\n| Risk | Low | Higher (dynamic rendering bugs) |\n| Release dependency | None after ramp | None |\n\n**Follow-up:** What's the hardest part of SDUI?\n> Backward compatibility. An app from 2 years ago must understand a schema written today. Unknown components must degrade gracefully.\n\n**Follow-up:** How do you prevent flag sprawl?\n> Required owner per flag. Automated staleness check. Removal is explicitly part of the feature's definition-of-done, not an afterthought.\n\n**Red flags:**\n- Fetches flag state on every API call — 50ms+ latency added to every request\n- No offline fallback — app broken without connectivity\n- SDUI with no fallback UI — bad JSON payload crashes the screen\n- No A/B exposure logging — can't compute statistical significance for experiments",
    tags: ["feature-flags", "sdui", "staff", "architecture", "growth"],
    related: ["sd-19", "sd-20"],
  },
  {
    id: "sd-28",
    type: "system-design",
    num: 28,
    difficulty: "H",
    star: true,
    section: "Mobile",
    title: "Design a mobile P2P payment wallet.",
    answer:
      "**What to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App\n  participant API as Payment API\n  participant PSP as Payment Processor\n  participant Push as FCM\n  App->>API: POST /pay idempotency-key:abc\n  API->>PSP: debit sender, credit receiver\n  PSP-->>API: success\n  API-->>App: receipt\n  API->>Push: notify receiver\n```\n\n**Key design decisions:**\n- P2P flow: select contact → enter amount → confirm with biometric → API call with idempotency key.\n- Idempotency key on every payment — safe retry on network failure, prevents double-charge.\n- Balance: always fetch from server before display — never trust local cache for financial values.\n- Security: BiometricPrompt before every payment. Device binding — flag new device logins. EncryptedSharedPreferences for tokens.\n- Transaction history: cursor-paginated, cached in Room. Optimistic UI — show PENDING immediately, confirm on server ack.\n- Bank linking: OAuth via Plaid. Never store raw bank credentials.\n\n**Follow-up:** Payment succeeds on server but app never receives the response — what happens?\n> Retry with same idempotency key. Server returns cached result. App polls /transactions to reconcile any pending state.\n\n**Red flags:**\n- No idempotency key — double payment on retry\n- Stores card or bank data on device\n- Trusts client-reported balance instead of server",
    tags: ["mobile", "payments", "security", "architecture"],
    related: ["sd-9", "sd-16"],
    assumptions:
      "**Questions to ask the interviewer:**\n- P2P payments only, or merchant payments too?\n- International transfers or domestic only?\n- Real-time balance update vs eventual consistency?\n- Fraud detection on mobile or backend only?\n- What authentication methods? (biometric, PIN, 2FA?)\n\n**Declared assumptions:**\n- P2P + merchant payments (domestic USD)\n- Real-time balance display (optimistic update)\n- Biometric + PIN for auth, 2FA for large transfers\n- PCI-DSS compliance required — no raw card data on device\n- Transaction history stored 90 days locally",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify security requirements, PCI scope, auth methods\n2. **(5–12 min)** Payment flow: select recipient → amount → 2FA → API call → confirmation\n3. **(12–22 min)** Security: Keystore-backed keys, certificate pinning, encrypted SQLite\n4. **(22–33 min)** Deep dive: idempotency keys, optimistic balance, retry logic\n5. **(33–42 min)** Trade-offs: optimistic vs confirmed balance, biometric storage\n6. **(42–45 min)** Edge cases: network failure mid-payment, duplicate payment prevention",
    considerations:
      '- **Idempotency keys:** Generate client UUID per payment; prevent duplicates on retry\n- **Optimistic balance:** Show balance update immediately; revert on API failure\n- **Keystore security:** Store auth tokens in Android Keystore, not SharedPreferences\n- **Certificate pinning:** Pin payment API endpoints to prevent MITM\n- **Background state:** Require re-auth after app goes to background (configurable timeout)\n- **PCI scope:** Tokenize card data (Stripe/Adyen); never store raw PANs on device\n- **Network failure:** Show "Payment pending" state; poll backend for resolution',
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Balance display | Optimistic (immediate) | Wait for confirmation | Better UX; revert on failure |\n| Auth storage | Android Keystore | SharedPreferences | Keystore backed by hardware security module |\n| Local data | Encrypted SQLite (SQLCipher) | Plain Room DB | Payment data requires encryption at rest |\n| Card tokenization | Stripe Elements SDK | Custom PCI integration | Offloads PCI scope; Stripe handles card data |",
    alternatives:
      "**Alternative 1: No local transaction history (always fetch from server)**\n- Pros: Always fresh, no sync needed\n- Cons: Unusable offline; slow to load history on poor network\n\n**Alternative 2: Web-view embedded checkout**\n- Pros: Easier PCI compliance; web team manages payment UI\n- Cons: Poor UX, no native biometrics, slow\n\n**Alternative 3: Plaid / open banking APIs instead of card on file**\n- Pros: Bank-direct transfers, lower fees\n- Cons: Additional OAuth flow, ACH delays (1-2 days)",
  },
  {
    id: "sd-29",
    type: "system-design",
    num: 29,
    difficulty: "M",
    star: false,
    section: "Mobile",
    title: "Design a location services / GPS tracking SDK for mobile.",
    answer:
      "**Expected Answer:**\n- Fused Location Provider: blends GPS, Wi-Fi, and cell towers. More battery-efficient than raw GPS.\n- Priority levels: HIGH_ACCURACY (GPS) vs BALANCED_POWER (Wi-Fi/cell) vs LOW_POWER (city-level). Choose based on use case.\n- Background location: Android 10+ requires ACCESS_BACKGROUND_LOCATION. Use a foreground service with a persistent notification for ongoing tracking.\n- Geofencing: GeofencingClient registers regions. System delivers entry/exit/dwell events — far cheaper than continuous polling.\n- Battery optimization: increase update frequency when moving (accelerometer detects motion), back off when stationary. Stop tracking when screen off + stationary.\n- Privacy: coarsen precision for non-critical features. Do not retain raw GPS history beyond necessity.\n\n**Follow-up:** How do you track location across app restarts?\n> Persist last known location in SharedPreferences. A foreground service survives background restrictions. BroadcastReceiver on BOOT_COMPLETED restarts the tracking service.\n\n**Red flags:**\n- Raw GPS at max frequency — drains battery in hours\n- Requests background location without clear justification (Play Store rejection risk)\n- Constant polling instead of geofencing for region monitoring",
    tags: ["mobile", "location", "battery", "android-components"],
    related: ["sd-13", "sd-30"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Accuracy requirements? (city-level vs meter-level)\n- Battery budget? (background tracking OK?)\n- Update frequency? (1/sec vs 1/min)\n- Geofencing needed?\n- Are we building the SDK or the client using the SDK?\n\n**Declared assumptions:**\n- Building the SDK (library for other apps to use)\n- Background tracking allowed (foreground service when active)\n- Three accuracy tiers: High (GPS, 1s), Balanced (network, 10s), Low (passive, 60s)\n- Geofencing supported\n- Android API 26+",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: accuracy tiers, battery budget, geofencing, API design\n2. **(5–15 min)** API surface: `locationClient.requestUpdates(accuracy, callback)`\n3. **(15–25 min)** Provider selection: FusedLocationProvider vs raw GPS\n4. **(25–35 min)** Battery optimization: Doze mode, foreground service, accuracy downgrade\n5. **(35–42 min)** Geofencing: PendingIntent-based triggers, dwell detection\n6. **(42–45 min)** Trade-offs: battery vs accuracy, batch updates vs real-time",
    considerations:
      "- **Doze mode:** Use `setForegroundService()` or `WorkManager` for background; raw timers won't fire\n- **Accuracy downgrade:** Auto-drop to lower accuracy tier when battery < 15%\n- **Location batching:** Batch updates to reduce wake-ups on low-accuracy tier\n- **Kalman filtering:** Optional — smooth noisy GPS readings for display\n- **Privacy:** Require runtime permissions; respect permission revocation mid-session\n- **Sensor fusion:** FusedLocationProvider blends GPS + WiFi + cell tower for speed vs accuracy",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Provider | FusedLocationProvider | Raw LocationManager | Fused handles sensor blending + battery optimization automatically |\n| Background | Foreground service | JobScheduler | Foreground service survives Doze; JobScheduler can't guarantee location timing |\n| Update delivery | PendingIntent (geofence) | Listener callback | PendingIntent survives app death; callbacks require live process |",
    alternatives:
      "**Alternative 1: Push location from server (reverse geocoding only)**\n- Pros: No battery impact on client\n- Cons: Doesn't work for device-side tracking use cases\n\n**Alternative 2: Custom Kalman filter over raw GPS**\n- Pros: More accurate in urban canyons\n- Cons: Complex to tune; FusedLocationProvider already does this",
  },
  {
    id: "sd-30",
    type: "system-design",
    num: 30,
    difficulty: "H",
    star: false,
    section: "Mobile",
    title:
      "Design an Uber/Lyft mobile client — maps, driver tracking, and booking.",
    answer:
      "**What to draw:**\n\n```mermaid\nstateDiagram-v2\n  [*] --> Idle\n  Idle --> Searching : Request ride\n  Searching --> Matched : Driver accepts\n  Matched --> Arriving : Driver en route\n  Arriving --> InTrip : Pickup confirmed\n  InTrip --> Completed : Drop-off\n  Searching --> Idle : Cancel\n```\n\n**Key design decisions:**\n- Map: Google Maps SDK or Mapbox. Custom markers for driver positions. Tile caching for offline areas.\n- Driver tracking: WebSocket — location every 3s. Interpolate marker movement between GPS points for smooth animation. FCM as fallback if WebSocket drops.\n- State machine: persist current state in ViewModel + Room to survive rotation and backgrounding.\n- ETA: server-calculated and pushed via WebSocket. Never compute client-side.\n- Surge pricing: show multiplier before confirmation. Require explicit user tap to accept.\n- Fare estimate: call API when pickup and dropoff are set. Cache for 90 seconds, refresh before booking if expired.\n\n**Follow-up:** How do you handle WebSocket disconnection mid-trip?\n> Reconnect with exponential backoff. On reconnect, send last known state for full server resync. Show a connection indicator during the gap.\n\n**Red flags:**\n- HTTP polling for driver location (high latency, high server load)\n- No state machine — ad-hoc boolean flags cause inconsistent UI\n- Client-side ETA or fare calculation (drifts from server truth)",
    tags: ["mobile", "maps", "real-time", "websocket", "architecture"],
    related: ["sd-2", "sd-13"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Mobile client only, or also backend dispatch system?\n- Driver location update frequency?\n- Map SDK: Google Maps or Mapbox?\n- Surge pricing display — real-time or refreshed on demand?\n\n**Declared assumptions:**\n- Mobile client (rider side)\n- Driver location updates every 5 seconds via WebSocket\n- Google Maps SDK\n- Real-time ETA, surge pricing refreshed every 30s",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify scope: rider client only vs full system\n2. **(5–12 min)** Map display: Google Maps SDK, camera management, marker updates\n3. **(12–22 min)** Booking flow: ViewModel state machine → API → polling/WebSocket\n4. **(22–33 min)** Real-time driver tracking: WebSocket location updates, marker animation\n5. **(33–42 min)** Trade-offs: WebSocket vs polling, marker animation strategy\n6. **(42–45 min)** Edge cases: driver goes offline, network loss mid-trip",
    considerations:
      "- **State machine:** Model booking as explicit states: IDLE → REQUESTING → MATCHED → IN_TRIP → COMPLETED\n- **Marker animation:** Interpolate driver marker between GPS updates to avoid jank (ValueAnimator)\n- **Connection resilience:** Reconnect WebSocket on network change; pull missed updates via REST\n- **Battery during trip:** Reduce client GPS updates during trip (server tracks driver, not client)\n- **Surge pricing:** Cache surge multiplier locally; refresh every 30s via polling",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Driver updates | WebSocket (server push) | HTTP polling | WebSocket gives real-time updates without 5s polling lag |\n| Map SDK | Google Maps | Mapbox | Google Maps has better traffic data; Mapbox offers more customization |\n| Trip state | ViewModel state machine | Ad-hoc flags | State machine makes transitions explicit and testable |",
    alternatives:
      "**Alternative 1: HTTP polling for driver location instead of WebSocket**\n- Pros: Simpler, no long-lived connection management\n- Cons: 5s poll interval feels sluggish; wastes bandwidth on empty responses\n\n**Alternative 2: Server-Sent Events instead of WebSocket**\n- Pros: Simpler than WebSocket, HTTP/2 compatible\n- Cons: Uni-directional only; can't send cancellation over same channel",
  },
  {
    id: "sd-31",
    type: "system-design",
    num: 31,
    difficulty: "M",
    star: false,
    section: "Mobile",
    title:
      "Design deeplinks and universal links for mobile — attribution and deferred deeplinks.",
    answer:
      "**Expected Answer:**\n- URI scheme deeplinks: custom scheme app://product/123. Any app can intercept — no ownership verification.\n- App Links (Android) / Universal Links (iOS): HTTPS URLs verified against /.well-known/assetlinks.json (Android). Browser opens app if installed, falls back to web. Verified ownership prevents interception.\n- Deferred deeplinks: user taps link → app not installed → Play Store → installs → app opens to correct destination. Read via Play Install Referrer API on first launch.\n- Attribution: link carries campaign ID, source, medium. SDKs (Adjust, Branch, AppsFlyer) match install to click via fingerprinting or click ID.\n- onNewIntent(): handle deeplink arriving while app is already open. Parse URI and navigate via NavController. Avoid pushing duplicate screens.\n\n**Follow-up:** How do you handle a deeplink to an auth-gated screen?\n> Save the deeplink target before redirecting to login. After successful auth, navigate to the saved target and clear it.\n\n**Red flags:**\n- Only custom URI schemes (any app can intercept — security risk)\n- No deferred deeplink handling — new installs land on home screen instead of campaign destination\n- Ignores onNewIntent when app is already running",
    tags: ["mobile", "deeplinks", "navigation", "attribution"],
    related: ["sd-32", "sd-9", "tech-28", "tech-29"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Universal links (HTTPS-based) or custom URI schemes (`app://`) or both?\n- Deferred deep links (link before install)?\n- Attribution tracking (which campaign/source)?\n- Web fallback if app not installed?\n\n**Declared assumptions:**\n- Android App Links (HTTPS-based, verified) + fallback custom scheme\n- Deferred deep links via Firebase Dynamic Links or own server\n- Attribution: UTM params preserved through install\n- Web fallback to mobile web if app not installed",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: schemes, deferred links, attribution needs\n2. **(5–15 min)** Android App Links setup: `assetlinks.json`, intent filters, verification\n3. **(15–25 min)** In-app routing: parse link → dispatch to correct screen via NavController\n4. **(25–35 min)** Deferred deep links: server stores link params, retrieved post-install\n5. **(35–42 min)** Attribution: store UTM params in install referrer / server\n6. **(42–45 min)** Edge cases: link with expired auth, already-logged-in user vs guest",
    considerations:
      "- **Verification:** `assetlinks.json` must be at `/.well-known/assetlinks.json` with correct SHA-256\n- **Auth state:** Handle link when unauthenticated — save destination, redirect post-login\n- **Link expiry:** Parameterize expiry in link; check server-side on open\n- **Testing:** Use `adb shell am start -a android.intent.action.VIEW -d '<url>'` for testing\n- **Fallback chain:** App Link → custom scheme → browser → App Store",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Link type | Android App Links (HTTPS) | Custom URI scheme | App Links verified by OS; custom schemes can be intercepted by other apps |\n| Deferred links | Server-side storage | Firebase Dynamic Links | Own server avoids vendor lock-in; FDL is easier but adds dependency |\n| Routing | NavController + deep link args | Manual Intent parsing | NavController handles back stack correctly for deep links |",
    alternatives:
      "**Alternative 1: Firebase Dynamic Links (deprecated 2025)**\n- Pros: Deferred deep links + attribution out of the box\n- Cons: Firebase deprecated FDL; own solution required going forward\n\n**Alternative 2: Branch.io or AppsFlyer attribution SDK**\n- Pros: Rich attribution, A/B testing, cross-platform\n- Cons: Third-party SDK, data privacy concerns, cost",
  },
  {
    id: "sd-32",
    type: "system-design",
    num: 32,
    difficulty: "M",
    star: true,
    section: "Mobile",
    title: "Design a mobile app update and force-upgrade system.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Launch[App Launch] --> Check[GET /app/version]\n  Check --> Compare{Compare versions}\n  Compare -->|current >= min_version| Normal[Normal flow]\n  Compare -->|current < min_version| Force[Non-dismissible dialog]\n  Compare -->|update available| Soft[Soft update banner]\n  Force --> Store[Open Play Store]\n```\n\n**Key design decisions:**\n- Version check on every cold start. API returns: min_supported_version, latest_version, changelog, store_url.\n- Force upgrade: non-dismissible dialog when current < min_version. Only action is Open Store. Required when API contract breaks old clients.\n- Soft update: dismissible banner. Remind once per session. Never block core functionality.\n- In-App Update API (Android): flexible update (background download, prompt to install) vs immediate (blocks UI). Use immediate only for critical security fixes.\n- Phased rollout: increase min_version gradually (5% → 25% → 100%) to catch regressions before forcing all users.\n- Offline: if version check fails due to no network, allow access — never block on a network error.\n\n**Follow-up:** How do you force-upgrade only a subset of users?\n> Return min_version per user segment in the API response. Or gate force-upgrade behind a feature flag checked at the same endpoint.\n\n**Red flags:**\n- Blocks app on network failure — offline users cannot use the app\n- Version numbers hard-coded in app — requires a new release to change\n- Forces 100M users simultaneously with no phased rollout (Play Store traffic spike)",
    tags: ["mobile", "architecture", "deployment", "android-components"],
    related: ["sd-19", "sd-11"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Hard force upgrade (block app) or soft prompt?\n- Gradual rollout support?\n- How are minimum versions determined? (backend config or hardcoded?)\n- What if user is on poor network and can't update?\n\n**Declared assumptions:**\n- Server-driven config: minimum version + current version stored in remote config\n- Soft prompt for non-minimum versions, hard block for below-minimum\n- Gradual rollout: backend returns upgrade required flag per user segment\n- Grace period: 24h before hard block after minimum version bump",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: force vs soft, rollout strategy, grace period\n2. **(5–12 min)** Version check flow: app start → fetch remote config → compare versions\n3. **(12–22 min)** UI states: no prompt / soft prompt / hard block with Play Store CTA\n4. **(22–32 min)** Server config schema: `minVersion`, `recommendedVersion`, `message`, `graceUntil`\n5. **(32–42 min)** Edge cases: config fetch failure, offline user, downgrade protection\n6. **(42–45 min)** Trade-offs: polling vs push config, Firebase RC vs own backend",
    considerations:
      "- **Config fetch failure:** On network error, use cached config; never block update on config failure\n- **Offline graceful:** Don't hard-block if user can't reach config server — show retry\n- **API backward compat:** Maintain old API endpoints until `minVersion` bumps past that version\n- **Downgrade protection:** Server can reject requests from downgraded clients (version header check)\n- **A/B compatibility:** Freeze experiment assignments on version upgrade to avoid mid-experiment drift",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Config source | Remote config (Firebase RC / own) | Hardcoded | Remote config allows version bumps without app release |\n| Check timing | App foreground (every launch) | Background periodic | Foreground ensures check before use; background has lag |\n| Block type | Hard block below minVersion | Always soft prompt | Hard block protects against broken API clients |",
    alternatives:
      "**Alternative 1: Play Store In-App Updates API**\n- Pros: Native Android UI, flexible vs immediate update modes\n- Cons: Only works for Play Store distribution; no server-side control of minimum version\n\n**Alternative 2: Expo OTA / CodePush (React Native only)**\n- Pros: Instant updates without store review\n- Cons: Native apps can't use OTA; limited to JS bundle updates",
  },
  {
    id: "sd-33",
    type: "system-design",
    num: 33,
    difficulty: "M",
    star: true,
    section: "Frontend",
    title: "CSR vs SSR vs SSG vs ISR — when to choose each rendering strategy?",
    answer:
      "**Expected Answer:**\n- CSR (Client-Side Rendering): empty HTML + JS bundle, React renders in browser. Fast navigation after load. Slow initial paint — blank page until JS executes. Bad SEO. Best for: authenticated dashboards, internal tools.\n- SSR (Server-Side Rendering): server renders full HTML per request. Good SEO, good initial load. Server cost per request. Best for: personalized pages, real-time data.\n- SSG (Static Site Generation): HTML generated at build time, served from CDN. Fastest. Zero runtime server compute. Cannot personalize. Best for: marketing, docs, blogs.\n- ISR (Incremental Static Regeneration): SSG with background revalidation after TTL. Stale-while-revalidate at page level. Best for: product pages, news — mostly static but need periodic freshness.\n- Hydration: SSR/SSG pages must be hydrated client-side for interactivity. Ship only the JS needed.\n\n**Follow-up:** What is streaming SSR?\n> HTML sent in chunks — above-the-fold arrives first, rest streams in. Improves LCP without waiting for the entire page to render server-side.\n\n**Red flags:**\n- SSR for a static marketing page (wasted server compute on every request)\n- CSR for SEO-critical public pages (crawlers see empty HTML)\n- No awareness of hydration cost — ships a huge JS bundle to read-only users",
    tags: ["frontend", "performance", "architecture", "web"],
    related: ["sd-37", "sd-34"],
  },
  {
    id: "sd-34",
    type: "system-design",
    num: 34,
    difficulty: "M",
    star: false,
    section: "Frontend",
    title: "Design a web news feed with infinite scroll and virtualization.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Scroll --> Observer[Intersection Observer on sentinel]\n  Observer -->|sentinel visible| Fetch[Fetch next cursor page]\n  Fetch --> State[Append items to state]\n  State --> VList[Virtual list — render visible window only]\n  VList --> DOM[~20 DOM nodes regardless of list size]\n```\n\n**Key design decisions:**\n- Pagination: cursor-based — stable under real-time inserts. Offset pagination causes duplicates/skips as posts arrive.\n- Infinite scroll trigger: IntersectionObserver on a sentinel element at bottom. No scroll event listeners — eliminates jank.\n- Virtualization: render only visible items + small overscan. react-window or TanStack Virtual. Prevents DOM explosion at large list sizes.\n- Variable item heights: measure with ResizeObserver after render, cache heights to avoid reflow.\n- Skeleton screens: placeholder UI immediately — better perceived performance than a spinner.\n- New posts: sticky banner instead of injecting at top (avoids scroll position jump).\n\n**Follow-up:** How do you restore scroll position when user navigates back?\n> Store offset + item index in sessionStorage on navigation. Restore after items render. With virtualization, restore by item index not pixel offset.\n\n**Red flags:**\n- Scroll event listener with no throttle (main thread jank)\n- No virtualization — entire list rendered in DOM (unusable at > 500 items)\n- Offset pagination — duplicate or skipped items as new posts arrive",
    tags: ["frontend", "performance", "web", "ux"],
    related: ["sd-33", "sd-37"],
  },
  {
    id: "sd-35",
    type: "system-design",
    num: 35,
    difficulty: "M",
    star: true,
    section: "Frontend",
    title:
      "State management in web apps — Redux, Context, Zustand, React Query.",
    answer:
      "**Expected Answer:**\n- State types: UI state (modal open?), server/remote state (API data), form state, URL state. Each has different lifecycle — do not store all types in one global store.\n- Local state (useState): collocate as close to usage as possible. Easiest to reason about.\n- Context API: share state between siblings without prop drilling. Re-renders all consumers on change — split contexts or memoize value carefully.\n- Redux: predictable global store, time-travel debugging, strict unidirectional flow. Verbose. Best for complex apps with many interconnected slices.\n- Zustand: lightweight, no Provider, minimal boilerplate, subscribe to specific slices not the whole store.\n- React Query / SWR: purpose-built for server state. Caching, background refetch, stale-while-revalidate, deduplication. Replaces most useEffect data fetching.\n- Rule of thumb: React Query for server data + Zustand for client UI state beats Redux for everything.\n\n**Follow-up:** How do you prevent Context causing unnecessary re-renders?\n> Split into smaller, focused contexts. Memoize context value with useMemo. Or use Zustand — components subscribe only to the slice they use.\n\n**Red flags:**\n- Server data stored in Redux with manual loading/error/stale management (reinvents React Query)\n- Context for frequently-changing state (re-renders entire consumer tree)\n- Monolithic Redux store with no slice separation",
    tags: ["frontend", "state-management", "web", "architecture"],
    related: ["sd-33", "sd-38"],
  },
  {
    id: "sd-36",
    type: "system-design",
    num: 36,
    difficulty: "M",
    star: false,
    section: "Frontend",
    title: "Design a drag-and-drop file uploader for the web.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Drop[DnD or File Input] --> Validate[Validate type + size]\n  Validate --> Preview[URL.createObjectURL thumbnail]\n  Preview --> Chunk[Split into 5MB chunks]\n  Chunk --> Upload[Upload chunks in parallel x3]\n  Upload --> Progress[Aggregate progress bar]\n  Upload -->|chunk failure| Retry[Retry that chunk]\n  Progress --> Complete[Server assembles — return URL]\n```\n\n**Key design decisions:**\n- Drag events: ondragenter, ondragover (preventDefault to allow drop), ondrop. Support click-to-open file input for keyboard accessibility.\n- Validation: check file.type and file.size before upload. Show clear errors.\n- Preview: URL.createObjectURL for instant local thumbnail. Revoke on unmount to prevent memory leak.\n- Chunked upload: File.slice() into 5MB chunks. Upload 3 chunks in parallel. Allows pause, resume, and per-chunk retry.\n- Progress: XHR upload.onprogress per chunk (Fetch API lacks native upload progress). Aggregate for overall bar.\n- Presigned URLs: get per-chunk S3/GCS URL from server. Upload directly — API server never handles file bytes.\n\n**Follow-up:** How do you resume an interrupted upload?\n> Ask server for list of successfully received chunks. Skip those. Upload only missing chunks. Server merges when all chunks received.\n\n**Red flags:**\n- Single large request — fails for big files, no progress, no retry\n- Fetch for progress tracking (no native upload progress)\n- No file type validation — users can upload executables",
    tags: ["frontend", "web", "networking", "ux"],
    related: ["sd-10", "sd-33"],
  },
  {
    id: "sd-37",
    type: "system-design",
    num: 37,
    difficulty: "M",
    star: true,
    section: "Frontend",
    title:
      "Web performance — Core Web Vitals, lazy loading, and bundle splitting.",
    answer:
      "**Expected Answer:**\n- Core Web Vitals:\n  - LCP (Largest Contentful Paint): largest visible element renders. Target < 2.5s. Fix: preload hero image, CDN, SSR/SSG.\n  - INP (Interaction to Next Paint): responsiveness to input. Target < 200ms. Fix: break long tasks, defer non-critical JS, web workers for heavy compute.\n  - CLS (Cumulative Layout Shift): visual stability. Target < 0.1. Fix: explicit width/height on images and ads, avoid injecting content above existing content.\n- Code splitting: route-level splits (Next.js does this automatically). Dynamic import() for heavy libraries loaded on demand.\n- Lazy loading: images with loading=lazy. Components with React.lazy(). Only load what users will see.\n- Bundle optimization: tree shaking, minification, brotli compression at CDN. Analyze with webpack-bundle-analyzer.\n- Resource hints: <link rel=preload> for LCP image, rel=prefetch for next route, rel=dns-prefetch for third-party origins.\n- Images: WebP/AVIF (30-50% smaller than JPEG). srcset for responsive. Image CDN (Cloudinary, imgix) for auto-format and resize.\n\n**Follow-up:** How do you monitor Core Web Vitals in production?\n> PerformanceObserver API + web-vitals library in browser. Real User Monitoring (RUM) tools: Vercel Speed Insights, Datadog RUM. Lighthouse is lab-only — misses real user distribution and device variance.\n\n**Red flags:**\n- Optimizes Lighthouse score but ignores RUM data from real users\n- Eager-loads all routes and heavy components regardless of usage\n- No image optimization — 3MB JPEG for a thumbnail",
    tags: ["frontend", "performance", "web", "architecture"],
    related: ["sd-33", "sd-34"],
  },
  {
    id: "sd-38",
    type: "system-design",
    num: 38,
    difficulty: "H",
    star: false,
    section: "Frontend",
    title: "Design a real-time collaborative text editor (web client).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  User1[User 1 types] --> CRDT1[CRDT local apply]\n  CRDT1 -->|operation| WS[WebSocket Server]\n  WS -->|broadcast| CRDT2[CRDT merge]\n  CRDT2 --> User2[User 2 sees update]\n  WS --> Store[(Event Log)]\n```\n\n**Key design decisions:**\n- Conflict resolution: OT (Operational Transform) — transform concurrent ops, requires central server to order (Google Docs). CRDT (Yjs, Automerge) — converges without coordination, enables offline and peer-to-peer. Prefer CRDT for new systems.\n- Rich text: ProseMirror or Tiptap — operations are granular (insertText, splitNode, setMark).\n- Presence: broadcast cursor positions and selections via WebSocket. Color-coded per user. Throttle updates to 50ms.\n- Offline: CRDT state persisted in IndexedDB. Local edits on disconnect, merged automatically on reconnect.\n- Undo: local undo stack only. Peer operations do not appear in your history.\n- Optimistic local apply → server ack. On conflict, roll back and reapply transformed op.\n\n**Follow-up:** Why prefer CRDT over OT for new systems?\n> OT requires a central server to serialize and transform operations — hard to scale and decentralize. CRDT converges without a coordinator, enabling simpler offline and P2P sync.\n\n**Red flags:**\n- Last-write-wins on full document text (wipes concurrent edits)\n- No presence indicators — users unknowingly edit the same region\n- No offline support — disconnection loses all in-progress work",
    tags: ["frontend", "real-time", "collaboration", "web"],
    related: ["sd-2", "sd-35"],
  },
  {
    id: "sd-39",
    type: "system-design",
    num: 39,
    difficulty: "M",
    star: false,
    section: "Frontend",
    title: "Design a design system and component library.",
    answer:
      "**Expected Answer:**\n- Design tokens: primitive values (colors, spacing, radii, shadows) as CSS custom properties. Components use tokens, not hardcoded values — theming works by swapping the semantic layer.\n- Token hierarchy: primitives (blue-500) → semantic (color-action-primary = blue-500) → component (button-bg = color-action-primary).\n- Component API: composition over configuration. ButtonBase + ButtonIcon instead of Button with 20 props. Fewer props = more flexible.\n- Variants: cva (class-variance-authority) generates class combinations. Avoids complex conditional logic inside components.\n- Documentation: Storybook for interactive explorer. Stories cover all variants, interaction states, and accessibility notes.\n- Versioning: semver. Breaking changes = major bump. Provide jscodeshift codemods for automated consumer migrations. Changelog per release.\n- Accessibility: ARIA roles, keyboard nav, focus management ship with every component. Tested with axe-core in CI.\n\n**Follow-up:** How do you handle a breaking prop rename across many consuming apps?\n> Deprecate old prop with console.warn, support both for one major version, then remove. Codemod (jscodeshift) auto-migrates consumers. Give at least 2 minor version advance notice.\n\n**Red flags:**\n- Hardcoded color values in components — theming is impossible\n- No Storybook — teams cannot discover or verify component behavior\n- Accessibility added later — retrofitting ARIA is far harder than building it in from the start",
    tags: ["frontend", "design-system", "architecture", "web"],
    related: ["sd-37", "sd-40"],
  },
  {
    id: "sd-40",
    type: "system-design",
    num: 40,
    difficulty: "M",
    star: false,
    section: "Frontend",
    title: "Web security fundamentals — XSS, CSRF, CORS, and secure cookies.",
    answer:
      "**Expected Answer:**\n- XSS (Cross-Site Scripting): attacker injects JS into page. Prevention: escape all user-generated content before rendering (textContent not innerHTML). Content-Security-Policy header restricts allowed script sources.\n- CSRF (Cross-Site Request Forgery): malicious site triggers an authenticated request on victim's behalf. Prevention: SameSite=Strict or Lax cookies (browser blocks cross-site sends). Double-submit CSRF token for APIs supporting cross-site.\n- CORS: browsers block cross-origin requests by default. Server opts in with Access-Control-Allow-Origin. Never use wildcard (*) with credentials.\n- Secure cookies: HttpOnly (no JS access — XSS cannot steal), Secure (HTTPS only), SameSite, Max-Age.\n- Auth tokens in cookies vs localStorage: HttpOnly cookies are inaccessible to JS. XSS can read localStorage and steal tokens.\n- HTTPS + HSTS (Strict-Transport-Security header): prevents downgrade attacks.\n\n**Follow-up:** Should auth tokens go in localStorage or cookies?\n> Cookies with HttpOnly + SameSite are safer. XSS reads localStorage and steals tokens. HttpOnly cookies are JS-inaccessible. Trade-off: cookies sent on every request (mitigate CSRF with SameSite).\n\n**Red flags:**\n- innerHTML with user-generated content (XSS)\n- No SameSite attribute on session cookies (CSRF)\n- JWT in localStorage with no XSS mitigation",
    tags: ["frontend", "security", "web", "auth"],
    related: ["sd-9", "sd-41"],
  },
  {
    id: "sd-41",
    type: "system-design",
    num: 41,
    difficulty: "M",
    star: false,
    section: "Frontend",
    title:
      "Design a Progressive Web App (PWA) — offline, installability, push notifications.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  App --> SW[Service Worker]\n  SW -->|cache-first| Cache[Cache Storage]\n  Cache -->|miss| Network\n  Network --> Cache\n  SW --> BgSync[Background Sync queue]\n  BgSync -->|online| API\n  PushServer --> SW\n  SW --> Notification[System Notification]\n```\n\n**Key design decisions:**\n- Service Worker: intercepts network requests. Strategies: cache-first (offline + fast), network-first (fresh data preferred), stale-while-revalidate (instant + async update).\n- App Manifest: manifest.json with name, icons, start_url, display:standalone. Required for Add to Home Screen prompt.\n- Background Sync: queue failed writes (form submissions, likes) via SyncManager. Service Worker replays them on reconnect.\n- Web Push: server sends via Web Push Protocol → browser delivers to Service Worker even when site is closed. Requires Notification permission.\n- IndexedDB for complex offline data (structured, transactional — unlike localStorage).\n\n**Follow-up:** How do you update a Service Worker without breaking active users?\n> New SW waits in skipWaiting state until all tabs close. Or call skipWaiting() + clients.claim() immediately (risks serving new SW with stale cache). Show an update-available banner prompting a reload.\n\n**Red flags:**\n- Service Worker with no caching strategy — overhead with no benefit\n- App shows broken UI offline with no fallback\n- No manifest — app is not installable from the browser",
    tags: ["frontend", "pwa", "offline", "web"],
    related: ["sd-33", "sd-40"],
  },
  {
    id: "sd-42",
    type: "system-design",
    num: 42,
    difficulty: "M",
    star: true,
    section: "Frontend",
    title:
      "Microfrontends — architecture patterns, module federation, trade-offs.",
    answer:
      "**Expected Answer:**\n- Problem: large teams on one frontend monolith — deployment coupling, long build times, team coordination overhead.\n- Patterns:\n  - iframe: maximum isolation, independent deploy. Poor UX (no shared routing, separate scroll, postMessage comms).\n  - Web Components: Custom Elements encapsulate features in any framework. Shadow DOM for style isolation. Standard browser API.\n  - Module Federation (Webpack 5): each MFE exposes modules as remotes. Shell app loads them at runtime from CDN. Shared libs (React, design system) deduped via singleton config.\n  - Single-SPA: orchestrates multiple SPAs. Route-based activation.\n- Shared concerns: auth (shared cookie or custom event), design system (shared npm package or MF remote), routing (shell owns top-level routes, MFEs own sub-routes).\n- Trade-offs: independent deployment and team autonomy vs bundle duplication risk, coordination on API contracts, harder cross-MFE debugging, style conflicts.\n- When NOT to use: small teams, single product — overhead kills velocity.\n\n**Follow-up:** How do you prevent version conflicts when MFEs share React?\n> Module Federation singleton: mark React as shared + singleton:true + requiredVersion. Webpack negotiates one version. Mismatched major versions raise a warning — teams must align.\n\n**Red flags:**\n- Ships React in every MFE bundle (massive duplicate download)\n- No shared design system — inconsistent UI across MFEs\n- Microfrontends for a 3-person team (coordination cost eliminates all benefit)",
    tags: ["frontend", "architecture", "web", "scalability"],
    related: ["sd-39", "sd-33"],
  },
  {
    id: "sd-43",
    type: "system-design",
    num: 43,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "HTTP/1.1 vs HTTP/2 vs HTTP/3 — what changed and why it matters.",
    answer:
      "**Expected Answer:**\n- HTTP/1.1: one request per TCP connection (pipelining broken in practice). Head-of-line blocking. Repeated text headers. Browsers open ~6 parallel connections per host as workaround.\n- HTTP/2: multiplexing — N requests over one TCP connection. Binary framing. HPACK header compression. Eliminates connection overhead. Still has TCP-level HOL blocking.\n- HTTP/3: QUIC replaces TCP. UDP-based with per-stream reliability. A lost packet blocks only its own stream, not others. 0-RTT reconnection. Ideal for mobile (handles IP changes via connection ID, not IP:port).\n- Mobile impact: HTTP/2 reduces connections and battery drain. HTTP/3 maintains sessions across WiFi-to-LTE switches.\n\n**Follow-up:** Why does HTTP/2 still have head-of-line blocking?\n> HTTP/2 multiplexes logical streams over one TCP connection. TCP delivers bytes in order — one lost packet stalls all streams until retransmitted. QUIC gives each stream independent reliability, so loss only blocks the affected stream.\n\n**Red flags:**\n- Claims HTTP/2 fully eliminates head-of-line blocking\n- No awareness of QUIC or why it uses UDP as transport\n- Cannot connect protocol choice to real-world mobile latency or battery impact",
    tags: ["networking", "protocols", "performance", "mobile"],
    related: ["sd-44", "sd-5"],
  },
  {
    id: "sd-44",
    type: "system-design",
    num: 44,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "REST vs GraphQL vs gRPC — when to use each.",
    answer:
      "**Expected Answer:**\n- REST: resource-based URLs, stateless, HTTP verbs, cacheable GETs. Problem: over-fetching (too many fields) and under-fetching (multiple round-trips for related data).\n- GraphQL: client specifies exact fields, single endpoint. Eliminates over/under-fetch. Harder to cache (POST by default). N+1 problem server-side — solve with DataLoader batching.\n- gRPC: binary Protocol Buffers (3-10x smaller than JSON), HTTP/2, strongly typed, bidirectional streaming, low latency. Requires codegen. Poor browser support without gRPC-web.\n- Choose: REST for public APIs and simple CRUD. GraphQL for mobile/web with diverse data requirements per view. gRPC for internal service-to-service where performance matters.\n\n**Follow-up:** How does DataLoader solve the N+1 problem?\n> DataLoader batches and deduplicates DB calls within a single request tick. Multiple resolvers requesting the same entity are coalesced into one query.\n\n**Red flags:**\n- gRPC for public-facing APIs without acknowledging browser support limitations\n- GraphQL caching treated the same as REST (field-level caching requires extra tooling)\n- REST as default without recognizing when GraphQL eliminates meaningful round-trips",
    tags: ["api", "networking", "protocols", "architecture"],
    related: ["sd-43", "sd-5"],
  },
  {
    id: "sd-45",
    type: "system-design",
    num: 45,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "How does DNS resolution work end-to-end?",
    answer:
      "**What to draw:**\n\n```mermaid\nsequenceDiagram\n  participant App\n  participant OS as OS Cache\n  participant ISP as Recursive Resolver\n  participant Root as Root NS\n  participant TLD as TLD NS .com\n  participant Auth as Authoritative NS\n  App->>OS: lookup api.example.com\n  OS->>ISP: recursive query (cache miss)\n  ISP->>Root: where is .com?\n  Root-->>ISP: TLD NS address\n  ISP->>TLD: where is example.com?\n  TLD-->>ISP: Authoritative NS address\n  ISP->>Auth: api.example.com?\n  Auth-->>ISP: IP + TTL\n  ISP-->>App: IP address\n```\n\n**Key design decisions:**\n- TTL controls cache lifetime. Low TTL = faster failover, more queries. High TTL = fewer queries, slower propagation.\n- Recursive resolver caches — most requests never reach root servers.\n- GeoDNS: authoritative NS returns different IPs based on client resolver location. Used by CDNs.\n- Anycast: same IP announced from multiple PoPs. BGP routes to nearest location.\n\n**Follow-up:** How does a CDN route users to the nearest edge?\n> GeoDNS: authoritative NS returns closest edge IP. Or Anycast: same IP announced globally, network routes to nearest PoP.\n\n**Red flags:**\n- DNS is just a static lookup table with no caching layers\n- No awareness of TTL and its effect on failover speed\n- Thinks DNS is purely centralized",
    tags: ["networking", "dns", "infrastructure", "performance"],
    related: ["sd-43", "sd-54"],
  },
  {
    id: "sd-46",
    type: "system-design",
    num: 46,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "SQL vs NoSQL — when to use each and what are the trade-offs?",
    answer:
      "**Expected Answer:**\n- SQL: ACID transactions, enforced schema, JOINs, vertical scaling. Use for: financial data, complex queries, referential integrity.\n- NoSQL types:\n  - Document (MongoDB): flexible schema, nested objects, hierarchical data\n  - Key-value (Redis): O(1) reads, ephemeral or persistent\n  - Wide-column (Cassandra): write-optimized, high throughput, eventual consistency\n  - Graph (Neo4j): relationship traversal, social graphs\n- SQL trade-offs: rigid schema (migrations are painful), vertical scale ceiling, slower high-volume writes.\n- NoSQL trade-offs: eventual consistency by default, limited query flexibility, no JOINs.\n- Rule of thumb: ACID transactions + complex queries → SQL. Massive write throughput or flexible schema → NoSQL.\n- Polyglot persistence: PostgreSQL for orders (ACID), Redis for sessions, Elasticsearch for search, Cassandra for time-series events.\n\n**Follow-up:** Can you use SQL and NoSQL in the same system?\n> Yes — polyglot persistence. Each store optimized for its access pattern. Trade-off: operational complexity and ensuring eventual consistency across stores.\n\n**Red flags:**\n- NoSQL is always faster (depends entirely on access pattern)\n- No mention of ACID vs eventual consistency trade-off\n- Picks NoSQL without identifying the access pattern that justifies it",
    tags: ["databases", "storage", "architecture", "scalability"],
    related: ["sd-47", "sd-48", "sd-50"],
  },
  {
    id: "sd-47",
    type: "system-design",
    num: 47,
    difficulty: "H",
    star: false,
    section: "Infrastructure",
    title: "Database indexing — B-tree vs LSM tree, when does each shine?",
    answer:
      "**Expected Answer:**\n- B-tree (PostgreSQL, MySQL): balanced tree, leaf nodes hold sorted data. O(log N) reads and writes. Excellent for range queries and point lookups. In-place updates. Read-optimized.\n- LSM tree (Cassandra, RocksDB, LevelDB): writes go to in-memory memtable → flush to sorted SSTables on disk → periodic compaction. Sequential writes = extremely high throughput. Reads must merge multiple SSTables (read amplification). Write-optimized.\n- Index types: primary/clustered (data stored with index), secondary (separate structure pointing to rows). Compound index on (col1, col2) accelerates WHERE col1=? AND WHERE col1=? AND col2=?, but not WHERE col2=? alone.\n- Covering index: index includes all query columns — no table lookup needed.\n- Index cost: faster reads, slower writes (maintained on every mutation), extra disk.\n\n**Follow-up:** When should you NOT add an index?\n> Low-cardinality columns (boolean), small tables (full scan cheaper than index overhead), write-heavy tables where index maintenance dominates cost.\n\n**Red flags:**\n- Index every column by default\n- No understanding of B-tree depth and how it relates to query cost\n- Cannot explain LSM write vs read amplification trade-off",
    tags: ["databases", "storage", "performance", "architecture"],
    related: ["sd-46", "sd-8"],
  },
  {
    id: "sd-48",
    type: "system-design",
    num: 48,
    difficulty: "H",
    star: true,
    section: "Infrastructure",
    title: "Database sharding — strategies and trade-offs.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Client --> Router[Shard Router]\n  Router -->|hash 0| S0[(Shard 0)]\n  Router -->|hash 1| S1[(Shard 1)]\n  Router -->|hash 2| S2[(Shard 2)]\n```\n\n**Key design decisions:**\n- Range sharding: split by value range (user_id 0-1M → Shard 0). Simple, range queries work. Hotspot risk if recent data dominates traffic.\n- Hash sharding: hash(key) % N. Even distribution. Cross-shard range queries require scatter-gather to all shards.\n- Directory sharding: lookup table maps key → shard. Flexible rebalancing but directory is a bottleneck.\n- Shard key: high cardinality, even distribution, rarely changes. user_id is usually good; timestamp creates write hotspots.\n- Cross-shard problems: JOINs require application-side merge. Distributed transactions need 2PC or saga. Rebalancing requires data migration.\n- Consistent hashing minimizes data movement when adding shards.\n\n**Follow-up:** How do you handle a celebrity causing a hot shard?\n> Sub-shard: append random suffix (user:0, user:1, ..., user:N) to spread across multiple shards. Fan-in results at read time.\n\n**Red flags:**\n- Monotonically increasing timestamp as shard key (write hotspot on latest shard)\n- No plan for cross-shard JOINs\n- No rebalancing strategy when a shard fills up",
    tags: ["databases", "scalability", "architecture", "distribution"],
    related: ["sd-46", "sd-51", "sd-50"],
  },
  {
    id: "sd-49",
    type: "system-design",
    num: 49,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "Database replication — leader/replica, sync vs async.",
    answer:
      "**Expected Answer:**\n- Leader-follower: all writes to leader, replicated to followers. Followers serve reads. On leader failure, promote a follower.\n- Sync replication: leader waits for at least one replica to ack before responding. No data loss on failover. Higher write latency.\n- Async replication: leader responds immediately, replication is background. Lower latency. Replication lag = reads from replica may be stale. Data loss risk if leader dies before replicating.\n- Multi-leader: multiple nodes accept writes. Conflict resolution required (last-write-wins, CRDTs). Useful for multi-region active-active.\n- Leaderless (Dynamo-style): any node accepts writes. Quorum (R + W > N) for read consistency. High availability, eventual consistency.\n- Read-your-writes: after writing to leader, route immediate read to leader or wait for replica lag.\n\n**Follow-up:** How do you read your own writes when reads go to a replica?\n> Route reads to the leader for a short window after writes. Or track replication position and wait. Or use sticky sessions routing same user to same replica.\n\n**Red flags:**\n- Assumes replica data is always current (ignores replication lag)\n- No failover strategy or leader election mechanism\n- Conflates replication (HA/read scaling) with sharding (write scaling)",
    tags: ["databases", "scalability", "consistency", "architecture"],
    related: ["sd-46", "sd-50", "sd-48"],
  },
  {
    id: "sd-50",
    type: "system-design",
    num: 50,
    difficulty: "H",
    star: true,
    section: "Infrastructure",
    title: "CAP Theorem — explain with real-world examples.",
    answer:
      "**Expected Answer:**\n- CAP: a distributed system can guarantee at most 2 of 3:\n  - Consistency (C): every read gets the most recent write or an error\n  - Availability (A): every request receives a response (not necessarily latest)\n  - Partition Tolerance (P): system continues despite network partition between nodes\n- Network partitions are unavoidable — you must tolerate P. The real choice during a partition is C vs A.\n- CP systems: return error rather than stale data. ZooKeeper, HBase, etcd. Use for: financial transactions, distributed locks.\n- AP systems: return potentially stale data. Cassandra, DynamoDB, CouchDB. Use for: social feeds, DNS, shopping carts.\n- PACELC extends CAP: even in steady state (no partition), choose between latency (L) and consistency (C).\n\n**Follow-up:** What does eventual consistency mean precisely?\n> Given no new writes, all nodes will converge to the same value eventually. Reads may be stale during the convergence window — not the same as no guarantees at all.\n\n**Red flags:**\n- All three properties can be guaranteed simultaneously in a distributed system\n- Applies CAP to steady-state behavior instead of specifically to partition scenarios\n- Cannot name a real system in each category with its rationale",
    tags: ["distributed-systems", "consistency", "scalability", "architecture"],
    related: ["sd-49", "sd-51", "sd-46"],
  },
  {
    id: "sd-51",
    type: "system-design",
    num: 51,
    difficulty: "H",
    star: true,
    section: "Infrastructure",
    title:
      "Consistent hashing — how it works and why distributed systems use it.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  subgraph Ring[Hash Ring 0 to 2^32]\n    K1[Key A pos 10] -->|clockwise| S1[Server 1 pos 25]\n    K2[Key B pos 40] -->|clockwise| S2[Server 2 pos 75]\n    K3[Key C pos 80] -->|clockwise| S3[Server 3 pos 150]\n  end\n```\n\n**Key design decisions:**\n- Problem: hash(key) % N remaps nearly all keys when N changes. Adding one server reshuffles everything.\n- Solution: hash ring — servers and keys share a circular space. Key assigned to first server clockwise.\n- Adding a server: only keys between new server and its predecessor move. Average 1/N keys relocate.\n- Virtual nodes: each physical server gets K positions on ring. Better load balance. Weighted by capacity. More vnodes = smoother redistribution.\n- Used in: Cassandra (vnodes), Memcached, Riak, Amazon DynamoDB, CDN routing.\n\n**Follow-up:** What problem do virtual nodes solve?\n> Without vnodes, a new server takes one large range from one neighbor. Vnodes take small slices from many neighbors — smoother redistribution and better balance on heterogeneous hardware.\n\n**Red flags:**\n- Cannot explain why modulo hashing breaks when topology changes\n- No mention of virtual nodes or their purpose\n- Cannot name a production system that uses consistent hashing",
    tags: ["distributed-systems", "scalability", "caching", "architecture"],
    related: ["sd-50", "sd-48", "sd-55"],
  },
  {
    id: "sd-52",
    type: "system-design",
    num: 52,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "Horizontal vs vertical scaling — when to choose each.",
    answer:
      "**Expected Answer:**\n- Vertical (scale up): bigger machine — more CPU, RAM, faster disk. Simple, no code changes. Hardware ceiling. Single point of failure. Expensive at high end.\n- Horizontal (scale out): more machines. Effectively unlimited. Requires stateless services or distributed state management. Needs a load balancer. More operational complexity.\n- Stateless services: trivially horizontal — any instance handles any request.\n- Stateful services: need session stickiness, distributed cache, or consistent hashing to route correctly.\n- Database: vertical first, then read replicas, then sharding (most complex).\n- Auto-scaling: scale out when CPU > 70%, scale in at < 20%. Account for JVM warm-up time.\n\n**Follow-up:** When is vertical scaling actually better?\n> Single-threaded bottleneck (complex DB joins), distributed coordination overhead exceeds benefit, or current scale doesn't yet justify distributed system complexity.\n\n**Red flags:**\n- Always horizontal without considering stateful complexity\n- No mention of auto-scaling or scale-in\n- Database and stateless API scaling treated identically",
    tags: [
      "scalability",
      "architecture",
      "infrastructure",
      "distributed-systems",
    ],
    related: ["sd-48", "sd-50", "sd-53"],
  },
  {
    id: "sd-53",
    type: "system-design",
    num: 53,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "Load balancing algorithms — how they work and when to choose each.",
    answer:
      "**Expected Answer:**\n- Round-robin: distribute in rotation. Simple. Assumes equal capacity and equal request cost.\n- Weighted round-robin: servers have capacity weights. 4-core gets 2x traffic vs 2-core.\n- Least connections: route to server with fewest active connections. Best for variable-duration requests.\n- IP hash / consistent hash: same client always hits same server. Session stickiness. Breaks when server count changes.\n- Random with two choices: pick 2 random servers, route to less loaded. Near-optimal distribution with minimal overhead.\n- Health checks: active (LB pings /health) and passive (remove servers returning 5xx). Essential before routing.\n- L4 vs L7: L4 routes by IP:port (fast, no TLS). L7 routes by URL/header/cookie — enables A/B routing, canary, SSL termination.\n\n**Follow-up:** How do you achieve session stickiness without IP hashing?\n> Sticky cookie — LB sets a cookie with server ID on first response. Subsequent requests include the cookie, LB routes to that server. More resilient than IP hash (works behind NAT, handles rebalancing).\n\n**Red flags:**\n- Only knows round-robin\n- Confuses L4 and L7 load balancers\n- No health checks — routes traffic to unhealthy instances",
    tags: ["infrastructure", "scalability", "networking", "architecture"],
    related: ["sd-52", "sd-54", "sd-57"],
  },
  {
    id: "sd-54",
    type: "system-design",
    num: 54,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "How does a CDN work, and when should you use one?",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  User -->|GeoDNS to nearest edge| Edge[CDN Edge Node]\n  Edge -->|cache hit| User\n  Edge -->|cache miss| Origin[Origin Server]\n  Origin --> Edge\n  Edge --> User\n```\n\n**Key design decisions:**\n- CDN distributes content to global edge nodes. DNS resolves to nearest edge via GeoDNS or Anycast.\n- Pull CDN: edge fetches from origin on first miss, caches with TTL. Zero pre-config, popular content cached automatically.\n- Push CDN: proactively upload content to edges. Good for large predictable assets (game files, firmware).\n- Cache invalidation: wait for TTL expiry, or explicit purge via CDN API. Versioned URLs (bundle.v2.js) give instant invalidation without purge.\n- Use CDN for: static assets, video streams, large downloads, DDoS absorption (edge absorbs volumetric traffic before origin).\n- Do not use CDN for: personalized responses, write APIs, real-time dynamic data.\n\n**Follow-up:** How does a CDN help absorb a DDoS attack?\n> Edge nodes have Tbps of aggregate capacity. Volumetric attacks are absorbed at edge with rate limiting. Origin IP remains hidden and never receives attack traffic.\n\n**Red flags:**\n- Thinks CDN only serves static files (modern CDNs do dynamic acceleration and edge compute)\n- No cache invalidation strategy — serves stale content indefinitely\n- Unaware of pull vs push distinction",
    tags: ["infrastructure", "caching", "networking", "performance"],
    related: ["sd-7", "sd-45", "sd-55"],
  },
  {
    id: "sd-55",
    type: "system-design",
    num: 55,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "Redis vs Memcached — cache patterns and when to choose each.",
    answer:
      "**Expected Answer:**\n- Memcached: simple key-value, multi-threaded, in-memory only, no persistence, no complex data structures. Pure throughput.\n- Redis: rich data structures (strings, hashes, lists, sorted sets, streams), optional persistence (RDB snapshots, AOF log), pub/sub, Lua, cluster mode. Preferred for almost all new systems.\n- Cache patterns:\n  - Cache-aside (lazy loading): app checks cache → miss → read DB → populate cache. Most common. Tolerates cache failure.\n  - Write-through: write cache + DB simultaneously. Always fresh. Higher write latency.\n  - Write-behind: write cache, async flush to DB. Lowest latency. Data loss if cache crashes before flush.\n  - Stale-while-revalidate: serve stale immediately, fetch update in background.\n- Cache stampede: many keys expire together → all miss → flood origin. Fix: TTL jitter, Redis SETNX mutex on first miss, probabilistic early expiry.\n\n**Follow-up:** What Redis data structure for a leaderboard?\n> Sorted Set (ZSET). ZADD leaderboard score user_id. ZREVRANK for rank. O(log N) updates and rank queries.\n\n**Red flags:**\n- Confusion between cache-aside and read-through\n- No stampede protection on cache expiry\n- Memcached when pub/sub, persistence, or rich data types are needed",
    tags: ["caching", "infrastructure", "redis", "performance"],
    related: ["ds-23", "sd-51", "sd-54", "sd-7"],
  },
  {
    id: "sd-56",
    type: "system-design",
    num: 56,
    difficulty: "H",
    star: false,
    section: "Infrastructure",
    title: "Message queues — Kafka vs RabbitMQ, when to use a queue.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Producer --> Queue[Message Queue]\n  Queue -->|consumer group A| SvcA[Email Service]\n  Queue -->|consumer group B| SvcB[Analytics]\n  Queue -->|after N retries| DLQ[Dead Letter Queue]\n```\n\n**Key design decisions:**\n- Use a queue for: decoupling services, async processing, absorbing traffic spikes, guaranteed delivery, fan-out to multiple independent consumers.\n- Kafka: distributed commit log. Messages persisted and replayable. Consumer groups maintain independent offsets. Millions/sec throughput. Ordered per partition. Built for event streaming.\n- RabbitMQ: traditional broker. Push delivery. Complex routing (exchanges: direct, topic, fanout). Message TTL and priority queues. Messages deleted after consumption.\n- Kafka when: event streaming, analytics pipelines, event sourcing, audit log, multiple independent consumers at different rates.\n- RabbitMQ when: task queues (each message processed once), complex routing logic, short-lived messages with TTL.\n- Dead letter queue (DLQ): messages that fail after N retries for manual inspection.\n- Consumers must be idempotent — queues guarantee at-least-once, not exactly-once.\n\n**Follow-up:** How do you get exactly-once in Kafka?\n> Producer idempotency deduplicates retries. Transactions group produce + consumer offset commit atomically. But this is expensive — design idempotent consumers and accept at-least-once instead.\n\n**Red flags:**\n- Queue for synchronous request-response (adds latency with no decoupling benefit)\n- Assumes exactly-once without handling duplicate messages\n- Kafka for a simple task queue (operational complexity with no benefit)",
    tags: [
      "messaging",
      "infrastructure",
      "architecture",
      "distributed-systems",
    ],
    related: ["sd-57", "sd-59", "sd-6"],
  },
  {
    id: "sd-57",
    type: "system-design",
    num: 57,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "API Gateway — what it does and when you need one.",
    answer:
      "**Expected Answer:**\n- Single entry point for all clients. Routes to appropriate backend services.\n- Functions: routing, auth (JWT validation, API key), rate limiting, SSL termination, request/response transformation, caching, logging, metrics.\n- Benefits: backend services are independently evolvable, cross-cutting concerns centralized, clients talk to one host.\n- Trade-offs: extra network hop (~1-5ms), single point of failure if not HA, bottleneck if overloaded.\n- vs Reverse Proxy: a proxy routes; a gateway also authenticates, rate limits, transforms.\n- vs Service Mesh: gateway handles North-South traffic (client to backend). Service mesh handles East-West (service to service) via sidecar proxies — complementary.\n\n**Follow-up:** Kong vs AWS API Gateway — when to choose?\n> Kong: open-source, self-hosted, plugin ecosystem, full control — good when you need customization. AWS API Gateway: fully managed, Lambda-friendly, usage-based pricing — good in AWS ecosystems. Managed cost scales with traffic.\n\n**Red flags:**\n- Confuses API gateway with load balancer (LB is transport layer; gateway is application layer)\n- Does not mention auth or rate limiting as gateway responsibilities\n- No awareness of latency overhead and the single point of failure risk",
    tags: ["infrastructure", "api", "architecture", "networking"],
    related: ["sd-53", "sd-58", "sd-6"],
  },
  {
    id: "sd-58",
    type: "system-design",
    num: 58,
    difficulty: "H",
    star: true,
    section: "Infrastructure",
    title: "Microservices vs Monolith — trade-offs and when to split.",
    answer:
      "**Expected Answer:**\n- Monolith: single deployable unit. Simple to develop, test, debug, deploy. Fast in-process calls. Tight coupling, hard to scale parts independently, large team coordination, long build cycles.\n- Microservices: independent deployment and scaling, polyglot, team autonomy. Distributed system complexity — network failures, latency, eventual consistency, distributed tracing needed.\n- Rule: start monolith. Extract when you feel the pain — team grows (Conway's Law), deployment is the bottleneck, scaling needs diverge per component.\n- Strangler fig: route new requests to service via API gateway, old code handles the rest. Extract incrementally.\n- Communication: sync (REST/gRPC — simple but couples availability) vs async (queue — decoupled but eventual consistency).\n- Data: each service owns its database. Shared DB = tight coupling, defeats the purpose.\n\n**Follow-up:** How do you handle transactions spanning multiple services?\n> Saga pattern. Choreography: each service reacts to events. Orchestration: a coordinator calls each service. Compensating transactions undo previous steps on failure.\n\n**Red flags:**\n- Microservices for a new product (distributed complexity before domain is understood)\n- Shared database across services (tight coupling)\n- No distributed tracing — debugging across services becomes impossible",
    tags: [
      "architecture",
      "microservices",
      "scalability",
      "distributed-systems",
    ],
    related: ["sd-59", "sd-56", "sd-57"],
  },
  {
    id: "sd-59",
    type: "system-design",
    num: 59,
    difficulty: "H",
    star: false,
    section: "Infrastructure",
    title: "Event-driven architecture — event sourcing and CQRS.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Command --> WriteModel[Write Model]\n  WriteModel --> EventStore[Event Store]\n  EventStore --> Projector[Projection Worker]\n  Projector --> ReadModel[Read Model]\n  Query --> ReadModel\n  EventStore --> OtherServices[Other Services]\n```\n\n**Key design decisions:**\n- Event sourcing: store events not state. Reconstruct by replaying. Natural audit log, time-travel debugging. Snapshot for performance on long-lived entities.\n- CQRS: separate write model (enforces invariants) from read model (optimized for query patterns). Read model is a denormalized projection updated async. Independent scaling.\n- Event-driven: services publish/subscribe to events. Decoupled — publisher does not know subscribers. Kafka as event bus.\n- When to use: complex domain with audit requirements, high read/write ratio mismatch, eventual consistency acceptable in read model.\n- Avoid when: simple CRUD, team unfamiliar with eventual consistency.\n\n**Follow-up:** How do you handle UI eventual consistency?\n> Optimistic UI — apply command result immediately client-side. Show pending indicator if read model lags. Roll back on server error.\n\n**Red flags:**\n- Event sourcing for simple CRUD (massive complexity for no benefit)\n- Forgets the CQRS read model is eventually consistent\n- No snapshots — replaying millions of events to reconstruct state on every load",
    tags: ["architecture", "events", "cqrs", "distributed-systems"],
    related: ["sd-58", "sd-56", "sd-18"],
  },
  {
    id: "sd-60",
    type: "system-design",
    num: 60,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "Circuit breaker pattern — preventing cascading failures.",
    answer:
      "**What to draw:**\n\n```mermaid\nstateDiagram-v2\n  [*] --> Closed\n  Closed --> Open : failure rate exceeds threshold\n  Open --> HalfOpen : timeout expires\n  HalfOpen --> Closed : probe call succeeds\n  HalfOpen --> Open : probe call fails\n```\n\n**Key design decisions:**\n- Problem: service A calls slow/unavailable service B. A threads block waiting. Thread pool fills. A degrades. Upstream callers back up. Cascading failure.\n- Closed: calls pass through, track failure rate.\n- Open: immediately return error or fallback — no calls to B. Gives B time to recover.\n- Half-open: after timeout, allow one probe call. Success → Closed. Fail → Open.\n- Fallback: return cached result, default value, or degraded response. Never just throw an empty error.\n- Always set timeouts — unbounded waits cause cascading failures even without a circuit breaker.\n- Resilience4j for Java/Kotlin.\n\n**Follow-up:** How do you tune the failure threshold?\n> Use failure rate over a sliding time window (not absolute count). Start conservative (open at 60% failure rate over 10s). Tune to avoid false positives on legitimate traffic spikes.\n\n**Red flags:**\n- Circuit breaker with no fallback — just re-throws the error\n- No timeout on outbound calls — circuit breaker helps, but slow calls still block threads\n- Threshold too sensitive — opens on a brief traffic spike",
    tags: ["architecture", "resilience", "distributed-systems", "networking"],
    related: ["sd-58", "sd-6", "sd-57"],
  },
  {
    id: "sd-61",
    type: "system-design",
    num: 61,
    difficulty: "M",
    star: true,
    section: "Infrastructure",
    title: "Consistency patterns — weak, eventual, and strong consistency.",
    answer:
      "**Expected Answer:**\n- Weak consistency: no guarantee a read sees a recent write. After writing, reads may or may not reflect it. Use for: multiplayer game positions (a slightly stale position is fine), live video (a frame behind is acceptable).\n- Eventual consistency: given no new writes, all nodes converge to the same value eventually. Reads may be stale during convergence window. Use for: social media likes, DNS records, shopping cart.\n- Strong consistency: every read returns the most recent write or an error. Requires coordination — higher latency. Use for: financial balances, inventory counts, distributed locks.\n- Implementation: strong via single-leader with sync replication or Paxos/Raft. Eventual via async replication. Tunable in Cassandra via quorum levels (ONE, QUORUM, ALL).\n\n**Follow-up:** Why is eventual consistency acceptable for a shopping cart but not for a bank balance?\n> Shopping cart stale data = minor UX friction (two devices show slightly different carts). Bank balance stale = wrong overdraft decisions = financial and regulatory risk. Business consequences drive consistency requirements.\n\n**Red flags:**\n- Eventual consistency means no guarantees at all (it still converges — bounded eventually)\n- Strong consistency is free — ignores its latency and availability cost\n- No concrete business example connecting consistency level to requirement",
    tags: ["distributed-systems", "consistency", "architecture", "databases"],
    related: ["sd-50", "sd-49", "sd-55"],
  },
  {
    id: "sd-62",
    type: "system-design",
    num: 62,
    difficulty: "M",
    star: false,
    section: "Infrastructure",
    title: "TCP vs UDP — when to use each.",
    answer:
      "**Expected Answer:**\n- TCP: connection-oriented (3-way handshake). Reliable ordered delivery. Flow control, congestion control. Retransmits lost packets. Higher overhead. Use for: HTTP, email, file transfer, anything where correctness matters.\n- UDP: connectionless. No delivery guarantee. No ordering. No congestion control. Low latency, minimal overhead. Use for: DNS (small single query/response), live video streaming (stale frame beats a stall), online gaming (old position updates are irrelevant), WebRTC.\n- QUIC: UDP-based with per-stream reliability, built-in TLS, 0-RTT reconnection. HTTP/3 runs over QUIC — combines UDP speed with TCP correctness per stream.\n\n**Follow-up:** Why does DNS use UDP instead of TCP?\n> DNS queries are small (fit in one UDP packet) and latency-sensitive. UDP avoids the TCP handshake overhead. On loss, the client simply retries. DNS over TCP is used for large zone transfers.\n\n**Red flags:**\n- UDP is always faster (true) but misses the reliability trade-off\n- TCP for live video streaming (retransmit delay causes stalls — a dropped frame is better)\n- No awareness of QUIC as a modern middle ground that gets UDP speed with stream-level reliability",
    tags: ["networking", "protocols", "performance", "distributed-systems"],
    related: ["sd-43", "sd-44"],
  },
  {
    id: "sd-63",
    type: "system-design",
    num: 63,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design a URL shortener (like bit.ly).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Client -->|POST /shorten| API\n  API --> Encoder[Generate Base62 key]\n  Encoder -->|check collision| DB[(URL DB)]\n  DB --> API\n  API -->|short URL| Client\n  Client -->|GET /abc123| Redirect\n  Redirect --> Cache[(Redis)]\n  Cache -->|hit| Client\n  Cache -->|miss| DB\n  DB --> Cache --> Client\n```\n\n**Key design decisions:**\n- Key: 6-7 Base62 chars (a-z A-Z 0-9) = ~56 billion combinations. Generate randomly, check collision, retry if collision.\n- Storage: key → { longUrl, userId, createdAt, expiresAt }. Read-heavy system (100:1 read:write ratio).\n- 301 Permanent: browser caches redirect — no future server hits. Bad for analytics.\n- 302 Temporary: browser always asks server. Required for accurate click tracking.\n- Read path: Redis cache for popular URLs. Top 20% of URLs get > 99% of traffic.\n- Analytics: log click events to Kafka async — never count in the redirect hot path.\n\n**Follow-up:** How do you handle custom aliases?\n> Accept alias in POST body. Validate uniqueness. Reserve a namespace prefix to prevent collision with auto-generated keys. Rate limit custom alias creation per user.\n\n**Red flags:**\n- No cache — every redirect hits the DB (extremely read-heavy)\n- UUID as short key (too long for a short URL)\n- No collision handling for generated keys\n- 301 when click analytics are required",
    tags: ["system-design", "scalability", "databases", "caching"],
    related: ["sd-55", "sd-46", "sd-54"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Scale: URLs/day? Read QPS? (assume 100M URLs stored, 1B redirects/day)\n- Custom slugs? Analytics per URL?\n- Link expiry? Abuse/spam prevention?\n- Global or single-region?\n\n**Declared assumptions:**\n- 100M URLs, 10K writes/day, 100K redirects/day (read-heavy 10:1)\n- Custom slugs allowed (first-come-first-served)\n- Optional expiry, click analytics (count only)\n- Global CDN for redirect latency < 50ms",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: scale, custom slugs, analytics, expiry\n2. **(5–10 min)** Scale estimate: storage (100 bytes/URL × 100M = 10 GB), redirect QPS\n3. **(10–20 min)** High-level: API → ID gen → DB write → redirect service\n4. **(20–32 min)** Deep dive: ID generation (base62 counter vs hash), cache layer\n5. **(32–42 min)** Trade-offs: 301 vs 302 redirect, hash collision handling\n6. **(42–45 min)** Abuse prevention: rate limiting, blocklist",
    considerations:
      "- **301 vs 302:** 301 (permanent) cached by browser — analytics miss repeat visitors. 302 (temporary) always hits server — enables analytics but adds latency\n- **Hash collision:** MD5 first 7 chars → collision probability low; handle with retry + incremental suffix\n- **Cache hot URLs:** Top 20% of URLs get 80% of traffic — cache in Redis with short TTL\n- **Custom slug conflicts:** Check DB before accepting; queue reservation under lock\n- **Abuse:** Rate limit by IP, verify URLs via safe browsing API, reject malicious domains",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| ID generation | Base62 counter (auto-increment) | MD5 hash truncated | Counter is collision-free; hash needs collision handling |\n| Redirect type | 302 (temporary) | 301 (permanent) | 302 ensures every redirect hits server for analytics |\n| Storage | SQL (Postgres) | NoSQL (DynamoDB) | Simple key→value lookup; SQL gives ACID for custom slug uniqueness |\n| Cache | Redis (URL → long URL) | Memcached | Redis supports TTL natively; hot URL cache cuts DB load by 80% |",
    alternatives:
      "**Alternative 1: Hash-based ID (MD5/SHA truncated)**\n- Pros: Deterministic (same long URL → same short URL)\n- Cons: Collision handling required; harder to guarantee uniqueness\n\n**Alternative 2: Distributed counter (Snowflake-style)**\n- Pros: Globally unique, time-ordered\n- Cons: Requires coordination service; overkill for URL shortener\n\n**Alternative 3: Store at CDN edge (serverless redirect)**\n- Pros: Sub-10ms redirect, no origin hit for cached URLs\n- Cons: Cache invalidation on URL expiry is complex",
  },
  {
    id: "sd-64",
    type: "system-design",
    num: 64,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design a distributed cache (like Redis Cluster).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Client --> Router[Client-side Router]\n  Router -->|slots 0-5460| N1[Node 1 Primary]\n  Router -->|slots 5461-10922| N2[Node 2 Primary]\n  Router -->|slots 10923-16383| N3[Node 3 Primary]\n  N1 --> R1[Replica 1]\n  N2 --> R2[Replica 2]\n  N3 --> R3[Replica 3]\n```\n\n**Key design decisions:**\n- Partitioning: 16384 hash slots. hash(key) % 16384 → node. Client routes directly (no proxy).\n- Replication: each primary has replicas. On failure, replica promoted via Raft/Sentinel.\n- Eviction: LRU, LFU, or TTL-based (volatile-lru, allkeys-lru). Choose per access pattern.\n- Consistency: async replication = AP. Failover can lose recent writes not yet replicated.\n- Cache stampede: many keys expire simultaneously → all miss → flood origin. Fix: TTL jitter, SETNX mutex, probabilistic early expiry.\n- Hotkey: one key at 100K rps → replicate with suffix (key:0..N), random read, write all copies.\n\n**Follow-up:** How do you handle a hotkey?\n> Replicate the hotkey across multiple nodes with a suffix. Client randomly selects a replica to read from. Writes update all copies.\n\n**Red flags:**\n- No eviction policy — cache grows until OOM\n- Assumes strong consistency (async replication can lose writes on failover)\n- No stampede protection — thundering herd on cache expiry",
    tags: ["caching", "distributed-systems", "redis", "scalability"],
    related: ["ds-23", "sd-51", "sd-55", "sd-7"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Cache-aside or write-through?\n- Eviction policy: LRU, LFU, or TTL-based?\n- Replication: read replicas? Persistence?\n- Cluster size? Expected key count and value size?\n\n**Declared assumptions:**\n- Cache-aside pattern (application manages cache)\n- LRU eviction + TTL support\n- 1 primary + 2 replicas per shard\n- 10 shards, 10M keys, avg 1 KB value → 10 GB total\n- Persistence: RDB snapshots every 15 min",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: eviction, replication, persistence, cluster topology\n2. **(5–12 min)** Data partitioning: consistent hashing → shard assignment\n3. **(12–22 min)** Replication: primary-replica, async replication, failover\n4. **(22–33 min)** Client protocol: RESP protocol, connection pooling, pipeline\n5. **(33–42 min)** Failure handling: primary failure, rebalancing, cache stampede\n6. **(42–45 min)** Trade-offs: consistent hashing vs hash slots",
    considerations:
      "- **Cache stampede:** Use mutex/lock per key on miss — only one request fetches from DB\n- **Hotspot keys:** Detect top-N keys; replicate hot keys across multiple shards\n- **Rebalancing:** Consistent hashing minimizes key movement on shard add/remove\n- **Memory pressure:** Monitor `used_memory` vs `maxmemory`; alert before eviction starts\n- **Persistence trade-off:** RDB snapshots are compact but can lose up to 15 min of data; AOF is more durable but larger",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Sharding | Consistent hashing | Hash slots (Redis Cluster) | Consistent hashing minimizes rebalancing; hash slots are simpler to implement |\n| Eviction | LRU | LFU | LRU simpler; LFU better when access frequency varies widely |\n| Replication | Async primary-replica | Synchronous | Async avoids write latency penalty; sync needed for strict consistency |\n| Persistence | RDB snapshots | AOF log | RDB is compact and fast on restart; AOF is more durable |",
    alternatives:
      "**Alternative 1: In-process cache (Guava LoadingCache)**\n- Pros: Zero network latency, no separate infrastructure\n- Cons: Not shared across instances; cache is per-pod, increases memory footprint\n\n**Alternative 2: Memcached instead of Redis**\n- Pros: Simpler, lower memory overhead per key\n- Cons: No persistence, no native replication, no complex data structures\n\n**Alternative 3: Write-through cache**\n- Pros: Cache always consistent with DB\n- Cons: Every write hits both cache and DB — higher write latency",
  },
  {
    id: "sd-65",
    type: "system-design",
    num: 65,
    difficulty: "H",
    star: false,
    section: "Classic",
    title: "Design a notification delivery system for millions of users.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Event --> Router[Notification Router]\n  Router --> FanOut[Fan-out Worker]\n  FanOut --> Prefs[Preference Check Redis]\n  Prefs -->|push| FCM[FCM / APNs]\n  Prefs -->|email| Email[SES / SendGrid]\n  Prefs -->|SMS| SMS[Twilio]\n  FanOut --> DLQ[Dead Letter Queue]\n```\n\n**Key design decisions:**\n- Fan-out on write: generate notifications for all N followers at event time. Fast reads. Impractical for celebrities (1M followers = 1M writes per post).\n- Fan-out on read: generate at read time. Cheap writes, slow reads.\n- Hybrid: fan-out on write for users with < 1K followers, fan-out on read for celebrities.\n- Priority queues: security alerts → high priority. Newsletters → low priority. Prevents bulk from delaying critical.\n- Preference check (cached in Redis) before sending — user may have opted out. Legal requirement.\n- Idempotency: deduplicate on event ID — retries cannot double-send.\n- Rate limiting: cap notifications per user per hour to prevent flooding.\n\n**Follow-up:** How do you handle delivery failures?\n> Retry with exponential backoff. After N retries, move to DLQ. Alert on-call for critical failures. Silently drop bulk notifications (not business-critical).\n\n**Red flags:**\n- Fan-out on write for all users including celebrities (not scalable at large follower counts)\n- No preference check before sending (legal risk under CAN-SPAM, GDPR)\n- No rate limiting — individual users receive hundreds of notifications in minutes",
    tags: ["system-design", "notifications", "scalability", "messaging"],
    related: ["sd-12", "sd-56", "sd-58"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Channels: push (APNS/FCM), SMS, email, or all?\n- Priority levels? (critical vs marketing)\n- Delivery guarantees: at-most-once vs at-least-once?\n- Rate limiting per user? (don't spam)\n- Scale: 10M notifications/day? 100M?\n\n**Declared assumptions:**\n- Push (FCM/APNS) + email; SMS optional\n- Two priorities: critical (billing, auth) and marketing\n- At-least-once delivery, dedup on client\n- Rate limit: max 10 marketing notifs/user/day\n- Scale: 100M notifications/day peak",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: channels, priorities, rate limits, scale\n2. **(5–12 min)** Producer → notification service → fan-out queue\n3. **(12–22 min)** Channel routers: FCM worker, APNS worker, email worker\n4. **(22–32 min)** User preferences: opt-out, quiet hours, channel preferences\n5. **(32–42 min)** Rate limiting, dedup, delivery tracking\n6. **(42–45 min)** Trade-offs: fan-out on write vs read, Kafka vs SQS",
    considerations:
      "- **Device token staleness:** FCM/APNS returns token errors; delete stale tokens immediately\n- **Quiet hours:** Store user timezone; suppress marketing notifs 10pm–8am local time\n- **Fan-out bottleneck:** For broadcast notifs (all users), use Kafka topic + N consumer groups per channel\n- **Dedup:** Generate idempotency ID per notification; FCM message ID for client dedup\n- **Retry:** Exponential backoff on FCM/APNS transient errors; drop after 3 retries for marketing",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Queue | Kafka (durable, partitioned) | SQS | Kafka allows replay + multiple consumer groups per channel |\n| Fan-out | On write (pre-computed per user) | On read | Write fan-out adds send latency but reduces read complexity |\n| Delivery tracking | DB per notification | In-memory only | DB needed for audit trail and retry logic |\n| Rate limiting | Redis sliding window | DB counter | Redis atomic ops handle high-throughput rate checks efficiently |",
    alternatives:
      "**Alternative 1: Direct FCM/APNS without queue**\n- Pros: Simple, no queue infrastructure\n- Cons: No retry, no fan-out for broadcast, no rate limiting\n\n**Alternative 2: SNS (AWS) + SQS fan-out**\n- Pros: Managed, handles FCM/APNS routing\n- Cons: Vendor lock-in, less control over rate limiting logic",
  },
  {
    id: "sd-66",
    type: "system-design",
    num: 66,
    difficulty: "H",
    star: false,
    section: "Classic",
    title: "Design a distributed rate limiter.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Request --> LB[Load Balancer]\n  LB --> S1[App Server 1]\n  LB --> S2[App Server 2]\n  S1 --> Redis[(Redis Cluster)]\n  S2 --> Redis\n  Redis -->|under limit| Handler\n  Redis -->|over limit| Reject[429 Too Many Requests]\n```\n\n**Key design decisions:**\n- Fixed window: INCR + EXPIRE. Simple. Allows 2x at window boundary (end of old + start of new).\n- Sliding window log: all request timestamps in sorted set. Precise but O(requests) memory.\n- Sliding window counter: current_count * (1 - elapsed/window) + prev_count. Approximate, memory-efficient.\n- Token bucket: add tokens at rate R up to capacity C. Allows short bursts. Lua script for atomic check-and-decrement.\n- Leaky bucket: constant drain rate, queue excess. Smooth output but adds latency.\n- Centralized Redis: consistent counts across all app servers. ~0.5ms per check.\n- Atomicity: Lua scripts or MULTI/EXEC to prevent race between check and decrement.\n- Headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset, Retry-After.\n- Graceful degradation: if Redis is unavailable, fail open (allow all) to preserve availability.\n\n**Follow-up:** What is the thundering herd on window reset?\n> All blocked clients retry simultaneously at boundary. Mitigate: Retry-After response with jitter spreads retries across the window.\n\n**Red flags:**\n- In-memory counter per app server (inconsistent — each server starts at zero)\n- Fixed window without acknowledging the 2x boundary problem\n- No atomicity — race condition allows exceeding the limit under concurrent load",
    tags: ["system-design", "rate-limiting", "redis", "distributed-systems"],
    related: ["sd-6", "sd-55", "sd-57"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Per-user, per-IP, or per-API-key?\n- Sliding window or fixed window?\n- Strict consistency across instances, or approximate OK?\n- Distributed (multi-server) or single-process?\n\n**Declared assumptions:**\n- Per-user rate limiting\n- Sliding window (more accurate than fixed)\n- Approximate OK (2-3% error acceptable)\n- Distributed across 10 API servers",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: granularity, algorithm, consistency, scale\n2. **(5–15 min)** Algorithm comparison: token bucket vs sliding log vs fixed window vs sliding window counter\n3. **(15–25 min)** Distributed implementation: Redis INCR + EXPIRE, Lua atomic script\n4. **(25–35 min)** Response headers: `X-RateLimit-Remaining`, `Retry-After`\n5. **(35–42 min)** Edge cases: clock skew, Redis failure, burst tolerance\n6. **(42–45 min)** Trade-offs: exact vs approximate, local vs centralized",
    considerations:
      "- **Redis atomicity:** Use Lua script for INCR + EXPIRE in one atomic op — prevents race conditions\n- **Redis failure:** Fallback to local in-memory counter (eventually allow traffic rather than block)\n- **Clock skew:** For sliding window, use Redis server time (`TIME` command) not client time\n- **Burst handling:** Token bucket naturally handles bursts; sliding window is stricter\n- **Key TTL:** Set Redis key TTL = window size; auto-cleanup avoids memory leak",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Algorithm | Sliding window counter | Token bucket | Sliding window is smooth and accurate; token bucket allows initial bursts |\n| Storage | Redis (centralized) | Local in-memory | Redis is consistent across all API servers; local only works for single-server |\n| Consistency | Approximate (±2%) | Exact (distributed lock) | Approximate avoids coordination overhead; exact requires 2PC |",
    alternatives:
      "**Alternative 1: Fixed window (INCR per minute)**\n- Pros: Simplest — one Redis key per user per minute\n- Cons: Boundary burst: user can fire 2× limit by straddling minute boundary\n\n**Alternative 2: Token bucket**\n- Pros: Allows controlled bursts; intuitive model\n- Cons: Harder to implement exactly in distributed setting; needs float arithmetic\n\n**Alternative 3: API gateway rate limiting (Kong, AWS WAF)**\n- Pros: No application code needed\n- Cons: Less flexible; hard to do per-user business logic (premium vs free tier)",
  },
  {
    id: "sd-67",
    type: "system-design",
    num: 67,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design Twitter — home timeline and search (backend).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Tweet[Post Tweet] --> WriteSvc[Write Service]\n  WriteSvc --> TweetDB[(Tweet Store)]\n  WriteSvc --> FanOut[Fan-out Service]\n  FanOut -->|normal users| Cache[(Timeline Cache Redis)]\n  ReadSvc[Read Timeline] --> Cache\n  Cache -->|celebrity tweets| Merge[Merge at read time]\n  WriteSvc --> Search[Elasticsearch]\n```\n\n**Key design decisions:**\n- Tweet storage: tweet object (id, user_id, text, media_ids, timestamp) in Cassandra or PostgreSQL.\n- Follower graph: adjacency list in Cassandra — userId → [follower_ids].\n- Fan-out on write (push): on tweet, copy tweet_id into each follower's Redis timeline (sorted set, score = timestamp). Fast reads. Expensive for celebrities.\n- Fan-out on read (pull): merge followee tweets at read time. Cheap writes, slow reads.\n- Hybrid: push for users with < 1M followers. Pull for celebrities. Merge at read time.\n- Timeline cache: Redis ZADD timeline:{user_id} timestamp tweet_id. Paginate with ZREVRANGEBYSCORE.\n- Search: Elasticsearch near-real-time indexing. Trending: Count-Min Sketch on hashtags.\n\n**Follow-up:** How do you handle a celebrity with 100M followers tweeting?\n> Write tweet to celebrity's store only. On follower timeline read, merge celebrity's recent tweets at read time with the normal fan-out cache. Hybrid approach.\n\n**Red flags:**\n- Fan-out on write for celebrities (100M writes per tweet is not practical)\n- HTTP polling for new tweets instead of WebSocket or SSE\n- No timeline cache — every read hits the tweet database",
    tags: ["system-design", "scalability", "databases", "caching", "social"],
    related: ["sd-74", "sd-65", "sd-55"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Home timeline: following-based or ranked/algorithmic?\n- DAU and tweet volume? (assume 200M DAU, 500M tweets/day)\n- Read-heavy or write-heavy? (reads ~100:1)\n- Handle celebrities (10M+ followers)?\n- Search: real-time or minutes of delay OK?\n\n**Declared assumptions:**\n- 200M DAU, 500M tweets/day\n- Home timeline: following-based (not algorithmic)\n- Celebrity problem: > 1M followers uses fan-out on read\n- Search: near-real-time (< 30s indexing lag)",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: timeline type, celebrity handling, search requirements\n2. **(5–12 min)** Scale estimate: 500M tweets/day → 6K writes/s; 50K reads/s home timeline\n3. **(12–22 min)** Fan-out on write: tweet → Kafka → fan-out workers → Redis timeline cache\n4. **(22–32 min)** Celebrity problem: skip fan-out; merge on read for high-follower accounts\n5. **(32–40 min)** Search: Kafka → Elasticsearch ingest, inverted index, ranking\n6. **(40–45 min)** Trade-offs: hybrid fan-out, Redis list vs sorted set",
    considerations:
      "- **Hybrid fan-out:** Fan-out on write for normal users (< 1K followers); fan-out on read for celebrities\n- **Timeline cache:** Redis sorted set keyed by user_id, scored by tweet timestamp; cap at 800 tweets\n- **Hotspot reads:** Popular celebrity tweets cached separately with CDN + read replicas\n- **Search freshness:** Kafka → Flink → Elasticsearch pipeline; prioritize recent tweets in ranking\n- **Retweet fan-out:** Retweets fan out same as original tweets; dedup by tweet_id in timeline",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Fan-out | Hybrid (write for normal, read for celebrity) | Pure write or pure read | Pure write can't handle celebrity 10M-follower writes in real time |\n| Timeline store | Redis sorted set | DB query per request | Redis sorted set O(log N) range query vs full DB join per request |\n| Search index | Elasticsearch | Custom inverted index | Elasticsearch handles sharding, ranking, and real-time indexing |\n| DB | Cassandra (tweets) + MySQL (social graph) | All SQL | Cassandra handles write-heavy tweet storage; MySQL for relational follow graph |",
    alternatives:
      "**Alternative 1: Pure fan-out on read (compute timeline at request time)**\n- Pros: Simpler writes; no fan-out infrastructure\n- Cons: Read latency O(follows × tweets) — too slow for 1K+ follows\n\n**Alternative 2: Materialized timeline in DB instead of Redis**\n- Pros: Persistent, transactional\n- Cons: DB can't handle 50K reads/s at sub-10ms latency without caching anyway",
  },
  {
    id: "sd-68",
    type: "system-design",
    num: 68,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design YouTube — video upload, transcoding, and delivery.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Upload[Client Upload] -->|presigned URL| S3[Raw Video S3]\n  S3 --> Queue[Transcoding Queue]\n  Queue --> Workers[Transcoding Workers]\n  Workers -->|HLS segments 360p 720p 1080p| CDN[CDN]\n  CDN --> Player[ABR Video Player]\n  Upload --> MetaDB[(Metadata DB)]\n  MetaDB --> Search[Elasticsearch]\n```\n\n**Key design decisions:**\n- Upload: client gets presigned S3 URL → uploads raw video directly. API server never handles bytes.\n- Transcoding: S3 upload event → Kafka → transcoding workers. Output HLS/DASH segments at multiple resolutions. Thumbnail generation at N-second intervals.\n- CDN: HLS segments served from edge. ABR player selects quality based on bandwidth and buffer health.\n- Metadata: video_id, title, description, user_id, views, status. PostgreSQL.\n- View count: HyperLogLog in Redis for approximate real-time display. Batch reconcile to DB.\n- Recommendation: collaborative filtering ML pipeline offline. Candidate generation → ranking → serve.\n- Abuse: perceptual hash (pHash) detects re-uploaded violating content. AI moderation pipeline.\n\n**Follow-up:** How do you handle a video going viral (10x traffic spike)?\n> CDN absorbs — edge nodes cache all segments globally. Auto-scale transcoding workers. Pre-warm CDN for trending content. Rate limit the upload API to protect origin.\n\n**Red flags:**\n- Routes video bytes through the API server\n- No transcoding — stores only the original uploaded format\n- No CDN — origin server delivers all video traffic (impossible at scale)",
    tags: ["system-design", "media", "scalability", "cdn", "streaming"],
    related: ["sd-17", "sd-54", "sd-56"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Max video size and duration? Supported resolutions (4K?)\n- Upload via mobile or web or both?\n- Global delivery? CDN required?\n- Monetization / DRM required?\n\n**Declared assumptions:**\n- Max 4 GB, up to 4K resolution\n- Mobile + web upload\n- Global CDN delivery (HLS adaptive bitrate)\n- No DRM for simplicity",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: size limits, formats, CDN, DRM, live vs VOD\n2. **(5–12 min)** Upload flow: chunked multipart → S3 raw bucket → transcoding queue\n3. **(12–22 min)** Transcoding pipeline: Kafka job → FFmpeg workers → output to CDN origin\n4. **(22–32 min)** Delivery: HLS/DASH adaptive bitrate, CDN edge caching\n5. **(32–42 min)** Metadata: video DB, processing status, thumbnail generation\n6. **(42–45 min)** Trade-offs: chunked upload resumability, encoding formats",
    considerations:
      "- **Chunked upload:** Split into 5–20 MB chunks; retry failed chunks independently; supports resume\n- **Transcoding parallelism:** Spawn one FFmpeg job per output quality (360p, 720p, 1080p) in parallel\n- **Thumbnail:** Extract frame at 10% duration during transcoding; upload to CDN\n- **Progress tracking:** Polling endpoint or WebSocket for transcoding progress updates\n- **Storage tiers:** Hot (recent/popular) on fast storage; cold (old/unpopular) on cheaper S3 Glacier\n- **CDN cache key:** Include quality and segment number in cache key for HLS segments",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Upload | Chunked multipart to S3 | Single PUT | Chunked is resumable and parallelizable for large files |\n| Encoding | FFmpeg workers (self-managed) | AWS Elemental / cloud transcoding | Own workers cheaper at scale; cloud is easier to start |\n| Delivery format | HLS adaptive bitrate | Fixed MP4 | HLS adapts to network speed; MP4 wastes bandwidth on slow connections |\n| Transcoding trigger | Kafka queue | SQS | Kafka allows replay and multiple consumers (thumbnail, DRM workers) |",
    alternatives:
      "**Alternative 1: RTMP ingest for live streaming**\n- Pros: Industry standard for live; low latency ingest\n- Cons: Different pipeline needed; HLS output still required for viewers\n\n**Alternative 2: WebRTC for ultra-low latency**\n- Pros: Sub-second latency\n- Cons: Doesn't scale to thousands of viewers per stream\n\n**Alternative 3: Single-pass upload (no chunking)**\n- Pros: Simpler implementation\n- Cons: No resume on failure; unacceptable for 4 GB files on mobile",
  },
  {
    id: "sd-69",
    type: "system-design",
    num: 69,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design Google Drive / Dropbox — file sync and sharing.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Client --> SyncEngine[Sync Engine]\n  SyncEngine --> LocalDB[(Local SQLite)]\n  SyncEngine -->|changed chunks only| API[File API]\n  API --> ChunkStore[S3 Chunk Store]\n  API --> MetaDB[(Metadata DB)]\n  API --> Notifier[Change Notifier WebSocket]\n  Notifier --> OtherDevices[Other Devices]\n```\n\n**Key design decisions:**\n- Delta sync: split files into 4MB chunks. Hash each chunk. Only upload chunks whose hash changed. Content-addressed storage deduplicates identical chunks across users.\n- Metadata: file_id, user_id, parent_folder_id, name, version, chunk_list. PostgreSQL.\n- Blob storage: chunks keyed by content hash in S3. Same file from two users = one stored copy.\n- Conflict resolution: keep both versions as conflicting copies (Dropbox behavior), or last-write-wins.\n- Sharing: permissions table (file_id, user_id, role). Checked on every access.\n- Version history: list of chunk_lists per version. Restore by fetching old version's chunks.\n- Real-time sync: WebSocket or SSE notifies other devices of changes immediately.\n\n**Follow-up:** How do you sync across 5 devices simultaneously?\n> Each device maintains a sync cursor (last-known server version). On change notification, fetch delta since cursor. Apply changes, update local DB and cursor.\n\n**Red flags:**\n- Uploads the entire file on any change\n- No content-addressed deduplication — same file stored multiple times\n- No conflict resolution strategy",
    tags: ["system-design", "storage", "sync", "scalability"],
    related: ["sd-18", "sd-10", "sd-48"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Max file size? Supported file types?\n- Multi-device sync? Real-time collaboration on files?\n- Conflict resolution strategy?\n- Versioning / file history required?\n\n**Declared assumptions:**\n- Max 5 GB per file, all types\n- Multi-device sync, no real-time collaboration (file lock model)\n- Last-write-wins conflict; show conflict copy if diverged\n- 30-day version history",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: file size, versioning, collaboration, conflict strategy\n2. **(5–12 min)** Upload: chunked → S3 → metadata DB; delta sync algorithm\n3. **(12–22 min)** Sync protocol: client polls or watches for server changes via long-poll/WebSocket\n4. **(22–32 min)** Versioning: store each version as S3 object; metadata tracks version chain\n5. **(32–42 min)** Conflict: detect by comparing checksums; create conflict copy on divergence\n6. **(42–45 min)** Trade-offs: block-level vs file-level sync, permissions model",
    considerations:
      "- **Block-level sync:** Split file into 4 MB blocks; only upload changed blocks (Dropbox-style)\n- **Checksum:** SHA-256 per block; compare with server before upload to skip unchanged blocks\n- **Soft deletes:** Mark files deleted with `deleted_at`; hard-delete after 30-day trash window\n- **Permissions:** User → share permission → collaborator; check on every API call\n- **Deduplication:** Block dedup by SHA-256 across all users reduces storage costs\n- **Watch folder:** `FileObserver` (Android) / `FSEvents` (iOS/Mac) for change detection",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Sync granularity | Block-level (4 MB chunks) | File-level | Block sync minimizes bandwidth for large file edits |\n| Versioning | S3 object per version | DB snapshot | S3 handles storage; DB stores metadata only |\n| Conflict | Conflict copy | Server wins | Conflict copy preserves both versions; less data loss risk |\n| Change detection | Long-poll / WebSocket | Polling every 30s | Push-based is real-time; polling adds latency |",
    alternatives:
      "**Alternative 1: CRDT-based sync for text files (Google Docs approach)**\n- Pros: Real-time collaboration without conflicts\n- Cons: Only works for text/structured data; CRDTs for binary files are impractical\n\n**Alternative 2: Rsync delta algorithm**\n- Pros: Efficiently finds differences in large files\n- Cons: Requires running rsync on both sides; block-level approach achieves similar results more simply",
  },
  {
    id: "sd-70",
    type: "system-design",
    num: 70,
    difficulty: "H",
    star: true,
    section: "Classic",
    title: "Design Uber — driver dispatch and ride matching (backend).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Driver -->|GPS every 3s| LocationSvc[Location Service]\n  LocationSvc --> Redis[(Redis GEO)]\n  RiderRequest --> MatchSvc[Match Service]\n  MatchSvc -->|GEORADIUS| Redis\n  Redis --> Candidates[Nearby Drivers]\n  Candidates --> Score[ETA + Rating Score]\n  Score --> Assign[Assign Best Driver]\n  Assign --> Driver\n  Assign --> Rider\n```\n\n**Key design decisions:**\n- Driver location: WebSocket from driver app every 3s. Store in Redis GEOADD with 15s TTL (auto-expires if driver goes offline).\n- Dispatch: on ride request, GEORADIUS to find available drivers within N km. Score by ETA (routing API) + driver rating + surge zone. Assign highest score.\n- Ride state machine: Requested → Matching → Accepted → Arriving → InProgress → Completed. Persisted in DB.\n- Surge pricing: supply/demand ratio per Geohash cell. Real-time computation per region.\n- Scale: shard match service by city/region. Consistent hash on region → regional match service instance.\n\n**Follow-up:** What if the matched driver does not accept?\n> Timeout after 15 seconds. Re-run match with next-best candidate from the original ranked list. Track declined assignments — repeated declines lower driver's dispatch score.\n\n**Red flags:**\n- HTTP polling for driver location (high latency, massive server load)\n- No TTL on driver location — stale offline drivers appear available\n- Client-side ETA or fare calculation (drifts from server truth)",
    tags: ["system-design", "maps", "real-time", "scalability", "dispatch"],
    related: ["sd-13", "sd-30", "sd-51"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Geographic scope? (single city or global)\n- Matching latency requirement? (< 5 seconds?)\n- Driver location update frequency?\n- Surge pricing scope?\n\n**Declared assumptions:**\n- Global, 50 cities\n- Match driver in < 5 seconds\n- Driver location update every 5 seconds\n- Surge by city/zone",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: geography, matching latency, driver update frequency\n2. **(5–12 min)** Scale: 10M rides/day → 120 rides/s; 500K drivers active → 100K location updates/s\n3. **(12–22 min)** Location ingestion: WebSocket → location service → geospatial index (H3/geohash)\n4. **(22–32 min)** Matching service: query nearby drivers → rank by ETA → dispatch\n5. **(32–42 min)** Dispatch: push to driver app, wait for acceptance, timeout fallback\n6. **(42–45 min)** Trade-offs: push vs pull dispatch, geospatial index choice",
    considerations:
      "- **Geospatial index:** H3 hexagonal grid at resolution 9 (~174 m cells); query current cell + neighbors\n- **Driver state machine:** AVAILABLE → DISPATCHED → ACCEPTED → IN_TRIP — no race condition on double-dispatch\n- **Surge detection:** Count active rides / available drivers per H3 cell per minute\n- **Driver timeout:** If driver doesn't accept in 15s, try next-nearest driver\n- **Trip tracking:** During trip, driver location stored in time-series DB (InfluxDB) for audit/replay",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Geospatial index | H3 hexagonal grid | PostGIS / geohash | H3 avoids boundary bias; PostGIS adds DB load for 100K updates/s |\n| Driver state | Redis (fast, TTL for stale drivers) | DB | Redis handles 100K updates/s; DB can't |\n| Dispatch | Push to driver (server-initiated) | Driver polls for rides | Push is real-time; polling adds 5–15s delay |\n| Matching | ETA-based (Mapbox/Google API) | Distance-only | ETA accounts for traffic; distance alone is inaccurate |",
    alternatives:
      "**Alternative 1: DB-backed geospatial (PostGIS)**\n- Pros: ACID, complex queries, joins with driver data\n- Cons: Can't handle 100K location updates/s; adds write bottleneck\n\n**Alternative 2: Cost-based matching (minimize total wait time)**\n- Pros: Globally optimal; reduces aggregate wait across all riders\n- Cons: Complex optimization problem; 5s latency constraint too tight for global optimizer",
  },
  {
    id: "sd-71",
    type: "system-design",
    num: 71,
    difficulty: "H",
    star: false,
    section: "Classic",
    title: "Design a distributed web crawler.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Seeds[Seed URLs] --> Frontier[URL Frontier Queue]\n  Frontier --> Fetcher[Fetcher Workers]\n  Fetcher --> Robots{robots.txt?}\n  Robots -->|allowed| Download[Download HTML]\n  Download --> Parser[Link Extractor]\n  Parser --> Dedup[Bloom Filter]\n  Dedup -->|new URL| Frontier\n  Download --> Store[S3 Content Store]\n```\n\n**Key design decisions:**\n- URL frontier: priority queue by page rank, freshness, domain crawl budget. Kafka for distributed queuing.\n- Fetcher: HTTP download respecting crawl-delay (default 1 req/domain/sec). User-Agent identifies crawler.\n- robots.txt: fetch once and cache per domain. Check before every URL in that domain.\n- Deduplication: Bloom filter for URL visited check (fast, sub-linear memory, false positives acceptable).\n- Politeness: consistent hash domain → fetcher worker so each domain is rate-limited by one worker.\n- Spider traps: max URL depth limit, max URLs per domain per day, detect pattern-generated infinite URLs.\n- Content dedup: SimHash or MinHash to detect near-duplicate pages.\n\n**Follow-up:** How do you avoid re-crawling unchanged pages?\n> Conditional GET with If-Modified-Since or ETag. 304 Not Modified → skip re-processing. Prioritize high-frequency-change pages (news sites) over static content.\n\n**Red flags:**\n- No robots.txt compliance (legal and ethical violation)\n- No deduplication — infinite loop on link cycles\n- No per-domain rate limiting — crawler gets IP-banned",
    tags: ["system-design", "distributed-systems", "networking", "scalability"],
    related: ["sd-56", "sd-58", "sd-45"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Scale: how many pages? (assume 10B pages)\n- Crawl frequency? (fresh news vs static pages)\n- Domain scope: public web or specific domains?\n- Politeness constraints: robots.txt, crawl-delay?\n\n**Declared assumptions:**\n- 10B pages, prioritize fresh/news content\n- Public web, respect robots.txt\n- Max 1 request/second per domain (politeness)\n- 100M pages/day throughput target",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: scale, politeness rules, domain scope, freshness\n2. **(5–12 min)** Components: URL frontier → fetcher → parser → dedup → storage → scheduler\n3. **(12–22 min)** URL frontier: priority queue + per-domain back-queues for politeness\n4. **(22–32 min)** Dedup: Bloom filter for visited URLs; checksum for content dedup\n5. **(32–42 min)** Storage: fetched content to S3; metadata + links to Cassandra\n6. **(42–45 min)** Trade-offs: BFS vs priority crawl, Bloom filter false positive rate",
    considerations:
      "- **Politeness:** Per-domain back-queue with enforced crawl-delay; read robots.txt before queuing\n- **Trap detection:** Limit crawl depth per domain; detect dynamic URL traps (calendar pages)\n- **Content dedup:** SimHash fingerprint for near-duplicate detection\n- **Priority queue:** Score URLs by PageRank + freshness + discovery recency\n- **DNS cache:** Pre-resolve DNS to avoid N network round trips per URL\n- **Robots.txt cache:** Cache per domain with TTL; re-fetch daily",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Dedup | Bloom filter (approximate) | Hash set in DB | Bloom filter fits 10B URLs in ~12 GB RAM; DB would be 10× larger |\n| Crawl order | Priority queue (PageRank + freshness) | BFS | Priority ensures high-value pages crawled first |\n| Content storage | S3 (raw HTML) + Cassandra (metadata) | Single DB | S3 for cheap bulk storage; Cassandra for low-latency metadata reads |\n| Frontier | Distributed (Kafka partitioned by domain) | Single-process queue | Kafka scales to 100M URLs/day; single queue is a bottleneck |",
    alternatives:
      "**Alternative 1: BFS traversal**\n- Pros: Simple; natural breadth-first exploration\n- Cons: Doesn't prioritize important pages; crawls low-value deep pages too early\n\n**Alternative 2: Mercator-style distributed frontier (Altavista design)**\n- Pros: Battle-tested for web scale\n- Cons: Complex; Kafka-based approach achieves similar results with modern tooling",
  },
  {
    id: "sd-72",
    type: "system-design",
    num: 72,
    difficulty: "H",
    star: true,
    section: "Classic",
    title:
      "Design Google Docs — real-time collaborative document editing (backend).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Editor1[Editor 1] -->|op| DocServer[Document Server]\n  Editor2[Editor 2] -->|op| DocServer\n  DocServer -->|CRDT merge + broadcast| Editor1\n  DocServer -->|CRDT merge + broadcast| Editor2\n  DocServer --> EventLog[(Event Log)]\n  EventLog --> Snapshot[(Snapshot Store)]\n```\n\n**Key design decisions:**\n- Conflict resolution: CRDT (Yjs) preferred — clients merge independently, server relays. OT (original Google Docs) requires server to order all ops.\n- WebSocket: all editors of same doc routed to same server (consistent hash on doc_id).\n- Persistence: event log (each op is an event). Periodic snapshots for fast load (avoid replaying millions of events).\n- Presence: cursor positions broadcast at 50ms throttle. Color-coded per user.\n- Permissions: view/comment/edit per user or shareable link. Checked on every WebSocket message.\n- Export: async job renders PDF/DOCX from document state. Notify via webhook on completion.\n- Offline: CRDT state in IndexedDB (web) or Room (Android). Local edits on disconnect, merged automatically on reconnect.\n\n**Follow-up:** How do you handle a user editing offline for 2 hours then reconnecting?\n> CRDT syncs incrementally. Server holds ops since client's last vector clock position. Client and server exchange ops, CRDT merges diverged histories. No data loss.\n\n**Red flags:**\n- Last-write-wins on full document (concurrent edits are lost)\n- No offline support — disconnection loses all in-progress work\n- Single server for all documents (does not scale — shard by doc_id)",
    tags: [
      "system-design",
      "real-time",
      "collaboration",
      "crdt",
      "scalability",
    ],
    related: ["sd-38", "sd-2", "sd-59"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Max concurrent editors per document?\n- Offline editing supported?\n- Rich text (bold, tables) or plain text?\n- Conflict resolution: OT or CRDT?\n\n**Declared assumptions:**\n- Up to 100 concurrent editors per doc\n- Offline supported (merge on reconnect)\n- Rich text (paragraphs, bold, lists)\n- OT (Operational Transformation) for conflict resolution",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: scale, offline, rich text, conflict strategy\n2. **(5–12 min)** OT overview: transform concurrent operations to reach consistent state\n3. **(12–22 min)** Architecture: client → WebSocket → OT server → broadcast to peers\n4. **(22–32 min)** Operation log: persist ops to DB; replay for new joiners\n5. **(32–42 min)** Presence: cursor positions broadcast via separate WebSocket channel\n6. **(42–45 min)** Trade-offs: OT vs CRDT, server authority vs peer-to-peer",
    considerations:
      "- **OT correctness:** Operations must be transformed against concurrent ops before applying\n- **Server authority:** Central OT server is source of truth; prevents split-brain\n- **Snapshot + op log:** Store snapshots every N ops; new clients sync from snapshot + recent ops\n- **Tombstoning:** Deleted characters get tombstoned (not removed) to allow OT to reference position\n- **Offline merge:** On reconnect, send buffered ops; server transforms them against ops made while offline",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Conflict algorithm | OT (Operational Transform) | CRDT (Automerge/Yjs) | OT is proven for rich text (Google Docs uses OT); CRDT has higher memory overhead per character |\n| Architecture | Server-authoritative OT | Peer-to-peer CRDT | Server authority simplifies conflict resolution; P2P requires all peers to coordinate |\n| Presence | Separate WebSocket channel | Piggyback on ops channel | Presence is high-frequency + ephemeral; ops are persistent + lower frequency |",
    alternatives:
      "**Alternative 1: CRDT (Yjs / Automerge)**\n- Pros: No central coordination needed; works offline by design; simpler to implement correctly\n- Cons: Higher memory per document; rich-text CRDT still evolving; harder to audit history\n\n**Alternative 2: Lock-based editing (one user at a time)**\n- Pros: No conflict resolution needed\n- Cons: Terrible UX; defeats the purpose of collaborative editing",
  },
  {
    id: "sd-73",
    type: "system-design",
    num: 73,
    difficulty: "H",
    star: false,
    section: "Classic",
    title: "Design Ticketmaster — seat reservation with distributed locking.",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  User --> Queue[Virtual Waiting Room]\n  Queue --> Reserve[Reserve Seat]\n  Reserve --> Lock[Redis SETNX seat:id]\n  Lock -->|acquired| DB[DB optimistic lock]\n  DB -->|success| Payment[Payment Flow]\n  Payment --> Confirm[Mark SOLD]\n  Lock -->|TTL expires| Release[Seat available again]\n```\n\n**Key design decisions:**\n- Seat states: AVAILABLE → RESERVED → SOLD.\n- Optimistic locking: UPDATE seats SET status=RESERVED WHERE id=? AND status=AVAILABLE. Returns 0 rows if already taken → inform user.\n- Distributed lock: Redis SET NX PX 600000 seat:{id} user_id. Atomic acquire with 10-min TTL. Only one user holds lock at a time.\n- Reservation TTL: payment not completed in 10 minutes → seat released automatically.\n- Virtual waiting room: queue users for high-demand events. FIFO processing. Prevents thundering herd on DB at event launch.\n- Payment: idempotency key on every attempt. PSP tokenization (Stripe/Adyen). Seat moves RESERVED → SOLD only after payment webhook confirmed.\n\n**Follow-up:** How do you show real-time seat availability on the seat map?\n> Cache seat statuses in Redis with a short TTL (5s). UI polls every 5s or subscribes via SSE. Accept slight staleness — final availability enforced at reservation time.\n\n**Red flags:**\n- No locking — two users simultaneously reserve the same seat\n- No TTL on reservation — abandoned reservations lock seats forever\n- Trusts client-side payment confirmation without server webhook",
    tags: ["system-design", "distributed-systems", "payments", "locking"],
    related: ["sd-16", "sd-66", "sd-55"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Seat hold duration? (assume 10 minutes)\n- Scale: concurrent buyers at sale open? (assume 100K simultaneous)\n- Payment timeout? How long to complete payment?\n- Event sizes? (small venue 500 seats vs stadium 50K seats)\n\n**Declared assumptions:**\n- 10-minute seat hold\n- 100K concurrent buyers at sale open (thundering herd)\n- 5 minutes to complete payment after hold\n- Seat map with individual seat selection",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: hold duration, concurrency, payment timeout, seat map\n2. **(5–12 min)** Thundering herd: queue buyers at sale open; rate-admit to seat selection\n3. **(12–22 min)** Seat hold: Redis SETNX per seat_id with 10-min TTL; idempotent\n4. **(22–32 min)** Payment: hold confirmed → payment service → mark sold; release on timeout\n5. **(32–42 min)** Seat map display: read from cache; optimistic UI for held seats\n6. **(42–45 min)** Trade-offs: Redis hold vs DB pessimistic lock; queue vs no queue",
    considerations:
      '- **Double-booking prevention:** Redis SETNX (atomic set-if-not-exists) per seat; only one request wins\n- **Hold expiry race:** Payment service must acquire hold before extending; don\'t extend blindly\n- **Queue fairness:** Randomize queue position to prevent bot advantage\n- **Seat map staleness:** Show seat status from cache; refresh every 5s; mark hold as "tentative"\n- **Webhook on payment:** Payment provider sends webhook on success/failure; release seat on failure',
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Hold mechanism | Redis SETNX (atomic, TTL) | DB pessimistic lock (SELECT FOR UPDATE) | Redis handles 100K concurrent holds without DB lock contention |\n| Concurrency management | Virtual queue at sale open | Open free-for-all | Queue prevents DB overload; free-for-all causes thundering herd |\n| Seat status | Cache (Redis) + DB (source of truth) | DB only | Cache absorbs read spike; DB is authoritative for payment state |",
    alternatives:
      "**Alternative 1: Optimistic locking (CAS on seat version)**\n- Pros: No lock held; higher read throughput\n- Cons: High contention at sale open → many retries → worse user experience\n\n**Alternative 2: Queue all requests (Kafka)**\n- Pros: Fair, ordered, durable\n- Cons: Adds latency; 100K events at sale open creates 10s+ queue lag",
  },
  {
    id: "sd-74",
    type: "system-design",
    num: 74,
    difficulty: "M",
    star: true,
    section: "Classic",
    title: "Unique ID generation — Snowflake, UUID, and KSUID.",
    answer:
      "**Expected Answer:**\n- UUID v4: 128-bit random. No coordination needed. Globally unique. Not time-sortable. URL-unsafe (dashes). 36 chars. Safe for low-to-medium volume.\n- Twitter Snowflake: 64-bit integer. 41-bit timestamp (ms precision, 69-year range) + 10-bit machine ID + 12-bit sequence (4096 IDs/ms per machine). Time-sortable. Requires clock sync (NTP) and unique machine IDs from a registry.\n- KSUID: 20-byte sortable ID. 32-bit timestamp + 128-bit random payload. Base62 encoded. No coordination, no clock sync required. URL-safe.\n- Database auto-increment: simple and sortable. Single point of failure. Cannot shard. Avoid at scale.\n- Choose: sortable by time → Snowflake or KSUID. No clock sync → UUID v4 or KSUID. Integer column needed → Snowflake.\n\n**Follow-up:** What if two Snowflake machines share the same machine ID?\n> Duplicate IDs when generating at the same millisecond. Solution: centralized machine ID registry (ZooKeeper assigns unique IDs at startup). Or derive from machine IP/MAC modulo 1024.\n\n**Red flags:**\n- UUID for write-heavy primary keys at scale (random insertion order causes B-tree page splits and fragmentation)\n- Database auto-increment for distributed sharded systems (single sequence is a bottleneck)\n- Snowflake without a machine ID registry (ID collisions under concurrent writers)",
    tags: ["system-design", "distributed-systems", "databases", "architecture"],
    related: ["sd-67", "sd-48", "sd-51"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Time-ordered IDs needed?\n- Globally unique across distributed nodes?\n- Monotonic within a node?\n- Human-readable or compact?\n\n**Declared assumptions:**\n- Globally unique, roughly time-ordered\n- Distributed (no single sequence generator)\n- Compact (64-bit or 128-bit)\n- Compare: UUID v4, Snowflake, KSUID, ULID",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: sortability, distribution, DB index impact\n2. **(5–15 min)** Compare algorithms: UUID v4 / Snowflake / KSUID / ULID\n3. **(15–25 min)** Snowflake deep dive: 41-bit timestamp + 10-bit machine ID + 12-bit sequence\n4. **(25–35 min)** Clock skew: NTP corrections, what happens when clock goes backward\n5. **(35–42 min)** DB index impact: random UUID vs time-ordered ID (B-tree fragmentation)\n6. **(42–45 min)** Trade-offs: simplicity vs sortability vs space",
    considerations:
      "- **Clock skew:** Snowflake must handle clock going backward — wait until clock catches up or add monotonic offset\n- **Machine ID:** Assign via ZooKeeper/etcd at startup; if machine ID space exhausted, IDs collide\n- **B-tree fragmentation:** Random UUIDs fragment DB B-tree pages → slower index writes; time-ordered IDs don't\n- **ULID:** 48-bit timestamp + 80-bit random — sortable and collision-resistant without machine ID coordination",
    tradeoffs:
      "| Scheme | Sortable | Distributed | Size | Coordination Needed |\n|---|---|---|---|---|\n| UUID v4 | ❌ | ✅ | 128-bit | None |\n| Snowflake | ✅ | ✅ | 64-bit | Machine ID assignment |\n| KSUID | ✅ | ✅ | 160-bit | None |\n| ULID | ✅ | ✅ | 128-bit | None |\n| DB auto-increment | ✅ | ❌ | 64-bit | Single DB (bottleneck) |",
    alternatives:
      "**Alternative 1: DB sequence (auto-increment)**\n- Pros: Simple, perfectly ordered\n- Cons: Single point of failure; doesn't scale to distributed writes\n\n**Alternative 2: Instagram-style (shard epoch + shard ID + sequence)**\n- Pros: 64-bit, time-ordered, no coordination\n- Cons: Requires upfront shard planning\n\n**Alternative 3: UUIDv7 (2024 RFC)**\n- Pros: UUID format + time-ordered; becoming standard\n- Cons: Newer, not widely supported yet",
  },
  {
    id: "sd-75",
    type: "system-design",
    num: 75,
    difficulty: "H",
    star: false,
    section: "Classic",
    title: "Design a top-K trending topics system (Count-Min Sketch).",
    answer:
      "**What to draw:**\n\n```mermaid\nflowchart LR\n  Events[Tweet / Search Events] --> Kafka\n  Kafka --> Flink[Flink Streaming]\n  Flink --> CMS[Count-Min Sketch per window]\n  CMS --> TopK[Top-K extractor]\n  TopK --> Cache[(Redis top-K cache TTL=30s)]\n  Cache --> API[Trending API]\n```\n\n**Key design decisions:**\n- Exact count with Redis INCR: O(N) memory where N = unique topics. Works at small scale.\n- Count-Min Sketch (CMS): 2D array of counters. Hash topic to K rows, increment all K cells. Query = minimum of K cells. Overestimates but never underestimates. Sub-linear fixed memory. Error bounded by configurable epsilon.\n- Heavy hitters / Space-Saving algorithm: track top-K candidates in O(K/epsilon) space.\n- Trending = growth rate not absolute count: hashtag growing 500% in 1 hour is more trending than a stagnant popular hashtag. Compare current window vs previous window.\n- Time windowing: sliding window via multiple Redis sorted sets (one per minute). Expire old buckets.\n- Architecture: events → Kafka → Flink (streaming) → CMS → materialize top-K every 30s → Redis cache → API.\n\n**Follow-up:** Why Count-Min Sketch over a HashMap of all hashtags?\n> At Twitter scale a HashMap of all hashtags consumes TBs of memory. CMS uses a fixed-size array (e.g. 5MB) with bounded probabilistic error. For top-K we only care about high-frequency items — small overcount on rare items is irrelevant.\n\n**Red flags:**\n- Trending = highest absolute count (misses growth rate — old popular topics always dominate)\n- Exact HashMap of all hashtags at large scale (memory exhaustion)\n- No time window — all-time counts, not real-time trending",
    tags: ["system-design", "data-engineering", "streaming", "scalability"],
    related: ["sd-67", "sd-56", "sd-55"],
    assumptions:
      "**Questions to ask the interviewer:**\n- Time window: last 1 hour? Last 24 hours? Sliding or tumbling?\n- K value: top 10 or top 1000?\n- Exact or approximate? (billions of events/day — exact is expensive)\n- Latency: how fresh must results be?\n\n**Declared assumptions:**\n- Sliding window: last 1 hour\n- Top 100 trending topics\n- Approximate (Count-Min Sketch acceptable)\n- Results fresh within 30 seconds",
    steps:
      "**How to structure the 45 min:**\n1. **(0–5 min)** Clarify: window size, K, exact vs approximate, freshness\n2. **(5–12 min)** Ingestion: Kafka event stream → stream processing (Flink)\n3. **(12–22 min)** Count-Min Sketch: how it works, error bounds, update + query\n4. **(22–32 min)** Top-K heap: maintain min-heap of K elements alongside CMS\n5. **(32–42 min)** Decay: sliding window — subtract expired counts or use decay factor\n6. **(42–45 min)** Trade-offs: CMS vs exact counter, sliding vs tumbling window",
    considerations:
      "- **CMS error bound:** For width `w = e/ε` and depth `d = ln(1/δ)`, error ≤ εN with probability 1−δ\n- **Sliding window decay:** Use multiple tumbling windows (1-min buckets); merge last 60 to get 1-hour window\n- **Hot topic amplification:** Weighted by engagement (likes/retweets) not just raw count\n- **Cold start:** Pre-warm with historical baselines; avoid ranking empty windows\n- **Serving:** Cache top-K result; refresh every 30s from stream processor output",
    tradeoffs:
      "| Decision | Chosen | Alternative | Why |\n|---|---|---|---|\n| Counting | Count-Min Sketch (approximate) | Exact hash table | CMS uses fixed memory O(width × depth); exact needs O(unique topics) memory |\n| Window | Sliding (bucketed 1-min tumbling) | Single tumbling window | Sliding gives smoother trends; tumbling has cliff-edge at window boundary |\n| Top-K | Min-heap of K elements | Sort all counts | Heap is O(n log k) vs O(n log n) for full sort |\n| Processing | Flink stream processing | Spark Streaming (micro-batch) | Flink is true streaming with lower latency; Spark adds micro-batch delay |",
    alternatives:
      "**Alternative 1: Space Saving algorithm**\n- Pros: Provably finds all heavy hitters above threshold; simpler than CMS + heap combo\n- Cons: Less known; slightly higher memory than CMS for the same guarantees\n\n**Alternative 2: Exact counting with Redis ZINCRBY**\n- Pros: Simple, exact, Redis ZRANGEBYSCORE for top-K in O(K log N)\n- Cons: Memory grows with unique topic count; can't handle billions of events/hour\n\n**Alternative 3: Lambda architecture (batch + stream)**\n- Pros: Batch layer provides accurate historical trends\n- Cons: Complexity of maintaining two systems; Kappa architecture (stream only) is preferred",
  },
  {
    id: "sd-76",
    type: "system-design",
    num: 76,
    difficulty: "M",
    star: true,
    section: "Mobile",
    title:
      "Design a news feed screen — walk me through data flow from API to UI.",
    answer:
      '**Architecture to draw:**\n\n```mermaid\nflowchart LR\n  UI[LazyColumn / Compose] -->|observes StateFlow| VM[FeedViewModel]\n  VM --> Repo[FeedRepository]\n  Repo -->|cache hit| Room[(Room DB)]\n  Repo -->|cache miss| API[Retrofit API]\n  API --> Server[Backend]\n  Room -->|Flow| VM\n```\n\n**Expected Answer:**\n- ViewModel calls Repository\n- Repository checks cache (Room or in-memory), falls back to Retrofit API on miss\n- Repository returns `Flow<Result<List<FeedItem>>>`\n- ViewModel maps to `UiState` (Loading, Success, Error) exposed as `StateFlow`\n- Compose UI collects state via `collectAsStateWithLifecycle()`, renders `LazyColumn`\n- Pagination via Paging 3 — `PagingSource` calls network, `RemoteMediator` writes to Room\n\n**What to listen for:**\n- Clean separation: no network calls in ViewModel or UI\n- Error state handled explicitly\n- Offline-first: show cached data while fetching fresh\n- Image loading via Coil with disk cache\n\n**Follow-up:** How do you handle real-time updates (new posts arriving while scrolling)?\n> WebSocket or SSE delivers new-post events. Show a "X new posts" banner — tap to prepend and scroll to top.\n\n**Red flags:**\n- Network call directly in the composable\n- No error state\n- No mention of caching or pagination',
    tags: ["mobile", "architecture", "mvvm", "feed", "pagination"],
    related: ["sd-1", "sd-2", "sd-3"],
  },
  {
    id: "sd-77",
    type: "system-design",
    num: 77,
    difficulty: "H",
    star: true,
    section: "Mobile",
    title:
      "Design a mobile browser application with spam filtering capabilities.",
    answer:
      "**Architecture to draw:**\n\n```mermaid\ngraph TB\n    subgraph mobileApp [Mobile Application]\n        ui[Browser UI Layer]\n        webview[WebView Engine]\n        filterEngine[Spam Filter Engine]\n        ruleEngine[Rule Engine]\n        mlModel[ML Classification Model]\n        storage[Local Storage]\n    end\n    \n    subgraph cloudServices [Cloud Services]\n        updateService[Filter Updates API]\n        threatIntel[Threat Intelligence]\n        reportingService[User Reporting API]\n    end\n    \n    subgraph dataSources [Data Sources]\n        blockLists[Blocklist Databases]\n        whiteLists[Whitelist Databases]\n        userPrefs[User Preferences]\n    end\n    \n    ui --> webview\n    webview --> filterEngine\n    filterEngine --> ruleEngine\n    filterEngine --> mlModel\n    filterEngine --> storage\n    \n    ruleEngine --> blockLists\n    ruleEngine --> whiteLists\n    filterEngine --> updateService\n    updateService --> threatIntel\n    ui --> reportingService\n```\n\n**Expected Answer:**\n\n**Core Architecture:**\n- **Browser Engine**: Platform-specific WebView (WKWebView on iOS, Custom WebView on Android)\n- **Multi-Layer Filtering**: URL-based pre-filtering → Content analysis → ML classification\n- **Rule Engine**: Static blocklists (EasyList compatible) + dynamic user rules\n- **Local Storage**: SQLite for rules (~10-50MB), encrypted user preferences\n- **Cloud Services**: Real-time threat intelligence updates, anonymous reporting\n\n**Key Components:**\n1. **Request Interception**: Hook network requests before page load for URL filtering\n2. **Content Analysis**: Post-response HTML/CSS/JS analysis for malicious patterns\n3. **ML Classification**: On-device lightweight model with cloud fallback for complex cases\n4. **Performance Optimization**: Background threading, smart caching, compressed rule storage\n\n**Filtering Layers:**\n- **Layer 1**: Domain reputation checking, DNS lookups, redirect analysis\n- **Layer 2**: Content pattern matching, ad/tracker detection, suspicious script analysis\n- **Layer 3**: ML-based classification using URL structure and content features\n\n**Data Flow:**\n1. User enters URL → Rule engine checks blocklists → Allow/Block decision\n2. If allowed → Fetch content → Content analysis → Strip malicious elements → Render\n3. Background: Update rules from threat intelligence, sync user preferences\n\n**Performance Considerations:**\n- Pre-compiled rule matching algorithms\n- Lazy loading of ML models\n- Delta updates for rule changes\n- Local-first architecture with optional cloud sync\n- <10% browsing speed overhead, <5% battery impact\n\n**Security & Privacy:**\n- No browsing data stored in cloud\n- Encrypted local storage\n- Privacy-first design with optional telemetry\n- Integration with threat intelligence feeds (VirusTotal, etc.)\n\n**Follow-up Questions:**\n- How would you handle false positives in the filtering system?\n- What strategies would you use for real-time threat detection?\n- How would you optimize the ML model for mobile devices?\n- What offline capabilities would you implement?\n- How would you handle certificate pinning and HTTPS validation?",
    tags: [
      "mobile",
      "browser",
      "security",
      "spam-filtering",
      "webview",
      "machine-learning",
      "threat-detection",
    ],
    related: ["sd-1", "sd-15", "sd-23"],
  },
  [
    {
      id: "sd-78",
      type: "system-design",
      num: 78,
      difficulty: "H",
      star: true,
      section: "Architecture",
      title:
        "How would you design a modular Android SDK that supports feature flags and dynamic delivery?",
      answer:
        "**Expected Answer:**\n- Use feature modules with Play Feature Delivery (on-demand download)\n- Feature flags via remote config (Firebase Remote Config) or server-driven UI (SDUI)\n- SDK exposes a facade interface; implementations loaded via ServiceLoader or DI\n- Versioning: semantic versioning with backward compatibility guarantees\n- Testing: contract tests between SDK and consumer apps\n\n**Red flags:**\n- Hardcodes all features in monolithic module\n- No versioning strategy",
      tags: ["sdk", "modularization", "feature-flags", "dynamic-delivery"],
      related: ["sd-20", "sd-27"],
    },
    {
      id: "sd-79",
      type: "system-design",
      num: 79,
      difficulty: "H",
      star: true,
      section: "Architecture",
      title:
        "Design a CI/CD pipeline for a multi-module Android project with automated testing and release management.",
      answer:
        "**Expected Answer:**\n- Build stages: compile \u2192 lint \u2192 unit tests \u2192 integration tests \u2192 build APK/AAB\n- Parallel module builds with Gradle build cache and configuration cache\n- Automated testing: Espresso UI tests on Firebase Test Lab, unit tests with MockK\n- Release: version bump \u2192 changelog \u2192 build AAB \u2192 upload to Play Console via API\n- Quality gates: code coverage threshold, lint errors block release\n\n**Red flags:**\n- No automated testing in pipeline\n- Manual release process",
      tags: ["ci-cd", "pipeline", "multi-module", "testing"],
      related: ["sd-23", "tech-60"],
    },
    {
      id: "sd-80",
      type: "system-design",
      num: 80,
      difficulty: "H",
      star: true,
      section: "Architecture",
      title:
        "How would you architect a Kotlin Multiplatform (KMP) mobile app sharing business logic between Android and iOS?",
      answer:
        "**Expected Answer:**\n- Common module: pure Kotlin business logic, use Kotlin Multiplatform libraries\n- Android module: Android-specific UI (Compose) + platform APIs\n- iOS module: SwiftUI + platform APIs, consumes common module via Kotlin/Native\n- Shared networking: Ktor client in common module\n- Data layer: SQLDelight or Realm for shared database\n- Build: Gradle with Kotlin Multiplatform plugin\n\n**Red flags:**\n- Puts Android-specific code in common module\n- No clear module boundary",
      tags: ["kmp", "multiplatform", "architecture", "shared-logic"],
      related: ["sd-26", "tech-102"],
    },
    {
      id: "sd-81",
      type: "system-design",
      num: 81,
      difficulty: "H",
      star: true,
      section: "Architecture",
      title:
        "Design an analytics SDK that collects events with privacy compliance (GDPR/CCPA) and offline buffering.",
      answer:
        "**Expected Answer:**\n- Event schema: timestamp, event type, properties, session ID\n- Offline buffer: Room DB with queue; flush when network available\n- Privacy: consent management, anonymization, data retention policies\n- Batch uploads to reduce network overhead\n- Encryption at rest and in transit\n\n**Red flags:**\n- No consent mechanism\n- No offline handling",
      tags: ["analytics", "sdk", "privacy", "offline"],
      related: ["sd-24", "tech-83"],
    },
    {
      id: "sd-82",
      type: "system-design",
      num: 82,
      difficulty: "H",
      star: true,
      section: "Architecture",
      title:
        "How do you design a crash-reporting SDK that minimizes performance impact and respects user privacy?",
      answer:
        "**Expected Answer:**\n- Capture uncaught exceptions via Thread.setDefaultUncaughtExceptionHandler\n- Include device info, OS version, app version, stack trace\n- Symbolication: upload mapping.txt for deobfuscation\n- Rate limiting: max reports per session to avoid spam\n- User consent: only collect when user opts in\n- Performance: async upload, no blocking on main thread\n\n**Red flags:**\n- Blocks main thread\n- No user consent",
      tags: ["crash-reporting", "sdk", "performance", "privacy"],
      related: ["sd-15", "tech-83"],
    },
    {
      id: "sd-83",
      type: "system-design",
      num: 83,
      difficulty: "M",
      star: true,
      section: "Architecture",
      title:
        "Design a feature-flag system that supports gradual rollouts, A/B testing, and instant kill switches.",
      answer:
        "**Expected Answer:**\n- Remote config server with feature flag definitions\n- Client SDK fetches flags at app start and caches locally\n- Gradual rollout: percentage-based targeting by user segment\n- A/B testing: split users into cohorts, measure metrics\n- Kill switch: server can disable feature instantly; client checks on each session\n- Fallback: default values if server unreachable\n\n**Red flags:**\n- No fallback/default\n- No kill switch mechanism",
      tags: ["feature-flags", "rollout", "a-b-testing", "remote-config"],
      related: ["sd-27", "tech-27"],
    },
    {
      id: "sd-84",
      type: "system-design",
      num: 84,
      difficulty: "H",
      star: true,
      section: "Architecture",
      title:
        "How would you design a server-driven UI (SDUI) system for Android that allows dynamic screen updates without app releases?",
      answer:
        "**Expected Answer:**\n- Server defines screen layout as JSON schema (components, properties)\n- Client SDK parses JSON and renders using Compose or custom view system\n- Component registry: map component types to composable implementations\n- Caching: local cache with TTL; fallback to cached version if server down\n- Versioning: schema version in JSON; client supports multiple versions\n\n**Red flags:**\n- No caching/fallback\n- No versioning strategy",
      tags: ["sdui", "server-driven", "dynamic-ui", "json"],
      related: ["sd-27", "tech-11"],
    },
    {
      id: "sd-85",
      type: "system-design",
      num: 85,
      difficulty: "M",
      star: true,
      section: "Architecture",
      title:
        "Design an accessibility-first Android architecture that supports screen readers and switch access across all screens.",
      answer:
        "**Expected Answer:**\n- Semantic properties: contentDescription for all interactive elements\n- Focus management: logical order matches visual order\n- Touch targets: minimum 48dp x 48dp\n- Compose: Modifier.semantics { role = Role.Button }\n- Testing: TalkBack navigation, Accessibility Scanner, Espresso with accessibility checks\n- Design system: accessibility tokens (contrast ratios, font sizes)\n\n**Red flags:**\n- Only tests with visual inspection\n- No semantic properties",
      tags: ["accessibility", "a11y", "talkback", "design-system"],
      related: ["tech-104", "tech-85"],
    },
  ],
]);
