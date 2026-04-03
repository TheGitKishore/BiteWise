import express from 'express';
import db from '../db_sql/db.js';

const router = express.Router();

// ----------------------------------------------------------
// TABLE NAMES (edit here if your schema names change)
// ----------------------------------------------------------
const TABLES = {
  WEIGHT_HISTORIES: 'WEIGHT_HISTORIES',
};

const toNumber = (v) => Number(v);

const mapWeightRow = (r) => ({
  entryId: r.entry_id,
  userId: r.user_id,
  weightKg: Number(r.weight_kg ?? r.weight_cm ?? 0),
  logged_at: r.logged_at,
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { userId, weightKg } = req.body;

    if (!userId || isNaN(Number(weightKg))) {
      return res.status(400).json({
        success: false,
        field: null,
        message: 'Missing required fields.',
        data: null,
      });
    }

    const numericUserId = toNumber(userId);

    const [result] = await db.execute(
      `INSERT INTO \`${TABLES.WEIGHT_HISTORIES}\`
        (user_id, weight_kg, logged_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [numericUserId, Number(weightKg)]
    );

    const [rows] = await db.execute(
      `SELECT entry_id, user_id, weight_kg, logged_at
       FROM \`${TABLES.WEIGHT_HISTORIES}\`
       WHERE entry_id = ? LIMIT 1`,
      [result.insertId]
    );

    const payload = rows.length > 0
      ? mapWeightRow(rows[0])
      : {
        entryId: result.insertId,
        userId: numericUserId,
        weightKg: Number(weightKg),
        logged_at: new Date().toISOString(),
      };

    return res.status(201).json({
      success: true,
      field: null,
      message: 'Weight logged successfully.',
      data: payload,
    });
  } catch (err) {
    console.error('[POST /weight-entries]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: err.sqlMessage || err.message || 'Database error.',
      data: null,
    });
  }
});

// FETCH ALL BY USER
router.get('/:userId', async (req, res) => {
  try {
    const userId = toNumber(req.params.userId);

    const [rows] = await db.execute(
      `SELECT entry_id, user_id, weight_kg, logged_at
       FROM \`${TABLES.WEIGHT_HISTORIES}\`
       WHERE user_id = ?
       ORDER BY logged_at DESC, entry_id DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows.map(mapWeightRow),
      message: '',
    });
  } catch (err) {
    console.error('[GET /weight-entries/:userId]', err);
    return res.status(500).json({
      success: false,
      data: [],
      message: err.sqlMessage || err.message || 'Database error.',
    });
  }
});

// UPDATE
router.put('/:entryId', async (req, res) => {
  try {
    const entryId = toNumber(req.params.entryId);
    const { weightKg } = req.body;

    if (!entryId || isNaN(Number(weightKg))) {
      return res.status(400).json({
        success: false,
        field: null,
        message: 'Missing required fields.',
        data: null,
      });
    }

    const [result] = await db.execute(
      `UPDATE \`${TABLES.WEIGHT_HISTORIES}\`
       SET weight_kg = ?
       WHERE entry_id = ?`,
      [Number(weightKg), entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        field: null,
        message: 'Weight entry not found.',
        data: null,
      });
    }

    const [rows] = await db.execute(
      `SELECT entry_id, user_id, weight_kg, logged_at
       FROM \`${TABLES.WEIGHT_HISTORIES}\`
       WHERE entry_id = ? LIMIT 1`,
      [entryId]
    );

    return res.json({
      success: true,
      field: null,
      message: 'Weight updated successfully.',
      data: rows.length > 0 ? mapWeightRow(rows[0]) : null,
    });
  } catch (err) {
    console.error('[PUT /weight-entries/:entryId]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: err.sqlMessage || err.message || 'Database error.',
      data: null,
    });
  }
});

// HARD DELETE
router.delete('/:entryId', async (req, res) => {
  try {
    const entryId = toNumber(req.params.entryId);

    const [result] = await db.execute(
      `DELETE FROM \`${TABLES.WEIGHT_HISTORIES}\` WHERE entry_id = ?`,
      [entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Weight entry not found.' });
    }

    return res.json({ success: true, message: 'Entry removed.' });
  } catch (err) {
    console.error('[DELETE /weight-entries/:entryId]', err);
    return res.status(500).json({ success: false, message: err.sqlMessage || err.message || 'Database error.' });
  }
});

export default router;
