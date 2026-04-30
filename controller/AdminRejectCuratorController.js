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
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminRejectCuratorController]', e);
      return {
        success: false,
        message: 'Failed to reject application.'
      };
    }
  }

  // UC #107 — Reject curator application
  async rejectApplication(applicationId, adminId, reason = 'Rejected by admin') {
    return this._safe(async () => {
      if (!applicationId || !adminId) {
        return {
          success: false,
          message: 'Invalid application or admin.'
        };
      }

      const res = await Admin.rejectApplication(
        applicationId,
        adminId,
        reason
      );

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Rejection failed'
        };
      }

      return res;
    });
  }
}

export default AdminRejectCuratorController;
