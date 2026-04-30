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
    try {
      const res = await fn();
    
      // normalize axios + backend response
      const data = res?.data ?? res;
    
      return {
        success: res?.success ?? true,
        data: data?.data ?? data
      };
    
    } catch (e) {
      console.error('[AdminOverviewController]', e);
      return {
        success: false,
        data: null,
        message: 'Failed to load overview.'
      };
    }
  }

  // @return {Promise<{ success, data: {
  //   totalUsers, activeUsers, premiumUsers, bannedUsers,
  //   totalReviews, flaggedReviews, pendingApplications, systemStatus
  // }, message }>}
  async fetchOverviewStats() {
    return this._safe(async () => {
      const res = await Admin.fetchOverviewStats();
    
      if (!res?.success) {
        return {
          success: false,
          data: null,
          message: res?.message || 'Failed to load overview.'
        };
      }
    
      return res;
    });
  }
}

export default AdminOverviewController;
