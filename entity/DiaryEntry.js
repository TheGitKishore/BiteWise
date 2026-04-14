// DiaryEntry.js — SEEDED (no axios)
// UC #76 (implied create), #77 add photo, #78 view, #79 delete
// Premium User only

const TODAY = new Date().toISOString().slice(0, 10);

const SEED_ENTRIES = {
  2: [
    { entryId: 'de1', userId: 2, title: 'First week check-in', content: 'Feeling strong after the first week on the new meal plan. Energy levels are noticeably higher and workouts are more productive.', mood: 'Great', photoUri: null, createdAt: '2026-03-01T08:00:00Z', updatedAt: '2026-03-01T08:00:00Z' },
    { entryId: 'de2', userId: 2, title: 'Post leg day', content: 'Legs are destroyed but in a good way. Hit a new squat PR today. Nutrition has been spot on.', mood: 'Good', photoUri: 'file://diary-photo-de2.jpg', createdAt: '2026-03-15T20:00:00Z', updatedAt: '2026-03-15T20:30:00Z' },
    { entryId: 'de3', userId: 2, title: 'Halfway milestone', content: 'Hit the halfway point of my bulk phase. Weight is up 1.8kg and strength is up across all lifts.', mood: 'Great', photoUri: null, createdAt: TODAY + 'T07:00:00Z', updatedAt: TODAY + 'T07:00:00Z' },
  ],
};

let _entries = { 2: [...SEED_ENTRIES[2]] };
let _nextId  = 10;

class DiaryEntry {
  constructor({ entryId=null, userId=null, title='', content='', mood='', photoUri=null, createdAt=null, updatedAt=null } = {}) {
    Object.assign(this, { entryId, userId, title, content, mood, photoUri, createdAt, updatedAt });
  }

  static validateEntry({ title, content }) {
    if (!title || title.trim().length === 0) return { valid: false, field: 'title', message: 'Title is required.' };
    if (!content || content.trim().length === 0) return { valid: false, field: 'content', message: 'Entry content is required.' };
    return { valid: true, field: null, message: '' };
  }

  static sortByDate(entries) { return [...entries].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)); }
  static hasEntries(entries) { return Array.isArray(entries) && entries.length > 0; }

  // UC #76
  static async create(userId, { title, content, mood }) {
    const check = DiaryEntry.validateEntry({ title, content });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };
    const now   = new Date().toISOString();
    const entry = new DiaryEntry({ entryId: 'de_' + _nextId++, userId, title: title.trim(), content: content.trim(), mood: mood || 'Okay', photoUri: null, createdAt: now, updatedAt: now });
    if (!_entries[userId]) _entries[userId] = [];
    _entries[userId].push({ ...entry });
    return { success: true, field: null, message: 'Diary entry created!', data: entry };
  }

  // UC #77
  static async addPhoto(entryId, photoUri) {
    for (const uid of Object.keys(_entries)) {
      const idx = _entries[uid].findIndex((e) => e.entryId === entryId);
      if (idx !== -1) {
        _entries[uid][idx].photoUri  = photoUri;
        _entries[uid][idx].updatedAt = new Date().toISOString();
        return { success: true, message: 'Photo added to diary entry.', data: new DiaryEntry(_entries[uid][idx]) };
      }
    }
    return { success: false, message: 'Diary entry not found.', data: null };
  }

  // UC #78
  static async fetchAll(userId) {
    return { success: true, data: DiaryEntry.sortByDate((_entries[userId] || []).map((e) => new DiaryEntry(e))), message: '' };
  }

  // UC #79
  static async delete(entryId) {
    for (const uid of Object.keys(_entries)) {
      const before = _entries[uid].length;
      _entries[uid] = _entries[uid].filter((e) => e.entryId !== entryId);
      if (_entries[uid].length < before) return { success: true, message: 'Diary entry deleted.' };
    }
    return { success: false, message: 'Diary entry not found.' };
  }
}

export default DiaryEntry;
