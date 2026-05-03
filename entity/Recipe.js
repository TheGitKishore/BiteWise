import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/recipes`;

class Recipe {
  constructor({
    recipeId = null,
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
    viewCount = 0,
    createdByUserId = null,
    createdAt = null,
    isPublished = false,
  } = {}) {
    this._id = _id;
    this.recipeId = recipeId || (_id ? String(_id) : null);
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
    this.viewCount = Number(viewCount || 0);
    this.createdByUserId = createdByUserId;
    this.createdAt = createdAt;
    this.isPublished = isPublished;
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
        String(r.title || '').toLowerCase().includes(lower) ||
        (Array.isArray(r.ingredients) &&
          r.ingredients.some((ing) => String(ing).toLowerCase().includes(lower)))
    );
  }

  static filterByTag(recipes, tag) {
    if (!tag || tag === 'All') return recipes;
    return recipes.filter((r) => Array.isArray(r.tags) && r.tags.includes(tag.toLowerCase()));
  }

  static filterMealPrep(recipes) {
    return recipes.filter((r) => r.isMealPrep);
  }

  static filterCurated(recipes) {
    return recipes.filter((r) => r.isCurated);
  }

  static filterByPrepTime(recipes, maxMins) {
    if (!maxMins) return recipes;
    return recipes.filter((r) => Number(r.prepTimeMins) <= Number(maxMins));
  }

  static filterByUser(recipes, userId) {
    if (!userId) return [];
    return recipes.filter((r) => String(r.createdByUserId) === String(userId));
  }

  static hasRecipes(recipes) {
    return Array.isArray(recipes) && recipes.length > 0;
  }

  static async fetchAll(query = '') {
    const res = await axios.get(API_URL, {
      params: query && query.trim().length > 0 ? { q: query.trim() } : {},
    });

    return {
      success: true,
      data: (Array.isArray(res.data) ? res.data : []).map(
        (r) =>
          new Recipe({
            ...r,
            recipeId: r.recipeId || (r._id ? String(r._id) : null),
            _id: r._id,
            isPublished: r.isPublished ?? false,
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
        recipeId: recipe.recipeId || recipe._id,
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

  static async recordView(recipeId, userId) {
    try {
      const res = await axios.put(`${API_URL}/${recipeId}/view`, { userId });
      return {
        success: Boolean(res.data?.success ?? true),
        message: res.data?.message || 'Recipe view updated',
        data: {
          recipeId: res.data?.recipeId || recipeId,
          viewCount: Number(res.data?.viewCount ?? 0),
          counted: Boolean(res.data?.counted),
        },
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Failed to update recipe views',
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
        data: (Array.isArray(res.data) ? res.data : []).map((r) => new Recipe(r)),
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

  static async unsaveRecipe(userId, recipeId) {
    try {
      const res = await axios.delete(`${API_URL}/saved/${userId}/${recipeId}`);
      return {
        success: Boolean(res.data?.success ?? true),
        message: res.data?.message || 'Recipe removed from saved recipes.',
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message || 'Failed to remove saved recipe',
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
          recipeId: res.data.recipeId || (res.data._id ? String(res.data._id) : null),
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

  static async unpublish(recipeId, userId) {
    const res = await axios.post(`${API_URL}/${recipeId}/unpublish`, { userId });
    return res.data;
  }

  // Today's Menu helpers
  static filterByCalorieBudget(recipes, remainingCalories) {
    if (!Array.isArray(recipes) || remainingCalories <= 0) return [];

    const budget = remainingCalories * 1.1;
    const sweetSpot = remainingCalories * 0.4;

    return recipes
      .filter((r) => Number(r.calories) > 0 && Number(r.calories) <= budget)
      .sort((a, b) => {
        const distA = Math.abs(Number(a.calories) - sweetSpot);
        const distB = Math.abs(Number(b.calories) - sweetSpot);
        return distA - distB;
      });
  }

  static getMacroMatchScore(recipe, remaining) {
    if (!recipe || !remaining) return 0;

    const score = (recipeVal, remainingVal) => {
      if (!remainingVal || remainingVal <= 0) return 0;
      const diff = Math.abs(Number(recipeVal) - remainingVal);
      return Math.max(0, 1 - diff / remainingVal);
    };

    const calScore = score(recipe.calories, remaining.calories);
    const proteinScore = score(recipe.protein, remaining.protein);
    const carbsScore = score(recipe.carbs, remaining.carbs);
    const fatScore = score(recipe.fat, remaining.fat);

    return (calScore + proteinScore + carbsScore + fatScore) / 4;
  }

  // Custom recipe endpoints
  static async fetchCustom(userId = null) {
    try {
      const url = userId ? `${API_URL}/custom/${userId}` : `${API_URL}/custom`;
      const res = await axios.get(url);
      return {
        success: true,
        data: (Array.isArray(res.data) ? res.data : []).map((r) => new Recipe(r)),
        message: '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.message || 'Failed to fetch custom recipes',
      };
    }
  }

  static async updateCustomRecipe(recipeId, userId, fields) {
    try {
      const res = await axios.put(`${API_URL}/custom/${recipeId}`, { userId, fields });
      return {
        success: true,
        field: null,
        message: res.data.message,
        data: new Recipe(res.data.data),
      };
    } catch (err) {
      return {
        success: false,
        field: null,
        message: err?.response?.data?.message || err.message,
        data: null,
      };
    }
  }

  static async deleteCustomRecipe(recipeId, userId) {
    try {
      const res = await axios.delete(`${API_URL}/custom/${recipeId}`, {
        data: { userId },
      });
      return {
        success: true,
        message: res.data.message,
      };
    } catch (err) {
      return {
        success: false,
        message: err?.response?.data?.message || err.message,
      };
    }
  }
}

export default Recipe;
