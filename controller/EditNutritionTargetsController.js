// Normal Flow (Edit Nutrition Targets — Free and Premium users)
//   1. User opens NutritionTargetsScreen → taps "Edit Targets"
//   2. EditTargetsModal opens (inline, not a separate screen)
//   3. Premium: user edits all macros + activity level + goal → taps "Save Targets"
//      Free:    user edits calories only → taps "Save Targets"
//   4. Boundary calls saveTargets() [premium] or saveCaloriesOnly() [free]
//   5. Controller validates and delegates to NutritionTargets entity
//   6. Returns { success, field, message, data } → modal closes, screen refreshes
//
// Alt Flow: validation failure → { success: false, field, message }

import NutritionTargets from '../entity/NutritionTargets';

class EditNutritionTargetsController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[EditNutritionTargetsController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // Premium users — save all macro fields plus activity level and goal.
  // @param  {number} userId
  // @param  {{ calories, protein, carbs, fat, fiber, activityLevel, goal }}
  // @return {Promise<{ success, field, message, data }>}
  async saveTargets(userId, { calories, protein, carbs, fat, fiber, activityLevel, goal }) {
    return this._safeCall(async () =>
      NutritionTargets.updateTargets(userId, { calories, protein, carbs, fat, fiber, activityLevel, goal })
    );
  }

  // Free users — save calorie target only; macro fields remain unchanged.
  // @param  {number} userId
  // @param  {number} calories
  // @return {Promise<{ success, field, message, data }>}
  async saveCaloriesOnly(userId, calories) {
    return this._safeCall(async () =>
      NutritionTargets.updateCalories(userId, calories)
    );
  }
}

export default EditNutritionTargetsController;
