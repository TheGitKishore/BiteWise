// Normal Flow (UC #115)
//   1. Curator taps View Profile → screen mounts
//   2. Boundary calls fetchProfile(userId)
//   3. Controller fetches user details and recipe count
// Curator only (#115)

import User   from '../entity/User';
import Recipe from '../entity/Recipe';

class ViewCuratorProfileController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[ViewCuratorProfileController]', e); return { success: false, data: null, message: 'Unable to load profile.' }; } }

  // UC #115 — data: { user, recipeCount, publishedRecipes }
  async fetchProfile(userId) {
    return this._safeCall(async () => {
      const [userResult, recipeResult] = await Promise.all([User.getUser(userId), Recipe.fetchAll()]);
      if (!userResult.success) return { success: false, data: null, message: userResult.message };
      const published = recipeResult.success ? Recipe.filterByUser(recipeResult.data, userId) : [];
      return { success: true, data: { user: userResult.data, recipeCount: published.length, publishedRecipes: published }, message: '' };
    });
  }
}

export default ViewCuratorProfileController;
