// Normal Flow (UC #15, #50)
//   1. Screen mounts → boundary calls fetchFoodDatabase()
//   2. Controller asks entity via FoodItem.fetchAll()
//   3. Returns full list to boundary for display
//   4. User types query → boundary calls searchFoodItems(items, query)
//   5. Controller filters via FoodItem.filterBySearch()
//
// Alt Flow 1a: empty database → { success: false, message }
// Shared by Free User (#15) and Premium User (#50)

import FoodItem from '../entity/FoodItem';

class ViewFoodDatabaseController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewFoodDatabaseController]', error);
      return {
        success: false,
        data:    [],
        message: 'Unable to load food database. Please try again.',
      };
    }
  }

  // UC #15, #50 — fetch all food items
  // @return {Promise<{ success, data, message }>}
  async fetchFoodDatabase() {
    return this._safeCall(async () => {
      const result = await FoodItem.fetchAll();

      // Alt Flow 1a: empty database
      if (!FoodItem.hasItems(result.data)) {
        return {
          success: false,
          data:    [],
          message: 'No food items are currently available.',
        };
      }

      return result;
    });
  }

  // UC #15, #50 — search local first, fall back to API if nothing found
  // Now async because it may call the API
  // @param  {FoodItem[]} items   — the full hardcoded list from fetchFoodDatabase()
  // @param  {string}     query
  // @return {Promise<{ data: FoodItem[], fromAPI: boolean, message: string }>}
  async searchFoodItems(items, query) {
    const trimmedQuery = String(query || '').trim();

    if (trimmedQuery.length === 0) {
      return { data: items, fromAPI: false, message: '' };
    }

    return await FoodItem.searchWithFallback(items, trimmedQuery);
  }

  async logFoodItem(item, quantity, userId, meal) {
    if (!item || !quantity || !userId || !meal) {
      return {
        success: false,
        message: 'Invalid food item, quantity, user, or meal',
      };
    }
  
    return await FoodItem.logFoodItem(item, quantity, userId, meal);
  }
}

export default ViewFoodDatabaseController;
