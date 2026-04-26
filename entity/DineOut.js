// DineOut.js — Sprint 9 Task 6
// Entity for Dine Out Options feature (Premium).
// Seeded stub — no axios. Backend wiring to be done separately.
//
// Seed data: 5 restaurants, 3 menu items each.
// Static methods: fetchAll(), fetchMatchingRestaurants(remainingCalories),
//                 getCuisines(), filterByCuisine(), search()

// ── Seed Data ─────────────────────────────────────────────────────────────────

const RESTAURANTS = [
  {
    restaurantId: 'r1',
    name:         'GreenBowl Kitchen',
    cuisine:      'Healthy Bowls',
    priceRange:   '$$',
    rating:       4.7,
    address:      '12 Orchard Link, Singapore 238838',
    emoji:        '🥗',
    description:  'Wholesome grain bowls and fresh salads tailored for clean eating.',
    menuItems: [
      {
        itemId:   'r1_m1',
        name:     'Quinoa Power Bowl',
        calories: 420,
        protein:  28,
        carbs:    48,
        fat:      11,
        price:    12.90,
        tags:     ['high-protein', 'gluten-free', 'vegetarian'],
      },
      {
        itemId:   'r1_m2',
        name:     'Teriyaki Chicken Bowl',
        calories: 510,
        protein:  38,
        carbs:    55,
        fat:      10,
        price:    13.90,
        tags:     ['high-protein', 'low-fat'],
      },
      {
        itemId:   'r1_m3',
        name:     'Garden Greens Salad',
        calories: 210,
        protein:  9,
        carbs:    18,
        fat:      12,
        price:    9.90,
        tags:     ['low-calorie', 'vegetarian', 'vegan'],
      },
    ],
  },
  {
    restaurantId: 'r2',
    name:         'Macro Bar',
    cuisine:      'Performance Nutrition',
    priceRange:   '$$$',
    rating:       4.8,
    address:      '3 Stadium Walk, Singapore 397692',
    emoji:        '💪',
    description:  'Precision nutrition for athletes. Every meal is macro-tracked.',
    menuItems: [
      {
        itemId:   'r2_m1',
        name:     'Athlete\'s Chicken Plate',
        calories: 650,
        protein:  55,
        carbs:    60,
        fat:      14,
        price:    18.90,
        tags:     ['high-protein', 'meal-prep'],
      },
      {
        itemId:   'r2_m2',
        name:     'Egg White Omelette',
        calories: 280,
        protein:  32,
        carbs:    8,
        fat:      9,
        price:    12.50,
        tags:     ['high-protein', 'low-carb', 'breakfast'],
      },
      {
        itemId:   'r2_m3',
        name:     'Salmon & Sweet Potato',
        calories: 580,
        protein:  42,
        carbs:    52,
        fat:      16,
        price:    19.90,
        tags:     ['high-protein', 'omega-3'],
      },
    ],
  },
  {
    restaurantId: 'r3',
    name:         'The Wholesome Table',
    cuisine:      'Clean Eating',
    priceRange:   '$$',
    rating:       4.5,
    address:      '68 Circular Road, Singapore 049422',
    emoji:        '🌿',
    description:  'Ingredient-first cooking. No processed foods, no shortcuts.',
    menuItems: [
      {
        itemId:   'r3_m1',
        name:     'Avocado Toast & Eggs',
        calories: 380,
        protein:  18,
        carbs:    34,
        fat:      19,
        price:    11.50,
        tags:     ['breakfast', 'vegetarian', 'healthy-fats'],
      },
      {
        itemId:   'r3_m2',
        name:     'Brown Rice Stir Fry',
        calories: 440,
        protein:  22,
        carbs:    62,
        fat:      9,
        price:    10.90,
        tags:     ['vegetarian', 'vegan', 'gluten-free'],
      },
      {
        itemId:   'r3_m3',
        name:     'Grilled Barramundi',
        calories: 320,
        protein:  36,
        carbs:    14,
        fat:      10,
        price:    16.90,
        tags:     ['high-protein', 'low-carb', 'omega-3'],
      },
    ],
  },
  {
    restaurantId: 'r4',
    name:         'FuelFit Café',
    cuisine:      'Sports Nutrition',
    priceRange:   '$$',
    rating:       4.6,
    address:      '21 Kallang Avenue, Singapore 339412',
    emoji:        '⚡',
    description:  'Pre- and post-workout meals built to fuel your performance.',
    menuItems: [
      {
        itemId:   'r4_m1',
        name:     'Pre-Workout Oats Bowl',
        calories: 350,
        protein:  16,
        carbs:    58,
        fat:      6,
        price:    9.50,
        tags:     ['breakfast', 'energy', 'vegetarian'],
      },
      {
        itemId:   'r4_m2',
        name:     'Post-Workout Protein Wrap',
        calories: 490,
        protein:  44,
        carbs:    42,
        fat:      12,
        price:    13.90,
        tags:     ['high-protein', 'meal-prep'],
      },
      {
        itemId:   'r4_m3',
        name:     'Recovery Smoothie Bowl',
        calories: 310,
        protein:  20,
        carbs:    45,
        fat:      5,
        price:    10.90,
        tags:     ['breakfast', 'low-fat', 'vegetarian'],
      },
    ],
  },
  {
    restaurantId: 'r5',
    name:         'Nourish Bistro',
    cuisine:      'Mediterranean',
    priceRange:   '$$$',
    rating:       4.9,
    address:      '5 Keong Saik Road, Singapore 089114',
    emoji:        '🫒',
    description:  'Mediterranean diet staples — heart-healthy, flavour-forward.',
    menuItems: [
      {
        itemId:   'r5_m1',
        name:     'Greek Salad with Falafel',
        calories: 360,
        protein:  14,
        carbs:    38,
        fat:      16,
        price:    13.50,
        tags:     ['vegetarian', 'vegan', 'mediterranean'],
      },
      {
        itemId:   'r5_m2',
        name:     'Grilled Chicken Souvlaki',
        calories: 480,
        protein:  40,
        carbs:    32,
        fat:      14,
        price:    16.90,
        tags:     ['high-protein', 'mediterranean', 'gluten-free'],
      },
      {
        itemId:   'r5_m3',
        name:     'Hummus & Pita Plate',
        calories: 290,
        protein:  10,
        carbs:    40,
        fat:      10,
        price:    9.90,
        tags:     ['vegetarian', 'vegan', 'mediterranean'],
      },
    ],
  },
];

