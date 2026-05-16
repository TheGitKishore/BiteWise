import express from 'express';
import db from '../db_sql/db.js';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const DEFAULTS = Object.freeze({
  calories: 2000,
  protein: 150,
  carbs: 250,
  fat: 67,
  fiber: 30,
  activityLevel: 'Balanced',
  goal: 'Maintain Weight',
});

const COLLECTION = 'personalized_nutritional_target';

const mapDoc = (doc) => ({
  userId: doc.userId,
  calories: doc.calories,
  protein: doc.protein,
  carbs: doc.carbs,
  fat: doc.fat,
  fiber: doc.fiber,
  activityLevel: doc.activityLevel,
  goal: doc.goal,
  updatedAt: doc.updatedAt,
});

const asNumber = (value) => Number(value);

const validateCalories = (calories) => {
  const c = asNumber(calories);
  if (Number.isNaN(c) || c < 500) {
    return { valid: false, field: 'calories', message: 'Calorie goal must be at least 500 kcal.' };
  }
  if (c > 10000) {
    return { valid: false, field: 'calories', message: 'Calorie goal cannot exceed 10,000 kcal.' };
  }
  return { valid: true };
};

const validateTargets = ({ calories, protein, carbs, fat, fiber }) => {
  const c = asNumber(calories);
  const p = asNumber(protein);
  const cb = asNumber(carbs);
  const f = asNumber(fat);
  const fi = asNumber(fiber);

  if (Number.isNaN(c) || c < 500)  return { valid: false, field: 'calories', message: 'Calorie goal must be at least 500 kcal.' };
  if (Number.isNaN(p) || p < 0)    return { valid: false, field: 'protein', message: 'Protein cannot be negative.' };
  if (Number.isNaN(cb) || cb < 0)  return { valid: false, field: 'carbs', message: 'Carbs cannot be negative.' };
  if (Number.isNaN(f) || f < 0)    return { valid: false, field: 'fat', message: 'Fat cannot be negative.' };
  if (Number.isNaN(fi) || fi < 0)  return { valid: false, field: 'fiber', message: 'Fiber cannot be negative.' };

  return { valid: true };
};

const ensureUserExists = async (userId) => {
  const [rows] = await db.query(
    `SELECT user_id AS userId, daily_calorie_limit AS dailyCalorieLimit
     FROM users
     WHERE user_id = ?`,
    [userId]
  );
  return rows[0] || null;
};

