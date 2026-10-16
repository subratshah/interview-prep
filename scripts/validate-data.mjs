#!/usr/bin/env node
// Static gate for /data: loads every question file and the notes registry the
// way index.html does (into a fake window), then checks the schema rules from
// AGENTS.md. Exits 1 on any error; warnings never fail the run.
//   node scripts/validate-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const TOPIC_FILES = ['android', 'behavioral', 'data-structures', 'system-design'];
const PREFIX = { android: 'tech', behavioral: 'behav', 'data-structures': 'ds', 'system-design': 'sd' };
const REQUIRED = {
  android: ['answer', 'keyPoints', 'redFlags'],
  'data-structures': ['answer', 'keyPoints', 'redFlags', 'complexity'],
  behavioral: ['listenFor', 'starGuide', 'redFlags'],
  'system-design': ['scope', 'functional', 'nfr', 'entities', 'api', 'architecture', 'deepDives', 'pitfalls'],
};
// System design follows the Hello Interview order: trade-offs and follow-ups live inside deep
// dives and a storage table under Core Entities, so the retired keys are errors.
const FORBIDDEN = {
  android: ['complexity', 'expectedAnswer'],
  'data-structures': ['expectedAnswer'],
  behavioral: ['expectedAnswer'],
  'system-design': ['approach', 'tradeoffs', 'followUp', 'dataModel'],
};
const SCOPE_MARKER = /\*\*[^*\n]*assumption[^*\n]*\*\*/i;

const registry = {};
const notes = [];
const ctx = {
  QuestionDB: { register(name, qs) { registry[name] = qs; } },
  NotesDB: { register(arr) { notes.push(...arr); } },
};
ctx.window = ctx;
vm.createContext(ctx);
for (const t of TOPIC_FILES) {
  vm.runInContext(fs.readFileSync(path.join(root, 'data', `${t}.js`), 'utf8'), ctx, { filename: `data/${t}.js` });
}
vm.runInContext(fs.readFileSync(path.join(root, 'data/notes.js'), 'utf8'), ctx, { filename: 'data/notes.js' });

const errors = [];
const warnings = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const warn = (id, msg) => warnings.push(`${id}: ${msg}`);

const allIds = new Map();
for (const [topic, qs] of Object.entries(registry)) {
  for (const q of qs) {
    if (allIds.has(q.id)) err(q.id, `duplicate id (also in ${allIds.get(q.id)})`);
    allIds.set(q.id, topic);
  }
}

const titles = new Map();
for (const [topic, qs] of Object.entries(registry)) {
  for (const q of qs) {
    const id = q.id || '(no id)';
    const m = /^([a-z]+)-(\d+)$/.exec(q.id || '');
    if (!m || m[1] !== PREFIX[topic]) err(id, `id prefix should be ${PREFIX[topic]}-N`);
    else if (q.num !== Number(m[2])) err(id, `num ${q.num} != id suffix ${m[2]}`);
    if (!['E', 'M', 'H'].includes(q.difficulty)) err(id, `difficulty ${q.difficulty}`);
    if (typeof q.star !== 'boolean') err(id, 'star not boolean');
    if (!q.section) err(id, 'missing section');
    if (!q.title) err(id, 'missing title');
    if (!Array.isArray(q.tags) || !q.tags.length) err(id, 'tags missing/empty');
    if (!Array.isArray(q.related)) err(id, 'related not array');
    for (const r of q.related || []) {
      if (!allIds.has(r)) err(id, `related -> unknown ${r}`);
      if (r === q.id) err(id, 'related to itself');
    }
    if (new Set(q.related || []).size !== (q.related || []).length) warn(id, 'duplicate related id');
    for (const f of REQUIRED[topic]) if (!q[f] || !String(q[f]).trim()) err(id, `missing ${f}`);
    for (const f of FORBIDDEN[topic] || []) if (q[f] !== undefined) err(id, `forbidden field ${f}`);
    if (q.answer) {
      const bullets = String(q.answer).split('\n').filter((l) => /^\s*[-*]\s/.test(l)).length;
      if (bullets > 3) err(id, `answer has ${bullets} bullets (max 3)`);
      if (q.keyPoints && q.keyPoints.length < q.answer.length) warn(id, 'keyPoints shorter than answer');
    }
    if (topic === 'system-design' && q.scope && !SCOPE_MARKER.test(q.scope)) warn(id, 'scope has no **…assumptions…** marker');
    const key = q.title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (titles.has(key)) warn(id, `same title as ${titles.get(key)}`);
    titles.set(key, id);
  }
}

const noteIds = new Set();
for (const n of notes) {
  if (noteIds.has(n.id)) err(`note:${n.id}`, 'duplicate note id');
  noteIds.add(n.id);
  if (!registry[n.topic]) err(`note:${n.id}`, `unknown topic ${n.topic}`);
  const file = path.join(root, n.file || '');
  if (!n.file || !fs.existsSync(file)) { err(`note:${n.id}`, `file missing ${n.file}`); continue; }
  if (!new RegExp(`^data/notes/${n.topic}/\\d{2}-[a-z0-9-]+\\.md$`).test(n.file)) warn(`note:${n.id}`, `file path shape ${n.file}`);
  for (const r of n.related || []) if (!allIds.has(r)) err(`note:${n.id}`, `related -> unknown ${r}`);
  const md = fs.readFileSync(file, 'utf8');
  for (const m of md.matchAll(/<!--\s*related:\s*([^>]*?)\s*-->/g)) {
    for (const r of m[1].split(/[\s,]+/).filter(Boolean)) if (!allIds.has(r)) err(`note:${n.id}`, `section related -> unknown ${r}`);
  }
  if ((md.match(/^# /gm) || []).length !== 1) warn(`note:${n.id}`, 'expected exactly one H1');
}
for (const t of TOPIC_FILES) {
  const dir = path.join(root, 'data/notes', t);
  if (!fs.existsSync(dir)) continue;
  for (const f of fs.readdirSync(dir)) {
    if (!notes.some((n) => n.file === `data/notes/${t}/${f}`)) warn(`file:${t}/${f}`, 'note file not registered');
  }
}

const counts = Object.entries(registry).map(([t, qs]) => `${t} ${qs.length}`).join(', ');
for (const w of warnings) console.log(`warn  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`\n${counts}; notes ${notes.length}; ${errors.length} errors, ${warnings.length} warnings`);
process.exit(errors.length ? 1 : 0);
