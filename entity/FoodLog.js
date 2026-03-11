// entities/food/FoodLogEntry.js
// A single food item logged within a FoodLog.
// Stores a snapshot of macros at time of logging so edits to
// the source FoodItem don't retroactively change past records.

import Macronutrients from './Macronutrients';

class FoodLogEntry {
  constructor({
    entryId        = null,
    foodLogId      = null,
    foodItemId     = null,
    foodItemName   = '',              // snapshot
    quantity       = 1,
    servingSize    = 0,
    macronutrients = new Macronutrients(), // snapshot at log time
    mealType       = '',              // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    logMethod      = 'MANUAL',        // 'MANUAL' | 'CAMERA' | 'DATABASE' | 'BARCODE'
    imageUrl       = null,            // set when logged via camera
    notes          = '',
    loggedAt       = null,
  } = {}) {
    this.entryId        = entryId;
    this.foodLogId      = foodLogId;
    this.foodItemId     = foodItemId;
    this.foodItemName   = foodItemName;
    this.quantity       = quantity;
    this.servingSize    = servingSize;
    this.macronutrients = macronutrients;
    this.mealType       = mealType;
    this.logMethod      = logMethod;
    this.imageUrl       = imageUrl;
    this.notes          = notes;
    this.loggedAt       = loggedAt;
  }
}

export { FoodLogEntry };

// ---------------------------------------------------------------------------

// entities/food/FoodLog.js
// One daily food log per user. Aggregates all FoodLogEntries for that day.
// The running totalCalories / totalMacronutrients are recalculated by
// the Controller whenever an entry is added / updated / removed.

class FoodLog {
  constructor({
    foodLogId              = null,
    userId                 = null,
    date                   = null,   // ISO date string 'YYYY-MM-DD'
    entries                = [],     // FoodLogEntry[]
    totalCalories          = 0,
    totalMacronutrients    = new Macronutrients(),
  } = {}) {
    this.foodLogId           = foodLogId;
    this.userId              = userId;
    this.date                = date;
    this.entries             = entries;
    this.totalCalories       = totalCalories;
    this.totalMacronutrients = totalMacronutrients;
  }
}

export { FoodLog };
