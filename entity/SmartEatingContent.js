import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/food-api/smart-eating`;

const EMPTY_SNACKING_CONTENT = {
  corePrinciples: [],
  managingCravings: [],
  whenToSnack: [],
  snackIdeas: [],
  portionControl: {
    visualGuides: [],
    prePortioningStrategies: [],
  },
  warningSign: {
    title: '',
    intro: '',
    signs: [],
    footer: '',
  },
};

const EMPTY_ALTERNATIVES_GROUPED = {
  groups: [],
  tips: [],
};

class SmartEatingContent {
  static _normalizeSnackingContent(data = {}) {
    const safe = data && typeof data === 'object' ? data : {};
    return {
      corePrinciples: Array.isArray(safe.corePrinciples) ? safe.corePrinciples : [],
      managingCravings: Array.isArray(safe.managingCravings) ? safe.managingCravings : [],
      whenToSnack: Array.isArray(safe.whenToSnack) ? safe.whenToSnack : [],
      snackIdeas: Array.isArray(safe.snackIdeas) ? safe.snackIdeas : [],
      portionControl: {
        visualGuides: Array.isArray(safe?.portionControl?.visualGuides) ? safe.portionControl.visualGuides : [],
        prePortioningStrategies: Array.isArray(safe?.portionControl?.prePortioningStrategies) ? safe.portionControl.prePortioningStrategies : [],
      },
      warningSign: {
        title: safe?.warningSign?.title || '',
        intro: safe?.warningSign?.intro || '',
        signs: Array.isArray(safe?.warningSign?.signs) ? safe.warningSign.signs : [],
        footer: safe?.warningSign?.footer || '',
      },
    };
  }

  static _normalizeAlternativesGrouped(data = {}) {
    const safe = data && typeof data === 'object' ? data : {};
    return {
      groups: Array.isArray(safe.groups) ? safe.groups : [],
      tips: Array.isArray(safe.tips) ? safe.tips : [],
    };
  }

  // Legacy methods
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

  static filterByCategory(alternatives, category) {
    if (!category || category === 'All') return alternatives;
    return alternatives.filter((a) => a.category === category);
  }

  static getCategories(alternatives) {
    return ['All', ...new Set(alternatives.map((a) => a.category))];
  }

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

  // Sprint 9 methods
  static async fetchSnackingContent() {
    try {
      const res = await axios.get(`${API_URL}/mindful-snacking/content`);
      const normalized = this._normalizeSnackingContent(res.data?.data);

      if (!res.data?.success) {
        return {
          success: false,
          data: EMPTY_SNACKING_CONTENT,
          message: res.data?.message || 'Unable to load snacking content. Please try again.',
        };
      }

      const hasContent =
        normalized.corePrinciples.length > 0 ||
        normalized.managingCravings.length > 0 ||
        normalized.whenToSnack.length > 0 ||
        normalized.snackIdeas.length > 0;

      return {
        success: true,
        data: hasContent ? normalized : EMPTY_SNACKING_CONTENT,
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: EMPTY_SNACKING_CONTENT,
        message: err.response?.data?.message || 'Unable to load snacking content. Please try again.',
      };
    }
  }

  static filterSnackIdeas(snackIdeas, filter) {
    if (!filter || filter === 'All') return snackIdeas;
    return snackIdeas.filter((s) =>
      String(s?.timing || '').toLowerCase().includes(String(filter).toLowerCase())
    );
  }

  static async fetchFoodAlternativesGrouped() {
    try {
      const res = await axios.get(`${API_URL}/alternatives/grouped`);
      const normalized = this._normalizeAlternativesGrouped(res.data?.data);

      if (!res.data?.success) {
        return {
          success: false,
          data: EMPTY_ALTERNATIVES_GROUPED,
          message: res.data?.message || 'Unable to load food alternatives. Please try again.',
        };
      }

      const hasGroups = normalized.groups.length > 0;
      return {
        success: true,
        data: hasGroups ? normalized : EMPTY_ALTERNATIVES_GROUPED,
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: EMPTY_ALTERNATIVES_GROUPED,
        message: err.response?.data?.message || 'Unable to load food alternatives. Please try again.',
      };
    }
  }

  static searchAlternatives(groups, query) {
    if (!query || query.trim() === '') return groups;
    const q = query.toLowerCase().trim();
    const result = [];
    for (const group of groups) {
      const originalMatch = String(group?.original || '').toLowerCase().includes(q);
      if (originalMatch) {
        result.push(group);
        continue;
      }
      const filteredAlts = (group?.alternatives || []).filter(
        (a) =>
          String(a?.name || '').toLowerCase().includes(q) ||
          String(a?.goal || '').toLowerCase().includes(q)
      );
      if (filteredAlts.length > 0) {
        result.push({ ...group, alternatives: filteredAlts });
      }
    }
    return result;
  }
}

export default SmartEatingContent;
