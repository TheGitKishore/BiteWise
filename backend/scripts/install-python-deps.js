import { spawnSync } from 'child_process';
import fs from 'fs';

const readEnvPython = () => {
  try {
    const line = fs.readFileSync('.env', 'utf8')
      .split(/\r?\n/)
      .find((entry) => entry.startsWith('PYTHON_BIN='));
    return line ? line.slice('PYTHON_BIN='.length).trim() : null;
  } catch {
    return null;
  }
};

const configuredPython = process.env.PYTHON_BIN || readEnvPython();
const fallbackCandidates = process.platform === 'win32' ? ['python', 'python3'] : ['python3', 'python'];
const candidates = configuredPython ? [configuredPython, ...fallbackCandidates] : fallbackCandidates;

let lastError = '';
for (const python of candidates) {
  const result = spawnSync(python, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: 'pipe',
  });

  if (result.status === 0) {
    process.stdout.write(result.stdout || '');
    process.stderr.write(result.stderr || '');
    process.exit(0);
  }

  lastError = [result.stdout, result.stderr].filter(Boolean).join('\n');
}

console.warn('[postinstall] Python AI dependencies were not installed.');
console.warn(lastError || 'No usable python/pip command was found.');

if (process.env.RENDER) {
  process.exit(1);
}
