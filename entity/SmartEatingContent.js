import axios from 'axios';
import API_CONFIG from './api_config.js';

const API_URL = `${API_CONFIG}/food-api/smart-eating`;

// ─── Sprint 9 Seed Data ───────────────────────────────────────────────────────

const SNACKING_CONTENT = {
  corePrinciples: [
    {
      id: 'cp1',
      title: 'Listen to Your Body',
      description: 'Distinguish between true hunger and emotional eating. Wait 10 minutes before snacking.',
    },
    {
      id: 'cp2',
      title: 'Plan Ahead',
      description: 'Pre-portion snacks and keep healthy options readily available to avoid impulsive choices.',
    },
    {
      id: 'cp3',
      title: 'Balance Your Macros',
      description: 'Combine protein with fiber for lasting satiety and stable blood sugar levels.',
    },
    {
      id: 'cp4',
      title: 'Eat Slowly',
      description: 'Take time to chew and enjoy your snack. It takes 20 minutes for fullness signals to reach your brain.',
    },
  ],
  managingCravings: [
    {
      id: 'mc1',
      title: 'The 5-Minute Rule',
      description: 'When a craving hits, wait 5 minutes and drink a glass of water. Often, cravings pass or you realize you\'re just thirsty.',
      borderColor: '#7C3AED',
    },
    {
      id: 'mc2',
      title: 'Identify Triggers',
      description: 'Common triggers: stress, boredom, fatigue, or specific times of day. Keep a log to identify your patterns.',
      borderColor: '#3B82F6',
    },
    {
      id: 'mc3',
      title: 'Healthy Substitutions',
      description: 'Sweet craving? Try fruit or Greek yogurt. Salty craving? Opt for nuts or popcorn instead of chips.',
      borderColor: '#16A34A',
    },
    {
      id: 'mc4',
      title: 'The 80/20 Rule',
      description: 'Eat nutritious foods 80% of the time. Allow yourself treats 20% of the time without guilt.',
      borderColor: '#EA580C',
    },
  ],
  whenToSnack: [
    {
      id: 'wts1',
      period: 'Morning (10-11 AM)',
      description: 'If breakfast was light or early, a small snack prevents overeating at lunch.',
      best: 'Protein + Fruit',
      bg: '#EDE9FE',
      bestColor: '#7C3AED',
    },
    {
      id: 'wts2',
      period: 'Afternoon (3-4 PM)',
      description: 'Energy dip time. Choose snacks that provide sustained energy without a crash.',
      best: 'Complex Carbs + Protein',
      bg: '#EFF6FF',
      bestColor: '#3B82F6',
    },
    {
      id: 'wts3',
      period: 'Evening (Optional)',
      description: 'Only if dinner was early or light. Choose lighter options that won\'t disrupt sleep.',
      best: 'Protein-Rich, Low-Fat',
      bg: '#F0FDF4',
      bestColor: '#16A34A',
    },
  ],
  snackIdeas: [
    {
      id: 'si1',
      name: 'Greek Yogurt with Berries',
      calories: 150,
      protein: 15,
      fiber: 3,
      timing: 'Mid-morning',
      benefits: ['High protein', 'Probiotics', 'Antioxidants'],
    },
    {
      id: 'si2',
      name: 'Apple Slices with Almond Butter',
      calories: 180,
      protein: 4,
      fiber: 5,
      timing: 'Afternoon',
      benefits: ['Fiber-rich', 'Healthy fats', 'Sustained energy'],
    },
    {
      id: 'si3',
      name: 'Handful of Mixed Nuts',
      calories: 170,
      protein: 6,
      fiber: 3,
      timing: 'Anytime',
      benefits: ['Heart-healthy fats', 'Satisfying'],
    },
    {
      id: 'si4',
      name: 'Hummus & Veggie Sticks',
      calories: 120,
      protein: 5,
      fiber: 4,
      timing: 'Afternoon',
      benefits: ['Fiber-rich', 'Plant protein', 'Low calorie'],
    },
    {
      id: 'si5',
      name: 'Cottage Cheese with Pineapple',
      calories: 140,
      protein: 14,
      fiber: 1,
      timing: 'Evening',
      benefits: ['High protein', 'Low fat', 'Casein protein'],
    },
  ],
  portionControl: {
    visualGuides: [
      { food: 'Nuts', size: 'A small handful (about 1/4 cup)' },
      { food: 'Cheese', size: 'Size of 2 dice (about 1 oz)' },
      { food: 'Hummus', size: 'Golf ball size (about 2 tbsp)' },
      { food: 'Nut Butter', size: 'Poker chip size (about 1 tbsp)' },
    ],
    prePortioningStrategies: [
      'Divide large packages into single servings immediately',
      'Use small bowls or containers to avoid overeating',
      'Never eat directly from the package',
      'Keep a measuring cup handy in your pantry',
    ],
  },
  warningSign: {
    title: 'When Snacking Becomes a Problem',
    intro: 'Mindful snacking is healthy, but watch for these warning signs:',
    signs: [
      'Snacking when not physically hungry (emotional eating)',
      'Eating snacks mindlessly while distracted (TV, work)',
      'Feeling guilty or anxious about snacking',
      'Snacks replacing regular meals consistently',
      'Hiding snacking from others',
    ],
    footer: 'If you notice these patterns, consider speaking with a registered dietitian or counselor.',
  },
};

