/**
 * BiteWise — Controller Unit Tests (Batch 1 of 20 controllers)
 * =====================================================================
 * Controllers covered:
 *   AddGroceryItemController
 *   AdminApproveCuratorController
 *   AdminBanUserController
 *   AdminCuratorApplicationsController
 *   AdminLoginController
 *   AdminLogoutController
 *   AdminManageUsersController
 *   AdminOverviewController
 *   AdminRejectCuratorController
 *   AdminRemoveReviewController
 *   AdminSystemController
 *   AdminTerminateUserController
 *   AdminViewCuratorApplicationsController
 *   AdminViewReviewsController
 *   AdminViewUsersController
 *   ApplyCuratorProgramController
 *   ApproveCuratorApplicationController
 *   AutoCalculateNutritionController
 *   CameraFoodEntryController
 *   CheckDailyCalorieTargetController
 *
 * Testing strategy:
 *   - All entity dependencies mocked with jest.mock()
 *   - Tests cover: normal flow, alt flows (missing/invalid fields),
 *     entity error propagation, _safe/_safeCall wrappers catching throws
 *   - Pure-logic methods (validators, search filters, compute) tested
 *     without any mocks
 * =====================================================================
 */

jest.mock('../entity/GroceryList');
jest.mock('../entity/Admin');
jest.mock('../entity/CuratorApplication');
jest.mock('../entity/FoodIntakeEntry');
jest.mock('../entity/NutritionTargets');

import GroceryList          from '../entity/GroceryList';
import Admin                from '../entity/Admin';
import CuratorApplication   from '../entity/CuratorApplication';
import FoodIntakeEntry      from '../entity/FoodIntakeEntry';
import NutritionTargets     from '../entity/NutritionTargets';

import AddGroceryItemController              from '../controller/AddGroceryItemController';
import AdminApproveCuratorController         from '../controller/AdminApproveCuratorController';
import AdminBanUserController                from '../controller/AdminBanUserController';
import AdminCuratorApplicationsController   from '../controller/AdminCuratorApplicationsController';
import AdminLoginController                  from '../controller/AdminLoginController';
import AdminLogoutController                 from '../controller/AdminLogoutController';
import AdminManageUsersController            from '../controller/AdminManageUsersController';
import AdminOverviewController               from '../controller/AdminOverviewController';
import AdminRejectCuratorController          from '../controller/AdminRejectCuratorController';
import AdminRemoveReviewController           from '../controller/AdminRemoveReviewController';
import AdminSystemController                 from '../controller/AdminSystemController';
import AdminTerminateUserController          from '../controller/AdminTerminateUserController';
import AdminViewCuratorApplicationsController from '../controller/AdminViewCuratorApplicationsController';
import AdminViewReviewsController            from '../controller/AdminViewReviewsController';
import AdminViewUsersController              from '../controller/AdminViewUsersController';
import ApplyCuratorProgramController         from '../controller/ApplyCuratorProgramController';
import ApproveCuratorApplicationController   from '../controller/ApproveCuratorApplicationController';
import AutoCalculateNutritionController      from '../controller/AutoCalculateNutritionController';
import CameraFoodEntryController             from '../controller/CameraFoodEntryController';
import CheckDailyCalorieTargetController     from '../controller/CheckDailyCalorieTargetController';

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  console.error.mockRestore();
  console.log.mockRestore();
});
afterEach(() => jest.clearAllMocks());


// =====================================================================
//  1. AddGroceryItemController
// =====================================================================

