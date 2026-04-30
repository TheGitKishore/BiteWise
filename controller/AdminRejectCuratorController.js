// AdminRejectCuratorController.js — UC #107 System Admin – Reject Curator Application
//
// Normal Flow:
//   1. Admin views Curators tab → taps ✗ reject button on a PENDING application
//   2. Boundary shows Alert.alert confirm: "Reject [Name]'s application?"
//   3. On confirm → boundary calls rejectApplication(applicationId, adminId)
//   4. Controller tries Admin.reject(); falls back to Admin.rejectApplicationSeeded()
//   5. Returns { success, message } — boundary updates card status to 'rejected'
//
// Alt Flow 6a: Admin cancels → Alert dismissed, no action
// System Admin only

import Admin from '../entity/Admin';

class AdminRejectCuratorController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminRejectCuratorController]', e); return { success: false, message: 'Failed to reject application.' }; }
  }

  // @param  {number|string} applicationId
  // @param  {number|string} adminId
  // @return {Promise<{ success, message }>}
  async rejectApplication(applicationId, adminId) {
    return this._safe(async () => {
      if (!applicationId) return { success: false, message: 'Invalid application.' };
      try {
        const result = await Admin.reject(applicationId, adminId, 'Rejected by admin');
        if (result.success) return result;
      } catch (_) {}
      return Admin.rejectApplicationSeeded(applicationId, adminId);
    });
  }
}

export default AdminRejectCuratorController;
