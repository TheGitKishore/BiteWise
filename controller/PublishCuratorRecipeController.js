// Normal Flow (UC #111)
//   1. Curator taps "Publish" on a DRAFT recipe card → Alert confirmation
//   2. Curator confirms
//   3. Boundary calls publishRecipe(recipeId, curatorUserId)
//   4. Controller delegates to Recipe.publish()
//   5. Recipe isPublished → true; visible to all users in RecipesScreen
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#111)

import Recipe from '../entity/Recipe';

class PublishCuratorRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[PublishCuratorRecipeController]', e); return { success: false, message: 'Failed to publish recipe. Please try again.' }; }
  }

  // UC #111
  // @param  {string} recipeId
  // @param  {number} curatorUserId
  // @return {Promise<{ success, message, data }>}
  async publishRecipe(recipeId, curatorUserId) {
    return this._safeCall(async () => Recipe.publish(recipeId, curatorUserId));
  }
}

export default PublishCuratorRecipeController;
