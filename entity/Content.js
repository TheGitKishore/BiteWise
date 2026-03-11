// ============================================================
// entities/content/  — Premium educational content
// ============================================================

// ---------------------------------------------------------------------------
// HealthierAlternative.js
// Surfaced in the "Healthier Food Alternatives" Premium feature.
// Suggests a swap for a food item the user has logged or is browsing.

class HealthierAlternative {
  constructor({
    alternativeId        = null,
    originalFoodItemId   = null,
    originalFoodName     = '',
    alternativeFoodItemId = null,
    alternativeFoodName  = '',
    reason               = '',     // plain-text explanation of why it's healthier
    calorieReduction     = 0,      // kcal difference (positive = fewer calories)
    macroComparison      = {},     // { protein: +5, fat: -8, carbs: -10, ... }
  } = {}) {
    this.alternativeId         = alternativeId;
    this.originalFoodItemId    = originalFoodItemId;
    this.originalFoodName      = originalFoodName;
    this.alternativeFoodItemId = alternativeFoodItemId;
    this.alternativeFoodName   = alternativeFoodName;
    this.reason                = reason;
    this.calorieReduction      = calorieReduction;
    this.macroComparison       = macroComparison;
  }
}

export { HealthierAlternative };

// ---------------------------------------------------------------------------
// SnackingTip.js
// Content cards displayed in the "Mindful Snacking Guide" (Premium).
// Filtered by user's profileType.

class SnackingTip {
  constructor({
    tipId        = null,
    title        = '',
    content      = '',
    category     = '',    // 'portion_control' | 'timing' | 'alternatives' | 'habits'
    profileTypes = [],    // USER_PROFILE_TYPES[] — which profiles see this tip
    tags         = [],
    imageUrl     = null,
    isActive     = true,
  } = {}) {
    this.tipId        = tipId;
    this.title        = title;
    this.content      = content;
    this.category     = category;
    this.profileTypes = profileTypes;
    this.tags         = tags;
    this.imageUrl     = imageUrl;
    this.isActive     = isActive;
  }
}

export { SnackingTip };
