#!/usr/bin/env node
// Minimal file-backed coordination helper for agents
// No external deps. Node >= 16

import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(process.cwd(), 'calibrate', 'agents');
const TASKS = path.join(ROOT, 'tasks');
const INBOX = path.join(TASKS, 'inbox.jsonl');
const DONE = path.join(TASKS, 'done.jsonl');
const INPROGRESS_DIR = path.join(TASKS, 'in_progress');
const EVENTS_DIR = path.join(ROOT, 'events');
const LOCKS_DIR = path.join(ROOT, 'locks');

function ensureDirs() {
  [ROOT, TASKS, INPROGRESS_DIR, EVENTS_DIR, LOCKS_DIR].forEach((d) => {
    if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
  });
  if (!fs.existsSync(INBOX)) fs.writeFileSync(INBOX, '');
  if (!fs.existsSync(DONE)) fs.writeFileSync(DONE, '');
}

function nowIso() { return new Date().toISOString(); }
function todayYMD() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}
function genId() {
  const d = new Date();
  const iso = d.toISOString().replace(/[:.]/g, '-');
  const rand = Math.random().toString(36).slice(2, 8);
  return `${iso}-${rand}`;
}

function writeAtomic(filePath, data) {
  const dir = path.dirname(filePath);
  const tmp = path.join(dir, `.tmp-${path.basename(filePath)}-${Date.now()}`);
  fs.writeFileSync(tmp, data);
  fs.renameSync(tmp, filePath);
}

function appendJSONL(filePath, obj) {
  const line = JSON.stringify(obj) + '\n';
  fs.appendFileSync(filePath, line);
}

function readJSONL(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const txt = fs.readFileSync(filePath, 'utf8');
  return txt
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => { try { return JSON.parse(l); } catch { return null; } })
    .filter(Boolean);
}

function logEvent(agent, type, taskId, message = '', refs = []) {
  const dayDir = path.join(EVENTS_DIR, todayYMD());
  if (!fs.existsSync(dayDir)) fs.mkdirSync(dayDir, { recursive: true });
  const file = path.join(dayDir, `${agent}.jsonl`);
  appendJSONL(file, { type, task_id: taskId, agent, message, refs, ts: nowIso() });
}

function usage() {
  console.log(`Usage:
  node agents/bin/agents-cli.mjs list-inbox
  node agents/bin/agents-cli.mjs new-task --title <t> --dod <txt> [--refs <csv>] [--inputs <json>]
  node agents/bin/agents-cli.mjs claim --id <task-id> --agent <codex|claude|cursor>
  node agents/bin/agents-cli.mjs handoff --id <task-id> --agent <me> --to <agent> --message <text> [--next <json>]
  node agents/bin/agents-cli.mjs complete --id <task-id> --agent <me> [--outputs <json>] [--message <text>]
  node agents/bin/agents-cli.mjs log-event --agent <me> --type <t> --id <task-id> [--message <m>] [--refs <csv>]
`);
}

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') break;
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
      args[key] = val;
    } else {
      (args._ = args._ || []).push(a);
    }
  }
  return args;
}

function listInbox() {
  const items = readJSONL(INBOX);
  console.log(JSON.stringify(items, null, 2));
}

function newTask({ title, dod, refs = '', inputs }) {
  if (!title || !dod) { console.error('Missing --title or --dod'); process.exit(1); }
  const id = genId();
  const obj = {
    id,
    title,
    status: 'inbox',
    owner: null,
    definition_of_done: dod,
    context_refs: refs ? refs.split(',').map((s) => s.trim()).filter(Boolean) : [],
    inputs: inputs ? JSON.parse(inputs) : {},
    outputs: [],
    next_steps: [],
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  appendJSONL(INBOX, obj);
  console.log(id);
}

function claim({ id, agent }) {
  if (!id || !agent) { console.error('Missing --id or --agent'); process.exit(1); }
  const lockPath = path.join(LOCKS_DIR, `${id}.lock`);
  if (fs.existsSync(lockPath)) { console.error('Task locked'); process.exit(2); }
  const inbox = readJSONL(INBOX);
  const idx = inbox.findIndex((t) => t.id === id);
  if (idx === -1) { console.error('Task not in inbox'); process.exit(3); }
  const task = { ...inbox[idx], status: 'claimed', owner: agent, updated_at: nowIso() };
  // rewrite inbox without the claimed task
  const filtered = inbox.filter((t) => t.id !== id).map((t) => JSON.stringify(t)).join('\n');
  writeAtomic(INBOX, filtered ? filtered + '\n' : '');
  // write in_progress file
  const ipPath = path.join(INPROGRESS_DIR, `${id}.json`);
  writeAtomic(ipPath, JSON.stringify(task, null, 2));
  // create lock
  writeAtomic(lockPath, JSON.stringify({ task_id: id, owner: agent, since: nowIso() }, null, 2));
  logEvent(agent, 'claimed', id, 'claimed task');
  console.log(`claimed ${id}`);
}

function complete({ id, agent, outputs = '[]', message = 'completed' }) {
  if (!id || !agent) { console.error('Missing --id or --agent'); process.exit(1); }
  const ipPath = path.join(INPROGRESS_DIR, `${id}.json`);
  if (!fs.existsSync(ipPath)) { console.error('Task not in progress'); process.exit(2); }
  const task = JSON.parse(fs.readFileSync(ipPath, 'utf8'));
  task.status = 'done';
  task.updated_at = nowIso();
  try { task.outputs = JSON.parse(outputs); } catch {}
  appendJSONL(DONE, task);
  fs.unlinkSync(ipPath);
  const lockPath = path.join(LOCKS_DIR, `${id}.lock`);
  if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  logEvent(agent, 'done', id, message);
  console.log(`done ${id}`);
}

function handoff({ id, agent, to, message = 'handoff', next = '[]' }) {
  if (!id || !agent || !to) { console.error('Missing --id, --agent, or --to'); process.exit(1); }
  // Create a new inbox task for the recipient
  let nextSteps = [];
  try { nextSteps = JSON.parse(next); } catch {}
  const newId = genId();
  const obj = {
    id: newId,
    title: `Follow-up from ${id}`,
    status: 'inbox',
    owner: null,
    definition_of_done: 'Complete the follow-up steps provided',
    context_refs: [],
    inputs: { from_task: id },
    outputs: [],
    next_steps: nextSteps,
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  appendJSONL(INBOX, obj);
  logEvent(agent, 'handoff', id, message, []);
  console.log(`handoff created ${newId}`);
}

function logEventCmd({ agent, type, id, message = '', refs = '' }) {
  if (!agent || !type || !id) { console.error('Missing --agent, --type, or --id'); process.exit(1); }
  const refsArr = refs ? refs.split(',').map((s) => s.trim()).filter(Boolean) : [];
  logEvent(agent, type, id, message, refsArr);
  console.log('event logged');
}

function main() {
  ensureDirs();
  const [cmd, ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);
  switch (cmd) {
    case 'list-inbox': return listInbox();
    case 'new-task': return newTask(args);
    case 'claim': return claim(args);
    case 'complete': return complete(args);
    case 'handoff': return handoff(args);
    case 'log-event': return logEventCmd(args);
    default: usage(); process.exit(1);
  }
}

main();

