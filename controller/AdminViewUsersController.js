// AdminViewUsersController.js — UC #100 System Admin – View User Accounts
//
// Normal Flow:
//   1. Admin navigates to Users tab in AdminDashboardScreen
//   2. Boundary calls fetchAllUsers()
//   3. Controller tries live API via Admin.fetchAllUsers();
//      falls back to Admin.fetchUsersSeeded() if API unavailable
//   4. Returns user list to boundary for display
//
// System Admin only

import Admin from '../entity/Admin';

class AdminViewUsersController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminViewUsersController]', e); return { success: false, data: [], message: 'Failed to load users.' }; }
  }

  // @return {Promise<{ success, data: Array, message }>}
  async fetchAllUsers() {
    return this._safe(async () => {
      const result = await Admin.fetchAllUsers();
      if (result.success && Array.isArray(result.data) && result.data.length > 0) {
        return result;
      }
      // Fallback to seeded data
      return Admin.fetchUsersSeeded();
    });
  }

  // Client-side search across user name and email
  // @param  {Array}  users
  // @param  {string} query
  // @return {Array}
  searchUsers(users, query) {
    if (!query?.trim()) return users;
    const q = query.toLowerCase().trim();
    return users.filter((u) =>
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  }
}

export default AdminViewUsersController;
