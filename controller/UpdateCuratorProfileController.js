// UpdateCuratorProfileController.js — UC #116 Curator – Update Profile
//
// Normal Flow:
//   1. Curator taps "Update Profile" on CuratorDashboardScreen
//   2. Navigation → UpdateCuratorProfileScreen (pre-filled with current expertise + bio)
//   3. Curator edits fields and taps "Save Changes"
//   4. Boundary calls updateProfile(userId, { expertise, bio })
//   5. Controller delegates to CuratorApplication.updateProfile()
//   6. Returns { success, message, data } to boundary
//   7. Boundary navigates back, shows success banner on CuratorDashboardScreen
//
// Alt Flow: expertise empty → { success: false, message: 'Expertise is required.' }
// Curator role only

import CuratorProfileEdit from '../entity/CuratorProfileEdit';

class UpdateCuratorProfileController {
  constructor() {}

  async _safe(fn) {
    try { return await fn(); }
    catch (e) {
      console.error('[UpdateCuratorProfileController]', e);
      return { success: false, message: 'Unable to update profile. Please try again.', data: null };
    }
  }

  // @param  {number|string} userId
  // @param  {{ expertise: string, bio: string }} fields
  // @return {Promise<{ success, message, data }>}
  async updateProfile(userId, { expertise, bio }) {
    return this._safe(async () => {
      if (!userId) return { success: false, message: 'Invalid user.', data: null };
      return CuratorProfileEdit.updateProfile(userId, { expertise, bio });
    });
  }
}

export default UpdateCuratorProfileController;
