// Normal Flow (UC #03, #04, #05, #06)
//   1. Boundary mounts → calls fetchAllProfiles()
//   2. Controller asks entity for data via UserProfileType.fetchAll()
//   3. Returns result envelope to boundary for rendering
//
// Alt Flow 1a: no profiles → { success: false, message }
// Alt Flow 1b: error in entity → _safeCall catches, returns error envelope

import UserProfileType from '../entity/UserProfileType';

class ViewUserProfileFeaturesController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewUserProfileFeaturesController]', error);
      return {
        success: false,
        data:    [],
        message: 'Unable to load user profiles. Please try again.',
      };
    }
  }

  async fetchAllProfiles() {
    return this._safeCall(async () => {
      const profiles = await UserProfileType.getAll();

      // Alt Flow 1a: no profiles available
      if (!UserProfileType.hasAvailableProfiles(profiles)) {
        return {
          success: false,
          data:    [],
          message: 'No user profiles are currently available.',
        };
      }

      return {
        success: true,
        data:    profiles,
        message: '',
      };
    });
  }
}

export default ViewUserProfileFeaturesController;