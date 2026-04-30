import Admin from '../entity/Admin';

class AdminViewCuratorApplicationsController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminViewCuratorApplicationsController]', e);
      return {
        success: false,
        data: [],
        message: 'Failed to load applications.'
      };
    }
  }

  // UC #105 — Fetch all applications from backend
  async fetchApplications() {
    return this._safe(async () => {
      return await Admin.fetchApplications();
    });
  }

  // Client-side search
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