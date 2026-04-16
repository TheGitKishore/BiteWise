// Normal Flow (UC #75)
//   1. MindfulSnackingScreen mounts → boundary calls fetchSnackingTips()
//   2. Controller delegates to SmartEatingContent.fetchSnackingTips()
//   3. Returns seeded list of snacking tips to boundary
//   4. Boundary displays each tip as an expandable card
//
// Alt Flow: error fetching → { success: false, data: [], message }
// Premium User only (#75)

import SmartEatingContent from '../entity/SmartEatingContent';

class ViewMindfulSnackingController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[ViewMindfulSnackingController]', e); return { success: false, data: [], message: 'Unable to load snacking tips. Please try again.' }; }
  }

  // UC #75
  // @return {Promise<{ success, data, message }>}
  async fetchSnackingTips() {
    return this._safeCall(async () => SmartEatingContent.fetchSnackingTips());
  }
}

export default ViewMindfulSnackingController;
