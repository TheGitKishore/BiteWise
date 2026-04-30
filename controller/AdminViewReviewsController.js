// AdminViewReviewsController.js — UC #103 System Admin – View User Reviews
//
// Normal Flow:
//   1. Admin navigates to Reviews tab in AdminDashboardScreen
//   2. Boundary calls fetchAllReviews()
//   3. Controller tries Review.fetchAll(); falls back to Admin.fetchReviewsSeeded()
//   4. Returns review list to boundary for display
//
// System Admin only

import Admin from '../entity/Admin';
import Review from '../entity/Review';

class AdminViewReviewsController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) { console.error('[AdminViewReviewsController]', e); return { success: false, data: [], message: 'Failed to load reviews.' }; }
  }

  // @return {Promise<{ success, data: Array, message }>}
  async fetchAllReviews() {
    return this._safe(async () => {
      try {
        const reviews = await Review.fetchAll();
        if (Array.isArray(reviews) && reviews.length > 0) {
          return { success: true, data: reviews, message: '' };
        }
      } catch (_) {}
      // Fallback to seeded data
      return Admin.fetchReviewsSeeded();
    });
  }

  // Client-side search across reviewer name and content
  // @param  {Array}  reviews
  // @param  {string} query
  // @return {Array}
  searchReviews(reviews, query) {
    if (!query?.trim()) return reviews;
    const q = query.toLowerCase().trim();
    return reviews.filter((r) =>
      (r.reviewerName || '').toLowerCase().includes(q) ||
      (r.content || r.body || '').toLowerCase().includes(q)
    );
  }
}

export default AdminViewReviewsController;
