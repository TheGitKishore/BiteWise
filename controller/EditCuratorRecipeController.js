// Normal Flow (UC #113)
//   1. Curator selects a recipe → taps Edit → form pre-filled
//   2. Curator edits and saves → boundary calls updateRecipe()
//   3. Controller validates and delegates to Recipe.update()
// Alt Flow 6a: curator cancels → no action
// Curator only (#113)

import Recipe from '../entity/Recipe';
import RecipeDraft from '../entity/RecipeDraft';

class EditCuratorRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[EditCuratorRecipeController]', e);
      return {
        success: false,
        field: null,
        message: 'Something went wrong.',
        data: null
      };
    }
  }

  async updateRecipe(recipe, curatorUserId, fields) {
    return this._safeCall(async () => {

      // BLOCK EDIT IF PUBLISHED
      if (recipe.status === 'PUBLISHED' || recipe.isPublished) {
        return {
          success: false,
          message: 'Published recipes cannot be edited. Unpublish first.',
        };
      }

      console.log('RECIPE OBJECT:', recipe);
      console.log('recipeId:', recipe.recipeId);
      console.log('_id:', recipe._id);

      const id =
        typeof recipe === 'string'
          ? recipe
          : recipe.recipeId || recipe._id;

      if (!id) {
        console.error('Missing recipe ID:', recipe);
        return {
          success: false,
          message: 'Recipe ID is missing',
        };
      }

      return await RecipeDraft.update(
        id.toString(),
        curatorUserId,
        fields
      );
    });
  }
}

export default EditCuratorRecipeController;
