// entities/membership/MembershipPlan.js
// Represents a subscribable plan displayed on the Pricing page.
// Unregistered users can browse these plans and their features.

class MembershipPlan {
  constructor({
    planId       = null,
    name         = '',         // 'Free' | 'Premium' | 'Elite'
    price        = 0,          // 0 for Free
    billingCycle = '',         // 'monthly' | 'yearly' | 'none'
    featureIds   = [],
    isActive     = true,
  } = {}) {
    this.planId       = planId;
    this.name         = name;
    this.price        = price;
    this.billingCycle = billingCycle;
    this.featureIds   = featureIds;
    this.isActive     = isActive;
  }
}

export default MembershipPlan;
