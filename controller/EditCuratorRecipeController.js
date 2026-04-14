// Normal Flow (UC #113)
//   1. Curator selects a recipe → taps Edit → form pre-filled
//   2. Curator edits and saves → boundary calls updateRecipe()
//   3. Controller validates and delegates to Recipe.update()
// Alt Flow 6a: curator cancels → no action
// Curator only (#113)

import Recipe from '../entity/Recipe';

class EditCuratorRecipeController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[EditCuratorRecipeController]', e); return { success: false, field: null, message: 'Something went wrong.', data: null }; } }

  // UC #113
  async updateRecipe(recipeId, curatorUserId, fields) {
    return this._safeCall(async () => Recipe.update(recipeId, curatorUserId, fields));
  }
}

export default EditCuratorRecipeController;
