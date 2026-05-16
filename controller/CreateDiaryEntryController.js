// Normal Flow (UC #76, #77)
//   1. User fills diary form → taps Save
//   2. Boundary calls createEntry(); then addPhoto() if a photo was selected
//   3. Controller delegates to DiaryEntry.create() / addPhoto()
// Alt Flow 1a: missing title or content → { success: false, field, message }
// Premium User only (#76, #77)

import DiaryEntry from '../entity/DiaryEntry';

class CreateDiaryEntryController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[CreateDiaryEntryController]', e); return { success: false, field: null, message: 'Something went wrong.', data: null }; } }

  // UC #76 — create a new diary entry
  // @param  {number} userId
  // @param  {{ title, content, mood }}
  async createEntry(userId, fields) { return this._safeCall(async () => DiaryEntry.create(userId, fields)); }

  // UC #77 — attach a photo to an existing diary entry
  // @param  {string} entryId
  // @param  {string} photoUri — local device URI from image picker
  async addPhoto(entryId, photoUri) {
    return this._safeCall(async () => {
      if (!photoUri) return { success: false, message: 'No photo selected.', data: null };
      return DiaryEntry.addPhoto(entryId, photoUri);
    });
  }
}

export default CreateDiaryEntryController;
