import { spawnSync } from 'child_process';
import fs from 'fs';
import { execSync } from 'child_process';

console.log("=== PYTHON ENV DEBUG ===");

// ---------- DEBUG python3.11 ----------
try {
  console.log("which python3.11:");
  console.log(execSync('which python3.11').toString());
} catch {
  console.log("python3.11 not found");
}

try {
  console.log("python3.11 version:");
  console.log(execSync('python3.11 --version').toString());
} catch {
  console.log("cannot run python3.11");
}

// ---------- CONFIG ----------
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

// IMPORTANT: force correct python
const fallbackCandidates = ['python3.11'];
const candidates = configuredPython
  ? [configuredPython, ...fallbackCandidates]
  : fallbackCandidates;

console.log("=== PYTHON INSTALL START ===");

const venvPath = '.venv';

let lastError = '';

for (const python of candidates) {
  try {
    console.log(`\nTrying: ${python}`);

    // ---------- CHECK VERSION ----------
    const versionCheck = spawnSync(python, ['--version'], {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    console.log(`Version: ${versionCheck.stdout || versionCheck.stderr}`);

    // ---------- CREATE VENV ----------
    console.log("Creating virtual environment...");

    const venv = spawnSync(python, ['-m', 'venv', venvPath], {
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (venv.status !== 0) {
      console.log("Failed to create venv");
      console.log(venv.stderr?.toString());
      continue;
    }

    // ---------- USE VENV PIP ----------
    const pipPath =
      process.platform === 'win32'
        ? `${venvPath}\\Scripts\\pip`
        : `${venvPath}/bin/pip`;

    console.log("Installing requirements in venv...");

    const result = spawnSync(pipPath, ['install', '-r', 'requirements.txt'], {
      cwd: process.cwd(),
      encoding: 'utf8',
      stdio: 'pipe',
    });

    if (result.status === 0) {
      process.stdout.write(result.stdout || '');
      process.stderr.write(result.stderr || '');
      console.log("=== PYTHON INSTALL SUCCESS (VENV) ===");
      process.exit(0);
    }

    lastError = [result.stdout, result.stderr].filter(Boolean).join('\n');

  } catch (err) {
    console.log(`Failed with ${python}:`, err.message);
  }
}

console.warn('[postinstall] Python AI dependencies were not installed.');
console.warn(lastError || 'No usable python/pip command was found.');

if (process.env.RENDER) {
  process.exit(1);
}