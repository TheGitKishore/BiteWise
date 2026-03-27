// Normal Flow (UC #28, #71)
//   1. User taps "Auto Generate" → modal opens with planType picker
//   2. Boundary calls generateMealPlan()
//   3. Controller delegates to MealPlan.generate()
//   4. Returns generated plan → boundary closes modal, shows banner, appends to list
//
// Alt Flow 1a: generation fails → { success: false, message }
// Shared by Free User (#28) and Premium User (#71)

import MealPlan from '../entity/MealPlan';

class GenerateMealPlanController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[GenerateMealPlanController]', error);
      return { success: false, field: null, message: 'Unable to generate meal plan. Please try again.', data: null };
    }
  }

  // UC #28, #71
  // @param  {number} userId
  // @param  {{ planType: string }}
  // @return {Promise<{ success, message, data }>}
  async generateMealPlan(userId, { planType }) {
    return this._safeCall(async () => {
      if (!planType || planType.trim().length === 0) {
        return { success: false, field: 'planType', message: 'Please select a plan type.', data: null };
      }
      return await MealPlan.generate(userId, { planType });
    });
  }
}

export default GenerateMealPlanController;
