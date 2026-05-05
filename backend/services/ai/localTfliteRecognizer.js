import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import {
  AI_LABELS_PATH,
  AI_MODEL_INPUT_SIZE,
  AI_MODEL_NORMALIZATION,
  AI_MODEL_PATH,
  AI_NUTRITION_PATH,
} from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PYTHON_BIN = process.env.PYTHON_BIN || 'python';
const PYTHON_TIMEOUT_MS = Number(process.env.AI_PYTHON_TIMEOUT_MS ?? 30000);

const parseJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    return {
      success: false,
      message: text || 'Python local recognition returned invalid JSON.',
      data: null,
    };
  }
};

export const runLocalTfliteRecognition = async ({ imageBuffer }) => {
  const scriptPath = path.join(__dirname, 'python', 'recognize_food.py');

  return await new Promise((resolve) => {
    let child;
    try {
      child = spawn(PYTHON_BIN, [scriptPath], {
        env: {
          ...process.env,
          AI_MODEL_PATH,
          AI_LABELS_PATH,
          AI_NUTRITION_PATH,
          AI_MODEL_INPUT_SIZE: String(AI_MODEL_INPUT_SIZE),
          AI_MODEL_NORMALIZATION,
        },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (err) {
      resolve({
        success: false,
        message: err.message || 'Unable to start Python local recognizer.',
        data: null,
      });
      return;
    }

    let stdout = '';
    let stderr = '';
    const timeout = setTimeout(() => {
      child.kill();
      resolve({
        success: false,
        message: `Local model recognition timed out after ${PYTHON_TIMEOUT_MS}ms.`,
        data: null,
      });
    }, PYTHON_TIMEOUT_MS);

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });

    child.on('error', (err) => {
      clearTimeout(timeout);
      resolve({
        success: false,
        message: err.message || 'Unable to start Python local recognizer.',
        data: null,
      });
    });

    child.on('close', (code) => {
      clearTimeout(timeout);
      const parsed = parseJson(stdout.trim());

      if (code !== 0 && !parsed.success) {
        resolve({
          ...parsed,
          message: parsed.message || stderr.trim() || `Local recognizer exited with code ${code}.`,
        });
        return;
      }

      resolve(parsed);
    });

    child.stdin.end(imageBuffer);
  });
};
