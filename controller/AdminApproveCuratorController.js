// AdminApproveCuratorController.js — UC #106 System Admin – Approve Curator Application
//
// Normal Flow:
//   1. Admin views Curators tab → taps approve button on a PENDING application
//   2. Boundary calls approveApplication(applicationId, adminId)
//   3. Controller tries Admin.approve(); falls back to Admin.approveApplicationSeeded()
//   4. Returns { success, message } — boundary updates card status + shows green banner
//      "Curator application approved!"
//
// Alt Flow 6a: Admin cancels → no action
// System Admin only

import Admin from '../entity/Admin';

class AdminApproveCuratorController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminApproveCuratorController]', e);
      return {
        success: false,
        message: 'Failed to approve application.'
      };
    }
  }

  // UC #106 — approve curator application
  async approveApplication(applicationId, adminId) {
    return this._safe(async () => {
      if (!applicationId || !adminId) {
        return {
          success: false,
          message: 'Invalid request.'
        };
      }

      const res = await Admin.approveApplication(applicationId, adminId);
      return res;
    });
  }
}

export default AdminApproveCuratorController;
