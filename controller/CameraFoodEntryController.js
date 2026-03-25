// Normal Flow (UC #17, #52)
//   1. User opens Camera Capture modal
//   2. User taps "Capture & Recognize Food"
//   3. Boundary calls recogniseFood() → system identifies food
//   4. Confirmation modal shown with detected food + meal picker
//   5. User confirms → boundary calls logCameraEntry()
//   6. Returns success → boundary closes modal, shows banner
//
// Alt Flow 1a: food not recognised → { success: false, message }
//   → boundary prompts user to enter manually
// Shared by Free User (#17) and Premium User (#52)

import FoodIntakeEntry from '../entity/FoodIntakeEntry';

class CameraFoodEntryController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[CameraFoodEntryController]', error);
      return { success: false, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #17, #52 Step 2-3 — simulate capture and recognition
  // @return {Promise<{ success, data, message }>}
  async recogniseFood() {
    return this._safeCall(async () => {
      return await FoodIntakeEntry.recogniseFromCamera();
    });
  }

  // UC #17, #52 Step 5 — log the confirmed entry
  // @param  {number} userId
  // @param  {{ foodName, calories, protein, carbs, fat, meal }}
  // @return {Promise<{ success, field, message, data }>}
  async logCameraEntry(userId, fields) {
    return this._safeCall(async () => {
      return await FoodIntakeEntry.createFromCamera(userId, fields);
    });
  }
}

export default CameraFoodEntryController;