import { spawnSync } from 'child_process';
import fs from 'fs';
import { execSync } from 'child_process';

console.log("python version:");
try {
  console.log(execSync('python --version').toString());
} catch {}

console.log("python3 version:");
try {
  console.log(execSync('python3 --version').toString());
} catch {}

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
const fallbackCandidates = ['python3'];
const candidates = configuredPython ? [configuredPython, ...fallbackCandidates] : fallbackCandidates;

console.log("=== PYTHON DEBUG START ===");

let lastError = '';

for (const python of candidates) {
  try {
    console.log(`\nTrying: ${python}`);

    // 👇 CHECK VERSION FIRST
    const versionCheck = spawnSync(python, ['--version'], { encoding: 'utf8' });
    console.log(`Version: ${versionCheck.stdout || versionCheck.stderr}`);

    const result = spawnSync(python, ['-m', 'pip', 'install', '-r', 'requirements.txt'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.status === 0) {
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
      console.log("=== PYTHON INSTALL SUCCESS ===");
      process.exit(0);
    }

    lastError = [result.stdout, result.stderr].filter(Boolean).join('\n');

  } catch (err) {
    console.log(`Failed to run ${python}:`, err.message);
  }
}

console.warn('[postinstall] Python AI dependencies were not installed.');
console.warn(lastError || 'No usable python/pip command was found.');

if (process.env.RENDER) {
  process.exit(1);
}