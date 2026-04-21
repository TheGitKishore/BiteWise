// Normal Flow (UC #18, #54)
//   UC #18 Free User – Set Daily Calorie Limit
//   UC #54 Premium User – Set Daily Calorie Limit (now via NutritionTargets)
//
// Sprint 8: The "↗ Set Daily Goal" button in FoodTrackingLandingScreen now
//           navigates to NutritionTargetsScreen rather than opening an inline modal.
//           This controller is retained for direct calorie-only saves (e.g. API calls).
//           Delegates to NutritionTargets.updateCalories() (was User.setDailyCalorieLimit).

import NutritionTargets from '../entity/NutritionTargets';

class SetDailyCalorieLimitController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[SetDailyCalorieLimitController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #18, #54 — save calorie goal via NutritionTargets entity.
  // @param  {User|number} userOrId
  // @param  {number}      limit    — daily calorie target in kcal
  // @return {Promise<{ success, field, message, data }>}
  async setDailyCalorieLimit(userOrId, limit) {
    const userId = typeof userOrId === 'object' ? userOrId?.userId : userOrId;
    return this._safeCall(async () => NutritionTargets.updateCalories(userId, limit));
  }
}

export default SetDailyCalorieLimitController;
