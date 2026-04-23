// Normal Flow (UC #75)
//   1. MindfulSnackingScreen mounts → boundary calls fetchSnackingContent()
//   2. Controller delegates to SmartEatingContent.fetchSnackingContent()
//   3. Returns structured { principles, cravings, whenToSnack, snackIdeas,
//      portionControl, warning } to boundary
//
// Sprint 9: Switched from fetchSnackingTips() flat list to
//           fetchSnackingContent() structured sections.
//           Added filterSnackIdeas() for timing filter chips.
// Premium User only (#75)

import SmartEatingContent from '../entity/SmartEatingContent';

class ViewMindfulSnackingController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[ViewMindfulSnackingController]', e);
      return { success: false, data: null, message: 'Unable to load snacking guide.' };
    }
  }

  // UC #75 — fetch full structured snacking content
  async fetchSnackingContent() {
    return this._safeCall(async () => SmartEatingContent.fetchSnackingContent());
  }

  // Filter snack ideas by timing tab: 'All' | 'Morning' | 'Afternoon' | 'Evening'
  filterSnackIdeas(snackIdeas, filter) {
    return SmartEatingContent.filterSnackIdeas(snackIdeas, filter);
  }

  // Legacy — kept for backward compat
  async fetchSnackingTips() {
    return this._safeCall(async () => SmartEatingContent.fetchSnackingTips());
  }
}

export default ViewMindfulSnackingController;
