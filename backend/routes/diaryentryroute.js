import express from 'express';
import { ObjectId } from 'mongodb';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const toClientEntry = (doc) => ({
  entryId: doc._id.toString(),
  userId: Number(doc.userId),
  title: doc.title || '',
  content: doc.content || '',
  mood: doc.mood || '',
  weight: doc.weight ?? null,
  photoUri: doc.photoUri || null,
  createdAt: doc.createdAt,
  updatedAt: doc.updatedAt || null,
});

router.get('/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);
    if (!userId) {
      return res.status(400).json({ success: false, data: [], message: 'Invalid user id.' });
    }

    const db = getDB();
    const entries = await db.collection('diary_entries')
      .find({ userId })
      .sort({ createdAt: -1 })
      .toArray();

    return res.json({
      success: true,
      data: entries.map(toClientEntry),
      message: '',
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: [],
      message: err.message || 'Failed to fetch diary entries.',
    });
  }
});

router.post('/', async (req, res) => {
  try {
    const { userId, title, content, mood, weight } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({
        success: false,
        field: 'title',
        message: 'Title is required.',
        data: null,
      });
    }

    if (!content || !String(content).trim()) {
      return res.status(400).json({
        success: false,
        field: 'content',
        message: 'Entry content is required.',
        data: null,
      });
    }

    const moodText = String(mood || '').trim();
    const weightText = String(weight || '').trim();
    let resolvedWeight = null;
    if (weightText.length > 0) {
      const parsed = Number(weightText);
      if (Number.isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({
          success: false,
          field: 'weight',
          message: 'Weight must be a positive number.',
          data: null,
        });
      }
      resolvedWeight = parsed;
    }

    const now = new Date().toISOString();

    const doc = {
      userId: Number(userId),
      title: String(title).trim(),
      content: String(content).trim(),
      mood: moodText,
      weight: resolvedWeight,
      photoUri: null,
      createdAt: now,
      updatedAt: now,
    };

    const db = getDB();
    const result = await db.collection('diary_entries').insertOne(doc);

    return res.status(201).json({
      success: true,
      field: null,
      message: 'Diary entry created!',
      data: toClientEntry({ ...doc, _id: result.insertedId }),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      field: null,
      message: err.message || 'Unable to create diary entry.',
      data: null,
    });
  }
});

router.put('/:entryId/photo', async (req, res) => {
  try {
    const { entryId } = req.params;
    const photoUri = String(req.body?.photoUri || '').trim();

    if (!ObjectId.isValid(entryId)) {
      return res.status(400).json({ success: false, message: 'Invalid diary entry id.', data: null });
    }

    if (!photoUri) {
      return res.status(400).json({ success: false, message: 'No photo URL provided.', data: null });
    }

    const db = getDB();
    const collection = db.collection('diary_entries');

    const result = await collection.updateOne(
      { _id: new ObjectId(entryId) },
      { $set: { photoUri, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Diary entry not found.', data: null });
    }

    const updated = await collection.findOne({ _id: new ObjectId(entryId) });
    return res.json({
      success: true,
      message: 'Photo added to diary entry.',
      data: updated ? toClientEntry(updated) : null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message || 'Unable to add photo to diary entry.',
      data: null,
    });
  }
});

router.delete('/:entryId', async (req, res) => {
  try {
    const { entryId } = req.params;
    if (!ObjectId.isValid(entryId)) {
      return res.status(400).json({ success: false, message: 'Invalid diary entry id.' });
    }

    const db = getDB();
    const result = await db.collection('diary_entries').deleteOne({ _id: new ObjectId(entryId) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Diary entry not found.' });
    }

    return res.json({ success: true, message: 'Diary entry deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Failed to delete diary entry.' });
  }
});

export default router;
