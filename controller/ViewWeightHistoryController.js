// Normal Flow (UC #35, #85)
//   1. Screen mounts → boundary calls fetchWeightHistory()
//   2. Controller delegates to WeightEntry.fetchAll()
//   3. Returns entries list and computed stats (latest, total change)
//
// Alt Flow: no entries → empty state
// Free (#35) and Premium (#85)

import WeightEntry from '../entity/WeightEntry';

class ViewWeightHistoryController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewWeightHistoryController]', error);
      return { success: false, data: [], latest: null, totalChange: 0, message: 'Unable to load weight history.' };
    }
  }

  // UC #35, #85
  // @param  {number} userId
  // @return {Promise<{ success, data, latest, totalChange, message }>}
  async fetchWeightHistory(userId) {
    return this._safeCall(async () => {
      const result = await WeightEntry.fetchAll(userId);
      if (!result.success) return { ...result, latest: null, totalChange: 0 };
      const sorted = [...result.data].sort((a, b) => new Date(b.loggedAt) - new Date(a.loggedAt));
      return {
        success:     true,
        data:        sorted,
        latest:      WeightEntry.getLatest(result.data),
        totalChange: WeightEntry.getTotalChange(result.data),
        message:     '',
      };
    });
  }

  // UC #84 — delete an entry
  // @param  {number} entryId
  // @return {Promise<{ success, message }>}
  async deleteEntry(entryId) {
    return this._safeCall(async () => {
      return await WeightEntry.delete(entryId);
    });
  }
}

export default ViewWeightHistoryController;
