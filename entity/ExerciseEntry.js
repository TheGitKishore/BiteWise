import axios from 'axios'; 
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/exercise-entries`;

class ExerciseEntry {
  constructor({
    entryId = null,
    userId = null,
    exerciseType = '',
    durationMins = 0,
    caloriesBurned = 0,
    notes = '',
    loggedAt = null,
  } = {}) {
    Object.assign(this, {
      entryId,
      userId,
      exerciseType,
      durationMins,
      caloriesBurned,
      notes,
      loggedAt,
    });
  }

  // VALIDATION
  static validateEntry({ exerciseType, durationMins }) {
    if (!exerciseType?.trim()) {
      return { valid: false, field: 'exerciseType', message: 'Please select an exercise type.' };
    }

    if (!durationMins || isNaN(durationMins) || Number(durationMins) <= 0) {
      return { valid: false, field: 'durationMins', message: 'Please enter a valid duration.' };
    }

    if (Number(durationMins) > 600) {
      return { valid: false, field: 'durationMins', message: 'Duration cannot exceed 600 minutes.' };
    }

    return { valid: true };
  }

  static calculateCaloriesBurned(exerciseType, durationMins, exerciseTypes = []) {
    const selectedType = exerciseTypes.find((t) => t.value === exerciseType);
    const rate = Number(selectedType?.calPerMin ?? 0);
    return Math.round(rate * Number(durationMins || 0));
  }

  static async getExerciseTypes() {
    try {
      const res = await axios.get(`${API_URL}/types`);
      const data = Array.isArray(res.data?.data) ? res.data.data : res.data;
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error(
        'Failed to fetch exercise types',
        err.response?.status,
        err.response?.data || err.message
      );
      return [];
    }
  }

  // CREATE ENTRY (CALL BACKEND → MYSQL)
  static async create(userId, { exerciseType, durationMins, caloriesBurned, notes }) {
    const check = ExerciseEntry.validateEntry({ exerciseType, durationMins });

    if (!check.valid) {
      return { success: false, field: check.field, message: check.message };
    }

    try {
      const res = await axios.post(`${API_URL}`, {
        userId,
        exerciseType,
        durationMins: Number(durationMins),
        caloriesBurned: caloriesBurned ? Number(caloriesBurned) : undefined,
        notes: notes || '',
      });

      return res.data;

    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Server error',
      };
    }
  }

  // GET TODAY ENTRIES
  static async getTodayEntries(userId) {
    const res = await axios.get(`${API_URL}/today/${userId}`);
    return res.data.map(e => new ExerciseEntry(e));
  }

  // TOTAL CALORIES
  static getTotalCaloriesBurned(entries) {
    return entries.reduce((sum, e) => sum + e.caloriesBurned, 0);
  }

  // ── SPRINT 11 ADDITIONS ───────────────────────────────────────────────────────

  // Edit exercise log — seeded stub, no axios.
  // @param  {string|number} entryId
  // @param  {{ exerciseType, durationMins, caloriesBurned, notes }} fields
  // @return {Promise<{ success, message, data }>}
  static async update(entryId, { exerciseType, durationMins, caloriesBurned, notes }) {
    if (!exerciseType?.trim()) return { success: false, message: 'Exercise type is required.', data: null };
    if (!durationMins || Number(durationMins) <= 0) return { success: false, message: 'Duration must be greater than 0.', data: null };

    try {
      const res = await axios.put(`${API_URL}/${entryId}`, {
        exerciseType: exerciseType.trim(),
        durationMins: Number(durationMins),
        caloriesBurned:
          caloriesBurned !== ''
            ? Number(caloriesBurned)
            : undefined,
        notes: notes || '',
      });
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Server error',
        data: null,
      };
    }
  }

  // Delete exercise log — seeded stub, no axios.
  // @param  {string|number} entryId
  // @return {Promise<{ success, message }>}
  static async delete(entryId) {
    try {
      const res = await axios.delete(`${API_URL}/${entryId}`);
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Server error',
      };
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────

}

export default ExerciseEntry;
