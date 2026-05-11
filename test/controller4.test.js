/**
 * BiteWise — Controller Unit Tests (Batch 4: controllers 61–80)
 * =====================================================================
 * Controllers covered:
 *   UpdateCustomRecipeController
 *   UpdateMealPlanController
 *   UpdateProfileTypeController
 *   UserController
 *   ViewAccountDetailsController
 *   ViewBlogPostsController
 *   ViewCuratorApplicationsController
 *   ViewCuratorBlogsController
 *   ViewCuratorProfileController
 *   ViewCuratorRecipesController
 *   ViewCurrentCalorieIntakeController
 *   ViewDiaryController
 *   ViewDineOutController
 *   ViewFoodAlternativesController
 *   ViewFoodDatabaseController
 *   ViewHealthGoalController
 *   ViewHealthReportController
 *   ViewHeightHistoryController
 *   ViewMealPlansController
 *   ViewMindfulSnackingController
 * =====================================================================
 */

jest.mock('../entity/Recipe');
jest.mock('../entity/MealPlan');
jest.mock('../entity/User');
jest.mock('../entity/UserProfileType');
jest.mock('../entity/BlogPost');
jest.mock('../entity/CuratorApplication');
jest.mock('../entity/RecipeDraft');
jest.mock('../entity/FoodIntakeEntry');
jest.mock('../entity/DiaryEntry');
jest.mock('../entity/NutritionTargets');
jest.mock('../entity/DineOut');
jest.mock('../entity/SmartEatingContent');
jest.mock('../entity/FoodItem');
jest.mock('../entity/HealthGoal');
jest.mock('../entity/HealthReport');
jest.mock('../entity/HeightEntry');

import Recipe             from '../entity/Recipe';
import MealPlan           from '../entity/MealPlan';
import User               from '../entity/User';
import UserProfileType    from '../entity/UserProfileType';
import BlogPost           from '../entity/BlogPost';
import CuratorApplication from '../entity/CuratorApplication';
import RecipeDraft        from '../entity/RecipeDraft';
import FoodIntakeEntry    from '../entity/FoodIntakeEntry';
import DiaryEntry         from '../entity/DiaryEntry';
import NutritionTargets   from '../entity/NutritionTargets';
import DineOut            from '../entity/DineOut';
import SmartEatingContent from '../entity/SmartEatingContent';
import FoodItem           from '../entity/FoodItem';
import HealthGoal         from '../entity/HealthGoal';
import HealthReport       from '../entity/HealthReport';
import HeightEntry        from '../entity/HeightEntry';

import UpdateCustomRecipeController    from '../controller/UpdateCustomRecipeController';
import UpdateMealPlanController        from '../controller/UpdateMealPlanController';
import UpdateProfileTypeController     from '../controller/UpdateProfileTypeController';
import UserController                  from '../controller/UserController';
import ViewAccountDetailsController    from '../controller/ViewAccountDetailsController';
import ViewBlogPostsController         from '../controller/ViewBlogPostsController';
import ViewCuratorApplicationsController from '../controller/ViewCuratorApplicationsController';
import ViewCuratorBlogsController      from '../controller/ViewCuratorBlogsController';
import ViewCuratorProfileController    from '../controller/ViewCuratorProfileController';
import ViewCuratorRecipesController    from '../controller/ViewCuratorRecipesController';
import ViewCurrentCalorieIntakeController from '../controller/ViewCurrentCalorieIntakeController';
import ViewDiaryController             from '../controller/ViewDiaryController';
import ViewDineOutController           from '../controller/ViewDineOutController';
import ViewFoodAlternativesController  from '../controller/ViewFoodAlternativesController';
import ViewFoodDatabaseController      from '../controller/ViewFoodDatabaseController';
import ViewHealthGoalController        from '../controller/ViewHealthGoalController';
import ViewHealthReportController      from '../controller/ViewHealthReportController';
import ViewHeightHistoryController     from '../controller/ViewHeightHistoryController';
import ViewMealPlansController         from '../controller/ViewMealPlansController';
import ViewMindfulSnackingController   from '../controller/ViewMindfulSnackingController';

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
//  61. UpdateCustomRecipeController
// =====================================================================

