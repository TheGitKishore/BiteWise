// SmartEatingContent.js — SEEDED (no axios)
// UC #74 View Healthier Food Alternatives
// UC #75 View Mindful Snacking Recommendations
// Static seeded content — no network call required

const FOOD_ALTERNATIVES = [
  {
    altId: 'fa1',
    category: 'Carbohydrates',
    original: 'White Rice',
    alternative: 'Cauliflower Rice',
    benefit: 'Cuts ~200 calories per cup and dramatically reduces carb load. High in vitamin C and fibre.',
    calorieSaving: '~200 kcal / cup',
    icon: '🥦',
  },
  {
    altId: 'fa2',
    category: 'Carbohydrates',
    original: 'White Bread',
    alternative: 'Whole Grain Bread',
    benefit: 'Higher fibre keeps you fuller longer and causes a slower blood sugar rise.',
    calorieSaving: 'Same calories, better quality',
    icon: '🍞',
  },
  {
    altId: 'fa3',
    category: 'Dairy',
    original: 'Sour Cream',
    alternative: 'Greek Yoghurt (Plain)',
    benefit: 'Nearly identical texture with 3x the protein and significantly less fat.',
    calorieSaving: '~100 kcal / 100g',
    icon: '🥛',
  },
  {
    altId: 'fa4',
    category: 'Snacks',
    original: 'Potato Chips',
    alternative: 'Air-Popped Popcorn',
    benefit: 'Same satisfying crunch with 60% fewer calories and a whole grain serving.',
    calorieSaving: '~90 kcal / serving',
    icon: '🍿',
  },
  {
    altId: 'fa5',
    category: 'Protein',
    original: 'Ground Beef (Fatty)',
    alternative: 'Ground Turkey (Lean)',
    benefit: 'Lower saturated fat while maintaining protein content. Better for heart health.',
    calorieSaving: '~80 kcal / 100g',
    icon: '🥩',
  },
  {
    altId: 'fa6',
    category: 'Drinks',
    original: 'Fruit Juice',
    alternative: 'Whole Fruit + Water',
    benefit: 'Preserves fibre that slows sugar absorption. Far less blood sugar impact.',
    calorieSaving: '~100 kcal / glass',
    icon: '🍊',
  },
  {
    altId: 'fa7',
    category: 'Fats',
    original: 'Butter',
    alternative: 'Avocado or Olive Oil',
    benefit: 'Replaces saturated fat with heart-healthy monounsaturated fats.',
    calorieSaving: 'Similar calories, better fat profile',
    icon: '🥑',
  },
  {
    altId: 'fa8',
    category: 'Sweeteners',
    original: 'Sugar',
    alternative: 'Cinnamon or Vanilla Extract',
    benefit: 'Adds sweetness perception without calories. Cinnamon also helps regulate blood sugar.',
    calorieSaving: '~50 kcal / tsp',
    icon: '🫙',
  },
];

const SNACKING_TIPS = [
  {
    tipId: 'st1',
    title: 'Plan Snacks in Advance',
    content: 'Prepare snacks at the start of each day. When hunger hits between meals, you'll reach for what's ready rather than what's convenient. Portion out nuts, cut vegetables, or prep yoghurt parfaits the night before.',
    category: 'Planning',
    icon: '📋',
  },
  {
    tipId: 'st2',
    title: 'Eat Protein at Every Snack',
    content: 'A snack with at least 10g of protein will keep you full for 2-3 hours. Pair carbohydrates with protein — apple slices with almond butter, or crackers with cottage cheese — to prevent blood sugar spikes.',
    category: 'Nutrition',
    icon: '💪',
  },
  {
    tipId: 'st3',
    title: 'Check Hunger Before You Eat',
    content: 'Before reaching for a snack, rate your hunger 1-10. If you are at 5 or below, drink a glass of water and wait 15 minutes. Many snack urges are actually thirst or boredom rather than genuine hunger.',
    category: 'Mindfulness',
    icon: '🧠',
  },
  {
    tipId: 'st4',
    title: 'The 200-Calorie Rule',
    content: 'A satisfying snack sits between 150-250 calories. Below 150 often leaves you unsatisfied and reaching for more. Above 300 starts eating into your meal calorie budget. BiteWise logs snacks in your daily total automatically.',
    category: 'Portion Control',
    icon: '⚖️',
  },
  {
    tipId: 'st5',
    title: 'Best Snacks by Goal',
    content: 'Weight loss: raw vegetables with hummus, boiled eggs, or a small handful of nuts.\n\nMuscle gain: Greek yoghurt with granola, protein shake with banana, or cottage cheese with fruit.\n\nEnergy maintenance: whole grain crackers with peanut butter, or a piece of fruit with cheese.',
    category: 'Goal-Based',
    icon: '🎯',
  },
  {
    tipId: 'st6',
    title: 'Timing Your Snacks',
    content: 'The ideal snacking window is 2-3 hours after a meal and at least 1.5 hours before the next meal. This keeps metabolism steady and prevents the energy crashes that lead to overeating. Avoid snacking within 2 hours of bedtime.',
    category: 'Timing',
    icon: '⏰',
  },
];

class SmartEatingContent {
  // ─── FOOD ALTERNATIVES ─────────────────────────────────────────────────────

  // UC #74 — fetch all food alternatives
  static async fetchAlternatives() {
    return {
      success: true,
      data:    FOOD_ALTERNATIVES.map(a => ({ ...a })),
      message: '',
    };
  }

  // Filter alternatives by category
  static filterByCategory(alternatives, category) {
    if (!category || category === 'All') return alternatives;
    return alternatives.filter(a => a.category === category);
  }

  static getCategories(alternatives) {
    return ['All', ...new Set(alternatives.map(a => a.category))];
  }

  // ─── MINDFUL SNACKING ──────────────────────────────────────────────────────

  // UC #75 — fetch all mindful snacking tips
  static async fetchSnackingTips() {
    return {
      success: true,
      data:    SNACKING_TIPS.map(t => ({ ...t })),
      message: '',
    };
  }
}

export default SmartEatingContent;
