import express from 'express';
import db from '../db_sql/db.js'; // mysql2 pool

const router = express.Router();

//
// ✅ GET all reviews
//
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM reviews ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('GET /reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//
// ✅ GET approved reviews only
//
router.get('/approved', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT * FROM reviews WHERE is_approved = 1 ORDER BY created_at DESC`
    );

    res.json(rows);
  } catch (error) {
    console.error('GET /reviews/approved error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//
// ✅ CREATE review
//
router.post('/', async (req, res) => {
  try {
    const {
      review_user_id,
      reviewer_name,
      reviewer_initials,
      profile_type,
      rating,
      title,
      content,
      membership_plan_id
    } = req.body;

    const [result] = await db.query(
      `INSERT INTO reviews 
      (review_user_id, reviewer_name, reviewer_initials, profile_type, rating, title, content, membership_plan_id, is_approved, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, NOW())`,
      [
        review_user_id,
        reviewer_name,
        reviewer_initials,
        profile_type,
        rating,
        title,
        content,
        membership_plan_id
      ]
    );

    res.status(201).json({
      message: 'Review created',
      review_id: result.insertId
    });

  } catch (error) {
    console.error('POST /reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//
// ✅ APPROVE review (admin)
//
router.put('/:id/approve', async (req, res) => {
  try {
    const review_id = req.params.id;
    const { approved_by_admin_id } = req.body;

    await db.query(
      `UPDATE reviews 
       SET is_approved = 1, approved_by_admin_id = ?, updated_at = NOW()
       WHERE review_id = ?`,
      [approved_by_admin_id, review_id]
    );

    res.json({ message: 'Review approved' });

  } catch (error) {
    console.error('PUT /reviews/approve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

//
// ✅ DELETE review
//
router.delete('/:id', async (req, res) => {
  try {
    const review_id = req.params.id;

    await db.query(
      `DELETE FROM reviews WHERE review_id = ?`,
      [review_id]
    );

    res.json({ message: 'Review deleted' });

  } catch (error) {
    console.error('DELETE /reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;