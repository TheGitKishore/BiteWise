// Normal Flow (UC #102)
//   1. Admin enters credentials on AdminLoginScreen
//   2. Boundary calls login({ username, password })
//   3. Controller delegates to User.login() then validates role === ADMIN
//   4. Returns user if ADMIN, rejects otherwise
// Seeded credentials: adminuser / admin123
// System Admin only (#102)

import Admin from '../entity/Admin';

class AdminLoginController {
  async login({ username, password }) {
    return await Admin.login({ username, password });
  }
}

export default AdminLoginController;
