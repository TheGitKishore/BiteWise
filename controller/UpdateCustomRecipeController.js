// Normal Flow (UC NEW-C — Premium User Update Custom Recipe)
//   1. User taps "Edit" on a recipe card in MyRecipesScreen
//   2. EditMyRecipeScreen opens pre-filled with recipe data
//   3. User edits fields and taps "Save Changes"
//   4. Boundary calls updateRecipe(recipeId, userId, fields)
//   5. Controller validates and delegates to Recipe.updateCustomRecipe()
//   6. Returns { success, field, message, data } → success banner shown
//
// Alt Flow: validation failure → { success: false, field, message }
// Premium User only (UC NEW-C)

import Recipe from '../entity/Recipe';

class UpdateCustomRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[UpdateCustomRecipeController]', e);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC NEW-C
  // @param  {string} recipeId
  // @param  {number} userId
  // @param  {object} fields
  // @return {Promise<{ success, field, message, data }>}
  async updateRecipe(recipeId, userId, fields) {
    return this._safeCall(async () => Recipe.updateCustomRecipe(recipeId, userId, fields));
  }
}

export default UpdateCustomRecipeController;
