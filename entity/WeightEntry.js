import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/weight-entries`;

// Validation thresholds (easy to adjust later)
const MIN_WEIGHT_KG = 10;
const MAX_WEIGHT_KG = 500;

const normalizeEntry = (raw = {}) => new WeightEntry({
  entryId: raw.entryId ?? raw.entry_id ?? null,
  userId: raw.userId ?? raw.user_id ?? null,
  weightKg: Number(raw.weightKg ?? raw.weight_kg ?? 0),
  loggedAt: raw.loggedAt ?? raw.logged_at ?? null,
});

class WeightEntry {
  constructor({
    entryId  = null,
    userId   = null,
    weightKg = 0,
    loggedAt = null,
  } = {}) {
    this.entryId  = entryId;
    this.userId   = userId;
    this.weightKg = weightKg;
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
    if (Number(weightKg) < MIN_WEIGHT_KG) {
      return { valid: false, field: 'weightKg', message: `Weight must be at least ${MIN_WEIGHT_KG} kg.` };
    }
    if (Number(weightKg) > MAX_WEIGHT_KG) {
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
    // BMI categories (easy to adjust later)
    if (bmi === null || bmi === undefined) return '-';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25)   return 'Normal weight';
    if (bmi < 30)   return 'Overweight';
    return 'Obese';
  }

  // Compatibility alias in case any caller uses the misspelled method name.
  static calulateBMI(weightKg, heightCm) {
    return WeightEntry.calculateBMI(weightKg, heightCm);
  }


  // DATA ACCESS

  // UC #34, #84 — log a new weight entry
  // @param  {number} userId
  // @param  {{ weightKg }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, { weightKg }) {
    const check = WeightEntry.validateWeight(weightKg);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, { userId, weightKg: Number(weightKg) });
      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Weight logged successfully.',
        data: res.data?.data ? normalizeEntry(res.data.data) : null,
      };
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
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.data || []);
      return {
        success: Boolean(res.data?.success ?? true),
        data: rawList.map((r) => normalizeEntry(r)),
        message: res.data?.message || '',
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
  // @param  {{ weightKg }}
  // @return {Promise<{ success, field, message, data }>}
  static async update(entryId, { weightKg }) {
    const check = WeightEntry.validateWeight(weightKg);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.put(`${API_URL}/${entryId}`, { weightKg: Number(weightKg) });
      return {
        success: Boolean(res.data?.success),
        field: res.data?.field ?? null,
        message: res.data?.message || 'Weight updated successfully.',
        data: res.data?.data ? normalizeEntry(res.data.data) : null,
      };
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
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Entry removed.',
      };
    } catch (err) {
      console.log('DELETE WEIGHT ERROR:', err.response?.data || err.message);
      return { success: false, message: err.response?.data?.message || 'Failed to delete entry.' };
    }
  }
}

export default WeightEntry;
