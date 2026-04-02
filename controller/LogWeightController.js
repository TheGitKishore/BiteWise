// Normal Flow (UC #34, #84)
//   1. User enters weight → taps "Update Weight"
//   2. Boundary calls logWeight()
//   3. Controller validates and delegates to WeightEntry.create()
//   4. Returns entry → boundary shows banner, prepends to history list
//
// Alt Flow 1a: invalid weight → { success: false, field, message }
// Free (#34) and Premium (#84)

import WeightEntry from '../entity/WeightEntry';

class LogWeightController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[LogWeightController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #34, #84
  // @param  {number} userId
  // @param  {{ weightKg, notes }}
  // @return {Promise<{ success, field, message, data }>}
  async logWeight(userId, fields) {
    return this._safeCall(async () => {
      return await WeightEntry.create(userId, fields);
    });
  }
}

export default LogWeightController;
