// Normal Flow (UC #21, #57)
//   1. Progress card renders → boundary calls checkDailyTarget(todaysEntries, goal)
//   2. Controller compares consumed against goal and returns status
//   3. Returns { consumed, goal, remaining, percentage, status }
//
// Sprint 8:
//   - Added fetchGoal(userId) helper so boundaries can fetch the calorie goal from
//     the NutritionTargets entity (was user.dailyCalorieLimit).
//   - Fixed pre-existing bug: removed accidental recursive self-call on line ~25.
// Shared by Free User (#21) and Premium User (#57).

import FoodIntakeEntry  from '../entity/FoodIntakeEntry';
import NutritionTargets from '../entity/NutritionTargets';

class CheckDailyCalorieTargetController {
  constructor() {}

  // UC #21, #57 — compute progress vs daily calorie target.
  // Pure computation — no async, no entity calls.
  // @param  {FoodIntakeEntry[]} todaysEntries
  // @param  {number}            goal — calorie target (kcal)
  // @return {{ consumed, goal, remaining, percentage, status, message }}
  checkDailyTarget(todaysEntries, goal) {
    const { calories: consumed } = FoodIntakeEntry.getTodaySummary(todaysEntries);

    if (!goal || goal <= 0) {
      return { consumed, goal: 0, remaining: 0, percentage: 0, status: 'no_target', message: 'No daily calorie target has been set.' };
    }

    const remaining  = Math.max(0, goal - consumed);
    const percentage = Math.min(Math.round((consumed / goal) * 100), 100);

    let status = 'on_track';
    if (percentage >= 100)     status = 'exceeded';
    else if (percentage >= 85) status = 'near_limit';

    return { consumed, goal, remaining, percentage, status, message: '' };
  }

  // Sprint 8 — fetch the calorie goal from NutritionTargets (was user.dailyCalorieLimit).
  // Boundaries call this on mount / focus to get the correct goal value.
  // @param  {number} userId
  // @return {Promise<number>}
  async fetchGoal(userId) {
    try {
      const result = await NutritionTargets.fetchByUser(userId);
      return result.success ? (result.data?.calories ?? 2000) : 2000;
    } catch {
      return 2000;
    }
  }
}

export default CheckDailyCalorieTargetController;
