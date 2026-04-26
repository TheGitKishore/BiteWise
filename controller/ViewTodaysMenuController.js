// ViewTodaysMenuController.js — UC (Sprint 9 Task 4) Premium – View Today's Menu
//
// Normal Flow:
//   1. TodaysMenuScreen mounts/focuses → boundary calls fetchTodaysMenu(userId)
//   2. Controller fetches nutrition targets via NutritionTargets.fetchByUser()
//   3. Controller fetches today's entries via FoodIntakeEntry.getTodayEntries()
//   4. Computes consumed totals via FoodIntakeEntry.getTodaySummary()
//   5. Computes remaining = targets − consumed (floored at 0)
//   6. Fetches all recipes via Recipe.fetchAll()
//   7. Delegates filtering + sorting to Recipe.filterByCalorieBudget()   ← Entity
//   8. Returns { targets, consumed, remaining, recipes, isNearlyFull }
//
//   getMacroProgress(targets, consumed) → progress bar descriptor array
//
// Alt Flow: targets not found → falls back to defaults (2000/150/250/67)
// Alt Flow: no matching recipes → isNearlyFull or empty array returned
// Premium User only — all 3 profile types

import NutritionTargets from '../entity/NutritionTargets';
import FoodIntakeEntry  from '../entity/FoodIntakeEntry';
import Recipe           from '../entity/Recipe';

// Threshold: consumed ≥ 90% of calorie goal = "nearly full"
const NEARLY_FULL_THRESHOLD = 0.90;

const MACRO_COLOURS = {
  calories: '#7C3AED',
  protein:  '#3B82F6',
  carbs:    '#10B981',
  fat:      '#F59E0B',
};

class ViewTodaysMenuController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[ViewTodaysMenuController]', e);
      return { success: false, data: null, message: "Unable to load today's menu. Please try again." };
    }
  }

  // ── Main data fetch ───────────────────────────────────────────────────────
  // @param  {number|string} userId
  // @return {Promise<{
  //   success, message,
  //   data: {
  //     targets:      { calories, protein, carbs, fat, fiber },
  //     consumed:     { calories, protein, carbs, fat },
  //     remaining:    { calories, protein, carbs, fat },
  //     recipes:      Recipe[],   — filtered + sorted by Recipe.filterByCalorieBudget()
  //     isNearlyFull: boolean,
  //   }
  // }>}
  async fetchTodaysMenu(userId) {
    return this._safe(async () => {

      // 1. Nutrition targets (seeded stubs from Sprint 8)
      const targetsResult = await NutritionTargets.fetchByUser(userId);
      const targets = targetsResult.success && targetsResult.data
        ? targetsResult.data
        : { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 };

      // 2. Today's food entries → consumed totals
      const entries  = await FoodIntakeEntry.getTodayEntries(userId);
      const consumed = FoodIntakeEntry.getTodaySummary(entries);

      // 3. Remaining macros (floor at 0)
      const remaining = {
        calories: Math.max(0, (targets.calories || 2000) - (consumed.calories || 0)),
        protein:  Math.max(0, (targets.protein  || 150)  - (consumed.protein  || 0)),
        carbs:    Math.max(0, (targets.carbs    || 250)  - (consumed.carbs    || 0)),
        fat:      Math.max(0, (targets.fat      || 67)   - (consumed.fat      || 0)),
      };

      // 4. Nearly-full guard
      const pctConsumed = (consumed.calories || 0) / (targets.calories || 2000);
      const isNearlyFull = pctConsumed >= NEARLY_FULL_THRESHOLD;

      // 5. Fetch + filter recipes — delegates logic to Recipe entity
      let matchedRecipes = [];
      if (!isNearlyFull && remaining.calories > 50) {
        const recipesResult = await Recipe.fetchAll();
        const allRecipes    = recipesResult.success ? (recipesResult.data || []) : [];

        // Entity handles the filter (≤ remaining × 1.1) and sort (by sweetSpot proximity)
        matchedRecipes = Recipe.filterByCalorieBudget(allRecipes, remaining.calories);
      }

      return {
        success: true,
        message: '',
        data: { targets, consumed, remaining, recipes: matchedRecipes, isNearlyFull },
      };
    });
  }

  // ── Progress bar descriptors ──────────────────────────────────────────────
  // @param  {{ calories, protein, carbs, fat }} targets
  // @param  {{ calories, protein, carbs, fat }} consumed
  // @return {Array<{ label, consumed, goal, unit, pct, color }>}
  getMacroProgress(targets, consumed) {
    const clamp = (v) => Math.min(1, Math.max(0, v));
    return [
      {
        label:    'Calories',
        consumed: Math.round(consumed.calories || 0),
        goal:     Math.round(targets.calories  || 2000),
        unit:     'kcal',
        pct:      clamp((consumed.calories || 0) / (targets.calories || 2000)),
        color:    MACRO_COLOURS.calories,
      },
      {
        label:    'Protein',
        consumed: Math.round(consumed.protein || 0),
        goal:     Math.round(targets.protein  || 150),
        unit:     'g',
        pct:      clamp((consumed.protein || 0) / (targets.protein || 150)),
        color:    MACRO_COLOURS.protein,
      },
      {
        label:    'Carbs',
        consumed: Math.round(consumed.carbs || 0),
        goal:     Math.round(targets.carbs  || 250),
        unit:     'g',
        pct:      clamp((consumed.carbs || 0) / (targets.carbs || 250)),
        color:    MACRO_COLOURS.carbs,
      },
      {
        label:    'Fat',
        consumed: Math.round(consumed.fat || 0),
        goal:     Math.round(targets.fat  || 67),
        unit:     'g',
        pct:      clamp((consumed.fat || 0) / (targets.fat || 67)),
        color:    MACRO_COLOURS.fat,
      },
    ];
  }
}

export default ViewTodaysMenuController;
