import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const parseIngredient = (raw, idx) => {
  const text = String(raw || '').trim();
  if (!text) return null;

  const match = text.match(/^([\d.]+)\s*([a-zA-Z]*)\s+(.+)$/);
  if (match) {
    return {
      itemId: `i_gen_${idx}_${Date.now()}`,
      name: match[3].trim(),
      quantity: Number(match[1]),
      unit: match[2] || 'unit',
      checked: false,
      source: 'generated',
    };
  }

  return {
    itemId: `i_gen_${idx}_${Date.now()}`,
    name: text,
    quantity: 1,
    unit: 'unit',
    checked: false,
    source: 'generated',
  };
};

const toClientList = (doc) => ({
  listId: doc._id.toString(),
  userId: Number(doc.userId),
  sourceRecipeId: doc.sourceRecipeId || null,
  sourceRecipeTitle: doc.sourceRecipeTitle || '',
  items: Array.isArray(doc.items) ? doc.items : [],
  generatedAt: doc.generatedAt || null,
  updatedAt: doc.updatedAt || null,
});

const mergeItemsByNameUnit = (items = []) => {
  const merged = new Map();
  const passthrough = [];

  for (const item of items) {
    const name = String(item?.name || '').trim();
    if (!name) continue;

    const unit = String(item?.unit || 'unit').trim() || 'unit';
    const quantity = Number(item?.quantity);
    const key = `${name.toLowerCase()}|${unit.toLowerCase()}`;
    const isNumeric = Number.isFinite(quantity);

    if (!isNumeric) {
      passthrough.push(item);
      continue;
    }

    if (!merged.has(key)) {
      merged.set(key, {
        ...item,
        name,
        unit,
        quantity,
      });
    } else {
      const current = merged.get(key);
      merged.set(key, {
        ...current,
        quantity: Number(current.quantity) + quantity,
      });
    }
  }

  return [...merged.values(), ...passthrough];
};

const upsertUserList = async (db, userId, payload) => {
  const collection = db.collection('grocery_lists');
  const result = await collection.findOneAndUpdate(
    { userId: Number(userId) },
    { $set: payload },
    { upsert: true, returnDocument: 'after' }
  );

  if (result?.value) return result.value;
  return collection.findOne({ userId: Number(userId) });
};

router.get('/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid user id.' });
    }

    const db = getDB();
    const current = await db.collection('grocery_lists').findOne({ userId });

    return res.json({
      success: true,
      data: current ? toClientList(current) : null,
      message: current ? '' : 'No grocery list yet.',
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

router.post('/generate-from-recipe', async (req, res) => {
  try {
    const { userId, recipe } = req.body;
    if (!userId || !recipe || !Array.isArray(recipe.ingredients)) {
      return res.status(400).json({
        success: false,
        data: null,
        message: 'Missing userId or recipe ingredients.',
      });
    }

    const now = new Date().toISOString();
    const items = recipe.ingredients
      .map((ing, idx) => parseIngredient(ing, idx))
      .filter(Boolean);

    const db = getDB();
    const collection = db.collection('grocery_lists');
    const current = await collection.findOne({ userId: Number(userId) });

    const existingItems = Array.isArray(current?.items) ? current.items : [];
    const mergedItems = mergeItemsByNameUnit([...existingItems, ...items]);

    const resolvedTitle =
      current?.sourceRecipeTitle && current.sourceRecipeTitle !== recipe.title
        ? 'Multi-recipe Grocery List'
        : (recipe.title || current?.sourceRecipeTitle || 'Saved Recipe');

    const payload = {
      userId: Number(userId),
      sourceRecipeId: recipe.recipeId || current?.sourceRecipeId || null,
      sourceRecipeTitle: resolvedTitle,
      items: mergedItems,
      generatedAt: current?.generatedAt || now,
      updatedAt: now,
    };

    const saved = await upsertUserList(db, userId, payload);

    return res.status(201).json({
      success: true,
      message: current ? 'Recipe ingredients added to grocery list!' : 'Grocery list generated!',
      data: toClientList(saved),
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

router.post('/:userId/items', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { name, quantity, unit } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid user id.' });
    }
    if (!name || !String(name).trim()) {
      return res.status(400).json({ success: false, field: 'name', data: null, message: 'Item name is required.' });
    }

    const db = getDB();
    const collection = db.collection('grocery_lists');
    const current = await collection.findOne({ userId });
    if (!current) {
      return res.status(404).json({ success: false, data: null, message: 'No active grocery list. Generate one first.' });
    }

    const nextItem = {
      itemId: `i_manual_${Date.now()}`,
      name: String(name).trim(),
      quantity: Number(quantity) || 1,
      unit: String(unit || 'unit').trim() || 'unit',
      checked: false,
      source: 'manual',
    };

    const updatedItems = [...(current.items || []), nextItem];
    await collection.updateOne(
      { _id: current._id },
      { $set: { items: updatedItems, updatedAt: new Date().toISOString() } }
    );

    const updated = await collection.findOne({ _id: current._id });
    return res.json({
      success: true,
      message: 'Item added.',
      data: toClientList(updated),
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

router.delete('/:userId/items/:itemId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { itemId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid user id.' });
    }

    const db = getDB();
    const collection = db.collection('grocery_lists');
    const current = await collection.findOne({ userId });
    if (!current) {
      return res.status(404).json({ success: false, data: null, message: 'No active grocery list.' });
    }

    const before = (current.items || []).length;
    const updatedItems = (current.items || []).filter((item) => item.itemId !== itemId);
    if (before === updatedItems.length) {
      return res.status(404).json({ success: false, data: null, message: 'Item not found.' });
    }

    await collection.updateOne(
      { _id: current._id },
      { $set: { items: updatedItems, updatedAt: new Date().toISOString() } }
    );

    const updated = await collection.findOne({ _id: current._id });
    return res.json({
      success: true,
      message: 'Item removed.',
      data: toClientList(updated),
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

router.put('/:userId/items/:itemId/toggle', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    const { itemId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, data: null, message: 'Invalid user id.' });
    }

    const db = getDB();
    const collection = db.collection('grocery_lists');
    const current = await collection.findOne({ userId });
    if (!current) {
      return res.status(404).json({ success: false, data: null, message: 'No active grocery list.' });
    }

    const items = [...(current.items || [])];
    const idx = items.findIndex((item) => item.itemId === itemId);
    if (idx === -1) {
      return res.status(404).json({ success: false, data: null, message: 'Item not found.' });
    }

    items[idx] = { ...items[idx], checked: !items[idx].checked };

    await collection.updateOne(
      { _id: current._id },
      { $set: { items, updatedAt: new Date().toISOString() } }
    );

    const updated = await collection.findOne({ _id: current._id });
    return res.json({
      success: true,
      message: '',
      data: toClientList(updated),
    });
  } catch (err) {
    return res.status(500).json({ success: false, data: null, message: err.message });
  }
});

export default router;
