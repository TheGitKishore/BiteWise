// ViewMindfulSnackingController.js — UC #75 Premium User – View Mindful Snacking Recommendations
//
// Normal Flow (UC #75 Sprint 9):
//   1. MindfulSnackingScreen mounts → boundary calls fetchSnackingContent()
//   2. Controller delegates to SmartEatingContent.fetchSnackingContent()
//   3. Returns full structured content object to boundary
//   4. Boundary renders 6 content sections with filter chips for snack ideas
//
// Alt Flow: error → { success: false, data: null, message }
// Premium User only (#75)

import SmartEatingContent from '../entity/SmartEatingContent';

class ViewMindfulSnackingController {
  constructor() {}

  async _safeCall(fn, emptyData = []) {
    try {
      return await fn();
    } catch (e) {
      console.error('[ViewMindfulSnackingController]', e);
      return { success: false, data: emptyData, message: 'Unable to load snacking content. Please try again.' };
    }
  }

  // UC #75 (legacy — kept for backward compatibility)
  // @return {Promise<{ success, data: Array, message }>}
  async fetchSnackingTips() {
    return this._safeCall(async () => SmartEatingContent.fetchSnackingTips());
  }

  // UC #75 Sprint 9 — full structured snacking content
  // @return {Promise<{ success, data: object, message }>}
  async fetchSnackingContent() {
    return this._safeCall(async () => SmartEatingContent.fetchSnackingContent(), null);
  }

  // Client-side filter for snack ideas by timing period
  // @param  {Array}  snackIdeas
  // @param  {string} filter  — 'All' | 'Morning' | 'Afternoon' | 'Evening'
  // @return {Array}
  filterSnackIdeas(snackIdeas, filter) {
    return SmartEatingContent.filterSnackIdeas(snackIdeas, filter);
  }
}

export default ViewMindfulSnackingController;
