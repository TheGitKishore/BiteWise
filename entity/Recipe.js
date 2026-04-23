// Recipe.js — Sprint 9 ADDITIONS (append to existing Recipe class)
// Two new seeded-only methods for Premium User custom recipe management.
// Add these methods to the existing Recipe class before the closing brace.

// ─── SPRINT 9 ADDITIONS ────────────────────────────────────────────────────

// UC NEW-C — Premium user update their own custom recipe (seeded stub)
// Validates title/ingredients/instructions, returns updated Recipe object.
// In production: PUT /recipes/:recipeId (with ownership check on server).
// @param  {string} recipeId
// @param  {number} userId
// @param  {{ title, description, prepTimeMins, calories, protein, carbs, fat,
//            servings, difficulty, ingredients, instructions, tags, isMealPrep }}
// @return {Promise<{ success, field, message, data }>}
// NOTE: Add this inside the Recipe class:
/*
  static async updateCustomRecipe(recipeId, userId, fields) {
    const check = Recipe.validateRecipe({
      title: fields.title,
      ingredients: fields.ingredients,
      instructions: fields.instructions,
    });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };

    return {
      success: true,
      field:   null,
      message: 'Recipe updated successfully!',
      data:    new Recipe({ _id: recipeId, ...fields, createdByUserId: userId }),
    };
  }

  // UC NEW-D — Premium user delete their own custom recipe (seeded stub)
  // In production: DELETE /recipes/:recipeId (with ownership check on server).
  // @param  {string} recipeId
  // @param  {number} userId
  // @return {Promise<{ success, message }>}
  static async deleteCustomRecipe(recipeId, userId) {
    return { success: true, message: 'Recipe deleted successfully.' };
  }
*/

// ── ACTUAL FILE: Copy of original Recipe.js with Sprint 9 methods appended ──
// (Below is the complete file to replace entity/Recipe.js)

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
    return Array.isArray(recipes) && recipes.length > 0;
  }

  static async fetchAll(query = '') {
    try {
      const res = await axios.get(API_URL, { params: query ? { search: query } : {} });
      return {
        success: true,
        data: res.data.map((r) => new Recipe({
          ...r,
          _id: r._id,
          isPublished: r.isPublished ?? false,
        })),
        message: '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.message || 'Failed to fetch recipes',
      };
    }
  }

  static async search(query) {
    return this.fetchAll(query);
  }

  static async create(userId, fields) {
    try {
      const res = await axios.post(API_URL, {
        ...fields,
        createdByUserId: userId,
      });
      return {
        success: true,
        message: 'Recipe created successfully!',
        data: new Recipe({ ...res.data, _id: res.data._id }),
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to create recipe',
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
      };
    }
  }

  static async updateLike(recipeId, incrementBy) {
    try {
      const payload = { incrementBy };
      const res = await axios.put(`${API_URL}/${recipeId}/like`, payload);
      return {
        success: true,
        message: 'Recipe like updated',
        data: {
          ...res.data,
          recipeId: res.data?.recipeId || recipeId,
          likeCount: res.data?.likeCount ?? 0,
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Failed to update recipe like',
      };
    }
  }

  static async fetchLikedRecipeIds(userId) {
    try {
      const res = await axios.get(`${API_URL}/liked/${userId}`);
      return {
        success: true,
        data: Array.isArray(res.data) ? res.data : [],
        message: '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.message || 'Failed to fetch liked recipes',
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
    const res = await axios.post(`${API_URL}/${recipeId}/unpublish`, { userId });
    return res.data;
  }

  // ─── SPRINT 9 ADDITIONS ────────────────────────────────────────────────────

  // UC NEW-C — Premium user update their own custom recipe (seeded stub)
  // In production: PUT /recipes/:recipeId with ownership check on server.
  // @param  {string} recipeId
  // @param  {number} userId
  // @param  {object} fields
  // @return {Promise<{ success, field, message, data }>}
  static async updateCustomRecipe(recipeId, userId, fields) {
    const check = Recipe.validateRecipe({
      title:        fields.title,
      ingredients:  fields.ingredients,
      instructions: fields.instructions,
    });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };

    return {
      success: true,
      field:   null,
      message: 'Recipe updated successfully!',
      data:    new Recipe({ _id: recipeId, ...fields, createdByUserId: userId }),
    };
  }

  // UC NEW-D — Premium user delete their own custom recipe (seeded stub)
  // In production: DELETE /recipes/:recipeId with ownership check on server.
  // @param  {string} recipeId
  // @param  {number} userId
  // @return {Promise<{ success, message }>}
  static async deleteCustomRecipe(recipeId, userId) {
    return { success: true, message: 'Recipe deleted successfully.' };
  }
}

export default Recipe;
