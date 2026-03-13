// Normal Flow (UC #11, #46)
//   1. User taps Log Out
//   2. Boundary calls logout()
//   3. Controller passes to User.logout()
//   4. Session ended — boundary navigates to LoginScreen
//
// Shared by Free User (#11) and Premium User (#46) — same action

import User from '../entity/User';

class LogOutController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[LogOutController]', error);
      return { success: false, message: 'Something went wrong. Please try again.' };
    }
  }

  // UC #11, #46
  // @return {Promise<{ success, message }>}
  async logout() {
    return this._safeCall(async () => {
      return await User.logout();
    });
  }
}

export default LogOutController;
