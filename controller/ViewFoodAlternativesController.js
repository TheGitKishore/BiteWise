// Normal Flow (UC #74)
//   1. FoodAlternativesScreen mounts → boundary calls fetchFoodAlternativesGrouped()
//   2. Controller delegates to SmartEatingContent.fetchFoodAlternativesGrouped()
//   3. Returns { data: groups[], tips: string[] } to boundary
//   4. Boundary renders: search bar → Smart Substitutions card →
//      food group sections each with alternative cards → Tips section
//
// Sprint 9: Switched from flat category-filtered list to grouped structure.
//           Search replaces category filter chips in new UI.
// Premium User only (#74)

import SmartEatingContent from '../entity/SmartEatingContent';

class ViewFoodAlternativesController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[ViewFoodAlternativesController]', e);
      return { success: false, data: [], tips: [], message: 'Unable to load food alternatives.' };
    }
  }

  // UC #74 — fetch alternatives grouped by original food
  async fetchFoodAlternativesGrouped() {
    return this._safeCall(async () => SmartEatingContent.fetchFoodAlternativesGrouped());
  }

  // Client-side search across all groups
  searchAlternatives(groups, query) {
    return SmartEatingContent.searchAlternatives(groups, query);
  }

  // Legacy — kept for backward compat
  async fetchAlternatives() {
    return this._safeCall(async () => SmartEatingContent.fetchAlternatives());
  }

  filterByCategory(alternatives, category) {
    return SmartEatingContent.filterByCategory(alternatives, category);
  }

  getCategories(alternatives) {
    return SmartEatingContent.getCategories(alternatives);
  }
}

export default ViewFoodAlternativesController;
