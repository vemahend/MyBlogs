#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Resolve the workspace from this script so a detached service does not depend
// on the launcher's working directory.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = path.join(root, 'INTERVIEW_QUESTIONS.md');
const promptPath = path.join(root, 'Prompt.md');
const outputRoot = path.join(root, 'Interview_Answers');
const bundledCodex = '/Users/deepalimehra/.vscode/extensions/openai.chatgpt-26.810.52044-darwin-arm64/bin/macos-aarch64/codex';
const codexExecutable = process.env.CODEX_BIN || (fs.existsSync(bundledCodex) ? bundledCodex : 'codex');
const validateOnly = process.argv.includes('--validate-only');
const limitArg = process.argv.find((value) => value.startsWith('--limit='));
const limit = limitArg ? Number(limitArg.split('=')[1]) : Number.POSITIVE_INFINITY;

const requiredSections = [
  '## 1. What problem does it solve?',
  '## 2. Explain it in simple language',
  '## 3. How does it work internally?',
  '## 4. Realistic payment or banking example',
  '## 5. Successful flow and failure flow',
  '## 6. Practical C#/.NET implementation',
  '## 7. Important design decisions',
  '## 8. When to use it and when not to use it',
  '## 9. Compare it with related concepts',
  '## 10. Common production mistakes',
  '## 11. Interview-ready answer',
  '## 12. Test my understanding interactively',
  '## Revision card',
];

function fail(message) {
  console.error(`PRECHECK FAILED: ${message}`);
  process.exit(2);
}

function readRequired(file, displayName) {
  let stat;
  try {
    stat = fs.statSync(file);
    fs.accessSync(file, fs.constants.R_OK);
  } catch (error) {
    fail(`${displayName} is missing or unreadable: ${error.message}`);
  }
  if (!stat.isFile()) fail(`${displayName} is not a regular file.`);
  if (stat.size === 0) fail(`${displayName} is empty.`);
  const text = fs.readFileSync(file, 'utf8');
  if (!text.trim()) fail(`${displayName} contains no readable content.`);
  return text;
}

function slug(value) {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-+/g, '-');
}

function titleSlug(value) {
  return slug(value).toLowerCase().slice(0, 140).replace(/-+$/g, '') || 'question';
}

