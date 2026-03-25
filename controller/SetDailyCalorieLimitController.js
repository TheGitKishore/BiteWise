// Normal Flow (UC #18, #54)
//   1. User taps "↗ Set Daily Goal" → modal opens
//   2. User inputs calorie limit and taps "Save Goal"
//   3. Boundary calls setDailyCalorieLimit()
//   4. Controller delegates to User.setDailyCalorieLimit()
//   5. Returns updated user → boundary closes modal, updates progress card
//
// Alt Flow 1a: invalid input → { success: false, field, message }
// Shared by Free User (#18) and Premium User (#54)

import User from '../entity/User';

class SetDailyCalorieLimitController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[SetDailyCalorieLimitController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', user: null };
    }
  }

  // UC #18, #54
  // @param  {User}   user
  // @param  {number} limit
  // @return {Promise<{ success, field, message, user }>}
  async setDailyCalorieLimit(user, limit) {
    return this._safeCall(async () => {
      return await User.setDailyCalorieLimit(user, limit);
    });
  }
}

export default SetDailyCalorieLimitController;