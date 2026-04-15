// Normal Flow (UC #83)
//   1. Premium user fills the Curator application form
//   2. Boundary calls submitApplication()
//   3. Controller validates fields and calls User.applyCuratorProgram()
//   4. Returns { success, message } to boundary
//
// Alt Flow 1a: required fields missing → { success: false, field, message }
// Premium User only (#83)

import CuratorApplication from '../entity/CuratorApplication';

class ApplyCuratorProgramController {
  validateApplication({ motivation, journey, expertise }) {
    const errors = {};
    if (!motivation?.trim()) errors.motivation = 'Required.';
    if (!journey?.trim()) errors.journey = 'Required.';
    if (!expertise?.trim()) errors.expertise = 'Required.';
    return { valid: Object.keys(errors).length === 0, errors };
  }

  async submitApplication(userId, username, data) {
    const { valid, errors } = this.validateApplication(data);
    if (!valid) {
      return { success: false, errors, message: 'Please fill in all required fields.' };
    }

    return await CuratorApplication.create(userId, username, data);
  }
}

export default ApplyCuratorProgramController;
