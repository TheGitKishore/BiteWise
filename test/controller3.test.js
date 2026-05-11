/**
 * BiteWise — Controller Unit Tests (Batch 3: controllers 41–60)
 * =====================================================================
 * Controllers covered:
 *   EditNutritionTargetsController
 *   GenerateGroceryListController
 *   GenerateMealPlanController
 *   LogExerciseController
 *   LogHeightController
 *   LoginController
 *   LogOutController
 *   LogWeightController
 *   ManageGroceryListController
 *   OnboardingController
 *   PublishBlogPostController
 *   PublishCuratorRecipeController
 *   SaveRecipeController
 *   SetDailyCalorieLimitController
 *   SetHealthGoalController
 *   TerminateAccountController
 *   UnpublishBlogPostController
 *   UnpublishCuratorRecipeController
 *   UpdateAccountDetailsController
 *   UpdateCuratorProfileController
 * =====================================================================
 */

jest.mock('../entity/NutritionTargets');
jest.mock('../entity/GroceryList');
jest.mock('../entity/MealPlan');
jest.mock('../entity/ExerciseEntry');
jest.mock('../entity/HeightEntry');
jest.mock('../entity/User');
jest.mock('../entity/WeightEntry');
jest.mock('../entity/UserProfileType');
jest.mock('../entity/BlogPost');
jest.mock('../entity/RecipeDraft');
jest.mock('../entity/Recipe');
jest.mock('../entity/HealthGoal');
jest.mock('../entity/CuratorProfileEdit');

import NutritionTargets   from '../entity/NutritionTargets';
import GroceryList        from '../entity/GroceryList';
import MealPlan           from '../entity/MealPlan';
import ExerciseEntry      from '../entity/ExerciseEntry';
import HeightEntry        from '../entity/HeightEntry';
import User               from '../entity/User';
import WeightEntry        from '../entity/WeightEntry';
import UserProfileType    from '../entity/UserProfileType';
import BlogPost           from '../entity/BlogPost';
import RecipeDraft        from '../entity/RecipeDraft';
import Recipe             from '../entity/Recipe';
import HealthGoal         from '../entity/HealthGoal';
import CuratorProfileEdit from '../entity/CuratorProfileEdit';

import EditNutritionTargetsController  from '../controller/EditNutritionTargetsController';
import GenerateGroceryListController   from '../controller/GenerateGroceryListController';
import GenerateMealPlanController      from '../controller/GenerateMealPlanController';
import LogExerciseController           from '../controller/LogExerciseController';
import LogHeightController             from '../controller/LogHeightController';
import LoginController                 from '../controller/LoginController';
import LogOutController                from '../controller/LogOutController';
import LogWeightController             from '../controller/LogWeightController';
import ManageGroceryListController     from '../controller/ManageGroceryListController';
import OnboardingController            from '../controller/OnboardingController';
import PublishBlogPostController       from '../controller/PublishBlogPostController';
import PublishCuratorRecipeController  from '../controller/PublishCuratorRecipeController';
import SaveRecipeController            from '../controller/SaveRecipeController';
import SetDailyCalorieLimitController  from '../controller/SetDailyCalorieLimitController';
import SetHealthGoalController         from '../controller/SetHealthGoalController';
import TerminateAccountController      from '../controller/TerminateAccountController';
import UnpublishBlogPostController     from '../controller/UnpublishBlogPostController';
import UnpublishCuratorRecipeController from '../controller/UnpublishCuratorRecipeController';
import UpdateAccountDetailsController  from '../controller/UpdateAccountDetailsController';
import UpdateCuratorProfileController  from '../controller/UpdateCuratorProfileController';

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
//  41. EditNutritionTargetsController
// =====================================================================

