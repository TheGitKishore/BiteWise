import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/food-entries`;

class FoodIntakeEntry {
  constructor({
    entryId    = null,
    userId     = null,
    foodName   = '',
    calories   = 0,
    protein    = 0,
    carbs      = 0,
    fat        = 0,
    meal       = '',
    source     = '',
    loggedAt   = null,
  } = {}) {
    this.entryId  = entryId;
    this.userId   = userId;
    this.foodName = foodName;
    this.calories = calories;
    this.protein  = protein;
    this.carbs    = carbs;
    this.fat      = fat;
    this.meal     = meal;
    this.source   = source;
    this.loggedAt = loggedAt;
  }

  // =========================
  // VALIDATION
  // =========================
  static validateManualEntry({ foodName, calories, protein, carbs, fat, meal }) {
    if (!foodName || foodName.trim().length === 0) {
      return { valid: false, field: 'foodName', message: 'Food name is required.' };
    }
    if (isNaN(calories) || Number(calories) <= 0) {
      return { valid: false, field: 'calories', message: 'Please enter a valid calorie amount.' };
    }
    if (isNaN(protein) || Number(protein) < 0) {
      return { valid: false, field: 'protein', message: 'Please enter a valid protein amount.' };
    }
    if (isNaN(carbs) || Number(carbs) < 0) {
      return { valid: false, field: 'carbs', message: 'Please enter a valid carbs amount.' };
    }
    if (isNaN(fat) || Number(fat) < 0) {
      return { valid: false, field: 'fat', message: 'Please enter a valid fat amount.' };
    }
    if (!meal || meal.trim().length === 0) {
      return { valid: false, field: 'meal', message: 'Please select a meal.' };
    }
    return { valid: true, field: null, message: '' };
  }

  // =========================
  // SUMMARY
  // =========================
  static getTodaySummary(entries) {
    return entries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein:  acc.protein  + e.protein,
        carbs:    acc.carbs    + e.carbs,
        fat:      acc.fat      + e.fat,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );
  }

  // =========================
  // API CALLS
  // =========================

  // ✅ Create manual entry
  static async createManual(userId, data) {
    const validation = FoodIntakeEntry.validateManualEntry(data);
    if (!validation.valid) {
      return { success: false, ...validation, data: null };
    }

    try {
      const res = await axios.post(`${API_URL}/manual`, {
        userId,
        ...data,
      });

      return res.data;
    } catch (err) {
        console.log("CREATE MANUAL ERROR:", err.response?.data || err.message);
          
        return {
          success: false,
          message: err.response?.data?.message || 'Failed to log food entry',
        };
      }
  }

  // ✅ Camera recognition
  static async recogniseFromCamera() {
    try {
      const res = await axios.post(`${API_URL}/food-recognition`);
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: 'Food recognition failed',
      };
    }
  }

  // ✅ Create from camera
  static async createFromCamera(userId, data) {
    try {
      const res = await axios.post(`${API_URL}/camera`, {
        userId,
        ...data,
      });

      return res.data;
    } catch (err) {
      return {
        success: false,
        message: 'Failed to log camera entry',
      };
    }
  }

  // ✅ Get today entries
  static async getTodayEntries(userId) {
    try {
      const res = await axios.get(`${API_URL}/today/${userId}`);
      return res.data.data.map(e => new FoodIntakeEntry(e));
    } catch (err) {
      return [];
    }
  }

  // ✅ Get past entries
  static async getPastEntries(userId) {
    try {
      const res = await axios.get(`${API_URL}/history/${userId}`);
      console.log("HISTORY RESPONSE:", res.data);
      return res.data.data.map(e => new FoodIntakeEntry(e));
    } catch (err) {
      return [];
    }
  }
}

export default FoodIntakeEntry;