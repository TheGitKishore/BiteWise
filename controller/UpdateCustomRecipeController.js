// UpdateCustomRecipeController.js — Sprint 9 Task 5
// UC: Premium User – Edit Custom Recipe
//
// Normal Flow:
//   1. EditMyRecipeScreen submits updated fields → boundary calls updateRecipe()
//   2. Controller validates ownership (userId match) then delegates to
//      Recipe.updateCustomRecipe(recipeId, userId, fields)
//   3. Returns { success, field, message, data } to boundary
//   4. Boundary shows success banner and navigates back to MyRecipesScreen
//
// Alt Flow 1: validation failure → { success: false, field, message }
// Alt Flow 2: unexpected error  → { success: false, message }

import Recipe from '../entity/Recipe';

class UpdateCustomRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[UpdateCustomRecipeController]', error);
      return { success: false, field: null, message: 'Unable to update recipe. Please try again.', data: null };
    }
  }

  // @param  {string|number} recipeId
  // @param  {string|number} userId
  // @param  {object}        fields  — { title, description, prepTimeMins, calories,
  //                                     protein, carbs, fat, servings, difficulty,
  //                                     ingredients[], instructions[], tags[] }
  // @return {Promise<{ success, field, message, data }>}
  async updateRecipe(recipeId, userId, fields) {
    return this._safeCall(async () => {
      if (!recipeId || !userId) {
        return { success: false, field: null, message: 'Invalid recipe or user.', data: null };
      }
      return Recipe.updateCustomRecipe(recipeId, userId, fields);
    });
  }
}

export default UpdateCustomRecipeController;
