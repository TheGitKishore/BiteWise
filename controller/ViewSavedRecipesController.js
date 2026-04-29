// Normal Flow (UC #65)
//   1. Screen mounts → boundary calls fetchSavedRecipes()
//   2. Controller calls Recipe.fetchSaved()
//   3. Returns saved recipe list to boundary
//   4. User applies filters → boundary calls filterSaved()
//
// UC #64 — dietary tag filter
// UC #68 — prep time / batch size filter
// Premium User only

import Recipe from '../entity/Recipe';

class ViewSavedRecipesController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewSavedRecipesController]', error);
      return { success: false, data: [], message: 'Unable to load saved recipes. Please try again.' };
    }
  }

  // UC #65
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  async fetchSavedRecipes(userId) {
    return this._safeCall(async () => {
      return await Recipe.fetchSaved(userId);
    });
  }

  // UC #64 — filter by dietary tag
  // @param  {Recipe[]} recipes
  // @param  {string}   tag
  // @return {Recipe[]}
  async removeSavedRecipe(userId, recipeId) {
    return this._safeCall(async () => {
      if (!userId || !recipeId) {
        return { success: false, message: 'Unable to remove saved recipe.' };
      }

      return await Recipe.unsaveRecipe(userId, recipeId);
    });
  }

  filterByDietaryTag(recipes, tag) {
    return Recipe.filterByTag(recipes, tag);
  }

  // UC #68 — filter by prep time (maxMins)
  // @param  {Recipe[]} recipes
  // @param  {number}   maxMins
  // @return {Recipe[]}
  filterByPrepTime(recipes, maxMins) {
    return Recipe.filterByPrepTime(recipes, maxMins);
  }

  // UC #64, #68 — text search across saved recipes
  // @param  {Recipe[]} recipes
  // @param  {string}   query
  // @return {Recipe[]}
  searchSavedRecipes(recipes, query) {
    return Recipe.filterBySearch(recipes, query);
  }
}

export default ViewSavedRecipesController;
