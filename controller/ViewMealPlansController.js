// Normal Flow (UC #29, #72)
//   1. Screen mounts → boundary calls fetchMealPlans()
//   2. Controller calls MealPlan.fetchAll()
//   3. Returns plan list to boundary for display
//
// Alt Flow: no plans → empty state
// Shared by Free User (#29) and Premium User (#72)

import MealPlan from '../entity/MealPlan';

class ViewMealPlansController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewMealPlansController]', error);
      return { success: false, data: [], message: 'Unable to load meal plans. Please try again.' };
    }
  }

  // UC #29, #72
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  async fetchMealPlans(userId) {
    return this._safeCall(async () => {
      return await MealPlan.fetchAll(userId);
    });
  }
}

export default ViewMealPlansController;
