'use strict';

// Zero-dependency progress server.
// Uses the built-in `node:sqlite` module (Node v22.5+/v24+). No Express, no sqlite3 npm package.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 1001;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.join(__dirname, '..');
const DB_PATH = path.join(__dirname, 'progress.sqlite');

const VALID_RATINGS = new Set(['know', 'shaky', 'review']);

// ---------------------------------------------------------------------------
// Database setup
// ---------------------------------------------------------------------------
let db = null;
let dbReadOnly = false;

function openDatabase() {
  try {
    db = new DatabaseSync(DB_PATH);
    db.exec(`
      CREATE TABLE IF NOT EXISTS ratings (
        question_id TEXT PRIMARY KEY,
        rating TEXT CHECK(rating IN ('know', 'shaky', 'review')),
        updated_at INT
      );
      CREATE TABLE IF NOT EXISTS seen (
        question_id TEXT PRIMARY KEY,
        seen_at INT
      );
    `);
    console.log(`SQLite database opened at ${DB_PATH}`);
  } catch (err) {
    dbReadOnly = true;
    db = null;
    const msg = err && err.message ? err.message : String(err);
    console.error('============================================================');
    console.error('LOUD STARTUP ERROR: Could not open SQLite database: ' + msg);
    console.error('Server is continuing in READ-ONLY mode.');
    console.error('  - API routes (/api/*) will return HTTP 500 JSON.');
    console.error('  - Static file serving still works.');
    console.error('============================================================');
  }
}

openDatabase();

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------
function validateBody(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'request body must be a JSON object';
  }
  const { ratings, seen } = body;
  if (!ratings || typeof ratings !== 'object' || Array.isArray(ratings)) {
    return 'ratings must be an object';
  }
  if (!Array.isArray(seen)) {
    return 'seen must be an array';
  }
  for (const [qid, rating] of Object.entries(ratings)) {
    if (typeof rating !== 'string' || !VALID_RATINGS.has(rating)) {
      return `invalid rating for question ${qid}: ${JSON.stringify(rating)}`;
    }
  }
  for (const qid of seen) {
    if (typeof qid !== 'string') {
      return `invalid seen item: ${JSON.stringify(qid)}`;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Data access
// ---------------------------------------------------------------------------
function getProgress() {
  const ratingsStmt = db.prepare('SELECT question_id, rating FROM ratings');
  const seenStmt = db.prepare('SELECT question_id FROM seen');
  const maxStmt = db.prepare(
    'SELECT MAX(m) AS m FROM (SELECT MAX(updated_at) AS m FROM ratings ' +
    'UNION SELECT MAX(seen_at) AS m FROM seen)'
  );

  const ratings = {};
  for (const row of ratingsStmt.all()) {
    ratings[row.question_id] = row.rating;
  }

  const seen = seenStmt.all().map((r) => r.question_id);

  const maxRow = maxStmt.get();
  const updatedAt =
    maxRow && maxRow.m != null ? new Date(maxRow.m).toISOString() : null;

  return { ratings, seen, updatedAt };
}

function putProgress(body) {
  const err = validateBody(body);
  if (err) {
    const e = new Error(err);
    e.status = 400;
    throw e;
  }
  const { ratings, seen } = body;
  const now = Date.now();

  db.exec('BEGIN');
  try {
    db.exec('DELETE FROM ratings');
    db.exec('DELETE FROM seen');

    const insR = db.prepare(
      'INSERT INTO ratings (question_id, rating, updated_at) VALUES (?, ?, ?)'
    );
    for (const [qid, rating] of Object.entries(ratings)) {
      insR.run(qid, rating, now);
    }

    const insS = db.prepare(
      'INSERT INTO seen (question_id, seen_at) VALUES (?, ?)'
    );
    for (const qid of seen) {
      insS.run(qid, now);
    }

    db.exec('COMMIT');
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch (_) {
      /* ignore rollback error */
    }
    throw e;
  }

  return { success: true };
}

function importProgress(body) {
  const err = validateBody(body);
  if (err) {
    const e = new Error(err);
    e.status = 400;
    throw e;
  }
  const { ratings, seen } = body;

  const countR = db.prepare('SELECT COUNT(*) AS c FROM ratings');
  const countS = db.prepare('SELECT COUNT(*) AS c FROM seen');
  const rCount = countR.get().c;
  const sCount = countS.get().c;

  if (rCount > 0 || sCount > 0) {
    return { imported: false, reason: 'not empty' };
  }

  const now = Date.now();
  db.exec('BEGIN');
  try {
    const insR = db.prepare(
      'INSERT INTO ratings (question_id, rating, updated_at) VALUES (?, ?, ?)'
    );
    for (const [qid, rating] of Object.entries(ratings)) {
      insR.run(qid, rating, now);
    }

    const insS = db.prepare(
      'INSERT INTO seen (question_id, seen_at) VALUES (?, ?)'
    );
    for (const qid of seen) {
      insS.run(qid, now);
    }

    db.exec('COMMIT');
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch (_) {
      /* ignore rollback error */
    }
    throw e;
  }

  return { imported: true };
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------
function sendJson(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
  });
  res.end(body);
}

function handleApi(res, fn) {
  if (dbReadOnly || !db) {
    return sendJson(res, 500, { error: 'Database unavailable (read-only mode)' });
  }
  try {
    const result = fn();
    return sendJson(res, 200, result);
  } catch (err) {
    const status = err.status || 500;
    const message =
      status === 500 ? 'Internal server error' : err.message || 'Error';
    if (status === 500) {
      console.error('API error:', err);
    }
    return sendJson(res, status, { error: message });
  }
}

function readJson(req, res, cb) {
  let data = '';
  let aborted = false;

  req.on('data', (chunk) => {
    if (aborted) return;
    data += chunk;
    if (data.length > 5 * 1024 * 1024) {
      aborted = true;
      sendJson(res, 413, { error: 'Payload too large' });
      req.destroy();
    }
  });

  req.on('end', () => {
    if (aborted) return;
    let body;
    try {
      body = data ? JSON.parse(data) : {};
    } catch (_) {
      return sendJson(res, 400, { error: 'Invalid JSON body' });
    }
    cb(body);
  });

  req.on('error', () => {
    if (!aborted) {
      aborted = true;
      try {
        sendJson(res, 400, { error: 'Request error' });
      } catch (_) {
        /* ignore */
      }
    }
  });
}

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
};

