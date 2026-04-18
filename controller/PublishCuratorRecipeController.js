// Normal Flow (UC #111)
//   1. Curator taps "Publish" on a DRAFT recipe card → Alert confirmation
//   2. Curator confirms
//   3. Boundary calls publishRecipe(recipeId, curatorUserId)
//   4. Controller delegates to Recipe.publish()
//   5. Recipe isPublished → true; visible to all users in RecipesScreen
//
// Alt Flow 6a: curator cancels → no action
// Curator only (#111)

import Recipe from '../entity/Recipe';
import RecipeDraft from '../entity/RecipeDraft';

class PublishCuratorRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[PublishCuratorRecipeController]', e);
      return { success: false, message: 'Failed to publish recipe. Please try again.' };
    }
  }

  async publishRecipe(recipeId, userId) {
    return this._safeCall(async () => {
      console.log("🟡 CONTROLLER PUBLISH INPUT:", recipeId, userId);
    
      const draft = await RecipeDraft.getById(recipeId);
      console.log("🟡 FOUND DRAFT:", draft);
    
      if (!draft.success) {
        return { success: false, message: 'Draft not found' };
      }
    
      const recipeData = {
        title: draft.data.title,
        description: draft.data.description,
        prepTimeMins: draft.data.prepTimeMins,
        calories: draft.data.calories,
        protein: draft.data.protein,
        carbs: draft.data.carbs,
        fat: draft.data.fat,
        servings: draft.data.servings,
        difficulty: draft.data.difficulty,
        ingredients: draft.data.ingredients,
        instructions: draft.data.instructions,
        tags: draft.data.tags,
        isPublished: true,
        createdByUserId: userId,
      };
    
      console.log("🟡 FINAL RECIPE DATA:", recipeData);
    
      const created = await Recipe.create(userId, recipeData);
    
      await RecipeDraft.delete(recipeId, userId);
    
      return {
        success: true,
        message: 'Recipe published!',
        data: created.data,
      };
    });
  }
}

export default PublishCuratorRecipeController;
