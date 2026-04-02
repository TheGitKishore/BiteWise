import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/recipes`;

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

  // UC #27, #70 — client-side filter: only recipes created by this user
  // @param  {Recipe[]} recipes
  // @param  {number}   userId
  // @return {Recipe[]}
  static filterByUser(recipes, userId) {
    if (!userId) return [];
    return recipes.filter((r) => String(r.createdByUserId) === String(userId));
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
// UC #22, #61 — fetch all recipes
  static async fetchAll() {
    const res = await axios.get(API_URL);
    
    return {
      success: true,
      data: res.data.map((r) =>
        new Recipe({
          ...r,
          recipeId: r._id?.toString() || null, // 🔥 FORCE Mongo ID ONLY
        })
      ),
    };
  }


  // UC #27, #70 — create a custom recipe
  static async create(userId, fields) {
    const check = Recipe.validateRecipe(fields);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, {
        createdByUserId: userId,
        ...fields,
      });

      return {
        success: true,
        field: null,
        message: 'Recipe created successfully!',
        data: new Recipe(res.data),
      };
    } catch (err) {
      return {
        success: false,
        field: null,
        message: err.message || 'Failed to create recipe',
        data: null,
      };
    }
  }


  // UC #25, #67 — save recipe
  static async saveRecipe(userId, recipe) {
    try {
      const res = await axios.post(`${API_URL}/save`, {
        userId,
        recipeId: recipe.recipeId,
      });

      return {
        success: true,
        message: 'Recipe saved successfully!',
        data: res.data,
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to save recipe',
        data: null,
      };
    }
  }


  // UC #65 — fetch saved recipes
  static async fetchSaved(userId) {
    try {
      const res = await axios.get(`${API_URL}/saved/${userId}`);

      return {
        success: true,
        data: res.data.map((r) => new Recipe(r)),
        message: '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.message || 'Failed to fetch saved recipes',
      };
    }
  }
}
export default Recipe;
