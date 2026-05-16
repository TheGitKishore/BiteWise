// Normal Flow (UC #96)
//   1. User taps cross icon on a grocery list item
//   2. Boundary calls deleteItem(userId, itemId)
//   3. Controller delegates to GroceryList.deleteItem()
//   4. Returns updated list to boundary
//
// Premium User only (#96)

import GroceryList from '../entity/GroceryList';

class DeleteGroceryItemController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (error) {
      console.error('[DeleteGroceryItemController]', error);
      return { success: false, message: 'Failed to remove item. Please try again.', data: null };
    }
  }

  // UC #96 — delete an item from the active grocery list
  // @param  {number} userId
  // @param  {string} itemId
  // @return {Promise<{ success, message, data }>}
  async deleteItem(userId, itemId) {
    return this._safeCall(async () => GroceryList.deleteItem(userId, itemId));
  }
}

export default DeleteGroceryItemController;
