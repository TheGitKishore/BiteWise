class FoodItem {
  constructor({
    foodItemId = null,
    name       = '',
    calories   = 0,      // kcal per serving
    protein    = 0,      // g
    carbs      = 0,      // g
    fat        = 0,      // g
    serving    = '',     // e.g. '1 medium', '100g', '1 cup'
    category   = '',     // e.g. 'Fruit', 'Protein', 'Snack'
    isCustom   = false,
  } = {}) {
    this.foodItemId = foodItemId;
    this.name       = name;
    this.calories   = calories;
    this.protein    = protein;
    this.carbs      = carbs;
    this.fat        = fat;
    this.serving    = serving;
    this.category   = category;
    this.isCustom   = isCustom;
  }

  // Returns "95 kcal • 1 medium" for display in food rows
  getDisplayMeta() {
    return `${this.calories} kcal • ${this.serving}`;
  }


  // STATIC / COLLECTION METHODS

  // UC #15, #50 — client-side search filter
  // @param  {FoodItem[]} items
  // @param  {string}     query
  // @return {FoodItem[]}
  static filterBySearch(items, query) {
    if (!query || query.trim().length === 0) return items;
    const lower = query.trim().toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(lower));
  }

  // Alt Flow 1a guard
  // @param  {FoodItem[]} items
  // @return {boolean}
  static hasItems(items) {
    return items.length > 0;
  }


  // DATA ACCESS
  // Replace w API calls
  /*
    static async fetchAll() {
      const res = await axios.get(`${API_URL}/fooditems`);
      return res.data.map((r) => new FoodItem(r));
    }
  */

  // @return {Promise<{ success: boolean, data: FoodItem[], message: string }>}
  static async fetchAll() {
    const raw = [
      { foodItemId: 1,  name: 'Apple',                  calories: 95,  protein: 0.5, carbs: 25, fat: 0.3,  serving: '1 medium',     category: 'Fruit' },
      { foodItemId: 2,  name: 'Banana',                 calories: 105, protein: 1.3, carbs: 27, fat: 0.4,  serving: '1 medium',     category: 'Fruit' },
      { foodItemId: 3,  name: 'Sweet Potato',           calories: 112, protein: 2.1, carbs: 26, fat: 0.1,  serving: '1 medium',     category: 'Vegetable' },
      { foodItemId: 4,  name: 'Almonds',                calories: 164, protein: 6,   carbs: 6,  fat: 14,   serving: '28g',          category: 'Nuts' },
      { foodItemId: 5,  name: 'Orange',                 calories: 62,  protein: 1.2, carbs: 15, fat: 0.2,  serving: '1 medium',     category: 'Fruit' },
      { foodItemId: 6,  name: 'Strawberries',           calories: 49,  protein: 1,   carbs: 12, fat: 0.5,  serving: '1 cup',        category: 'Fruit' },
      { foodItemId: 7,  name: 'Blueberries',            calories: 84,  protein: 1.1, carbs: 21, fat: 0.5,  serving: '1 cup',        category: 'Fruit' },
      { foodItemId: 8,  name: 'Grapes',                 calories: 104, protein: 1.1, carbs: 27, fat: 0.2,  serving: '1 cup',        category: 'Fruit' },
      { foodItemId: 9,  name: 'Watermelon',             calories: 46,  protein: 0.9, carbs: 11, fat: 0.2,  serving: '1 cup diced',  category: 'Fruit' },
      { foodItemId: 10, name: 'Mango',                  calories: 99,  protein: 1.4, carbs: 25, fat: 0.6,  serving: '1 cup sliced', category: 'Fruit' },
      { foodItemId: 11, name: 'Pineapple',              calories: 82,  protein: 0.9, carbs: 22, fat: 0.2,  serving: '1 cup chunks', category: 'Fruit' },
      { foodItemId: 12, name: 'Avocado',                calories: 234, protein: 2.9, carbs: 12, fat: 21,   serving: '1 medium',     category: 'Fruit' },
      { foodItemId: 13, name: 'Chicken Breast',         calories: 165, protein: 31,  carbs: 0,  fat: 3.6,  serving: '100g',         category: 'Protein' },
      { foodItemId: 14, name: 'Chicken Thigh',          calories: 209, protein: 26,  carbs: 0,  fat: 11,   serving: '100g',         category: 'Protein' },
      { foodItemId: 15, name: 'Ground Beef (Lean)',     calories: 250, protein: 26,  carbs: 0,  fat: 15,   serving: '100g',         category: 'Protein' },
      { foodItemId: 16, name: 'Turkey Breast',          calories: 135, protein: 30,  carbs: 0,  fat: 1,    serving: '100g',         category: 'Protein' },
      { foodItemId: 17, name: 'Dark Chocolate',         calories: 170, protein: 2,   carbs: 13, fat: 12,   serving: '28g',          category: 'Snack' },
      { foodItemId: 18, name: 'Honey',                  calories: 64,  protein: 0.1, carbs: 17, fat: 0,    serving: '1 tbsp',       category: 'Condiment' },
      { foodItemId: 19, name: 'Olive Oil',              calories: 119, protein: 0,   carbs: 0,  fat: 14,   serving: '1 tbsp',       category: 'Condiment' },
      { foodItemId: 20, name: 'Popcorn',                calories: 31,  protein: 1,   carbs: 6,  fat: 0.4,  serving: '1 cup popped', category: 'Snack' },
      { foodItemId: 21, name: 'Pizza Slice',            calories: 285, protein: 12,  carbs: 36, fat: 10,   serving: '1 slice',      category: 'Fast Food' },
      { foodItemId: 22, name: 'Hamburger',              calories: 354, protein: 20,  carbs: 29, fat: 17,   serving: '1 burger',     category: 'Fast Food' },
      { foodItemId: 23, name: 'French Fries',           calories: 365, protein: 4,   carbs: 48, fat: 17,   serving: '100g',         category: 'Fast Food' },
      { foodItemId: 24, name: 'Grilled Chicken Breast', calories: 165, protein: 31,  carbs: 0,  fat: 3.6,  serving: '100g',         category: 'Protein' },
    ];

    return {
      success: true,
      data:    raw.map((r) => new FoodItem(r)),
      message: '',
    };
  }
}

export default FoodItem;