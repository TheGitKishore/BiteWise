// Normal Flow (UC NEW-E — Premium User View Dine Out Options)
//   1. DineOutScreen mounts → boundary calls fetchDineOutOptions(userId, todaysEntries)
//   2. Controller fetches remaining calorie budget from NutritionTargets
//   3. Calls DineOut.fetchMatchingRestaurants(remainingCalories)
//   4. Returns restaurants with filteredItems matching the budget
//
// Premium User only (UC NEW-E)

import DineOut          from '../entity/DineOut';
import NutritionTargets from '../entity/NutritionTargets';
import FoodIntakeEntry  from '../entity/FoodIntakeEntry';

class ViewDineOutController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[ViewDineOutController]', e);
      return { success: false, data: [], message: 'Unable to load dine out options.', remainingCalories: 0 };
    }
  }

  // Fetch restaurants matching remaining budget
  // @param  {number}            userId
  // @param  {FoodIntakeEntry[]} todaysEntries
  // @return {Promise<{ success, data, remainingCalories, targetCalories, consumedCalories, message }>}
  async fetchDineOutOptions(userId, todaysEntries = []) {
    return this._safeCall(async () => {
      const targetsResult = await NutritionTargets.fetchByUser(userId);
      const targetCals    = targetsResult.success ? (targetsResult.data?.calories || 2000) : 2000;

      const consumed    = FoodIntakeEntry.getTodaySummary(todaysEntries || []);
      const remaining   = Math.max(0, targetCals - (consumed.calories || 0));

      const result = await DineOut.fetchMatchingRestaurants(remaining);

      return {
        ...result,
        remainingCalories: remaining,
        targetCalories:    targetCals,
        consumedCalories:  consumed.calories || 0,
      };
    });
  }

  getCuisines(restaurants)             { return DineOut.getCuisines(restaurants); }
  filterByCuisine(restaurants, cuisine){ return DineOut.filterByCuisine(restaurants, cuisine); }
  search(restaurants, query)           { return DineOut.search(restaurants, query); }
}

export default ViewDineOutController;
