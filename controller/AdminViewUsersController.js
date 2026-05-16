import Admin from '../entity/Admin';

class AdminViewUsersController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminViewUsersController]', e);
      return {
        success: false,
        data: [],
        message: 'Failed to load users.'
      };
    }
  }

  // UC #100 — Fetch all users from backend
  async fetchAllUsers() {
    return this._safe(async () => {
      return await Admin.fetchAllUsers();
    });
  }

  // Client-side search
  searchUsers(users, query) {
    if (!query?.trim()) return users;

    const q = query.toLowerCase().trim();

    return users.filter((u) =>
      `${u.firstName || ''} ${u.lastName || ''}`.toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.username || '').toLowerCase().includes(q)
    );
  }
}

export default AdminViewUsersController;