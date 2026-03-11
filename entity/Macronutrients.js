// entities/food/Macronutrients.js
// Value object — represents the nutritional breakdown of a food item,
// log entry, recipe, or daily total. Reused across all food-related entities.

class Macronutrients {
  constructor({
    calories      = 0,   // kcal
    protein       = 0,   // g
    carbohydrates = 0,   // g
    fat           = 0,   // g
    fiber         = 0,   // g
    sugar         = 0,   // g
    sodium        = 0,   // mg
  } = {}) {
    this.calories      = calories;
    this.protein       = protein;
    this.carbohydrates = carbohydrates;
    this.fat           = fat;
    this.fiber         = fiber;
    this.sugar         = sugar;
    this.sodium        = sodium;
  }
}

export default Macronutrients;
