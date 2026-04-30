import express from 'express';
import db from '../db_sql/db.js'; // mysql2 pool

const router = express.Router();

const rateMap = {
  Running: 10,
  Cycling: 8,
  Swimming: 7,
  'Weight Training': 5,
  Walking: 4,
  HIIT: 12,
  Yoga: 3,
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
// CREATE EXERCISE ENTRY
// ===============================
router.post('/', async (req, res) => {
  try {
    const { userId, exerciseType, durationMins, notes } = req.body;

    if (!userId || !exerciseType || !durationMins) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
      });
    }

    const rate = rateMap[exerciseType] || 5;
    const caloriesBurned = Math.round(rate * durationMins);

    const [result] = await db.execute(
      `INSERT INTO exerciseentry 
       (user_id, exercise_type, duration_mins, calories_burned, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, exerciseType, durationMins, caloriesBurned, notes || '']
    );

    return res.status(201).json({
      success: true,
      message: `${exerciseType} logged successfully`,
      data: {
        entryId: result.insertId,
        userId,
        exerciseType,
        durationMins,
        caloriesBurned,
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
    const { exerciseType, durationMins, caloriesBurned, notes } = req.body;

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
    const cleanCalories = caloriesBurned || caloriesBurned === 0
      ? Number(caloriesBurned)
      : Math.round((rateMap[cleanExerciseType] || 5) * cleanDuration);

    const [result] = await db.execute(
      `UPDATE exerciseentry
       SET exercise_type = ?,
           duration_mins = ?,
           calories_burned = ?,
           notes = ?
       WHERE entry_id = ?`,
      [cleanExerciseType, cleanDuration, cleanCalories, notes || '', entryId]
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
