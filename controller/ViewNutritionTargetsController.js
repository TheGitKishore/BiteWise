// Normal Flow (UC #53)
//   1. Screen mounts → boundary calls fetchNutritionTargets()
//   2. Controller delegates to User.fetchNutritionTargets()
//   3. Returns { calories, protein, carbs, fat, fiber, activityLevel, goal }
//
// Alt Flow 1a: questionnaire not completed → targets not returned
// Premium User only (#53)

import User from '../entity/User';

class ViewNutritionTargetsController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewNutritionTargetsController]', error);
      return { success: false, data: null, message: 'Unable to load nutrition targets.' };
    }
  }

  // UC #53
  // @param  {User} user
  // @return {Promise<{ success, data, message }>}
  async fetchNutritionTargets(user) {
    return this._safeCall(async () => {
      return await User.fetchNutritionTargets(user);
    });
  }
}

export default ViewNutritionTargetsController;