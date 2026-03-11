// entities/curator/CuratorApplication.js
// Submitted by an Elite User who wants to become a Curator.
// Reviewed and approved/rejected by a System Admin.

class CuratorApplication {
  constructor({
    applicationId     = null,
    userId            = null,
    motivation        = '',
    specialization    = '',      // 'nutrition' | 'fitness' | 'wellness'
    experienceSummary = '',
    status            = 'PENDING', // 'PENDING' | 'APPROVED' | 'REJECTED'
    submittedAt       = null,
    reviewedAt        = null,
    reviewedByAdminId = null,
    rejectionReason   = '',
  } = {}) {
    this.applicationId     = applicationId;
    this.userId            = userId;
    this.motivation        = motivation;
    this.specialization    = specialization;
    this.experienceSummary = experienceSummary;
    this.status            = status;
    this.submittedAt       = submittedAt;
    this.reviewedAt        = reviewedAt;
    this.reviewedByAdminId = reviewedByAdminId;
    this.rejectionReason   = rejectionReason;
  }
}

export default CuratorApplication;