describe('UpdateCustomRecipeController — updateRecipe()', () => {
  let ctrl;
  const validFields = { title: 'Updated Salad', ingredients: ['Lettuce'], instructions: ['Mix'], tags: [] };
  beforeEach(() => { ctrl = new UpdateCustomRecipeController(); });

  test('delegates to Recipe.updateCustomRecipe() with correct args', async () => {
    Recipe.updateCustomRecipe.mockResolvedValue({ success: true, data: { title: 'Updated Salad' }, message: 'Updated!' });

    const result = await ctrl.updateRecipe('r-1', 5, validFields);

    expect(Recipe.updateCustomRecipe).toHaveBeenCalledWith('r-1', 5, validFields);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Updated Salad');
  });

  test('returns error when recipeId is missing (no API call)', async () => {
    const result = await ctrl.updateRecipe(null, 5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid recipe or user/i);
    expect(result.field).toBeNull();
    expect(result.data).toBeNull();
    expect(Recipe.updateCustomRecipe).not.toHaveBeenCalled();
  });

  test('returns error when userId is missing (no API call)', async () => {
    const result = await ctrl.updateRecipe('r-1', null, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid recipe or user/i);
    expect(Recipe.updateCustomRecipe).not.toHaveBeenCalled();
  });

  test('passes through validation failure from Recipe.updateCustomRecipe()', async () => {
    Recipe.updateCustomRecipe.mockResolvedValue({ success: false, field: 'title', message: 'Recipe name is required.', data: null });

    const result = await ctrl.updateRecipe('r-1', 5, { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.updateCustomRecipe.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.updateRecipe('r-1', 5, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/unable to update recipe/i);
    expect(result.data).toBeNull();
  });
});


// =====================================================================
//  62. UpdateMealPlanController
// =====================================================================

describe('UpdateMealPlanController — updateMealPlan()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new UpdateMealPlanController(); });

  test('delegates to MealPlan.update() and returns updated plan', async () => {
    MealPlan.update.mockResolvedValue({ planId: 'plan-1', name: 'Updated Plan', days: [] });

    const result = await ctrl.updateMealPlan('plan-1', { name: 'Updated Plan', days: [] });

    expect(MealPlan.update).toHaveBeenCalledWith('plan-1', { name: 'Updated Plan', days: [] });
    expect(result.success).toBe(true);
    expect(result.message).toBe('Meal plan updated successfully');
    expect(result.data).toBeDefined();
  });

  test('returns error when name is empty (no API call)', async () => {
    const result = await ctrl.updateMealPlan('plan-1', { name: '', days: [] });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/plan name is required/i);
    expect(MealPlan.update).not.toHaveBeenCalled();
  });

  test('returns error when name is whitespace only (no API call)', async () => {
    const result = await ctrl.updateMealPlan('plan-1', { name: '   ', days: [] });

    expect(result.success).toBe(false);
    expect(MealPlan.update).not.toHaveBeenCalled();
  });

  test('catches unexpected throws and returns fallback error', async () => {
    MealPlan.update.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.updateMealPlan('plan-1', { name: 'Plan', days: [] });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to update meal plan/i);
  });
});


// =====================================================================
//  63. UpdateProfileTypeController
// =====================================================================

describe('UpdateProfileTypeController — getAllProfileOptions()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new UpdateProfileTypeController();
    UserProfileType.getProfileMeta.mockImplementation((pt) => ({
      label: pt, emoji: '🔘', description: `${pt} description`, appName: `BiteWise ${pt}`,
    }));
  });

  test('returns exactly 3 profile options', () => {
    const options = ctrl.getAllProfileOptions();
    expect(options).toHaveLength(3);
  });

  test('each option has profileType, label, emoji, description', () => {
    ctrl.getAllProfileOptions().forEach(opt => {
      expect(opt).toHaveProperty('profileType');
      expect(opt).toHaveProperty('label');
      expect(opt).toHaveProperty('emoji');
      expect(opt).toHaveProperty('description');
    });
  });

  test('includes ATHLETE, HEALTH_ORIENTED, MEAL_PLANNER', () => {
    const types = ctrl.getAllProfileOptions().map(o => o.profileType);
    expect(types).toContain('ATHLETE');
    expect(types).toContain('HEALTH_ORIENTED');
    expect(types).toContain('MEAL_PLANNER');
  });
});

describe('UpdateProfileTypeController — getProfileMeta()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new UpdateProfileTypeController();
    UserProfileType.getProfileMeta.mockReturnValue({ label: 'Athlete', emoji: '🏋️', description: 'Performance.', appName: 'BiteWise Athletes' });
  });

  test('delegates to UserProfileType.getProfileMeta() and returns metadata', () => {
    const meta = ctrl.getProfileMeta('ATHLETE');
    expect(UserProfileType.getProfileMeta).toHaveBeenCalledWith('ATHLETE');
    expect(meta.label).toBe('Athlete');
  });
});

describe('UpdateProfileTypeController — updateProfileType()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new UpdateProfileTypeController(); });

  test('delegates to User.setProfileType() and returns success', async () => {
    User.setProfileType.mockResolvedValue({ success: true, message: 'Profile updated.' });

    const result = await ctrl.updateProfileType(1, 'ATHLETE');

    expect(User.setProfileType).toHaveBeenCalledWith(1, 'ATHLETE');
    expect(result.success).toBe(true);
  });

  test('passes through invalid profile type error', async () => {
    User.setProfileType.mockResolvedValue({ success: false, message: 'Invalid profile type.' });

    const result = await ctrl.updateProfileType(1, 'INVALID');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid profile type.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.setProfileType.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.updateProfileType(1, 'ATHLETE');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to update profile/i);
  });
});


// =====================================================================
//  64. UserController
// =====================================================================

