// Normal Flow (UC #07)
//   1. Boundary mounts → calls fetchAllReviews()
//   2. Controller asks entity for data via Review.fetchAll()
//   3. Controller filters to approved only via entity static method
//   4. Returns reviews + average rating to boundary
//
// Alt Flow 1a: no approved reviews → { success: false, message }
// Alt Flow 1b: error in entity → _safeCall catches, returns error envelope

import Review from '../entity/Review';

class ViewReviewsController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewReviewsController]', error);
      return {
        success:       false,
        data:          [],
        averageRating: 0,
        message:       'Unable to load reviews. Please try again.',
      };
    }
  }

  async fetchAllReviews() {
    return this._safeCall(async () => {
      const all      = await Review.fetchAll();
      const approved = Review.getApprovedReviews(all);

      // Alt Flow 1a: no approved reviews
      if (!Review.hasApprovedReviews(all)) {
        return {
          success:       false,
          data:          [],
          averageRating: 0,
          message:       'No reviews are currently available.',
        };
      }

      return {
        success:       true,
        data:          approved,
        averageRating: Review.getAverageRating(all),
        message:       '',
      };
    });
  }
}

export default ViewReviewsController;