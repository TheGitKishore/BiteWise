import axios from 'axios'; //everything entity file needs this two lines of code
const API_URL = 'http://192.168.1.36:3000/api/membership-plans';

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

  toJSON() {
    return {
      plan_id:       this.planId,
      name:          this.name,
      price:         this.price,
      billing_cycle: this.billingCycle,
      description:   this.description,
      features:      this.features,
      feature_ids:   this.featureIds,
      is_popular:    this.isPopular,
      is_active:     this.isActive,
    };
  }

  // STATIC / COLLECTION METHODS
   static fromRow(row) {
    if (!row) return null;

    let parsedFeatures = [];
    let parsedFeatureIds = [];

    if (Array.isArray(row.features)) {
      parsedFeatures = row.features;
    } else if (typeof row.features === 'string') {
      try {
        parsedFeatures = JSON.parse(row.features);
      } catch (error) {
        parsedFeatures = [];
      }
    }

    if (Array.isArray(row.feature_ids)) {
      parsedFeatureIds = row.feature_ids;
    } else if (typeof row.feature_ids === 'string') {
      try {
        parsedFeatureIds = JSON.parse(row.feature_ids);
      } catch (error) {
        parsedFeatureIds = [];
      }
    }

    return new MembershipPlan({
      planId: row.plan_id,
      name: row.name,
      price: Number(row.price) || 0,
      billingCycle: row.billing_cycle || '',
      description: row.description || '',
      features: parsedFeatures,
      featureIds: parsedFeatureIds,
      isPopular: Boolean(row.is_popular),
      isActive: Boolean(row.is_active),
    });
   }
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
  // Sole source of plan seed data. Returns hydrated
  // MembershipPlan instances ready for the controller to use.
  // replace the return body with a real API call once
  // backend is available
  static async getAll() {
    const res = await axios.get(API_URL);
    return res.data.map((row) => MembershipPlan.fromRow(row));
  }

  static async getById(planId) {
    const res = await axios.get(`${API_URL}/${planId}`);
    return MembershipPlan.fromRow(res.data);
  }

  static async getActive() {
    const res = await axios.get(`${API_URL}/active`);
    return res.data.map((row) => MembershipPlan.fromRow(row));
  }

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
  */

}
export default MembershipPlan;
