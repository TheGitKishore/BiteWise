// EditDiaryEntryController.js — Sprint 11 New BCE: Edit Diary Entry
//
// Normal Flow:
//   1. User taps ✏️ Edit on a diary entry card in DiaryScreen
//   2. Edit form pre-fills title/content/mood/weight
//   3. User saves → boundary calls updateEntry(entryId, fields)
//   4. Controller delegates to DiaryEntry.update()
//   5. Returns { success, message, data } → boundary updates card + shows banner
//
// Alt Flow: title or content empty → { success: false, message }
// Free + Premium users

import DiaryEntry from '../entity/DiaryEntry';

class EditDiaryEntryController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[EditDiaryEntryController]', e); return { success: false, message: 'Unable to update diary entry.', data: null }; }
  }

  // @param  {string|number} entryId
  // @param  {{ title, content, mood, weight }} fields
  // @return {Promise<{ success, message, data }>}
  async updateEntry(entryId, { title, content, mood, weight }) {
    return this._safe(async () => {
      if (!entryId) return { success: false, message: 'Invalid entry.', data: null };
      return DiaryEntry.update(entryId, { title, content, mood, weight });
    });
  }
}

export default EditDiaryEntryController;
