// Normal Flow (Step 4 — Change Profile in Account Settings)
//   1. User opens AccountSettingsScreen → Profile Type section visible
//   2. User selects a new profile from dropdown → taps "Update Profile"
//   3. Alert prompts for confirmation → user confirms
//   4. Boundary calls updateProfileType(userId, profileType)
//   5. Controller delegates to User.setProfileType()
//   6. Returns result to boundary; banner shows success/error
//
// Applies to: Free User and Premium User

import User            from '../entity/User';
import UserProfileType from '../entity/UserProfileType';

class UpdateProfileTypeController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[UpdateProfileTypeController]', e); return { success: false, message: 'Failed to update profile. Please try again.', data: null }; }
  }

  // Get all profile options for the dropdown
  // @return {Array<{ profileType, label, emoji, description }>}
  getAllProfileOptions() {
    return ['ATHLETE', 'HEALTH_ORIENTED', 'MEAL_PLANNER'].map(pt => ({
      profileType: pt,
      ...UserProfileType.getProfileMeta(pt),
    }));
  }

  // Get metadata for a specific profile type (for display)
  // @param  {string} profileType
  // @return {{ label, emoji, description, appName }}
  getProfileMeta(profileType) {
    return UserProfileType.getProfileMeta(profileType);
  }

  // UC — update the user's profile type
  // @param  {number} userId
  // @param  {string} profileType
  // @return {Promise<{ success, message, data }>}
  async updateProfileType(userId, profileType) {
    return this._safeCall(async () => User.setProfileType(userId, profileType));
  }
}

export default UpdateProfileTypeController;
