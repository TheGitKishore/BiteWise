// Normal Flow (UC #38, #40, #90)
//   1. User selects goal type + activity level → taps "Save Goal"
//   2. Boundary calls setGoal() (new) or updateGoal() (existing)
//   3. Controller validates and delegates to HealthGoal.create() / update()
//   4. Returns goal → boundary closes modal, shows banner, updates display
//
// Alt Flow 1a: missing fields → { success: false, field, message }
// Free (#38, #40) and Premium (#90)

import HealthGoal from '../entity/HealthGoal';

class SetHealthGoalController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[SetHealthGoalController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #38, #90 — create a new health goal
  // @param  {number} userId
  // @param  {{ goalType, customGoal, targetWeight, targetCalories, activityLevel, targetDate }}
  // @return {Promise<{ success, field, message, data }>}
  async setGoal(userId, fields) {
    return this._safeCall(async () => {
      return await HealthGoal.create(userId, fields);
    });
  }

  // UC #40, #90 — update existing health goal
  // @param  {number} goalId
  // @param  {{ goalType, customGoal, targetWeight, targetCalories, activityLevel, targetDate }}
  // @return {Promise<{ success, field, message, data }>}
  async updateGoal(goalId, fields) {
    return this._safeCall(async () => {
      return await HealthGoal.update(goalId, fields);
    });
  }
}

export default SetHealthGoalController;
