import express from 'express';
import db from '../db_sql/db.js'; 
const router = express.Router();

// GET all reviews

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

// CREATE review

router.post('/', async (req, res) => {
  try {
    const {
      review_user_id,
      rating,
      title,
      content,
      profile_type,
      membership_plan_id
    } = req.body;

    // fetch username from users table
    const [userRows] = await db.query(
      `SELECT username FROM users WHERE user_id = ?`,
      [review_user_id]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const username = userRows[0].username;

    // initials
    const reviewer_initials = username
      .split(' ')
      .map(w => w[0])
      .join('')
      .toUpperCase();

    // insert review
    const [result] = await db.query(
      `INSERT INTO reviews 
      (review_user_id, reviewer_name, reviewer_initials, profile_type, rating, title, content, membership_plan_id, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        review_user_id,
        username,              
        reviewer_initials,     
        profile_type,
        rating,
        title,
        content,
        membership_plan_id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Review created',
      review_id: result.insertId
    });

  } catch (error) {
    console.error('POST /reviews error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE review

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