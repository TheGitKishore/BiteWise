// Normal Flow (UC #104)
//   1. Admin views reviews list → taps Remove on a review
//   2. Admin specifies reason and confirms
//   3. Boundary calls removeReview(reviewId)
//   4. Controller delegates to Review.remove()
// Alt Flow 6a: admin cancels → no action
// System Admin only (#104)

import Review from '../entity/Review';

class AdminRemoveReviewController {
  constructor() {}
  async _safeCall(fn) { try { return await fn(); } catch (e) { console.error('[AdminRemoveReviewController]', e); return { success: false, message: 'Failed to remove review.' }; } }

  // Fetch all reviews for moderation panel
  async fetchAllReviews() {
    return this._safeCall(async () => {
      const reviews = await Review.fetchAll();
      return { success: true, data: reviews, message: '' };
    });
  }

  // UC #104 — remove a review
  async removeReview(reviewId) { return this._safeCall(async () => Review.remove(reviewId)); }
}

export default AdminRemoveReviewController;
