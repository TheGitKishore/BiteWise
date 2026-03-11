// ============================================================
// entities/reports/  — Premium reports
// ============================================================

import Macronutrients from '../food/Macronutrients';

// ---------------------------------------------------------------------------
// DailyReport.js
// Snapshot of a user's full nutrition & exercise data for one calendar day.
// Generated / refreshed by the Controller whenever the day's data changes.

class DailyReport {
  constructor({
    reportId                = null,
    userId                  = null,
    date                    = null,
    caloriesConsumed        = 0,
    calorieTarget           = 0,
    caloriesRemaining       = 0,      // calorieTarget - caloriesConsumed + caloriesBurned
    macronutrientsConsumed  = new Macronutrients(),
    macronutrientTargets    = null,   // NutritionTarget snapshot
    caloriesBurned          = 0,      // from ExerciseLog
    netCalories             = 0,      // caloriesConsumed - caloriesBurned
    mealBreakdown           = [],     // [{ mealType, calories, macros }]
    foodLogEntryIds         = [],
    exerciseEntryIds        = [],
    generatedAt             = null,
  } = {}) {
    this.reportId               = reportId;
    this.userId                 = userId;
    this.date                   = date;
    this.caloriesConsumed       = caloriesConsumed;
    this.calorieTarget          = calorieTarget;
    this.caloriesRemaining      = caloriesRemaining;
    this.macronutrientsConsumed = macronutrientsConsumed;
    this.macronutrientTargets   = macronutrientTargets;
    this.caloriesBurned         = caloriesBurned;
    this.netCalories            = netCalories;
    this.mealBreakdown          = mealBreakdown;
    this.foodLogEntryIds        = foodLogEntryIds;
    this.exerciseEntryIds       = exerciseEntryIds;
    this.generatedAt            = generatedAt;
  }
}

export { DailyReport };

// ---------------------------------------------------------------------------
// MonthlyReport.js
// Aggregated monthly summary. Includes calorie averages, weight change, and
// number of days logged.

class MonthlyReport {
  constructor({
    reportId           = null,
    userId             = null,
    month              = 0,       // 1–12
    year               = 0,
    avgDailyCalories   = 0,
    totalCalories      = 0,
    avgMacronutrients  = new Macronutrients(),
    startWeight        = 0,       // kg at start of month
    endWeight          = 0,       // kg at end of month
    weightChangeKg     = 0,       // endWeight - startWeight
    daysLogged         = 0,
    dailyReportIds     = [],
    generatedAt        = null,
  } = {}) {
    this.reportId          = reportId;
    this.userId            = userId;
    this.month             = month;
    this.year              = year;
    this.avgDailyCalories  = avgDailyCalories;
    this.totalCalories     = totalCalories;
    this.avgMacronutrients = avgMacronutrients;
    this.startWeight       = startWeight;
    this.endWeight         = endWeight;
    this.weightChangeKg    = weightChangeKg;
    this.daysLogged        = daysLogged;
    this.dailyReportIds    = dailyReportIds;
    this.generatedAt       = generatedAt;
  }
}

export { MonthlyReport };
