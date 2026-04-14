// Normal Flow (UC #108)
//   1. Curator fills recipe form → taps Create Recipe
//   2. Boundary calls createRecipe(userId, fields)
//   3. Controller forces isCurated: true and delegates to Recipe.create()
// Alt Flow 6a: curator cancels → no action
// Alt Flow 1a: required fields missing → { success: false, field, message }
// Curator only (#108)

import Recipe from '../entity/Recipe';

class CreateCuratorRecipeController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[CreateCuratorRecipeController]', e); return { success: false, field: null, message: 'Something went wrong.', data: null }; } }

  // UC #108 — curator recipes are always isCurated: true
  async createRecipe(userId, fields) {
    return this._safeCall(async () => Recipe.create(userId, { ...fields, isCurated: true }));
  }
}

export default CreateCuratorRecipeController;
