// Normal Flow (UC #13, #48)
//   1. User edits username/email fields and taps Update Account
//   2. Boundary calls updateAccountDetails()
//   3. Controller passes user and new values to User.updateAccountDetails()
//   4. Entity validates and returns updated user
//   5. Boundary shows success banner and refreshes displayed details
//
// Alt Flow 1a: invalid fields → { success: false, field, message }
// Shared by Free User (#13) and Premium User (#48)

import User from '../entity/User';

class UpdateAccountDetailsController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[UpdateAccountDetailsController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', user: null };
    }
  }

  // UC #13, #48
  // @param  {User}   user
  // @param  {{ username: string, email: string }}
  // @return {Promise<{ success, field, message, user }>}
  async updateAccountDetails(user, { username, email }) {
    return this._safeCall(async () => {
      return await User.updateAccountDetails(user, { username, email });
    });
  }
}

export default UpdateAccountDetailsController;
