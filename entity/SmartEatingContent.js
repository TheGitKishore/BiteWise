import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/food-api/smart-eating`;

class SmartEatingContent {
  // UC #74 - fetch all food alternatives
  static async fetchAlternatives() {
    try {
      const res = await axios.get(`${API_URL}/alternatives`);
      return {
        success: Boolean(res.data?.success),
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load food alternatives. Please try again.',
      };
    }
  }

  // Filter alternatives by category
  static filterByCategory(alternatives, category) {
    if (!category || category === 'All') return alternatives;
    return alternatives.filter((a) => a.category === category);
  }

  static getCategories(alternatives) {
    return ['All', ...new Set(alternatives.map((a) => a.category))];
  }

  // UC #75 - fetch all mindful snacking tips
  static async fetchSnackingTips() {
    try {
      const res = await axios.get(`${API_URL}/mindful-snacking`);
      return {
        success: Boolean(res.data?.success),
        data: Array.isArray(res.data?.data) ? res.data.data : [],
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: [],
        message: err.response?.data?.message || 'Unable to load snacking tips. Please try again.',
      };
    }
  }
}

export default SmartEatingContent;
