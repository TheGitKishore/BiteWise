// GroceryList.js — SEEDED (no axios)
// UC #94 generate, #95 add item, #96 delete item
// One active list per user — generate replaces previous list
// Premium User only

function parseIngredient(raw, idx) {
  const match = raw.match(/^([\d.]+)\s*([a-zA-Z]*)\s+(.+)$/);
  if (match) return { itemId: 'i_gen_' + idx, name: match[3].trim(), quantity: Number(match[1]), unit: match[2] || 'unit', checked: false };
  return { itemId: 'i_gen_' + idx, name: raw.trim(), quantity: 1, unit: 'unit', checked: false };
}

const SEED_LISTS = {
  2: {
    listId: 'gl1', userId: 2, sourceRecipeId: 'r1', sourceRecipeTitle: 'High-Protein Chicken & Rice Bowl',
    items: [
      { itemId: 'i1', name: 'Chicken breast', quantity: 150, unit: 'g',     checked: false },
      { itemId: 'i2', name: 'Brown rice',      quantity: 1,   unit: 'cup',   checked: false },
      { itemId: 'i3', name: 'Broccoli',        quantity: 1,   unit: 'cup',   checked: true  },
      { itemId: 'i4', name: 'Olive oil',       quantity: 1,   unit: 'tbsp',  checked: false },
      { itemId: 'i5', name: 'Salt',            quantity: 1,   unit: 'pinch', checked: false },
      { itemId: 'i6', name: 'Black pepper',    quantity: 1,   unit: 'pinch', checked: false },
      { itemId: 'i7', name: 'Garlic powder',   quantity: 1,   unit: 'tsp',   checked: false },
    ],
    generatedAt: '2026-03-30T10:00:00Z', updatedAt: '2026-03-30T10:00:00Z',
  },
};

let _lists      = { 2: { ...SEED_LISTS[2], items: [...SEED_LISTS[2].items] } };
let _nextItemId = 20;

class GroceryList {
  constructor({ listId=null, userId=null, sourceRecipeId=null, sourceRecipeTitle='', items=[], generatedAt=null, updatedAt=null } = {}) {
    Object.assign(this, { listId, userId, sourceRecipeId, sourceRecipeTitle, items, generatedAt, updatedAt });
  }

  getCheckedCount() { return this.items.filter((i) => i.checked).length; }
  getPendingItems() { return this.items.filter((i) => !i.checked); }

  static validateItem({ name }) {
    if (!name || name.trim().length === 0) return { valid: false, field: 'name', message: 'Item name is required.' };
    return { valid: true, field: null, message: '' };
  }

  // UC #94 — generate a new list from a saved recipe
  static async generateFromRecipe(userId, recipe) {
    const now  = new Date().toISOString();
    const list = { listId: 'gl_' + userId + '_' + Date.now(), userId, sourceRecipeId: recipe.recipeId, sourceRecipeTitle: recipe.title, items: recipe.ingredients.map(parseIngredient), generatedAt: now, updatedAt: now };
    _lists[userId] = { ...list };
    return { success: true, message: 'Grocery list generated!', data: new GroceryList(_lists[userId]) };
  }

  // UC #95 — add a custom item to the active list
  static async addItem(userId, { name, quantity, unit }) {
    const check = GroceryList.validateItem({ name });
    if (!check.valid) return { success: false, field: check.field, message: check.message, data: null };
    if (!_lists[userId]) return { success: false, field: null, message: 'No active grocery list. Generate one first.', data: null };
    _lists[userId].items.push({ itemId: 'i_' + _nextItemId++, name: name.trim(), quantity: Number(quantity) || 1, unit: unit || 'unit', checked: false });
    _lists[userId].updatedAt = new Date().toISOString();
    return { success: true, message: 'Item added.', data: new GroceryList(_lists[userId]) };
  }

  // UC #96 — delete an item from the active list
  static async deleteItem(userId, itemId) {
    if (!_lists[userId]) return { success: false, message: 'No active grocery list.', data: null };
    const before = _lists[userId].items.length;
    _lists[userId].items    = _lists[userId].items.filter((i) => i.itemId !== itemId);
    _lists[userId].updatedAt = new Date().toISOString();
    if (_lists[userId].items.length === before) return { success: false, message: 'Item not found.', data: null };
    return { success: true, message: 'Item removed.', data: new GroceryList(_lists[userId]) };
  }

  // Toggle checked state
  static async toggleItem(userId, itemId) {
    if (!_lists[userId]) return { success: false, message: 'No active grocery list.', data: null };
    const item = _lists[userId].items.find((i) => i.itemId === itemId);
    if (!item) return { success: false, message: 'Item not found.', data: null };
    item.checked = !item.checked;
    _lists[userId].updatedAt = new Date().toISOString();
    return { success: true, message: '', data: new GroceryList(_lists[userId]) };
  }

  // Fetch active list for screen mount
  static async fetchCurrent(userId) {
    const raw = _lists[userId] ?? null;
    return { success: true, data: raw ? new GroceryList(raw) : null, message: raw ? '' : 'No grocery list yet.' };
  }
}

export default GroceryList;
