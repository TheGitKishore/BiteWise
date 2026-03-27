// Normal Flow (UC #22, #61)
//   1. Screen mounts → boundary calls fetchRecipes()
//   2. Controller calls Recipe.fetchAll()
//   3. Returns recipe list to boundary
//   4. User types / selects filter → boundary calls searchRecipes() / filterByTag()
//
// Alt Flow 1a: no recipes → { success: false, message }
// Shared: Free (#22, #23) and Premium (#61, #63, #64, #66, #68)

import Recipe from '../entity/Recipe';

class ViewRecipesController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewRecipesController]', error);
      return { success: false, data: [], message: 'Unable to load recipes. Please try again.' };
    }
  }

  // UC #22, #61
  // @return {Promise<{ success, data, message }>}
  async fetchRecipes() {
    return this._safeCall(async () => {
      const result = await Recipe.fetchAll();
      if (!Recipe.hasRecipes(result.data)) {
        return { success: false, data: [], message: 'No recipes available.' };
      }
      return result;
    });
  }

  // UC #23, #64, #68 — sync filter by search query (title or ingredients)
  // @param  {Recipe[]} recipes
  // @param  {string}   query
  // @return {Recipe[]}
  searchRecipes(recipes, query) {
    return Recipe.filterBySearch(recipes, query);
  }

  // UC #23 — sync filter by tag chip
  // @param  {Recipe[]} recipes
  // @param  {string}   tag
  // @return {Recipe[]}
  filterByTag(recipes, tag) {
    return Recipe.filterByTag(recipes, tag);
  }

  // UC #63, #66 — sync filter for curated and/or meal-prep recipes
  // @param  {Recipe[]} recipes
  // @param  {{ curated, mealPrep }}
  // @return {Recipe[]}
  filterCuratedAndMealPrep(recipes, { curated = false, mealPrep = false }) {
    let result = recipes;
    if (curated)  result = Recipe.filterCurated(result);
    if (mealPrep) result = Recipe.filterMealPrep(result);
    return result;
  }

  // UC #68 — sync filter by prep time
  // @param  {Recipe[]} recipes
  // @param  {number}   maxMins
  // @return {Recipe[]}
  filterByPrepTime(recipes, maxMins) {
    return Recipe.filterByPrepTime(recipes, maxMins);
  }
}

export default ViewRecipesController;
