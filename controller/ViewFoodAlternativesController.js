// ViewFoodAlternativesController.js — UC #74 Premium User – View Healthier Food Alternatives
//
// Normal Flow (UC #74 Sprint 9):
//   1. FoodAlternativesScreen mounts → boundary calls fetchFoodAlternativesGrouped()
//   2. Controller delegates to SmartEatingContent.fetchFoodAlternativesGrouped()
//   3. Returns { groups, tips } to boundary
//   4. Boundary renders food groups with alternatives and tips footer
//
// Alt Flow: error → { success: false, data: null, message }
// Premium User only (#74)

import SmartEatingContent from '../entity/SmartEatingContent';

class ViewFoodAlternativesController {
  constructor() {}

  async _safeCall(fn, emptyData = []) {
    try {
      return await fn();
    } catch (e) {
      console.error('[ViewFoodAlternativesController]', e);
      return { success: false, data: emptyData, message: 'Unable to load food alternatives. Please try again.' };
    }
  }

  // UC #74 (legacy) — flat alternatives list
  // @return {Promise<{ success, data: Array, message }>}
  async fetchAlternatives() {
    return this._safeCall(async () => SmartEatingContent.fetchAlternatives());
  }

  // Legacy client-side helpers
  filterByCategory(alternatives, category) {
    return SmartEatingContent.filterByCategory(alternatives, category);
  }

  getCategories(alternatives) {
    return SmartEatingContent.getCategories(alternatives);
  }

  // UC #74 Sprint 9 — grouped alternatives with tips
  // @return {Promise<{ success, data: { groups, tips }, message }>}
  async fetchFoodAlternativesGrouped() {
    return this._safeCall(async () => SmartEatingContent.fetchFoodAlternativesGrouped(), null);
  }

  // Client-side search across groups and alternatives
  // @param  {Array}  groups
  // @param  {string} query
  // @return {Array}  filtered groups
  searchAlternatives(groups, query) {
    return SmartEatingContent.searchAlternatives(groups, query);
  }
}

export default ViewFoodAlternativesController;
