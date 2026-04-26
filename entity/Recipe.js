import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/recipes`;

class Recipe {
  constructor({
    _id = null,
    title = '',
    description = '',
    prepTimeMins = 0,
    calories = 0,
    protein = 0,
    carbs = 0,
    fat = 0,
    servings = 1,
    difficulty = 'Easy',
    ingredients = [],
    instructions = [],
    tags = [],
    isCurated = false,
    isMealPrep = false,
    imageUrl = null,
    likeCount = 0,
    createdByUserId = null,
    createdAt = null,
  } = {}) {
    this._id = _id;
    this.title = title;
    this.description = description;
    this.prepTimeMins = prepTimeMins;
    this.calories = calories;
    this.protein = protein;
    this.carbs = carbs;
    this.fat = fat;
    this.servings = servings;
    this.difficulty = difficulty;
    this.ingredients = ingredients;
    this.instructions = instructions;
    this.tags = tags;
    this.isCurated = isCurated;
    this.isMealPrep = isMealPrep;
    this.imageUrl = imageUrl;
    this.likeCount = Number(likeCount || 0);
    this.createdByUserId = createdByUserId;
    this.createdAt = createdAt;
  }

  getSummaryLine() {
    return `${this.prepTimeMins} min  •  ${this.calories} kcal`;
  }

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

  static filterBySearch(recipes, query) {
    if (!query || query.trim().length === 0) return recipes;
    const lower = query.trim().toLowerCase();
    return recipes.filter(
      (r) =>
        r.title.toLowerCase().includes(lower) ||
        r.ingredients.some((ing) => ing.toLowerCase().includes(lower))
    );
  }

  static filterByTag(recipes, tag) {
    if (!tag || tag === 'All') return recipes;
    return recipes.filter((r) => r.tags.includes(tag.toLowerCase()));
  }

  static filterMealPrep(recipes) {
    return recipes.filter((r) => r.isMealPrep);
  }

  static filterCurated(recipes) {
    return recipes.filter((r) => r.isCurated);
  }

  static filterByPrepTime(recipes, maxMins) {
    if (!maxMins) return recipes;
    return recipes.filter((r) => r.prepTimeMins <= maxMins);
  }

  static filterByUser(recipes, userId) {
    if (!userId) return [];
    return recipes.filter((r) => String(r.createdByUserId) === String(userId));
  }

  static hasRecipes(recipes) {
    return recipes.length > 0;
  }

  // Optional query:
  // - no query => return Mongo recipes
  // - with query => backend does Mongo-first, API fallback, and caching
  static async fetchAll(query = '') {
    const res = await axios.get(API_URL, {
      params: query && query.trim().length > 0 ? { q: query.trim() } : {},
    });

    return {
      success: true,
      data: res.data.map((r) =>
        new Recipe({
          ...r,
          _id: r._id,
          isPublished: r.isPublished ?? false, // 🔥 ADD THIS
        })
      ),
    };
  }

  static async search(query) {
    if (!query || query.trim().length === 0) {
      return { success: true, data: [], message: '' };
    }
    return this.fetchAll(query);
  }

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

  static async saveRecipe(userId, recipe) {
    try {
      const res = await axios.post(`${API_URL}/save`, {
        userId,
        recipeId: recipe._id,
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

  static async updateLike(recipeId, incrementBy) {
    try {
      const payload =
        typeof incrementBy === 'object' && incrementBy !== null
          ? incrementBy
          : { incrementBy };
      const res = await axios.put(`${API_URL}/${recipeId}/like`, payload);

      return {
        success: true,
        message: 'Recipe like updated',
        data: {
          recipeId: res.data?.recipeId || recipeId,
          likeCount: Number(res.data?.likeCount ?? 0),
          isLiked: typeof res.data?.isLiked === 'boolean' ? res.data.isLiked : undefined,
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Failed to update recipe like',
        data: null,
      };
    }
  }

  static async fetchLikedRecipeIds(userId) {
    try {
      const res = await axios.get(`${API_URL}/likes/${userId}`);
      return {
        success: true,
        data: Array.isArray(res.data) ? res.data.map((id) => String(id)) : [],
        message: '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err?.response?.data?.message || err.message || 'Failed to fetch recipe likes',
      };
    }
  }

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

  static async update(recipeId, curatorUserId, fields) {
    const check = Recipe.validateRecipe({
      title: fields.title,
      ingredients: fields.ingredients,
      instructions: fields.instructions,
    });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };

    return {
      success: true,
      field: null,
      message: 'Recipe updated successfully!',
      data: new Recipe({ recipeId, ...fields, createdByUserId: curatorUserId }),
    };
  }

  static async getById(recipeId) {
    try {
      const res = await axios.get(`${API_URL}/${recipeId}`);
      return {
        success: true,
        data: new Recipe({
          ...res.data,
          _id: res.data._id,
          isPublished: res.data.isPublished ?? false,
        }),
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Recipe not found',
      };
    }
  }  

  // ─── SPRINT 6 ADDITIONS ────────────────────────────────────────────────────

  static async unpublish(recipeId, userId) {
    const res = await axios.post(`${API_URL}/${recipeId}/unpublish`, {
      userId,
    });
  
    return res.data;
  }

  // ─── SPRINT 9 TASK 5 ADDITIONS ───────────────────────────────────────────────

  // UC (Sprint 9 Task 5) — Update a custom recipe owned by the user.
  // Validates fields first, then returns a seeded success response.
  // Backend wiring to be done separately — no axios in this stub.
  //
  // @param  {string|number} recipeId
  // @param  {string|number} userId        — must match createdByUserId
  // @param  {object}        fields        — same shape as Recipe.create()
  // @return {Promise<{ success, field, message, data: Recipe|null }>}
  static async updateCustomRecipe(recipeId, userId, fields) {
    const check = Recipe.validateRecipe({
      title:        fields.title,
      ingredients:  fields.ingredients,
      instructions: fields.instructions,
    });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    // Seeded stub — returns the updated recipe object (no axios)
    const updated = new Recipe({
      _id:             recipeId,
      createdByUserId: userId,
      ...fields,
    });

    return {
      success: true,
      field:   null,
      message: 'Recipe updated successfully!',
      data:    updated,
    };
  }

  // UC (Sprint 9 Task 5) — Delete a custom recipe owned by the user.
  // Seeded stub — returns success without touching the server.
  // Backend wiring to be done separately — no axios in this stub.
  //
  // @param  {string|number} recipeId
  // @param  {string|number} userId  — must match createdByUserId
  // @return {Promise<{ success, message }>}
  static async deleteCustomRecipe(recipeId, userId) {
    return {
      success: true,
      message: 'Recipe deleted successfully!',
    };
  }

  // ─── SPRINT 9 TODAY'S MENU ADDITIONS ─────────────────────────────────────

  // UC T4 — Filter and sort recipes that fit within a calorie budget.
  // Used by ViewTodaysMenuController to recommend recipes for Today's Menu.
  //
  // Filter rule:  recipe.calories <= remainingCalories * 1.1  (10% tolerance)
  // Sort rule:    ascending distance from sweetSpot (remainingCalories * 0.4)
  //               — surfaces snack-sized options when budget is low,
  //                 full-meal options when budget is generous.
  //
  // @param  {Recipe[]} recipes           — full recipe list from fetchAll()
  // @param  {number}   remainingCalories — kcal left in user's daily budget
  // @return {Recipe[]} filtered + sorted list (pure computation, no axios)
  static filterByCalorieBudget(recipes, remainingCalories) {
    if (!Array.isArray(recipes) || remainingCalories <= 0) return [];

    const budget    = remainingCalories * 1.1;
    const sweetSpot = remainingCalories * 0.4;

    return recipes
      .filter((r) => Number(r.calories) > 0 && Number(r.calories) <= budget)
      .sort((a, b) => {
        const distA = Math.abs(Number(a.calories) - sweetSpot);
        const distB = Math.abs(Number(b.calories) - sweetSpot);
        return distA - distB;
      });
  }

  // UC T4 — Score how well a recipe's macros match the user's remaining targets.
  // Higher score = better macro alignment (0.0 – 1.0 scale).
  // Used by the boundary to display a "fit" indicator on each recipe card.
  //
  // Scoring: each macro contributes equally (25%).
  //   - Per macro: score = 1 - min(1, |recipe_macro - remaining_macro| / remaining_macro)
  //   - Macros evaluated: calories, protein, carbs, fat
  //
  // @param  {Recipe} recipe    — the candidate recipe
  // @param  {{ calories, protein, carbs, fat }} remaining — user's remaining macros
  // @return {number} score 0.0–1.0 (pure computation, no axios)
  static getMacroMatchScore(recipe, remaining) {
    if (!recipe || !remaining) return 0;

    const score = (recipeVal, remainingVal) => {
      if (!remainingVal || remainingVal <= 0) return 0;
      const diff = Math.abs(Number(recipeVal) - remainingVal);
      return Math.max(0, 1 - diff / remainingVal);
    };

    const calScore     = score(recipe.calories, remaining.calories);
    const proteinScore = score(recipe.protein,  remaining.protein);
    const carbsScore   = score(recipe.carbs,    remaining.carbs);
    const fatScore     = score(recipe.fat,      remaining.fat);

    return (calScore + proteinScore + carbsScore + fatScore) / 4;
  }
}

export default Recipe;

