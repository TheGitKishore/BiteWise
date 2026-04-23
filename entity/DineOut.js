// DineOut.js — Sprint 9: New entity
// UC NEW-E — Premium User View Dine Out Options
// Seeded restaurant data with menu items. No axios (Sprint 9 — seeded only).
// Each restaurant has items with calorie and macro data that can be matched
// against a user's remaining daily nutrition targets.

const SEED_RESTAURANTS = [
  {
    restaurantId: 'r1',
    name:         'GreenBowl Kitchen',
    cuisine:      'Healthy Bowls',
    emoji:        '🥗',
    priceRange:   '$$',
    address:      '12 Orchard Road, Singapore',
    rating:       4.7,
    menuItems: [
      { itemId: 'r1m1', name: 'High-Protein Salmon Bowl',       calories: 520, protein: 42, carbs: 38, fat: 18, tags: ['high-protein','omega-3'],   price: 16.90 },
      { itemId: 'r1m2', name: 'Quinoa Veggie Bowl',              calories: 380, protein: 14, carbs: 52, fat: 12, tags: ['vegetarian','high-fiber'],  price: 13.90 },
      { itemId: 'r1m3', name: 'Chicken Pesto Wrap (Low Carb)',   calories: 310, protein: 35, carbs: 15, fat: 13, tags: ['low-carb','high-protein'],  price: 14.90 },
    ],
  },
  {
    restaurantId: 'r2',
    name:         'Macro Bar',
    cuisine:      'Performance Nutrition',
    emoji:        '💪',
    priceRange:   '$$',
    address:      '8 Marina Bay Link, Singapore',
    rating:       4.5,
    menuItems: [
      { itemId: 'r2m1', name: 'Athlete Protein Plate',           calories: 650, protein: 55, carbs: 45, fat: 22, tags: ['high-protein','athlete'],  price: 19.90 },
      { itemId: 'r2m2', name: 'Post-Workout Chicken Rice',        calories: 580, protein: 40, carbs: 60, fat: 14, tags: ['recovery','high-carb'],    price: 15.90 },
      { itemId: 'r2m3', name: 'Lean Turkey Salad',                calories: 290, protein: 32, carbs: 12, fat: 10, tags: ['low-cal','lean-protein'], price: 13.50 },
    ],
  },
  {
    restaurantId: 'r3',
    name:         'The Wholesome Table',
    cuisine:      'Clean Eating',
    emoji:        '🌿',
    priceRange:   '$',
    address:      '55 Tiong Bahru Road, Singapore',
    rating:       4.6,
    menuItems: [
      { itemId: 'r3m1', name: 'Classic Avocado Toast',            calories: 320, protein: 10, carbs: 38, fat: 16, tags: ['vegetarian','healthy-fats'], price: 11.90 },
      { itemId: 'r3m2', name: 'Egg White Omelette',               calories: 200, protein: 22, carbs: 4,  fat: 9,  tags: ['low-cal','high-protein'],    price: 10.90 },
      { itemId: 'r3m3', name: 'Overnight Oats Bowl',              calories: 410, protein: 16, carbs: 58, fat: 10, tags: ['breakfast','fiber-rich'],    price: 9.90  },
    ],
  },
  {
    restaurantId: 'r4',
    name:         'FuelFit Café',
    cuisine:      'Sports Nutrition',
    emoji:        '🏋️',
    priceRange:   '$$',
    address:      '2 Kallang Avenue, Singapore',
    rating:       4.4,
    menuItems: [
      { itemId: 'r4m1', name: 'Grilled Fish & Sweet Potato',      calories: 490, protein: 38, carbs: 42, fat: 14, tags: ['balanced','omega-3'],       price: 17.90 },
      { itemId: 'r4m2', name: 'Keto Beef Lettuce Wrap',           calories: 340, protein: 30, carbs: 6,  fat: 22, tags: ['keto','low-carb'],           price: 15.90 },
      { itemId: 'r4m3', name: 'Protein Smoothie Bowl',            calories: 350, protein: 28, carbs: 32, fat: 8,  tags: ['high-protein','breakfast'],  price: 12.90 },
    ],
  },
  {
    restaurantId: 'r5',
    name:         'Nourish Bistro',
    cuisine:      'Mediterranean',
    emoji:        '🫒',
    priceRange:   '$$$',
    address:      '10 Craig Road, Singapore',
    rating:       4.8,
    menuItems: [
      { itemId: 'r5m1', name: 'Grilled Chicken Souvlaki',         calories: 420, protein: 38, carbs: 28, fat: 16, tags: ['mediterranean','high-protein'], price: 22.00 },
      { itemId: 'r5m2', name: 'Greek Salad with Feta',            calories: 280, protein: 10, carbs: 14, fat: 20, tags: ['vegetarian','mediterranean'],   price: 14.00 },
      { itemId: 'r5m3', name: 'Hummus & Pita Platter',            calories: 380, protein: 14, carbs: 48, fat: 14, tags: ['vegetarian','fiber-rich'],      price: 12.00 },
    ],
  },
];

class DineOut {
  constructor({
    restaurantId = null,
    name         = '',
    cuisine      = '',
    emoji        = '🍽️',
    priceRange   = '$',
    address      = '',
    rating       = 0,
    menuItems    = [],
  } = {}) {
    this.restaurantId = restaurantId;
    this.name         = name;
    this.cuisine      = cuisine;
    this.emoji        = emoji;
    this.priceRange   = priceRange;
    this.address      = address;
    this.rating       = rating;
    this.menuItems    = menuItems;
  }

  // Get menu items fitting within remaining calorie budget (with 10% buffer)
  getMatchingItems(remainingCalories) {
    const budget = remainingCalories > 0 ? remainingCalories * 1.1 : Infinity;
    return this.menuItems.filter(item => item.calories <= budget);
  }

  hasMatchingItems(remainingCalories) {
    return this.getMatchingItems(remainingCalories).length > 0;
  }

  // ─── DATA ACCESS — SEEDED ──────────────────────────────────────────────────

  // Fetch all restaurants (unfiltered)
  // @return {Promise<{ success, data, message }>}
  static async fetchAll() {
    return {
      success: true,
      data: SEED_RESTAURANTS.map(r => new DineOut(r)),
      message: '',
    };
  }

  // Fetch restaurants with menu items matching remaining calorie budget.
  // Each restaurant returned has a filteredItems array.
  // @param  {number} remainingCalories
  // @return {Promise<{ success, data, message }>}
  static async fetchMatchingRestaurants(remainingCalories) {
    const budget = remainingCalories > 0 ? remainingCalories : 99999;
    const restaurants = SEED_RESTAURANTS.map(r => new DineOut(r));

    const matching = restaurants
      .map(r => ({
        ...r,
        filteredItems: r.getMatchingItems(budget),
      }))
      .filter(r => r.filteredItems.length > 0);

    return {
      success: true,
      data:    matching,
      message: matching.length === 0 ? 'No restaurant options match your current budget.' : '',
    };
  }

  // Client-side helpers
  static getCuisines(restaurants) {
    return ['All', ...new Set(restaurants.map(r => r.cuisine))];
  }

  static filterByCuisine(restaurants, cuisine) {
    if (!cuisine || cuisine === 'All') return restaurants;
    return restaurants.filter(r => r.cuisine === cuisine);
  }

  static search(restaurants, query) {
    if (!query || query.trim() === '') return restaurants;
    const q = query.toLowerCase();
    return restaurants.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      (r.filteredItems || r.menuItems || []).some(item => item.name.toLowerCase().includes(q))
    );
  }
}

export default DineOut;
