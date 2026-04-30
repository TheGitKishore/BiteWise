// AdminViewCuratorApplicationsController.js — UC #105 System Admin – View Curator Applications
//
// Normal Flow:
//   1. Admin navigates to Curators tab in AdminDashboardScreen
//   2. Boundary calls fetchApplications()
//   3. Controller tries CuratorApplication.fetchAll(); falls back to Admin.fetchApplicationsSeeded()
//   4. Returns application list to boundary for display
//
// System Admin only

import Admin              from '../entity/Admin';
import CuratorApplication from '../entity/CuratorApplication';

class AdminViewCuratorApplicationsController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminViewCuratorApplicationsController]', e); return { success: false, data: [], message: 'Failed to load applications.' }; }
  }

  // @return {Promise<{ success, data: Array, message }>}
  async fetchApplications() {
    return this._safe(async () => {
      try {
        const result = await CuratorApplication.fetchAll();
        if (result.success && Array.isArray(result.data) && result.data.length > 0) {
          return result;
        }
      } catch (_) {}
      return Admin.fetchApplicationsSeeded();
    });
  }

  // Client-side search across applicant name, email, expertise
  // @param  {Array}  apps
  // @param  {string} query
  // @return {Array}
  searchApplications(apps, query) {
    if (!query?.trim()) return apps;
    const q = query.toLowerCase().trim();
    return apps.filter((a) =>
      (a.username || '').toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.expertise || '').toLowerCase().includes(q)
    );
  }
}

export default AdminViewCuratorApplicationsController;
