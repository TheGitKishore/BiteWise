import express from 'express';
import db from '../db_sql/db.js';

const router = express.Router();


// CURATOR PROFILE

router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM curator_profiles WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows[0] || null
    });

  } catch (err) {
    console.error('[CuratorProfile GET]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});


// POST create profile
 
router.post('/', async (req, res) => {
  const { userId, expertise = '', bio = '' } = req.body;

  try {
    await db.query(
      `INSERT INTO curator_profiles (user_id, expertise, bio, updated_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, expertise, bio]
    );

    return res.json({
      success: true,
      message: 'Profile created'
    });

  } catch (err) {
    console.error('[CuratorProfile POST]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to create profile'
    });
  }
});


// PUT update ONLY expertise + bio + updated_at

router.put('/:userId', async (req, res) => {
  const { userId } = req.params;
  const { expertise = '', bio = '' } = req.body;

  try {
    await db.query(
      `UPDATE curator_profiles
       SET expertise = ?, bio = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [expertise, bio, userId]
    );

    return res.json({
      success: true,
      message: 'Profile updated'
    });

  } catch (err) {
    console.error('[CuratorProfile PUT]', err);
    return res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

export default router;