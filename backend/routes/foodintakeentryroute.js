import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

// ===============================
// CREATE MANUAL ENTRY
// ===============================
router.post('/manual', async (req, res) => {
  try {
    const { userId, foodName, calories, protein, carbs, fat, meal } = req.body;

    if (!foodName || !meal) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const db = await getDB();
    const collection = db.collection('food_logs');

    const doc = {
      userId: Number(userId),
      foodName,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      meal,
      source: 'manual',
      loggedAt: new Date(),
    };

    const result = await collection.insertOne(doc);

    return res.json({
      success: true,
      message: 'Food entry saved successfully',
      data: { ...doc, _id: result.insertedId },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ===============================
// CREATE FROM CAMERA
// ===============================
router.post('/camera', async (req, res) => {
  try {
    const { userId, foodName, calories, protein, carbs, fat, meal } = req.body;

    const db = await getDB();
    const collection = db.collection('food_logs');

    const doc = {
      userId,
      foodName,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      meal,
      source: 'camera',
      loggedAt: new Date(),
    };

    const result = await collection.insertOne(doc);

    return res.json({
      success: true,
      message: 'Camera food entry saved successfully',
      data: { ...doc, _id: result.insertedId },
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ===============================
// FOOD RECOGNITION (MOCK OR AI)
// ===============================
router.post('/food-recognition', async (req, res) => {
  try {
    // Placeholder (replace with AI service later)
    const detected = {
      foodName: 'Grilled Chicken Breast',
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    };

    return res.json({
      success: true,
      data: detected,
      message: 'Food detected successfully',
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ===============================
// GET TODAY ENTRIES
// ===============================
router.get('/today/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const db = await getDB();
    const collection = db.collection('food_logs');

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const entries = await collection
      .find({
        userId,
        loggedAt: { $gte: start }
      })
      .toArray();

    return res.json({
      success: true,
      data: entries,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});


// ===============================
// GET HISTORY
// ===============================
router.get('/history/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const db = await getDB();
    const collection = db.collection('food_logs');

    const entries = await collection
      .find({ userId })
      .sort({ loggedAt: -1 })
      .toArray();

    return res.json({
      success: true,
      data: entries,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;