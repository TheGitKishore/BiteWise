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

  // UC #15, #50 — filter already-loaded items by search query
  // Called on every keystroke — no async needed
  // @param  {FoodItem[]} items
  // @param  {string}     query
  // @return {FoodItem[]}
  searchFoodItems(items, query) {
    return FoodItem.filterBySearch(items, query);
  }
}

export default ViewFoodDatabaseController;