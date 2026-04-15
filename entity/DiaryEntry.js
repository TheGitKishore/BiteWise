import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/diary-entries`;

class DiaryEntry {
  constructor({ entryId=null, userId=null, title='', content='', mood='', weight=null, photoUri=null, createdAt=null, updatedAt=null } = {}) {
    Object.assign(this, { entryId, userId, title, content, mood, weight, photoUri, createdAt, updatedAt });
  }

  static validateEntry({ title, content }) {
    if (!title || title.trim().length === 0) return { valid: false, field: 'title', message: 'Title is required.' };
    if (!content || content.trim().length === 0) return { valid: false, field: 'content', message: 'Entry content is required.' };
    return { valid: true, field: null, message: '' };
  }

  static fromApi(raw) {
    return new DiaryEntry({
      entryId: raw.entryId || raw._id?.toString?.() || null,
      userId: Number(raw.userId) || null,
      title: raw.title || '',
      content: raw.content || '',
      mood: raw.mood || '',
      weight: raw.weight ?? null,
      photoUri: raw.photoUri || null,
      createdAt: raw.createdAt || null,
      updatedAt: raw.updatedAt || null,
    });
  }

  static sortByDate(entries) { return [...entries].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)); }
  static hasEntries(entries) { return Array.isArray(entries) && entries.length > 0; }

  // UC #76
  static async create(userId, { title, content, mood, weight }) {
    const check = DiaryEntry.validateEntry({ title, content });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(`${API_URL}`, {
        userId,
        title: title.trim(),
        content: content.trim(),
        mood: String(mood || '').trim(),
        weight: String(weight ?? '').trim(),
      });

      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Diary entry created!',
        data: res.data?.data ? DiaryEntry.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        field: err.response?.data?.field ?? null,
        message: err.response?.data?.message || 'Unable to create diary entry. Please try again.',
        data: null,
      };
    }
  }

  // UC #77
  static async addPhoto(entryId, photoUri) {
    if (!photoUri || !String(photoUri).trim()) {
      return { success: false, message: 'No photo URL provided.', data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${entryId}/photo`, { photoUri: String(photoUri).trim() });
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Photo added to diary entry.',
        data: res.data?.data ? DiaryEntry.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Unable to add photo to diary entry.',
        data: null,
      };
    }
  }

  // UC #78
  static async fetchAll(userId) {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      const mapped = Array.isArray(res.data?.data) ? res.data.data.map(DiaryEntry.fromApi) : [];
      return {
        success: Boolean(res.data?.success),
        data: DiaryEntry.sortByDate(mapped),
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load diary entries.',
      };
    }
  }

  // UC #79
  static async delete(entryId) {
    try {
      const res = await axios.delete(`${API_URL}/${entryId}`);
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Diary entry deleted.',
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Unable to delete diary entry.',
      };
    }
  }
}

export default DiaryEntry;
