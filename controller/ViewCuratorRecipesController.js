// Normal Flow (UC #109)
//   1. Curator dashboard mounts → boundary calls fetchCuratorRecipes(userId)
//   2. Controller calls Recipe.fetchAll() then filterByUser()
//   3. Returns only this curator own recipes
// Alt Flow 1a: no recipes → { success: true, data: [] }
// Curator only (#109)

import Recipe from '../entity/Recipe';

class ViewCuratorRecipesController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[ViewCuratorRecipesController]', e); return { success: false, data: [], message: 'Unable to load recipes.' }; } }

  // UC #109
  async fetchCuratorRecipes(userId) {
    return this._safeCall(async () => {
      const result = await Recipe.fetchAll();
      if (!result.success) return { success: false, data: [], message: result.message };
      const mine = Recipe.filterByUser(result.data, userId);
      return { success: true, data: mine, message: mine.length === 0 ? 'No recipes created yet.' : '' };
    });
  }
}

export default ViewCuratorRecipesController;
