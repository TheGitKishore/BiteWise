import express from 'express';
import axios from 'axios';
import { ObjectId } from 'mongodb';
import { getDB } from '../db_mongodb/db.js';
import db from '../db_sql/db.js';

const router = express.Router();
const THEMEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

const getCollections = () => {
  const dbMongo = getDB();
  return {
    recipes: dbMongo.collection('recipes'),
    savedRecipes: dbMongo.collection('saved_recipes'),
  };
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const deriveTags = (meal) => {
  const tags = new Set();

  const rawTags = String(meal?.strTags || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  rawTags.forEach((t) => tags.add(t));

  const category = String(meal?.strCategory || '').toLowerCase();
  if (category) tags.add(category);

  const area = String(meal?.strArea || '').toLowerCase();
  if (area) tags.add(area);

  if (category.includes('vegetarian')) tags.add('vegetarian');
  if (category.includes('vegan')) tags.add('vegan');

  return [...tags];
};

const extractIngredients = (meal) => {
  const list = [];
  for (let i = 1; i <= 20; i += 1) {
    const name = String(meal?.[`strIngredient${i}`] || '').trim();
    if (!name) continue;

    const measure = String(meal?.[`strMeasure${i}`] || '').trim();
    list.push(measure ? `${measure} ${name}`.trim() : name);
  }
  return list;
};

const extractInstructions = (meal) => {
  const raw = String(meal?.strInstructions || '').trim();
  if (!raw) return [];

  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  return raw
    .split(/(?<=[.!?])\s+(?=[A-Z])/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const mapMealDbToRecipeDoc = (meal, query = '') => ({
  title: String(meal?.strMeal || 'Untitled Recipe').trim(),
  description: String(meal?.strCategory || '').trim()
    ? `${meal.strCategory} recipe${meal?.strArea ? ` (${meal.strArea})` : ''}`
    : 'Recipe from TheMealDB',
  prepTimeMins: 25,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  servings: 1,
  difficulty: 'Easy',
  ingredients: extractIngredients(meal),
  instructions: extractInstructions(meal),
  tags: deriveTags(meal),
  isCurated: false,
  isMealPrep: false,
  imageUrl: meal?.strMealThumb || null,
  createdByUserId: null,
  createdAt: new Date(),
  externalSource: 'themealdb',
  externalId: String(meal?.idMeal || ''),
  externalQuery: String(query || '').trim().toLowerCase(),
});

const toClientRecipe = (doc) => ({
  ...doc,
  _id: doc?._id,
  recipeId: doc?._id?.toString() || null,
});

const fetchThemealdbByQuery = async (query) => {
  const response = await axios.get(`${THEMEALDB_BASE_URL}/search.php`, {
    params: { s: query },
    timeout: 10000,
  });

  return Array.isArray(response?.data?.meals) ? response.data.meals : [];
};

// GET /api/recipes
// Mongo first, API fallback (TheMealDB) when q is provided and Mongo has no match.
router.get('/', async (req, res) => {
  try {
    const q = String(req.query?.q || '').trim();
    const { recipes } = getCollections();

    const mongoFilter = q
      ? {
          $or: [
            { title: { $regex: escapeRegex(q), $options: 'i' } },
            { ingredients: { $elemMatch: { $regex: escapeRegex(q), $options: 'i' } } },
            { tags: { $elemMatch: { $regex: escapeRegex(q), $options: 'i' } } },
          ],
        }
      : {};

    const mongoData = await recipes.find(mongoFilter).toArray();
    if (mongoData.length > 0 || !q) {
      return res.json(mongoData.map(toClientRecipe));
    }

    const meals = await fetchThemealdbByQuery(q);
    if (meals.length === 0) return res.json([]);

    const mappedDocs = meals.map((meal) => mapMealDbToRecipeDoc(meal, q));

    for (const doc of mappedDocs) {
      if (!doc.externalId) continue;
      await recipes.updateOne(
        { externalSource: 'themealdb', externalId: doc.externalId },
        {
          $set: {
            title: doc.title,
            description: doc.description,
            prepTimeMins: doc.prepTimeMins,
            calories: doc.calories,
            protein: doc.protein,
            carbs: doc.carbs,
            fat: doc.fat,
            servings: doc.servings,
            difficulty: doc.difficulty,
            ingredients: doc.ingredients,
            instructions: doc.instructions,
            tags: doc.tags,
            isCurated: doc.isCurated,
            isMealPrep: doc.isMealPrep,
            imageUrl: doc.imageUrl,
            externalQuery: doc.externalQuery,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdByUserId: null,
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    const externalIds = mappedDocs.map((d) => d.externalId).filter(Boolean);
    const cached = await recipes
      .find({ externalSource: 'themealdb', externalId: { $in: externalIds } })
      .toArray();

    return res.json(cached.map(toClientRecipe));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/recipes
router.post('/', async (req, res) => {
  try {
    const { recipes } = getCollections();

    const newRecipe = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await recipes.insertOne(newRecipe);

    return res.json({
      recipeId: result.insertedId,
      ...newRecipe,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/recipes/save
router.post('/save', async (req, res) => {
  try {
    const { savedRecipes } = getCollections();
    const { userId, recipeId } = req.body;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        message: 'Invalid recipeId',
      });
    }

    const [rows] = await db.execute(
      `SELECT * FROM saved_recipes 
       WHERE user_id = ? AND recipe_mongo_id = ?`,
      [userId, recipeId.toString()]
    );

    if (rows.length > 0) {
      return res.json({
        success: false,
        message: 'Recipe already saved',
      });
    }

    const mongoEntry = {
      userId,
      recipeId,
      savedAt: new Date(),
    };
    await savedRecipes.insertOne(mongoEntry);

    await db.execute(
      `INSERT INTO saved_recipes (user_id, recipe_mongo_id)
       VALUES (?, ?)`,
      [userId, recipeId.toString()]
    );

    return res.json({
      success: true,
      data: mongoEntry,
      message: 'Recipe saved successfully!',
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
    });
  }
});

// GET /api/recipes/saved/:userId
router.get('/saved/:userId', async (req, res) => {
  try {
    const { recipes } = getCollections();
    const userId = req.params.userId;

    const [rows] = await db.execute(
      `SELECT recipe_mongo_id FROM saved_recipes WHERE user_id = ?`,
      [userId]
    );

    const recipeIds = rows.map((r) => r.recipe_mongo_id);
    if (recipeIds.length === 0) return res.json([]);

    const validIds = recipeIds.filter(ObjectId.isValid);
    const data = await recipes
      .find({ _id: { $in: validIds.map((id) => new ObjectId(id)) } })
      .toArray();

    return res.json(data.map(toClientRecipe));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

export default router;

