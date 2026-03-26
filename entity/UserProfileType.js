import axios from 'axios'; //everything entity file needs this two lines of code
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


  // DATA ACCESS
  // @return {Promise<UserProfileType[]>}
  // Replace w API calls
  /*
  static async fetchAll() {
    const raw = [
      {
        profileTypeId: 1,
        type:          USER_PROFILE_TYPES.MEAL_PLANNER,
        displayName:   'Meal Planner',
        description:   'Perfect for those who love planning their meals in advance',
        imageUrl:      null,
        features: [
          'Weekly meal planning calendar',
          'Grocery list generator',
          'Recipe organisation',
          'Batch cooking suggestions',
          'Budget-friendly meal ideas',
        ],
      },
      {
        profileTypeId: 2,
        type:          USER_PROFILE_TYPES.ATHLETE,
        displayName:   'Athletes',
        description:   'Optimised for peak athletic performance and recovery',
        imageUrl:      null,
        features: [
          'Protein and macro tracking',
          'Pre/post-workout meal timing',
          'Performance nutrition insights',
          'Hydration tracking',
          'Recovery meal suggestions',
        ],
      },
      {
        profileTypeId: 3,
        type:          USER_PROFILE_TYPES.HEALTH_ORIENTED,
        displayName:   'Health-Oriented',
        description:   'Focus on overall wellness and healthy lifestyle choices',
        imageUrl:      null,
        features: [
          'Balanced nutrition guidance',
          'Heart-healthy recipes',
          'Weight management tools',
          'Vitamin and mineral tracking',
          'Dietary restriction support',
        ],
      },
    ];

    return raw.map((r) => new UserProfileType(r));
  }
}
*/
}
export default UserProfileType;