describe('UserController — getUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new UserController(); });

  test('delegates to User.getUser() and returns result', async () => {
    User.getUser.mockResolvedValue({ success: true, data: { userId: 1, username: 'alice', role: 'free' } });

    const result = await ctrl.getUser(1);

    expect(User.getUser).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data.username).toBe('alice');
  });

  test('passes through 404 user not found error', async () => {
    User.getUser.mockResolvedValue({ success: false, data: null, message: 'User not found.' });

    const result = await ctrl.getUser(999);

    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found.');
    expect(result.data).toBeNull();
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    User.getUser.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.getUser(1);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  65. ViewAccountDetailsController
// =====================================================================

describe('ViewAccountDetailsController — fetchAccountDetails()', () => {
  let ctrl;
  const user = { userId: 1, username: 'alice', email: 'alice@a.com' };
  beforeEach(() => { ctrl = new ViewAccountDetailsController(); });

  test('delegates to User.getAccountDetails() and returns account data', async () => {
    User.getAccountDetails.mockResolvedValue({ success: true, data: { userId: 1, username: 'alice', email: 'alice@a.com' } });

    const result = await ctrl.fetchAccountDetails(user);

    expect(User.getAccountDetails).toHaveBeenCalledWith(user);
    expect(result.success).toBe(true);
    expect(result.data.username).toBe('alice');
  });

  test('passes through failure from User.getAccountDetails()', async () => {
    User.getAccountDetails.mockResolvedValue({ success: false, data: null, message: 'User not found.' });

    const result = await ctrl.fetchAccountDetails(user);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.getAccountDetails.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchAccountDetails(user);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/unable to load account details/i);
  });
});


// =====================================================================
//  66. ViewBlogPostsController
// =====================================================================

describe('ViewBlogPostsController — fetchMyPosts()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewBlogPostsController(); });

  test('delegates to BlogPost.fetchByUser() and returns posts', async () => {
    BlogPost.fetchByUser.mockResolvedValue({ success: true, data: [{ blogPostId: 'bp_1', title: 'My Post', status: 'DRAFT' }], message: '' });

    const result = await ctrl.fetchMyPosts(3);

    expect(BlogPost.fetchByUser).toHaveBeenCalledWith(3);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('My Post');
  });

  test('returns empty array when curator has no posts', async () => {
    BlogPost.fetchByUser.mockResolvedValue({ success: true, data: [], message: '' });

    const result = await ctrl.fetchMyPosts(3);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
  });

  test('_safeCall catches unexpected throws and returns fallback with empty array', async () => {
    BlogPost.fetchByUser.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchMyPosts(3);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load blog posts/i);
  });
});


// =====================================================================
//  67. ViewCuratorApplicationsController
// =====================================================================

describe('ViewCuratorApplicationsController — fetchApplications()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewCuratorApplicationsController(); });

  test('delegates to CuratorApplication.fetchAll() and returns applications', async () => {
    CuratorApplication.fetchAll.mockResolvedValue({ success: true, data: [{ applicationId: 1, status: 'PENDING' }] });

    const result = await ctrl.fetchApplications();

    expect(CuratorApplication.fetchAll).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  test('returns empty array when no applications exist', async () => {
    CuratorApplication.fetchAll.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchApplications();

    expect(result.data).toEqual([]);
  });

  test('_safeCall catches unexpected throws and returns fallback with empty array', async () => {
    CuratorApplication.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchApplications();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load applications/i);
  });
});


// =====================================================================
//  68. ViewCuratorBlogsController
// =====================================================================

describe('ViewCuratorBlogsController — fetchPublishedPosts()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewCuratorBlogsController(); });

  test('delegates to BlogPost.fetchAllPublished() and returns published posts', async () => {
    BlogPost.fetchAllPublished.mockResolvedValue({ success: true, data: [{ blogPostId: 'bp_1', status: 'PUBLISHED' }], message: '' });

    const result = await ctrl.fetchPublishedPosts();

    expect(BlogPost.fetchAllPublished).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data[0].status).toBe('PUBLISHED');
  });

  test('returns empty array when no published posts exist', async () => {
    BlogPost.fetchAllPublished.mockResolvedValue({ success: true, data: [], message: '' });

    const result = await ctrl.fetchPublishedPosts();

    expect(result.data).toEqual([]);
  });

  test('_safeCall catches unexpected throws and returns fallback with empty array', async () => {
    BlogPost.fetchAllPublished.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchPublishedPosts();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load blog posts/i);
  });
});


// =====================================================================
//  69. ViewCuratorProfileController
// =====================================================================

