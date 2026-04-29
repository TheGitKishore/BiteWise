import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../db_mongodb/db.js';
import db from '../db_sql/db.js';

const router = express.Router();
const THEMEALDB_BASE_URL = 'https://www.themealdb.com/api/json/v1/1';

const getCollections = () => {
  const dbMongo = getDB();
  return {
    recipes: dbMongo.collection('recipes'),
    drafts: dbMongo.collection('recipe_drafts'), // ✅ add this
    savedRecipes: dbMongo.collection('saved_recipes'),
    recipeLikes: dbMongo.collection('recipe_likes'),
    customRecipes: dbMongo.collection('custom_recipes')
  };
};

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeUserId = (value) => String(value ?? '').trim();

const userIdFilter = (value) => {
  const normalized = normalizeUserId(value);
  if (!normalized) return null;
  const numeric = Number(normalized);
  if (Number.isNaN(numeric)) return { userId: normalized };
  return { userId: { $in: [normalized, numeric] } };
};

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
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${THEMEALDB_BASE_URL}/search.php?s=${encodeURIComponent(query)}`;
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data?.meals) ? data.meals : [];
  } finally {
    clearTimeout(timeout);
  }
};

const cacheExternalRecipes = async (recipesCollection, mappedDocs) => {
  for (const doc of mappedDocs) {
    if (!doc.externalId) continue;
    await recipesCollection.updateOne(
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
    if (q && mongoData.length > 0) {
      return res.json(mongoData.map(toClientRecipe));
    }

    // No query path used by current UI:
    // return Mongo + top-up from TheMealDB (cached) so users see both sources.
    if (!q) {
      const fallbackTerms = ['chicken', 'beef', 'salad', 'vegetarian', 'pasta'];
      const shouldTopUp = mongoData.length < 40;

      if (shouldTopUp) {
        const seenExternalIds = new Set();
        const combinedMeals = [];

        for (const term of fallbackTerms) {
          const meals = await fetchThemealdbByQuery(term);
          for (const meal of meals) {
            const id = String(meal?.idMeal || '');
            if (!id || seenExternalIds.has(id)) continue;
            seenExternalIds.add(id);
            combinedMeals.push(meal);
          }
          if (combinedMeals.length >= 40) break;
        }

        if (combinedMeals.length > 0) {
          const mappedDocs = combinedMeals.map((meal) => mapMealDbToRecipeDoc(meal, 'bootstrap'));
          await cacheExternalRecipes(recipes, mappedDocs);
        }
      }

      const merged = await recipes
        .find({})
        .sort({ createdAt: -1 })
        .limit(120)
        .toArray();

      const mongoNative = merged.filter((r) => !r.externalSource);
      const apiCached = merged.filter((r) => r.externalSource);
      const ordered = [...mongoNative, ...apiCached];

      return res.json(ordered.map(toClientRecipe));
    }

    let meals = [];
    try {
      meals = await fetchThemealdbByQuery(q);
    } catch (apiErr) {
      // If external API is unavailable, fail soft with empty list.
      return res.json([]);
    }
    if (meals.length === 0) return res.json([]);

    const mappedDocs = meals.map((meal) => mapMealDbToRecipeDoc(meal, q));
    await cacheExternalRecipes(recipes, mappedDocs);

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
    const { customRecipes } = getCollections();

    const newRecipe = {
      ...req.body,
      likeCount: Number(req.body?.likeCount ?? 0),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await customRecipes.insertOne(newRecipe);

    return res.json({
      _id: result.insertedId,
      ...newRecipe,
    });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// GET /api/recipes/custom/:userId
router.get('/custom/:userId', async (req, res) => {
  try {
    const { customRecipes } = getCollections();
    const userId = normalizeUserId(req.params.userId);

    const data = await customRecipes
      .find({
        createdByUserId: { $in: [String(userId), Number(userId)] }
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json(data.map(toClientRecipe));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/recipes/custom/:id
router.put('/custom/:id', async (req, res) => {
  try {
    const { customRecipes } = getCollections();

    const recipeId = req.params.id;
    const { userId, fields } = req.body;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipe id' });
    }

    const recipe = await customRecipes.findOne({ _id: new ObjectId(recipeId) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    if (String(recipe.createdByUserId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await customRecipes.updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $set: {
          ...fields,
          updatedAt: new Date(),
        }
      }
    );

    const updated = await customRecipes.findOne({ _id: new ObjectId(recipeId) });

    return res.json({
      success: true,
      message: 'Recipe updated successfully',
      data: updated
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/recipes/custom/:id
router.delete('/custom/:id', async (req, res) => {
  try {
    const { customRecipes } = getCollections();

    const recipeId = req.params.id;
    const { userId } = req.body;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ success: false, message: 'Invalid recipe id' });
    }

    const recipe = await customRecipes.findOne({ _id: new ObjectId(recipeId) });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Recipe not found' });
    }

    if (String(recipe.createdByUserId) !== String(userId)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await customRecipes.deleteOne({ _id: new ObjectId(recipeId) });

    return res.json({
      success: true,
      message: 'Recipe deleted successfully'
    });

  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/recipes/likes/:userId
router.get('/likes/:userId', async (req, res) => {
  try {
    const { recipeLikes } = getCollections();
    const userId = normalizeUserId(req.params.userId);
    const likeUserFilter = userIdFilter(userId);

    if (!likeUserFilter) {
      return res.status(400).json({ message: 'Invalid userId' });
    }

    const rows = await recipeLikes
      .find(likeUserFilter)
      .project({ _id: 0, recipeId: 1 })
      .toArray();

    return res.json(rows.map((r) => String(r.recipeId)).filter(Boolean));
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// PUT /api/recipes/:recipeId/like
// Persists recipe likes in Mongo. Curated recipes only.
router.put('/:recipeId/like', async (req, res) => {
  try {
    const { recipes, recipeLikes } = getCollections();
    const { recipeId } = req.params;
    const userId = normalizeUserId(req.body?.userId);
    const like = req.body?.like;
    const incrementBy = Number(req.body?.incrementBy ?? 1);

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({ message: 'Invalid recipeId' });
    }
    if (![1, -1].includes(incrementBy)) {
      return res.status(400).json({ message: 'incrementBy must be 1 or -1' });
    }

    const objectId = new ObjectId(recipeId);
    const existing = await recipes.findOne(
      { _id: objectId, isCurated: true },
      { projection: { likeCount: 1 } }
    );

    if (!existing) {
      return res.status(404).json({
        message: 'Recipe not found or likes are only enabled for curated recipes',
      });
    }

    const currentLikeCount = Number(existing.likeCount ?? 0);

    if (userId && typeof like === 'boolean') {
      const likeUserFilter = userIdFilter(userId);
      const likeFilter = { ...likeUserFilter, recipeId: String(recipeId) };
      const likeEntry = await recipeLikes.findOne(likeFilter);

      let nextLikeCount = currentLikeCount;
      if (like && !likeEntry) {
        await recipeLikes.insertOne({
          userId: normalizeUserId(userId),
          recipeId: String(recipeId),
          createdAt: new Date(),
        });
        nextLikeCount = currentLikeCount + 1;
      } else if (!like && likeEntry) {
        await recipeLikes.deleteOne(likeFilter);
        nextLikeCount = Math.max(0, currentLikeCount - 1);
      }

      if (nextLikeCount !== currentLikeCount) {
        await recipes.updateOne(
          { _id: objectId },
          { $set: { likeCount: nextLikeCount, updatedAt: new Date() } }
        );
      }

      return res.json({
        recipeId,
        likeCount: nextLikeCount,
        isLiked: like,
      });
    }

    const nextLikeCount = Math.max(0, currentLikeCount + incrementBy);

    await recipes.updateOne(
      { _id: objectId },
      { $set: { likeCount: nextLikeCount, updatedAt: new Date() } }
    );

    return res.json({
      recipeId,
      likeCount: nextLikeCount,
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

// ─────────────────────────────────────────────
// SAVED RECIPES
// ─────────────────────────────────────────────
// DELETE /api/recipes/saved/:userId/:recipeId
router.delete('/saved/:userId/:recipeId', async (req, res) => {
  try {
    const { savedRecipes } = getCollections();
    const { userId, recipeId } = req.params;

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipeId',
      });
    }

    const [result] = await db.execute(
      `DELETE FROM saved_recipes
       WHERE user_id = ? AND recipe_mongo_id = ?`,
      [userId, recipeId.toString()]
    );

    await savedRecipes.deleteMany({
      recipeId: { $in: [recipeId.toString(), new ObjectId(recipeId)] },
      ...userIdFilter(userId),
    });

    return res.json({
      success: true,
      message: result.affectedRows > 0 ? 'Recipe removed from saved recipes.' : 'Recipe was not saved.',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
      sqlMessage: err.sqlMessage,
      code: err.code,
    });
  }
});

// UC #112 - UNPUBLISH (MOVE recipe to draft)
router.post('/:id/unpublish', async (req, res) => {
  try {
    const { recipes, drafts } = getCollections();

    const recipeId = req.params.id;
    const { userId } = req.body;

    console.log("UNPUBLISH _id:", recipeId);
    console.log("recipeId param:", recipeId);
    console.log("userId:", userId);

    if (!ObjectId.isValid(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe id',
      });
    }

    console.log("LOOKING IN recipes collection for:", recipeId);

    const sample = await recipes.find().limit(3).toArray();
    console.log("ALL sample recipes:", sample);

    const recipe = await recipes.findOne({
      _id: new ObjectId(recipeId),
    });

    console.log("FOUND RECIPE:", recipe);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    if (String(recipe.createdByUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const draft = {
      ...recipe,
      isPublished: false,
      movedFromRecipeId: recipe._id,
      createdAt: new Date(),
    };

    delete draft._id;

    const result = await drafts.insertOne(draft);

    await recipes.deleteOne({
      _id: new ObjectId(recipeId),
    });

    return res.json({
      success: true,
      message: 'Recipe unpublished successfully',
      data: {
        ...draft,
        _id: result.insertedId,   // ✅ ONLY _id now
      },
    });

  } catch (err) {
    console.error('[UNPUBLISH ERROR]', err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
