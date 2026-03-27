import express from 'express';
import db from '../db_sql/db.js'; // mysql2 pool

const router = express.Router();

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

    // Get cal/min rate (same logic as frontend fallback)
    const rateMap = {
      Running: 10,
      Cycling: 8,
      Swimming: 7,
      'Weight Training': 5,
      Walking: 4,
      HIIT: 12,
      Yoga: 3,
    };

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

    const formatted = rows.map(r => ({
      entryId: r.entry_id,
      userId: r.user_id,
      exerciseType: r.exercise_type,
      durationMins: r.duration_mins,
      caloriesBurned: r.calories_burned,
      notes: r.notes,
      loggedAt: r.logged_at,
    }));

    res.json(formatted);

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Database error',
    });
  }
});

export default router;