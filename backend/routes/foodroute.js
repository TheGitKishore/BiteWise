import express from 'express';
import { searchFoodProduct, getNutritionInfo } from './apiroute.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search term too short.' });
    }
    const data = await searchFoodProduct(q.trim());
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[GET /food/search]', err);
    return res.status(500).json({ success: false, message: 'Food search failed.' });
  }
});

router.get('/barcode/:barcode', async (req, res) => {
  try {
    const { barcode } = req.params;
    const data = await getNutritionInfo(barcode);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('[GET /food/barcode]', err);
    return res.status(500).json({ success: false, message: 'Barcode lookup failed.' });
  }
});

export default router;