const ensureTargetsDoc = async (userId) => {
  const existingUser = await ensureUserExists(userId);
  if (!existingUser) return null;

  const caloriesDefault = Number(existingUser.dailyCalorieLimit) > 0
    ? Number(existingUser.dailyCalorieLimit)
    : DEFAULTS.calories;

  const mongo = getDB();
  const existing = await mongo.collection(COLLECTION).countDocuments({ userId: Number(userId) }, { limit: 1 });
  if (existing === 0) {
    await mongo.collection(COLLECTION).insertOne({
      userId: Number(userId),
      calories: caloriesDefault,
      protein: DEFAULTS.protein,
      carbs: DEFAULTS.carbs,
      fat: DEFAULTS.fat,
      fiber: DEFAULTS.fiber,
      activityLevel: DEFAULTS.activityLevel,
      goal: DEFAULTS.goal,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } else {
    await mongo.collection(COLLECTION).updateMany(
      { userId: Number(userId) },
      { $set: { updatedAt: new Date() } }
    );
  }

  return existingUser;
};

const getTargetsByUser = async (userId) => {
  const mongo = getDB();
  const docs = await mongo.collection(COLLECTION)
    .find({ userId: Number(userId) })
    .sort({ updatedAt: -1, _id: -1 })
    .limit(1)
    .toArray();
  return docs[0] || null;
};

router.get('/:userId', async (req, res) => {
  const userId = Number(req.params.userId);

  if (!userId) {
    return res.status(400).json({ success: false, data: null, message: 'User ID is required.' });
  }

  try {
    const ensuredUser = await ensureTargetsDoc(userId);
    if (!ensuredUser) {
      return res.status(404).json({ success: false, data: null, message: 'User not found.' });
    }

    const row = await getTargetsByUser(userId);

    return res.status(200).json({
      success: true,
      data: row
        ? mapDoc(row)
        : { userId, ...DEFAULTS, updatedAt: null },
      message: '',
    });
  } catch (err) {
    console.error('[GET /nutrition-targets/:userId]', err);
    return res.status(500).json({ success: false, data: null, message: 'Failed to load nutrition targets.' });
  }
});

router.put('/:userId', async (req, res) => {
  const userId = Number(req.params.userId);
  const { calories, protein, carbs, fat, fiber, activityLevel, goal } = req.body || {};

  if (!userId) {
    return res.status(400).json({ success: false, field: null, message: 'User ID is required.', data: null });
  }

  const check = validateTargets({ calories, protein, carbs, fat, fiber });
  if (!check.valid) {
    return res.status(400).json({ success: false, field: check.field, message: check.message, data: null });
  }

  try {
    const ensuredUser = await ensureTargetsDoc(userId);
    if (!ensuredUser) {
      return res.status(404).json({ success: false, field: null, message: 'User not found.', data: null });
    }

    const mongo = getDB();
    const updateResult = await mongo.collection(COLLECTION).updateMany(
      { userId: Number(userId) },
      {
        $set: {
          calories: asNumber(calories),
          protein: asNumber(protein),
          carbs: asNumber(carbs),
          fat: asNumber(fat),
          fiber: asNumber(fiber),
          activityLevel: activityLevel || DEFAULTS.activityLevel,
          goal: goal || DEFAULTS.goal,
          updatedAt: new Date(),
        },
      }
    );
    if ((updateResult?.matchedCount || 0) === 0) {
      await mongo.collection(COLLECTION).insertOne({
        userId: Number(userId),
        calories: asNumber(calories),
        protein: asNumber(protein),
        carbs: asNumber(carbs),
        fat: asNumber(fat),
        fiber: asNumber(fiber),
        activityLevel: activityLevel || DEFAULTS.activityLevel,
        goal: goal || DEFAULTS.goal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.query(
      `UPDATE users
       SET daily_calorie_limit = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [
        asNumber(calories),
        userId,
      ]
    );

    const row = await getTargetsByUser(userId);

    return res.status(200).json({
      success: true,
      field: null,
      message: 'Targets saved successfully!',
      data: mapDoc(row),
    });
  } catch (err) {
    console.error('[PUT /nutrition-targets/:userId]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: 'Failed to save nutrition targets.',
      data: null,
    });
  }
});

router.put('/:userId/calories', async (req, res) => {
  const userId = Number(req.params.userId);
  const calories = req.body?.calories;

  if (!userId) {
    return res.status(400).json({ success: false, field: null, message: 'User ID is required.', data: null });
  }

  const check = validateCalories(calories);
  if (!check.valid) {
    return res.status(400).json({ success: false, field: check.field, message: check.message, data: null });
  }

  try {
    const ensuredUser = await ensureTargetsDoc(userId);
    if (!ensuredUser) {
      return res.status(404).json({ success: false, field: null, message: 'User not found.', data: null });
    }

    const mongo = getDB();
    const updateResult = await mongo.collection(COLLECTION).updateMany(
      { userId: Number(userId) },
      {
        $set: {
          calories: asNumber(calories),
          updatedAt: new Date(),
        },
      }
    );
    if ((updateResult?.matchedCount || 0) === 0) {
      await mongo.collection(COLLECTION).insertOne({
        userId: Number(userId),
        calories: asNumber(calories),
        protein: DEFAULTS.protein,
        carbs: DEFAULTS.carbs,
        fat: DEFAULTS.fat,
        fiber: DEFAULTS.fiber,
        activityLevel: DEFAULTS.activityLevel,
        goal: DEFAULTS.goal,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    await db.query(
      `UPDATE users
       SET daily_calorie_limit = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [asNumber(calories), userId]
    );

    const row = await getTargetsByUser(userId);

    return res.status(200).json({
      success: true,
      field: null,
      message: 'Calorie goal updated!',
      data: mapDoc(row),
    });
  } catch (err) {
    console.error('[PUT /nutrition-targets/:userId/calories]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: 'Failed to update calorie goal.',
      data: null,
    });
  }
});

export default router;
