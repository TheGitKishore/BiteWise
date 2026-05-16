// EditExerciseLogController.js — Sprint 11 New BCE: Edit Exercise Log
//
// Normal Flow:
//   1. User taps Edit on an exercise log row in ActivityTrackingScreen
//   2. Edit modal pre-fills all fields
//   3. User saves → boundary calls updateExercise(entryId, fields)
//   4. Controller delegates to ExerciseEntry.update()
//   5. Returns { success, message, data } → boundary updates row + shows banner
//
// Alt Flow: exerciseType empty or duration ≤ 0 → { success: false, message }
// Premium User (activity tracking)

import ExerciseEntry from '../entity/ExerciseEntry';

class EditExerciseLogController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[EditExerciseLogController]', e); return { success: false, message: 'Unable to update exercise log.', data: null }; }
  }

  // @param  {string|number} entryId
  // @param  {{ exerciseType, durationMins, caloriesBurned, notes }} fields
  // @return {Promise<{ success, message, data }>}
  async updateExercise(entryId, { exerciseType, durationMins, caloriesBurned, notes }) {
    return this._safe(async () => {
      if (!entryId) return { success: false, message: 'Invalid exercise log.', data: null };
      return ExerciseEntry.update(entryId, { exerciseType, durationMins, caloriesBurned, notes });
    });
  }
}

export default EditExerciseLogController;