describe('ViewCuratorProfileController — fetchProfile()', () => {
  let ctrl;

  const mockBlogPost = (isPublished, likeCount = 0, viewCount = 0) => ({
    isPublished: () => isPublished,
    isDraft: () => !isPublished,
    likeCount,
    viewCount,
  });

  beforeEach(() => {
    ctrl = new ViewCuratorProfileController();
    // Default happy-path mocks
    User.getUser.mockResolvedValue({ success: true, data: { userId: 1, username: 'alice' } });
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [] });
    Recipe.filterByUser.mockReturnValue([]);
    RecipeDraft.fetchByUser.mockResolvedValue({ success: true, data: [] });
    BlogPost.fetchByUser.mockResolvedValue({ success: true, data: [] });
  });

  test('returns success with correct data shape on normal flow', async () => {
    const result = await ctrl.fetchProfile(1);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('user');
    expect(result.data).toHaveProperty('expertise');
    expect(result.data).toHaveProperty('bio');
    expect(result.data).toHaveProperty('curatorStats');
    expect(result.data).toHaveProperty('recipes');
    expect(result.data).toHaveProperty('blogPosts');
  });

  test('calls User.getUser(), Recipe.fetchAll(), RecipeDraft.fetchByUser(), BlogPost.fetchByUser()', async () => {
    await ctrl.fetchProfile(1);

    expect(User.getUser).toHaveBeenCalledWith(1);
    expect(Recipe.fetchAll).toHaveBeenCalledTimes(1);
    expect(RecipeDraft.fetchByUser).toHaveBeenCalledWith(1);
    expect(BlogPost.fetchByUser).toHaveBeenCalledWith(1);
  });

  test('returns failure when User.getUser() fails', async () => {
    User.getUser.mockResolvedValue({ success: false, data: null, message: 'User not found.' });

    const result = await ctrl.fetchProfile(99);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toBe('User not found.');
  });

  test('counts published and draft recipes correctly', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [{ recipeId: 'r1', createdByUserId: 1 }, { recipeId: 'r2', createdByUserId: 1 }] });
    Recipe.filterByUser.mockReturnValue([{ recipeId: 'r1', likeCount: 5, viewCount: 10 }]);
    RecipeDraft.fetchByUser.mockResolvedValue({ success: true, data: [{ recipeId: 'd1', createdByUserId: 1 }, { recipeId: 'd2', createdByUserId: 1 }] });

    const result = await ctrl.fetchProfile(1);

    expect(result.data.recipes.published).toBe(1);
    expect(result.data.recipes.draft).toBe(2);
  });

  test('counts published and draft blog posts correctly', async () => {
    BlogPost.fetchByUser.mockResolvedValue({ success: true, data: [
      mockBlogPost(true, 3, 5),
      mockBlogPost(true, 2, 4),
      mockBlogPost(false, 0, 0),
    ]});

    const result = await ctrl.fetchProfile(1);

    expect(result.data.blogPosts.published).toBe(2);
    expect(result.data.blogPosts.draft).toBe(1);
  });

  test('aggregates curatorStats (likes + views) across recipes and blog posts', async () => {
    Recipe.filterByUser.mockReturnValue([{ likeCount: 10, viewCount: 20 }]);
    BlogPost.fetchByUser.mockResolvedValue({ success: true, data: [mockBlogPost(true, 5, 8)] });

    const result = await ctrl.fetchProfile(1);

    expect(result.data.curatorStats.likes).toBe(15);  // 10 + 5
    expect(result.data.curatorStats.views).toBe(28);  // 20 + 8
  });

  test('returns seeded expertise/bio for userId 4', async () => {
    User.getUser.mockResolvedValue({ success: true, data: { userId: 4, username: 'curator4' } });

    const result = await ctrl.fetchProfile(4);

    expect(result.data.expertise).toBe('I ran 2 marathons before');
    expect(result.data.bio).toContain('@lee.xuanxuan');
  });

  test('returns empty strings for expertise/bio when userId has no seeded data', async () => {
    const result = await ctrl.fetchProfile(1);

    expect(result.data.expertise).toBe('');
    expect(result.data.bio).toBe('');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.getUser.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchProfile(1);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/unable to load profile/i);
  });
});


// =====================================================================
//  70. ViewCuratorRecipesController
// =====================================================================

describe('ViewCuratorRecipesController — fetchCuratorRecipes()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewCuratorRecipesController(); });

  test('merges published and draft recipes for this curator', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [
      { recipeId: 'r1', createdByUserId: '5', likeCount: 0, viewCount: 0 },
      { recipeId: 'r2', createdByUserId: '99', likeCount: 0, viewCount: 0 }, // different curator
    ]});
    RecipeDraft.fetchByUser.mockResolvedValue({ success: true, data: [
      { recipeId: 'd1', createdByUserId: '5' },
    ]});

    const result = await ctrl.fetchCuratorRecipes(5);

    expect(result.success).toBe(true);
    // 1 published mine + 1 draft mine = 2 total
    expect(result.data).toHaveLength(2);
  });

  test('published recipes get isPublished: true and status: PUBLISHED', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [
      { recipeId: 'r1', createdByUserId: '5' },
    ]});
    RecipeDraft.fetchByUser.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchCuratorRecipes(5);

    const published = result.data.find(r => r.recipeId === 'r1');
    expect(published.isPublished).toBe(true);
    expect(published.status).toBe('PUBLISHED');
  });

  test('draft recipes get isPublished: false and status: DRAFT', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [] });
    RecipeDraft.fetchByUser.mockResolvedValue({ success: true, data: [
      { recipeId: 'd1', createdByUserId: '5' },
    ]});

    const result = await ctrl.fetchCuratorRecipes(5);

    const draft = result.data.find(r => r.recipeId === 'd1');
    expect(draft.isPublished).toBe(false);
    expect(draft.status).toBe('DRAFT');
  });

  test('returns empty array with "No recipes" message when curator has none', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [] });
    RecipeDraft.fetchByUser.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchCuratorRecipes(5);

    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(0);
    expect(result.message).toMatch(/no recipes/i);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchCuratorRecipes(5);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load recipes/i);
  });
});


// =====================================================================
//  71. ViewCurrentCalorieIntakeController
// =====================================================================

describe('ViewCurrentCalorieIntakeController — getCurrentIntake()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewCurrentCalorieIntakeController(); });

  test('delegates to FoodIntakeEntry.getTodaySummary() and returns macro totals', () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 1500, protein: 80, carbs: 180, fat: 50 });

    const entries = [{ calories: 500 }, { calories: 1000 }];
    const result = ctrl.getCurrentIntake(entries);

    expect(FoodIntakeEntry.getTodaySummary).toHaveBeenCalledWith(entries);
    expect(result.calories).toBe(1500);
    expect(result.protein).toBe(80);
    expect(result.carbs).toBe(180);
    expect(result.fat).toBe(50);
  });

  test('returns all zeros when entries array is empty', () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 0, protein: 0, carbs: 0, fat: 0 });

    const result = ctrl.getCurrentIntake([]);

    expect(result.calories).toBe(0);
  });
});

