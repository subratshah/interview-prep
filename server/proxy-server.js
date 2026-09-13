const http = require('http');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const PORT = process.env.PORT || 1000;
const HOST = process.env.HOST || '0.0.0.0';
const ROOT = path.join(__dirname, '..');
const API_PORT = Number(process.env.API_PORT || 1001);
const API_HOST = '127.0.0.1';
const API_READY_TIMEOUT_MS = 5000;

let apiProcess = null;
let apiReady = false;
let starting = false;
const waiting = []; // callbacks run once apiReady flips (or startup fails)

function wakeWaiters() {
  const pending = waiting.splice(0);
  pending.forEach(cb => cb());
}

function startApi() {
  if (apiProcess || starting) return;
  starting = true;
  console.log(`Starting API server on ${API_HOST}:${API_PORT} ...`);
  try {
    apiProcess = spawn(process.execPath, [path.join(__dirname, 'server.js')], {
      stdio: 'inherit',
      env: { ...process.env, PORT: String(API_PORT), HOST: API_HOST },
    });
  } catch (err) {
    starting = false;
    console.error('Failed to spawn API:', err && err.message);
    wakeWaiters();
    return;
  }
  starting = false;
  apiProcess.on('error', err => {
    console.error('API process error:', err && err.message);
  });
  apiProcess.on('close', (code, signal) => {
    console.log(`API process exited (code=${code} signal=${signal}); will respawn on next API request.`);
    apiProcess = null;
    apiReady = false;
    wakeWaiters();
  });
  // poll until the API is actually listening
  const deadline = Date.now() + API_READY_TIMEOUT_MS;
  const tryConnect = () => {
    const req = http.get(`http://${API_HOST}:${API_PORT}/api/progress`, res => {
      res.resume();
      apiReady = true;
      console.log('API is ready.');
      wakeWaiters();
    });
    req.on('error', () => {
      if (Date.now() > deadline) {
        console.error('API did not come up within ' + API_READY_TIMEOUT_MS + 'ms.');
        wakeWaiters();
      } else {
        setTimeout(tryConnect, 100);
      }
    });
    req.setTimeout(1000, () => req.destroy());
  };
  tryConnect();
}

function isApiRequest(pathname) { return pathname.startsWith('/api/'); }

function serveStatic(pathname, res) {
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(ROOT, decodeURIComponent(filePath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404); return res.end('Not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    const mime = {
      '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css',
      '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    }[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': mime });
    fs.createReadStream(filePath).pipe(res);
  });
}

function forwardToApi(req, res) {
  const t0 = Date.now();
  const options = {
    hostname: API_HOST, port: API_PORT, path: req.url,
    method: req.method, headers: req.headers,
  };
  const proxyReq = http.request(options, proxyRes => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    res.on('finish', () => {
      console.log(`[proxy] ${req.method} ${req.url}  ->  ${proxyRes.statusCode}  (${Date.now() - t0}ms)`);
    });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => {
    console.log(`[proxy] ${req.method} ${req.url}  ->  502 (API connect failed)`);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('API unavailable');
  });
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  if (isApiRequest(pathname)) {
    if (!apiProcess && !apiReady) startApi();
    if (apiReady) {
      forwardToApi(req, res);
      return;
    }
    // hold the request until the API is up instead of failing it with 502
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      if (apiReady) {
        forwardToApi(req, res);
      } else {
        console.log(`[proxy] ${req.method} ${req.url}  ->  503 (API not ready after ${API_READY_TIMEOUT_MS}ms)`);
        res.writeHead(503, { 'Retry-After': '1', 'Content-Type': 'text/plain' });
        res.end('API starting');
      }
    };
    const timer = setTimeout(() => {
      const i = waiting.indexOf(finish);
      if (i >= 0) waiting.splice(i, 1);
      finish();
    }, API_READY_TIMEOUT_MS);
    waiting.push(finish);
  } else {
    serveStatic(pathname, res);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Proxy server running on http://${HOST}:${PORT}, API on ${API_PORT}`);
  startApi(); // eager: API is up before the browser's first request
});

process.on('SIGINT', () => { if (apiProcess) apiProcess.kill(); process.exit(0); });
process.on('SIGTERM', () => { if (apiProcess) apiProcess.kill(); process.exit(0); });