describe('EditNutritionTargetsController — saveTargets()', () => {
  let ctrl;
  const validTargets = { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30, activityLevel: 'Balanced', goal: 'Maintain Weight' };
  beforeEach(() => { ctrl = new EditNutritionTargetsController(); });

  test('delegates all macro fields to NutritionTargets.updateTargets()', async () => {
    NutritionTargets.updateTargets.mockResolvedValue({ success: true, data: { calories: 2000 }, message: 'Saved!' });

    const result = await ctrl.saveTargets(1, validTargets);

    expect(NutritionTargets.updateTargets).toHaveBeenCalledWith(1, validTargets);
    expect(result.success).toBe(true);
    expect(result.data.calories).toBe(2000);
  });

  test('passes through validation error (calories out of range)', async () => {
    NutritionTargets.updateTargets.mockResolvedValue({ success: false, field: 'calories', message: 'Calories must be between 500 and 10000.', data: null });

    const result = await ctrl.saveTargets(1, { ...validTargets, calories: 400 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('calories');
  });

  test('passes through validation error (negative protein)', async () => {
    NutritionTargets.updateTargets.mockResolvedValue({ success: false, field: 'protein', message: 'Protein cannot be negative.', data: null });

    const result = await ctrl.saveTargets(1, { ...validTargets, protein: -1 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('protein');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    NutritionTargets.updateTargets.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.saveTargets(1, validTargets);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('EditNutritionTargetsController — saveCaloriesOnly()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new EditNutritionTargetsController(); });

  test('delegates calories to NutritionTargets.updateCalories()', async () => {
    NutritionTargets.updateCalories.mockResolvedValue({ success: true, data: { calories: 1800 }, message: 'Calorie goal updated.' });

    const result = await ctrl.saveCaloriesOnly(1, 1800);

    expect(NutritionTargets.updateCalories).toHaveBeenCalledWith(1, 1800);
    expect(result.success).toBe(true);
    expect(result.data.calories).toBe(1800);
  });

  test('passes through validation error (calories below 500)', async () => {
    NutritionTargets.updateCalories.mockResolvedValue({ success: false, field: 'calories', message: 'Calories must be at least 500.', data: null });

    const result = await ctrl.saveCaloriesOnly(1, 300);

    expect(result.success).toBe(false);
    expect(result.field).toBe('calories');
  });

  test('_safeCall catches unexpected throws', async () => {
    NutritionTargets.updateCalories.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.saveCaloriesOnly(1, 1800);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  42. GenerateGroceryListController
// =====================================================================

describe('GenerateGroceryListController — generateFromRecipe()', () => {
  let ctrl;
  const recipe = { recipeId: 'r-1', title: 'Salad', ingredients: ['Lettuce'] };
  beforeEach(() => { ctrl = new GenerateGroceryListController(); });

  test('delegates to GroceryList.generateFromRecipe() and returns new list', async () => {
    GroceryList.generateFromRecipe.mockResolvedValue({ success: true, data: { items: [{ name: 'Lettuce' }] }, message: 'List generated!' });

    const result = await ctrl.generateFromRecipe(1, recipe);

    expect(GroceryList.generateFromRecipe).toHaveBeenCalledWith(1, recipe);
    expect(result.success).toBe(true);
    expect(result.data.items[0].name).toBe('Lettuce');
  });

  test('passes through failure from GroceryList.generateFromRecipe()', async () => {
    GroceryList.generateFromRecipe.mockResolvedValue({ success: false, message: 'No ingredients found.', data: null });

    const result = await ctrl.generateFromRecipe(1, recipe);

    expect(result.success).toBe(false);
    expect(result.message).toBe('No ingredients found.');
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    GroceryList.generateFromRecipe.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.generateFromRecipe(1, recipe);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to generate grocery list/i);
    expect(result.data).toBeNull();
  });
});

describe('GenerateGroceryListController — fetchCurrentList()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new GenerateGroceryListController(); });

  test('delegates to GroceryList.fetchCurrent() and returns list', async () => {
    GroceryList.fetchCurrent.mockResolvedValue({ success: true, data: { items: [] } });

    const result = await ctrl.fetchCurrentList(1);

    expect(GroceryList.fetchCurrent).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws', async () => {
    GroceryList.fetchCurrent.mockRejectedValue(new Error('error'));

    const result = await ctrl.fetchCurrentList(1);

    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  43. GenerateMealPlanController
// =====================================================================

describe('GenerateMealPlanController — generateMealPlan()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new GenerateMealPlanController(); });

  test('delegates to MealPlan.generate() and returns generated plan', async () => {
    MealPlan.generate.mockResolvedValue({ success: true, data: { planType: 'Keto', isAutoGenerated: true, days: [] }, message: 'Generated!' });

    const result = await ctrl.generateMealPlan(1, { planType: 'Keto' });

    expect(MealPlan.generate).toHaveBeenCalledWith(1, { planType: 'Keto' });
    expect(result.success).toBe(true);
    expect(result.data.isAutoGenerated).toBe(true);
  });

  test('returns error when planType is empty (no API call)', async () => {
    const result = await ctrl.generateMealPlan(1, { planType: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('planType');
    expect(result.message).toMatch(/please select a plan type/i);
    expect(MealPlan.generate).not.toHaveBeenCalled();
  });

  test('returns error when planType is whitespace-only (no API call)', async () => {
    const result = await ctrl.generateMealPlan(1, { planType: '   ' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('planType');
    expect(MealPlan.generate).not.toHaveBeenCalled();
  });

  test('passes through failure from MealPlan.generate()', async () => {
    MealPlan.generate.mockResolvedValue({ success: false, message: 'Generation failed.', data: null });

    const result = await ctrl.generateMealPlan(1, { planType: 'Keto' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Generation failed.');
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    MealPlan.generate.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.generateMealPlan(1, { planType: 'Keto' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to generate meal plan/i);
  });
});


// =====================================================================
//  44. LogExerciseController
// =====================================================================

describe('LogExerciseController — logExercise()', () => {
  let ctrl;
  const validFields = { exerciseType: 'Running', durationMins: 30, notes: '' };
  beforeEach(() => { ctrl = new LogExerciseController(); });

  test('delegates to ExerciseEntry.create() and returns new entry', async () => {
    ExerciseEntry.create.mockResolvedValue({ success: true, data: { exerciseType: 'Running', caloriesBurned: 300 }, message: 'Running logged!' });

    const result = await ctrl.logExercise(1, validFields);

    expect(ExerciseEntry.create).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.caloriesBurned).toBe(300);
  });

  test('passes through validation error (empty exerciseType)', async () => {
    ExerciseEntry.create.mockResolvedValue({ success: false, field: 'exerciseType', message: 'Please select an exercise type.' });

    const result = await ctrl.logExercise(1, { ...validFields, exerciseType: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('exerciseType');
  });

  test('passes through validation error (duration 0)', async () => {
    ExerciseEntry.create.mockResolvedValue({ success: false, field: 'durationMins', message: 'Please enter a valid duration.' });

    const result = await ctrl.logExercise(1, { ...validFields, durationMins: 0 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('durationMins');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    ExerciseEntry.create.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.logExercise(1, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('LogExerciseController — fetchTodayEntries()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new LogExerciseController(); });

  test('delegates to ExerciseEntry.getTodayEntries() and returns entries', async () => {
    ExerciseEntry.getTodayEntries.mockResolvedValue([{ exerciseType: 'Running', caloriesBurned: 300 }]);

    const result = await ctrl.fetchTodayEntries(1);

    expect(ExerciseEntry.getTodayEntries).toHaveBeenCalledWith(1);
    expect(result).toHaveLength(1);
    expect(result[0].exerciseType).toBe('Running');
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    ExerciseEntry.getTodayEntries.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchTodayEntries(1);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  45. LogHeightController
// =====================================================================

describe('LogHeightController — logHeight()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new LogHeightController(); });

  test('delegates to HeightEntry.create() and returns new entry', async () => {
    HeightEntry.create.mockResolvedValue({ success: true, data: { heightCm: 175, loggedAt: '2024-01-01' }, message: 'Height logged.' });

    const result = await ctrl.logHeight(1, { heightCm: 175 });

    expect(HeightEntry.create).toHaveBeenCalledWith(1, { heightCm: 175 });
    expect(result.success).toBe(true);
    expect(result.data.heightCm).toBe(175);
  });

  test('passes through validation error (height too low)', async () => {
    HeightEntry.create.mockResolvedValue({ success: false, field: 'heightCm', message: 'Height must be at least 50 cm.', data: null });

    const result = await ctrl.logHeight(1, { heightCm: 20 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('heightCm');
  });

  test('passes through validation error (non-numeric height)', async () => {
    HeightEntry.create.mockResolvedValue({ success: false, field: 'heightCm', message: 'Please enter a valid height.', data: null });

    const result = await ctrl.logHeight(1, { heightCm: 'tall' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('heightCm');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    HeightEntry.create.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.logHeight(1, { heightCm: 175 });

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  46. LoginController
// =====================================================================

describe('LoginController — login()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new LoginController(); });

  test('delegates to User.login() and returns user session on success', async () => {
    User.login.mockResolvedValue({ success: true, user: { userId: 1, username: 'alice', role: 'free' } });

    const result = await ctrl.login({ username: 'alice', password: 'secure123' });

    expect(User.login).toHaveBeenCalledWith({ username: 'alice', password: 'secure123' });
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('alice');
  });

  test('passes through incorrect credentials error', async () => {
    User.login.mockResolvedValue({ success: false, message: 'Incorrect credentials', user: null });

    const result = await ctrl.login({ username: 'alice', password: 'wrong' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/incorrect credentials/i);
    expect(result.user).toBeNull();
  });

  test('passes through deactivated account error (403)', async () => {
    User.login.mockResolvedValue({ success: false, message: 'Account deactivated', user: null });

    const result = await ctrl.login({ username: 'alice', password: 'secure123' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/deactivated/i);
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    User.login.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.login({ username: 'alice', password: 'secure123' });

    expect(result.success).toBe(false);
    expect(result.user).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  47. LogOutController
// =====================================================================

describe('LogOutController — logout()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new LogOutController(); });

  test('delegates to User.logout() and returns success', async () => {
    User.logout.mockResolvedValue({ success: true, message: 'Logged out successfully' });

    const result = await ctrl.logout();

    expect(User.logout).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Logged out successfully');
  });

  test('passes through failure from User.logout()', async () => {
    User.logout.mockResolvedValue({ success: false, message: 'Session expired.' });

    const result = await ctrl.logout();

    expect(result.success).toBe(false);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.logout.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.logout();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  48. LogWeightController
// =====================================================================

describe('LogWeightController — logWeight()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new LogWeightController(); });

  test('delegates to WeightEntry.create() and returns new entry', async () => {
    WeightEntry.create.mockResolvedValue({ success: true, data: { weightKg: 70, entryId: 1 }, message: 'Weight logged.' });

    const result = await ctrl.logWeight(1, { weightKg: 70 });

    expect(WeightEntry.create).toHaveBeenCalledWith(1, { weightKg: 70 });
    expect(result.success).toBe(true);
    expect(result.data.weightKg).toBe(70);
  });

  test('passes through validation error (weight below minimum)', async () => {
    WeightEntry.create.mockResolvedValue({ success: false, field: 'weightKg', message: 'Please enter a valid weight.', data: null });

    const result = await ctrl.logWeight(1, { weightKg: -5 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('weightKg');
  });

  test('passes through validation error (non-numeric weight)', async () => {
    WeightEntry.create.mockResolvedValue({ success: false, field: 'weightKg', message: 'Please enter a valid weight.', data: null });

    const result = await ctrl.logWeight(1, { weightKg: 'heavy' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('weightKg');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    WeightEntry.create.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.logWeight(1, { weightKg: 70 });

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  49. ManageGroceryListController
// =====================================================================

describe('ManageGroceryListController — addItem()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ManageGroceryListController(); });

  test('delegates to GroceryList.addItem() and returns updated list', async () => {
    GroceryList.addItem.mockResolvedValue({ success: true, data: { items: [{ name: 'Milk' }] }, message: 'Item added.' });

    const result = await ctrl.addItem(1, { name: 'Milk', quantity: 2, unit: 'liters' });

    expect(GroceryList.addItem).toHaveBeenCalledWith(1, { name: 'Milk', quantity: 2, unit: 'liters' });
    expect(result.success).toBe(true);
    expect(result.data.items[0].name).toBe('Milk');
  });

  test('passes through validation error (empty name)', async () => {
    GroceryList.addItem.mockResolvedValue({ success: false, field: 'name', message: 'Item name is required.', data: null });

    const result = await ctrl.addItem(1, { name: '', quantity: 1, unit: 'pcs' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    GroceryList.addItem.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.addItem(1, { name: 'Eggs', quantity: 6, unit: 'pcs' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('ManageGroceryListController — deleteItem()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ManageGroceryListController(); });

  test('delegates to GroceryList.deleteItem() and returns updated list', async () => {
    GroceryList.deleteItem.mockResolvedValue({ success: true, data: { items: [] }, message: 'Item removed.' });

    const result = await ctrl.deleteItem(1, 'item-1');

    expect(GroceryList.deleteItem).toHaveBeenCalledWith(1, 'item-1');
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws', async () => {
    GroceryList.deleteItem.mockRejectedValue(new Error('error'));

    const result = await ctrl.deleteItem(1, 'item-1');

    expect(result.success).toBe(false);
  });
});

describe('ManageGroceryListController — toggleItem()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ManageGroceryListController(); });

  test('delegates to GroceryList.toggleItem() and returns updated list', async () => {
    GroceryList.toggleItem.mockResolvedValue({ success: true, data: { items: [{ itemId: 'i1', checked: true }] } });

    const result = await ctrl.toggleItem(1, 'i1');

    expect(GroceryList.toggleItem).toHaveBeenCalledWith(1, 'i1');
    expect(result.success).toBe(true);
  });

  test('_safeCall catches throws', async () => {
    GroceryList.toggleItem.mockRejectedValue(new Error('error'));

    const result = await ctrl.toggleItem(1, 'i1');

    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  50. OnboardingController
// =====================================================================

describe('OnboardingController — computeProfile()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new OnboardingController();
    // computeProfile calls static methods directly — we mock them
    UserProfileType.computeProfileFromAnswers.mockReturnValue('ATHLETE');
    UserProfileType.getProfileMeta.mockReturnValue({ label: 'Athlete', emoji: '🏋️', description: 'Performance focused.', appName: 'BiteWise for Athletes' });
  });

  test('calls computeProfileFromAnswers() and getProfileMeta() with result', () => {
    const answers = [{ questionIndex: 2, answerIndex: 2 }];

    const result = ctrl.computeProfile(answers);

    expect(UserProfileType.computeProfileFromAnswers).toHaveBeenCalledWith(answers);
    expect(UserProfileType.getProfileMeta).toHaveBeenCalledWith('ATHLETE');
    expect(result.profileType).toBe('ATHLETE');
    expect(result.meta.label).toBe('Athlete');
  });

  test('returns both profileType and meta in result object', () => {
    const result = ctrl.computeProfile([]);

    expect(result).toHaveProperty('profileType');
    expect(result).toHaveProperty('meta');
  });
});

describe('OnboardingController — getAllProfileOptions()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new OnboardingController();
    UserProfileType.getProfileMeta.mockImplementation((pt) => ({
      label: pt, emoji: '🔘', description: `${pt} desc`, appName: `BiteWise ${pt}`,
    }));
  });

  test('returns exactly 3 profile options', () => {
    const options = ctrl.getAllProfileOptions();

    expect(options).toHaveLength(3);
  });

  test('each option has profileType, label, emoji, description', () => {
    const options = ctrl.getAllProfileOptions();

    options.forEach(opt => {
      expect(opt).toHaveProperty('profileType');
      expect(opt).toHaveProperty('label');
      expect(opt).toHaveProperty('emoji');
      expect(opt).toHaveProperty('description');
    });
  });

  test('includes ATHLETE, HEALTH_ORIENTED, MEAL_PLANNER types', () => {
    const options = ctrl.getAllProfileOptions();
    const types = options.map(o => o.profileType);

    expect(types).toContain('ATHLETE');
    expect(types).toContain('HEALTH_ORIENTED');
    expect(types).toContain('MEAL_PLANNER');
  });

  test('calls getProfileMeta() once per profile type', () => {
    ctrl.getAllProfileOptions();

    expect(UserProfileType.getProfileMeta).toHaveBeenCalledTimes(3);
  });
});

describe('OnboardingController — saveProfile()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new OnboardingController(); });

  test('delegates to User.setProfileType() and returns success', async () => {
    User.setProfileType.mockResolvedValue({ success: true, message: 'Profile set.' });

    const result = await ctrl.saveProfile(1, 'ATHLETE');

    expect(User.setProfileType).toHaveBeenCalledWith(1, 'ATHLETE');
    expect(result.success).toBe(true);
  });

  test('passes through failure from User.setProfileType()', async () => {
    User.setProfileType.mockResolvedValue({ success: false, message: 'Invalid profile type.' });

    const result = await ctrl.saveProfile(1, 'INVALID');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid profile type.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.setProfileType.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.saveProfile(1, 'ATHLETE');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  51. PublishBlogPostController
// =====================================================================

describe('PublishBlogPostController — publishPost()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new PublishBlogPostController(); });

  test('delegates to BlogPost.publish() and returns PUBLISHED post', async () => {
    BlogPost.publish.mockResolvedValue({ success: true, data: { status: 'PUBLISHED' }, message: 'Blog post published!' });

    const result = await ctrl.publishPost('bp_1', 2);

    expect(BlogPost.publish).toHaveBeenCalledWith('bp_1', 2);
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('PUBLISHED');
  });

  test('passes through 403 curator mismatch error', async () => {
    BlogPost.publish.mockResolvedValue({ success: false, message: 'Not authorised to publish.', data: null });

    const result = await ctrl.publishPost('bp_1', 99);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not authorised/i);
  });

  test('passes through 404 post not found error', async () => {
    BlogPost.publish.mockResolvedValue({ success: false, message: 'Post not found.', data: null });

    const result = await ctrl.publishPost('nonexistent', 2);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Post not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    BlogPost.publish.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.publishPost('bp_1', 2);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to publish/i);
  });
});


// =====================================================================
//  52. PublishCuratorRecipeController
// =====================================================================

describe('PublishCuratorRecipeController — publishRecipe()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new PublishCuratorRecipeController(); });

  test('delegates to RecipeDraft.publish() and returns result', async () => {
    RecipeDraft.publish.mockResolvedValue({ success: true, data: { isPublished: true }, message: 'Draft published successfully' });

    const result = await ctrl.publishRecipe('draft-1', 5);

    expect(RecipeDraft.publish).toHaveBeenCalledWith('draft-1', 5);
    expect(result.success).toBe(true);
    expect(result.data.isPublished).toBe(true);
  });

  test('passes through 404 draft not found error', async () => {
    RecipeDraft.publish.mockResolvedValue({ success: false, message: 'Draft not found.', data: null });

    const result = await ctrl.publishRecipe('bad-id', 5);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Draft not found.');
  });

  test('passes through 403 userId mismatch error', async () => {
    RecipeDraft.publish.mockResolvedValue({ success: false, message: 'Not authorized.', data: null });

    const result = await ctrl.publishRecipe('draft-1', 99);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not authorized/i);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    RecipeDraft.publish.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.publishRecipe('draft-1', 5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to publish recipe/i);
  });
});


// =====================================================================
//  53. SaveRecipeController
// =====================================================================

describe('SaveRecipeController — saveRecipe()', () => {
  let ctrl;
  const recipe = { recipeId: 'r-1', title: 'Salad', calories: 300 };
  beforeEach(() => { ctrl = new SaveRecipeController(); });

  test('returns premium gate error when role is "FREE" (case-sensitive)', async () => {
    const result = await ctrl.saveRecipe('FREE', 1, recipe);

    expect(result.success).toBe(false);
    expect(result.isPremiumGate).toBe(true);
    expect(result.message).toMatch(/premium feature/i);
    expect(Recipe.saveRecipe).not.toHaveBeenCalled();
  });

  test('returns premium gate error when role is "free"', async () => {
    const result = await ctrl.saveRecipe('free', 1, recipe);

    expect(result.success).toBe(false);
    expect(result.isPremiumGate).toBe(true);
    expect(Recipe.saveRecipe).not.toHaveBeenCalled();
  });

  test('delegates to Recipe.saveRecipe() when role is "premium"', async () => {
    Recipe.saveRecipe.mockResolvedValue({ success: true, message: 'Recipe saved successfully!', data: {} });

    const result = await ctrl.saveRecipe('premium', 1, recipe);

    expect(Recipe.saveRecipe).toHaveBeenCalledWith(1, { ...recipe, recipeId: 'r-1' });
    expect(result.success).toBe(true);
    expect(result.isPremiumGate).toBe(false);
  });

  test('uses recipe._id when recipeId is missing', async () => {
    const recipeWithId = { _id: 'mongo-id-1', title: 'Salad' };
    Recipe.saveRecipe.mockResolvedValue({ success: true, data: {} });

    await ctrl.saveRecipe('premium', 1, recipeWithId);

    const callArg = Recipe.saveRecipe.mock.calls[0][1];
    expect(callArg.recipeId).toBe('mongo-id-1');
  });

  test('returns error when both recipeId and _id are missing', async () => {
    const badRecipe = { title: 'No ID Recipe' };

    const result = await ctrl.saveRecipe('premium', 1, badRecipe);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/missing recipeId/i);
    expect(Recipe.saveRecipe).not.toHaveBeenCalled();
  });

  test('passes through failure from Recipe.saveRecipe()', async () => {
    Recipe.saveRecipe.mockResolvedValue({ success: false, message: 'Already saved.', data: null });

    const result = await ctrl.saveRecipe('premium', 1, recipe);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Already saved.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.saveRecipe.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.saveRecipe('premium', 1, recipe);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to save recipe/i);
  });
});


// =====================================================================
//  54. SetDailyCalorieLimitController
// =====================================================================

describe('SetDailyCalorieLimitController — setDailyCalorieLimit()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new SetDailyCalorieLimitController(); });

  test('delegates to NutritionTargets.updateCalories() with numeric userId', async () => {
    NutritionTargets.updateCalories.mockResolvedValue({ success: true, data: { calories: 1800 }, message: 'Calorie goal updated.' });

    const result = await ctrl.setDailyCalorieLimit(1, 1800);

    expect(NutritionTargets.updateCalories).toHaveBeenCalledWith(1, 1800);
    expect(result.success).toBe(true);
  });

  test('extracts userId from user object and delegates correctly', async () => {
    NutritionTargets.updateCalories.mockResolvedValue({ success: true, data: { calories: 2000 } });

    await ctrl.setDailyCalorieLimit({ userId: 5, username: 'alice' }, 2000);

    expect(NutritionTargets.updateCalories).toHaveBeenCalledWith(5, 2000);
  });

  test('passes through validation error (calories below 500)', async () => {
    NutritionTargets.updateCalories.mockResolvedValue({ success: false, field: 'calories', message: 'Must be at least 500.', data: null });

    const result = await ctrl.setDailyCalorieLimit(1, 300);

    expect(result.success).toBe(false);
    expect(result.field).toBe('calories');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    NutritionTargets.updateCalories.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.setDailyCalorieLimit(1, 1800);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  55. SetHealthGoalController
// =====================================================================

describe('SetHealthGoalController — setGoal()', () => {
  let ctrl;
  const validFields = { goalType: 'Lose Weight', customGoal: '', targetWeight: 65, targetCalories: 1800, activityLevel: 'Moderate', targetDate: '2024-12-31' };
  beforeEach(() => { ctrl = new SetHealthGoalController(); });

  test('delegates to HealthGoal.create() and returns normalised result', async () => {
    HealthGoal.create.mockResolvedValue({ success: true, field: null, data: { goalType: 'Lose Weight' }, message: 'Goal created' });

    const result = await ctrl.setGoal(1, validFields);

    expect(HealthGoal.create).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.goalType).toBe('Lose Weight');
    expect(result.field).toBeNull();
    expect(result.message).toBe('Goal created');
  });

  test('passes through validation error (empty goalType)', async () => {
    HealthGoal.create.mockResolvedValue({ success: false, field: 'goalType', message: 'Please select a goal type.', data: null });

    const result = await ctrl.setGoal(1, { ...validFields, goalType: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('goalType');
  });

  test('passes through validation error (CUSTOM without customGoal)', async () => {
    HealthGoal.create.mockResolvedValue({ success: false, field: 'customGoal', message: 'Please describe your custom goal.', data: null });

    const result = await ctrl.setGoal(1, { ...validFields, goalType: 'Custom', customGoal: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('customGoal');
  });

  test('provides default "Goal created" message when entity returns none', async () => {
    HealthGoal.create.mockResolvedValue({ success: true, field: null, data: {}, message: '' });

    const result = await ctrl.setGoal(1, validFields);

    expect(result.message).toBe('Goal created');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    HealthGoal.create.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.setGoal(1, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('SetHealthGoalController — updateGoal()', () => {
  let ctrl;
  const validFields = { goalType: 'Gain Muscle', customGoal: '', targetWeight: 75, targetCalories: 2500, activityLevel: 'Active', targetDate: '2025-06-01' };
  beforeEach(() => { ctrl = new SetHealthGoalController(); });

  test('delegates to HealthGoal.update() and returns normalised result', async () => {
    HealthGoal.update.mockResolvedValue({ success: true, field: null, data: { goalType: 'Gain Muscle' }, message: 'Goal updated' });

    const result = await ctrl.updateGoal(5, validFields);

    expect(HealthGoal.update).toHaveBeenCalledWith(5, validFields);
    expect(result.success).toBe(true);
    expect(result.data.goalType).toBe('Gain Muscle');
  });

  test('passes through validation error (empty activityLevel)', async () => {
    HealthGoal.update.mockResolvedValue({ success: false, field: 'activityLevel', message: 'Please select your activity level.', data: null });

    const result = await ctrl.updateGoal(5, { ...validFields, activityLevel: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('activityLevel');
  });

  test('provides default "Goal updated" message when entity returns empty string', async () => {
    HealthGoal.update.mockResolvedValue({ success: true, field: null, data: {}, message: '' });

    const result = await ctrl.updateGoal(5, validFields);

    expect(result.message).toBe('Goal updated');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    HealthGoal.update.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.updateGoal(5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  56. TerminateAccountController
// =====================================================================

describe('TerminateAccountController — terminateAccount()', () => {
  let ctrl;
  const user = { userId: 1, username: 'alice' };
  beforeEach(() => { ctrl = new TerminateAccountController(); });

  test('delegates to User.terminateAccount() and returns success', async () => {
    User.terminateAccount.mockResolvedValue({ success: true, message: 'Account deleted.' });

    const result = await ctrl.terminateAccount(user);

    expect(User.terminateAccount).toHaveBeenCalledWith(user);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Account deleted.');
  });

  test('passes through failure from User.terminateAccount()', async () => {
    User.terminateAccount.mockResolvedValue({ success: false, message: 'User not found.' });

    const result = await ctrl.terminateAccount(user);

    expect(result.success).toBe(false);
    expect(result.message).toBe('User not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.terminateAccount.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.terminateAccount(user);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  57. UnpublishBlogPostController
// =====================================================================

describe('UnpublishBlogPostController — unpublishPost()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new UnpublishBlogPostController(); });

  test('delegates to BlogPost.unpublish() and returns DRAFT post', async () => {
    BlogPost.unpublish.mockResolvedValue({ success: true, data: { status: 'DRAFT' }, message: 'Blog post unpublished.' });

    const result = await ctrl.unpublishPost('bp_1', 2);

    expect(BlogPost.unpublish).toHaveBeenCalledWith('bp_1', 2);
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('DRAFT');
  });

  test('passes through 403 curator mismatch error', async () => {
    BlogPost.unpublish.mockResolvedValue({ success: false, message: 'Not authorised.', data: null });

    const result = await ctrl.unpublishPost('bp_1', 99);

    expect(result.success).toBe(false);
  });

  test('passes through 404 post not found error', async () => {
    BlogPost.unpublish.mockResolvedValue({ success: false, message: 'Post not found.', data: null });

    const result = await ctrl.unpublishPost('nonexistent', 2);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Post not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    BlogPost.unpublish.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.unpublishPost('bp_1', 2);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to unpublish/i);
  });
});


// =====================================================================
//  58. UnpublishCuratorRecipeController
// =====================================================================

describe('UnpublishCuratorRecipeController — unpublishRecipe()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new UnpublishCuratorRecipeController(); });

  test('delegates to Recipe.unpublish() and wraps result in success envelope', async () => {
    Recipe.unpublish.mockResolvedValue({ success: true, message: 'Recipe unpublished.', data: { isPublished: false } });

    const result = await ctrl.unpublishRecipe('r-1', 5);

    expect(Recipe.unpublish).toHaveBeenCalledWith('r-1', 5);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Recipe unpublished.');
  });

  test('always sets success: true from the controller envelope (entity result used for message)', async () => {
    Recipe.unpublish.mockResolvedValue({ message: 'Done', data: null });

    const result = await ctrl.unpublishRecipe('r-1', 5);

    // Controller wraps with success: true regardless of entity shape
    expect(result.success).toBe(true);
    expect(result.message).toBe('Done');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.unpublish.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.unpublishRecipe('r-1', 5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to unpublish recipe/i);
  });
});


// =====================================================================
//  59. UpdateAccountDetailsController
// =====================================================================

describe('UpdateAccountDetailsController — updateAccountDetails()', () => {
  let ctrl;
  const user = { userId: 1, username: 'alice', email: 'alice@a.com' };
  const newDetails = { username: 'alice_new', email: 'new@a.com', role: 'premium', membershipPlanId: 2 };
  beforeEach(() => { ctrl = new UpdateAccountDetailsController(); });

  test('delegates to User.updateAccountDetails() with user and new fields', async () => {
    User.updateAccountDetails.mockResolvedValue({ success: true, user: { username: 'alice_new', email: 'new@a.com' } });

    const result = await ctrl.updateAccountDetails(user, newDetails);

    expect(User.updateAccountDetails).toHaveBeenCalledWith(user, {
      username: 'alice_new', email: 'new@a.com', role: 'premium', membershipPlanId: 2,
    });
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('alice_new');
  });

  test('passes through 409 username conflict error', async () => {
    User.updateAccountDetails.mockResolvedValue({ success: false, field: 'username', message: 'Username already taken.', user: null });

    const result = await ctrl.updateAccountDetails(user, { ...newDetails, username: 'taken' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('username');
  });

  test('passes through 409 email conflict error', async () => {
    User.updateAccountDetails.mockResolvedValue({ success: false, field: 'email', message: 'Email already in use.', user: null });

    const result = await ctrl.updateAccountDetails(user, { ...newDetails, email: 'taken@a.com' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('email');
  });

  test('passes all four fields (username, email, role, membershipPlanId) to entity', async () => {
    User.updateAccountDetails.mockResolvedValue({ success: true, user: {} });

    await ctrl.updateAccountDetails(user, newDetails);

    const callArg = User.updateAccountDetails.mock.calls[0][1];
    expect(callArg).toHaveProperty('username');
    expect(callArg).toHaveProperty('email');
    expect(callArg).toHaveProperty('role');
    expect(callArg).toHaveProperty('membershipPlanId');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    User.updateAccountDetails.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.updateAccountDetails(user, newDetails);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
    expect(result.user).toBeNull();
  });
});


// =====================================================================
//  60. UpdateCuratorProfileController
// =====================================================================

describe('UpdateCuratorProfileController — updateProfile()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new UpdateCuratorProfileController(); });

  test('delegates to CuratorProfileEdit.updateProfile() and returns result', async () => {
    CuratorProfileEdit.updateProfile.mockResolvedValue({ success: true, message: 'Profile updated', data: { expertise: 'Sports Nutrition', bio: 'My bio' } });

    const result = await ctrl.updateProfile(5, { expertise: 'Sports Nutrition', bio: 'My bio' });

    expect(CuratorProfileEdit.updateProfile).toHaveBeenCalledWith(5, { expertise: 'Sports Nutrition', bio: 'My bio' });
    expect(result.success).toBe(true);
    expect(result.data.expertise).toBe('Sports Nutrition');
  });

  test('returns error when userId is falsy (no API call)', async () => {
    const result = await ctrl.updateProfile(null, { expertise: 'Nutrition', bio: '' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid user/i);
    expect(result.data).toBeNull();
    expect(CuratorProfileEdit.updateProfile).not.toHaveBeenCalled();
  });

  test('returns error when userId is 0 (falsy)', async () => {
    const result = await ctrl.updateProfile(0, { expertise: 'Nutrition', bio: '' });

    expect(result.success).toBe(false);
    expect(CuratorProfileEdit.updateProfile).not.toHaveBeenCalled();
  });

  test('passes through failure from CuratorProfileEdit.updateProfile()', async () => {
    CuratorProfileEdit.updateProfile.mockResolvedValue({ success: false, message: 'Update failed.', data: null });

    const result = await ctrl.updateProfile(5, { expertise: '', bio: '' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Update failed.');
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    CuratorProfileEdit.updateProfile.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.updateProfile(5, { expertise: 'Nutrition', bio: '' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to update profile/i);
    expect(result.data).toBeNull();
  });
});