describe('ViewCurrentCalorieIntakeController — fetchTodayEntries()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewCurrentCalorieIntakeController(); });

  test('delegates to FoodIntakeEntry.getTodayEntries() and returns entries', async () => {
    FoodIntakeEntry.getTodayEntries.mockResolvedValue([{ foodName: 'Oats', calories: 300 }]);

    const result = await ctrl.fetchTodayEntries(1);

    expect(FoodIntakeEntry.getTodayEntries).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0].foodName).toBe('Oats');
  });

  test('returns empty array when getTodayEntries() throws', async () => {
    FoodIntakeEntry.getTodayEntries.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchTodayEntries(1);

    expect(result).toEqual([]);
  });
});

describe('ViewCurrentCalorieIntakeController — deleteEntry()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewCurrentCalorieIntakeController(); });

  test('delegates to FoodIntakeEntry.delete() and returns result', async () => {
    FoodIntakeEntry.delete.mockResolvedValue({ success: true, message: 'Food entry deleted.' });

    const result = await ctrl.deleteEntry('entry-1');

    expect(FoodIntakeEntry.delete).toHaveBeenCalledWith('entry-1');
    expect(result.success).toBe(true);
  });

  test('returns fallback error when delete() throws', async () => {
    FoodIntakeEntry.delete.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.deleteEntry('entry-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to delete food entry/i);
  });
});


// =====================================================================
//  72. ViewDiaryController
// =====================================================================

describe('ViewDiaryController — fetchEntries()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewDiaryController(); });

  test('delegates to DiaryEntry.fetchAll() and returns sorted entries', async () => {
    DiaryEntry.fetchAll.mockResolvedValue({ success: true, data: [{ entryId: '1', title: 'Day 1' }, { entryId: '2', title: 'Day 2' }] });

    const result = await ctrl.fetchEntries(1);

    expect(DiaryEntry.fetchAll).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  test('returns empty array when user has no diary entries', async () => {
    DiaryEntry.fetchAll.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchEntries(1);

    expect(result.data).toEqual([]);
  });

  test('_safeCall catches unexpected throws and returns fallback with empty array', async () => {
    DiaryEntry.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchEntries(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load diary entries/i);
  });
});


// =====================================================================
//  73. ViewDineOutController
// =====================================================================

describe('ViewDineOutController — fetchDineOutOptions()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new ViewDineOutController();
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 } });
    FoodIntakeEntry.getTodayEntries.mockResolvedValue([]);
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 500, protein: 30, carbs: 60, fat: 15 });
    DineOut.fetchMatchingRestaurants.mockResolvedValue({ success: true, data: [{ name: 'Sakura', matchingItems: [] }] });
  });

  test('returns correct data shape on normal flow', async () => {
    const result = await ctrl.fetchDineOutOptions(1);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('targets');
    expect(result.data).toHaveProperty('consumed');
    expect(result.data).toHaveProperty('remaining');
    expect(result.data).toHaveProperty('restaurants');
  });

  test('calls NutritionTargets, FoodIntakeEntry, and DineOut in sequence', async () => {
    await ctrl.fetchDineOutOptions(1);

    expect(NutritionTargets.fetchByUser).toHaveBeenCalledWith(1);
    expect(FoodIntakeEntry.getTodayEntries).toHaveBeenCalledWith(1);
    expect(DineOut.fetchMatchingRestaurants).toHaveBeenCalledTimes(1);
  });

  test('calculates remaining calories correctly (targets - consumed)', async () => {
    const result = await ctrl.fetchDineOutOptions(1);

    // 2000 target - 500 consumed = 1500
    expect(result.data.remaining.calories).toBe(1500);
  });

  test('passes remaining calories to DineOut.fetchMatchingRestaurants()', async () => {
    await ctrl.fetchDineOutOptions(1);

    expect(DineOut.fetchMatchingRestaurants).toHaveBeenCalledWith(1500);
  });

  test('uses default targets when NutritionTargets.fetchByUser() fails', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: false, data: null });
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 0, protein: 0, carbs: 0, fat: 0 });

    const result = await ctrl.fetchDineOutOptions(1);

    expect(result.data.targets.calories).toBe(2000);
    expect(result.data.remaining.calories).toBe(2000);
  });

  test('clamps remaining calories at 0 when consumed exceeds target', async () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 3000, protein: 200, carbs: 300, fat: 100 });

    const result = await ctrl.fetchDineOutOptions(1);

    expect(result.data.remaining.calories).toBe(0);
  });

  test('returns empty restaurants array when DineOut.fetchMatchingRestaurants() fails', async () => {
    DineOut.fetchMatchingRestaurants.mockResolvedValue({ success: false, data: null });

    const result = await ctrl.fetchDineOutOptions(1);

    expect(result.data.restaurants).toEqual([]);
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    NutritionTargets.fetchByUser.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchDineOutOptions(1);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to load dine out options/i);
  });
});

