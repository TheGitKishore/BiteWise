// Normal Flow (UC #14, #49)
//   1. User taps Delete Account and confirms
//   2. Boundary calls terminateAccount()
//   3. Controller passes user to User.terminateAccount()
//   4. Account deleted — boundary navigates to LoginScreen
//
// Alt Flow 1a: unable to delete → { success: false, message }
// Shared by Free User (#14) and Premium User (#49)

import User from '../entity/User';

class TerminateAccountController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[TerminateAccountController]', error);
      return { success: false, message: 'Something went wrong. Please try again.' };
    }
  }

  // UC #14, #49
  // @param  {User} user
  // @return {Promise<{ success, message }>}
  async terminateAccount(user) {
    return this._safeCall(async () => {
      return await User.terminateAccount(user);
    });
  }
}

export default TerminateAccountController;
