// Normal Flow (UC #94)
//   1. User selects a saved recipe → taps Generate Grocery List
//   2. Boundary calls generateFromRecipe(userId, recipe)
//   3. Controller delegates to GroceryList.generateFromRecipe()
//   4. Returns new list to boundary
// Alt Flow 1a: no saved recipes → boundary shows empty state
// Premium User only (#94)

import GroceryList from '../entity/GroceryList';

class GenerateGroceryListController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[GenerateGroceryListController]', e); return { success: false, message: 'Failed to generate grocery list.', data: null }; } }

  // UC #94
  async generateFromRecipe(userId, recipe) { return this._safeCall(async () => GroceryList.generateFromRecipe(userId, recipe)); }

  // Load existing list on screen mount
  async fetchCurrentList(userId) { return this._safeCall(async () => GroceryList.fetchCurrent(userId)); }
}

export default GenerateGroceryListController;
