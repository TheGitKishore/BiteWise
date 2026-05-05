// Normal Flow (UC #105)
//   1. Admin dashboard mounts → boundary calls fetchApplications()
//   2. Controller delegates to CuratorApplication.fetchAll()
//   3. Returns all applications sorted by date to boundary
//
// System Admin only (#105)

import CuratorApplication from '../entity/CuratorApplication';

class ViewCuratorApplicationsController {
  constructor() {}

  async _safeCall(fn) {
    try { return await fn(); }
    catch (error) {
      console.error('[ViewCuratorApplicationsController]', error);
      return { success: false, data: [], message: 'Unable to load applications. Please try again.' };
    }
  }

  // UC #105
  // @return {Promise<{ success, data, message }>}
  async fetchApplications() {
    return this._safeCall(async () => CuratorApplication.fetchAll());
  }
}

export default ViewCuratorApplicationsController;
