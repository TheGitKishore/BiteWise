// Normal Flow (Auto-Calculate Nutrition Targets — Premium users only)
//   1. User selects Activity Level and Goal in EditTargetsModal
//   2. User taps "⚡ Auto-Calculate Based on Profile"
//   3. Boundary calls computeTargets(userProfile, activityLevel, goal)
//   4. Controller delegates to NutritionTargets.computeTargets() (Mifflin-St Jeor BMR)
//   5. Returns { calories, protein, carbs, fat, fiber } → boundary pre-fills inputs
//   6. User may adjust values before tapping "Save Targets"
//
// Note: auto-calculation only COMPUTES values — it does NOT save.
//       EditNutritionTargetsController.saveTargets() must be called to persist.
// Premium User only.

import NutritionTargets, { ACTIVITY_LEVELS, GOALS } from '../entity/NutritionTargets';

class AutoCalculateNutritionController {
  constructor() {}

  // Get activity level options for the dropdown.
  // @return {string[]}
  getActivityLevels() {
    return ACTIVITY_LEVELS;
  }

  // Get goal options for the dropdown.
  // @return {string[]}
  getGoals() {
    return GOALS;
  }

  // Compute nutrition targets from user profile data (BMR formula).
  // Reads weight, height, age and gender from the user object.
  // @param  {User}   user          — must have weightKg, heightCm, age, gender
  // @param  {string} activityLevel — from ACTIVITY_LEVELS
  // @param  {string} goal          — from GOALS
  // @return {{ calories, protein, carbs, fat, fiber }}
  computeTargets(user, activityLevel, goal) {
    return NutritionTargets.computeTargets({
      weightKg:      user?.weightKg  ?? 70,
      heightCm:      user?.heightCm  ?? 170,
      age:           user?.age       ?? 25,
      gender:        user?.gender    ?? 'male',
      activityLevel,
      goal,
    });
  }
}

export default AutoCalculateNutritionController;
