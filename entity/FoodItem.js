import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/food-items`;

class FoodItem {
  constructor({
    foodItemId = null,
    name       = '',
    calories   = 0,
    protein    = 0,
    carbs      = 0,
    fat        = 0,
    serving    = '',
    category   = '',
    isCustom   = false,
  } = {}) {
    this.foodItemId = foodItemId;
    this.name       = name;
    this.calories   = calories;
    this.protein    = protein;
    this.carbs      = carbs;
    this.fat        = fat;
    this.serving    = serving;
    this.category   = category;
    this.isCustom   = isCustom;
  }

  getDisplayMeta() {
    return `${this.calories} kcal • ${this.serving}`;
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

  // UC #15, #50 — search local first, fall back to Open Food Facts if empty
  // Called by ViewFoodDatabaseController.searchFoodItems()
  static async searchWithFallback(localItems, query) {
    // Step 1 — filter local hardcoded items first
    const localResults = FoodItem.filterBySearch(localItems, query);
    if (localResults.length > 0) {
      return { data: localResults, fromAPI: false, message: '' };
    }

    // Step 2 — nothing found locally, try Open Food Facts
    try {
      const res = await axios.get(`${API_URL}/food/search`, {
        params: { q: query },
      });

      const products = res.data?.data?.products || [];

      const queryWords = query.trim().toLowerCase().split(' ').filter(w => w.length > 0);

      const apiItems = products
        .filter((p) => p.product_name)
        .map((p) => new FoodItem({
          foodItemId: p.id || p.code || null,
          name:       p.product_name || 'Unknown',
          calories:   Math.round(p.nutriments?.['energy-kcal_100g'] || 0),
          protein:    +(p.nutriments?.proteins_100g      || 0).toFixed(1),
          carbs:      +(p.nutriments?.carbohydrates_100g || 0).toFixed(1),
          fat:        +(p.nutriments?.fat_100g           || 0).toFixed(1),
          serving:    p.serving_size || '100g',
          category:   p.categories_tags?.[0]?.replace('en:', '') || '',
          isCustom:   false,
        }));

      if (apiItems.length === 0) {
        return { data: [], fromAPI: true, message: 'No food items found. Try a different search.' };
      }

      // Sort by relevance — factors in:
      // 1. How many query words match
      // 2. What % of the item name words are query words (shorter precise matches rank higher)
      const sorted = apiItems.sort((a, b) => {
        const aName  = a.name.toLowerCase().split(' ').filter(w => w.length > 0);
        const bName  = b.name.toLowerCase().split(' ').filter(w => w.length > 0);

        const aMatches = queryWords.filter(w => a.name.toLowerCase().includes(w)).length;
        const bMatches = queryWords.filter(w => b.name.toLowerCase().includes(w)).length;

        // % of query words matched
        const aQueryCoverage = aMatches / queryWords.length;
        const bQueryCoverage = bMatches / queryWords.length;

        // % of item name words that are query words (rewards concise matches)
        const aNameCoverage = aMatches / aName.length;
        const bNameCoverage = bMatches / bName.length;

        // Combined score — query coverage weighted more heavily
        const aScore = (aQueryCoverage * 0.7) + (aNameCoverage * 0.3);
        const bScore = (bQueryCoverage * 0.7) + (bNameCoverage * 0.3);

        return bScore - aScore;
      });

      return { data: sorted, fromAPI: true, message: '' };

    } catch (err) {
      console.error('[FoodItem.searchWithFallback]', err);
      return { data: [], fromAPI: true, message: 'Unable to search food database. Please try again.' };
    }
  }

} // ← class closes here
export default FoodItem;