// Normal Flow
//   1. Boundary mounts → calls fetchAllPlans()
//   2. Controller asks entity for data via MembershipPlan.fetchAll()
//   3. Controller filters/validates via entity static methods
//   4. Returns result envelope to boundary for rendering
//
// Alternative / Exceptional Flows
//   1a. No active plans  → { success: false, message }
//   1b. Error in entity  → _safeCall catches, returns error envelope


import MembershipPlan from '../entity/MembershipPlan';

class ViewPricingPlansController {
  constructor() {}

  // Private: safe async wrapper
  // Catches any error thrown by entity calls and converts it
  // to the standard error response envelope.
  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      console.error('[ViewPricingPlansController]', error);
      return {
        success: false,
        data:    [],
        message: 'Unable to load pricing plans. Please try again.',
      };
    }
  }

  // Normal Flow
  // Delegates data fetching entirely to the entity, then
  // applies entity-level filters before returning to boundary.
  //
  async fetchAllPlans() {
    return this._safeCall(async () => {

      // Step 2: ask the entity for all plans
      const plans = await MembershipPlan.getAll();

      // Alt Flow 1a: no active plans available
      if (!MembershipPlan.hasAvailablePlans(plans)) {
        return {
          success: false,
          data:    [],
          message: 'No pricing plans are currently available.',
        };
      }

      // Step 3: return filtered + sorted active plans
      return {
        success: true,
        data:    MembershipPlan.getActivePlans(plans),
        message: '',
      };
    });
  }
}

export default ViewPricingPlansController;