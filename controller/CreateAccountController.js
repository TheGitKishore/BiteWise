// Normal Flow (UC #08, #09)
//   1. User inputs details and selects a plan
//   2. Boundary calls createAccount()
//   3. Controller passes all inputs to User.createAccount()
//   4. Entity handles all validation, plan assignment and creation
//   5. Controller returns entity result envelope to boundary
//
// Alt Flows handled entirely inside User.createAccount()

import User from '../entity/User';

class CreateAccountController {
  constructor() {}

  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[CreateAccountController]', error);
      return {
        success: false,
        field:   null,
        message: 'Something went wrong. Please try again.',
      };
    }
  }

  // UC #08 / #09
  // @param  {{ username, email, password, confirmPassword, selectedPlanId }}
  // @return {Promise<{ success, field, message }>}
  async createAccount({ username, email, password, confirmPassword, selectedPlanId }) {
    return this._safeCall(async () => {
      return await User.createAccount({ username, email, password, confirmPassword, selectedPlanId });
    });
  }
}

export default CreateAccountController;
