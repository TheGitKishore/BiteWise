// entities/user/PremiumUser.js
// Registered user on the Premium membership plan.
// Access: all Free features + macronutrient tracking, saved recipes,
// grocery lists, activity tracking, health diary, body metrics, reports,
// healthier alternatives, mindful snacking guide, barcode scanning,
// meal prep, personalized nutrition targets.

import User from './User';

class PremiumUser extends User {
  constructor(data = {}) {
    super({ ...data, role: 'PREMIUM' });

    // Goals
    this.calorieGoalId      = data.calorieGoalId      ?? null;
    this.nutritionTargetId  = data.nutritionTargetId  ?? null;

    // Food & Logging
    this.foodLogIds         = data.foodLogIds         ?? [];
    this.mealPlanIds        = data.mealPlanIds        ?? [];
    this.savedRecipeIds     = data.savedRecipeIds     ?? [];
    this.customRecipeIds    = data.customRecipeIds    ?? [];
    this.groceryListId      = data.groceryListId      ?? null;

    // Tracking
    this.exerciseLogIds     = data.exerciseLogIds     ?? [];
    this.healthDiaryEntryIds = data.healthDiaryEntryIds ?? [];
    this.weightEntryIds     = data.weightEntryIds     ?? [];
    this.heightEntryIds     = data.heightEntryIds     ?? [];
    this.connectedDeviceIds = data.connectedDeviceIds ?? [];

    // Physical profile (used for auto calorie/macro calculation)
    this.weight             = data.weight             ?? null; // kg
    this.height             = data.height             ?? null; // cm
    this.activityLevel      = data.activityLevel      ?? '';   // 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active'

    // Profile-specific
    this.healthConditions   = data.healthConditions   ?? []; // e.g. ['diabetes', 'hypertension']
    this.dietaryPreferences = data.dietaryPreferences ?? []; // e.g. ['vegan', 'gluten-free']
  }
}

export default PremiumUser;
