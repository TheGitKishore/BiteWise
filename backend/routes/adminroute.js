import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db_sql/db.js';

const router = express.Router();

/* =========================================================
   🔐 ADMIN LOGIN
========================================================= */
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
        message: 'Invalid credentials',
        user: null
      });
    }

    const admin = rows[0];

    // ⚠️ Plain text comparison (since DB is manually created)
    const match = password === admin.password;

    if (!match) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        user: null
      });
    }

    return res.json({
      success: true,
      message: 'Login successful',
      user: {
        adminId: admin.admin_id,
        username: admin.username
      }
    });

  } catch (err) {
    console.error('[ADMIN LOGIN]', err);
    return res.status(500).json({
      success: false,
      message: 'Server error',
      user: null
    });
  }
});

/* =========================================================
   👤 USERS MANAGEMENT
========================================================= */

router.get('/users', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        user_id AS userId,
        username,
        email,
        role,
        is_active AS isActive,
        created_at AS createdAt
      FROM users
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

router.put('/deactivate', async (req, res) => {
  const { userId } = req.body;

  try {
    await db.query(
      `UPDATE users SET is_active = false WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, message: 'User deactivated' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Deactivate failed' });
  }
});

router.put('/reactivate', async (req, res) => {
  const { userId } = req.body;

  try {
    await db.query(
      `UPDATE users SET is_active = true WHERE user_id = ?`,
      [userId]
    );

    res.json({ success: true, message: 'User reactivated' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Reactivate failed' });
  }
});

router.delete('/users/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    await db.query(`DELETE FROM users WHERE user_id = ?`, [userId]);

    res.json({ success: true, message: 'User deleted' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

/* =========================================================
   📩 CURATOR APPLICATIONS
========================================================= */

router.get('/applications', async (req, res) => {
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
        created_at AS createdAt
      FROM curator_applications
      ORDER BY created_at DESC
    `);

    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch applications' });
  }
});

router.put('/:applicationId/approve', async (req, res) => {
  const { applicationId } = req.params;
  const { adminId } = req.body;

  try {
    // 1. get userId + expertise from application
    const [rows] = await db.query(
      `SELECT user_id, expertise, journey, motivation
       FROM curator_applications
       WHERE application_id = ?`,
      [applicationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const { user_id, expertise } = rows[0];

    // 2. approve application
    await db.query(
      `UPDATE curator_applications
       SET status = 'APPROVED',
           reviewed_by_admin_id = ?,
           reviewed_at = NOW()
       WHERE application_id = ?`,
      [adminId, applicationId]
    );

    // 3. promote user role
    await db.query(
      `UPDATE users SET role = 'CURATOR' WHERE user_id = ?`,
      [user_id]
    );

    // 4. create curator profile (IMPORTANT FIX)
    await db.query(
      `INSERT INTO curator_profiles (user_id, expertise, bio, created_at, updated_at)
       VALUES (?, ?, '', NOW(), NOW())`,
      [user_id, expertise || '']
    );

    return res.json({
      success: true,
      message: 'Approved, promoted, and curator profile created'
    });

  } catch (err) {
    console.error('[APPROVE CURATOR]', err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.put('/:applicationId/reject', async (req, res) => {
  const { applicationId } = req.params;
  const { adminId, reason } = req.body;

  try {
    await db.query(
      `UPDATE curator_applications
       SET status = 'REJECTED',
           rejection_reason = ?,
           reviewed_by_admin_id = ?,
           reviewed_at = NOW()
       WHERE application_id = ?`,
      [reason, adminId, applicationId]
    );

    res.json({ success: true, message: 'Application rejected' });

  } catch (err) {
    console.error("REJECT ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
});

router.put('/promote-to-curator', async (req, res) => {
  const { userId, applicationId } = req.body;

  try {
    await db.query(
      `UPDATE users SET role = 'CURATOR' WHERE user_id = ?`,
      [userId]
    );

    await db.query(
      `UPDATE curator_applications
       SET status = 'PROMOTED'
       WHERE application_id = ?`,
      [applicationId]
    );

    res.json({ success: true, message: 'User promoted to curator' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Promotion failed' });
  }
});

/* =========================================================
   ⭐ REVIEWS
========================================================= */

router.get('/reviews', async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT * FROM reviews ORDER BY created_at DESC`);
    res.json({ success: true, data: rows });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch reviews' });
  }
});

router.delete('/reviews/:reviewId', async (req, res) => {
  const { reviewId } = req.params;

  try {
    await db.query(`DELETE FROM reviews WHERE review_id = ?`, [reviewId]);

    res.json({ success: true, message: 'Review deleted' });

  } catch (err) {
    res.status(500).json({ success: false, message: 'Delete failed' });
  }
});

/* =========================================================
   📊 DASHBOARD
========================================================= */

router.get('/overview', async (req, res) => {
  try {
    const [usersRows] = await db.query(`SELECT COUNT(*) AS totalUsers FROM users`);
    const [reviewsRows] = await db.query(`SELECT COUNT(*) AS totalReviews FROM reviews`);
    const [appsRows] = await db.query(
      `SELECT COUNT(*) AS pendingApplications 
       FROM curator_applications 
       WHERE status = 'PENDING'`
    );

    const [activeRows] = await db.query(
      `SELECT COUNT(*) AS activeUsers FROM users WHERE is_active = true`
    );

    const [bannedRows] = await db.query(
      `SELECT COUNT(*) AS bannedUsers FROM users WHERE is_active = false`
    );

    const [premiumRows] = await db.query(
      `SELECT COUNT(*) AS premiumUsers FROM users WHERE role = 'PREMIUM'`
    );

    const flaggedRows = [{ flaggedReviews: 0 }];

    return res.json({
      success: true,
      data: {
        totalUsers: usersRows[0].totalUsers,
        totalReviews: reviewsRows[0].totalReviews,
        pendingApplications: appsRows[0].pendingApplications,
        activeUsers: activeRows[0].activeUsers,
        bannedUsers: bannedRows[0].bannedUsers,
        premiumUsers: premiumRows[0].premiumUsers,
        flaggedReviews: flaggedRows[0].flaggedReviews,
        systemStatus: 'OK'
      }
    });

  } catch (err) {
    console.error("OVERVIEW ERROR:", err);
    return res.status(500).json({
      success: false,
      message: 'Overview failed'
    });
  }
});

export default router;