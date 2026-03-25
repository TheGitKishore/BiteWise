import axios from 'axios'; //everything entity file needs this two lines of code
const API_URL = 'http://192.168.x.x:3000/api/reviews'; // ⚠️ change IP to your wifi ip 192.168.x.x (best to not show your ip address to anyone)

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
  // ✅ Fetch from backend using axios
  static async fetchAll() {
    const res = await axios.get(API_URL);

    return res.data.map((r) => new Review({
      reviewId: r.review_id,
      userId: r.review_user_id,
      reviewerName: r.reviewer_name,
      reviewerInitials: r.reviewer_initials,
      profileType: r.profile_type,
      rating: r.rating,
      title: r.title ?? '',
      content: r.content,
      membershipPlanId: r.membership_plan_id ?? null,
      isApproved: r.is_approved === 1,
      approvedByAdminId: r.approved_by_admin_id ?? null,
      createdAt: r.created_at,
      updatedAt: r.updated_at ?? null,
    }));
  }
}

export default Review;