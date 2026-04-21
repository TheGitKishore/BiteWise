// NutritionTargets.js — Sprint 8: new entity
// Single source of truth for all calorie and macro target data.
//
// Free users  : only calories is editable; macro fields are greyed out in UI.
// Premium users: full access — all macros, activity level, goal, auto-calculation.
//
// New seeded methods (fetchByUser, updateTargets, updateCalories, computeTargets)
// are seeded stubs only — no axios calls.
// Existing server-side logic remains in User.js (axios). This entity is the
// frontend source of truth; migration to backend API happens separately.

import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/nutrition-targets`;

// ─── CONSTANTS (used by dropdowns in EditNutritionTargetsModal) ───────────────
export const ACTIVITY_LEVELS = [
  'Sedentary (Little/no exercise)',
  'Light (1-3 days/week)',
  'Moderate (3-5 days/week)',
  'Active (6-7 days/week)',
  'Very Active (2x per day)',
];

export const GOALS = [
  'Lose Weight (-500 cal)',
  'Maintain Weight',
  'Gain Weight (+500 cal)',
];

const ACTIVITY_MULTIPLIERS = {
  'Sedentary (Little/no exercise)': 1.2,
  'Light (1-3 days/week)':          1.375,
  'Moderate (3-5 days/week)':       1.55,
  'Active (6-7 days/week)':         1.725,
  'Very Active (2x per day)':       1.9,
};

const GOAL_ADJUSTMENTS = {
  'Lose Weight (-500 cal)':  -500,
  'Maintain Weight':            0,
  'Gain Weight (+500 cal)':  +500,
};

// ─── SEEDED IN-MEMORY STORE ───────────────────────────────────────────────────
// Sprint 8 seeded targets for known users. Will be replaced by API calls later.
// userId 1 = xuanxuan (FREE)  |  userId 2 = premuser (PREMIUM)
// userId 3 = adminuser (ADMIN) | userId 4 = curator01 (CURATOR)
let _store = {
  1: { userId: 1, calories: 1800, protein: 135, carbs: 180, fat: 60,  fiber: 25, activityLevel: 'Light (1-3 days/week)',     goal: 'Lose Weight (-500 cal)',  updatedAt: '2026-01-10T08:00:00Z' },
  2: { userId: 2, calories: 2546, protein: 191, carbs: 255, fat: 85,  fiber: 30, activityLevel: 'Moderate (3-5 days/week)',   goal: 'Maintain Weight',          updatedAt: '2026-03-20T09:00:00Z' },
  3: { userId: 3, calories: 2000, protein: 150, carbs: 250, fat: 67,  fiber: 30, activityLevel: 'Moderate (3-5 days/week)',   goal: 'Maintain Weight',          updatedAt: '2026-01-01T00:00:00Z' },
  4: { userId: 4, calories: 2300, protein: 172, carbs: 288, fat: 77,  fiber: 30, activityLevel: 'Active (6-7 days/week)',     goal: 'Maintain Weight',          updatedAt: '2026-01-01T00:00:00Z' },
};

class NutritionTargets {
  constructor({
    userId        = null,
    calories      = 2000,
    protein       = 150,
    carbs         = 250,
    fat           = 67,
    fiber         = 30,
    activityLevel = 'Moderate (3-5 days/week)',
    goal          = 'Maintain Weight',
    updatedAt     = null,
  } = {}) {
    this.userId        = userId;
    this.calories      = calories;
    this.protein       = protein;
    this.carbs         = carbs;
    this.fat           = fat;
    this.fiber         = fiber;
    this.activityLevel = activityLevel;
    this.goal          = goal;
    this.updatedAt     = updatedAt;
  }

  // ─── VALIDATION ─────────────────────────────────────────────────────────────

  static validateCalories(calories) {
    const n = Number(calories);
    if (isNaN(n) || n < 500)  return { valid: false, field: 'calories', message: 'Calorie goal must be at least 500 kcal.' };
    if (n > 10000)             return { valid: false, field: 'calories', message: 'Calorie goal cannot exceed 10,000 kcal.' };
    return { valid: true };
  }

  static validateTargets({ calories, protein, carbs, fat, fiber }) {
    const c = Number(calories), p = Number(protein), cb = Number(carbs), f = Number(fat), fi = Number(fiber);
    if (isNaN(c) || c < 500)  return { valid: false, field: 'calories', message: 'Calorie goal must be at least 500 kcal.' };
    if (isNaN(p) || p < 0)   return { valid: false, field: 'protein',  message: 'Protein cannot be negative.' };
    if (isNaN(cb) || cb < 0) return { valid: false, field: 'carbs',    message: 'Carbs cannot be negative.' };
    if (isNaN(f) || f < 0)   return { valid: false, field: 'fat',      message: 'Fat cannot be negative.' };
    if (isNaN(fi) || fi < 0) return { valid: false, field: 'fiber',    message: 'Fiber cannot be negative.' };
    return { valid: true };
  }

  // ─── MIFFLIN-ST JEOR BMR AUTO-CALCULATION ───────────────────────────────────
  // Returns { calories, protein, carbs, fat, fiber } computed from user profile.
  // Macro split: Protein 30% | Carbs 40% | Fat 30%
  static computeTargets({ weightKg, heightCm, age, gender, activityLevel, goal }) {
    const wKg = Number(weightKg) || 70;
    const hCm = Number(heightCm) || 170;
    const yr  = Number(age)       || 25;
    const gnd = (gender || 'male').toLowerCase();

    const bmr = gnd === 'female'
      ? (10 * wKg) + (6.25 * hCm) - (5 * yr) - 161
      : (10 * wKg) + (6.25 * hCm) - (5 * yr) + 5;

    const multiplier  = ACTIVITY_MULTIPLIERS[activityLevel] ?? 1.55;
    const adjustment  = GOAL_ADJUSTMENTS[goal]              ?? 0;
    const tdee        = Math.round(bmr * multiplier);
    const calories    = Math.max(1200, tdee + adjustment);

    const protein = Math.round((calories * 0.30) / 4);
    const carbs   = Math.round((calories * 0.40) / 4);
    const fat     = Math.round((calories * 0.30) / 9);
    const fiber   = 30;

    return { calories, protein, carbs, fat, fiber };
  }

  // ─── DATA ACCESS — SEEDED (no axios for these Sprint 8 additions) ────────────

  // Fetch nutrition targets for a user.
  // @param  {number} userId
  // @return {Promise<{ success, data: NutritionTargets, message }>}
  static async fetchByUser(userId) {
    const raw = _store[String(userId)] || _store[userId];
    if (!raw) {
      // Default targets for unknown users
      const defaults = new NutritionTargets({ userId });
      return { success: true, data: defaults, message: '' };
    }
    return { success: true, data: new NutritionTargets(raw), message: '' };
  }

  // Update ALL macro targets (Premium users only).
  // @param  {number} userId
  // @param  {{ calories, protein, carbs, fat, fiber, activityLevel, goal }}
  // @return {Promise<{ success, field, message, data }>}
  static async updateTargets(userId, { calories, protein, carbs, fat, fiber, activityLevel, goal }) {
    const v = NutritionTargets.validateTargets({ calories, protein, carbs, fat, fiber });
    if (!v.valid) return { success: false, field: v.field, message: v.message, data: null };

    const updated = {
      userId:        Number(userId),
      calories:      Number(calories),
      protein:       Number(protein),
      carbs:         Number(carbs),
      fat:           Number(fat),
      fiber:         Number(fiber),
      activityLevel: activityLevel || 'Moderate (3-5 days/week)',
      goal:          goal          || 'Maintain Weight',
      updatedAt:     new Date().toISOString(),
    };
    _store[String(userId)] = updated;

    return { success: true, field: null, message: 'Targets saved successfully!', data: new NutritionTargets(updated) };
  }

  // Update CALORIES ONLY (Free users).
  // @param  {number} userId
  // @param  {number} calories
  // @return {Promise<{ success, field, message, data }>}
  static async updateCalories(userId, calories) {
    const v = NutritionTargets.validateCalories(calories);
    if (!v.valid) return { success: false, field: v.field, message: v.message, data: null };

    const existing = _store[String(userId)] || { userId: Number(userId), protein: 150, carbs: 250, fat: 67, fiber: 30, activityLevel: 'Moderate (3-5 days/week)', goal: 'Maintain Weight' };
    const updated  = { ...existing, calories: Number(calories), updatedAt: new Date().toISOString() };
    _store[String(userId)] = updated;

    return { success: true, field: null, message: 'Calorie goal updated!', data: new NutritionTargets(updated) };
  }
}

export default NutritionTargets;