// ── Entity Class ──────────────────────────────────────────────────────────────

class DineOut {

  constructor({
    restaurantId = null,
    name         = '',
    cuisine      = '',
    priceRange   = '$$',
    rating       = 0,
    address      = '',
    emoji        = '🍽️',
    description  = '',
    menuItems    = [],
  } = {}) {
    this.restaurantId = restaurantId;
    this.name         = name;
    this.cuisine      = cuisine;
    this.priceRange   = priceRange;
    this.rating       = rating;
    this.address      = address;
    this.emoji        = emoji;
    this.description  = description;
    this.menuItems    = menuItems;
  }

  // ── Static methods ────────────────────────────────────────────────────────

  // UC T6 — Fetch all seeded restaurants.
  // @return {Promise<{ success, data: DineOut[], message }>}
  static async fetchAll() {
    const data = RESTAURANTS.map((r) => new DineOut(r));
    return { success: true, data, message: '' };
  }

  // UC T6 — Filter restaurants to those with at least one menu item
  // whose calories fit within the user's remaining budget (× 1.1 tolerance).
  // Also annotates each restaurant with a matchingItems array.
  //
  // @param  {number} remainingCalories
  // @return {Promise<{ success, data: Array<DineOut & { matchingItems }>, message }>}
  static async fetchMatchingRestaurants(remainingCalories) {
    const all    = RESTAURANTS;
    const budget = (remainingCalories || 0) * 1.1;

    const result = all
      .map((r) => {
        const matchingItems = budget > 0
          ? r.menuItems.filter((item) => item.calories <= budget)
          : r.menuItems;                     // if no budget context show all
        return { ...new DineOut(r), matchingItems };
      })
      .filter((r) => r.matchingItems.length > 0)
      .sort((a, b) => b.matchingItems.length - a.matchingItems.length); // most matches first

    return { success: true, data: result, message: '' };
  }

  // UC T6 — Return unique cuisine labels from all restaurants.
  // @return {string[]}  e.g. ['All', 'Healthy Bowls', 'Performance Nutrition', …]
  static getCuisines() {
    const unique = [...new Set(RESTAURANTS.map((r) => r.cuisine))];
    return ['All', ...unique];
  }

  // UC T6 — Filter a restaurant list by cuisine label (client-side).
  // @param  {DineOut[]} restaurants
  // @param  {string}    cuisine      — 'All' returns full list
  // @return {DineOut[]}
  static filterByCuisine(restaurants, cuisine) {
    if (!cuisine || cuisine === 'All') return restaurants;
    return restaurants.filter((r) => r.cuisine === cuisine);
  }

  // UC T6 — Search restaurants by name, cuisine, or menu item name (client-side).
  // @param  {DineOut[]} restaurants
  // @param  {string}    query
  // @return {DineOut[]}
  static search(restaurants, query) {
    if (!query || query.trim() === '') return restaurants;
    const q = query.trim().toLowerCase();
    return restaurants.filter((r) =>
      r.name.toLowerCase().includes(q) ||
      r.cuisine.toLowerCase().includes(q) ||
      (r.matchingItems || r.menuItems).some((item) =>
        item.name.toLowerCase().includes(q) ||
        (item.tags || []).some((t) => t.toLowerCase().includes(q))
      )
    );
  }
}

export default DineOut;
