// Normal Flow (UC #16, #51)
//   1. User opens Manual Entry modal
//   2. User fills in food name, calories, macros, meal
//   3. Boundary calls createManualEntry()
//   4. Controller delegates to FoodIntakeEntry.createManual()
//   5. Returns success → boundary closes modal, shows banner
//
// Alt Flow 1a: invalid input → { success: false, field, message }
// Shared by Free User (#16) and Premium User (#51)

import FoodIntakeEntry from '../entity/FoodIntakeEntry';

class CreateManualFoodEntryController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[CreateManualFoodEntryController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #16, #51
  // @param  {number} userId
  // @param  {{ foodName, calories, protein, carbs, fat, meal }}
  // @return {Promise<{ success, field, message, data }>}
  async createManualEntry(userId, fields) {
    return this._safeCall(async () => {
      return await FoodIntakeEntry.createManual(userId, fields);
    });
  }
}

export default CreateManualFoodEntryController;