// DeleteExerciseLogController.js — Sprint 11 New BCE: Delete Exercise Log
//
// Normal Flow:
//   1. User taps 🗑️ Delete on an exercise log row in ActivityTrackingScreen
//   2. Alert.alert confirm shown
//   3. On confirm → boundary calls deleteExercise(entryId)
//   4. Controller delegates to ExerciseEntry.delete()
//   5. Returns { success, message } → boundary removes row + shows banner
//
// Alt Flow: user cancels confirm → no action
// Premium User (activity tracking)

import ExerciseEntry from '../entity/ExerciseEntry';

class DeleteExerciseLogController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[DeleteExerciseLogController]', e); return { success: false, message: 'Unable to delete exercise log.' }; }
  }

  // @param  {string|number} entryId
  // @return {Promise<{ success, message }>}
  async deleteExercise(entryId) {
    return this._safe(async () => {
      if (!entryId) return { success: false, message: 'Invalid exercise log.' };
      return ExerciseEntry.delete(entryId);
    });
  }
}

export default DeleteExerciseLogController;
