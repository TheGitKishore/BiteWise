// AdminOverviewController.js — NEW-A System Admin – View Dashboard Overview
//
// No explicit UC number — feature shown in admin dashboard screenshots.
// Labelled NEW-A per sprint instructions.
//
// Normal Flow:
//   1. Admin lands on Overview tab (default) in AdminDashboardScreen
//   2. Boundary calls fetchOverviewStats()
//   3. Controller delegates to Admin.fetchOverviewStats()
//   4. Returns aggregated stats to boundary for display
//
// System Admin only

import Admin from '../entity/Admin';

class AdminOverviewController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminOverviewController]', e); return { success: false, data: null, message: 'Failed to load overview.' }; }
  }

  // @return {Promise<{ success, data: {
  //   totalUsers, activeUsers, premiumUsers, bannedUsers,
  //   totalReviews, flaggedReviews, pendingApplications, systemStatus
  // }, message }>}
  async fetchOverviewStats() {
    return this._safe(async () => Admin.fetchOverviewStats());
  }
}

export default AdminOverviewController;
