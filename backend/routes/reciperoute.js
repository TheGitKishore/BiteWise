import express from 'express';
import { getDB } from '../db_mongodb/db.js';
import { ObjectId } from 'mongodb';
import db from "../db_sql/db.js"; // ✅ your required format

const router = express.Router();

// Collections
const getCollections = () => {
  const dbMongo = getDB();
  return {
    recipes: dbMongo.collection('recipes'),
    saved: dbMongo.collection('saved_recipes'),
  };
};


// ─────────────────────────────────────────────
// GET /api/recipes  — fetch all recipes
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { recipes } = getCollections();
    const data = await recipes.find().toArray();
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ─────────────────────────────────────────────
// POST /api/recipes — create recipe
// ─────────────────────────────────────────────
router.post('/', async (req, res) => {
  try {
    const { recipes } = getCollections();

    const newRecipe = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await recipes.insertOne(newRecipe);

    res.json({
      recipeId: result.insertedId,
      ...newRecipe,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ─────────────────────────────────────────────
// POST /api/recipes/save — save recipe
// ─────────────────────────────────────────────
router.post('/save', async (req, res) => {
  try {
    const { saved } = getCollections();
    const { userId, recipeId } = req.body;

    // 1. Save in MongoDB (optional)
    const mongoEntry = {
      userId,
      recipeId,
      savedAt: new Date(),
    };
    await saved.insertOne(mongoEntry);

    // 2. Save in MySQL (using db.execute)
    await db.execute(
      `INSERT INTO user_saved_recipes (user_id, recipe_mongo_id)
       VALUES (?, ?)`,
      [userId, recipeId.toString()]
    );

    res.json({
      success: true,
      data: mongoEntry,
      message: 'Recipe saved successfully!',
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ─────────────────────────────────────────────
// GET /api/recipes/saved/:userId
// ─────────────────────────────────────────────
router.get('/saved/:userId', async (req, res) => {
  try {
    const { recipes } = getCollections();
    const userId = req.params.userId;

    // 1. Get saved recipe IDs from MySQL
    const [rows] = await db.execute(
      `SELECT recipe_mongo_id FROM user_saved_recipes WHERE user_id = ?`,
      [userId]
    );

    const recipeIds = rows.map(r => r.recipe_mongo_id);

    if (recipeIds.length === 0) {
      return res.json([]);
    }

    // 2. Fetch recipes from MongoDB
    const data = await recipes
      .find({ _id: { $in: recipeIds.map(id => new ObjectId(id)) } })
      .toArray();

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;