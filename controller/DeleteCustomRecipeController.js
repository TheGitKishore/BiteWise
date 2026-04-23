// Normal Flow (UC NEW-D — Premium User Delete Custom Recipe)
//   1. User taps "Delete" on a recipe card in MyRecipesScreen
//   2. Alert confirm popup: "Are you sure you want to delete [title]?"
//   3. User confirms → boundary calls deleteRecipe(recipeId, userId)
//   4. Controller delegates to Recipe.deleteCustomRecipe()
//   5. Returns { success, message } → card removed, success banner shown
//
// Alt Flow: user cancels Alert → no action taken
// Premium User only (UC NEW-D)

import Recipe from '../entity/Recipe';

class DeleteCustomRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[DeleteCustomRecipeController]', e);
      return { success: false, message: 'Failed to delete recipe. Please try again.' };
    }
  }

  // UC NEW-D
  // @param  {string} recipeId
  // @param  {number} userId
  // @return {Promise<{ success, message }>}
  async deleteRecipe(recipeId, userId) {
    return this._safeCall(async () => Recipe.deleteCustomRecipe(recipeId, userId));
  }
}

export default DeleteCustomRecipeController;