describe('AddGroceryItemController — addItem()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AddGroceryItemController(); });

  test('delegates to GroceryList.addItem() and returns result', async () => {
    const mockResult = { success: true, data: { items: [{ name: 'Milk' }] }, message: 'Added' };
    GroceryList.addItem.mockResolvedValue(mockResult);

    const result = await ctrl.addItem(1, { name: 'Milk', quantity: 2, unit: 'liters' });

    expect(GroceryList.addItem).toHaveBeenCalledWith(1, { name: 'Milk', quantity: 2, unit: 'liters' });
    expect(result.success).toBe(true);
    expect(result.data.items[0].name).toBe('Milk');
  });

  test('returns validation error from GroceryList when name is empty', async () => {
    GroceryList.addItem.mockResolvedValue({ success: false, field: 'name', message: 'Item name is required.', data: null });

    const result = await ctrl.addItem(1, { name: '', quantity: 1, unit: 'pcs' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    GroceryList.addItem.mockRejectedValue(new Error('Network failure'));

    const result = await ctrl.addItem(1, { name: 'Eggs', quantity: 12, unit: 'pcs' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
    expect(result.data).toBeNull();
  });
});

describe('AddGroceryItemController — toggleItem()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AddGroceryItemController(); });

  test('delegates to GroceryList.toggleItem() and returns result', async () => {
    GroceryList.toggleItem.mockResolvedValue({ success: true, data: { items: [] }, message: 'Toggled' });

    const result = await ctrl.toggleItem(1, 'item-1');

    expect(GroceryList.toggleItem).toHaveBeenCalledWith(1, 'item-1');
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws from toggleItem', async () => {
    GroceryList.toggleItem.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.toggleItem(1, 'item-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  2. AdminApproveCuratorController
// =====================================================================

describe('AdminApproveCuratorController — approveApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminApproveCuratorController(); });

  test('returns success when Admin.approveApplication() succeeds', async () => {
    Admin.approveApplication.mockResolvedValue({ success: true, message: 'Approved' });

    const result = await ctrl.approveApplication('app-1', 'admin-1');

    expect(Admin.approveApplication).toHaveBeenCalledWith('app-1', 'admin-1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Approved');
  });

  test('returns { success: false } when applicationId is missing', async () => {
    const result = await ctrl.approveApplication(null, 'admin-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid request/i);
    expect(Admin.approveApplication).not.toHaveBeenCalled();
  });

  test('returns { success: false } when adminId is missing', async () => {
    const result = await ctrl.approveApplication('app-1', null);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid request/i);
    expect(Admin.approveApplication).not.toHaveBeenCalled();
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    Admin.approveApplication.mockRejectedValue(new Error('Server error'));

    const result = await ctrl.approveApplication('app-1', 'admin-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to approve/i);
  });
});


// =====================================================================
//  3. AdminBanUserController
// =====================================================================

describe('AdminBanUserController — banUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminBanUserController(); });

  test('delegates to Admin.banUser() and returns result', async () => {
    Admin.banUser.mockResolvedValue({ success: true, message: 'User deactivated' });

    const result = await ctrl.banUser(5);

    expect(Admin.banUser).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  test('returns invalid user message when userId is falsy', async () => {
    const result = await ctrl.banUser('');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid user/i);
    expect(Admin.banUser).not.toHaveBeenCalled();
  });

  test('_safe catches throws and returns generic error', async () => {
    Admin.banUser.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.banUser(5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('AdminBanUserController — unbanUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminBanUserController(); });

  test('delegates to Admin.unbanUser() and returns result', async () => {
    Admin.unbanUser.mockResolvedValue({ success: true, message: 'User reactivated' });

    const result = await ctrl.unbanUser(5);

    expect(Admin.unbanUser).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  test('returns invalid user message when userId is empty string', async () => {
    const result = await ctrl.unbanUser('');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid user/i);
    expect(Admin.unbanUser).not.toHaveBeenCalled();
  });

  test('_safe catches throws from unbanUser', async () => {
    Admin.unbanUser.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.unbanUser(5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  4. AdminCuratorApplicationsController
// =====================================================================

describe('AdminCuratorApplicationsController — fetchApplications()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminCuratorApplicationsController(); });

  test('delegates to CuratorApplication.fetchAll()', async () => {
    CuratorApplication.fetchAll.mockResolvedValue({ success: true, data: [{ applicationId: 1 }] });

    const result = await ctrl.fetchApplications();

    expect(CuratorApplication.fetchAll).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    CuratorApplication.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchApplications();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('AdminCuratorApplicationsController — approveApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminCuratorApplicationsController(); });

  test('delegates to Admin.approve() with applicationId and adminId', async () => {
    Admin.approve.mockResolvedValue({ success: true, message: 'Approved' });

    const result = await ctrl.approveApplication('app-1', 'admin-1');

    expect(Admin.approve).toHaveBeenCalledWith('app-1', 'admin-1');
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws', async () => {
    Admin.approve.mockRejectedValue(new Error('fail'));

    const result = await ctrl.approveApplication('app-1', 'admin-1');

    expect(result.success).toBe(false);
  });
});

describe('AdminCuratorApplicationsController — rejectApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminCuratorApplicationsController(); });

  test('delegates to Admin.reject() with reason', async () => {
    Admin.reject.mockResolvedValue({ success: true, message: 'Rejected' });

    const result = await ctrl.rejectApplication('app-1', 'admin-1', 'Not detailed enough');

    expect(Admin.reject).toHaveBeenCalledWith('app-1', 'admin-1', 'Not detailed enough');
    expect(result.success).toBe(true);
  });
});


// =====================================================================
//  5. AdminLoginController
// =====================================================================

describe('AdminLoginController — login()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminLoginController(); });

  test('delegates to Admin.login() and returns result on success', async () => {
    Admin.login.mockResolvedValue({ success: true, user: { adminId: 1, username: 'admin' } });

    const result = await ctrl.login({ username: 'admin', password: 'secret' });

    expect(Admin.login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('admin');
  });

  test('returns error when username is empty (no API call)', async () => {
    const result = await ctrl.login({ username: '', password: 'secret' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/username and password are required/i);
    expect(Admin.login).not.toHaveBeenCalled();
  });

  test('returns error when username is whitespace only (no API call)', async () => {
    const result = await ctrl.login({ username: '   ', password: 'secret' });

    expect(result.success).toBe(false);
    expect(Admin.login).not.toHaveBeenCalled();
  });

  test('returns error when password is missing (no API call)', async () => {
    const result = await ctrl.login({ username: 'admin', password: '' });

    expect(result.success).toBe(false);
    expect(Admin.login).not.toHaveBeenCalled();
  });

  test('trims whitespace from username before sending to Admin.login()', async () => {
    Admin.login.mockResolvedValue({ success: true, user: { adminId: 1, username: 'admin' } });

    await ctrl.login({ username: '  admin  ', password: 'secret' });

    expect(Admin.login).toHaveBeenCalledWith({ username: 'admin', password: 'secret' });
  });

  test('returns invalid server response error when Admin.login() returns null', async () => {
    Admin.login.mockResolvedValue(null);

    const result = await ctrl.login({ username: 'admin', password: 'secret' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid server response/i);
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    Admin.login.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.login({ username: 'admin', password: 'secret' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/login failed/i);
  });
});


// =====================================================================
//  6. AdminLogoutController
// =====================================================================

describe('AdminLogoutController — logout()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminLogoutController(); });

  test('returns success: true with correct message', async () => {
    const result = await ctrl.logout();

    expect(result.success).toBe(true);
    expect(result.message).toBe('Logged out successfully');
  });

  test('makes no external API calls', async () => {
    await ctrl.logout();

    // No entity mocks should have been touched
    expect(Admin.login).not.toHaveBeenCalled();
    expect(Admin.fetchAllUsers).not.toHaveBeenCalled();
  });
});


// =====================================================================
//  7. AdminManageUsersController
// =====================================================================

describe('AdminManageUsersController — fetchAllUsers()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminManageUsersController(); });

  test('delegates to Admin.fetchAllUsers() and returns data', async () => {
    Admin.fetchAllUsers.mockResolvedValue({ success: true, data: [{ userId: 1 }] });

    const result = await ctrl.fetchAllUsers();

    expect(Admin.fetchAllUsers).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  test('_safeCall catches throws and returns fallback', async () => {
    Admin.fetchAllUsers.mockRejectedValue(new Error('Connection lost'));

    const result = await ctrl.fetchAllUsers();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('AdminManageUsersController — deactivateUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminManageUsersController(); });

  test('delegates to Admin.deactivateUser() with targetUserId', async () => {
    Admin.deactivateUser.mockResolvedValue({ success: true, message: 'User deactivated' });

    const result = await ctrl.deactivateUser(5);

    expect(Admin.deactivateUser).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws', async () => {
    Admin.deactivateUser.mockRejectedValue(new Error('fail'));

    const result = await ctrl.deactivateUser(5);

    expect(result.success).toBe(false);
  });
});

describe('AdminManageUsersController — reactivateUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminManageUsersController(); });

  test('delegates to Admin.reactivateUser() with targetUserId', async () => {
    Admin.reactivateUser.mockResolvedValue({ success: true, message: 'User reactivated' });

    const result = await ctrl.reactivateUser(5);

    expect(Admin.reactivateUser).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws', async () => {
    Admin.reactivateUser.mockRejectedValue(new Error('fail'));

    const result = await ctrl.reactivateUser(5);

    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  8. AdminOverviewController
// =====================================================================

describe('AdminOverviewController — fetchOverviewStats()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminOverviewController(); });

  test('returns normalized data on success', async () => {
    Admin.fetchOverviewStats.mockResolvedValue({
      success: true,
      data: {
        totalUsers: 100, activeUsers: 90, premiumUsers: 30,
        bannedUsers: 5, totalReviews: 50, flaggedReviews: 2,
        pendingApplications: 3, systemStatus: 'OK',
      },
    });

    const result = await ctrl.fetchOverviewStats();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  test('returns failure when Admin.fetchOverviewStats() returns success: false', async () => {
    Admin.fetchOverviewStats.mockResolvedValue({ success: false, message: 'DB error' });

    const result = await ctrl.fetchOverviewStats();

    expect(result.success).toBe(false);
  });

  test('_safe catches throws and returns fallback error', async () => {
    Admin.fetchOverviewStats.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchOverviewStats();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to load overview/i);
  });
});


// =====================================================================
//  9. AdminRejectCuratorController
// =====================================================================

describe('AdminRejectCuratorController — rejectApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminRejectCuratorController(); });

  test('delegates to Admin.rejectApplication() and returns result', async () => {
    Admin.rejectApplication.mockResolvedValue({ success: true, message: 'Rejected' });

    const result = await ctrl.rejectApplication('app-1', 'admin-1', 'Not qualified');

    expect(Admin.rejectApplication).toHaveBeenCalledWith('app-1', 'admin-1', 'Not qualified');
    expect(result.success).toBe(true);
  });

  test('uses default reason "Rejected by admin" when reason omitted', async () => {
    Admin.rejectApplication.mockResolvedValue({ success: true, message: 'Rejected' });

    await ctrl.rejectApplication('app-1', 'admin-1');

    expect(Admin.rejectApplication).toHaveBeenCalledWith('app-1', 'admin-1', 'Rejected by admin');
  });

  test('returns error when applicationId is missing', async () => {
    const result = await ctrl.rejectApplication(null, 'admin-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid application or admin/i);
    expect(Admin.rejectApplication).not.toHaveBeenCalled();
  });

  test('returns error when adminId is missing', async () => {
    const result = await ctrl.rejectApplication('app-1', null);

    expect(result.success).toBe(false);
    expect(Admin.rejectApplication).not.toHaveBeenCalled();
  });

  test('returns failure message when Admin.rejectApplication() returns success: false', async () => {
    Admin.rejectApplication.mockResolvedValue({ success: false, message: 'Application not found' });

    const result = await ctrl.rejectApplication('app-1', 'admin-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Application not found');
  });

  test('_safe catches throws and returns fallback error', async () => {
    Admin.rejectApplication.mockRejectedValue(new Error('Unexpected'));

    const result = await ctrl.rejectApplication('app-1', 'admin-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to reject/i);
  });
});


// =====================================================================
//  10. AdminRemoveReviewController
// =====================================================================

describe('AdminRemoveReviewController — removeReview()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminRemoveReviewController(); });

  test('delegates to Admin.removeReview() and returns result', async () => {
    Admin.removeReview.mockResolvedValue({ success: true, message: 'Review deleted' });

    const result = await ctrl.removeReview('review-1');

    expect(Admin.removeReview).toHaveBeenCalledWith('review-1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Review deleted');
  });

  test('returns error when reviewId is missing', async () => {
    const result = await ctrl.removeReview('');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid review/i);
    expect(Admin.removeReview).not.toHaveBeenCalled();
  });

  test('returns error when reviewId is null', async () => {
    const result = await ctrl.removeReview(null);

    expect(result.success).toBe(false);
    expect(Admin.removeReview).not.toHaveBeenCalled();
  });

  test('returns failure message when Admin.removeReview() returns success: false', async () => {
    Admin.removeReview.mockResolvedValue({ success: false, message: 'Not found' });

    const result = await ctrl.removeReview('review-1');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Not found');
  });

  test('_safe catches throws and returns fallback error', async () => {
    Admin.removeReview.mockRejectedValue(new Error('Server error'));

    const result = await ctrl.removeReview('review-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to remove review/i);
  });
});


// =====================================================================
//  11. AdminSystemController
// =====================================================================

describe('AdminSystemController — fetchSystemInfo()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminSystemController(); });

  test('returns success: true with seeded system data', async () => {
    const result = await ctrl.fetchSystemInfo();

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.currentVersion).toBe('v1.0.0');
    expect(result.data.health).toBeDefined();
  });

  test('returns correct health status fields', async () => {
    const result = await ctrl.fetchSystemInfo();

    expect(result.data.health.dbStatus).toBe('Connected');
    expect(result.data.health.apiStatus).toBe('Normal');
    expect(result.data.health.serverUptime).toBe('99.9%');
  });

  test('pendingUpdates is an array', async () => {
    const result = await ctrl.fetchSystemInfo();

    expect(Array.isArray(result.data.pendingUpdates)).toBe(true);
  });

  test('makes no API calls (pure seeded data)', async () => {
    await ctrl.fetchSystemInfo();

    expect(Admin.fetchAllUsers).not.toHaveBeenCalled();
  });
});

describe('AdminSystemController — getUpdateStatus()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminSystemController(); });

  test('returns available: false', () => {
    const result = ctrl.getUpdateStatus();

    expect(result.available).toBe(false);
  });

  test('returns "No Updates Available" message', () => {
    const result = ctrl.getUpdateStatus();

    expect(result.message).toBe('No Updates Available');
  });
});


// =====================================================================
//  12. AdminTerminateUserController
// =====================================================================

describe('AdminTerminateUserController — terminateUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminTerminateUserController(); });

  test('delegates to Admin.terminateUser() and returns result', async () => {
    Admin.terminateUser.mockResolvedValue({ success: true, message: 'Account terminated' });

    const result = await ctrl.terminateUser(5);

    expect(Admin.terminateUser).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
  });

  test('returns error when userId is falsy', async () => {
    const result = await ctrl.terminateUser(null);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid user/i);
    expect(Admin.terminateUser).not.toHaveBeenCalled();
  });

  test('returns error when userId is 0 (falsy)', async () => {
    const result = await ctrl.terminateUser(0);

    expect(result.success).toBe(false);
    expect(Admin.terminateUser).not.toHaveBeenCalled();
  });

  test('_safe catches throws and returns fallback error', async () => {
    Admin.terminateUser.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.terminateUser(5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to terminate/i);
  });
});


// =====================================================================
//  13. AdminViewCuratorApplicationsController
// =====================================================================

describe('AdminViewCuratorApplicationsController — fetchApplications()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminViewCuratorApplicationsController(); });

  test('delegates to Admin.fetchApplications() and returns result', async () => {
    Admin.fetchApplications.mockResolvedValue({ success: true, data: [{ applicationId: 1, username: 'alice' }] });

    const result = await ctrl.fetchApplications();

    expect(Admin.fetchApplications).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  test('_safe catches throws and returns fallback with empty array', async () => {
    Admin.fetchApplications.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchApplications();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/failed to load applications/i);
  });
});

describe('AdminViewCuratorApplicationsController — searchApplications()', () => {
  let ctrl;
  const apps = [
    { username: 'alice',   email: 'alice@a.com',   expertise: 'Nutrition' },
    { username: 'bob',     email: 'bob@b.com',     expertise: 'Fitness'   },
    { username: 'charlie', email: 'charlie@c.com', expertise: 'Nutrition' },
  ];
  beforeEach(() => { ctrl = new AdminViewCuratorApplicationsController(); });

  test('returns all apps when query is empty', () => {
    expect(ctrl.searchApplications(apps, '')).toHaveLength(3);
  });

  test('returns all apps when query is only whitespace', () => {
    expect(ctrl.searchApplications(apps, '   ')).toHaveLength(3);
  });

  test('filters by username (case-insensitive)', () => {
    expect(ctrl.searchApplications(apps, 'alice')).toHaveLength(1);
  });

  test('filters by email', () => {
    const result = ctrl.searchApplications(apps, 'bob@b.com');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('bob');
  });

  test('filters by expertise', () => {
    const result = ctrl.searchApplications(apps, 'nutrition');
    expect(result).toHaveLength(2);
  });

  test('returns empty array when no match found', () => {
    expect(ctrl.searchApplications(apps, 'zzzzz')).toHaveLength(0);
  });
});


// =====================================================================
//  14. AdminViewReviewsController
// =====================================================================

describe('AdminViewReviewsController — fetchAllReviews()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminViewReviewsController(); });

  test('wraps Admin.fetchReviews() result in success envelope', async () => {
    const rawData = [{ review_id: 1, rating: 5 }, { review_id: 2, rating: 4 }];
    Admin.fetchReviews.mockResolvedValue(rawData);

    const result = await ctrl.fetchAllReviews();

    expect(result.success).toBe(true);
    expect(result.data).toEqual(rawData);
    expect(result.data).toHaveLength(2);
  });

  test('_safe catches throws and returns fallback with empty array', async () => {
    Admin.fetchReviews.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchAllReviews();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/failed to load reviews/i);
  });
});

describe('AdminViewReviewsController — searchReviews()', () => {
  let ctrl;
  const reviews = [
    { reviewerName: 'Alice',   content: 'Loved this app!' },
    { reviewerName: 'Bob',     content: 'Very helpful app.' },
    { reviewerName: 'Charlie', content: 'Not what I expected.' },
  ];
  beforeEach(() => { ctrl = new AdminViewReviewsController(); });

  test('returns all reviews when query is empty', () => {
    expect(ctrl.searchReviews(reviews, '')).toHaveLength(3);
  });

  test('filters by reviewerName (case-insensitive)', () => {
    const result = ctrl.searchReviews(reviews, 'alice');
    expect(result).toHaveLength(1);
    expect(result[0].reviewerName).toBe('Alice');
  });

  test('filters by content text', () => {
    const result = ctrl.searchReviews(reviews, 'helpful');
    expect(result).toHaveLength(1);
    expect(result[0].reviewerName).toBe('Bob');
  });

  test('returns empty array when no match', () => {
    expect(ctrl.searchReviews(reviews, 'zzzzz')).toHaveLength(0);
  });

  test('returns all when query is whitespace only', () => {
    expect(ctrl.searchReviews(reviews, '   ')).toHaveLength(3);
  });
});


// =====================================================================
//  15. AdminViewUsersController
// =====================================================================

describe('AdminViewUsersController — fetchAllUsers()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AdminViewUsersController(); });

  test('delegates to Admin.fetchAllUsers() and returns result', async () => {
    Admin.fetchAllUsers.mockResolvedValue({ success: true, data: [{ userId: 1, username: 'alice' }] });

    const result = await ctrl.fetchAllUsers();

    expect(Admin.fetchAllUsers).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  test('_safe catches throws and returns fallback with empty array', async () => {
    Admin.fetchAllUsers.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchAllUsers();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/failed to load users/i);
  });
});

describe('AdminViewUsersController — searchUsers()', () => {
  let ctrl;
  const users = [
    { firstName: 'Alice', lastName: 'Smith',  email: 'alice@a.com',   username: 'alice01'  },
    { firstName: 'Bob',   lastName: 'Jones',  email: 'bob@b.com',     username: 'bob99'    },
    { firstName: 'Carol', lastName: 'Taylor', email: 'carol@c.com',   username: 'carol_t'  },
  ];
  beforeEach(() => { ctrl = new AdminViewUsersController(); });

  test('returns all users when query is empty', () => {
    expect(ctrl.searchUsers(users, '')).toHaveLength(3);
  });

  test('filters by username', () => {
    const result = ctrl.searchUsers(users, 'alice01');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('alice01');
  });

  test('filters by email', () => {
    const result = ctrl.searchUsers(users, 'bob@b.com');
    expect(result).toHaveLength(1);
    expect(result[0].firstName).toBe('Bob');
  });

  test('filters by first name (case-insensitive full-name match)', () => {
    const result = ctrl.searchUsers(users, 'carol');
    expect(result).toHaveLength(1);
    expect(result[0].username).toBe('carol_t');
  });

  test('returns empty array when no match', () => {
    expect(ctrl.searchUsers(users, 'nobody')).toHaveLength(0);
  });

  test('returns all when query is whitespace only', () => {
    expect(ctrl.searchUsers(users, '   ')).toHaveLength(3);
  });
});


// =====================================================================
//  16. ApplyCuratorProgramController
// =====================================================================

describe('ApplyCuratorProgramController — validateApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ApplyCuratorProgramController(); });

  test('returns valid when all fields provided', () => {
    const result = ctrl.validateApplication({ motivation: 'I love health', journey: 'Been eating clean', expertise: 'Nutrition' });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('returns invalid when all fields are empty', () => {
    const result = ctrl.validateApplication({ motivation: '', journey: '', expertise: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.motivation).toBeDefined();
    expect(result.errors.journey).toBeDefined();
    expect(result.errors.expertise).toBeDefined();
  });

  test('returns error for motivation only when others are filled', () => {
    const result = ctrl.validateApplication({ motivation: '', journey: 'My journey', expertise: 'Nutrition' });
    expect(result.valid).toBe(false);
    expect(result.errors.motivation).toBeDefined();
    expect(result.errors.journey).toBeUndefined();
    expect(result.errors.expertise).toBeUndefined();
  });

  test('returns error for whitespace-only fields', () => {
    const result = ctrl.validateApplication({ motivation: '   ', journey: 'My journey', expertise: 'Nutrition' });
    expect(result.valid).toBe(false);
    expect(result.errors.motivation).toBeDefined();
  });
});

describe('ApplyCuratorProgramController — submitApplication()', () => {
  let ctrl;
  const validData = { motivation: 'I love health', journey: 'Been eating clean for 3 years', expertise: 'Nutrition', social: '' };
  beforeEach(() => { ctrl = new ApplyCuratorProgramController(); });

  test('returns validation errors without calling API when fields are empty', async () => {
    const result = await ctrl.submitApplication(1, 'alice', { motivation: '', journey: '', expertise: '' });

    expect(result.success).toBe(false);
    expect(result.errors).toBeDefined();
    expect(result.message).toMatch(/please fill in all required fields/i);
    expect(CuratorApplication.create).not.toHaveBeenCalled();
  });

  test('calls CuratorApplication.create() on valid fields', async () => {
    CuratorApplication.create.mockResolvedValue({ success: true, message: 'Submitted!' });

    const result = await ctrl.submitApplication(1, 'alice', validData);

    expect(CuratorApplication.create).toHaveBeenCalledWith(1, 'alice', validData);
    expect(result.success).toBe(true);
  });

  test('returns entity error when CuratorApplication.create() fails', async () => {
    CuratorApplication.create.mockResolvedValue({ success: false, message: 'Already applied' });

    const result = await ctrl.submitApplication(1, 'alice', validData);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Already applied');
  });
});


// =====================================================================
//  17. ApproveCuratorApplicationController
// =====================================================================

describe('ApproveCuratorApplicationController — approveApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ApproveCuratorApplicationController(); });

  test('calls CuratorApplication.approve() and promotes user on success', async () => {
    CuratorApplication.approve.mockResolvedValue({ success: true, data: { userId: 5 } });
    Admin.promoteToCurator.mockResolvedValue({ success: true });

    const result = await ctrl.approveApplication('app-1', 'admin-1');

    expect(CuratorApplication.approve).toHaveBeenCalledWith('app-1', 'admin-1');
    expect(Admin.promoteToCurator).toHaveBeenCalledWith(5, 'app-1');
    expect(result.success).toBe(true);
  });

  test('does NOT call promoteToCurator when approve returns no data.userId', async () => {
    CuratorApplication.approve.mockResolvedValue({ success: true, data: null });

    await ctrl.approveApplication('app-1', 'admin-1');

    expect(Admin.promoteToCurator).not.toHaveBeenCalled();
  });

  test('does NOT call promoteToCurator when approve returns success: false', async () => {
    CuratorApplication.approve.mockResolvedValue({ success: false, data: null });

    await ctrl.approveApplication('app-1', 'admin-1');

    expect(Admin.promoteToCurator).not.toHaveBeenCalled();
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    CuratorApplication.approve.mockRejectedValue(new Error('Server error'));

    const result = await ctrl.approveApplication('app-1', 'admin-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('ApproveCuratorApplicationController — rejectApplication()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ApproveCuratorApplicationController(); });

  test('delegates to CuratorApplication.reject() with reason', async () => {
    CuratorApplication.reject.mockResolvedValue({ success: true, message: 'Rejected' });

    const result = await ctrl.rejectApplication('app-1', 'admin-1', 'Not qualified');

    expect(CuratorApplication.reject).toHaveBeenCalledWith('app-1', 'admin-1', 'Not qualified');
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws and returns fallback', async () => {
    CuratorApplication.reject.mockRejectedValue(new Error('fail'));

    const result = await ctrl.rejectApplication('app-1', 'admin-1', 'reason');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  18. AutoCalculateNutritionController
// =====================================================================

describe('AutoCalculateNutritionController — getActivityLevels()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AutoCalculateNutritionController(); });

  test('returns an array of activity level strings', () => {
    // NutritionTargets.ACTIVITY_LEVELS is a named export — need to let it through
    // We mock only the default; named exports pass through in jest
    const levels = ctrl.getActivityLevels();
    expect(Array.isArray(levels)).toBe(true);
    expect(levels.length).toBeGreaterThan(0);
  });
});

describe('AutoCalculateNutritionController — getGoals()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new AutoCalculateNutritionController(); });

  test('returns an array of goal strings', () => {
    const goals = ctrl.getGoals();
    expect(Array.isArray(goals)).toBe(true);
    expect(goals.length).toBeGreaterThan(0);
  });
});

describe('AutoCalculateNutritionController — computeTargets()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new AutoCalculateNutritionController();
    // computeTargets delegates to NutritionTargets.computeTargets (static)
    NutritionTargets.computeTargets.mockReturnValue({
      calories: 2200, protein: 160, carbs: 270, fat: 73, fiber: 30,
    });
  });

  test('delegates to NutritionTargets.computeTargets() with correct params', () => {
    const user = { weightKg: 75, heightCm: 175, age: 28, gender: 'male' };

    const result = ctrl.computeTargets(user, 'Moderate', 'Maintain Weight');

    expect(NutritionTargets.computeTargets).toHaveBeenCalledWith({
      weightKg: 75, heightCm: 175, age: 28, gender: 'male',
      activityLevel: 'Moderate', goal: 'Maintain Weight',
    });
    expect(result.calories).toBe(2200);
    expect(result.protein).toBe(160);
    expect(result.fiber).toBe(30);
  });

  test('uses defaults (70kg 170cm 25y male) when user is null', () => {
    ctrl.computeTargets(null, 'Moderate', 'Maintain Weight');

    expect(NutritionTargets.computeTargets).toHaveBeenCalledWith({
      weightKg: 70, heightCm: 170, age: 25, gender: 'male',
      activityLevel: 'Moderate', goal: 'Maintain Weight',
    });
  });

  test('uses defaults for missing user fields', () => {
    ctrl.computeTargets({ weightKg: 80 }, 'Active', 'Gain Weight (+500 cal)');

    const call = NutritionTargets.computeTargets.mock.calls[0][0];
    expect(call.weightKg).toBe(80);
    expect(call.heightCm).toBe(170);  // default
    expect(call.age).toBe(25);        // default
    expect(call.gender).toBe('male'); // default
  });
});


// =====================================================================
//  19. CameraFoodEntryController
// =====================================================================

describe('CameraFoodEntryController — recogniseFood()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new CameraFoodEntryController(); });

  test('delegates to FoodIntakeEntry.recogniseFromCamera() and returns result', async () => {
    FoodIntakeEntry.recogniseFromCamera.mockResolvedValue({
      success: true, data: { foodName: 'Chicken Rice', calories: 600 }, message: 'Recognised',
    });
    const photo = { uri: 'file://photo.jpg', type: 'image/jpeg' };

    const result = await ctrl.recogniseFood(photo);

    expect(FoodIntakeEntry.recogniseFromCamera).toHaveBeenCalledWith(photo);
    expect(result.success).toBe(true);
    expect(result.data.foodName).toBe('Chicken Rice');
  });

  test('returns failure when food not recognised', async () => {
    FoodIntakeEntry.recogniseFromCamera.mockResolvedValue({ success: false, message: 'Food not recognised', data: null });

    const result = await ctrl.recogniseFood({ uri: 'file://unknown.jpg' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Food not recognised');
  });

  test('_safeCall catches unexpected throws', async () => {
    FoodIntakeEntry.recogniseFromCamera.mockRejectedValue(new Error('Camera error'));

    const result = await ctrl.recogniseFood({ uri: 'file://photo.jpg' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
    expect(result.data).toBeNull();
  });
});

describe('CameraFoodEntryController — logCameraEntry()', () => {
  let ctrl;
  const validFields = { foodName: 'Salad', calories: 200, protein: 10, carbs: 20, fat: 5, meal: 'Lunch' };
  beforeEach(() => { ctrl = new CameraFoodEntryController(); });

  test('delegates to FoodIntakeEntry.createFromCamera() and returns result', async () => {
    FoodIntakeEntry.createFromCamera.mockResolvedValue({ success: true, data: { source: 'camera' }, message: 'Logged' });

    const result = await ctrl.logCameraEntry(1, validFields);

    expect(FoodIntakeEntry.createFromCamera).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.source).toBe('camera');
  });

  test('returns failure when createFromCamera() fails', async () => {
    FoodIntakeEntry.createFromCamera.mockResolvedValue({ success: false, message: 'Missing meal' });

    const result = await ctrl.logCameraEntry(1, { ...validFields, meal: '' });

    expect(result.success).toBe(false);
  });

  test('_safeCall catches throws and returns generic error', async () => {
    FoodIntakeEntry.createFromCamera.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.logCameraEntry(1, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  20. CheckDailyCalorieTargetController
// =====================================================================

describe('CheckDailyCalorieTargetController — checkDailyTarget()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new CheckDailyCalorieTargetController();
    // The controller calls FoodIntakeEntry.getTodaySummary (static, not async)
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 1500, protein: 80, carbs: 180, fat: 50 });
  });

  test('returns correct consumed/goal/remaining/percentage when on track', () => {
    const result = ctrl.checkDailyTarget([], 2000);

    expect(result.consumed).toBe(1500);
    expect(result.goal).toBe(2000);
    expect(result.remaining).toBe(500);
    expect(result.percentage).toBe(75);
    expect(result.status).toBe('on_track');
    expect(result.message).toBe('');
  });

  test('returns status "exceeded" when consumed >= 100% of goal', () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 2200, protein: 0, carbs: 0, fat: 0 });

    const result = ctrl.checkDailyTarget([], 2000);

    expect(result.status).toBe('exceeded');
    expect(result.percentage).toBe(100); // capped at 100
    expect(result.remaining).toBe(0);
  });

  test('returns status "near_limit" when consumed is 85–99% of goal', () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 1750, protein: 0, carbs: 0, fat: 0 });

    const result = ctrl.checkDailyTarget([], 2000);

    expect(result.status).toBe('near_limit');
    expect(result.percentage).toBe(88);
  });

  test('returns no_target status when goal is 0', () => {
    const result = ctrl.checkDailyTarget([], 0);

    expect(result.status).toBe('no_target');
    expect(result.message).toMatch(/no daily calorie target/i);
    expect(result.goal).toBe(0);
  });

  test('returns no_target status when goal is null', () => {
    const result = ctrl.checkDailyTarget([], null);

    expect(result.status).toBe('no_target');
  });

  test('remaining is capped at 0 (never negative)', () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 3000, protein: 0, carbs: 0, fat: 0 });

    const result = ctrl.checkDailyTarget([], 2000);

    expect(result.remaining).toBe(0);
  });

  test('percentage is capped at 100 when consumed far exceeds goal', () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 5000, protein: 0, carbs: 0, fat: 0 });

    const result = ctrl.checkDailyTarget([], 2000);

    expect(result.percentage).toBe(100);
  });

  test('passes todaysEntries array through to FoodIntakeEntry.getTodaySummary()', () => {
    const entries = [{ calories: 300 }, { calories: 200 }];

    ctrl.checkDailyTarget(entries, 2000);

    expect(FoodIntakeEntry.getTodaySummary).toHaveBeenCalledWith(entries);
  });
});

describe('CheckDailyCalorieTargetController — fetchGoal()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new CheckDailyCalorieTargetController(); });

  test('returns calories from NutritionTargets on success', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: { calories: 1800 } });

    const goal = await ctrl.fetchGoal(1);

    expect(NutritionTargets.fetchByUser).toHaveBeenCalledWith(1);
    expect(goal).toBe(1800);
  });

  test('returns default 2000 when NutritionTargets.fetchByUser() fails', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: false });

    const goal = await ctrl.fetchGoal(1);

    expect(goal).toBe(2000);
  });

  test('returns default 2000 when data.calories is missing', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: {} });

    const goal = await ctrl.fetchGoal(1);

    expect(goal).toBe(2000);
  });

  test('returns default 2000 when fetchByUser() throws', async () => {
    NutritionTargets.fetchByUser.mockRejectedValue(new Error('Network error'));

    const goal = await ctrl.fetchGoal(1);

    expect(goal).toBe(2000);
  });
});
