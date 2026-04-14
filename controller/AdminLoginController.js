// Normal Flow (UC #102)
//   1. Admin enters credentials on AdminLoginScreen
//   2. Boundary calls login({ username, password })
//   3. Controller delegates to User.login() then validates role === ADMIN
//   4. Returns user if ADMIN, rejects otherwise
// Seeded credentials: adminuser / admin123
// System Admin only (#102)

import User from '../entity/User';

class AdminLoginController {
  constructor() {}

  // UC #102
  async login({ username, password }) {
    const result = await User.login({ username, password });
    if (!result.success) return result;
    if (result.user?.role !== 'ADMIN') return { success: false, message: 'Access denied. Admin credentials required.', user: null };
    return { success: true, message: 'Admin login successful.', user: result.user };
  }
}

export default AdminLoginController;
