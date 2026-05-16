// Normal Flow (UC #31, #32, #33, #80, #81, #82)
//   1. Screen mounts on a tab → boundary calls appropriate fetch method
//   2. Controller delegates to HealthReport.fetchDaily/fetchWeekly/fetchMonthly
//   3. Returns report data to boundary for rendering charts and stats
//
// Alt Flow: no data for period → empty state message
// Shared: Free (#31, #32, #33) and Premium (#80, #81, #82)

import HealthReport from '../entity/HealthReport';

class ViewHealthReportController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewHealthReportController]', error);
      return { success: false, data: null, message: 'Unable to load report. Please try again.' };
    }
  }

  // UC #31, #80 — daily report
  // @param  {number} userId
  // @param  {string} date
  // @return {Promise<{ success, data, message }>}
  async fetchDailyReport(userId, date) {
    return this._safeCall(async () => {
      return await HealthReport.fetchDaily(userId, date);
    });
  }

  // UC #32, #81 — weekly report (7-day array)
  // @param  {number} userId
  // @param  {string} weekStart
  // @return {Promise<{ success, data, message }>}
  async fetchWeeklyReport(userId, weekStart) {
    return this._safeCall(async () => {
      return await HealthReport.fetchWeekly(userId, weekStart);
    });
  }

  // UC #33, #82 — monthly summary
  // @param  {number} userId
  // @param  {number} year
  // @param  {number} month
  // @return {Promise<{ success, data, message }>}
  async fetchMonthlyReport(userId, year, month) {
    return this._safeCall(async () => {
      return await HealthReport.fetchMonthly(userId, year, month);
    });
  }
}

export default ViewHealthReportController;