function serveStatic(pathname, res) {
  let relPath = pathname === '/' ? 'index.html' : pathname;

  // Normalize and strip any leading traversals.
  relPath = path.normalize(relPath).replace(/^(\.\.[/\\])+/, '');
  if (relPath.startsWith('..') || path.isAbsolute(relPath)) {
    return sendJson(res, 404, { error: 'Not found' });
  }

  const safePath = path.normalize(path.join(ROOT, relPath));
  if (safePath !== ROOT && !safePath.startsWith(ROOT + path.sep)) {
    return sendJson(res, 404, { error: 'Not found' });
  }

  fs.stat(safePath, (err, stat) => {
    if (err || !stat.isFile()) {
      return sendJson(res, 404, { error: 'Not found' });
    }
    const ext = path.extname(safePath).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stat.size,
    });
    const stream = fs.createReadStream(safePath);
    stream.on('error', () => {
      try {
        res.end();
      } catch (_) {
        /* ignore */
      }
    });
    stream.pipe(res);
  });
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------
const server = http.createServer((req, res) => {
  touchActivity();
  // CORS: the page may be served from any local port (1000, 8899, 8888…) while
  // this API lives on 1001 — a different origin, so every write is cross-origin
  // and browsers preflight it. Echo the requester's origin; this is a local
  // progress store, there is nothing on it worth protecting from a localhost
  // peer, and without the preflight answer PUT/POST silently never arrive.
  const origin = req.headers.origin;
  if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS') {
    if (origin && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Access-Control-Max-Age', '86400');
      res.writeHead(204);
      res.end();
      return;
    }
    return sendJson(res, 405, { error: 'origin not allowed' });
  }
  // Per-request log line for API calls: method, path, status, duration,
  // and (for PUT/POST) how many ratings/seen entries arrived.
  if (req.url.startsWith('/api/')) {
    const t0 = Date.now();
    let reqBody = '';
    req.on('data', (c) => {
      if (reqBody.length < 1_000_000) reqBody += c;
    });
    res.on('finish', () => {
      let extra = '';
      if ((req.method === 'PUT' || req.method === 'POST') && reqBody) {
        try {
          const b = JSON.parse(reqBody);
          extra = `  ratings=${Object.keys(b.ratings || {}).length} seen=${(b.seen || []).length}`;
        } catch (_) {
          extra = '  <bad json>';
        }
      }
      console.log(
        `[api] ${String(req.method).padEnd(4)} ${req.url}  ->  ${res.statusCode}  (${Date.now() - t0}ms)${extra}`
      );
    });
  }
  let pathname;
  try {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    pathname = decodeURIComponent(url.pathname);
  } catch (_) {
    return sendJson(res, 400, { error: 'Bad request' });
  }

  // API routes take precedence over static serving.
  if (pathname === '/api/progress' && req.method === 'GET') {
    return handleApi(res, () => getProgress());
  }
  if (pathname === '/api/progress' && req.method === 'PUT') {
    return readJson(req, res, (body) =>
      handleApi(res, () => putProgress(body))
    );
  }
  if (pathname === '/api/import' && req.method === 'POST') {
    return readJson(req, res, (body) =>
      handleApi(res, () => importProgress(body))
    );
  }
  if (pathname.startsWith('/api/')) {
    return sendJson(res, 404, { error: 'Not found' });
  }

  return serveStatic(pathname, res);
});

let lastActivity = Date.now();
const IDLE_TIMEOUT_MS = 3_600_000; // shut down after 1 hour of inactivity
let connections = 0;

function touchActivity() { lastActivity = Date.now(); }

server.on('connection', (socket) => {
  connections++;
  socket.on('close', () => { connections--; });
});

server.listen(PORT, HOST, () => {
  console.log(`Server running on http://${HOST}:${PORT}`);
  if (dbReadOnly) {
    console.log('WARNING: running in read-only mode (database unavailable).');
  }
  console.log(`Idle shutdown enabled: ${IDLE_TIMEOUT_MS/1000}s`);
});

setInterval(() => {
  if (server.listening && Date.now() - lastActivity > IDLE_TIMEOUT_MS && connections === 0) {
    console.log('Idle timeout reached, shutting down server.');
    server.close(() => process.exit(0));
  }
}, 5_000);

