// Normal Flow (UC #36, #87)
//   1. User enters height → taps "Update Height"
//   2. Boundary calls logHeight()
//   3. Controller validates and delegates to HeightEntry.create()
//   4. Returns entry → boundary shows banner, updates current height
//
// Alt Flow 1a: invalid height → { success: false, field, message }
// Free (#36) and Premium (#87)

import HeightEntry from '../entity/HeightEntry';

class LogHeightController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[LogHeightController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #36, #87
  // @param  {number} userId
  // @param  {{ heightCm, notes }}
  // @return {Promise<{ success, field, message, data }>}
  async logHeight(userId, fields) {
    return this._safeCall(async () => {
      return await HeightEntry.create(userId, fields);
    });
  }
}

export default LogHeightController;
