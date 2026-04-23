// SmartEatingContent.js — Sprint 9 UI Refactor
// UC #74 Healthier Food Alternatives: switched from flat axios list to
//         seeded grouped structure (by original food) with search.
// UC #75 Mindful Snacking Guide: switched from flat axios tips to
//         seeded structured content (principles, cravings, whenToSnack,
//         snackIdeas, portionControl, warning sections).
// All Sprint 9 additions are seeded stubs — no axios for new methods.
// Legacy fetchAlternatives() and fetchSnackingTips() kept for backward compat.

// ─── SEEDED: MINDFUL SNACKING ─────────────────────────────────────────────────
const SNACKING_CONTENT = {
  principles: [
    { id: 'p1', title: 'Listen to Your Body',
      description: "Distinguish between true hunger and emotional eating. Wait 10 minutes before snacking." },
    { id: 'p2', title: 'Plan Ahead',
      description: "Pre-portion snacks and keep healthy options readily available to avoid impulsive choices." },
    { id: 'p3', title: 'Balance Your Macros',
      description: "Combine protein with fiber for lasting satiety and stable blood sugar levels." },
    { id: 'p4', title: 'Eat Slowly',
      description: "Take time to chew and enjoy your snack. It takes 20 minutes for fullness signals to reach your brain." },
  ],
  cravings: [
    { id: 'c1', title: 'The 5-Minute Rule',
      description: "When a craving hits, wait 5 minutes and drink a glass of water. Often, cravings pass or you realize you're just thirsty.",
      borderColor: '#7C3AED' },
    { id: 'c2', title: 'Identify Triggers',
      description: "Common triggers: stress, boredom, fatigue, or specific times of day. Keep a log to identify your patterns.",
      borderColor: '#2563EB' },
    { id: 'c3', title: 'Healthy Substitutions',
      description: "Sweet craving? Try fruit or Greek yogurt. Salty craving? Opt for nuts or popcorn instead of chips.",
      borderColor: '#16A34A' },
    { id: 'c4', title: 'The 80/20 Rule',
      description: "Eat nutritious foods 80% of the time. Allow yourself treats 20% of the time without guilt.",
      borderColor: '#EA580C' },
  ],
  whenToSnack: [
    { id: 'w1', label: 'Morning (10-11 AM)',
      description: "If breakfast was light or early, a small snack prevents overeating at lunch.",
      best: 'Protein + Fruit', bestColor: '#7C3AED', bgColor: '#F5F3FF' },
    { id: 'w2', label: 'Afternoon (3-4 PM)',
      description: "Energy dip time. Choose snacks that provide sustained energy without a crash.",
      best: 'Complex Carbs + Protein', bestColor: '#2563EB', bgColor: '#EFF6FF' },
    { id: 'w3', label: 'Evening (Optional)',
      description: "Only if dinner was early or light. Choose lighter options that won't disrupt sleep.",
      best: 'Protein-Rich, Low-Fat', bestColor: '#16A34A', bgColor: '#F0FDF4' },
  ],
  snackIdeas: [
    { id: 's1', name: 'Greek Yogurt with Berries',     cal: 150, protein: 15, fiber: 3, timing: 'Mid-morning', timingFilter: 'Morning',   benefits: ['High protein', 'Probiotics', 'Antioxidants'] },
    { id: 's2', name: 'Apple Slices with Almond Butter', cal: 180, protein: 4, fiber: 5, timing: 'Afternoon',  timingFilter: 'Afternoon', benefits: ['Fiber-rich', 'Healthy fats', 'Sustained energy'] },
    { id: 's3', name: 'Handful of Mixed Nuts',         cal: 170, protein: 6, fiber: 3, timing: 'Anytime',    timingFilter: 'All',       benefits: ['Heart-healthy fats', 'Satisfying', 'Nutrient-dense'] },
    { id: 's4', name: 'Hummus with Veggie Sticks',     cal: 130, protein: 5, fiber: 4, timing: 'Afternoon',  timingFilter: 'Afternoon', benefits: ['Plant protein', 'Crunchy satisfaction', 'Vitamins'] },
    { id: 's5', name: 'Cottage Cheese with Pineapple', cal: 140, protein: 14, fiber: 1, timing: 'Morning',   timingFilter: 'Morning',   benefits: ['High protein', 'Low fat', 'Calcium-rich'] },
    { id: 's6', name: 'Edamame',                       cal: 120, protein: 11, fiber: 5, timing: 'Evening',   timingFilter: 'Evening',   benefits: ['Plant protein', 'Low calorie', 'Filling'] },
  ],
  portionControl: {
    visualGuides: [
      { item: 'Nuts',       guide: 'A small handful (about 1/4 cup)' },
      { item: 'Cheese',     guide: 'Size of 2 dice (about 1 oz)' },
      { item: 'Hummus',     guide: 'Golf ball size (about 2 tbsp)' },
      { item: 'Nut Butter', guide: 'Poker chip size (about 1 tbsp)' },
    ],
    strategies: [
      'Divide large packages into single servings immediately',
      'Use small bowls or containers to avoid overeating',
      'Never eat directly from the package',
      'Keep a measuring cup handy in your pantry',
    ],
  },
  warning: {
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

// ─── SEEDED: FOOD ALTERNATIVES (grouped by original food) ────────────────────
const FOOD_ALT_GROUPS = [
  {
    id: 'g1', originalFood: 'White Rice', icon: '🍽️',
    alternatives: [
      { id: 'fa1', name: 'Brown Rice',       goal: 'Weight management', cal: 110, protein: '2.6g', carbs: '23g', fat: '0.9g', benefits: ['Higher fiber', 'More vitamins', 'Better blood sugar control'] },
      { id: 'fa2', name: 'Cauliflower Rice', goal: 'Low-carb diets',    cal: 25,  protein: '2g',   carbs: '5g',  fat: '0.3g', benefits: ['Very low calorie', 'Low carb', 'High in vitamins'] },
      { id: 'fa3', name: 'Quinoa',           goal: 'Protein intake',    cal: 120, protein: '4g',   carbs: '21g', fat: '1.9g', benefits: ['Complete protein', 'High fiber', 'Gluten-free'] },
    ],
  },
  {
    id: 'g2', originalFood: 'Butter', icon: '🧈',
    alternatives: [
      { id: 'fa4', name: 'Avocado Oil', goal: 'Cooking',       cal: 120, protein: '0g', carbs: '0g', fat: '14g', benefits: ['Heart-healthy fats', 'High smoke point', 'Monounsaturated'] },
      { id: 'fa5', name: 'Nut Butter',  goal: 'Nutrient boost', cal: 95,  protein: '3g', carbs: '3g', fat: '8g',  benefits: ['Protein', 'Healthy fats', 'Satisfying'] },
    ],
  },
  {
    id: 'g3', originalFood: 'White Bread', icon: '🍞',
    alternatives: [
      { id: 'fa6', name: 'Whole Grain Bread', goal: 'Fibre boost',    cal: 80, protein: '4g',   carbs: '15g', fat: '1g',   benefits: ['Higher fiber', 'More nutrients', 'Slower digestion'] },
      { id: 'fa7', name: 'Lettuce Wrap',      goal: 'Low-carb diets', cal: 5,  protein: '0.5g', carbs: '1g',  fat: '0.1g', benefits: ['Near-zero carb', 'Hydrating', 'Very low calorie'] },
    ],
  },
  {
    id: 'g4', originalFood: 'Sour Cream', icon: '🥄',
    alternatives: [
      { id: 'fa8', name: 'Greek Yogurt', goal: 'Protein intake', cal: 60, protein: '10g', carbs: '4g', fat: '0.7g', benefits: ['High protein', 'Probiotics', 'Lower fat'] },
    ],
  },
];

const TIPS_FOR_ALTERNATIVES = [
  'Start with a 1:1 substitution ratio and adjust to your taste preference',
  'Some alternatives may change cooking times slightly',
  'Experiment with alternatives to find your favorites',
  'Remember: even small swaps can make a big difference over time',
];

class SmartEatingContent {
  // ─── UC #75 NEW: full structured snacking content (Sprint 9) ──────────────
  // @return {Promise<{ success, data: SNACKING_CONTENT, message }>}
  static async fetchSnackingContent() {
    return { success: true, data: SNACKING_CONTENT, message: '' };
  }

  // Filter snack ideas by timing tab ('All' | 'Morning' | 'Afternoon' | 'Evening')
  static filterSnackIdeas(snackIdeas, filter) {
    if (!filter || filter === 'All') return snackIdeas;
    return snackIdeas.filter(s => s.timingFilter === filter || s.timingFilter === 'All');
  }

  // ─── UC #74 NEW: grouped food alternatives with search (Sprint 9) ─────────
  // @return {Promise<{ success, data: FOOD_ALT_GROUPS[], tips: string[], message }>}
  static async fetchFoodAlternativesGrouped() {
    return { success: true, data: FOOD_ALT_GROUPS, tips: TIPS_FOR_ALTERNATIVES, message: '' };
  }

  // Search across groups by food name, original food name, or goal label
  static searchAlternatives(groups, query) {
    if (!query || query.trim() === '') return groups;
    const q = query.toLowerCase();
    return groups
      .map(g => ({
        ...g,
        alternatives: g.alternatives.filter(a =>
          a.name.toLowerCase().includes(q) ||
          g.originalFood.toLowerCase().includes(q) ||
          a.goal.toLowerCase().includes(q)
        ),
      }))
      .filter(g => g.alternatives.length > 0);
  }

  // ─── LEGACY — kept for backward compat with Sprint 6 callers ──────────────
  static async fetchAlternatives() {
    const flat = FOOD_ALT_GROUPS.flatMap(g =>
      g.alternatives.map(a => ({
        altId: a.id, original: g.originalFood, alternative: a.name,
        benefit: a.benefits.join(', '),
        calorieSaving: `Save ~${Math.max(0, 200 - a.cal)} kcal`,
        category: a.goal, icon: g.icon,
      }))
    );
    return { success: true, data: flat, message: '' };
  }

  static filterByCategory(alternatives, category) {
    if (!category || category === 'All') return alternatives;
    return alternatives.filter(a => a.category === category);
  }

  static getCategories(alternatives) {
    return ['All', ...new Set(alternatives.map(a => a.category))];
  }

  static async fetchSnackingTips() {
    const tips = SNACKING_CONTENT.principles.map((p, i) => ({
      tipId: `tip_${i + 1}`, title: p.title, content: p.description,
      category: 'Mindfulness', icon: '🧘',
    }));
    return { success: true, data: tips, message: '' };
  }
}

export default SmartEatingContent;