describe('ViewDineOutController — client-side helpers', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewDineOutController(); });

  test('getCuisines() delegates to DineOut.getCuisines()', () => {
    DineOut.getCuisines.mockReturnValue(['All', 'Japanese', 'Italian']);

    const result = ctrl.getCuisines();

    expect(DineOut.getCuisines).toHaveBeenCalledTimes(1);
    expect(result).toContain('Japanese');
  });

  test('filterByCuisine() delegates to DineOut.filterByCuisine()', () => {
    const restaurants = [{ name: 'Sakura', cuisine: 'Japanese' }];
    DineOut.filterByCuisine.mockReturnValue(restaurants);

    const result = ctrl.filterByCuisine(restaurants, 'Japanese');

    expect(DineOut.filterByCuisine).toHaveBeenCalledWith(restaurants, 'Japanese');
    expect(result).toHaveLength(1);
  });

  test('search() delegates to DineOut.search()', () => {
    const restaurants = [{ name: 'Sakura' }];
    DineOut.search.mockReturnValue(restaurants);

    const result = ctrl.search(restaurants, 'sakura');

    expect(DineOut.search).toHaveBeenCalledWith(restaurants, 'sakura');
    expect(result).toHaveLength(1);
  });
});


// =====================================================================
//  74. ViewFoodAlternativesController
// =====================================================================

describe('ViewFoodAlternativesController — fetchAlternatives()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewFoodAlternativesController(); });

  test('delegates to SmartEatingContent.fetchAlternatives() and returns flat list', async () => {
    SmartEatingContent.fetchAlternatives.mockResolvedValue({ success: true, data: [{ original: 'Chips', alternative: 'Rice Cakes' }] });

    const result = await ctrl.fetchAlternatives();

    expect(SmartEatingContent.fetchAlternatives).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data[0].original).toBe('Chips');
  });

  test('_safeCall catches throws and returns fallback', async () => {
    SmartEatingContent.fetchAlternatives.mockRejectedValue(new Error('error'));

    const result = await ctrl.fetchAlternatives();

    expect(result.success).toBe(false);
  });
});

describe('ViewFoodAlternativesController — fetchFoodAlternativesGrouped()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewFoodAlternativesController(); });

  test('delegates to SmartEatingContent.fetchFoodAlternativesGrouped() and returns grouped data', async () => {
    SmartEatingContent.fetchFoodAlternativesGrouped.mockResolvedValue({ success: true, data: { groups: [], tips: [] } });

    const result = await ctrl.fetchFoodAlternativesGrouped();

    expect(SmartEatingContent.fetchFoodAlternativesGrouped).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('groups');
    expect(result.data).toHaveProperty('tips');
  });

  test('_safeCall catches throws and returns fallback', async () => {
    SmartEatingContent.fetchFoodAlternativesGrouped.mockRejectedValue(new Error('error'));

    const result = await ctrl.fetchFoodAlternativesGrouped();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to load food alternatives/i);
  });
});

describe('ViewFoodAlternativesController — client-side helpers', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewFoodAlternativesController(); });

  test('filterByCategory() delegates to SmartEatingContent.filterByCategory()', () => {
    const alts = [{ category: 'Snack', original: 'Chips' }];
    SmartEatingContent.filterByCategory.mockReturnValue(alts);

    const result = ctrl.filterByCategory(alts, 'Snack');

    expect(SmartEatingContent.filterByCategory).toHaveBeenCalledWith(alts, 'Snack');
    expect(result).toHaveLength(1);
  });

  test('getCategories() delegates to SmartEatingContent.getCategories()', () => {
    SmartEatingContent.getCategories.mockReturnValue(['All', 'Snack', 'Breakfast']);

    const result = ctrl.getCategories([]);

    expect(result).toContain('Snack');
  });

  test('searchAlternatives() delegates to SmartEatingContent.searchAlternatives()', () => {
    const groups = [{ name: 'Snacks', items: [] }];
    SmartEatingContent.searchAlternatives.mockReturnValue(groups);

    const result = ctrl.searchAlternatives(groups, 'chips');

    expect(SmartEatingContent.searchAlternatives).toHaveBeenCalledWith(groups, 'chips');
    expect(result).toHaveLength(1);
  });
});


// =====================================================================
//  75. ViewFoodDatabaseController
// =====================================================================

describe('ViewFoodDatabaseController — fetchFoodDatabase()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewFoodDatabaseController(); });

  test('returns food items when database is non-empty', async () => {
    FoodItem.fetchAll.mockResolvedValue({ success: true, data: [{ name: 'Brown Rice', calories: 200 }] });
    FoodItem.hasItems.mockReturnValue(true);

    const result = await ctrl.fetchFoodDatabase();

    expect(FoodItem.fetchAll).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
  });

  test('returns Alt Flow 1a failure when database is empty', async () => {
    FoodItem.fetchAll.mockResolvedValue({ success: true, data: [] });
    FoodItem.hasItems.mockReturnValue(false);

    const result = await ctrl.fetchFoodDatabase();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/no food items are currently available/i);
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    FoodItem.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchFoodDatabase();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load food database/i);
  });
});

