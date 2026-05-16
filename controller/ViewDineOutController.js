// ViewDineOutController.js — Sprint 9 Task 6
// UC: Premium User – View Dine Out Options
//
// Normal Flow:
//   1. DineOutScreen mounts/focuses → boundary calls fetchDineOutOptions(userId)
//   2. Controller fetches nutrition targets via NutritionTargets.fetchByUser()
//   3. Controller fetches today's entries via FoodIntakeEntry.getTodayEntries()
//   4. Computes consumed + remaining via FoodIntakeEntry.getTodaySummary()
//   5. Delegates to DineOut.fetchMatchingRestaurants(remainingCalories)
//      — returns restaurants that have ≥1 item fitting the calorie budget
//   6. Returns { targets, consumed, remaining, restaurants }
//
//   getCuisines()                      — delegates to DineOut.getCuisines()
//   filterByCuisine(restaurants, c)   — delegates to DineOut.filterByCuisine()
//   search(restaurants, query)         — delegates to DineOut.search()
//
// Alt Flow: targets not found → defaults (2000/150/250/67)
// Premium User only — all 3 profile types

import NutritionTargets from '../entity/NutritionTargets';
import FoodIntakeEntry  from '../entity/FoodIntakeEntry';
import DineOut          from '../entity/DineOut';

class ViewDineOutController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[ViewDineOutController]', e);
      return { success: false, data: null, message: 'Unable to load dine out options. Please try again.' };
    }
  }

  // ── Main data fetch ───────────────────────────────────────────────────────
  // @param  {number|string} userId
  // @return {Promise<{
  //   success, message,
  //   data: {
  //     targets:     { calories, protein, carbs, fat },
  //     consumed:    { calories, protein, carbs, fat },
  //     remaining:   { calories, protein, carbs, fat },
  //     restaurants: Array<DineOut & { matchingItems }>,
  //   }
  // }>}
  async fetchDineOutOptions(userId) {
    return this._safe(async () => {

      // 1. Nutrition targets (seeded stubs from Sprint 8)
      const targetsResult = await NutritionTargets.fetchByUser(userId);
      const targets = targetsResult.success && targetsResult.data
        ? targetsResult.data
        : { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 };

      // 2. Today's entries → consumed totals
      const entries  = await FoodIntakeEntry.getTodayEntries(userId);
      const consumed = FoodIntakeEntry.getTodaySummary(entries);

      // 3. Remaining calories (floored at 0)
      const remaining = {
        calories: Math.max(0, (targets.calories || 2000) - (consumed.calories || 0)),
        protein:  Math.max(0, (targets.protein  || 150)  - (consumed.protein  || 0)),
        carbs:    Math.max(0, (targets.carbs    || 250)  - (consumed.carbs    || 0)),
        fat:      Math.max(0, (targets.fat      || 67)   - (consumed.fat      || 0)),
      };

      // 4. Delegate to DineOut entity — returns restaurants with matching items annotated
      const dineOutResult = await DineOut.fetchMatchingRestaurants(remaining.calories);
      const restaurants   = dineOutResult.success ? (dineOutResult.data || []) : [];

      return {
        success: true,
        message: '',
        data: { targets, consumed, remaining, restaurants },
      };
    });
  }

  // ── Client-side helpers — all delegate to DineOut entity ─────────────────

  // @return {string[]}  ['All', 'Healthy Bowls', …]
  getCuisines() {
    return DineOut.getCuisines();
  }

  // @param  {DineOut[]} restaurants
  // @param  {string}    cuisine
  // @return {DineOut[]}
  filterByCuisine(restaurants, cuisine) {
    return DineOut.filterByCuisine(restaurants, cuisine);
  }

  // @param  {DineOut[]} restaurants
  // @param  {string}    query
  // @return {DineOut[]}
  search(restaurants, query) {
    return DineOut.search(restaurants, query);
  }
}

export default ViewDineOutController;
