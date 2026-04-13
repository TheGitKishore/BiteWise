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
    }

    static async recogniseFromCamera() {
      const res = await axios.post(`${API_URL}/food-recognition`);
      return res.data;
    }

    static async getTodayEntries(userId) {
      const res = await axios.get(`${API_URL}/food-entries/today/${userId}`);
      return res.data.map((r) => new FoodIntakeEntry(r));
    }
  */

  // UC #16, #51 — create a manual food intake entry
  // @param  {number} userId
  // @param  {{ foodName, calories, protein, carbs, fat, meal }}
  // @return {Promise<{ success, data, message }>}
  static async createManual(userId, { foodName, calories, protein, carbs, fat, meal }) {
    const validation = FoodIntakeEntry.validateManualEntry({ foodName, calories, protein, carbs, fat, meal });
    if (!validation.valid) {
      return { success: false, field: validation.field, message: validation.message, data: null };
    }

    const entry = new FoodIntakeEntry({
      entryId:  Date.now(),
      userId,
      foodName: foodName.trim(),
      calories: Number(calories),
      protein:  Number(protein),
      carbs:    Number(carbs),
      fat:      Number(fat),
      meal,
      source:   'manual',
      loggedAt: new Date().toISOString(),
    });

    return {
      success: true,
      field:   null,
      message: `${entry.foodName} logged to ${meal.toLowerCase()}!`,
      data:    entry,
    };
  }

  // UC #17, #52 — simulate camera recognition; returns a detected food item
  // In production this calls the AI recognition API
  // @return {Promise<{ success, data, message }>}
  // UC #17, #52
  static async recogniseFromCamera(photo) {
    try {
      // Detect media type from URI
      const uri = photo.uri || '';
      let mediaType = 'image/jpeg'; // default
      if (uri.includes('.webp')) mediaType = 'image/webp';
      else if (uri.includes('.png')) mediaType = 'image/png';
      else if (uri.includes('.gif')) mediaType = 'image/gif';

      const res = await axios.post(`${API_URL}/food/recognise`, {
        base64Image: photo.base64,
        mediaType,
      });
      return res.data;
    } catch (err) {
      console.error('[FoodIntakeEntry.recogniseFromCamera]', err);
      return {
        success: false,
        message: 'Error in estimating nutrients. Please add manually instead.',
        data:    null,
      };
    }
  }

  // UC #17, #52 — log the confirmed camera-recognised entry
  // @param  {number} userId
  // @param  {{ foodName, calories, protein, carbs, fat, meal }}
  // @return {Promise<{ success, data, message }>}
  static async createFromCamera(userId, { foodName, calories, protein, carbs, fat, meal }) {
    const entry = new FoodIntakeEntry({
      entryId:  Date.now(),
      userId,
      foodName: foodName.trim(),
      calories: Number(calories),
      protein:  Number(protein),
      carbs:    Number(carbs),
      fat:      Number(fat),
      meal,
      source:   'camera',
      loggedAt: new Date().toISOString(),
    });

    return {
      success: true,
      field:   null,
      message: `${entry.foodName} logged to ${meal.toLowerCase()}!`,
      data:    entry,
    };
  }


  // UC #19, #55 — fetch past entries grouped by date
  // Replace w API calls
  /*
    static async getPastEntries(userId) {
      const res = await axios.get(`${API_URL}/food-entries/history/${userId}`);
      return res.data.map((r) => new FoodIntakeEntry(r));
    }
  */

  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  static async getPastEntries(userId) {
    try {
      const res = await axios.get(`${API_URL}/history/${userId}`);
      console.log("HISTORY RESPONSE:", res.data);
      return res.data.data.map(e =>
        new FoodIntakeEntry({
          entryId: e._id,   // 🔥 FIX HERE
          ...e,
        })
      );
    } catch (err) {
      return [];
    }
  }
}

export default FoodIntakeEntry;