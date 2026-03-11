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


  // STATIC / COLLECTION METHODS

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


  // DATA ACCESS
  // @return {Promise<UserProfileType[]>}
  // Replace w API calls
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

export default UserProfileType;
