// entities/membership/MembershipPlanFeature.js
// An individual feature belonging to a MembershipPlan.
// Displayed on the Pricing page and per-profile feature pages.

class MembershipPlanFeature {
  constructor({
    featureId     = null,
    planId        = null,
    featureName   = '',
    description   = '',
    isHighlighted = false,   // pin as a "key feature" in the UI
  } = {}) {
    this.featureId     = featureId;
    this.planId        = planId;
    this.featureName   = featureName;
    this.description   = description;
    this.isHighlighted = isHighlighted;
  }
}

export default MembershipPlanFeature;
