# Progress API Contract

The interview-prep skill uses the local server's SQLite-backed progress API to persist review state across sessions.

## `GET /api/progress`

Returns the current progress state:

```json
{
  "ratings": {
    "tech-1": 4
  },
  "seen": ["tech-1", "tech-2"],
  "updatedAt": "2026-09-10T06:00:00Z"
}
```

- `ratings`: question ID to integer rating, normally 1-5.
- `seen`: question IDs seen during interviews.
- `updatedAt`: last progress mutation timestamp.

## `PUT /api/progress`

Replaces the progress state atomically.

Request:

```json
{
  "ratings": {
    "tech-1": 4
  },
  "seen": ["tech-1", "tech-2"]
}
```

The server validates the JSON body, question IDs, and rating range before writing.

## `POST /api/import`

Imports existing localStorage progress when the SQLite store is empty.

Request:

```json
{
  "ratings": {
    "tech-1": 4
  },
  "seen": ["tech-1", "tech-2"]
}
```

The import is idempotent. After a successful import, the browser clears the old localStorage keys so they are not imported repeatedly.

## Safety rules

- Never persist raw interview transcripts or PII.
- Store only question IDs and ratings/seen flags.
- Validate all inputs before writing.
- Use transactions for multi-row writes.
