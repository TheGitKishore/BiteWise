// Normal Flow (UC #106)
//   1. Admin selects a PENDING application → taps Approve or Reject
//   2. System prompts for confirmation and reason (reject only)
//   3. Boundary calls approveApplication() or rejectApplication()
//   4. On approval, controller also promotes user role to CURATOR
//
// Alt Flow 6a: admin cancels → no action
// System Admin only (#106)

import CuratorApplication from '../entity/CuratorApplication';
import User               from '../entity/User';

class ApproveCuratorApplicationController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (error) {
      console.error('[ApproveCuratorApplicationController]', error);
      return { success: false, message: 'Something went wrong. Please try again.', data: null };
    }
  }

  // UC #106 — approve an application and promote user to CURATOR
  // @param  {string} applicationId
  // @param  {number} adminId
  // @return {Promise<{ success, message, data }>}
  async approveApplication(applicationId, adminId) {
    return this._safeCall(async () => {
      const result = await CuratorApplication.approve(applicationId, adminId);
      if (result.success && result.data) {
        await User.promoteToMinuteCurator(result.data.userId, applicationId);
      }
      return result;
    });
  }

  // UC #106 — reject an application with a reason
  // @param  {string} applicationId
  // @param  {number} adminId
  // @param  {string} reason
  // @return {Promise<{ success, message, data }>}
  async rejectApplication(applicationId, adminId, reason) {
    return this._safeCall(async () => CuratorApplication.reject(applicationId, adminId, reason));
  }
}

export default ApproveCuratorApplicationController;
