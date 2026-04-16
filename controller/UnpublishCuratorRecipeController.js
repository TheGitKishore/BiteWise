// Normal Flow (UC #112)
//   1. Curator taps "Unpublish" on a PUBLISHED recipe card → Alert confirmation
//   2. Curator confirms
//   3. Boundary calls unpublishRecipe(recipeId, curatorUserId)
//   4. Controller delegates to Recipe.unpublish()
//   5. Recipe isPublished → false; removed from public RecipesScreen
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#112)

import Recipe from '../entity/Recipe';

class UnpublishCuratorRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[UnpublishCuratorRecipeController]', e); return { success: false, message: 'Failed to unpublish recipe. Please try again.' }; }
  }

  // UC #112
  // @param  {string} recipeId
  // @param  {number} curatorUserId
  // @return {Promise<{ success, message, data }>}
  async unpublishRecipe(recipeId, curatorUserId) {
    return this._safeCall(async () => Recipe.unpublish(recipeId, curatorUserId));
  }
}

export default UnpublishCuratorRecipeController;
