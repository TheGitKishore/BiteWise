import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const AI_CONFIDENCE_THRESHOLD = Number(process.env.AI_CONFIDENCE_THRESHOLD ?? 0.7);
export const AI_MODEL_PATH = process.env.AI_MODEL_PATH
  ? path.resolve(process.env.AI_MODEL_PATH)
  : path.join(__dirname, 'models', 'food_model.tflite');
export const AI_LABELS_PATH = process.env.AI_LABELS_PATH
  ? path.resolve(process.env.AI_LABELS_PATH)
  : path.join(__dirname, 'models', 'labels.txt');
export const AI_NUTRITION_PATH = process.env.AI_NUTRITION_PATH
  ? path.resolve(process.env.AI_NUTRITION_PATH)
  : path.join(__dirname, 'models', 'nutrition.json');
export const AI_MODEL_INPUT_SIZE = Number(process.env.AI_MODEL_INPUT_SIZE ?? 224);
export const AI_MODEL_NORMALIZATION = process.env.AI_MODEL_NORMALIZATION ?? 'minus-one-to-one';
export const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';
