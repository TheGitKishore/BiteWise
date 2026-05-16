// AdminRemoveReviewController.js — UC #104 System Admin – Manage Reviews (Remove)
//
// Normal Flow:
//   1. Admin views Reviews tab → taps Remove button on a review card
//   2. Boundary shows Alert.alert confirm with reviewer name
//   3. On confirm → boundary calls removeReview(reviewId)
//   4. Controller delegates to Admin.removeReviewSeeded() (seeded) or Review.remove()
//   5. Returns { success, message } — boundary removes card + shows success banner
//
// Alt Flow 6a: Admin cancels → Alert dismissed, no action
// System Admin only

import Admin from '../entity/Admin';

class AdminRemoveReviewController {
  constructor() {}

  async _safe(fn) {
    try {
      return await fn();
    } catch (e) {
      console.error('[AdminRemoveReviewController]', e);
      return {
        success: false,
        message: 'Failed to remove review.'
      };
    }
  }

  // UC #104 — remove review
  async removeReview(reviewId) {
    return this._safe(async () => {
      if (!reviewId) {
        return { success: false, message: 'Invalid review.' };
      }

      const res = await Admin.removeReview(reviewId);

      if (!res.success) {
        return {
          success: false,
          message: res.message || 'Failed to remove review'
        };
      }

      return res;
    });
  }
}

export default AdminRemoveReviewController;
