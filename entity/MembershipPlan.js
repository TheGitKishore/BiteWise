class MembershipPlan {

  constructor({
    planId        = null,
    name          = '',       // 'Free' | 'Premium'
    price         = 0,
    billingCycle  = '',       // 'monthly' | '' (free)
    description   = '',
    features      = [],
    featureIds    = [],
    isPopular     = false,
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

  getFormattedPrice() {
    if (this.price === 0) return '$0';
    const cycle = this.billingCycle ? ` /${this.billingCycle}` : '';
    return `$${this.price.toFixed(2)}${cycle}`;
  }

  isAvailable() {
    return this.isActive === true;
  }

  isFree() {
    return this.price === 0;
  }

  isMostPopular() {
    return this.isPopular === true;
  }

  getFeatureList() {
    return this.features;
  }


  // STATIC / COLLECTION METHODS

  // @param  {MembershipPlan[]} plans
  // @return {MembershipPlan[]}
  static getActivePlans(plans) {
    return plans
      .filter((p) => p.isAvailable())
      .sort((a, b) => a.price - b.price);
  }

  // @param  {MembershipPlan[]} plans
  // @return {boolean}
  static hasAvailablePlans(plans) {
    return plans.some((p) => p.isAvailable());
  }

  // @param  {MembershipPlan[]} plans
  // @param  {number}           planId
  // @return {MembershipPlan|null}
  static findById(plans, planId) {
    return plans.find((p) => p.planId === planId) ?? null;
  }


  // DATA ACCESS
  // @return {Promise<MembershipPlan[]>}
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
        name:         'Premium',
        price:        19.99,
        billingCycle: 'monthly',
        description:  'All features included — the complete BiteWise experience.',
        isPopular:    true,
        isActive:     true,
        featureIds:   [1, 2, 3, 4, 5, 6, 7],
        features: [
          'Everything in Free',
          'Unlimited meal logging',
          'Macronutrient breakdown',
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

export default MembershipPlan;
