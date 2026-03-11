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


  // DATA ACCESS
  // @return {Promise<Review[]>}
  // Replace w API/Server Calls
  static async fetchAll() {
    const raw = [
      {
        reviewId:         1,
        userId:           101,
        reviewerName:     'Sarah Johnson',
        reviewerInitials: 'SJ',
        profileType:      'Meal Planner',
        rating:           5,
        title:            '',
        content:          'BiteWise has completely transformed how I plan my meals. The auto-generate feature is a lifesaver!',
        membershipPlanId: 3,
        isApproved:       true,
        createdAt:        '2024-02-20',
      },
      {
        reviewId:         2,
        userId:           102,
        reviewerName:     'Mike Chen',
        reviewerInitials: 'MC',
        profileType:      'Athlete',
        rating:           5,
        title:            '',
        content:          'Perfect for tracking macros and keeping my nutrition on point for training. Highly recommend!',
        membershipPlanId: 3,
        isApproved:       true,
        createdAt:        '2024-02-18',
      },
      {
        reviewId:         3,
        userId:           103,
        reviewerName:     'Emily Davis',
        reviewerInitials: 'ED',
        profileType:      'Health-Oriented',
        rating:           4,
        title:            '',
        content:          'Great app for monitoring my daily intake. The BMI tracking feature helps me stay on track with my health goals.',
        membershipPlanId: 2,
        isApproved:       true,
        createdAt:        '2024-02-15',
      },
    ];

    return raw.map((r) => new Review(r));
  }
}

export default Review;