// Normal Flow (UC #39, #90)
//   1. Screen mounts → boundary calls fetchGoal()
//   2. Controller delegates to HealthGoal.fetchActive()
//   3. Returns active goal (or null if none set) to boundary
//
// Alt Flow: no goal set → boundary shows "Set Your Goal" CTA
// Free (#39) and Premium (#90)

import HealthGoal from '../entity/HealthGoal';

class ViewHealthGoalController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewHealthGoalController]', error);
      return { success: false, data: null, message: 'Unable to load health goal.' };
    }
  }

  // UC #39, #90
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  async fetchGoal(userId) {
    return this._safeCall(async () => {
      return await HealthGoal.fetchActive(userId);
    });
  }
}

export default ViewHealthGoalController;
