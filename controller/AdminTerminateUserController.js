// AdminTerminateUserController.js — UC #101 System Admin – Terminate User Account
//
// Normal Flow:
//   1. Admin views Users tab → taps delete button on a user card
//   2. Boundary shows Alert.alert confirm: "Terminate [Name]'s account?"
//   3. On confirm → boundary calls terminateUser(userId)
//   4. Controller delegates to Admin.terminateUser()
//   5. Returns { success, message } — boundary removes card + shows success banner
//
// Alt Flow 6a: Admin cancels → Alert dismissed, no action
// System Admin only

import Admin from '../entity/Admin';

class AdminTerminateUserController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminTerminateUserController]', e); return { success: false, message: 'Failed to terminate account. Please try again.' }; }
  }

  // @param  {number|string} userId
  // @return {Promise<{ success, message }>}
  async terminateUser(userId) {
    return this._safe(async () => {
      if (!userId) return { success: false, message: 'Invalid user.' };
      return Admin.terminateUser(userId);
    });
  }
}

export default AdminTerminateUserController;
