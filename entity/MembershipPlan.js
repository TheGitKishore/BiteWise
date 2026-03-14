class MembershipPlan {

  constructor({
    planId        = null,
    name          = '',       // 'Free' | 'Basic' | 'Premium'
    price         = 0,
    billingCycle  = '',       // 'monthly' | 'yearly' | '' (free)
    description   = '',       // Short tagline shown on pricing card
    features      = [],       // string[] — bullet list of included features
    featureIds    = [],       // FK links to MembershipPlanFeature records
    isPopular     = false,    // drives "Most Popular" badge (UC #01)
    isActive      = true,
  } = {}) {
    this.planId       = planId;
    this.name         = name;
    this.price        = price;
    this.billingCycle = billingCycle;
    this.description  = description;
    this.features     = features;
    this.featureIds   = featureIds;
    this.isPopular    = isPopular;
    this.isActive     = isActive;
  }

  // human-readable price string for the plan card.
  getFormattedPrice() {
    if (this.price === 0) return '$0';
    const cycle = this.billingCycle ? ` /${this.billingCycle}` : '';
    return `$${this.price.toFixed(2)}${cycle}`;
  }

  // plan only surfaces when active.
  isAvailable() {
    return this.isActive === true;
  }

  // Returns true for the $0 tier; used for conditional UI treatment
  isFree() {
    return this.price === 0;
  }

  // Returns true when this plan should carry the "Most Popular" highlight badge
  isMostPopular() {
    return this.isPopular === true;
  }

  // Returns the feature bullet list (string[]).
  // Boundary iterates this directly — no transformation needed.
  getFeatureList() {
    return this.features;
  }

  // STATIC / COLLECTION METHODS
  

  // filters to active plans only and sorts ascending by price (Free → Premium).
  
  // @param  {MembershipPlan[]} plans
  // @return {MembershipPlan[]}
  static getActivePlans(plans) {
    return plans
      .filter((p) => p.isAvailable())
      .sort((a, b) => a.price - b.price);
  }

  // Alt Flow guard — used by the controller before returning data to the boundary.
  
  // @param  {MembershipPlan[]} plans
  // @return {boolean}
  static hasAvailablePlans(plans) {
    return plans.some((p) => p.isAvailable());
  }

  // Finds a single plan by planId within a collection.
  // Used when the user taps into a specific plan.
  
  // @param  {MembershipPlan[]} plans
  // @param  {number}           planId
  // @return {MembershipPlan|null}
  static findById(plans, planId) {
    return plans.find((p) => p.planId === planId) ?? null;
  }

    // DATA ACCESS
  // @return {Promise<MembershipPlan[]>}
  static async fetchAll() {
    const res = await fetch('http://localhost:8000/api/plans/');
    if (!res.ok) throw new Error('Failed to load plans');
    const raw = await res.json();
    return raw.map((r) => new MembershipPlan({
      planId:       r.plan_id,
      name:         r.plan_name,
      price:        parseFloat(r.price_sgd),
      billingCycle: r.billing_cycle,
      description:  r.description,
      features:     JSON.parse(r.features),
      isPopular:    r.plan_name === 'Premium',
      isActive:     r.is_active === 1,
    }));
  }
}

  // DATA ACCESS
  // Sole source of plan seed data. Returns hydrated
  // MembershipPlan instances ready for the controller to use.
  // replace the return body with a real API call once
  // backend is available
  
  // @return {Promise<MembershipPlan[]>}
  /*
  static async fetchAll() {
    const raw = [
      {
        planId:       1,
        name:         'Free',
        price:        0,
        billingCycle: '',
        description:  'Perfect for getting started with calorie tracking.',
        isPopular:    false,
        isActive:     true,
        featureIds:   [1, 2, 3],
        features: [
          'Calorie tracking (up to 5 meals/day)',
          'Basic food database search',
          'Daily calorie goal setting',
          'Manual food entry',
          'Basic nutrition summary',
        ],
      },
      {
        planId:       2,
        name:         'Basic',
        price:        9.99,
        billingCycle: 'monthly',
        description:  'For serious trackers who want deeper insights.',
        isPopular:    false,
        isActive:     true,
        featureIds:   [1, 2, 3, 4, 5],
        features: [
          'Everything in Free',
          'Unlimited meal logging',
          'Macronutrient breakdown',
          'Recipe recommendations',
          'Weekly nutrition report',
          'Camera food recognition',
        ],
      },
      {
        planId:       3,
        name:         'Premium',
        price:        19.99,
        billingCycle: 'monthly',
        description:  'All features included — the complete BiteWise experience.',
        isPopular:    true,
        isActive:     true,
        featureIds:   [1, 2, 3, 4, 5, 6, 7],
        features: [
          'Everything in Basic',
          'Personalised meal prep plans',
          'Grocery list generation',
          'Barcode scanning',
          'Custom food & recipe creation',
          'Monthly nutrition report',
          'Health diary',
        ],
      },
    ];

    return raw.map((r) => new MembershipPlan(r));
  }
}
*/

export default MembershipPlan;