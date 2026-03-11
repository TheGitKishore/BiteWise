// entities/grocery/GroceryItem.js
// One item on a GroceryList. Can be added manually or auto-generated from saved recipes.

class GroceryItem {
  constructor({
    itemId          = null,
    groceryListId   = null,
    name            = '',
    quantity        = 1,
    unit            = '',
    isChecked       = false,
    category        = '',            // 'produce' | 'dairy' | 'meat' | 'pantry' etc.
    fromRecipeId    = null,          // populated if auto-generated from a recipe
    addedAt         = null,
  } = {}) {
    this.itemId        = itemId;
    this.groceryListId = groceryListId;
    this.name          = name;
    this.quantity      = quantity;
    this.unit          = unit;
    this.isChecked     = isChecked;
    this.category      = category;
    this.fromRecipeId  = fromRecipeId;
    this.addedAt       = addedAt;
  }
}

export { GroceryItem };

// ---------------------------------------------------------------------------

// entities/grocery/GroceryList.js
// Premium feature. A user's active grocery list.
// Items can be added manually or bulk-generated from saved recipes.

class GroceryList {
  constructor({
    groceryListId          = null,
    userId                 = null,
    title                  = '',
    items                  = [],   // GroceryItem[]
    generatedFromRecipeIds = [],   // recipe IDs used in last generation
    createdAt              = null,
    updatedAt              = null,
  } = {}) {
    this.groceryListId          = groceryListId;
    this.userId                 = userId;
    this.title                  = title;
    this.items                  = items;
    this.generatedFromRecipeIds = generatedFromRecipeIds;
    this.createdAt              = createdAt;
    this.updatedAt              = updatedAt;
  }
}

export { GroceryList };
