// Normal Flow (UC #109)
//   1. Curator dashboard mounts → boundary calls fetchCuratorRecipes(userId)
//   2. Controller calls Recipe.fetchAll() then filterByUser()
//   3. Returns only this curator own recipes
// Alt Flow 1a: no recipes → { success: true, data: [] }
// Curator only (#109)

import Recipe from '../entity/Recipe';
import RecipeDraft from '../entity/RecipeDraft';

class ViewCuratorRecipesController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[ViewCuratorRecipesController]', e);
      return {
        success: false,
        data: [],
        message: 'Unable to load recipes.'
      };
    }
  }

  async fetchCuratorRecipes(userId) {
    return this._safeCall(async () => {
      const [publishedRes, draftRes] = await Promise.all([
        Recipe.fetchAll(),
        RecipeDraft.fetchByUser(userId)
      ]);
    
      const published = publishedRes?.success ? publishedRes.data : [];
      const drafts    = draftRes?.success ? draftRes.data : [];
    
      // ⚠️ IMPORTANT: avoid double filtering issues
      const minePublished = published.filter(r =>
        String(r.createdByUserId) === String(userId)
      );
    
      const mineDrafts = drafts.filter(r =>
        String(r.createdByUserId) === String(userId)
      );
    
      const mergedDrafts = mineDrafts.map(r => ({
        ...r,
        isPublished: false,
        status: 'DRAFT',
        recipeId: r.recipeId || r._id?.toString?.()
      }));
    
      const mergedPublished = minePublished.map(r => ({
        ...r,
        isPublished: true,
        status: 'PUBLISHED',
        recipeId: r.recipeId || r._id?.toString?.()
      }));
    
      const merged = [...mergedDrafts, ...mergedPublished];
    
      return {
        success: true,
        data: merged,
        message: merged.length === 0 ? 'No recipes created yet.' : ''
      };
    });
  }
}

export default ViewCuratorRecipesController;
