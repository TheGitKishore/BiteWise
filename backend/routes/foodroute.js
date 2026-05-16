import express from 'express';
import { searchFoodProduct, getNutritionInfo, mapProduct } from './apiroute.js';

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const q = req.query.searchTerm || req.query.q;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search term too short.'
      });
    }

    const data = await searchFoodProduct(q.trim());

    console.log("Query:", q);
    console.log("Products count:", data?.products?.length);

    if (data?.apiError) {
      return res.status(503).json({
        success: false,
        message: 'Food search is temporarily unavailable. Please try again.',
      });
    }

    if (!data || !data.products) {
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const products = (data.products || [])
      .map(mapProduct)
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      data: products
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Food search failed.',
    });
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