const FOOD_ALT_GROUPS = [
  {
    id: 'fg1',
    original: 'White Rice',
    alternatives: [
      {
        id: 'fa1',
        name: 'Brown Rice',
        goal: 'Weight management',
        calories: 110,
        protein: 2.6,
        carbs: 23,
        fat: 0.9,
        benefits: ['Higher fiber', 'More vitamins', 'Better blood sugar control'],
      },
      {
        id: 'fa2',
        name: 'Cauliflower Rice',
        goal: 'Low-carb diets',
        calories: 25,
        protein: 2,
        carbs: 5,
        fat: 0.3,
        benefits: ['Very low calorie', 'Low carb', 'High in vitamins'],
      },
      {
        id: 'fa3',
        name: 'Quinoa',
        goal: 'Protein intake',
        calories: 120,
        protein: 4,
        carbs: 21,
        fat: 1.9,
        benefits: ['Complete protein', 'High fiber', 'Gluten-free'],
      },
    ],
  },
  {
    id: 'fg2',
    original: 'Butter',
    alternatives: [
      {
        id: 'fa4',
        name: 'Avocado Oil',
        goal: 'Cooking',
        calories: 120,
        protein: 0,
        carbs: 0,
        fat: 14,
        benefits: ['Heart-healthy fats', 'High smoke point', 'Monounsaturated'],
      },
      {
        id: 'fa5',
        name: 'Nut Butter',
        goal: 'Nutrient boost',
        calories: 95,
        protein: 3,
        carbs: 3,
        fat: 8,
        benefits: ['Protein', 'Healthy fats', 'Satisfying'],
      },
    ],
  },
  {
    id: 'fg3',
    original: 'White Bread',
    alternatives: [
      {
        id: 'fa6',
        name: 'Whole Grain Bread',
        goal: 'Fiber intake',
        calories: 80,
        protein: 4,
        carbs: 15,
        fat: 1,
        benefits: ['Higher fiber', 'More nutrients', 'Slower digestion'],
      },
      {
        id: 'fa7',
        name: 'Lettuce Wraps',
        goal: 'Low-carb',
        calories: 10,
        protein: 0.5,
        carbs: 1,
        fat: 0.1,
        benefits: ['Very low calorie', 'Low carb', 'Hydrating'],
      },
    ],
  },
  {
    id: 'fg4',
    original: 'Sour Cream',
    alternatives: [
      {
        id: 'fa8',
        name: 'Greek Yogurt',
        goal: 'Protein boost',
        calories: 60,
        protein: 10,
        carbs: 4,
        fat: 0.7,
        benefits: ['High protein', 'Probiotics', 'Lower fat'],
      },
      {
        id: 'fa9',
        name: 'Cottage Cheese',
        goal: 'Lean protein',
        calories: 72,
        protein: 12,
        carbs: 3,
        fat: 1,
        benefits: ['High protein', 'Low fat', 'Calcium-rich'],
      },
    ],
  },
];

