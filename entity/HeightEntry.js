import axios from 'axios';
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/height-entries`;

// Validation thresholds (easy to adjust later)
const MIN_HEIGHT_CM = 50;
const MAX_HEIGHT_CM = 300;

const normalizeEntry = (raw = {}) => new HeightEntry({
  entryId: raw.entryId ?? raw.entry_id ?? null,
  userId: raw.userId ?? raw.user_id ?? null,
  heightCm: Number(raw.heightCm ?? raw.height_cm ?? 0),
  loggedAt: raw.loggedAt ?? raw.logged_at ?? null,
});

class HeightEntry {
  constructor({
    entryId  = null,
    userId   = null,
    heightCm = 0,
    loggedAt = null,
  } = {}) {
    this.entryId  = entryId;
    this.userId   = userId;
    this.heightCm = heightCm;
    this.loggedAt = loggedAt;
  }


  // STATIC VALIDATION METHODS

  // UC #36, #87, #89 — validate height input
  // @param  {number} heightCm
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateHeight(heightCm) {
    if (!heightCm || isNaN(heightCm) || Number(heightCm) <= 0) {
      return { valid: false, field: 'heightCm', message: 'Please enter a valid height.' };
    }
    if (Number(heightCm) < MIN_HEIGHT_CM) {
      return { valid: false, field: 'heightCm', message: `Height must be at least ${MIN_HEIGHT_CM} cm.` };
    }
    if (Number(heightCm) > MAX_HEIGHT_CM) {
      return { valid: false, field: 'heightCm', message: 'Please enter a valid height.' };
    }
    return { valid: true, field: null, message: '' };
  }


  // STATIC / COLLECTION METHODS

  // Returns the most recent height entry
  // @param  {HeightEntry[]} entries
  // @return {HeightEntry|null}
  static getLatest(entries) {
    if (!entries || entries.length === 0) return null;
    return entries.reduce((latest, e) =>
      new Date(e.loggedAt) > new Date(latest.loggedAt) ? e : latest
    );
  }


  // DATA ACCESS

  // UC #36, #87 — log a new height entry
  // @param  {number} userId
  // @param  {{ heightCm }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, { heightCm }) {
    const check = HeightEntry.validateHeight(heightCm);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, { userId, heightCm: Number(heightCm) });
      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Height logged successfully.',
        data: res.data?.data ? normalizeEntry(res.data.data) : null,
      };
    } catch (err) {
      console.log('LOG HEIGHT ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to log height.',
        data: null,
      };
    }
  }

  // UC #37, #88 — fetch all height entries for history view
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  static async fetchAll(userId) {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return {
        success: Boolean(res.data?.success ?? true),
        data: rawList.map((r) => normalizeEntry(r)),
        message: res.data?.message || '',
      };
    } catch (err) {
      console.log('FETCH HEIGHT HISTORY ERROR:', err.response?.data || err.message);
      return {
        success: false, data: [],
        message: err.response?.data?.message || 'Failed to load height history.',
      };
    }
  }

  // UC #89 — update an existing height entry
  // @param  {number} entryId
  // @param  {{ heightCm }}
  // @return {Promise<{ success, field, message, data }>}
  static async update(entryId, { heightCm }) {
    const check = HeightEntry.validateHeight(heightCm);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${entryId}`, { heightCm: Number(heightCm) });
      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Height updated successfully.',
        data: res.data?.data ? normalizeEntry(res.data.data) : null,
      };
    } catch (err) {
      console.log('UPDATE HEIGHT ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to update height.',
        data: null,
      };
    }
  }
}

export default HeightEntry;
