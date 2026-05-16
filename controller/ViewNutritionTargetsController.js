// Normal Flow (UC #53)
//   1. NutritionTargetsScreen mounts → boundary calls fetchNutritionTargets(userId)
//   2. Controller delegates to NutritionTargets.fetchByUser() (Sprint 8 change)
//   3. Returns { calories, protein, carbs, fat, fiber, activityLevel, goal }
//
// Sprint 8: Delegates to new NutritionTargets entity (was User.fetchNutritionTargets).
//           Backward-compat wrapper kept — callers that pass a user object still work.
// Free User: calories only relevant; Premium User: full macro set.

import NutritionTargets from '../entity/NutritionTargets';

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

  // UC #53 — fetch full targets for a user.
  // @param  {number} userId
  // @return {Promise<{ success, data: NutritionTargets, message }>}
  async fetchNutritionTargets(userId) {
    return this._safeCall(async () => NutritionTargets.fetchByUser(userId));
  }

  // Backward-compat: called with a User object → extracts userId.
  // @param  {User|number} userOrId
  // @return {Promise<{ success, data, message }>}
  async fetchNutritionTargetsForUser(userOrId) {
    const userId = typeof userOrId === 'object' ? userOrId?.userId : userOrId;
    return this.fetchNutritionTargets(userId);
  }
}

export default ViewNutritionTargetsController;
