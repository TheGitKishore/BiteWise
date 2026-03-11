// entities/goals/CalorieGoal.js
// Available to both Free and Premium users.
// Stores the user's daily calorie limit and the type of goal.

class CalorieGoal {
  constructor({
    goalId             = null,
    userId             = null,
    dailyCalorieTarget = 0,
    goalType           = '',     // 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT'
    isAutoCalculated   = false,  // true = system estimated via age/weight/height
    setAt              = null,
    updatedAt          = null,
  } = {}) {
    this.goalId             = goalId;
    this.userId             = userId;
    this.dailyCalorieTarget = dailyCalorieTarget;
    this.goalType           = goalType;
    this.isAutoCalculated   = isAutoCalculated;
    this.setAt              = setAt;
    this.updatedAt          = updatedAt;
  }
}

export { CalorieGoal };

// ---------------------------------------------------------------------------

// entities/goals/NutritionTarget.js
// Premium-only. Full macronutrient target breakdown.
// Can be auto-calculated from user body data or set manually.

class NutritionTarget {
  constructor({
    targetId             = null,
    userId               = null,
    dailyCalories        = 0,
    proteinTarget        = 0,    // g
    carbohydratesTarget  = 0,    // g
    fatTarget            = 0,    // g
    fiberTarget          = 0,    // g
    waterTarget          = 0,    // ml
    isAutoCalculated     = false,
    calculationBasis     = '',   // 'AGE_WEIGHT_HEIGHT_ACTIVITY' | 'MANUAL'
    updatedAt            = null,
  } = {}) {
    this.targetId            = targetId;
    this.userId              = userId;
    this.dailyCalories       = dailyCalories;
    this.proteinTarget       = proteinTarget;
    this.carbohydratesTarget = carbohydratesTarget;
    this.fatTarget           = fatTarget;
    this.fiberTarget         = fiberTarget;
    this.waterTarget         = waterTarget;
    this.isAutoCalculated    = isAutoCalculated;
    this.calculationBasis    = calculationBasis;
    this.updatedAt           = updatedAt;
  }
}

export { NutritionTarget };
