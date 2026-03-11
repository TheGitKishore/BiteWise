// entities/food/FoodItem.js
// A food item in the database. Can be a system-curated entry or user-created.
// Used when logging via the Food Database screen or manual entry.

import Macronutrients from './Macronutrients';

class FoodItem {
  constructor({
    foodItemId      = null,
    name            = '',
    brand           = '',
    servingSize     = 0,           // numeric amount
    servingUnit     = 'g',         // 'g' | 'ml' | 'oz' | 'cup'
    macronutrients  = new Macronutrients(),
    isCustom        = false,
    createdByUserId = null,        // null = system entry
    barcode         = null,        // Premium: barcode scanning
    imageUrl        = null,
    category        = '',          // 'protein' | 'carbs' | 'dairy' | 'fruit' | 'vegetable' etc.
  } = {}) {
    this.foodItemId      = foodItemId;
    this.name            = name;
    this.brand           = brand;
    this.servingSize     = servingSize;
    this.servingUnit     = servingUnit;
    this.macronutrients  = macronutrients;
    this.isCustom        = isCustom;
    this.createdByUserId = createdByUserId;
    this.barcode         = barcode;
    this.imageUrl        = imageUrl;
    this.category        = category;
  }
}

export default FoodItem;
