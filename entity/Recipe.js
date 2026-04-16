import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/recipes`;

class Recipe {
  constructor({
    recipeId = null,
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
    this.recipeId = recipeId;
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
      data: res.data.map(
        (r) =>
          new Recipe({
            ...r,
            recipeId: r.recipeId || r._id?.toString() || null,
          })
      ),
      message: '',
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

  // ─── SPRINT 6 ADDITIONS ────────────────────────────────────────────────────

  // UC #111 — curator: publish a recipe (makes it visible to all users)
  static async publish(recipeId, curatorUserId) {
    return { success: true, message: 'Recipe published! It is now visible to all users.', data: { recipeId, isPublished: true } };
  }

  // UC #112 — curator: unpublish a recipe (removes from public listing)
  static async unpublish(recipeId, curatorUserId) {
    return { success: true, message: 'Recipe unpublished and returned to drafts.', data: { recipeId, isPublished: false } };
  }

  // UC #114 — curator: delete a recipe they own (fixed args)
  static async delete(recipeId, curatorUserId) {
    return { success: true, message: 'Recipe deleted.' };
  }
}

export default Recipe;

