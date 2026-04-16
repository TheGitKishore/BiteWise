// Normal Flow (UC #74)
//   1. FoodAlternativesScreen mounts → boundary calls fetchAlternatives()
//   2. Controller delegates to SmartEatingContent.fetchAlternatives()
//   3. Returns seeded list of food swaps to boundary
//   4. Boundary displays cards grouped by category
//
// Alt Flow: error fetching → { success: false, data: [], message }
// Premium User only (#74)

import SmartEatingContent from '../entity/SmartEatingContent';

class ViewFoodAlternativesController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[ViewFoodAlternativesController]', e); return { success: false, data: [], message: 'Unable to load food alternatives. Please try again.' }; }
  }

  // UC #74
  // @return {Promise<{ success, data, message }>}
  async fetchAlternatives() {
    return this._safeCall(async () => SmartEatingContent.fetchAlternatives());
  }

  // Client-side filter by category
  // @param  {Array}  alternatives
  // @param  {string} category
  // @return {Array}
  filterByCategory(alternatives, category) {
    return SmartEatingContent.filterByCategory(alternatives, category);
  }

  getCategories(alternatives) {
    return SmartEatingContent.getCategories(alternatives);
  }
}

export default ViewFoodAlternativesController;
