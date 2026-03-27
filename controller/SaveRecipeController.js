// Normal Flow (UC #25, #67)
//   1. User views a recipe and taps "Save Recipe"
//   2. For Free users: system displays upgrade prompt
//   3. For Premium users: boundary calls saveRecipe()
//   4. Controller delegates to Recipe.saveRecipe()
//   5. Returns success → boundary shows banner
//
// Alt Flow: save fails → { success: false, message }
// Free (#25) — blocked, redirects to upgrade
// Premium (#67) — full save

import Recipe from '../entity/Recipe';

class SaveRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[SaveRecipeController]', error);
      return { success: false, message: 'Unable to save recipe. Please try again.' };
    }
  }

  // UC #25, #67
  // @param  {string} role    — 'FREE' | 'PREMIUM'
  // @param  {number} userId
  // @param  {Recipe} recipe
  // @return {Promise<{ success, message, isPremiumGate }>}
  async saveRecipe(role, userId, recipe) {
    if (role !== 'PREMIUM') {
      return {
        success:       false,
        message:       'Saving recipes is a Premium feature',
        isPremiumGate: true,
      };
    }

    return this._safeCall(async () => {
      const result = await Recipe.saveRecipe(userId, recipe);
      return { ...result, isPremiumGate: false };
    });
  }
}

export default SaveRecipeController;
