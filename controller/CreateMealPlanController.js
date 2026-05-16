// Normal Flow (UC #26, #69)
//   1. User fills Create Meal Plan form and taps "Create Plan"
//   2. Boundary calls createMealPlan()
//   3. Controller delegates to MealPlan.create()
//   4. Returns new plan → boundary closes modal, shows banner, appends to list
//
// Alt Flow 1a: plan name missing → { success: false, field, message }
// Shared by Free User (#26) and Premium User (#69)

import MealPlan from '../entity/MealPlan';

class CreateMealPlanController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[CreateMealPlanController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #26, #69
  // @param  {number} userId
  // @param  {{ name, description, numDays, days }}
  // @return {Promise<{ success, field, message, data }>}
  async createMealPlan(userId, fields) {
    return this._safeCall(async () => {
      return await MealPlan.create(userId, fields);
    });
  }
}

export default CreateMealPlanController;
