import express from 'express';
import db from '../db_sql/db.js';

const router = express.Router();

// ----------------------------------------------------------
// TABLE NAMES (edit here if your schema names change)
// ----------------------------------------------------------
const TABLES = {
  HEIGHT_HISTORIES: 'HEIGHT_HISTORIES',
};

const toNumber = (v) => Number(v);

const mapHeightRow = (r) => ({
  entryId: r.entry_id,
  userId: r.user_id,
  heightCm: Number(r.height_cm),
  logged_at: r.logged_at,
});

// CREATE
router.post('/', async (req, res) => {
  try {
    const { userId, heightCm } = req.body;

    if (!userId || isNaN(Number(heightCm))) {
      return res.status(400).json({
        success: false,
        field: null,
        message: 'Missing required fields.',
        data: null,
      });
    }

    const numericUserId = toNumber(userId);

    const [result] = await db.execute(
      `INSERT INTO \`${TABLES.HEIGHT_HISTORIES}\`
        (user_id, height_cm, logged_at)
       VALUES (?, ?, CURRENT_TIMESTAMP)`,
      [numericUserId, Number(heightCm)]
    );

    const [rows] = await db.execute(
      `SELECT entry_id, user_id, height_cm, logged_at
       FROM \`${TABLES.HEIGHT_HISTORIES}\`
       WHERE entry_id = ? LIMIT 1`,
      [result.insertId]
    );

    const payload = rows.length > 0
      ? mapHeightRow(rows[0])
      : {
        entryId: result.insertId,
        userId: numericUserId,
        heightCm: Number(heightCm),
        logged_at: new Date().toISOString(),
      };

    return res.status(201).json({
      success: true,
      field: null,
      message: 'Height logged successfully.',
      data: payload,
    });
  } catch (err) {
    console.error('[POST /height-entries]', err);
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
      `SELECT entry_id, user_id, height_cm, logged_at
       FROM \`${TABLES.HEIGHT_HISTORIES}\`
       WHERE user_id = ?
       ORDER BY logged_at DESC, entry_id DESC`,
      [userId]
    );

    return res.json({
      success: true,
      data: rows.map(mapHeightRow),
      message: '',
    });
  } catch (err) {
    console.error('[GET /height-entries/:userId]', err);
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
    const { heightCm } = req.body;

    if (!entryId || isNaN(Number(heightCm))) {
      return res.status(400).json({
        success: false,
        field: null,
        message: 'Missing required fields.',
        data: null,
      });
    }

    const [result] = await db.execute(
      `UPDATE \`${TABLES.HEIGHT_HISTORIES}\`
       SET height_cm = ?
       WHERE entry_id = ?`,
      [Number(heightCm), entryId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        field: null,
        message: 'Height entry not found.',
        data: null,
      });
    }

    const [rows] = await db.execute(
      `SELECT entry_id, user_id, height_cm, logged_at
       FROM \`${TABLES.HEIGHT_HISTORIES}\`
       WHERE entry_id = ? LIMIT 1`,
      [entryId]
    );

    return res.json({
      success: true,
      field: null,
      message: 'Height updated successfully.',
      data: rows.length > 0 ? mapHeightRow(rows[0]) : null,
    });
  } catch (err) {
    console.error('[PUT /height-entries/:entryId]', err);
    return res.status(500).json({
      success: false,
      field: null,
      message: err.sqlMessage || err.message || 'Database error.',
      data: null,
    });
  }
});

export default router;
