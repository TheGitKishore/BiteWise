import express from 'express';
//import bcrypt from 'bcrypt';
import db from '../db_sql/db.js';

const router = express.Router();

// POST /api/admin/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const [rows] = await db.query(
      `SELECT admin_id, username, password
       FROM admin_accounts
       WHERE username = ?`,
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const admin = rows[0];

    // plain text comparison
    if (password !== admin.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        adminId: admin.admin_id,
        username: admin.username
      }
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT 
        user_id AS userId,
        username,
        email,
        role,
        is_active AS isActive,
        created_at AS createdAt
       FROM users`
    );

    return res.status(200).json({
      success: true,
      data: rows
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// PUT /api/admin/deactivate
router.put('/deactivate', async (req, res) => {
  const { userId } = req.body;

  try {
    await db.query(
      `UPDATE users SET is_active = 0 WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'User deactivated'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to deactivate user'
    });
  }
});

// PUT /api/admin/reactivate
router.put('/reactivate', async (req, res) => {
  const { userId } = req.body;

  try {
    await db.query(
      `UPDATE users SET is_active = 1 WHERE user_id = ?`,
      [userId]
    );

    return res.json({
      success: true,
      message: 'User reactivated'
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Failed to reactivate user'
    });
  }
});

// ================= UC #106 — APPROVE =================
router.put('/:id/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { adminId } = req.body;

    // 1. get userId from application
    const [appRows] = await db.query(
      'SELECT user_id FROM curator_applications WHERE application_id = ?',
      [id]
    );

    if (!appRows.length) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const userId = appRows[0].user_id;

    // 2. approve application
    await db.query(`
      UPDATE curator_applications
      SET status = 'APPROVED',
          reviewed_by_admin_id = ?,
          reviewed_at = NOW()
      WHERE application_id = ?
    `, [adminId, id]);

    // 3. promote user
    await db.query(`
      UPDATE users
      SET role = 'curator',
          updated_at = NOW()
      WHERE user_id = ?
    `, [userId]);

    return res.json({
      success: true,
      message: 'Application approved and user promoted',
      data: { applicationId: id, userId }
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
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