// Normal Flow (UC #44, #97)
//   1. User fills rating, title, content → taps "Submit Review"
//   2. Boundary calls submitReview()
//   3. Controller delegates to Review.create()
//   4. Returns success → boundary shows confirmation banner
//
// Alt Flow 1a: missing/invalid fields → { success: false, field, message }
// Free User (#44) and Premium User (#97)

import Review from '../entity/Review';

class WriteReviewController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[WriteReviewController]', error);
      return { success: false, field: null, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #44, #97
  // @param  {number} userId
  // @param  {{ rating, title, content, profileType }}
  // @return {Promise<{ success, field, message, data }>}
  async submitReview(userId, fields) {
    return this._safeCall(async () => {
      return await Review.create(userId, fields);
    });
  }
}

export default WriteReviewController;
