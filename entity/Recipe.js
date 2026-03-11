// entities/recipe/RecipeIngredient.js
// One ingredient line inside a Recipe or CustomRecipe.

import Macronutrients from '../food/Macronutrients';

class RecipeIngredient {
  constructor({
    ingredientId   = null,
    recipeId       = null,
    foodItemId     = null,
    name           = '',
    quantity       = 0,
    unit           = 'g',
    macronutrients = new Macronutrients(), // contribution of this ingredient
  } = {}) {
    this.ingredientId   = ingredientId;
    this.recipeId       = recipeId;
    this.foodItemId     = foodItemId;
    this.name           = name;
    this.quantity       = quantity;
    this.unit           = unit;
    this.macronutrients = macronutrients;
  }
}

export { RecipeIngredient };

// ---------------------------------------------------------------------------

// entities/recipe/Recipe.js
// A recipe browsable by all registered users. Curator-published or system-added.

class Recipe {
  constructor({
    recipeId           = null,
    title              = '',
    description        = '',
    imageUrl           = null,
    servings           = 1,
    prepTimeMinutes    = 0,
    cookTimeMinutes    = 0,
    ingredients        = [],     // RecipeIngredient[]
    instructions       = [],     // string[]
    totalMacronutrients = new Macronutrients(),
    dietaryTags        = [],     // 'vegan' | 'gluten-free' | 'keto' | 'high-protein' etc.
    mealType           = '',     // 'breakfast' | 'lunch' | 'dinner' | 'snack'
    difficultyLevel    = '',     // 'easy' | 'medium' | 'hard'
    isPublished        = true,
    createdByUserId    = null,   // null = system recipe; Curator's userId otherwise
    createdAt          = null,
  } = {}) {
    this.recipeId            = recipeId;
    this.title               = title;
    this.description         = description;
    this.imageUrl            = imageUrl;
    this.servings            = servings;
    this.prepTimeMinutes     = prepTimeMinutes;
    this.cookTimeMinutes     = cookTimeMinutes;
    this.ingredients         = ingredients;
    this.instructions        = instructions;
    this.totalMacronutrients = totalMacronutrients;
    this.dietaryTags         = dietaryTags;
    this.mealType            = mealType;
    this.difficultyLevel     = difficultyLevel;
    this.isPublished         = isPublished;
    this.createdByUserId     = createdByUserId;
    this.createdAt           = createdAt;
  }
}

export { Recipe };

// ---------------------------------------------------------------------------

// entities/recipe/CustomRecipe.js
// User-created recipe (Premium). Private by default (isPublished = false).
// Curators can optionally publish theirs.

class CustomRecipe extends Recipe {
  constructor(data = {}) {
    super({ ...data, isPublished: data.isPublished ?? false });
    this.isCustom = true;
    this.notes    = data.notes ?? '';
  }
}

export { CustomRecipe };

// ---------------------------------------------------------------------------

// entities/recipe/SavedRecipe.js
// A bookmark relationship — Premium user saves a Recipe to their library.

class SavedRecipe {
  constructor({
    savedRecipeId = null,
    userId        = null,
    recipeId      = null,
    savedAt       = null,
    notes         = '',
  } = {}) {
    this.savedRecipeId = savedRecipeId;
    this.userId        = userId;
    this.recipeId      = recipeId;
    this.savedAt       = savedAt;
    this.notes         = notes;
  }
}

export { SavedRecipe };
