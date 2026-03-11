// entities/review/Review.js
// A rating + written review left by a registered user about the app / plan.
// Visible to unregistered users on the landing/reviews page after admin approval.

class Review {
  constructor({
    reviewId          = null,
    userId            = null,
    rating            = 0,          // 1–5 stars
    title             = '',
    content           = '',
    membershipPlanId  = null,        // which plan they're reviewing (optional)
    isApproved        = false,       // Admin must approve before public display
    approvedByAdminId = null,
    createdAt         = null,
    updatedAt         = null,
  } = {}) {
    this.reviewId          = reviewId;
    this.userId            = userId;
    this.rating            = rating;
    this.title             = title;
    this.content           = content;
    this.membershipPlanId  = membershipPlanId;
    this.isApproved        = isApproved;
    this.approvedByAdminId = approvedByAdminId;
    this.createdAt         = createdAt;
    this.updatedAt         = updatedAt;
  }
}

export default Review;
