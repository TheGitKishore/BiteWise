import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();


// ✅ DAILY REPORT
router.get('/daily', async (req, res) => {
  try {
    const { userId, date } = req.query;

    const db = getDB();

    // get today's report
    const report = await db.collection('nutrition_reports').findOne({
      userId: Number(userId),
      date: date
    });

    // get last 7 days
    const start = new Date(date);
    start.setDate(start.getDate() - 6);

    const weekly = await db.collection('nutrition_reports')
      .find({
        userId: Number(userId),
        date: {
          $gte: start.toISOString().split('T')[0],
          $lte: date
        }
      })
      .toArray();

    const weeklyCalories = weekly.map(r => ({
      label: r.date.slice(5), // MM-DD
      value: r.totalCalories
    }));

    res.json({
      ...report,
      weeklyCalories
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ WEEKLY REPORT
router.get('/weekly', async (req, res) => {
  try {
    const { userId, weekStart } = req.query;

    const start = new Date(weekStart);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const startStr = start.toISOString().split('T')[0];
    const endStr   = end.toISOString().split('T')[0];

    const db = getDB();

    const reports = await db.collection('nutrition_reports')
      .find({
        userId: Number(userId),
        date: {
          $gte: startStr,
          $lte: endStr
        }
      })
      .toArray();

    res.json(reports);
  } catch (err) {
    console.error('WEEKLY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ MONTHLY REPORT
router.get('/monthly', async (req, res) => {
  try {
    const { userId, year, month } = req.query;

    const monthStr = String(month).padStart(2, '0');

    const db = getDB();

    const reports = await db.collection('nutrition_reports')
      .find({
        userId: Number(userId),
        date: {
          $regex: `^${year}-${monthStr}`
        }
      })
      .toArray();

    res.json(reports);
  } catch (err) {
    console.error('MONTHLY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;