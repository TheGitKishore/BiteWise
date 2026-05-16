import express from 'express';
import { getDB } from '../db_mongodb/db.js';
import { ObjectId } from 'mongodb';

const router = express.Router();

const COLLECTION = 'recipe_drafts';

// GET ALL DRAFTS

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.query;

    const filter = userId
      ? { createdByUserId: Number(userId) }
      : {};

    const drafts = await db.collection(COLLECTION).find(filter).toArray();

    res.json(drafts);
  } catch (err) {
    console.error('[GET /recipe_drafts]', err);
    res.status(500).json({ message: 'Failed to fetch drafts' });
  }
});

// GET ONE DRAFT

router.get('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid draft id' });
    }

    const draft = await db.collection(COLLECTION).findOne({
      _id: new ObjectId(id),
    });

    if (!draft) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    res.json(draft);
  } catch (err) {
    console.error('[GET /recipe_drafts/:id]', err);
    res.status(500).json({ message: 'Failed to fetch draft' });
  }
});

// CREATE DRAFT

router.post('/', async (req, res) => {
  try {
    const db = getDB();

    const draft = {
      ...req.body,
      createdAt: new Date(),
    };

    const result = await db.collection(COLLECTION).insertOne(draft);

    res.status(201).json({
      ...draft,
      _id: result.insertedId,
    });
  } catch (err) {
    console.error('[POST /recipe_drafts]', err);
    res.status(500).json({ message: 'Failed to create draft' });
  }
});

// UPDATE DRAFT

router.put('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: 'Invalid draft id' });
    }

    const objectId = new ObjectId(id);

    const existing = await db.collection(COLLECTION).findOne({ _id: objectId });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Draft not found' });
    }

    if (existing.isPublished === true) {
      return res.status(403).json({
        success: false,
        message: 'Published recipes cannot be edited. Unpublish first.'
      });
    }

    const updateData = { ...req.body };
    delete updateData._id;

    const result = await db.collection(COLLECTION).findOneAndUpdate(
      { _id: objectId },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    return res.json({
      success: true,
      message: 'Draft updated successfully',
      data: result.value
    });

  } catch (err) {
    console.error('[PUT /recipe_drafts/:id]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update draft'
    });
  }
});

// DELETE DRAFT

router.delete('/:id', async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    const { createdByUserId } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid id' });
    }

    const objectId = new ObjectId(id);

    const existing = await db.collection(COLLECTION).findOne({ _id: objectId });

    if (!existing) {
      return res.status(404).json({ message: 'Draft not found' });
    }

    if (existing.isPublished === true) {
      return res.status(403).json({
        success: false,
        message: 'Published recipes cannot be deleted.'
      });
    }

    const result = await db.collection(COLLECTION).deleteOne({
      _id: objectId,
      createdByUserId: createdByUserId,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Unauthorized or not found' });
    }

    res.json({ success: true, message: 'Draft deleted successfully' });

  } catch (err) {
    console.error('[DELETE /recipe_drafts/:id]', err);
    res.status(500).json({ message: 'Failed to delete draft' });
  }
});

// UC #111 — PUBLISH DRAFT TO RECIPE

router.post('/:id/publish', async (req, res) => {
  try {
    const db = getDB();
    const draftId = req.params.id;
    const { userId } = req.body;

    const draft = await db.collection('recipe_drafts').findOne({
      _id: new ObjectId(draftId),
    });

    if (!draft) {
      return res.status(404).json({
        success: false,
        message: 'Draft not found',
      });
    }

    if (String(draft.createdByUserId) !== String(userId)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    const recipe = {
      ...draft,
      isPublished: true,
      likeCount: Number(draft.likeCount ?? 0),
      viewCount: Number(draft.viewCount ?? 0),
      publishedAt: new Date(),
    };

    delete recipe._id;
    delete recipe.movedFromRecipeId;

    const result = await db.collection('recipes').insertOne(recipe);

    await db.collection('recipe_drafts').deleteOne({
      _id: new ObjectId(draftId),
    });

    const insertedRecipe = {
      ...recipe,
      _id: result.insertedId,
    };

    return res.json({
      success: true,
      message: 'Draft published successfully',
      data: insertedRecipe,
    });
  } catch (err) {
    console.error('[PUBLISH ERROR]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during publish',
    });
  }
});

export default router;
