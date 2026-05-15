import express from 'express';
import db from '../db_sql/db.js'; // mysql2 pool
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const EXERCISE_TYPES_COLLECTION = 'exercise_types';

const formatExerciseType = (doc) => ({
  _id: doc._id,
  value: doc.value || doc.exerciseType || doc.name || doc.type,
  label: doc.label || doc.exerciseType || doc.name || doc.type || `${doc.value} (~${doc.calPerMin} cal/min)`,
  calPerMin: Number(doc.calPerMin ?? doc.caloriesPerMinute ?? doc.calories_per_min ?? 0),
  order: Number(doc.order ?? 999),
  isActive: doc.isActive !== false,
});

const getExerciseTypeCollection = async () => {
  const mongo = getDB();
  return mongo.collection(EXERCISE_TYPES_COLLECTION);
};

const getExerciseTypes = async ({ includeInactive = false } = {}) => {
  const collection = await getExerciseTypeCollection();
  const docs = await collection.find({}).sort({ order: 1, value: 1 }).toArray();
  return docs
    .map(formatExerciseType)
    .filter((type) => type.value && (includeInactive || type.isActive));
};

const getCalPerMin = async (exerciseType) => {
  const collection = await getExerciseTypeCollection();
  const doc = await collection.findOne({
    $or: [
      { value: exerciseType },
      { exerciseType },
      { name: exerciseType },
      { type: exerciseType },
    ],
    isActive: { $ne: false },
  });
  return doc ? Number(doc.calPerMin ?? doc.caloriesPerMinute ?? doc.calories_per_min) : null;
};

const formatExerciseEntry = (row) => ({
  entryId: row.entry_id,
  userId: row.user_id,
  exerciseType: row.exercise_type,
  durationMins: row.duration_mins,
  caloriesBurned: row.calories_burned,
  notes: row.notes,
  loggedAt: row.logged_at,
});

// ===============================
// GET EXERCISE TYPES FROM MONGO
// ===============================
router.get('/types', async (_req, res) => {
  try {
    const types = await getExerciseTypes();

    return res.json({
      success: true,
      data: types,
      message: 'Exercise types fetched successfully',
    });
  } catch (err) {
    console.error('[GET /exercise-entries/types]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: 'Database error',
    });
  }
});

// ===============================
// CREATE EXERCISE ENTRY
// ===============================
router.post('/', async (req, res) => {
  try {
    const { userId, exerciseType, durationMins, notes, caloriesBurned } = req.body;

    if (!userId || !exerciseType || !durationMins) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const rate = await getCalPerMin(exerciseType);
    if (rate === null || Number.isNaN(rate)) {
      return res.status(400).json({
        success: false,
        message: 'Exercise type not found in MongoDB.',
      });
    }

    const finalCalories =
    caloriesBurned !== undefined && caloriesBurned !== null && caloriesBurned !== ''
      ? Number(caloriesBurned)
      : Math.round(rate * durationMins);

    const [result] = await db.execute(
      `INSERT INTO exerciseentry 
       (user_id, exercise_type, duration_mins, calories_burned, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [ userId, exerciseType, durationMins, finalCalories, notes || '' ]
    );

    return res.status(201).json({
      success: true,
      message: `${exerciseType} logged successfully`,
      data: {
        entryId: result.insertId,
        userId,
        exerciseType,
        durationMins,
        caloriesBurned: finalCalories,
        notes,
        loggedAt: new Date(),
      },
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
});


// ===============================
// GET TODAY ENTRIES
// ===============================
router.get('/today/:userId', async (req, res) => {
  try {
    const userId = Number(req.params.userId);

    const [rows] = await db.execute(
      `SELECT * FROM exerciseentry
       WHERE user_id = ?
       AND DATE(logged_at) = CURDATE()
       ORDER BY logged_at DESC`,
      [userId]
    );

    const formatted = rows.map(formatExerciseEntry);

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
});

// ===============================
// UPDATE EXERCISE ENTRY
// ===============================
router.put('/:entryId', async (req, res) => {
  try {
    const entryId = Number(req.params.entryId);
    const { exerciseType, durationMins, notes, caloriesBurned } = req.body;

    if (!entryId) {
      return res.status(400).json({ success: false, message: 'Invalid exercise log.', data: null });
    }

    if (!exerciseType?.trim()) {
      return res.status(400).json({ success: false, message: 'Exercise type is required.', data: null });
    }

    if (!durationMins || Number(durationMins) <= 0) {
      return res.status(400).json({ success: false, message: 'Duration must be greater than 0.', data: null });
    }

    const cleanExerciseType = exerciseType.trim();
    const cleanDuration = Number(durationMins);
    const rate = await getCalPerMin(cleanExerciseType);

    if (rate === null || Number.isNaN(rate)) {
      return res.status(400).json({ success: false, message: 'Exercise type not found in MongoDB.', data: null });
    }

    const finalCalories =
      caloriesBurned !== undefined && caloriesBurned !== null && caloriesBurned !== ''
        ? Number(caloriesBurned)
        : Math.round(rate * cleanDuration);

    const [result] = await db.execute(
      `UPDATE exerciseentry
       SET exercise_type = ?,
           duration_mins = ?,
           calories_burned = ?,
           notes = ?
       WHERE entry_id = ?`,
      [cleanExerciseType, cleanDuration, finalCalories, notes || '', entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exercise log not found.', data: null });
    }

    const [rows] = await db.execute(
      'SELECT * FROM exerciseentry WHERE entry_id = ?',
      [entryId]
    );

    return res.json({
      success: true,
      message: 'Exercise log updated successfully!',
      data: formatExerciseEntry(rows[0]),
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Database error',
      data: null,
    });
  }
});

// ===============================
// DELETE EXERCISE ENTRY
// ===============================
router.delete('/:entryId', async (req, res) => {
  try {
    const entryId = Number(req.params.entryId);

    if (!entryId) {
      return res.status(400).json({ success: false, message: 'Invalid exercise log.' });
    }

    const [result] = await db.execute(
      'DELETE FROM exerciseentry WHERE entry_id = ?',
      [entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Exercise log not found.' });
    }

    return res.json({
      success: true,
      message: 'Exercise log deleted successfully!',
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
});

export default router;
