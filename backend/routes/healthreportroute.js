import express from 'express';
import { getDB } from '../db_mongodb/db.js';

const router = express.Router();

const toISODate = (date) => date.toISOString().split('T')[0];
const toShortLabel = (isoDate) => {
  const d = new Date(`${isoDate}T00:00:00.000Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
};

const buildSevenDayDates = (endDateStr) => {
  const end = new Date(`${endDateStr}T00:00:00.000Z`);
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);

  const days = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push(toISODate(d));
  }
  return days;
};


// DAILY REPORT
router.get('/daily', async (req, res) => {
  try {
    const { userId, date } = req.query;
    const parsedUserId = Number(userId);
    if (!parsedUserId || !date) {
      return res.status(400).json({ message: 'userId and date are required' });
    }

    const db = getDB();
    const days = buildSevenDayDates(date);
    const rangeStart = new Date(`${days[0]}T00:00:00.000Z`);
    const rangeEndExclusive = new Date(`${date}T00:00:00.000Z`);
    rangeEndExclusive.setUTCDate(rangeEndExclusive.getUTCDate() + 1);

    const weeklyAgg = await db.collection('food_logs').aggregate([
      {
        $match: {
          userId: parsedUserId,
          loggedAt: { $gte: rangeStart, $lt: rangeEndExclusive },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: '$loggedAt',
              timezone: 'UTC',
            },
          },
          totalCalories: { $sum: { $ifNull: ['$calories', 0] } },
          totalProtein: { $sum: { $ifNull: ['$protein', 0] } },
          totalCarbs: { $sum: { $ifNull: ['$carbs', 0] } },
          totalFat: { $sum: { $ifNull: ['$fat', 0] } },
          totalEntries: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          date: '$_id',
          totalCalories: 1,
          totalProtein: 1,
          totalCarbs: 1,
          totalFat: 1,
          totalEntries: 1,
        },
      },
    ]).toArray();

    const byDate = new Map(weeklyAgg.map((d) => [d.date, d]));
    const weekly = days.map((day) => {
      const row = byDate.get(day);
      return {
        date: day,
        totalCalories: row?.totalCalories ?? 0,
        totalProtein: row?.totalProtein ?? 0,
        totalCarbs: row?.totalCarbs ?? 0,
        totalFat: row?.totalFat ?? 0,
        totalEntries: row?.totalEntries ?? 0,
      };
    });

    const todayReport = weekly.find((d) => d.date === date) || {
      date,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFat: 0,
      totalEntries: 0,
    };

    const totals = weekly.reduce((acc, d) => ({
      calories: acc.calories + d.totalCalories,
      protein: acc.protein + d.totalProtein,
      carbs: acc.carbs + d.totalCarbs,
      fat: acc.fat + d.totalFat,
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

    const weeklyCalories = weekly.map((d) => ({
      label: toShortLabel(d.date),
      value: Math.round(d.totalCalories),
    }));

    const weeklyMacros = weekly.map((d) => ({
      label: toShortLabel(d.date),
      protein: Number(d.totalProtein.toFixed(1)),
      carbs: Number(d.totalCarbs.toFixed(1)),
      fat: Number(d.totalFat.toFixed(1)),
    }));

    res.json({
      userId: parsedUserId,
      date,
      totalCalories: todayReport.totalCalories,
      totalProtein: todayReport.totalProtein,
      totalCarbs: todayReport.totalCarbs,
      totalFat: todayReport.totalFat,
      totalEntries: todayReport.totalEntries,
      period: 'day',
      weeklyCalories,
      weeklyMacros,
      avgCalories: Math.round(totals.calories / 7),
      avgProtein: Number((totals.protein / 7).toFixed(1)),
      avgCarbs: Number((totals.carbs / 7).toFixed(1)),
      avgFat: Number((totals.fat / 7).toFixed(1)),
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


// WEEKLY REPORT
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


// MONTHLY REPORT
router.get('/monthly', async (req, res) => {
  try {
    const { userId, year, month } = req.query;
    const parsedUserId = Number(userId);
    const parsedYear = Number(year);
    const parsedMonth = Number(month);

    if (!parsedUserId || !parsedYear || !parsedMonth) {
      return res.status(400).json({ message: 'userId, year and month are required' });
    }

    const start = new Date(Date.UTC(parsedYear, parsedMonth - 1, 1, 0, 0, 0, 0));
    const end = new Date(Date.UTC(parsedYear, parsedMonth, 1, 0, 0, 0, 0));
    const totalDaysInMonth = new Date(Date.UTC(parsedYear, parsedMonth, 0)).getUTCDate();

    const db = getDB();
    const [summary] = await db.collection('food_logs').aggregate([
      {
        $match: {
          userId: parsedUserId,
          loggedAt: { $gte: start, $lt: end },
        },
      },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          totalCalories: { $sum: { $ifNull: ['$calories', 0] } },
          totalProtein: { $sum: { $ifNull: ['$protein', 0] } },
        },
      },
      {
        $project: {
          _id: 0,
          totalEntries: 1,
          totalCalories: 1,
          totalProtein: 1,
        },
      },
    ]).toArray();

    const totalEntries = summary?.totalEntries ?? 0;
    const totalCalories = summary?.totalCalories ?? 0;
    const totalProtein = summary?.totalProtein ?? 0;

    res.json({
      userId: parsedUserId,
      year: parsedYear,
      month: parsedMonth,
      totalEntries,
      totalCalories: Math.round(totalCalories),
      totalProtein: Number(totalProtein.toFixed(1)),
      avgCalories: Math.round(totalCalories / totalDaysInMonth),
    });
  } catch (err) {
    console.error('MONTHLY ERROR:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
