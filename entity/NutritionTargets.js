import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/nutrition-targets`;

export const ACTIVITY_LEVELS = [
  'Minimal',
  'Light',
  'Balanced',
  'Focused',
  'Strict',
];

export const GOALS = [
  'Lose Weight (-500 cal)',
  'Maintain Weight',
  'Gain Weight (+500 cal)',
];

const ACTIVITY_MULTIPLIERS = {
  Minimal: 1.2,
  Light: 1.375,
  Balanced: 1.55,
  Focused: 1.725,
  Strict: 1.9,
};

const GOAL_ADJUSTMENTS = {
  'Lose Weight (-500 cal)': -500,
  'Maintain Weight': 0,
  'Gain Weight (+500 cal)': +500,
};

const normalizeActivityLevel = (value) => {
  const v = String(value || '').trim().toLowerCase();
  if (!v) return 'Balanced';
  if (v === 'minimal' || v.startsWith('sedentary')) return 'Minimal';
  if (v === 'light' || v.startsWith('light')) return 'Light';
  if (v === 'balanced' || v.startsWith('moderate')) return 'Balanced';
  if (v === 'focused' || v.startsWith('active')) return 'Focused';
  if (v === 'strict' || v.startsWith('very active')) return 'Strict';
  return 'Balanced';
};

class NutritionTargets {
  constructor({
    userId = null,
    calories = 2000,
    protein = 150,
    carbs = 250,
    fat = 67,
    fiber = 30,
    activityLevel = 'Balanced',
    goal = 'Maintain Weight',
    updatedAt = null,
  } = {}) {
    this.userId = userId;
    this.calories = calories;
    this.protein = protein;
    this.carbs = carbs;
    this.fat = fat;
    this.fiber = fiber;
    this.activityLevel = normalizeActivityLevel(activityLevel);
    this.goal = goal;
    this.updatedAt = updatedAt;
  }

  static validateCalories(calories) {
    const n = Number(calories);
    if (isNaN(n) || n < 500) return { valid: false, field: 'calories', message: 'Calorie goal must be at least 500 kcal.' };
    if (n > 10000) return { valid: false, field: 'calories', message: 'Calorie goal cannot exceed 10,000 kcal.' };
    return { valid: true };
  }

  static validateTargets({ calories, protein, carbs, fat, fiber }) {
    const c = Number(calories);
    const p = Number(protein);
    const cb = Number(carbs);
    const f = Number(fat);
    const fi = Number(fiber);

    if (isNaN(c) || c < 500) return { valid: false, field: 'calories', message: 'Calorie goal must be at least 500 kcal.' };
    if (isNaN(p) || p < 0) return { valid: false, field: 'protein', message: 'Protein cannot be negative.' };
    if (isNaN(cb) || cb < 0) return { valid: false, field: 'carbs', message: 'Carbs cannot be negative.' };
    if (isNaN(f) || f < 0) return { valid: false, field: 'fat', message: 'Fat cannot be negative.' };
    if (isNaN(fi) || fi < 0) return { valid: false, field: 'fiber', message: 'Fiber cannot be negative.' };

    return { valid: true };
  }

  // Returns { calories, protein, carbs, fat, fiber }
  static computeTargets({ weightKg, heightCm, age, gender, activityLevel, goal }) {
    const wKg = Number(weightKg) || 70;
    const hCm = Number(heightCm) || 170;
    const yr = Number(age) || 25;
    const gnd = (gender || 'male').toLowerCase();

    const bmr = gnd === 'female'
      ? (10 * wKg) + (6.25 * hCm) - (5 * yr) - 161
      : (10 * wKg) + (6.25 * hCm) - (5 * yr) + 5;

    const normalizedActivity = normalizeActivityLevel(activityLevel);
    const multiplier = ACTIVITY_MULTIPLIERS[normalizedActivity] ?? 1.55;
    const adjustment = GOAL_ADJUSTMENTS[goal] ?? 0;
    const tdee = Math.round(bmr * multiplier);
    const calories = Math.max(1200, tdee + adjustment);

    const protein = Math.round((calories * 0.30) / 4);
    const carbs = Math.round((calories * 0.40) / 4);
    const fat = Math.round((calories * 0.30) / 9);
    const fiber = 30;

    return { calories, protein, carbs, fat, fiber };
  }

  static async fetchByUser(userId) {
    if (!userId) {
      return { success: false, data: null, message: 'User ID is required.' };
    }

    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      return {
        success: !!res.data?.success,
        data: new NutritionTargets(res.data?.data),
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        message: err.response?.data?.message || 'Unable to load nutrition targets.',
      };
    }
  }

  static async updateTargets(userId, { calories, protein, carbs, fat, fiber, activityLevel, goal }) {
    const v = NutritionTargets.validateTargets({ calories, protein, carbs, fat, fiber });
    if (!v.valid) return { success: false, field: v.field, message: v.message, data: null };

    try {
      const res = await axios.put(`${API_URL}/${userId}`, {
        calories: Number(calories),
        protein: Number(protein),
        carbs: Number(carbs),
        fat: Number(fat),
        fiber: Number(fiber),
        activityLevel: normalizeActivityLevel(activityLevel),
        goal: goal || 'Maintain Weight',
      });

      return {
        success: !!res.data?.success,
        field: res.data?.field ?? null,
        message: res.data?.message || '',
        data: res.data?.data ? new NutritionTargets(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        field: err.response?.data?.field ?? null,
        message: err.response?.data?.message || 'Failed to save nutrition targets.',
        data: null,
      };
    }
  }

  static async updateCalories(userId, calories) {
    const v = NutritionTargets.validateCalories(calories);
    if (!v.valid) return { success: false, field: v.field, message: v.message, data: null };

    try {
      const res = await axios.put(`${API_URL}/${userId}/calories`, {
        calories: Number(calories),
      });

      return {
        success: !!res.data?.success,
        field: res.data?.field ?? null,
        message: res.data?.message || '',
        data: res.data?.data ? new NutritionTargets(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        field: err.response?.data?.field ?? null,
        message: err.response?.data?.message || 'Failed to update calorie goal.',
        data: null,
      };
    }
  }
}

export default NutritionTargets;
