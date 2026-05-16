// Normal Flow (UC #19, #55)
//   1. User taps History tab
//   2. Boundary calls fetchPastEntries()
//   3. Controller delegates to FoodIntakeEntry.getPastEntries()
//   4. Returns past entries list to boundary for display
//
// Alt Flow 1a: no past entries → { success: false, message }
// Shared by Free User (#19) and Premium User (#55)

import FoodIntakeEntry from '../entity/FoodIntakeEntry';

class ViewPastCalorieEntriesController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewPastCalorieEntriesController]', error);
      return { success: false, data: [], message: 'Unable to load past entries. Please try again.' };
    }
  }

  // UC #19, #55
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  async fetchPastEntries(userId) {
    return this._safeCall(async () => {
      const data = await FoodIntakeEntry.getPastEntries(userId);

      // ✅ Now data is already an array
      if (!data || data.length === 0) {
        return {
          success: false,
          data: [],
          message: 'No past calorie entries available.',
        };
      }

      return {
        success: true,
        data: data,
      };
    });
  }
}
export default ViewPastCalorieEntriesController;