// DeleteCustomRecipeController.js — Sprint 9 Task 5
// UC: Premium User – Delete Custom Recipe
//
// Normal Flow:
//   1. MyRecipesScreen user taps Delete → Alert.alert confirm popup shown
//   2. On confirm → boundary calls deleteRecipe(recipeId, userId)
//   3. Controller delegates to Recipe.deleteCustomRecipe(recipeId, userId)
//   4. Returns { success, message } to boundary
//   5. Boundary removes card from list and shows success banner
//
// Alt Flow 1: user cancels confirm popup → no action, flow ends
// Alt Flow 2: unexpected error → { success: false, message }

import Recipe from '../entity/Recipe';

class DeleteCustomRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[DeleteCustomRecipeController]', error);
      return { success: false, message: 'Unable to delete recipe. Please try again.' };
    }
  }

  // @param  {string|number} recipeId
  // @param  {string|number} userId
  // @return {Promise<{ success, message }>}
  async deleteRecipe(recipeId, userId) {
    return this._safeCall(async () => {
      if (!recipeId || !userId) {
        return { success: false, message: 'Invalid recipe or user.' };
      }
      return Recipe.deleteCustomRecipe(recipeId, userId);
    });
  }
}

export default DeleteCustomRecipeController;
