import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/food-items`;

class FoodItem {
constructor({
  _id = null,
  name = '',
  calories_kcal = 0,
  protein_g = 0,
  carbs_g = 0,
  fat_g = 0,
  serving_size_g = '',
  category = '',
  isCustom = false,
} = {}) {
  this.foodItemId = _id;

  this.name = name;

  // 🔥 MAP MongoDB → frontend format
  this.calories = calories_kcal;
  this.protein  = protein_g;
  this.carbs    = carbs_g;
  this.fat      = fat_g;
  this.serving  = serving_size_g;

  this.category = category;
  this.isCustom = isCustom;
}

  getDisplayMeta() {
    return `${this.calories} kcal • ${this.serving}`;
  }

  // =========================
  // KEEP: SEARCH FILTER (IMPORTANT)
  // =========================
  static filterBySearch(items, query) {
    if (!query || query.trim().length === 0) return items;
    const lower = query.trim().toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(lower)
    );
  }

  static hasItems(items) {
    return Array.isArray(items) && items.length > 0;
  }

  // =========================
  // API: FETCH ALL
  // =========================
  static async fetchAll() {
    try {
      const res = await axios.get(`${API_URL}`);

      return {
        success: true,
        data: res.data.data.map((r) => new FoodItem(r)),
        message: res.data.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || err.message,
      };
    }
  }
}

export default FoodItem;