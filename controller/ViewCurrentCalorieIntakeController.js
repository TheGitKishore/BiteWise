// Normal Flow (UC #20, #56)
//   1. Today's Progress card mounts / updates
//   2. Boundary calls getCurrentIntake()
//   3. Controller aggregates today's entries via FoodIntakeEntry.getTodaySummary()
//   4. Returns { calories, protein, carbs, fat } to boundary for display
//
// Alt Flow 1a: no entries logged today → summary returns all zeros, boundary shows empty state
// Shared by Free User (#20) and Premium User (#56)

import FoodIntakeEntry from '../entity/FoodIntakeEntry';

class ViewCurrentCalorieIntakeController {
  constructor() {}

  // UC #20, #56 — derive today's totals from in-memory entries.
  // Called on every entry log so the progress card stays live.
  // @param  {FoodIntakeEntry[]} todaysEntries
  // @return {{ calories, protein, carbs, fat }}
  getCurrentIntake(todaysEntries) {
    return FoodIntakeEntry.getTodaySummary(todaysEntries);
  }

  // UC #20, #56 — fetch today's food entries from the entity.
  // Boundaries must not import FoodIntakeEntry directly.
  // @param  {number} userId
  // @return {Promise<FoodIntakeEntry[]>}
  async fetchTodayEntries(userId) {
    try {
      return await FoodIntakeEntry.getTodayEntries(userId);
    } catch (error) {
      console.error('[ViewCurrentCalorieIntakeController]', error);
      return [];
    }
  }
}

export default ViewCurrentCalorieIntakeController;