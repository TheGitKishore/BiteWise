// Normal Flow (UC #103)
//   1. Admin dashboard mounts → boundary calls fetchAllUsers()
//   2. Admin selects a user → taps deactivate / reactivate
//   3. Boundary calls deactivateUser() / reactivateUser()
// System Admin only (#103)

import Admin from '../entity/Admin';

class AdminManageUsersController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminManageUsersController]', e);
      return {
        success: false,
        data: null,
        message: 'Something went wrong.'
      };
    }
  }

  // UC #103 — fetch all users
  async fetchAllUsers() {
    return this._safeCall(async () => Admin.fetchAllUsers());
  }

  // UC #103 — deactivate account
  async deactivateUser(targetUserId) {
    return this._safeCall(async () => Admin.deactivateUser(targetUserId));
  }

  // UC #103 — reactivate account
  async reactivateUser(targetUserId) {
    return this._safeCall(async () => Admin.reactivateUser(targetUserId));
  }
}

export default AdminManageUsersController;