// Normal Flow (UC #58)
//   1. User opens Log Exercise modal
//   2. User selects exercise type, duration, optional calories + notes
//   3. Boundary calls logExercise()
//   4. Controller delegates to ExerciseEntry.create()
//   5. Entity auto-calculates calories if left blank
//   6. Returns entry → boundary closes modal, shows success banner
//
// Alt Flow 1a: invalid input → { success: false, field, message }
// Premium User only (#58)

import ExerciseEntry from '../entity/ExerciseEntry';

class LogExerciseController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[LogExerciseController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #58
  // @param  {number} userId
  // @param  {{ exerciseType, durationMins, caloriesBurned, notes }}
  // @return {Promise<{ success, field, message, data }>}
  async logExercise(userId, fields) {
    return this._safeCall(async () => {
      return await ExerciseEntry.create(userId, fields);
    });
  }
}

export default LogExerciseController;