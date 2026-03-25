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
    entryId        = null,
    userId         = null,
    exerciseType   = '',
    durationMins   = 0,
    caloriesBurned = 0,
    notes          = '',
    loggedAt       = null,
  } = {}) {
    this.entryId        = entryId;
    this.userId         = userId;
    this.exerciseType   = exerciseType;
    this.durationMins   = durationMins;
    this.caloriesBurned = caloriesBurned;
    this.notes          = notes;
    this.loggedAt       = loggedAt;
  }


  // STATIC VALIDATION METHODS

  // UC #58 — validate exercise log fields
  // @param  {{ exerciseType, durationMins }}
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateEntry({ exerciseType, durationMins }) {
    if (!exerciseType || exerciseType.trim().length === 0) {
      return { valid: false, field: 'exerciseType', message: 'Please select an exercise type.' };
    }
    if (!durationMins || isNaN(durationMins) || Number(durationMins) <= 0) {
      return { valid: false, field: 'durationMins', message: 'Please enter a valid duration.' };
    }
    if (Number(durationMins) > 600) {
      return { valid: false, field: 'durationMins', message: 'Duration cannot exceed 600 minutes.' };
    }
    return { valid: true, field: null, message: '' };
  }

  // Auto-calculate calories burned from exercise type and duration
  // @param  {string} exerciseType
  // @param  {number} durationMins
  // @return {number}
  static calculateCaloriesBurned(exerciseType, durationMins) {
    const match = EXERCISE_TYPES.find((e) => e.value === exerciseType);
    const rate  = match ? match.calPerMin : 5;
    return Math.round(rate * Number(durationMins));
  }


  // STATIC / COLLECTION METHODS

  // @param  {ExerciseEntry[]} entries
  // @return {number} total calories burned
  static getTotalCaloriesBurned(entries) {
    return entries.reduce((sum, e) => sum + e.caloriesBurned, 0);
  }


  // DATA ACCESS
  // Replace w API calls
  /*
    static async create(userId, { exerciseType, durationMins, caloriesBurned, notes }) {
      const res = await axios.post(`${API_URL}/exercise-entries`, {
        userId, exerciseType, durationMins, caloriesBurned, notes
      });
      return res.data;
    }

    static async getTodayEntries(userId) {
      const res = await axios.get(`${API_URL}/exercise-entries/today/${userId}`);
      return res.data.map((r) => new ExerciseEntry(r));
    }
  */

  // UC #58 — validate and create an exercise entry
  // @param  {number} userId
  // @param  {{ exerciseType, durationMins, caloriesBurned, notes }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, { exerciseType, durationMins, caloriesBurned, notes }) {
    const check = ExerciseEntry.validateEntry({ exerciseType, durationMins });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    const burned = caloriesBurned && Number(caloriesBurned) > 0
      ? Number(caloriesBurned)
      : ExerciseEntry.calculateCaloriesBurned(exerciseType, durationMins);

    const entry = new ExerciseEntry({
      entryId:        Date.now(),
      userId,
      exerciseType,
      durationMins:   Number(durationMins),
      caloriesBurned: burned,
      notes:          notes || '',
      loggedAt:       new Date().toISOString(),
    });

    return {
      success: true,
      field:   null,
      message: `${exerciseType} logged! ${burned} calories burned.`,
      data:    entry,
    };
  }
}

export default ExerciseEntry;