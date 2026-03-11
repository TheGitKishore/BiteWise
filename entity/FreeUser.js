// entities/user/FreeUser.js
// Registered user on the Free membership plan.
// Access: food logging, calorie goal, basic meal plans, recipe browsing.

import User from './User';

class FreeUser extends User {
  constructor(data = {}) {
    super({ ...data, role: 'FREE' });
    this.calorieGoalId  = data.calorieGoalId  ?? null;
    this.foodLogIds     = data.foodLogIds     ?? [];   // FoodLog IDs per day
    this.mealPlanIds    = data.mealPlanIds    ?? [];
  }
}

export default FreeUser;
