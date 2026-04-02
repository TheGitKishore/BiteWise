// Normal Flow (UC #37, #88)
//   1. Screen mounts → boundary calls fetchHeightHistory()
//   2. Controller delegates to HeightEntry.fetchAll()
//   3. Returns entries list and latest entry
//
// Alt Flow: no entries → empty state
// Free (#37) and Premium (#88)

import HeightEntry from '../entity/HeightEntry';

class ViewHeightHistoryController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewHeightHistoryController]', error);
      return { success: false, data: [], latest: null, message: 'Unable to load height history.' };
    }
  }

  // UC #37, #88
  // @param  {number} userId
  // @return {Promise<{ success, data, latest, message }>}
  async fetchHeightHistory(userId) {
    return this._safeCall(async () => {
      const result = await HeightEntry.fetchAll(userId);
      if (!result.success) return { ...result, latest: null };
      const sorted = [...result.data].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
      return {
        success: true,
        data:    sorted,
        latest:  HeightEntry.getLatest(result.data),
        message: '',
      };
    });
  }
}

export default ViewHeightHistoryController;
