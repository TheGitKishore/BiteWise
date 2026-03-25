// Normal Flow (UC #21, #57)
//   1. User views Today's Progress card
//   2. Boundary calls checkDailyTarget()
//   3. Controller compares consumed against goal
//   4. Returns { consumed, goal, remaining, status } to boundary
//
// Alt Flow 1a: no daily target set → status: 'no_target'
// Shared by Free User (#21) and Premium User (#57)

import FoodIntakeEntry from '../entity/FoodIntakeEntry';

class CheckDailyCalorieTargetController {
  constructor() {}

  // UC #21, #57
  // @param  {FoodIntakeEntry[]} todaysEntries
  // @param  {number}            goal
  // @return {{ consumed, goal, remaining, percentage, status }}
  checkDailyTarget(todaysEntries, goal) {
    const { calories: consumed } = FoodIntakeEntry.getTodaySummary(todaysEntries);

    // Alt Flow 1a: no goal set
    if (!goal || goal <= 0) {
      return {
        consumed,
        goal:       0,
        remaining:  0,
        percentage: 0,
        status:     'no_target',
        message:    'No daily calorie target has been set.',
      };
    }

    const remaining  = Math.max(0, goal - consumed);
    const percentage = Math.min(Math.round((consumed / goal) * 100), 100);

    let status = 'on_track';
    if (percentage >= 100)     status = 'exceeded';
    else if (percentage >= 85) status = 'near_limit';

    return { consumed, goal, remaining, percentage, status, message: '' };
  }
}

export default CheckDailyCalorieTargetController;