// Exercise types with their estimated cal/min burn rate
import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/exercise-entries`;

// Exercise types with their estimated cal/min burn rate
export const EXERCISE_TYPES = [
  { label: 'Running (~10 cal/min)',     value: 'Running',     calPerMin: 10 },
  { label: 'Cycling (~8 cal/min)',      value: 'Cycling',     calPerMin: 8  },
  { label: 'Swimming (~7 cal/min)',     value: 'Swimming',    calPerMin: 7  },
  { label: 'Weight Training (~5 cal/min)', value: 'Weight Training', calPerMin: 5 },
  { label: 'Walking (~4 cal/min)',      value: 'Walking',     calPerMin: 4  },
  { label: 'HIIT (~12 cal/min)',        value: 'HIIT',        calPerMin: 12 },
  { label: 'Yoga (~3 cal/min)',         value: 'Yoga',        calPerMin: 3  },
  { label: 'Other',                     value: 'Other',       calPerMin: 5  },
];

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

  // CALORIES CALC
  static calculateCaloriesBurned(exerciseType, durationMins) {
    const match = EXERCISE_TYPES.find(e => e.value === exerciseType);
    const rate = match ? match.calPerMin : 5;
    return Math.round(rate * Number(durationMins));
  }

  // CREATE ENTRY (CALL BACKEND → MYSQL)
  static async create(userId, { exerciseType, durationMins, notes }) {
    const check = ExerciseEntry.validateEntry({ exerciseType, durationMins });

    if (!check.valid) {
      return { success: false, field: check.field, message: check.message };
    }

    try {
      const res = await axios.post(`${API_URL}`, {
        userId,
        exerciseType,
        durationMins: Number(durationMins),
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
}

  // ── SPRINT 11 ADDITIONS ───────────────────────────────────────────────────────

  // Edit exercise log — seeded stub, no axios.
  // @param  {string|number} entryId
  // @param  {{ exerciseType, durationMins, caloriesBurned, notes }} fields
  // @return {Promise<{ success, message, data }>}
  static async update(entryId, { exerciseType, durationMins, caloriesBurned, notes }) {
    if (!exerciseType?.trim()) return { success: false, message: 'Exercise type is required.', data: null };
    if (!durationMins || Number(durationMins) <= 0) return { success: false, message: 'Duration must be greater than 0.', data: null };
    return {
      success: true,
      message: 'Exercise log updated successfully!',
      data: {
        entryId,
        exerciseType: exerciseType.trim(),
        durationMins: Number(durationMins),
        caloriesBurned: Number(caloriesBurned) || 0,
        notes: notes || '',
        updatedAt: new Date().toISOString(),
      },
    };
  }

  // Delete exercise log — seeded stub, no axios.
  // @param  {string|number} entryId
  // @return {Promise<{ success, message }>}
  static async delete(entryId) {
    return { success: true, message: 'Exercise log deleted successfully!' };
  }

  // ─────────────────────────────────────────────────────────────────────────────

export default ExerciseEntry;