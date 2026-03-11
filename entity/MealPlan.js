// entities/mealplan/MealPlanEntry.js
// One slot in a MealPlan — a recipe assigned to a meal type on a given day.

import Macronutrients from '../food/Macronutrients';

class MealPlanEntry {
  constructor({
    entryId        = null,
    mealPlanId     = null,
    recipeId       = null,
    recipeName     = '',              // snapshot at plan creation
    dayOfWeek      = '',              // 'Monday' ... 'Sunday'
    mealType       = '',              // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    servings       = 1,
    macronutrients = new Macronutrients(),
  } = {}) {
    this.entryId        = entryId;
    this.mealPlanId     = mealPlanId;
    this.recipeId       = recipeId;
    this.recipeName     = recipeName;
    this.dayOfWeek      = dayOfWeek;
    this.mealType       = mealType;
    this.servings       = servings;
    this.macronutrients = macronutrients;
  }
}

export { MealPlanEntry };

// ---------------------------------------------------------------------------

// entities/mealplan/MealPlan.js
// A weekly meal plan. Can be manually created by the user or AI-generated.
// Available to both Free (basic) and Premium (AI-generated, personalized) users.

class MealPlan {
  constructor({
    mealPlanId   = null,
    userId       = null,
    title        = '',
    description  = '',
    startDate    = null,
    endDate      = null,
    entries      = [],            // MealPlanEntry[]
    isAIGenerated = false,
    goalType     = '',            // 'LOSE_WEIGHT' | 'MAINTAIN' | 'GAIN_WEIGHT' | 'PERFORMANCE'
    createdAt    = null,
    updatedAt    = null,
  } = {}) {
    this.mealPlanId    = mealPlanId;
    this.userId        = userId;
    this.title         = title;
    this.description   = description;
    this.startDate     = startDate;
    this.endDate       = endDate;
    this.entries       = entries;
    this.isAIGenerated = isAIGenerated;
    this.goalType      = goalType;
    this.createdAt     = createdAt;
    this.updatedAt     = updatedAt;
  }
}

export { MealPlan };
