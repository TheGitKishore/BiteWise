import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const asNumber = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const asArray = (value) => (Array.isArray(value) ? value : []);

const mapMenuItem = (item = {}, fallbackId = '') => ({
  itemId: String(item.itemId || item.item_id || item.id || fallbackId),
  name: String(item.name || ''),
  calories: asNumber(item.calories ?? item.kcal),
  protein: asNumber(item.protein),
  carbs: asNumber(item.carbs ?? item.carbohydrates),
  fat: asNumber(item.fat),
  price: asNumber(item.price),
  tags: asArray(item.tags).map((tag) => String(tag)),
});

const mapRestaurant = (doc = {}, matchingItems = null) => {
  const menuItems = asArray(doc.menuItems || doc.menu_items).map((item, index) =>
    mapMenuItem(item, `${String(doc._id || doc.restaurantId || 'restaurant')}_m${index + 1}`)
  );

  return {
    _id: doc._id?.toString?.() || String(doc._id || ''),
    restaurantId: String(doc.restaurantId || doc.restaurant_id || doc._id || ''),
    name: String(doc.name || ''),
    cuisine: String(doc.cuisine || ''),
    priceRange: String(doc.priceRange || doc.price_range || '$$'),
    rating: asNumber(doc.rating),
    address: String(doc.address || ''),
    emoji: String(doc.emoji || '🍽️'),
    description: String(doc.description || ''),
    menuItems,
    matchingItems: Array.isArray(matchingItems) ? matchingItems : menuItems,
  };
};

const getCollection = () => getDB().collection('dine_out');

router.get('/', async (req, res) => {
  try {
    const restaurants = await getCollection()
      .find({ isActive: { $ne: false } })
      .sort({ name: 1 })
      .toArray();

    return res.status(200).json({
      success: true,
      data: restaurants.map((restaurant) => mapRestaurant(restaurant)),
      message: '',
    });
  } catch (err) {
    console.error('[GET /dine-out]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load dine out options.',
    });
  }
});

router.get('/matching', async (req, res) => {
  try {
    const remainingCalories = asNumber(req.query.remainingCalories);
    const calorieBudget = Math.max(0, remainingCalories) * 1.1;

    const restaurants = await getCollection()
      .find({ isActive: { $ne: false } })
      .sort({ name: 1 })
      .toArray();

    const matches = restaurants
      .map((restaurant) => {
        const mapped = mapRestaurant(restaurant);
        const matchingItems = calorieBudget > 0
          ? mapped.menuItems.filter((item) => item.calories <= calorieBudget)
          : [];

        return {
          ...mapped,
          matchingItems,
        };
      })
      .filter((restaurant) => restaurant.matchingItems.length > 0)
      .sort((a, b) => b.matchingItems.length - a.matchingItems.length);

    return res.status(200).json({
      success: true,
      data: matches,
      message: '',
    });
  } catch (err) {
    console.error('[GET /dine-out/matching]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Unable to load dine out options.',
    });
  }
});

export default router;
