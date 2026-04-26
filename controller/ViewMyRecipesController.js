// Normal Flow (UC #27, #70)
//   1. Screen mounts → boundary calls fetchMyRecipes(userId)
//   2. Controller calls Recipe.fetchAll() then filters by createdByUserId
//   3. Returns only the current user's custom recipes
//
// Alt Flow 1a: no recipes created yet → { success: true, data: [] }

import Recipe from '../entity/Recipe';

class ViewMyRecipesController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewMyRecipesController]', error);
      return { success: false, data: [], message: 'Unable to load your recipes. Please try again.' };
    }
  }

  // UC #27, #70 — fetch only recipes created by this user
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  async fetchMyRecipes(userId) {
  return this._safeCall(async () => {
    const result = await Recipe.fetchCustom(userId); // ✅ FIX

    if (!result.success) {
      return { success: false, data: [], message: result.message || 'Failed to load recipes.' };
    }

    return {
      success: true,
      data: result.data,
      message: result.data.length === 0 ? 'No custom recipes yet.' : '',
    };
  });
}
}

export default ViewMyRecipesController;
