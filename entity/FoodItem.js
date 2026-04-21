import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/food-items`;

class FoodItem {
  constructor({
    foodItemId = null,
    _id = null,
    name = '',
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    serving = '',
    category = '',
    isCustom = false,
  } = {}) {
    this.foodItemId = foodItemId ?? _id ?? `${name}-${Date.now()}`;
    this.name = name;
    this.calories = calories;
    this.protein = protein;
    this.carbs = carbs;
    this.fat = fat;
    this.serving = serving;
    this.category = category;
    this.isCustom = isCustom;
  }

  getDisplayMeta() {
    let servingText = this.serving || '';
    
    // Only append 'g' if it's a number and doesn't already include a unit
    if (
      servingText &&
      !/[a-zA-Z]/.test(servingText) // no unit present
    ) {
      servingText = `${servingText}g`;
    }
  
    return `${this.calories} kcal • ${servingText}`;
  }

  // UC #15, #50 — client-side search filter
  static filterBySearch(items, query) {
    if (!query || query.trim().length === 0) return items;
    const lower = query.trim().toLowerCase();
    return items.filter((item) =>
      item.name.toLowerCase().includes(lower)
    );
  }

  // Alt Flow 1a guard
  static hasItems(items) {
    return Array.isArray(items) && items.length > 0;
  }

  // UC #15, #50 — loads the initial local list on screen mount
  // Called by ViewFoodDatabaseController.fetchFoodDatabase()
  static async fetchAll() {
    try {
      const res = await axios.get(`${API_URL}`);

      return {
        success: true,
        data: res.data.data.map((r) =>
          new FoodItem({
            foodItemId: r._id,
            name: r.name,
            calories: r.calories ?? 0,
            protein: r.protein ?? 0,
            carbs: r.carbs ?? 0,
            fat: r.fat ?? 0,
            serving: r.serving ?? '',
            category: r.category ?? '',
            isCustom: r.isCustom ?? false,
          })
        ),
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

  // UC #15, #50 — search local first, fall back to Open Food Facts if empty
  // Called by ViewFoodDatabaseController.searchFoodItems()
  static async searchWithFallback(localItems, query) {
    // Step 1 — local search
    const localResults = FoodItem.filterBySearch(localItems, query);
  
    // Step 2 — API search (ALWAYS run if query exists)
    let apiItems = [];
  
    try {
      const res = await axios.get(`${API_CONFIG}/food-api/search`, {
        params: { searchTerm: query },
      });
    
      const products = res.data?.data || [];
    
      apiItems = products.map((p) => new FoodItem({
        foodItemId: p.barcode || Math.random().toString(),
        name: p.name || 'Unknown',
        calories: Math.round(p.nutrition?.energy || 0),
        protein: +(p.nutrition?.protein || 0).toFixed(1),
        carbs: +(p.nutrition?.carbs || 0).toFixed(1),
        fat: +(p.nutrition?.fat || 0).toFixed(1),
        serving: '100g',
        category: '',
        isCustom: false,
      }));
    
    } catch (err) {
      console.error('[FoodItem.searchWithFallback]', err);
    }
  
    // Step 3 — merge BOTH results
    const merged = [...localResults, ...apiItems];
  
    // Step 4 — optional dedup (recommended)
    const seen = new Set();
    const deduped = merged.filter((item) => {
      const key = item.foodItemId || item.name.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  
    return {
      data: deduped,
      fromAPI: apiItems.length > 0,
      message: deduped.length === 0
        ? 'No food items found'
        : '',
    };
  }

  static async logFoodItem(item, quantity, userId, meal = 'Lunch') {
    if (!item || !quantity || !userId) {
      return {
        success: false,
        message: 'Invalid food item, quantity, or user',
      };
    }

    try {
      const res = await axios.post(
        `${API_CONFIG}/food-entries/manual`,
        {
          userId,
          foodName: item.name,
          calories: item.calories * quantity,
          protein: item.protein * quantity,
          carbs: item.carbs * quantity,
          fat: item.fat * quantity,
          meal,
        }
      );

      return {
        success: true,
        data: res.data.data,
        message: res.data.message || 'Food logged successfully',
      };

    } catch (err) {
      console.error('[FoodItem.logFoodItem]', err.response?.data || err.message);

      return {
        success: false,
        message: err.response?.data?.message || 'Failed to log food',
      };
    }
  }

} // ← class closes here, after ALL methods

export default FoodItem;