// Normal Flow (UC #10, #45)
//   1. User inputs username and password
//   2. Boundary calls login()
//   3. Controller passes credentials to User.login()
//   4. Entity validates and returns user session
//   5. Controller returns result envelope to boundary
//
// Alt Flow 1a: incorrect credentials → { success: false, message }

import User from '../entity/User';

class LoginController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[LoginController]', error);
      return {
        success: false,
        message: 'Something went wrong. Please try again.',
        user:    null,
      };
    }
  }

  // UC #10, #45
  // @param  {{ username: string, password: string }}
  // @return {Promise<{ success, message, user }>}
  async login({ username, password }) {
    return this._safeCall(async () => {
      return await User.login({ username, password });
    });
  }
}

export default LoginController;
