// Normal Flow (UC #78)
//   1. Screen mounts → boundary calls fetchEntries(userId)
//   2. Controller delegates to DiaryEntry.fetchAll()
//   3. Returns sorted diary entries to boundary
// Alt Flow 1a: no entries → { success: true, data: [] }
// Premium User only (#78)

import DiaryEntry from '../entity/DiaryEntry';

class ViewDiaryController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[ViewDiaryController]', e); return { success: false, data: [], message: 'Unable to load diary entries.' }; } }

  // UC #78
  async fetchEntries(userId) { return this._safeCall(async () => DiaryEntry.fetchAll(userId)); }
}

export default ViewDiaryController;