describe('ViewFoodDatabaseController — searchFoodItems()', () => {
  let ctrl;
  const localItems = [{ name: 'Chicken Breast' }, { name: 'Brown Rice' }];
  beforeEach(() => { ctrl = new ViewFoodDatabaseController(); });

  test('returns all local items unchanged when query is empty', async () => {
    const result = await ctrl.searchFoodItems(localItems, '');

    expect(result.data).toBe(localItems);
    expect(result.fromAPI).toBe(false);
    expect(FoodItem.searchWithFallback).not.toHaveBeenCalled();
  });

  test('delegates to FoodItem.searchWithFallback() when query is non-empty', async () => {
    FoodItem.searchWithFallback.mockResolvedValue({ data: [{ name: 'Chicken Breast' }], fromAPI: false, message: '' });

    const result = await ctrl.searchFoodItems(localItems, 'chicken');

    expect(FoodItem.searchWithFallback).toHaveBeenCalledWith(localItems, 'chicken');
    expect(result.data[0].name).toBe('Chicken Breast');
  });

  test('trims whitespace from query before delegating', async () => {
    FoodItem.searchWithFallback.mockResolvedValue({ data: [], fromAPI: false, message: '' });

    await ctrl.searchFoodItems(localItems, '  rice  ');

    expect(FoodItem.searchWithFallback).toHaveBeenCalledWith(localItems, 'rice');
  });
});

describe('ViewFoodDatabaseController — logFoodItem()', () => {
  let ctrl;
  const item = { name: 'Brown Rice', calories: 200, protein: 5, carbs: 40, fat: 2 };
  beforeEach(() => { ctrl = new ViewFoodDatabaseController(); });

  test('delegates to FoodItem.logFoodItem() with correct args', async () => {
    FoodItem.logFoodItem.mockResolvedValue({ success: true, message: 'Logged!', data: {} });

    const result = await ctrl.logFoodItem(item, 2, 1, 'Lunch');

    expect(FoodItem.logFoodItem).toHaveBeenCalledWith(item, 2, 1, 'Lunch');
    expect(result.success).toBe(true);
  });

  test('returns error when any required parameter is missing', async () => {
    const result = await ctrl.logFoodItem(null, 2, 1, 'Lunch');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid food item/i);
    expect(FoodItem.logFoodItem).not.toHaveBeenCalled();
  });

  test('returns error when meal is missing', async () => {
    const result = await ctrl.logFoodItem(item, 1, 1, '');

    expect(result.success).toBe(false);
    expect(FoodItem.logFoodItem).not.toHaveBeenCalled();
  });
});


// =====================================================================
//  76. ViewHealthGoalController
// =====================================================================

describe('ViewHealthGoalController — fetchGoal()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewHealthGoalController(); });

  test('delegates to HealthGoal.fetchActive() and returns goal data', async () => {
    HealthGoal.fetchActive.mockResolvedValue({ success: true, data: { goalType: 'Lose Weight', targetCalories: 1800 }, message: '' });

    const result = await ctrl.fetchGoal(1);

    expect(HealthGoal.fetchActive).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data.goalType).toBe('Lose Weight');
  });

  test('returns null data when no active goal is set', async () => {
    HealthGoal.fetchActive.mockResolvedValue({ success: true, data: null, message: 'No goal found' });

    const result = await ctrl.fetchGoal(1);

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
    expect(result.message).toBe('No goal found');
  });

  test('always returns success: true from controller wrapper (entity errors absorbed)', async () => {
    HealthGoal.fetchActive.mockResolvedValue({ success: false, data: null, message: 'Error' });

    const result = await ctrl.fetchGoal(1);

    // Controller wraps with success: true regardless
    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    HealthGoal.fetchActive.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchGoal(1);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/unable to load health goal/i);
  });
});


// =====================================================================
//  77. ViewHealthReportController
// =====================================================================

describe('ViewHealthReportController — fetchDailyReport()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewHealthReportController(); });

  test('delegates to HealthReport.fetchDaily() with userId and date', async () => {
    HealthReport.fetchDaily.mockResolvedValue({ success: true, data: { totalCalories: 1800 }, message: '' });

    const result = await ctrl.fetchDailyReport(1, '2024-06-15');

    expect(HealthReport.fetchDaily).toHaveBeenCalledWith(1, '2024-06-15');
    expect(result.success).toBe(true);
    expect(result.data.totalCalories).toBe(1800);
  });

  test('_safeCall catches throws and returns fallback', async () => {
    HealthReport.fetchDaily.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchDailyReport(1, '2024-06-15');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to load report/i);
  });
});

describe('ViewHealthReportController — fetchWeeklyReport()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewHealthReportController(); });

  test('delegates to HealthReport.fetchWeekly() with userId and weekStart', async () => {
    HealthReport.fetchWeekly.mockResolvedValue({ success: true, data: [{ date: '2024-06-10' }] });

    const result = await ctrl.fetchWeeklyReport(1, '2024-06-10');

    expect(HealthReport.fetchWeekly).toHaveBeenCalledWith(1, '2024-06-10');
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws and returns fallback', async () => {
    HealthReport.fetchWeekly.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchWeeklyReport(1, '2024-06-10');

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });
});

