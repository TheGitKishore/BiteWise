import express from 'express';
import { getDB } from '../db_mongodb/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

// COLLECTION NAME

const COLLECTION = 'foods';

// GET ALL FOOD ITEMS

router.get('/', async (req, res) => {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION);

    const items = await collection.find({}).toArray();

    return res.status(200).json({
      success: true,
      data: items.map(item => ({
          _id: item._id,
          name: item.name,
          calories: item.calories ?? item.energy ?? item.nutrients?.calories ?? 0,
          protein: item.protein ?? item.nutrients?.protein ?? 0,
          carbs: item.carbs ?? item.nutrients?.carbs ?? 0,
          fat: item.fat ?? item.nutrients?.fat ?? 0,
          serving: item.serving ?? '',
          category: item.category ?? '',
          isCustom: item.isCustom ?? false,
        })),
      message: 'Food items fetched successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// CREATE FOOD ITEM

router.post('/', async (req, res) => {
  try {
    const {
      name,
      calories,
      protein,
      carbs,
      fat,
      serving,
      category,
      isCustom,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Food name is required',
      });
    }

    const db = await getDB();
    const collection = db.collection(COLLECTION);

    const newFoodItem = {
      name,
      calories: calories ?? 0,
      protein: protein ?? 0,
      carbs: carbs ?? 0,
      fat: fat ?? 0,
      serving: serving ?? '',
      category: category ?? '',
      isCustom: isCustom ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newFoodItem);

    return res.status(201).json({
      success: true,
      data: {
        _id: result.insertedId,
        ...newFoodItem,
      },
      message: 'Food item created successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// GET FOOD ITEM BY ID

router.get('/:id', async (req, res) => {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION);

    const { ObjectId } = require('mongodb');
    const item = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

// DELETE FOOD ITEM

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDB();
    const collection = db.collection(COLLECTION);

    const { ObjectId } = require('mongodb');

    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Food item not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Food item deleted successfully',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
});

export default router;