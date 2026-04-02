import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/health-reports`;

class HealthReport {
  constructor({
    reportId        = null,
    userId          = null,
    date            = null,
    totalCalories   = 0,
    totalProtein    = 0,
    totalCarbs      = 0,
    totalFat        = 0,
    totalEntries    = 0,
    calorieGoal     = 0,
    exerciseCount   = 0,
    caloriesBurned  = 0,
    insights        = [],    // string[] — auto-generated tips
    period          = 'day', // 'day' | 'week' | 'month'
  } = {}) {
    this.reportId       = reportId;
    this.userId         = userId;
    this.date           = date;
    this.totalCalories  = totalCalories;
    this.totalProtein   = totalProtein;
    this.totalCarbs     = totalCarbs;
    this.totalFat       = totalFat;
    this.totalEntries   = totalEntries;
    this.calorieGoal    = calorieGoal;
    this.exerciseCount  = exerciseCount;
    this.caloriesBurned = caloriesBurned;
    this.insights       = insights;
    this.period         = period;
  }

  // Returns calorie goal progress as a percentage (0–100)
  getGoalProgress() {
    if (!this.calorieGoal || this.calorieGoal === 0) return 0;
    return Math.min(Math.round((this.totalCalories / this.calorieGoal) * 100), 100);
  }

  // Returns net calories (consumed minus burned)
  getNetCalories() {
    return Math.max(0, this.totalCalories - this.caloriesBurned);
  }


  // STATIC / COLLECTION METHODS

  // Generates insights array from a report's data
  // @param  {HealthReport} report
  // @return {string[]}
  static generateInsights(report) {
    const insights = [];
    if (report.calorieGoal > 0) {
      const pct = report.getGoalProgress();
      if (pct >= 90 && pct <= 110) insights.push('Great job staying within your calorie goal!');
      else if (pct > 110) insights.push('You went over your calorie goal. Consider adjusting your next meal.');
      else if (pct < 50)  insights.push('You consumed fewer calories than usual. Make sure you\'re eating enough.');
    }
    if (report.totalProtein > 0 && report.totalCalories > 0) {
      const proteinPct = ((report.totalProtein * 4) / report.totalCalories) * 100;
      if (proteinPct < 15) insights.push('Try to include more protein-rich foods in your meals.');
    }
    if (report.exerciseCount > 0) insights.push(`You completed ${report.exerciseCount} exercise session(s) today. Keep it up!`);
    if (insights.length === 0) insights.push('Start logging meals to receive personalised insights.');
    return insights;
  }


  // DATA ACCESS

  // UC #31, #80 — fetch daily health report
  // @param  {number} userId
  // @param  {string} date — ISO date string e.g. '2026-03-09'
  // @return {Promise<{ success, data, message }>}
  static async fetchDaily(userId, date) {
    try {
      const res = await axios.get(`${API_URL}/daily`, { params: { userId, date } });
      return { success: true, data: new HealthReport(res.data), message: '' };
    } catch (err) {
      console.log('FETCH DAILY REPORT ERROR:', err.response?.data || err.message);
      return {
        success: false, data: null,
        message: err.response?.data?.message || 'Failed to load daily report.',
      };
    }
  }

  // UC #32, #81 — fetch weekly health report
  // @param  {number} userId
  // @param  {string} weekStart — ISO date string for Monday of the week
  // @return {Promise<{ success, data, message }>}
  static async fetchWeekly(userId, weekStart) {
    try {
      const res = await axios.get(`${API_URL}/weekly`, { params: { userId, weekStart } });
      return { success: true, data: res.data.map((r) => new HealthReport(r)), message: '' };
    } catch (err) {
      console.log('FETCH WEEKLY REPORT ERROR:', err.response?.data || err.message);
      return {
        success: false, data: [],
        message: err.response?.data?.message || 'Failed to load weekly report.',
      };
    }
  }

  // UC #33, #82 — fetch monthly summary
  // @param  {number} userId
  // @param  {number} year
  // @param  {number} month — 1-12
  // @return {Promise<{ success, data, message }>}
  static async fetchMonthly(userId, year, month) {
    try {
      const res = await axios.get(`${API_URL}/monthly`, { params: { userId, year, month } });
      return { success: true, data: res.data, message: '' };
    } catch (err) {
      console.log('FETCH MONTHLY REPORT ERROR:', err.response?.data || err.message);
      return {
        success: false, data: null,
        message: err.response?.data?.message || 'Failed to load monthly summary.',
      };
    }
  }
}

export default HealthReport;