describe('ViewHealthReportController — fetchMonthlyReport()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewHealthReportController(); });

  test('delegates to HealthReport.fetchMonthly() with userId, year, and month', async () => {
    HealthReport.fetchMonthly.mockResolvedValue({ success: true, data: { totalCalories: 54000 } });

    const result = await ctrl.fetchMonthlyReport(1, 2024, 6);

    expect(HealthReport.fetchMonthly).toHaveBeenCalledWith(1, 2024, 6);
    expect(result.data.totalCalories).toBe(54000);
  });

  test('_safeCall catches throws and returns fallback', async () => {
    HealthReport.fetchMonthly.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchMonthlyReport(1, 2024, 6);

    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  78. ViewHeightHistoryController
// =====================================================================

describe('ViewHeightHistoryController — fetchHeightHistory()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewHeightHistoryController(); });

  test('returns sorted history and latest entry on success', async () => {
    const entries = [
      { heightCm: 175, loggedAt: '2024-01-01' },
      { heightCm: 176, loggedAt: '2024-06-01' },
    ];
    HeightEntry.fetchAll.mockResolvedValue({ success: true, data: entries });
    HeightEntry.getLatest.mockReturnValue({ heightCm: 176, loggedAt: '2024-06-01' });

    const result = await ctrl.fetchHeightHistory(1);

    expect(HeightEntry.fetchAll).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data[0].heightCm).toBe(176); // sorted newest-first
    expect(result.latest.heightCm).toBe(176);
  });

  test('passes data to HeightEntry.getLatest() to compute latest', async () => {
    const entries = [{ heightCm: 170, loggedAt: '2024-01-01' }];
    HeightEntry.fetchAll.mockResolvedValue({ success: true, data: entries });
    HeightEntry.getLatest.mockReturnValue({ heightCm: 170 });

    await ctrl.fetchHeightHistory(1);

    expect(HeightEntry.getLatest).toHaveBeenCalledWith(entries);
  });

  test('returns latest: null when HeightEntry.fetchAll() returns failure', async () => {
    HeightEntry.fetchAll.mockResolvedValue({ success: false, data: [], message: 'Error' });

    const result = await ctrl.fetchHeightHistory(1);

    expect(result.success).toBe(false);
    expect(result.latest).toBeNull();
  });

  test('_safeCall catches unexpected throws and returns fallback', async () => {
    HeightEntry.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchHeightHistory(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.latest).toBeNull();
    expect(result.message).toMatch(/unable to load height history/i);
  });
});


// =====================================================================
//  79. ViewMealPlansController
// =====================================================================

describe('ViewMealPlansController — fetchMealPlans()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewMealPlansController(); });

  test('delegates to MealPlan.fetchAll() and returns plans', async () => {
    MealPlan.fetchAll.mockResolvedValue({ success: true, data: [{ planId: '1', name: 'Week 1' }, { planId: '2', name: 'Week 2' }] });

    const result = await ctrl.fetchMealPlans(1);

    expect(MealPlan.fetchAll).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  test('returns empty array when user has no plans', async () => {
    MealPlan.fetchAll.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchMealPlans(1);

    expect(result.data).toEqual([]);
  });

  test('_safeCall catches unexpected throws and returns fallback with empty array', async () => {
    MealPlan.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchMealPlans(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load meal plans/i);
  });
});


// =====================================================================
//  80. ViewMindfulSnackingController
// =====================================================================

describe('ViewMindfulSnackingController — fetchSnackingTips()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewMindfulSnackingController(); });

  test('delegates to SmartEatingContent.fetchSnackingTips() and returns tips', async () => {
    SmartEatingContent.fetchSnackingTips.mockResolvedValue({ success: true, data: [{ title: 'Eat slowly' }] });

    const result = await ctrl.fetchSnackingTips();

    expect(SmartEatingContent.fetchSnackingTips).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data[0].title).toBe('Eat slowly');
  });

  test('_safeCall catches throws and returns fallback', async () => {
    SmartEatingContent.fetchSnackingTips.mockRejectedValue(new Error('error'));

    const result = await ctrl.fetchSnackingTips();

    expect(result.success).toBe(false);
  });
});

describe('ViewMindfulSnackingController — fetchSnackingContent()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewMindfulSnackingController(); });

  test('delegates to SmartEatingContent.fetchSnackingContent() and returns structured content', async () => {
    SmartEatingContent.fetchSnackingContent.mockResolvedValue({
      success: true,
      data: { corePrinciples: [], snackIdeas: [], portionControl: [] },
    });

    const result = await ctrl.fetchSnackingContent();

    expect(SmartEatingContent.fetchSnackingContent).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('corePrinciples');
    expect(result.data).toHaveProperty('snackIdeas');
  });

  test('_safeCall catches throws and returns fallback', async () => {
    SmartEatingContent.fetchSnackingContent.mockRejectedValue(new Error('error'));

    const result = await ctrl.fetchSnackingContent();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to load snacking content/i);
  });
});

describe('ViewMindfulSnackingController — filterSnackIdeas()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewMindfulSnackingController(); });

  test('delegates to SmartEatingContent.filterSnackIdeas() with correct args', () => {
    const ideas = [{ title: 'Nuts', timing: 'Afternoon' }];
    SmartEatingContent.filterSnackIdeas.mockReturnValue(ideas);

    const result = ctrl.filterSnackIdeas(ideas, 'Afternoon');

    expect(SmartEatingContent.filterSnackIdeas).toHaveBeenCalledWith(ideas, 'Afternoon');
    expect(result).toHaveLength(1);
  });

  test('passes "All" filter through to entity', () => {
    SmartEatingContent.filterSnackIdeas.mockReturnValue([]);

    ctrl.filterSnackIdeas([], 'All');

    expect(SmartEatingContent.filterSnackIdeas).toHaveBeenCalledWith([], 'All');
  });
});
