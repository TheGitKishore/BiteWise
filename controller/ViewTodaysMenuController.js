// Normal Flow (Today's Menu — Premium User)
//   1. TodaysMenuScreen mounts → boundary calls fetchTodaysMenu(userId, todaysEntries)
//   2. Controller fetches NutritionTargets for the user
//   3. Computes remaining macros (goal − consumed)
//   4. Fetches all recipes from Recipe entity
//   5. Filters to recipes whose calories fit within remaining budget (+10% buffer)
//   6. Returns { targets, consumed, remaining, matchingRecipes }
//
// Also exposes getMacroProgress() for the progress bars at top of screen.
// Premium User only (UC NEW-A)

import NutritionTargets from '../entity/NutritionTargets';
import Recipe           from '../entity/Recipe';
import FoodIntakeEntry  from '../entity/FoodIntakeEntry';

class ViewTodaysMenuController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[ViewTodaysMenuController]', e);
      return { success: false, data: null, message: 'Unable to load menu recommendations.' };
    }
  }

  // Fetch recommended recipes based on remaining daily budget
  // @param  {number}            userId
  // @param  {FoodIntakeEntry[]} todaysEntries
  // @return {Promise<{ success, targets, consumed, remaining, matchingRecipes, message }>}
  async fetchTodaysMenu(userId, todaysEntries = []) {
    return this._safeCall(async () => {
      const targetsResult = await NutritionTargets.fetchByUser(userId);
      const targets = targetsResult.success ? targetsResult.data : { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 };

      const consumed = FoodIntakeEntry.getTodaySummary(todaysEntries || []);

      const remaining = {
        calories: Math.max(0, (targets.calories || 2000) - (consumed.calories || 0)),
        protein:  Math.max(0, (targets.protein  || 0)    - (consumed.protein  || 0)),
        carbs:    Math.max(0, (targets.carbs    || 0)    - (consumed.carbs    || 0)),
        fat:      Math.max(0, (targets.fat      || 0)    - (consumed.fat      || 0)),
      };

      const recipeResult = await Recipe.fetchAll();
      const allRecipes   = recipeResult.success ? recipeResult.data : [];

      const budget   = remaining.calories * 1.1 || 500;
      const matching = allRecipes
        .filter(r => r.calories > 0 && r.calories <= budget)
        .sort((a, b) => Math.abs(a.calories - remaining.calories * 0.4) - Math.abs(b.calories - remaining.calories * 0.4));

      return {
        success:         true,
        targets,
        consumed,
        remaining,
        matchingRecipes: matching,
        message:         matching.length === 0 ? "You've nearly hit your daily targets. Great work!" : '',
      };
    });
  }

  // Returns macro progress bar data for TodaysMenuScreen
  // @return Array<{ label, consumed, goal, unit, percentage, remaining }>
  getMacroProgress(targets, consumed) {
    return [
      { label: 'Calories', key: 'calories', unit: 'kcal' },
      { label: 'Protein',  key: 'protein',  unit: 'g' },
      { label: 'Carbs',    key: 'carbs',    unit: 'g' },
      { label: 'Fat',      key: 'fat',      unit: 'g' },
    ].map(m => {
      const goal = targets?.[m.key] || 0;
      const cons = consumed?.[m.key] || 0;
      return {
        label:      m.label,
        consumed:   cons,
        goal,
        unit:       m.unit,
        percentage: goal > 0 ? Math.min(Math.round((cons / goal) * 100), 100) : 0,
        remaining:  Math.max(0, goal - cons),
      };
    });
  }
}

export default ViewTodaysMenuController;
