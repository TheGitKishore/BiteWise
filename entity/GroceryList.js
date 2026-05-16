import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/grocery-lists`;

class GroceryList {
  constructor({
    listId = null,
    userId = null,
    sourceRecipeId = null,
    sourceRecipeTitle = '',
    items = [],
    generatedAt = null,
    updatedAt = null,
  } = {}) {
    this.listId = listId;
    this.userId = userId;
    this.sourceRecipeId = sourceRecipeId;
    this.sourceRecipeTitle = sourceRecipeTitle;
    this.items = items;
    this.generatedAt = generatedAt;
    this.updatedAt = updatedAt;
  }

  getCheckedCount() {
    return this.items.filter((item) => item.checked).length;
  }

  getPendingItems() {
    return this.items.filter((item) => !item.checked);
  }

  static validateItem({ name }) {
    if (!name || name.trim().length === 0) {
      return { valid: false, field: 'name', message: 'Item name is required.' };
    }
    return { valid: true, field: null, message: '' };
  }

  static fromApi(raw) {
    return new GroceryList({
      listId: raw?.listId || null,
      userId: raw?.userId ?? null,
      sourceRecipeId: raw?.sourceRecipeId || null,
      sourceRecipeTitle: raw?.sourceRecipeTitle || '',
      items: Array.isArray(raw?.items) ? raw.items : [],
      generatedAt: raw?.generatedAt || null,
      updatedAt: raw?.updatedAt || null,
    });
  }

  // UC #94
  static async generateFromRecipe(userId, recipe) {
    try {
      const res = await axios.post(`${API_URL}/generate-from-recipe`, { userId, recipe });
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Grocery list generated!',
        data: res.data?.data ? GroceryList.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to generate grocery list.',
        data: null,
      };
    }
  }

  // UC #95
  static async addItem(userId, { name, quantity, unit }) {
    const check = GroceryList.validateItem({ name });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(`${API_URL}/${userId}/items`, { name, quantity, unit });
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Item added.',
        data: res.data?.data ? GroceryList.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        field: err.response?.data?.field ?? null,
        message: err.response?.data?.message || 'Failed to add item.',
        data: null,
      };
    }
  }

  // UC #96
  static async deleteItem(userId, itemId) {
    try {
      const res = await axios.delete(`${API_URL}/${userId}/items/${itemId}`);
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || 'Item removed.',
        data: res.data?.data ? GroceryList.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to remove item.',
        data: null,
      };
    }
  }

  static async toggleItem(userId, itemId) {
    try {
      const res = await axios.put(`${API_URL}/${userId}/items/${itemId}/toggle`);
      return {
        success: Boolean(res.data?.success),
        message: res.data?.message || '',
        data: res.data?.data ? GroceryList.fromApi(res.data.data) : null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update item.',
        data: null,
      };
    }
  }

  static async fetchCurrent(userId) {
    try {
      const res = await axios.get(`${API_URL}/${userId}`);
      return {
        success: Boolean(res.data?.success),
        data: res.data?.data ? GroceryList.fromApi(res.data.data) : null,
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: null,
        message: err.response?.data?.message || 'Failed to fetch grocery list.',
      };
    }
  }
}

export default GroceryList;

