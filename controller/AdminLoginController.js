// AdminLoginController.js — UC #98 System Admin – Log In
//
// Normal Flow:
//   1. Admin enters credentials on AdminLoginScreen
//   2. Boundary calls login({ username, password })
//   3. Controller delegates to Admin.login()
//   4. Returns { success, user, message } to boundary
//   5. Boundary navigates to AdminDashboardScreen on success
//
// Alt Flow 3a: invalid credentials → { success: false, message: 'Incorrect Username or Password' }
// System Admin only

import Admin from '../entity/Admin';

class AdminLoginController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminLoginController]', e); return { success: false, message: 'Login failed. Please try again.' }; }
  }

  // @param  {{ username, password }} credentials
  // @return {Promise<{ success, user, message }>}
  async login({ username, password }) {
    return this._safe(async () => {
      if (!username?.trim() || !password) {
        return { success: false, message: 'Username and password are required.' };
      }
    
      const res = await Admin.login({
        username: username.trim(),
        password
      });
    
      if (!res) {
        return { success: false, message: 'Invalid server response.' };
      }
    
      return res;
    });
  }
}

export default AdminLoginController;
