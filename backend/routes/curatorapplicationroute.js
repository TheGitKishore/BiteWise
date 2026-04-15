import express from 'express';
import db from '../db_sql/db.js';

const router = express.Router();

// ================= UC #98 — SUBMIT =================
router.post('/', async (req, res) => {
  console.log('🔥 HIT CURATOR ROUTE');
  console.log('BODY:', req.body);

  try {
    const { userId, username, motivation, journey, expertise, social } = req.body;

    if (!motivation || !journey || !expertise) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    const sql = `
      INSERT INTO curator_applications
      (user_id, username, motivation, journey, expertise, social, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 'PENDING', NOW())
    `;

    const [result] = await db.query(sql, [
      userId,
      username,
      motivation,
      journey,
      expertise,
      social || ''
    ]);

    const insertedId = result.insertId;

    const [rows] = await db.query(
      'SELECT * FROM curator_applications WHERE application_id = ?',
      [insertedId]
    );

    res.json({
      success: true,
      message: 'Application submitted',
      data: rows[0]
    });

  } catch (err) {
    console.error('❌ DB ERROR:', err); // <-- IMPORTANT
    res.status(500).json({
      success: false,
      message: err.message // <-- SHOW REAL ERROR
    });
  }
});

// ================= UC #105 — FETCH ALL =================
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT * FROM curator_applications
      ORDER BY created_at DESC
    `);

    res.json({
      success: true,
      data: rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ================= UC #106 — APPROVE =================
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    const [result] = await db.query(`
      UPDATE curator_applications
      SET status = 'APPROVED',
          reviewed_by_admin_id = ?,
          reviewed_at = NOW()
      WHERE application_id = ?
    `, [adminId, id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM curator_applications WHERE application_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Application approved',
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// ================= UC #106 — REJECT =================
router.put('/:id/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId, reason } = req.body;

    const [result] = await db.query(`
      UPDATE curator_applications
      SET status = 'REJECTED',
          reviewed_by_admin_id = ?,
          reviewed_at = NOW(),
          rejection_reason = ?
      WHERE application_id = ?
    `, [adminId, reason || 'Does not meet requirements', id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM curator_applications WHERE application_id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Application rejected',
      data: rows[0]
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

export default router;