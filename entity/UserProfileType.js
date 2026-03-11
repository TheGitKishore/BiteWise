// entities/profile/UserProfileType.js
// The three user profile types that personalise the experience.
// Unregistered users can browse these before signing up.
// Registered users select one during onboarding.

export const USER_PROFILE_TYPES = Object.freeze({
  MEAL_PLANNER:    'MEAL_PLANNER',    // Normal Adult — general healthy eating
  ATHLETE:         'ATHLETE',         // Performance / muscle gain / energy
  HEALTH_ORIENTED: 'HEALTH_ORIENTED', // Adults with conditions (diabetes, etc.)
});

class UserProfileType {
  constructor({
    profileTypeId     = null,
    type              = '',        // from USER_PROFILE_TYPES
    displayName       = '',
    description       = '',
    featureHighlights = [],        // string[] — bullet points shown on the browse page
    imageUrl          = null,
  } = {}) {
    this.profileTypeId     = profileTypeId;
    this.type              = type;
    this.displayName       = displayName;
    this.description       = description;
    this.featureHighlights = featureHighlights;
    this.imageUrl          = imageUrl;
  }
}

export default UserProfileType;
