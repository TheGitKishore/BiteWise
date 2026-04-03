import express from 'express';
import db from "../db_sql/db.js";

const router = express.Router();


// ================================
// HELPER: map DB → frontend format
// ================================
const mapGoal = (row) => ({
  goalId:         row.goal_id,
  userId:         row.user_id,
  goalType:       row.goal_type,
  customGoal:     row.custom_goal,
  targetWeight:   row.target_weight,
  targetCalories: row.target_calories,
  activityLevel:  row.activity_level,
  targetDate:     row.target_date,
  isActive:       row.is_active,
  createdAt:      row.created_at,
  updatedAt:      row.updated_at,
});


// ================================
// GET ACTIVE GOAL
// ================================
router.get('/active/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const [rows] = await db.query(
      `SELECT * FROM health_goals 
       WHERE user_id = ? AND is_active = TRUE 
       LIMIT 1`,
      [userId]
    );

    res.json({
      success: true,
      data: rows[0] ? mapGoal(rows[0]) : null,
      message: rows[0] ? '' : 'No goal found'
    });

  } catch (err) {
    console.error('FETCH ERROR:', err);
    res.status(500).json({
      success: false,
      data: null,
      message: 'Failed to fetch health goal'
    });
  }
});


// ================================
// CREATE GOAL
// ================================
router.post('/', async (req, res) => {
  const {
    userId,
    goalType,
    customGoal,
    targetWeight,
    targetCalories,
    activityLevel,
    targetDate
  } = req.body;

  try {
    // deactivate existing goals
    await db.query(
      `UPDATE health_goals SET is_active = FALSE WHERE user_id = ?`,
      [userId]
    );

    const [result] = await db.query(
      `INSERT INTO health_goals 
       (user_id, goal_type, custom_goal, target_weight, target_calories, activity_level, target_date, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
      [userId, goalType, customGoal, targetWeight, targetCalories, activityLevel, targetDate]
    );

    res.json({
      success: true,
      message: 'Health goal created',
      data: { goalId: result.insertId }
    });

  } catch (err) {
    console.error('CREATE ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to create goal' });
  }
});


// ================================
// UPDATE GOAL
// ================================
router.put('/:goalId', async (req, res) => {
  const { goalId } = req.params;

  const {
    goalType,
    customGoal,
    targetWeight,
    targetCalories,
    activityLevel,
    targetDate
  } = req.body;

  try {
    await db.query(
      `UPDATE health_goals
       SET goal_type = ?, custom_goal = ?, target_weight = ?, target_calories = ?, 
           activity_level = ?, target_date = ?
       WHERE goal_id = ?`,
      [goalType, customGoal, targetWeight, targetCalories, activityLevel, targetDate, goalId]
    );

    res.json({
      success: true,
      message: 'Health goal updated',
      data: {
        goalId,
        goalType,
        customGoal,
        targetWeight,
        targetCalories,
        activityLevel,
        targetDate
      }
    });

  } catch (err) {
    console.error('UPDATE ERROR:', err);
    res.status(500).json({ success: false, message: 'Failed to update goal' });
  }
});

export default router;