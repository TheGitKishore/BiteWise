// Normal Flow (UC #30, #75)
//   1. User taps "Delete" on a meal plan card
//   2. Boundary shows confirmation Alert
//   3. User confirms → boundary calls deleteMealPlan()
//   4. Controller delegates to MealPlan.delete()
//   5. Returns success → boundary removes plan from list, shows banner
//
// Alt Flow: deletion fails → { success: false, message }
// Shared by Free User (#30) and Premium User (#75)

import MealPlan from '../entity/MealPlan';

class DeleteMealPlanController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[DeleteMealPlanController]', error);
      return { success: false, message: 'Unable to delete meal plan. Please try again.' };
    }
  }

  // UC #30, #75
  // @param  {number} planId
  // @return {Promise<{ success, message }>}
  async deleteMealPlan(planId) {
    return this._safeCall(async () => {
      return await MealPlan.delete(planId);
    });
  }
}

export default DeleteMealPlanController;
