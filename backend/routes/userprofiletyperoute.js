import express from 'express';
import db from '../db_sql/db.js';

const router = express.Router();

//
// ✅ GET all profile types
//
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM userprofiletype ORDER BY profile_type_id ASC`
    );

    res.json(rows);
  } catch (error) {
    console.error('FULL ERROR:', error);
    res.status(500).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile types' });
  }
});

//
// ✅ GET profile type by TYPE (e.g. ATHLETE)
//
router.get('/type/:type', async (req, res) => {
  try {
    const { type } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM userprofiletype WHERE type = ?`,
      [type]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile type not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('FULL ERROR:', error);
    res.status(500).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile type' });
  }
});

//
// ✅ GET profile type by ID
//
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [rows] = await db.query(
      `SELECT * FROM userprofiletype WHERE profile_type_id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Profile type not found' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('FULL ERROR:', error);
    res.status(500).json({ error: error.message });
    res.status(500).json({ error: 'Failed to fetch profile type' });
  }
});



export default router;