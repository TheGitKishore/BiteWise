// AdminLogoutController.js — UC #99 System Admin – Log Out
//
// Normal Flow:
//   1. Admin taps logout button (→ icon in header)
//   2. Boundary calls logout()
//   3. Controller clears session and returns success
//   4. Boundary navigates to AdminLoginScreen with showLogoutBanner=true
//      so the login screen shows "Logged out successfully" green banner
//
// System Admin only

class AdminLogoutController {
  constructor() {}

  // @return {Promise<{ success, message }>}
  async logout() {
    try {
      // Session clearing handled by navigation reset — no server call required
      return { success: true, message: 'Logged out successfully' };
    } catch (e) {
      console.error('[AdminLogoutController]', e);
      return { success: false, message: 'Logout failed. Please try again.' };
    }
  }
}

export default AdminLogoutController;
