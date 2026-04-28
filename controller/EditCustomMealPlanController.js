// EditCustomMealPlanController.js — Sprint 10
// UC Sprint10-A: Premium User – Edit Custom Meal Plan
//
// Normal Flow:
//   1. EditCustomMealPlanModal submits fields → boundary calls updateCustomPlan()
//   2. Controller validates ownership guard then delegates to
//      MealPlan.updateCustomPlan(planId, userId, fields)
//   3. Returns { success, field, message, data } to boundary
//   4. Boundary updates plan card in list, closes modal, shows success banner
//
// Alt Flow 1: name empty → { success: false, field: 'name', message }
// Alt Flow 2: unexpected error → { success: false, message }
// Premium User only

import MealPlan from '../entity/MealPlan';

class EditCustomMealPlanController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[EditCustomMealPlanController]', e);
      return { success: false, field: null, message: 'Unable to update meal plan. Please try again.', data: null };
    }
  }

  // @param  {string|number} planId
  // @param  {string|number} userId
  // @param  {{ name, description, numDays, days[] }} fields
  // @return {Promise<{ success, field, message, data }>}
  async updateCustomPlan(planId, userId, fields) {
    return this._safe(async () => {
      if (!planId || !userId) {
        return { success: false, field: null, message: 'Invalid plan or user.', data: null };
      }
      return MealPlan.updateCustomPlan(planId, userId, fields);
    });
  }
}

export default EditCustomMealPlanController;
