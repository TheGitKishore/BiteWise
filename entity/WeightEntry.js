import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/weight-entries`;

class WeightEntry {
  constructor({
    entryId  = null,
    userId   = null,
    weightKg = 0,
    notes    = '',
    loggedAt = null,
  } = {}) {
    this.entryId  = entryId;
    this.userId   = userId;
    this.weightKg = weightKg;
    this.notes    = notes;
    this.loggedAt = loggedAt;
  }


  // STATIC VALIDATION METHODS

  // UC #34, #84, #86 — validate weight input
  // @param  {number} weightKg
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateWeight(weightKg) {
    if (!weightKg || isNaN(weightKg) || Number(weightKg) <= 0) {
      return { valid: false, field: 'weightKg', message: 'Please enter a valid weight.' };
    }
    if (Number(weightKg) < 10) {
      return { valid: false, field: 'weightKg', message: 'Weight must be at least 10 kg.' };
    }
    if (Number(weightKg) > 500) {
      return { valid: false, field: 'weightKg', message: 'Please enter a valid weight.' };
    }
    return { valid: true, field: null, message: '' };
  }


  // STATIC / COLLECTION METHODS

  // Returns the most recent weight entry
  // @param  {WeightEntry[]} entries
  // @return {WeightEntry|null}
  static getLatest(entries) {
    if (!entries || entries.length === 0) return null;
    return entries.reduce((latest, e) =>
      new Date(e.loggedAt) > new Date(latest.loggedAt) ? e : latest
    );
  }

  // Total change from first to most recent entry
  // @param  {WeightEntry[]} entries
  // @return {number}
  static getTotalChange(entries) {
    if (!entries || entries.length < 2) return 0;
    const sorted = [...entries].sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt));
    return Math.round((sorted[sorted.length - 1].weightKg - sorted[0].weightKg) * 10) / 10;
  }

  // BMI calculation helper
  // @param  {number} weightKg
  // @param  {number} heightCm
  // @return {number|null}
  static calculateBMI(weightKg, heightCm) {
    if (!weightKg || !heightCm || heightCm <= 0) return null;
    const heightM = heightCm / 100;
    return Math.round((weightKg / (heightM * heightM)) * 10) / 10;
  }

  // @param  {number} bmi
  // @return {string}
  static getBMICategory(bmi) {
    if (!bmi)      return 'Unknown';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal weight';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }


  // DATA ACCESS

  // UC #34, #84 — log a new weight entry
  // @param  {number} userId
  // @param  {{ weightKg, notes }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, { weightKg, notes }) {
    const check = WeightEntry.validateWeight(weightKg);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, { userId, weightKg: Number(weightKg), notes: notes || '' });
      return res.data;
    } catch (err) {
      console.log('LOG WEIGHT ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to log weight.',
        data: null,
      };
    }
  }

  // UC #35, #85 — fetch all weight entries for history view
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  static async fetchAll(userId) {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      return {
        success: true,
        data: res.data.map((r) => new WeightEntry(r)),
        message: '',
      };
    } catch (err) {
      console.log('FETCH WEIGHT HISTORY ERROR:', err.response?.data || err.message);
      return {
        success: false, data: [],
        message: err.response?.data?.message || 'Failed to load weight history.',
      };
    }
  }

  // UC #86 — update an existing weight entry
  // @param  {number} entryId
  // @param  {{ weightKg, notes }}
  // @return {Promise<{ success, field, message, data }>}
  static async update(entryId, { weightKg, notes }) {
    const check = WeightEntry.validateWeight(weightKg);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${entryId}`, { weightKg: Number(weightKg), notes: notes || '' });
      return res.data;
    } catch (err) {
      console.log('UPDATE WEIGHT ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to update weight.',
        data: null,
      };
    }
  }

  // UC #84 — delete a weight entry
  // @param  {number} entryId
  // @return {Promise<{ success, message }>}
  static async delete(entryId) {
    try {
      const res = await axios.delete(`${API_URL}/${entryId}`);
      return res.data;
    } catch (err) {
      console.log('DELETE WEIGHT ERROR:', err.response?.data || err.message);
      return { success: false, message: err.response?.data?.message || 'Failed to delete entry.' };
    }
  }
}

export default WeightEntry;