const TIPS_FOR_ALTERNATIVES = [
  'Start with a 1:1 substitution ratio and adjust to your taste preference',
  'Some alternatives may change cooking times slightly',
  'Experiment with alternatives to find your favorites',
  'Remember: even small swaps can make a big difference over time',
];

// ─── Entity Class ─────────────────────────────────────────────────────────────

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

  // ── Legacy methods (Sprint 6) ─────────────────────────────────────────────

  // UC #74 - fetch all food alternatives (legacy axios)
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

  // UC #75 - fetch all mindful snacking tips (legacy axios)
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

  // ── Sprint 9 new methods (seeded stubs) ──────────────────────────────────

  // UC #75 Sprint 9 — returns full structured snacking content object
  // @return {Promise<{ success: boolean, data: object, message: string }>}
  static async fetchSnackingContent() {
    try {
      const res = await axios.get(`${API_URL}/mindful-snacking/content`);
      const normalized = this._normalizeSnackingContent(res.data?.data);

      if (!res.data?.success) {
        return {
          success: false,
          data: SNACKING_CONTENT,
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
        data: hasContent ? normalized : SNACKING_CONTENT,
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: SNACKING_CONTENT,
        message: err.response?.data?.message || 'Unable to load snacking content. Please try again.',
      };
    }
  }

  // Client-side filter for snack ideas by timing period
  // @param  {Array}  snackIdeas  — from snackingContent.snackIdeas
  // @param  {string} filter      — 'All' | 'Morning' | 'Afternoon' | 'Evening'
  // @return {Array}
  static filterSnackIdeas(snackIdeas, filter) {
    if (!filter || filter === 'All') return snackIdeas;
    return snackIdeas.filter((s) =>
      s.timing.toLowerCase().includes(filter.toLowerCase())
    );
  }

  // UC #74 Sprint 9 — returns grouped food alternatives + tips
  // @return {Promise<{ success: boolean, data: { groups, tips }, message: string }>}
  static async fetchFoodAlternativesGrouped() {
    try {
      const res = await axios.get(`${API_URL}/alternatives/grouped`);
      const normalized = this._normalizeAlternativesGrouped(res.data?.data);

      if (!res.data?.success) {
        return {
          success: false,
          data: { groups: FOOD_ALT_GROUPS, tips: TIPS_FOR_ALTERNATIVES },
          message: res.data?.message || 'Unable to load food alternatives. Please try again.',
        };
      }

      const hasGroups = normalized.groups.length > 0;

      return {
        success: true,
        data: hasGroups ? normalized : { groups: FOOD_ALT_GROUPS, tips: TIPS_FOR_ALTERNATIVES },
        message: res.data?.message || '',
      };
    } catch (err) {
      return {
        success: false,
        data: { groups: FOOD_ALT_GROUPS, tips: TIPS_FOR_ALTERNATIVES },
        message: err.response?.data?.message || 'Unable to load food alternatives. Please try again.',
      };
    }
  }

  // Client-side search across groups and their alternatives
  // @param  {Array}  groups  — FOOD_ALT_GROUPS
  // @param  {string} query
  // @return {Array}  filtered groups (alternatives within each group also filtered)
  static searchAlternatives(groups, query) {
    if (!query || query.trim() === '') return groups;
    const q = query.toLowerCase().trim();
    const result = [];
    for (const group of groups) {
      const originalMatch = group.original.toLowerCase().includes(q);
      if (originalMatch) {
        result.push(group);
        continue;
      }
      const filteredAlts = group.alternatives.filter(
        (a) => a.name.toLowerCase().includes(q) || a.goal.toLowerCase().includes(q)
      );
      if (filteredAlts.length > 0) {
        result.push({ ...group, alternatives: filteredAlts });
      }
    }
    return result;
  }
}

export default SmartEatingContent;
