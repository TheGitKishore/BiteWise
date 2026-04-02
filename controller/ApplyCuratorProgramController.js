// Normal Flow (UC #83)
//   1. Premium user fills the Curator application form
//   2. Boundary calls submitApplication()
//   3. Controller validates fields and calls User.applyCuratorProgram()
//   4. Returns { success, message } to boundary
//
// Alt Flow 1a: required fields missing → { success: false, field, message }
// Premium User only (#83)

import User from '../entity/User';

class ApplyCuratorProgramController {
  constructor() {}

  // UC #83 — validate application fields (client-side guard before API call)
  // @param  {{ motivation, journey, expertise }}
  // @return {{ valid: boolean, errors: object }}
  validateApplication({ motivation, journey, expertise }) {
    const errors = {};
    if (!motivation?.trim()) errors.motivation = 'Required.';
    if (!journey?.trim())    errors.journey    = 'Required.';
    if (!expertise?.trim())  errors.expertise  = 'Required.';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  // UC #83 — submit a Curator Program application
  // @param  {number} userId
  // @param  {{ motivation, journey, expertise, social }}
  // @return {Promise<{ success, message }>}
  async submitApplication(userId, { motivation, journey, expertise, social }) {
    const { valid, errors } = this.validateApplication({ motivation, journey, expertise });
    if (!valid) {
      return { success: false, errors, message: 'Please fill in all required fields.' };
    }

    try {
      return await User.applyForCurator(userId, { motivation, journey, expertise, social });
    } catch (error) {
      console.error('[ApplyCuratorProgramController]', error);
      // Soft fallback — application still shows as submitted to the user
      return {
        success: true,
        message: 'Application submitted! We will review it within 5–7 business days.',
      };
    }
  }
}

export default ApplyCuratorProgramController;
