# Progress API Contract

The app and this skill share one progress store: `server/server.js`, a zero-dependency
`node:sqlite` API (Node >= 22) writing `server/progress.sqlite` (gitignored).

## Where it answers

- **Through the proxy (normal):** `./start-server.sh` / `launch.bat` / `node server/proxy-server.js`
  serves the app on `http://localhost:1000` and forwards every `/api/*` request to the API on
  `127.0.0.1:1001`, spawning it on demand. Use `http://localhost:1000/api/...`.
- **Direct:** `http://127.0.0.1:1001/api/...` when the API runs on its own (`node server/server.js`,
  which binds `0.0.0.0:1001` unless `HOST` / `PORT` are set).
- The API exits after one hour with no requests and no open connections; the proxy respawns it on
  the next `/api/*` request.

All JSON responses carry `Content-Type: application/json; charset=utf-8`. Every error body is
`{ "error": "<message>" }`.

## `GET /api/progress`

`200`:

```json
{
  "ratings": { "tech-1": "know" },
  "seen": ["tech-1", "tech-2"],
  "updatedAt": "2026-09-10T06:00:00.000Z"
}
```

- `ratings`: question id -> `"know"` | `"shaky"` | `"review"`. The roadmap's "known" means `know` only.
- `seen`: question ids, no particular order.
- `updatedAt`: ISO string of the newest row timestamp, or `null` when the store is empty. Every
  row written by one PUT shares one timestamp, so this is effectively "time of the last write".

## `PUT /api/progress`

Body (both keys required):

```json
{
  "ratings": { "tech-1": "know" },
  "seen": ["tech-1", "tech-2"]
}
```

- **Replaces the whole store**: one transaction deletes every row, then inserts the body. It is not
  a patch: to record one answer, `GET` first, merge, then `PUT` the full set. Sending only the new
  id wipes everything else.
- `200` -> `{ "success": true }`.
- `seen` must not contain duplicates: the second insert violates the primary key, the transaction
  rolls back and the response is `500 { "error": "Internal server error" }`. Deduplicate first.

## `POST /api/import`

Same body and validation as `PUT`. One-time migration of browser localStorage into an empty store.

- Either table already has rows -> `200 { "imported": false, "reason": "not empty" }`, nothing written.
- Store empty -> rows inserted in one transaction -> `200 { "imported": true }`.
- The app calls it from `loadProgressWithServerFallback` when `GET` returns an empty store and
  localStorage holds `interview-ratings` / `interview-seen`; `importLocalStorageToServer` removes
  those two keys only when the response says `imported: true`.

## Validation (`PUT` and `POST`)

Checked in this order; the first failure returns `400` with that message:

| Condition | `error` |
|---|---|
| Body is not valid JSON | `Invalid JSON body` |
| Body is not a JSON object (empty body parses as `{}` and fails the next check) | `request body must be a JSON object` |
| `ratings` missing, not an object, or an array | `ratings must be an object` |
| `seen` not an array | `seen must be an array` |
| A rating value outside `know` / `shaky` / `review` | `invalid rating for question <id>: <value>` |
| A `seen` item that is not a string | `invalid seen item: <value>` |

Question ids are **not** checked against `data/*.js`: the server stores any string. Validate ids
against the bank yourself before writing.

## Other responses

| Status | When | Body |
|---|---|---|
| `404` | Any other `/api/*` path, or a method other than those above | `{ "error": "Not found" }` |
| `413` | Request body over 5 MB | `{ "error": "Payload too large" }` |
| `500` | Database could not be opened at startup (server keeps serving static files) | `{ "error": "Database unavailable (read-only mode)" }` |
| `500` | Any other server-side failure | `{ "error": "Internal server error" }` |
| `204` | `OPTIONS` from an `http(s)://localhost` or `127.0.0.1` origin (any port); allows `GET, PUT, POST, OPTIONS` and `Content-Type` | empty |
| `405` | `OPTIONS` from any other origin | `{ "error": "origin not allowed" }` |
| `502` | Proxy only: forwarding to the API failed | `API unavailable` (text/plain) |
| `503` | Proxy only: the API was not ready within 5 s of being spawned | `API starting` (text/plain, `Retry-After: 1`) |

`Access-Control-Allow-Origin` is echoed only for localhost / `127.0.0.1` origins; same-origin
calls through the proxy need no CORS at all.

## Safety rules

- Never persist raw interview transcripts or PII. The store holds only question ids, ratings and
  seen flags.
- Validate ids and ratings before writing; the server only checks types and rating values.
- Always read-merge-write: `PUT` is a full replace.
