// Normal Flow (UC #12, #47)
//   1. Screen mounts → boundary calls fetchAccountDetails()
//   2. Controller passes user session to User.getAccountDetails()
//   3. Entity returns account data
//   4. Controller returns result envelope to boundary
//
// Alt Flow 1a: unable to load → { success: false, message }
// Shared by Free User (#12) and Premium User (#47)

import User from '../entity/User';

class ViewAccountDetailsController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewAccountDetailsController]', error);
      return { success: false, data: null, message: 'Unable to load account details.' };
    }
  }

  // UC #12, #47
  // @param  {User} user
  // @return {Promise<{ success, data, message }>}
  async fetchAccountDetails(user) {
    return this._safeCall(async () => {
      return await User.getAccountDetails(user);
    });
  }
}

export default ViewAccountDetailsController;
