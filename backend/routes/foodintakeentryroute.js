import express from 'express';
import { getDB } from '../db_mongodb/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();
import multer from 'multer';
const upload = multer({ dest: 'uploads/' });

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
router.post('/food-recognition', upload.single('image'), async (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).json({
      success: false,
      message: 'No image uploaded',
    });
  }

  // 🔥 Simulate detection (replace later with AI)
  return res.json({
    success: true,
    data: {
      foodName: 'Chicken Rice',
      calories: 600,
      protein: 35,
      carbs: 70,
      fat: 20,
    },
  });
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
      
    console.log("USER ID:", userId);
    console.log("ENTRIES:", entries);      

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
// DELETE ENTRY
// ===============================
router.delete('/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;

    if (!ObjectId.isValid(entryId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid food entry ID.',
      });
    }

    const db = await getDB();
    const collection = db.collection('food_logs');

    const result = await collection.deleteOne({ _id: new ObjectId(entryId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food entry not found.',
      });
    }

    return res.json({
      success: true,
      message: 'Food entry deleted successfully.',
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;
