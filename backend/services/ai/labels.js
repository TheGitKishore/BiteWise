import fs from 'fs/promises';

export const loadLabels = async (labelsPath) => {
  try {
    const text = await fs.readFile(labelsPath, 'utf8');
    return text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
};
