import User from '../entity/User';

class UserController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[UserController]', error);
      return {
        success: false,
        data: null,
        message: 'Something went wrong. Please try again.'
      };
    }
  }

  // ✅ THIS is what your screen is calling
  async getUser(userId) {
    return this._safeCall(async () => {
      return await User.getUser(userId);
    });
  }
}

export default UserController;