// Normal Flow (UC #105, #106)
//   1. Admin dashboard mounts → boundary calls fetchApplications()
//   2. Admin selects an application → taps Approve or Reject
//   3. Boundary calls approveApplication() / rejectApplication()
//   4. On approval, controller also promotes user role to CURATOR
// System Admin only (#105, #106)

import CuratorApplication from '../entity/CuratorApplication';
import User               from '../entity/User';

class AdminCuratorApplicationsController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[AdminCuratorApplicationsController]', e); return { success: false, data: null, message: 'Something went wrong.' }; } }

  // UC #105 — fetch all applications
  async fetchApplications() { return this._safeCall(async () => CuratorApplication.fetchAll()); }

  // UC #106 — approve + promote user to CURATOR
  async approveApplication(applicationId, adminId) {
    return this._safeCall(async () => {
      const result = await CuratorApplication.approve(applicationId, adminId);
      if (result.success && result.data) await User.promoteToMinuteCurator(result.data.userId);
      return result;
    });
  }

  // UC #106 — reject application
  async rejectApplication(applicationId, adminId, reason) {
    return this._safeCall(async () => CuratorApplication.reject(applicationId, adminId, reason));
  }
}

export default AdminCuratorApplicationsController;
