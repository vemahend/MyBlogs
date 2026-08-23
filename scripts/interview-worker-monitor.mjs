#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const answersRoot = path.join(root, 'Interview_Answers');
const lockPath = path.join(answersRoot, '.generation.lock');
const logPath = path.join(answersRoot, 'generation.log');
const statusPath = path.join(answersRoot, 'Worker_Status.md');

function countAnswers(directory) {
  let total = 0;
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) total += countAnswers(fullPath);
    else if (entry.name.endsWith('.md') && entry.name !== 'README.md' && entry.name !== 'Generation_Status.md' && entry.name !== 'Worker_Status.md') total += 1;
  }
  return total;
}

function lastProgressLine() {
  if (!fs.existsSync(logPath)) return 'No progress log found.';
  const lines = fs.readFileSync(logPath, 'utf8').split(/\r?\n/).filter(Boolean);
  return [...lines].reverse().find((line) => /^\[\d+\/1500\]/.test(line)) || lines.at(-1) || 'No progress recorded.';
}

function workerState() {
  if (!fs.existsSync(lockPath)) return { active: false, pid: 'None' };
  const pid = Number(fs.readFileSync(lockPath, 'utf8').trim());
  if (!Number.isInteger(pid) || pid <= 0) return { active: false, pid: 'Invalid lock' };
  try {
    process.kill(pid, 0);
    return { active: true, pid };
  } catch {
    return { active: false, pid: `${pid} (stale lock)` };
  }
}

function update() {
  const state = workerState();
  const completed = countAnswers(answersRoot);
  const now = new Date().toLocaleString('en-NZ', { timeZone: 'Pacific/Auckland', hour12: false });
  const marker = state.active ? '🟢 ACTIVE' : '🔴 INACTIVE';
  const body = `# Interview Answer Worker Status\n\n## ${marker}\n\n- Last checked: ${now} (Pacific/Auckland)\n- Worker PID: ${state.pid}\n- Answer files present: ${completed} / 1500\n- Remaining by file count: ${Math.max(0, 1500 - completed)}\n- Latest checkpoint: ${lastProgressLine()}\n\nThis dashboard refreshes every 15 seconds while the monitor is running.\n`;
  const temporary = `${statusPath}.tmp`;
  fs.writeFileSync(temporary, body);
  fs.renameSync(temporary, statusPath);
}

update();
setInterval(update, 15_000);
