// Normal Flow (UC #27, #70)
//   1. User fills recipe form and taps "Create Recipe"
//   2. Boundary calls createRecipe()
//   3. Controller delegates to Recipe.create()
//   4. Entity validates and returns new recipe
//   5. Boundary shows success banner
//
// Alt Flow 1a: required fields missing → { success: false, field, message }
// Shared by Free User (#27) and Premium User (#70)

import Recipe from '../entity/Recipe';

class CreateRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[CreateRecipeController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #27, #70
  // @param  {number} userId
  // @param  {{ title, description, prepTimeMins, calories, protein, carbs, fat, servings, difficulty, ingredients, instructions, tags }}
  // @return {Promise<{ success, field, message, data }>}
  async createRecipe(userId, fields) {
    return this._safeCall(async () => {
      return await Recipe.create(userId, fields);
    });
  }
}

export default CreateRecipeController;
