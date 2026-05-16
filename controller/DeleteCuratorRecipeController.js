// Normal Flow (UC #114)
//   1. Curator taps Delete on a recipe → confirms alert
//   2. Boundary calls deleteRecipe(recipeId, userId)
//   3. Controller delegates to Recipe.delete()
// Alt Flow 8a: curator cancels → no action
// Curator only (#114)

import RecipeDraft from '../entity/RecipeDraft';

class DeleteCuratorRecipeController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[DeleteCuratorRecipeController]', e); return { success: false, message: 'Failed to delete recipe.' }; } }

  // UC #114
  async deleteRecipe(recipeId, curatorUserId) {
    return this._safeCall(async () => RecipeDraft.delete(recipeId, curatorUserId));
  }
}

export default DeleteCuratorRecipeController;