function parseQuestions(markdown) {
  const lines = markdown.split(/\r?\n/);
  const sectionOccurrences = [];
  const questions = [];
  let currentHeading = null;

  lines.forEach((line, index) => {
    const heading = line.match(/^(#{2,6})\s+(.+?)\s*$/);
    if (heading) {
      currentHeading = { title: heading[2], level: heading[1].length, line: index + 1 };
      return;
    }
    const question = line.match(/^\s*(\d+)[.)]\s*(.*)$/);
    if (!question) return;
    if (!currentHeading) fail(`question on line ${index + 1} is outside a technology/category section.`);
    let section = sectionOccurrences.at(-1);
    if (!section || section.line !== currentHeading.line) {
      section = { ...currentHeading, order: sectionOccurrences.length + 1, questions: [] };
      sectionOccurrences.push(section);
    }
    const item = {
      numberText: question[1],
      number: Number(question[1]),
      title: question[2].trim(),
      exact: `${question[1]}. ${question[2].trim()}`,
      line: index + 1,
      section,
    };
    if (!item.title) fail(`empty question at line ${item.line} in “${section.title}”.`);
    section.questions.push(item);
    questions.push(item);
  });

  if (!questions.length) fail('no questions could be parsed reliably.');
  for (const section of sectionOccurrences) {
    const seen = new Map();
    let expected = 1;
    for (const question of section.questions) {
      if (seen.has(question.number)) {
        fail(`duplicate question number ${question.number} in “${section.title}” at lines ${seen.get(question.number)} and ${question.line}.`);
      }
      seen.set(question.number, question.line);
      if (question.number !== expected) {
        fail(`invalid numbering in “${section.title}” at line ${question.line}: expected ${expected}, found ${question.number}.`);
      }
      expected += 1;
    }
  }
  return { sectionOccurrences, questions };
}

function configurePaths(sections) {
  const sectionWidth = String(sections.length).length;
  for (const section of sections) {
    section.folder = `${String(section.order).padStart(sectionWidth, '0')}-${slug(section.title)}`;
    for (const question of section.questions) {
      const qWidth = Math.max(3, String(section.questions.length).length);
      question.filename = `${String(section.order).padStart(sectionWidth, '0')}-${String(question.number).padStart(qWidth, '0')}-${titleSlug(question.title)}.md`;
      question.relativePath = path.join(section.folder, question.filename);
      question.outputPath = path.join(outputRoot, question.relativePath);
    }
  }
}

function duplicateTitles(questions) {
  const first = new Map();
  const duplicates = [];
  for (const q of questions) {
    const key = q.title.toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (first.has(key)) duplicates.push([first.get(key), q]);
    else first.set(key, q);
  }
  return duplicates;
}

function inspectAnswer(question) {
  if (!fs.existsSync(question.outputPath)) return { complete: false, reason: 'file does not exist' };
  const body = fs.readFileSync(question.outputPath, 'utf8');
  if (!body.trim()) return { complete: false, reason: 'file is empty' };
  const requiredMetadata = [
    `# ${question.numberText}. ${question.title}`,
    `**Technology:** ${question.section.title}`,
    `**Source question:** ${question.exact}`,
  ];
  for (const marker of [...requiredMetadata, ...requiredSections]) {
    if (!body.includes(marker)) return { complete: false, reason: `missing required marker: ${marker}` };
  }
  const fences = (body.match(/^```/gm) || []).length;
  if (fences % 2 !== 0) return { complete: false, reason: 'unbalanced Markdown code fences' };
  if (body.trim().length < 3500) return { complete: false, reason: 'answer appears truncated (under 3,500 characters)' };
  const ending = body.slice(-1800);
  if (!ending.includes('## Revision card')) return { complete: false, reason: 'revision card is not at the completed ending' };
  return { complete: true, reason: 'all structural checks passed' };
}

function statusSummary(records, total) {
  const count = (name) => records.filter((r) => r.status === name).length;
  const handled = new Set(records.filter((r) => r.status !== 'Failed').map((r) => r.key)).size;
  return {
    total,
    completed: count('Completed'),
    alreadyComplete: count('Already complete'),
    repaired: count('Repaired'),
    failed: count('Failed'),
    remaining: Math.max(0, total - handled),
  };
}

function writeStatus(records, questions, preflight) {
  const latest = new Map();
  for (const record of records) latest.set(record.key, record);
  const normalized = questions.map((q) => latest.get(`${q.section.order}:${q.number}`)).filter(Boolean);
  const summary = statusSummary(normalized, questions.length);
  const rows = normalized.map((r) => `| ${r.number} | ${r.technology.replace(/\|/g, '\\|')} | ${r.title.replace(/\|/g, '\\|')} | [${r.filename}](./${r.relativePath.split(path.sep).join('/')}) | ${r.status} | ${r.validation} | ${r.error || ''} |`);
  const body = `# Interview Answer Generation Status\n\n## Pre-execution validation\n\n${preflight}\n\n## Summary\n\n- Total questions discovered: ${summary.total}\n- Completed: ${summary.completed}\n- Already complete: ${summary.alreadyComplete}\n- Repaired: ${summary.repaired}\n- Failed: ${summary.failed}\n- Remaining: ${summary.remaining}\n\n## Question status\n\n| Source # | Technology | Question title | Output | Status | Validation | Error |\n|---:|---|---|---|---|---|---|\n${rows.join('\n')}\n`;
  fs.writeFileSync(path.join(outputRoot, 'Generation_Status.md'), body);
}

function writeIndexes(sections, records) {
  const latest = new Map(records.map((r) => [r.key, r]));
  for (const section of sections) {
    const lines = section.questions.map((q) => {
      const record = latest.get(`${section.order}:${q.number}`);
      return `${q.number}. [${q.title}](./${q.filename}) — ${record?.status || 'Pending'}`;
    });
    fs.writeFileSync(path.join(outputRoot, section.folder, 'README.md'), `# ${section.title} Interview Questions\n\nTotal questions: ${section.questions.length}\n\n${lines.join('\n')}\n`);
  }
  const summary = statusSummary([...latest.values()], sections.reduce((n, s) => n + s.questions.length, 0));
  const blocks = sections.map((section) => {
    const links = section.questions.map((q) => `${q.number}. [${q.title}](./${q.relativePath.split(path.sep).join('/')})`).join('\n');
    return `## ${section.order}. ${section.title}\n\n[Technology index](./${section.folder}/README.md) · ${section.questions.length} questions\n\n${links}`;
  });
  const revision = sections.map((s) => `${s.order}. [${s.title}](./${s.folder}/README.md)`).join('\n');
  fs.writeFileSync(path.join(outputRoot, 'README.md'), `# Interview Answers\n\n- Technology/category sections: ${sections.length}\n- Total questions: ${summary.total}\n- Completed: ${summary.completed}\n- Already complete: ${summary.alreadyComplete}\n- Repaired: ${summary.repaired}\n- Failed: ${summary.failed}\n- Remaining: ${summary.remaining}\n\n## Recommended revision order\n\nFollow the source order, which moves from core senior topics through specialist and scenario sections:\n\n${revision}\n\n${blocks.join('\n\n')}\n`);
}

function generationPrompt(question, authoritativePrompt) {
  return `Generate exactly one interview answer file at ${path.relative(root, question.outputPath)}.\n\nSOURCE METADATA (preserve verbatim):\n# ${question.numberText}. ${question.title}\n\n**Technology:** ${question.section.title}\n\n**Source question:** ${question.exact}\n\nThe complete authoritative Prompt.md follows:\n\n---\n${authoritativePrompt}\n---\n\nBatch override: include exactly one unanswered scenario-based interview question in section 12, state that the reader can answer it during revision, do not answer it, then continue to and finish the Revision card. Use the exact 12 numbered section headings from Prompt.md and the exact heading “## Revision card”. Produce a focused, question-specific, senior-level answer of approximately 1,500–2,000 words. Use current supported APIs and mention versions where behavior depends on them. Do not modify any other answer file, source file, status file, or index. Write the Markdown file directly; do not merely print the answer in your final response.`;
}

function generate(question, authoritativePrompt) {
  fs.mkdirSync(path.dirname(question.outputPath), { recursive: true });
  const result = spawnSync(codexExecutable, [
    'exec', '--ephemeral', '--sandbox', 'workspace-write',
    '--cd', root, generationPrompt(question, authoritativePrompt),
  ], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 });
  if (result.error) {
    throw new Error(`unable to start or complete codex: ${result.error.message}`);
  }
  if (result.signal) {
    throw new Error(`codex was terminated by signal ${result.signal}`);
  }
  if (result.status !== 0) {
    throw new Error((result.stderr || result.stdout || `codex exited ${result.status}`).trim().slice(-2000));
  }
}

const source = readRequired(sourcePath, 'INTERVIEW_QUESTIONS.md');
const authoritativePrompt = readRequired(promptPath, 'Prompt.md');
for (const marker of requiredSections.slice(0, 12)) {
  if (!authoritativePrompt.includes(marker)) fail(`Prompt.md cannot be parsed: missing “${marker}”.`);
}

const { sectionOccurrences: sections, questions } = parseQuestions(source);
configurePaths(sections);
const duplicates = duplicateTitles(questions);
const preflight = `- Source: \`INTERVIEW_QUESTIONS.md\` (readable and non-empty)\n- Prompt: \`Prompt.md\` (readable, non-empty, and all 12 required sections parsed)\n- Technology/category sections: ${sections.length}\n- Questions: ${questions.length}\n- Missing numbers: 0\n- Duplicate numbers within a section: 0\n- Inconsistent numbering: 0\n- Empty questions: 0\n- Questions outside a section: 0\n- Duplicate titles across sections: ${duplicates.length} (preserved as distinct source questions)`;

console.log(preflight.replaceAll('`', ''));
if (duplicates.length) {
  console.log('Duplicate titles were detected before generation and will retain distinct section-prefixed paths:');
  for (const [a, b] of duplicates) console.log(`- ${a.title} [${a.section.title}:${a.line}; ${b.section.title}:${b.line}]`);
}
if (validateOnly) process.exit(0);

fs.mkdirSync(outputRoot, { recursive: true });
const lockPath = path.join(outputRoot, '.generation.lock');
if (fs.existsSync(lockPath)) {
  const priorPid = Number(fs.readFileSync(lockPath, 'utf8').trim());
  let active = false;
  if (Number.isInteger(priorPid) && priorPid > 0) {
    try { process.kill(priorPid, 0); active = true; } catch { active = false; }
  }
  if (active) {
    console.error(`Another interview-answer worker is already running with PID ${priorPid}.`);
    process.exit(3);
  }
  fs.unlinkSync(lockPath);
}
fs.writeFileSync(lockPath, String(process.pid), { flag: 'wx' });
const releaseLock = () => {
  try {
    if (fs.readFileSync(lockPath, 'utf8').trim() === String(process.pid)) fs.unlinkSync(lockPath);
  } catch { /* lock already removed */ }
};
process.on('exit', releaseLock);
process.on('SIGINT', () => { releaseLock(); process.exit(130); });
process.on('SIGTERM', () => { releaseLock(); process.exit(143); });
for (const section of sections) fs.mkdirSync(path.join(outputRoot, section.folder), { recursive: true });
let records = [];
const statusFile = path.join(outputRoot, 'Generation_Status.json');
if (fs.existsSync(statusFile)) {
  try { records = JSON.parse(fs.readFileSync(statusFile, 'utf8')); } catch { records = []; }
}
let processed = 0;
let consecutiveFailures = 0;
for (const question of questions) {
  if (processed >= limit) break;
  const key = `${question.section.order}:${question.number}`;
  const before = inspectAnswer(question);
  let record;
  if (before.complete) {
    record = { key, number: question.numberText, technology: question.section.title, title: question.title, filename: question.filename, relativePath: question.relativePath.split(path.sep).join('/'), status: 'Already complete', validation: before.reason, error: '' };
    consecutiveFailures = 0;
  } else {
    const existed = fs.existsSync(question.outputPath);
    try {
      generate(question, authoritativePrompt);
      const after = inspectAnswer(question);
      if (!after.complete) throw new Error(after.reason);
      record = { key, number: question.numberText, technology: question.section.title, title: question.title, filename: question.filename, relativePath: question.relativePath.split(path.sep).join('/'), status: existed ? 'Repaired' : 'Completed', validation: after.reason, error: '' };
      consecutiveFailures = 0;
    } catch (error) {
      record = { key, number: question.numberText, technology: question.section.title, title: question.title, filename: question.filename, relativePath: question.relativePath.split(path.sep).join('/'), status: 'Failed', validation: 'failed', error: String(error.message).replace(/\s+/g, ' ').slice(0, 1000) };
      consecutiveFailures += 1;
    }
  }
  records = records.filter((r) => r.key !== key);
  records.push(record);
  fs.writeFileSync(statusFile, JSON.stringify(records, null, 2));
  writeStatus(records, questions, preflight);
  writeIndexes(sections, records);
  processed += 1;
  console.log(`[${processed}/${questions.length}] ${record.status}: ${question.section.title} ${question.number}. ${question.title}`);
  if (consecutiveFailures >= 3) {
    console.error('SYSTEMIC FAILURE CIRCUIT BREAKER: stopped after three consecutive generation failures. Resume after correcting the execution environment.');
    break;
  }
}

const failures = [];
for (const question of questions) {
  const result = inspectAnswer(question);
  if (!result.complete) failures.push(`${question.section.title} ${question.number}: ${result.reason}`);
}
writeStatus(records, questions, preflight);
writeIndexes(sections, records);
if (failures.length) {
  console.error(`FINAL VALIDATION INCOMPLETE: ${failures.length} answer(s) are missing or invalid.`);
  process.exit(1);
}
console.log(`FINAL VALIDATION PASSED: ${questions.length} answers across ${sections.length} sections.`);
