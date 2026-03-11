// entities/food/CustomFoodItem.js
// A user-defined food item. Extends FoodItem with isCustom forced to true.
// Created via "Custom Food Creation" feature.

import FoodItem from './FoodItem';

class CustomFoodItem extends FoodItem {
  constructor(data = {}) {
    super({ ...data, isCustom: true });
    this.notes = data.notes ?? '';
  }
}

export default CustomFoodItem;
