// entity/Users.js (backend route file)

import express from 'express';
import bcrypt from 'bcrypt';
import db from '../db_sql/db.js'; // <-- ES module import, .js extension
import { v4 as uuidv4 } from 'uuid';
import { getDB } from '../db_mongodb/db.js';
const router = express.Router();

// ─────────────────────────────────────────────
// POST /api/users/register   — UC #08 / #09
// ─────────────────────────────────────────────
router.post('/register', async (req, res) => {
  const { username, email, password, confirmPassword, selectedPlanId } = req.body;

  try {
    // Check if username already exists
    const [existingUsername] = await db.query(
      'SELECT user_id FROM users WHERE username = ?',
      [username.trim()]
    );
    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        field: 'username',
        message: 'Username already exists.',
        user: null
      });
    }

    // Check if email already exists
    const [existingEmail] = await db.query(
      'SELECT user_id FROM users WHERE email = ?',
      [email.trim()]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        field: 'email',
        message: 'Email already in use.',
        user: null
      });
    }
    const uuid = uuidv4();
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Determine role based on selectedPlanId
    // null = FREE, otherwise PREMIUM
    const role = selectedPlanId ? 'PREMIUM' : 'FREE';

    // Insert new user
    const [result] = await db.query(
      `INSERT INTO users 
        (uuid, username, email, password_hash, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())`,
      [uuid, username.trim(), email.trim(), passwordHash, role]  // ← role added here
    );

    const newUserId = result.insertId;

    // 🔥 Insert into MongoDB
    const mongoDB = getDB();
      
    await mongoDB.collection('users').insertOne({
      uuid,
      username: username.trim(),
      email: email.trim(),
      role,
      membershipPlanId: selectedPlanId || null,
      createdAt: new Date()
    });

    // Fetch the created user
    const [rows] = await db.query(
      `SELECT 
        user_id        AS userId,
        username,
        email,
        first_name     AS firstName,
        last_name      AS lastName,
        date_of_birth  AS dateOfBirth,
        gender,
        profile_type   AS profileType,
        role,
        membership_plan_id AS membershipPlanId,
        is_active      AS isActive,
        created_at     AS createdAt,
        updated_at     AS updatedAt
       FROM users WHERE user_id = ?`,
      [newUserId]
    );

    return res.status(201).json({
      success: true,
      field: null,
      message: 'Account created successfully.',
      user: rows[0]
    });

  } catch (err) {
    console.error('[POST /register]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: 'Something went wrong. Please try again.',
      user: null
    });
  }
});

// ─────────────────────────────────────────────
// POST /api/users/login   — UC #10 / #45
// ─────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username
    const [rows] = await db.query(
      `SELECT 
        user_id        AS userId,
        username,
        email,
        password_hash  AS passwordHash,
        first_name     AS firstName,
        last_name      AS lastName,
        date_of_birth  AS dateOfBirth,
        gender,
        profile_type   AS profileType,
        role,
        membership_plan_id AS membershipPlanId,
        is_active      AS isActive,
        created_at     AS createdAt,
        updated_at     AS updatedAt
       FROM users WHERE username = ?`,
      [username.trim()]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect credentials. Please try again.',
        user: null
      });
    }

    const user = rows[0];

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'This account has been deactivated.',
        user: null
      });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Incorrect credentials. Please try again.',
        user: null
      });
    }

    // Remove passwordHash before sending back
    delete user.passwordHash;

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user
    });

  } catch (err) {
    console.error('[POST /login]', err);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again.',
      user: null
    });
  }
});

// ─────────────────────────────────────────────
// GET /api/users/:userId   — UC #12 / #47
// ─────────────────────────────────────────────
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT 
        user_id        AS userId,
        username,
        email,
        first_name     AS firstName,
        last_name      AS lastName,
        date_of_birth  AS dateOfBirth,
        gender,
        profile_type   AS profileType,
        role,
        membership_plan_id AS membershipPlanId,
        is_active      AS isActive,
        created_at     AS createdAt,
        updated_at     AS updatedAt
       FROM users WHERE user_id = ?`,
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        data: null,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      data: rows[0],
      message: 'Account details fetched successfully.'
    });

  } catch (err) {
    console.error('[GET /:userId]', err);
    return res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch account details.'
    });
  }
});

// ─────────────────────────────────────────────
// PUT /api/users/update   — UC #13 / #48
// ─────────────────────────────────────────────
router.put('/update', async (req, res) => {
  const { userId, username, email } = req.body;

  try {
    // Check if username is taken by another user
    const [existingUsername] = await db.query(
      'SELECT user_id FROM users WHERE username = ? AND user_id != ?',
      [username.trim(), userId]
    );
    if (existingUsername.length > 0) {
      return res.status(409).json({
        success: false,
        field: 'username',
        message: 'Username already exists.',
        user: null
      });
    }

    // Check if email is taken by another user
    const [existingEmail] = await db.query(
      'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
      [email.trim(), userId]
    );
    if (existingEmail.length > 0) {
      return res.status(409).json({
        success: false,
        field: 'email',
        message: 'Email already in use.',
        user: null
      });
    }

    // Update user
    await db.query(
      `UPDATE users 
       SET username = ?, email = ?, updated_at = NOW()
       WHERE user_id = ?`,
      [username.trim(), email.trim(), userId]
    );

    // Fetch updated user
    const [rows] = await db.query(
      `SELECT 
        user_id        AS userId,
        username,
        email,
        first_name     AS firstName,
        last_name      AS lastName,
        date_of_birth  AS dateOfBirth,
        gender,
        profile_type   AS profileType,
        role,
        membership_plan_id AS membershipPlanId,
        is_active      AS isActive,
        created_at     AS createdAt,
        updated_at     AS updatedAt
       FROM users WHERE user_id = ?`,
      [userId]
    );

    return res.status(200).json({
      success: true,
      field: null,
      message: 'Account details updated successfully.',
      user: rows[0]
    });

  } catch (err) {
    console.error('[PUT /update]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: 'Account details update failed.',
      user: null
    });
  }
});

// ─────────────────────────────────────────────
// DELETE /api/users/delete/:userId   — UC #14 / #49
// ─────────────────────────────────────────────
router.delete('/delete/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM users WHERE user_id = ?',
      [userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found.'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Account deleted successfully.'
    });

  } catch (err) {
    console.error('[DELETE /delete/:userId]', err);
    return res.status(500).json({
      success: false,
      message: 'Account deletion failed.'
    });
  }
});

export default router;
