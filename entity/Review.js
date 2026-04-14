import axios from 'axios'; //everything entity file needs this two lines of code
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/reviews`;

class Review {
  constructor({
    reviewId          = null,
    userId            = null,
    reviewerName      = '',
    reviewerInitials  = '',
    profileType       = '',     // 'Meal Planner' | 'Athlete' | 'Health-Oriented'
    rating            = 0,      // 1 - 5
    title             = '',
    content           = '',
    membershipPlanId  = null,
    isApproved        = false,
    approvedByAdminId = null,
    createdAt         = null,
    updatedAt         = null,
  } = {}) {
    this.reviewId          = reviewId;
    this.userId            = userId;
    this.reviewerName      = reviewerName;
    this.reviewerInitials  = reviewerInitials;
    this.profileType       = profileType;
    this.rating            = rating;
    this.title             = title;
    this.content           = content;
    this.membershipPlanId  = membershipPlanId;
    this.isApproved        = isApproved;
    this.approvedByAdminId = approvedByAdminId;
    this.createdAt         = createdAt;
    this.updatedAt         = updatedAt;
  }


  // STATIC VALIDATION METHODS

  // UC #44, #97 — validate review fields
  // @param  {{ rating, title, content }}
  // @return {{ valid: boolean, field: string|null, message: string }}
  static validateReview({ rating, title, content }) {
    if (!rating || Number(rating) < 1 || Number(rating) > 5) {
      return { valid: false, field: 'rating', message: 'Please select a rating between 1 and 5.' };
    }
    if (!title || title.trim().length === 0) {
      return { valid: false, field: 'title', message: 'Review title is required.' };
    }
    if (!content || content.trim().length < 10) {
      return { valid: false, field: 'content', message: 'Review must be at least 10 characters.' };
    }
    return { valid: true, field: null, message: '' };
  }


  // STATIC / COLLECTION METHODS

  // Returns only approved reviews — unregistered users see approved only
  // @param  {Review[]} reviews
  // @return {Review[]}
  static getApprovedReviews(reviews) {
    return reviews.filter((r) => r.isApproved);
  }

  // @param  {Review[]} reviews
  // @return {boolean}
  static hasApprovedReviews(reviews) {
    return reviews.some((r) => r.isApproved);
  }

  // @param  {Review[]} reviews
  // @return {number} — rounded to 1 decimal place
  static getAverageRating(reviews) {
    const approved = Review.getApprovedReviews(reviews);
    if (approved.length === 0) return 0;
    const total = approved.reduce((sum, r) => sum + r.rating, 0);
    return Math.round((total / approved.length) * 10) / 10;
  }


  // DATA ACCESS

  // UC #07 — fetch all reviews (approved shown to public)
  // @return {Promise<Review[]>}
  static async fetchAll() {
    const res = await axios.get(API_URL);

    return res.data.map((r) => new Review({
      reviewId:          r.review_id,
      userId:            r.review_user_id,
      reviewerName:      r.reviewer_name,
      reviewerInitials:  r.reviewer_initials,
      profileType:       r.profile_type,
      rating:            r.rating,
      title:             r.title ?? '',
      content:           r.content,
      membershipPlanId:  r.membership_plan_id ?? null,
      isApproved:        r.is_approved === 1,
      approvedByAdminId: r.approved_by_admin_id ?? null,
      createdAt:         r.created_at,
      updatedAt:         r.updated_at ?? null,
    }));
  }

  // UC #44, #97 — submit a new review
  // @param  {number} userId
  // @param  {{ rating, title, content, profileType }}
  // @return {Promise<{ success, field, message, data }>}
  static async create(userId, { rating, title, content, profileType }) {
    const check = Review.validateReview({ rating, title, content });
    if (!check.valid) {
      return { success: false, field: check.field, message: check.message, data: null };
    }

    try {
      const res = await axios.post(API_URL, {
        userId,
        rating:      Number(rating),
        title:       title.trim(),
        content:     content.trim(),
        profileType: profileType || '',
      });
      return res.data;
    } catch (err) {
      console.log('SUBMIT REVIEW ERROR:', err.response?.data || err.message);
      return {
        success: false, field: null,
        message: err.response?.data?.message || 'Failed to submit review.',
        data: null,
      };
    }
  }

  // ─── SPRINT 5 ADDITIONS ────────────────────────────────────────────────────

  // UC #104 — admin: remove a user review
  // Seeded stub: confirms removal without mutating server data.
  // @param  {string} reviewId
  // @return {Promise<{ success, message }>}
  static async remove(reviewId) {
    return { success: true, message: 'Review removed.' };
  }

}

export default Review;
