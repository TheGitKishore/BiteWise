// Normal Flow (UC #79)
//   1. User taps delete on a diary entry → confirms alert
//   2. Boundary calls deleteEntry(entryId)
//   3. Controller delegates to DiaryEntry.delete()
//   4. Boundary removes entry from local list
// Premium User only (#79)

import DiaryEntry from '../entity/DiaryEntry';

class DeleteDiaryEntryController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[DeleteDiaryEntryController]', e); return { success: false, message: 'Failed to delete entry.' }; } }

  // UC #79
  async deleteEntry(entryId) { return this._safeCall(async () => DiaryEntry.delete(entryId)); }
}

export default DeleteDiaryEntryController;
