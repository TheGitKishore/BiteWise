import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const mapFoodAlternative = (doc) => ({
  altId: doc.altId || doc.alt_id || doc.id || String(doc._id || ''),
  category: doc.category || '',
  original: doc.original || '',
  alternative: doc.alternative || '',
  benefit: doc.benefit || '',
  calorieSaving: doc.calorieSaving || doc.calorie_saving || '',
  icon: doc.icon || '',
});

const mapMindfulSnackingTip = (doc) => ({
  tipId: doc.tipId || doc.tip_id || doc.id || String(doc._id || ''),
  title: doc.title || '',
  content: doc.content || '',
  category: doc.category || '',
  icon: doc.icon || '',
});

// UC #74 - GET healthier food alternatives (MongoDB: food_alternatives)
router.get('/alternatives', async (_req, res) => {
  try {
    const db = getDB();
    const rows = await db.collection('food_alternatives').find({}).toArray();

    return res.status(200).json({
      success: true,
      data: rows.map(mapFoodAlternative),
      message: '',
    });
  } catch (err) {
    console.error('[GET /food-api/smart-eating/alternatives]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load food alternatives.',
    });
  }
});

// UC #75 - GET mindful snacking tips (MongoDB: mindful_snacking)
router.get('/mindful-snacking', async (_req, res) => {
  try {
    const db = getDB();
    const rows = await db.collection('mindful_snacking').find({}).toArray();

    return res.status(200).json({
      success: true,
      data: rows.map(mapMindfulSnackingTip),
      message: '',
    });
  } catch (err) {
    console.error('[GET /food-api/smart-eating/mindful-snacking]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load mindful snacking tips.',
    });
  }
});

export default router;
