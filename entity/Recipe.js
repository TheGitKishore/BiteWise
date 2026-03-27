class Recipe {
  constructor({
    recipeId        = null,
    title           = '',
    description     = '',
    prepTimeMins    = 0,
    calories        = 0,
    protein         = 0,      // g
    carbs           = 0,      // g
    fat             = 0,      // g
    servings        = 1,
    difficulty      = 'Easy', // 'Easy' | 'Medium' | 'Hard'
    ingredients     = [],     // string[]
    instructions    = [],     // string[]
    tags            = [],     // string[] e.g. ['high-protein', 'vegetarian']
    isCurated       = false,  // curator-created (Premium exclusive browse)
    isMealPrep      = false,  // UC #66 — meal-prep suitable
    imageUrl        = null,
    createdByUserId = null,
    createdAt       = null,
  } = {}) {
    this.recipeId        = recipeId;
    this.title           = title;
    this.description     = description;
    this.prepTimeMins    = prepTimeMins;
    this.calories        = calories;
    this.protein         = protein;
    this.carbs           = carbs;
    this.fat             = fat;
    this.servings        = servings;
    this.difficulty      = difficulty;
    this.ingredients     = ingredients;
    this.instructions    = instructions;
    this.tags            = tags;
    this.isCurated       = isCurated;
    this.isMealPrep      = isMealPrep;
    this.imageUrl        = imageUrl;
    this.createdByUserId = createdByUserId;
    this.createdAt       = createdAt;
  }

  // Returns "20 min  •  350 kcal" summary line
  getSummaryLine() {
    return `${this.prepTimeMins} min  •  ${this.calories} kcal`;
  }


  // STATIC VALIDATION METHODS

  // UC #27, #70 — validate custom recipe fields
  // @param  {{ title, ingredients, instructions }}
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateRecipe({ title, ingredients, instructions }) {
    if (!title || title.trim().length === 0) {
      return { valid: false, field: 'title', message: 'Recipe name is required.' };
    }
    if (!ingredients || ingredients.filter((i) => i.trim()).length === 0) {
      return { valid: false, field: 'ingredients', message: 'At least one ingredient is required.' };
    }
    if (!instructions || instructions.filter((i) => i.trim()).length === 0) {
      return { valid: false, field: 'instructions', message: 'At least one instruction step is required.' };
    }
    return { valid: true, field: null, message: '' };
  }


  // STATIC / COLLECTION METHODS

  // UC #23 — client-side search filter (title or ingredients)
  // @param  {Recipe[]} recipes
  // @param  {string}   query
  // @return {Recipe[]}
  static filterBySearch(recipes, query) {
    if (!query || query.trim().length === 0) return recipes;
    const lower = query.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.ingredients.some((ing) => ing.toLowerCase().includes(lower))
    );
  }

  // UC #23, #64, #68 — client-side filter by dietary tag
  // @param  {Recipe[]} recipes
  // @param  {string}   tag
  // @return {Recipe[]}
  static filterByTag(recipes, tag) {
    if (!tag || tag === 'All') return recipes;
    return recipes.filter((r) => r.tags.includes(tag.toLowerCase()));
  }

  // UC #66 — client-side filter for meal-prep suitable recipes
  // @param  {Recipe[]} recipes
  // @return {Recipe[]}
  static filterMealPrep(recipes) {
    return recipes.filter((r) => r.isMealPrep);
  }

  // UC #63 — client-side filter for curated recipes only
  // @param  {Recipe[]} recipes
  // @return {Recipe[]}
  static filterCurated(recipes) {
    return recipes.filter((r) => r.isCurated);
  }

  // UC #68 — client-side filter by max prep time
  // @param  {Recipe[]} recipes
  // @param  {number}   maxMins
  // @return {Recipe[]}
  static filterByPrepTime(recipes, maxMins) {
    if (!maxMins) return recipes;
    return recipes.filter((r) => r.prepTimeMins <= maxMins);
  }

  // @param  {Recipe[]} recipes
  // @return {boolean}
  static hasRecipes(recipes) {
    return recipes.length > 0;
  }


  // DATA ACCESS
  // Replace w API calls
  /*
    static async fetchAll() {
      const res = await axios.get(`${API_URL}/recipes`);
      return res.data.map((r) => new Recipe(r));
    }

    static async create(userId, fields) {
      const res = await axios.post(`${API_URL}/recipes`, { userId, ...fields });
      return res.data;
    }

    static async saveRecipe(userId, recipe) {
      const res = await axios.post(`${API_URL}/recipes/save`, { userId, recipeId: recipe.recipeId });
      return res.data;
    }

    static async fetchSaved(userId) {
      const res = await axios.get(`${API_URL}/recipes/saved/${userId}`);
      return res.data.map((r) => new Recipe(r));
    }
  */

  // UC #22, #61 — fetch all recipes
  // @return {Promise<{ success, data, message }>}
  static async fetchAll() {
    const raw = [
      {
        recipeId: 1, title: 'Grilled Chicken Salad', prepTimeMins: 20,
        calories: 350, protein: 35, carbs: 25, fat: 12, servings: 1,
        difficulty: 'Easy', isCurated: true, isMealPrep: false,
        imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
        tags: ['high-protein', 'low-carb', 'gluten-free'],
        ingredients: ['200g grilled chicken breast', 'Mixed greens', 'Cherry tomatoes', 'Cucumber', 'Light vinaigrette'],
        instructions: [
          'Season chicken breast with salt, pepper, and herbs.',
          'Grill chicken over medium-high heat for 6-7 minutes per side until cooked through.',
          'Let chicken rest for 5 minutes, then slice into strips.',
          'Wash and tear mixed greens into bite-sized pieces.',
          'Chop cherry tomatoes and cucumber.',
          'Arrange greens on a plate, top with vegetables and sliced chicken.',
          'Drizzle with light vinaigrette and serve immediately.',
        ],
      },
      {
        recipeId: 2, title: 'Overnight Oats', prepTimeMins: 5,
        calories: 280, protein: 12, carbs: 45, fat: 6, servings: 1,
        difficulty: 'Easy', isCurated: true, isMealPrep: true,
        imageUrl: 'https://images.unsplash.com/photo-1571748982800-fa51082c2224?w=400',
        tags: ['vegetarian', 'breakfast', 'meal-prep'],
        ingredients: ['1/2 cup rolled oats', '1/2 cup almond milk', '1 tbsp chia seeds', '1 tsp honey', 'Mixed berries'],
        instructions: [
          'Add rolled oats and chia seeds to a jar.',
          'Pour almond milk over the oats.',
          'Add honey and stir to combine.',
          'Cover and refrigerate overnight for at least 6 hours.',
          'Top with mixed berries before serving.',
        ],
      },
      {
        recipeId: 3, title: 'Greek Yogurt Parfait', prepTimeMins: 10,
        calories: 220, protein: 20, carbs: 28, fat: 4, servings: 1,
        difficulty: 'Easy', isCurated: false, isMealPrep: false,
        imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400',
        tags: ['high-protein', 'breakfast', 'vegetarian'],
        ingredients: ['1 cup Greek yogurt', 'Granola', 'Mixed berries', '1 tsp honey', 'Sliced almonds'],
        instructions: [
          'Layer Greek yogurt at the bottom of a glass.',
          'Add a layer of granola.',
          'Top with mixed berries.',
          'Drizzle with honey.',
          'Sprinkle with sliced almonds and serve.',
        ],
      },
      {
        recipeId: 4, title: 'Hearty Lentil Soup', prepTimeMins: 45,
        calories: 295, protein: 18, carbs: 48, fat: 4, servings: 4,
        difficulty: 'Easy', isCurated: true, isMealPrep: true,
        imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400',
        tags: ['vegan', 'high-fiber', 'batch-cooking'],
        ingredients: ['Red lentils', 'Carrots', 'Celery', 'Onion', 'Cumin', 'Vegetable broth'],
        instructions: [
          'Dice onion, carrots and celery.',
          'Sauté vegetables in olive oil for 5 minutes.',
          'Add rinsed lentils and cumin, stir to coat.',
          'Pour in vegetable broth and bring to a boil.',
          'Reduce heat and simmer for 25 minutes until lentils are tender.',
          'Season with salt and pepper. Serve with crusty bread.',
        ],
      },
      {
        recipeId: 5, title: 'Vegetable Curry with Rice', prepTimeMins: 40,
        calories: 385, protein: 12, carbs: 68, fat: 10, servings: 4,
        difficulty: 'Medium', isCurated: true, isMealPrep: true,
        imageUrl: 'https://images.unsplash.com/photo-1604152135912-04a022e23696?w=400',
        tags: ['vegan', 'indian', 'meal-prep'],
        ingredients: ['Coconut milk', 'Curry paste', 'Basmati rice', 'Chickpeas', 'Mixed vegetables', 'Cilantro'],
        instructions: [
          'Cook basmati rice according to package instructions.',
          'Chop vegetables into bite-sized pieces.',
          'Heat oil in a large pot, add curry paste.',
          'Cook curry paste for 1-2 minutes until fragrant.',
          'Add vegetables and stir to coat with curry.',
          'Pour in coconut milk and add chickpeas.',
          'Simmer for 20 minutes until vegetables are tender.',
          'Serve hot over basmati rice, garnish with cilantro.',
        ],
      },
      {
        recipeId: 6, title: 'Salmon with Asparagus', prepTimeMins: 25,
        calories: 420, protein: 38, carbs: 8, fat: 26, servings: 1,
        difficulty: 'Medium', isCurated: true, isMealPrep: false,
        imageUrl: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400',
        tags: ['high-protein', 'gluten-free', 'dinner'],
        ingredients: ['200g salmon fillet', 'Asparagus spears', 'Lemon', 'Garlic', 'Olive oil', 'Fresh herbs'],
        instructions: [
          'Preheat oven to 200°C.',
          'Place salmon on a baking sheet lined with parchment.',
          'Season with salt, pepper, garlic and lemon zest.',
          'Arrange asparagus around the salmon.',
          'Drizzle everything with olive oil.',
          'Bake for 15-18 minutes until salmon flakes easily.',
          'Serve with lemon wedges.',
        ],
      },
    ];

    return { success: true, data: raw.map((r) => new Recipe(r)), message: '' };
  }

  // UC #27, #70 — create a custom recipe
  // @param  {number} userId
  // @param  {{ title, description, prepTimeMins, calories, protein, carbs, fat, servings, difficulty, ingredients, instructions, tags }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, fields) {
    const check = Recipe.validateRecipe(fields);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    const recipe = new Recipe({
      recipeId:        Date.now(),
      createdByUserId: userId,
      createdAt:       new Date().toISOString(),
      isCurated:       false,
      ...fields,
    });

    return {
      success: true,
      field:   null,
      message: `Recipe "${recipe.title}" created successfully!`,
      data:    recipe,
    };
  }

  // UC #25, #67 — save a recipe to user's collection
  // @param  {number} userId
  // @param  {Recipe} recipe
  // @return {Promise<{ success, message, data }>}
  static async saveRecipe(userId, recipe) {
    return {
      success: true,
      message: 'Recipe saved successfully!',
      data:    { userId, recipeId: recipe.recipeId, savedAt: new Date().toISOString() },
    };
  }

  // UC #65 — fetch user's saved recipes
  // @param  {number} userId
  // @return {Promise<{ success, data, message }>}
  static async fetchSaved(userId) {
    const all = await Recipe.fetchAll();
    const saved = [all.data.find((r) => r.recipeId === 5)].filter(Boolean);
    return { success: true, data: saved, message: '' };
  }
}

export default Recipe;
