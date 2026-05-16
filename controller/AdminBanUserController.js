// AdminBanUserController.js — UC #102 System Admin – Temporarily Ban User Account
//
// Normal Flow:
//   1. Admin views Users tab → taps ban button on an active user card
//   2. Boundary shows Alert.alert confirm: "Ban [Name]?"
//   3. On confirm → boundary calls banUser(userId)
//   4. Controller delegates to Admin.banUser()
//   5. Returns { success, message } — boundary updates card status to 'banned'
//
// Unban Flow (UC #102 inverse):
//   1. Admin taps ✓ unban button on a banned user card
//   2. On confirm → boundary calls unbanUser(userId)
//   3. Returns { success, message } — boundary updates card status to 'active'
//
// Alt Flow 6a: Admin cancels → Alert dismissed, no action
// System Admin only

import Admin from '../entity/Admin';

class AdminBanUserController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminBanUserController]', e);
      return {
        success: false,
        message: 'Something went wrong. Please try again.'
      };
    }
  }

  // UC #102 — ban user
  async banUser(userId) {
    return this._safe(async () => {
      if (!userId || userId === '') {
        return { success: false, message: 'Invalid user.' };
      }

      const res = await Admin.banUser(userId);
      return res;
    });
  }

  // UC #102 — unban user
  async unbanUser(userId) {
    return this._safe(async () => {
      if (!userId || userId === '') {
        return { success: false, message: 'Invalid user.' };
      }

      const res = await Admin.unbanUser(userId);
      return res;
    });
  }
}

export default AdminBanUserController;
