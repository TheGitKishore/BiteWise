import axios from 'axios'; 
import API_CONFIG from './api_config.js';
const API_URL = `${API_CONFIG}/user-profile-types`;


// For the user profile types
export const USER_PROFILE_TYPES = Object.freeze({
  MEAL_PLANNER:    'MEAL_PLANNER',
  ATHLETE:         'ATHLETE',
  HEALTH_ORIENTED: 'HEALTH_ORIENTED',
});

class UserProfileType {
  constructor({
    profileTypeId     = null,
    type              = '',     // from USER_PROFILE_TYPES
    displayName       = '',
    description       = '',
    features          = [],     // string[] — key feature list
    imageUrl          = null,
  } = {}) {
    this.profileTypeId = profileTypeId;
    this.type          = type;
    this.displayName   = displayName;
    this.description   = description;
    this.features      = features;
    this.imageUrl      = imageUrl;
  }

  getFeatureList() {
    return this.features;
  }

  isAvailable() {
    return this.profileTypeId !== null;
  }

  toJSON() {
    return {
      profile_type_id: this.profileTypeId,
      type:            this.type,
      display_name:    this.displayName,
      description:     this.description,
      features:        this.features,
      image_url:       this.imageUrl,
    };
  }
  // STATIC / COLLECTION METHODS

  static fromRow(row) {
    if (!row) return null;

    let parsedFeatures = [];

    if (Array.isArray(row.features)) {
      parsedFeatures = row.features;
    } else if (typeof row.features === 'string') {
      try {
        parsedFeatures = JSON.parse(row.features);
      } catch (error) {
        parsedFeatures = [];
      }
    }
    
    return new UserProfileType({
      profileTypeId: row.profile_type_id,
      type:          row.type,
      displayName:   row.display_name,
      description:   row.description,
      features:        parsedFeatures,
      imageUrl:      row.image_url ?? null,
    });
  }
  // @param  {UserProfileType[]} profiles
  // @return {boolean}
  static hasAvailableProfiles(profiles) {
    return profiles.some((p) => p.isAvailable());
  }

  // @param  {UserProfileType[]} profiles
  // @param  {string}            type — from USER_PROFILE_TYPES
  // @return {UserProfileType|null}
  static findByType(profiles, type) {
    return profiles.find((p) => p.type === type) ?? null;
  }

  // =========================
  // API METHODS (AXIOS)
  // =========================

  static async getAll() {
    try {
      const res = await axios.get(API_URL);
      return res.data.map(row => UserProfileType.fromRow(row));
    } catch (error) {
      console.error('Error fetching profile types:', error);
      return [];
    }
  }

  static async getById(profileTypeId) {
    try {
      const res = await axios.get(`${API_URL}/${profileTypeId}`);
      return UserProfileType.fromRow(res.data);
    } catch (error) {
      console.error('Error fetching profile type by ID:', error);
      return null;
    }
  }

  static async getByType(type) {
    try {
      const res = await axios.get(`${API_URL}/type/${type}`);
      return UserProfileType.fromRow(res.data);
    } catch (error) {
      console.error('Error fetching profile type by type:', error);
      return null;
    }
  }

  // =========================
  // UTILS
  // =========================

  static hasAvailableProfiles(profiles) {
    return profiles.some((p) => p.isAvailable());
  }

  static findByType(profiles, type) {
    return profiles.find((p) => p.type === type) ?? null;
  }

  // ─── SPRINT 7 ADDITIONS ────────────────────────────────────────────────────

  // Step 3 — compute recommended profile type from onboarding survey answers.
  // answers: array of { questionIndex: number, answerIndex: number }
  // Returns 'ATHLETE' | 'HEALTH_ORIENTED' | 'MEAL_PLANNER'
  //
  // Scoring map: each question/answer combination awards points to one or
  // more profile types. The type with the highest cumulative score wins.
  static computeProfileFromAnswers(answers) {
    // Points awarded per [questionIndex][answerIndex] — keyed by profile type
    const SCORING = [
      // Q1: What's your main goal right now?
      [{ HO:1 }, { HO:1 }, { A:1 }, { MP:1 }, { MP:1 }],
      // Q2: Which sounds most like you?
      [{ HO:1, A:1 }, { A:1 }, { MP:1 }, { HO:1 }],
      // Q3: How active are you?
      [{ MP:1 }, { HO:1 }, { A:1 }],
      // Q4: What would you most likely open this app to do?
      [{ A:1 }, { HO:1 }, { MP:1 }],
      // Q5: How do you usually decide what to eat?
      [{ A:1 }, { HO:1 }, { MP:1 }],
      // Q6: What makes you feel like you're doing well?
      [{ A:1 }, { HO:1 }, { MP:1 }],
      // Q7: Which approach do you prefer?
      [{ A:1 }, { HO:1 }, { MP:1 }],
      // Q8: Which statement sounds most like you?
      [{ A:1 }, { HO:1 }, { MP:1 }],
      // Q9: What would make this app most useful to you?
      [{ A:1 }, { HO:1 }, { MP:1 }],
      // Q10: What motivates you the most?
      [{ A:1 }, { HO:1 }, { MP:1 }],
    ];

    const scores = { A: 0, HO: 0, MP: 0 };
    for (const { questionIndex, answerIndex } of answers) {
      const row = SCORING[questionIndex];
      if (!row) continue;
      const pts = row[answerIndex];
      if (!pts) continue;
      if (pts.A)  scores.A  += pts.A;
      if (pts.HO) scores.HO += pts.HO;
      if (pts.MP) scores.MP += pts.MP;
    }

    // Pick highest score; ties → HO default
    if (scores.A >= scores.HO && scores.A >= scores.MP) return 'ATHLETE';
    if (scores.MP > scores.HO && scores.MP > scores.A)  return 'MEAL_PLANNER';
    return 'HEALTH_ORIENTED';
  }

  // Profile display metadata (used by OnboardingScreen + AccountSettingsScreen)
  static getProfileMeta(profileType) {
    const META = {
      ATHLETE: {
        label:       'Athlete',
        emoji:       '🏋️',
        description: 'Optimised for performance, muscle gain and precise macro tracking.',
        appName:     'BiteWise for Athletes',
      },
      HEALTH_ORIENTED: {
        label:       'Health Oriented',
        emoji:       '🥗',
        description: 'Focused on overall wellness, balanced nutrition and healthy habits.',
        appName:     'BiteWise Health',
      },
      MEAL_PLANNER: {
        label:       'Meal Planner',
        emoji:       '📋',
        description: 'Built for those who prefer planning meals ahead with minimal daily tracking.',
        appName:     'BiteWise for Meal Planners',
      },
    };
    return META[profileType] || META.HEALTH_ORIENTED;
  }

}
export default UserProfileType;
