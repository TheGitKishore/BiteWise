// Normal Flow (Step 3 — Onboarding Survey)
//   1. OnboardingScreen mounts after successful CreateAccount
//   2. User answers 10 questions → taps "What is my profile?"
//   3. Boundary calls computeProfile(answers) → controller returns recommended type
//   4. User confirms or chooses another profile
//   5. Boundary calls saveProfile(userId, profileType) → Profile saved
//   6. Navigates to LoginScreen
//
// Applies to: Free User and Premium User (first login only)

import UserProfileType from '../entity/UserProfileType';
import User            from '../entity/User';

class OnboardingController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (e) { console.error('[OnboardingController]', e); return { success: false, message: 'Something went wrong. Please try again.', data: null }; }
  }

  // Step 1 — compute recommended profile from survey answers
  // @param  {Array<{ questionIndex: number, answerIndex: number }>} answers
  // @return {{ profileType, meta }}
  computeProfile(answers) {
    const profileType = UserProfileType.computeProfileFromAnswers(answers);
    const meta        = UserProfileType.getProfileMeta(profileType);
    return { profileType, meta };
  }

  // Step 2 — get profile metadata for display (used for dropdown options)
  // @return {Array<{ profileType, label, emoji, description }>}
  getAllProfileOptions() {
    return ['ATHLETE', 'HEALTH_ORIENTED', 'MEAL_PLANNER'].map(pt => ({
      profileType: pt,
      ...UserProfileType.getProfileMeta(pt),
    }));
  }

  // Step 3 — persist chosen profile type to user record
  // @param  {number} userId
  // @param  {string} profileType — 'ATHLETE' | 'HEALTH_ORIENTED' | 'MEAL_PLANNER'
  // @return {Promise<{ success, message, data }>}
  async saveProfile(userId, profileType) {
    return this._safeCall(async () => User.setProfileType(userId, profileType));
  }
}

export default OnboardingController;
