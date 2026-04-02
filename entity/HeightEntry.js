import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/height-entries`;

class HeightEntry {
  constructor({
    entryId  = null,
    userId   = null,
    heightCm = 0,
    notes    = '',
    loggedAt = null,
  } = {}) {
    this.entryId  = entryId;
    this.userId   = userId;
    this.heightCm = heightCm;
    this.notes    = notes;
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
    if (Number(heightCm) < 50) {
      return { valid: false, field: 'heightCm', message: 'Height must be at least 50 cm.' };
    }
    if (Number(heightCm) > 300) {
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
  // @param  {{ heightCm, notes }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, { heightCm, notes }) {
    const check = HeightEntry.validateHeight(heightCm);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, { userId, heightCm: Number(heightCm), notes: notes || '' });
      return res.data;
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
      return {
        success: true,
        data: res.data.map((r) => new HeightEntry(r)),
        message: '',
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
  // @param  {{ heightCm, notes }}
  // @return {Promise<{ success, field, message, data }>}
  static async update(entryId, { heightCm, notes }) {
    const check = HeightEntry.validateHeight(heightCm);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${entryId}`, { heightCm: Number(heightCm), notes: notes || '' });
      return res.data;
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
