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
      SELECT 
        application_id AS applicationId,
        user_id AS userId,
        username,
        motivation,
        journey,
        expertise,
        social,
        status,
        reviewed_by_admin_id AS reviewedByAdminId,
        reviewed_at AS reviewedAt,
        rejection_reason AS rejectionReason,
        created_at AS createdAt
      FROM curator_applications
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

export default router;