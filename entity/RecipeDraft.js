import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/recipe-drafts`;

class RecipeDraft {
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
    isCurated = true,
    isMealPrep = false,
    imageUrl = null,
    createdByUserId = null,
    createdAt = null,
  } = {}) {
    Object.assign(this, {
      recipeId,
      title,
      description,
      prepTimeMins,
      calories,
      protein,
      carbs,
      fat,
      servings,
      difficulty,
      ingredients,
      instructions,
      tags,
      isCurated,
      isMealPrep,
      imageUrl,
      createdByUserId,
      createdAt,
    });
  }

  // ─────────────────────────────
  // VALIDATION
  // ─────────────────────────────
  static validateRecipe({ title, ingredients, instructions }) {
    if (!title || title.trim().length === 0) {
      return { valid: false, field: 'title', message: 'Recipe name is required.' };
    }
    if (!ingredients || ingredients.filter(i => i.trim()).length === 0) {
      return { valid: false, field: 'ingredients', message: 'At least one ingredient is required.' };
    }
    if (!instructions || instructions.filter(i => i.trim()).length === 0) {
      return { valid: false, field: 'instructions', message: 'At least one instruction step is required.' };
    }
    return { valid: true };
  }

  // ─────────────────────────────
  // FILTERS
  // ─────────────────────────────
  static filterByUser(recipes, userId) {
    if (!userId) return [];
    return recipes.filter(r => String(r.createdByUserId) === String(userId));
  }

  // ─────────────────────────────
  // API
  // ─────────────────────────────

  static async fetchAll() {
    try {
      const res = await axios.get(API_URL);

      return {
        success: true,
        data: res.data.map(
          r =>
            new RecipeDraft({
              ...r,
              recipeId: r.recipeId || r._id?.toString() || null,
            })
        ),
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.message || 'Failed to fetch drafts',
      };
    }
  }

  // ✅ NEW (IMPORTANT for your controller)
  static async fetchByUser(userId) {
    try {
      const res = await axios.get(`${API_URL}?userId=${userId}`);

      const data = res.data.map(
        r =>
          new RecipeDraft({
            ...r,
            recipeId: r.recipeId || r._id?.toString() || null,
          })
      );

      return {
        success: true,
        data,
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.message || 'Failed to fetch user drafts',
      };
    }
  }

  static async getById(recipeId) {
    try {
      const res = await axios.get(`${API_URL}/${recipeId}`);

      return {
        success: true,
        data: new RecipeDraft({
          ...res.data,
          recipeId: res.data.recipeId || res.data._id?.toString() || null,
        }),
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Draft not found',
      };
    }
  }

  static async create(userId, fields) {
    const check = RecipeDraft.validateRecipe(fields);
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message };
    }

    try {
      const res = await axios.post(API_URL, {
        createdByUserId: userId,
        ...fields,
        isCurated: true,
      });

      return {
        success: true,
        message: 'Draft created successfully!',
        data: new RecipeDraft(res.data),
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to create draft',
      };
    }
  }

  static async update(recipeId, userId, fields) {
    const check = RecipeDraft.validateRecipe(fields);
    if (!check.valid) {
      return {
        success: false,
        field: check.field,
        message: check.message,
      };
    }
  
    try {
      const res = await axios.put(`${API_URL}/${recipeId}`, {
        ...fields,
        createdByUserId: userId,
      });
    
      const payload = res.data;
    
      return {
        success: true,
        message: payload.message || 'Draft updated successfully!',
        data: payload.data ? new RecipeDraft(payload.data) : new RecipeDraft(payload),
      };
    } catch (err) {
      console.error('[RecipeDraft.update]', err?.response?.data || err.message);
    
      return {
        success: false,
        message:
          err?.response?.data?.message ||
          err.message ||
          'Failed to update draft',
      };
    }
  }

  static async delete(recipeId, userId) {
    try {
      await axios.delete(`${API_URL}/${recipeId}`, {
        data: { createdByUserId: userId },
      });

      return {
        success: true,
        message: 'Draft deleted.',
      };
    } catch (err) {
      return {
        success: false,
        message: err.message || 'Failed to delete draft',
      };
    }
  }

  static async publish(recipeId, userId) {
    const res = await axios.post(`${API_URL}/${recipeId}/publish`, {
      userId,
    });
  
    return res.data;
  }
}

export default RecipeDraft;