// Normal Flow (UC #95)
//   1. User taps "Add Item" in the grocery list screen
//   2. Boundary calls addItem(userId, { name, quantity, unit })
//   3. Controller validates and delegates to GroceryList.addItem()
//   4. Returns updated list to boundary
//
// Alt Flow 1a: item name empty → { success: false, field, message }
// Premium User only (#95)

import GroceryList from '../entity/GroceryList';

class AddGroceryItemController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (error) {
      console.error('[AddGroceryItemController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #95 — add a custom item to the active grocery list
  // @param  {number} userId
  // @param  {{ name: string, quantity: number, unit: string }}
  // @return {Promise<{ success, field, message, data }>}
  async addItem(userId, { name, quantity, unit }) {
    return this._safeCall(async () => GroceryList.addItem(userId, { name, quantity, unit }));
  }

  // Toggle checked state — UI convenience, not a separate UC
  // @param  {number} userId
  // @param  {string} itemId
  // @return {Promise<{ success, message, data }>}
  async toggleItem(userId, itemId) {
    return this._safeCall(async () => GroceryList.toggleItem(userId, itemId));
  }
}

export default AddGroceryItemController;
