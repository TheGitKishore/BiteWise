// Normal Flow (UC #95, #96)
//   1. User taps Add Item or swipes to delete on an existing item
//   2. Boundary calls addItem() / deleteItem()
//   3. Controller validates and delegates to GroceryList methods
// Alt Flow 1a (#95): item name empty → { success: false, field, message }
// Premium User only (#95, #96)

import GroceryList from '../entity/GroceryList';

class ManageGroceryListController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[ManageGroceryListController]', e); return { success: false, message: 'Something went wrong.', data: null }; } }

  // UC #95 — add a custom item
  async addItem(userId, { name, quantity, unit }) { return this._safeCall(async () => GroceryList.addItem(userId, { name, quantity, unit })); }

  // UC #96 — delete an item
  async deleteItem(userId, itemId) { return this._safeCall(async () => GroceryList.deleteItem(userId, itemId)); }

  // Toggle checked (item purchased)
  async toggleItem(userId, itemId) { return this._safeCall(async () => GroceryList.toggleItem(userId, itemId)); }
}

export default ManageGroceryListController;
