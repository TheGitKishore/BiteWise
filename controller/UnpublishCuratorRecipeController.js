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
    try {
      return await fn();
    } catch (e) {
      console.error('[UnpublishCuratorRecipeController]', e);
      return { success: false, message: 'Failed to unpublish recipe.' };
    }
  }

  async unpublishRecipe(recipeId, userId) {
    return this._safeCall(async () => {
      console.log("🟡 CONTROLLER UNPUBLISH INPUT:", recipeId, userId);

      const res = await Recipe.unpublish(recipeId, userId);
      
      console.log("🟢 CONTROLLER UNPUBLISH RESPONSE:", res);

      return {
        success: true,
        message: res.message,
        data: res.data,
      };
    });
  }
}

export default UnpublishCuratorRecipeController;
