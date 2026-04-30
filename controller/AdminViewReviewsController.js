import Admin from '../entity/Admin';

class AdminViewReviewsController {
  constructor() {}

  async _safe(fn) {
    try {
      const data = await fn();
    
      return {
        success: true,
        data: data   // 👈 IMPORTANT FIX
      };
    } catch (e) {
      console.error('[AdminViewReviewsController]', e);
      return {
        success: false,
        data: [],
        message: 'Failed to load reviews.'
      };
    }
  }

  // UC #103 — Fetch all reviews from backend
  async fetchAllReviews() {
    return this._safe(async () => {
      return await Admin.fetchReviews();
    });
  }

  // Client-side search
  searchReviews(reviews, query) {
    if (!query?.trim()) return reviews;

    const q = query.toLowerCase().trim();

    return reviews.filter((r) =>
      (r.reviewerName || '').toLowerCase().includes(q) ||
      (r.content || '').toLowerCase().includes(q)
    );
  }
}

export default AdminViewReviewsController;