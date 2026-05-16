// A single feature line belonging to a MembershipPlan. Fetched
// and displayed when an unregistered user clicks into a
// specific plan to see what is included. isHighlighted flags
// key features for visual emphasis in the UI.


class MembershipPlanFeature {
  constructor({
    featureId     = null,
    planId        = null,
    featureName   = '',
    description   = '',
    isHighlighted = false,
  } = {}) {
    this.featureId     = featureId;
    this.planId        = planId;
    this.featureName   = featureName;
    this.description   = description;
    this.isHighlighted = isHighlighted;
  }
}

export default MembershipPlanFeature;
