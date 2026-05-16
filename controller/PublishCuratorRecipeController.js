// Normal Flow (UC #111)
//   1. Curator taps "Publish" on a draft recipe card
//   2. Controller delegates to RecipeDraft.publish()
//   3. Backend moves the draft into the published recipes collection

import RecipeDraft from '../entity/RecipeDraft';

class PublishCuratorRecipeController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[PublishCuratorRecipeController]', e);
      return { success: false, message: 'Failed to publish recipe. Please try again.' };
    }
  }

  async publishRecipe(recipeId, userId) {
    return this._safeCall(async () => {
      return await RecipeDraft.publish(recipeId, userId);
    });
  }
}

export default PublishCuratorRecipeController;
