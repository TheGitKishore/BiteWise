/**
 * BiteWise — Controller Unit Tests (Batch 5: controllers 81–91, final)
 * =====================================================================
 * Controllers covered:
 *   ViewMyRecipesController
 *   ViewNutritionTargetsController
 *   ViewPastCalorieEntriesController
 *   ViewPricingPlansController
 *   ViewRecipesController
 *   ViewReviewsController
 *   ViewSavedRecipesController
 *   ViewTodaysMenuController
 *   ViewUserProfileFeaturesController
 *   ViewWeightHistoryController
 *   WriteReviewController
 * =====================================================================
 */

jest.mock('../entity/Recipe');
jest.mock('../entity/NutritionTargets');
jest.mock('../entity/FoodIntakeEntry');
jest.mock('../entity/MembershipPlan');
jest.mock('../entity/Review');
jest.mock('../entity/UserProfileType');
jest.mock('../entity/WeightEntry');
jest.mock('../entity/HeightEntry');

import Recipe           from '../entity/Recipe';
import NutritionTargets from '../entity/NutritionTargets';
import FoodIntakeEntry  from '../entity/FoodIntakeEntry';
import MembershipPlan   from '../entity/MembershipPlan';
import Review           from '../entity/Review';
import UserProfileType  from '../entity/UserProfileType';
import WeightEntry      from '../entity/WeightEntry';

import ViewMyRecipesController           from '../controller/ViewMyRecipesController';
import ViewNutritionTargetsController    from '../controller/ViewNutritionTargetsController';
import ViewPastCalorieEntriesController  from '../controller/ViewPastCalorieEntriesController';
import ViewPricingPlansController        from '../controller/ViewPricingPlansController';
import ViewRecipesController             from '../controller/ViewRecipesController';
import ViewReviewsController             from '../controller/ViewReviewsController';
import ViewSavedRecipesController        from '../controller/ViewSavedRecipesController';
import ViewTodaysMenuController          from '../controller/ViewTodaysMenuController';
import ViewUserProfileFeaturesController from '../controller/ViewUserProfileFeaturesController';
import ViewWeightHistoryController       from '../controller/ViewWeightHistoryController';
import WriteReviewController             from '../controller/WriteReviewController';

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
//  81. ViewMyRecipesController
// =====================================================================

describe('ViewMyRecipesController — fetchMyRecipes()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewMyRecipesController(); });

  test('delegates to Recipe.fetchCustom() with userId and returns recipes', async () => {
    Recipe.fetchCustom.mockResolvedValue({ success: true, data: [{ recipeId: 'r1', title: 'Salad', createdByUserId: 5 }] });

    const result = await ctrl.fetchMyRecipes(5);

    expect(Recipe.fetchCustom).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].title).toBe('Salad');
  });

  test('returns success:true with empty data and "No custom recipes" message when user has none', async () => {
    Recipe.fetchCustom.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchMyRecipes(5);

    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/no custom recipes/i);
  });

  test('returns success:false when Recipe.fetchCustom() fails', async () => {
    Recipe.fetchCustom.mockResolvedValue({ success: false, data: [], message: 'Error fetching recipes.' });

    const result = await ctrl.fetchMyRecipes(5);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toBe('Error fetching recipes.');
  });

  test('returns empty message string when recipes exist', async () => {
    Recipe.fetchCustom.mockResolvedValue({ success: true, data: [{ recipeId: 'r1' }] });

    const result = await ctrl.fetchMyRecipes(5);

    expect(result.message).toBe('');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.fetchCustom.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchMyRecipes(5);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load your recipes/i);
  });
});


// =====================================================================
//  82. ViewNutritionTargetsController
// =====================================================================

describe('ViewNutritionTargetsController — fetchNutritionTargets()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewNutritionTargetsController(); });

  test('delegates to NutritionTargets.fetchByUser() with userId and returns targets', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30, activityLevel: 'Balanced', goal: 'Maintain Weight' } });

    const result = await ctrl.fetchNutritionTargets(1);

    expect(NutritionTargets.fetchByUser).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data.calories).toBe(2000);
    expect(result.data.activityLevel).toBe('Balanced');
  });

  test('passes through 404 user not found error', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: false, data: null, message: 'User not found.' });

    const result = await ctrl.fetchNutritionTargets(999);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    NutritionTargets.fetchByUser.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchNutritionTargets(1);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/unable to load nutrition targets/i);
  });
});

describe('ViewNutritionTargetsController — fetchNutritionTargetsForUser()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewNutritionTargetsController(); });

  test('extracts userId from user object and delegates to fetchNutritionTargets()', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: { calories: 1800 } });

    const result = await ctrl.fetchNutritionTargetsForUser({ userId: 3, username: 'alice' });

    expect(NutritionTargets.fetchByUser).toHaveBeenCalledWith(3);
    expect(result.data.calories).toBe(1800);
  });

  test('passes numeric userId directly to fetchNutritionTargets()', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: { calories: 2000 } });

    await ctrl.fetchNutritionTargetsForUser(7);

    expect(NutritionTargets.fetchByUser).toHaveBeenCalledWith(7);
  });
});


// =====================================================================
//  83. ViewPastCalorieEntriesController
// =====================================================================

describe('ViewPastCalorieEntriesController — fetchPastEntries()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewPastCalorieEntriesController(); });

  test('delegates to FoodIntakeEntry.getPastEntries() and returns history', async () => {
    FoodIntakeEntry.getPastEntries.mockResolvedValue([
      { foodName: 'Oats', calories: 300, loggedAt: '2024-01-01' },
      { foodName: 'Salad', calories: 200, loggedAt: '2024-01-02' },
    ]);

    const result = await ctrl.fetchPastEntries(1);

    expect(FoodIntakeEntry.getPastEntries).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.data[0].foodName).toBe('Oats');
  });

  test('returns Alt Flow 1a failure when no past entries exist', async () => {
    FoodIntakeEntry.getPastEntries.mockResolvedValue([]);

    const result = await ctrl.fetchPastEntries(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/no past calorie entries/i);
  });

  test('returns Alt Flow 1a failure when entity returns null', async () => {
    FoodIntakeEntry.getPastEntries.mockResolvedValue(null);

    const result = await ctrl.fetchPastEntries(1);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no past calorie entries/i);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    FoodIntakeEntry.getPastEntries.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchPastEntries(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load past entries/i);
  });
});


// =====================================================================
//  84. ViewPricingPlansController
// =====================================================================

describe('ViewPricingPlansController — fetchAllPlans()', () => {
  let ctrl;
  const freePlan    = { planId: 1, price: 0,     isActive: true,  name: 'Free'    };
  const premiumPlan = { planId: 2, price: 19.99, isActive: true,  name: 'Premium' };
  const inactivePlan = { planId: 3, price: 9.99, isActive: false, name: 'Old'    };
  beforeEach(() => { ctrl = new ViewPricingPlansController(); });

  test('returns active plans sorted by price when plans are available', async () => {
    MembershipPlan.getAll.mockResolvedValue([freePlan, premiumPlan]);
    MembershipPlan.hasAvailablePlans.mockReturnValue(true);
    MembershipPlan.getActivePlans.mockReturnValue([freePlan, premiumPlan]);

    const result = await ctrl.fetchAllPlans();

    expect(MembershipPlan.getAll).toHaveBeenCalledTimes(1);
    expect(MembershipPlan.hasAvailablePlans).toHaveBeenCalledWith([freePlan, premiumPlan]);
    expect(MembershipPlan.getActivePlans).toHaveBeenCalledWith([freePlan, premiumPlan]);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  test('returns Alt Flow 1a failure when no active plans exist', async () => {
    MembershipPlan.getAll.mockResolvedValue([inactivePlan]);
    MembershipPlan.hasAvailablePlans.mockReturnValue(false);

    const result = await ctrl.fetchAllPlans();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/no pricing plans are currently available/i);
    expect(MembershipPlan.getActivePlans).not.toHaveBeenCalled();
  });

  test('returns Alt Flow 1a failure when plans array is empty', async () => {
    MembershipPlan.getAll.mockResolvedValue([]);
    MembershipPlan.hasAvailablePlans.mockReturnValue(false);

    const result = await ctrl.fetchAllPlans();

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no pricing plans/i);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    MembershipPlan.getAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchAllPlans();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load pricing plans/i);
  });
});


// =====================================================================
//  85. ViewRecipesController
// =====================================================================

describe('ViewRecipesController — fetchRecipes()', () => {
  let ctrl;
  const recipes = [
    { recipeId: 'r1', title: 'Salad', tags: ['healthy'], prepTimeMins: 10, isCurated: true, isMealPrep: false },
    { recipeId: 'r2', title: 'Steak', tags: ['keto'],    prepTimeMins: 30, isCurated: false, isMealPrep: true },
  ];
  beforeEach(() => { ctrl = new ViewRecipesController(); });

  test('delegates to Recipe.fetchAll() and returns recipes when list is non-empty', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: recipes });
    Recipe.hasRecipes.mockReturnValue(true);

    const result = await ctrl.fetchRecipes();

    expect(Recipe.fetchAll).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
  });

  test('returns Alt Flow 1a failure when no recipes exist', async () => {
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [] });
    Recipe.hasRecipes.mockReturnValue(false);

    const result = await ctrl.fetchRecipes();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/no recipes available/i);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.fetchAll.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchRecipes();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load recipes/i);
  });
});

describe('ViewRecipesController — client-side filter methods', () => {
  let ctrl;
  const recipes = [
    { recipeId: 'r1', title: 'Chicken Salad', tags: ['healthy'], prepTimeMins: 10, isCurated: true,  isMealPrep: false },
    { recipeId: 'r2', title: 'Beef Steak',    tags: ['keto'],    prepTimeMins: 30, isCurated: false, isMealPrep: true  },
    { recipeId: 'r3', title: 'Tofu Bowl',     tags: ['vegan'],   prepTimeMins: 15, isCurated: true,  isMealPrep: true  },
  ];
  beforeEach(() => { ctrl = new ViewRecipesController(); });

  test('searchRecipes() delegates to Recipe.filterBySearch() and returns matches', () => {
    Recipe.filterBySearch.mockReturnValue([recipes[0]]);

    const result = ctrl.searchRecipes(recipes, 'chicken');

    expect(Recipe.filterBySearch).toHaveBeenCalledWith(recipes, 'chicken');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Chicken Salad');
  });

  test('filterByTag() delegates to Recipe.filterByTag() and returns matches', () => {
    Recipe.filterByTag.mockReturnValue([recipes[1]]);

    const result = ctrl.filterByTag(recipes, 'keto');

    expect(Recipe.filterByTag).toHaveBeenCalledWith(recipes, 'keto');
    expect(result[0].title).toBe('Beef Steak');
  });

  test('filterCuratedAndMealPrep() applies curated filter when curated:true', () => {
    Recipe.filterCurated.mockReturnValue([recipes[0], recipes[2]]);

    const result = ctrl.filterCuratedAndMealPrep(recipes, { curated: true, mealPrep: false });

    expect(Recipe.filterCurated).toHaveBeenCalledWith(recipes);
    expect(Recipe.filterMealPrep).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  test('filterCuratedAndMealPrep() applies mealPrep filter when mealPrep:true', () => {
    Recipe.filterMealPrep.mockReturnValue([recipes[1], recipes[2]]);

    const result = ctrl.filterCuratedAndMealPrep(recipes, { curated: false, mealPrep: true });

    expect(Recipe.filterMealPrep).toHaveBeenCalledWith(recipes);
    expect(Recipe.filterCurated).not.toHaveBeenCalled();
    expect(result).toHaveLength(2);
  });

  test('filterCuratedAndMealPrep() chains both filters when both:true', () => {
    Recipe.filterCurated.mockReturnValue([recipes[0], recipes[2]]);
    Recipe.filterMealPrep.mockReturnValue([recipes[2]]);

    const result = ctrl.filterCuratedAndMealPrep(recipes, { curated: true, mealPrep: true });

    expect(Recipe.filterCurated).toHaveBeenCalledWith(recipes);
    expect(Recipe.filterMealPrep).toHaveBeenCalledWith([recipes[0], recipes[2]]);
    expect(result).toHaveLength(1);
  });

  test('filterCuratedAndMealPrep() returns unfiltered list when both:false', () => {
    const result = ctrl.filterCuratedAndMealPrep(recipes, { curated: false, mealPrep: false });

    expect(Recipe.filterCurated).not.toHaveBeenCalled();
    expect(Recipe.filterMealPrep).not.toHaveBeenCalled();
    expect(result).toBe(recipes);
  });

  test('filterByPrepTime() delegates to Recipe.filterByPrepTime() with maxMins', () => {
    Recipe.filterByPrepTime.mockReturnValue([recipes[0]]);

    const result = ctrl.filterByPrepTime(recipes, 15);

    expect(Recipe.filterByPrepTime).toHaveBeenCalledWith(recipes, 15);
    expect(result).toHaveLength(1);
  });
});


// =====================================================================
//  86. ViewReviewsController
// =====================================================================

describe('ViewReviewsController — fetchAllReviews()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewReviewsController(); });

  test('returns reviews and computed averageRating on success', async () => {
    const reviews = [{ reviewId: 1, rating: 5 }, { reviewId: 2, rating: 4 }];
    Review.fetchAll.mockResolvedValue(reviews);
    Review.getAverageRating.mockReturnValue(4); // Math.floor(4.5) = 4

    const result = await ctrl.fetchAllReviews();

    expect(Review.fetchAll).toHaveBeenCalledTimes(1);
    expect(Review.getAverageRating).toHaveBeenCalledWith(reviews);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(2);
    expect(result.averageRating).toBe(4);
  });

  test('returns Alt Flow 1a failure when no reviews exist', async () => {
    Review.fetchAll.mockResolvedValue([]);

    const result = await ctrl.fetchAllReviews();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.averageRating).toBe(0);
    expect(result.message).toMatch(/no reviews are currently available/i);
  });

  test('returns Alt Flow 1a failure when fetchAll returns null', async () => {
    Review.fetchAll.mockResolvedValue(null);

    const result = await ctrl.fetchAllReviews();

    expect(result.success).toBe(false);
    expect(result.averageRating).toBe(0);
  });

  test('_safeCall catches unexpected throws and returns fallback with averageRating:0', async () => {
    Review.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchAllReviews();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.averageRating).toBe(0);
    expect(result.message).toMatch(/unable to load reviews/i);
  });
});


// =====================================================================
//  87. ViewSavedRecipesController
// =====================================================================

describe('ViewSavedRecipesController — fetchSavedRecipes()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewSavedRecipesController(); });

  test('delegates to Recipe.fetchSaved() and returns saved recipes', async () => {
    Recipe.fetchSaved.mockResolvedValue({ success: true, data: [{ recipeId: 'r1', title: 'Saved Salad' }] });

    const result = await ctrl.fetchSavedRecipes(1);

    expect(Recipe.fetchSaved).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data[0].title).toBe('Saved Salad');
  });

  test('returns empty array when user has no saved recipes', async () => {
    Recipe.fetchSaved.mockResolvedValue({ success: true, data: [] });

    const result = await ctrl.fetchSavedRecipes(1);

    expect(result.data).toEqual([]);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.fetchSaved.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.fetchSavedRecipes(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load saved recipes/i);
  });
});

describe('ViewSavedRecipesController — removeSavedRecipe()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewSavedRecipesController(); });

  test('delegates to Recipe.unsaveRecipe() with userId and recipeId', async () => {
    Recipe.unsaveRecipe.mockResolvedValue({ success: true, message: 'Recipe removed from saved recipes.' });

    const result = await ctrl.removeSavedRecipe(1, 'r-1');

    expect(Recipe.unsaveRecipe).toHaveBeenCalledWith(1, 'r-1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Recipe removed from saved recipes.');
  });

  test('returns error when userId is missing', async () => {
    const result = await ctrl.removeSavedRecipe(null, 'r-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to remove saved recipe/i);
    expect(Recipe.unsaveRecipe).not.toHaveBeenCalled();
  });

  test('returns error when recipeId is missing', async () => {
    const result = await ctrl.removeSavedRecipe(1, null);

    expect(result.success).toBe(false);
    expect(Recipe.unsaveRecipe).not.toHaveBeenCalled();
  });

  test('passes through failure from Recipe.unsaveRecipe()', async () => {
    Recipe.unsaveRecipe.mockResolvedValue({ success: false, message: 'Recipe not found.' });

    const result = await ctrl.removeSavedRecipe(1, 'bad-id');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Recipe not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.unsaveRecipe.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.removeSavedRecipe(1, 'r-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to load saved recipes/i);
  });
});

describe('ViewSavedRecipesController — client-side filter helpers', () => {
  let ctrl;
  const recipes = [
    { recipeId: 'r1', title: 'Salad', tags: ['vegan'],  prepTimeMins: 10 },
    { recipeId: 'r2', title: 'Steak', tags: ['keto'],   prepTimeMins: 30 },
  ];
  beforeEach(() => { ctrl = new ViewSavedRecipesController(); });

  test('filterByDietaryTag() delegates to Recipe.filterByTag()', () => {
    Recipe.filterByTag.mockReturnValue([recipes[0]]);

    const result = ctrl.filterByDietaryTag(recipes, 'vegan');

    expect(Recipe.filterByTag).toHaveBeenCalledWith(recipes, 'vegan');
    expect(result).toHaveLength(1);
  });

  test('filterByPrepTime() delegates to Recipe.filterByPrepTime()', () => {
    Recipe.filterByPrepTime.mockReturnValue([recipes[0]]);

    const result = ctrl.filterByPrepTime(recipes, 15);

    expect(Recipe.filterByPrepTime).toHaveBeenCalledWith(recipes, 15);
    expect(result).toHaveLength(1);
  });

  test('searchSavedRecipes() delegates to Recipe.filterBySearch()', () => {
    Recipe.filterBySearch.mockReturnValue([recipes[0]]);

    const result = ctrl.searchSavedRecipes(recipes, 'salad');

    expect(Recipe.filterBySearch).toHaveBeenCalledWith(recipes, 'salad');
    expect(result[0].title).toBe('Salad');
  });
});


// =====================================================================
//  88. ViewTodaysMenuController
// =====================================================================

describe('ViewTodaysMenuController — fetchTodaysMenu()', () => {
  let ctrl;
  beforeEach(() => {
    ctrl = new ViewTodaysMenuController();
    NutritionTargets.fetchByUser.mockResolvedValue({ success: true, data: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 } });
    FoodIntakeEntry.getTodayEntries.mockResolvedValue([]);
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 500, protein: 30, carbs: 60, fat: 15 });
    Recipe.fetchAll.mockResolvedValue({ success: true, data: [] });
    Recipe.fetchCustom.mockResolvedValue({ success: true, data: [] });
    Recipe.filterByCalorieBudget.mockReturnValue([]);
  });

  test('returns correct data shape on normal flow', async () => {
    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.success).toBe(true);
    expect(result.data).toHaveProperty('targets');
    expect(result.data).toHaveProperty('consumed');
    expect(result.data).toHaveProperty('remaining');
    expect(result.data).toHaveProperty('recipes');
    expect(result.data).toHaveProperty('isNearlyFull');
  });

  test('calls NutritionTargets.fetchByUser() and FoodIntakeEntry.getTodayEntries() for userId', async () => {
    await ctrl.fetchTodaysMenu(1);

    expect(NutritionTargets.fetchByUser).toHaveBeenCalledWith(1);
    expect(FoodIntakeEntry.getTodayEntries).toHaveBeenCalledWith(1);
  });

  test('calculates remaining calories as targets - consumed (floored at 0)', async () => {
    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.data.remaining.calories).toBe(1500); // 2000 - 500
  });

  test('remaining never goes below 0 when consumed exceeds target', async () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 3000, protein: 200, carbs: 300, fat: 100 });

    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.data.remaining.calories).toBe(0);
    expect(result.data.remaining.protein).toBe(0);
    expect(result.data.remaining.carbs).toBe(0);
    expect(result.data.remaining.fat).toBe(0);
  });

  test('sets isNearlyFull:true when consumed >= 90% of calorie target', async () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 1850, protein: 120, carbs: 200, fat: 55 });

    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.data.isNearlyFull).toBe(true);
  });

  test('sets isNearlyFull:false when consumed < 90% of calorie target', async () => {
    // 500/2000 = 25% < 90%
    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.data.isNearlyFull).toBe(false);
  });

  test('skips recipe fetch when isNearlyFull is true', async () => {
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 1900, protein: 140, carbs: 240, fat: 65 });

    await ctrl.fetchTodaysMenu(1);

    expect(Recipe.fetchAll).not.toHaveBeenCalled();
    expect(Recipe.fetchCustom).not.toHaveBeenCalled();
    expect(Recipe.filterByCalorieBudget).not.toHaveBeenCalled();
  });

  test('fetches and filters recipes when not nearly full and remaining > 50', async () => {
    const mockRecipes = [{ recipeId: 'r1', calories: 400 }];
    Recipe.fetchAll.mockResolvedValue({ success: true, data: mockRecipes });
    Recipe.fetchCustom.mockResolvedValue({ success: true, data: [] });
    Recipe.filterByCalorieBudget.mockReturnValue(mockRecipes);

    const result = await ctrl.fetchTodaysMenu(1);

    expect(Recipe.fetchAll).toHaveBeenCalledTimes(1);
    expect(Recipe.fetchCustom).toHaveBeenCalledWith(1);
    expect(Recipe.filterByCalorieBudget).toHaveBeenCalledWith(mockRecipes, 1500);
    expect(result.data.recipes).toHaveLength(1);
  });

  test('merges library and custom recipes before passing to filterByCalorieBudget()', async () => {
    const libraryRecipes = [{ recipeId: 'r1', calories: 400 }];
    const customRecipes  = [{ recipeId: 'c1', calories: 300 }];
    Recipe.fetchAll.mockResolvedValue({ success: true, data: libraryRecipes });
    Recipe.fetchCustom.mockResolvedValue({ success: true, data: customRecipes });
    Recipe.filterByCalorieBudget.mockReturnValue([]);

    await ctrl.fetchTodaysMenu(1);

    const callArg = Recipe.filterByCalorieBudget.mock.calls[0][0];
    expect(callArg).toHaveLength(2); // merged = 1 library + 1 custom
    expect(callArg.some(r => r.recipeId === 'r1')).toBe(true);
    expect(callArg.some(r => r.recipeId === 'c1')).toBe(true);
  });

  test('uses default targets (2000/150/250/67) when NutritionTargets fails', async () => {
    NutritionTargets.fetchByUser.mockResolvedValue({ success: false, data: null });
    FoodIntakeEntry.getTodaySummary.mockReturnValue({ calories: 0, protein: 0, carbs: 0, fat: 0 });

    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.data.targets.calories).toBe(2000);
    expect(result.data.remaining.calories).toBe(2000);
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    NutritionTargets.fetchByUser.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchTodaysMenu(1);

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/unable to load today's menu/i);
  });
});

describe('ViewTodaysMenuController — getMacroProgress()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewTodaysMenuController(); });

  const targets  = { calories: 2000, protein: 150, carbs: 250, fat: 67 };
  const consumed = { calories: 1000, protein: 75,  carbs: 125, fat: 33  };

  test('returns exactly 4 progress bar descriptors', () => {
    const result = ctrl.getMacroProgress(targets, consumed);
    expect(result).toHaveLength(4);
  });

  test('each descriptor has label, consumed, goal, unit, pct, color', () => {
    ctrl.getMacroProgress(targets, consumed).forEach(item => {
      expect(item).toHaveProperty('label');
      expect(item).toHaveProperty('consumed');
      expect(item).toHaveProperty('goal');
      expect(item).toHaveProperty('unit');
      expect(item).toHaveProperty('pct');
      expect(item).toHaveProperty('color');
    });
  });

  test('calculates pct correctly — 50% consumed of target', () => {
    const result = ctrl.getMacroProgress(targets, consumed);
    const calorieBar = result.find(r => r.label === 'Calories');
    expect(calorieBar.pct).toBeCloseTo(0.5);
    expect(calorieBar.consumed).toBe(1000);
    expect(calorieBar.goal).toBe(2000);
    expect(calorieBar.unit).toBe('kcal');
  });

  test('clamps pct at 1.0 when consumed exceeds goal', () => {
    const over = { calories: 3000, protein: 200, carbs: 300, fat: 100 };
    const result = ctrl.getMacroProgress(targets, over);
    result.forEach(item => {
      expect(item.pct).toBeLessThanOrEqual(1);
    });
  });

  test('clamps pct at 0 when consumed is 0', () => {
    const zero = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const result = ctrl.getMacroProgress(targets, zero);
    result.forEach(item => {
      expect(item.pct).toBe(0);
      expect(item.consumed).toBe(0);
    });
  });

  test('uses default goals when targets fields are missing', () => {
    const result = ctrl.getMacroProgress({}, {});
    const cal = result.find(r => r.label === 'Calories');
    expect(cal.goal).toBe(2000);
    expect(cal.pct).toBe(0);
  });

  test('labels are Calories, Protein, Carbs, Fat in order', () => {
    const labels = ctrl.getMacroProgress(targets, consumed).map(r => r.label);
    expect(labels).toEqual(['Calories', 'Protein', 'Carbs', 'Fat']);
  });

  test('macro units are kcal, g, g, g', () => {
    const units = ctrl.getMacroProgress(targets, consumed).map(r => r.unit);
    expect(units).toEqual(['kcal', 'g', 'g', 'g']);
  });
});


// =====================================================================
//  89. ViewUserProfileFeaturesController
// =====================================================================

describe('ViewUserProfileFeaturesController — fetchAllProfiles()', () => {
  let ctrl;
  const profiles = [
    { profileTypeId: 1, type: 'ATHLETE' },
    { profileTypeId: 2, type: 'MEAL_PLANNER' },
    { profileTypeId: 3, type: 'HEALTH_ORIENTED' },
  ];
  beforeEach(() => { ctrl = new ViewUserProfileFeaturesController(); });

  test('returns profiles when available', async () => {
    UserProfileType.getAll.mockResolvedValue(profiles);
    UserProfileType.hasAvailableProfiles.mockReturnValue(true);

    const result = await ctrl.fetchAllProfiles();

    expect(UserProfileType.getAll).toHaveBeenCalledTimes(1);
    expect(UserProfileType.hasAvailableProfiles).toHaveBeenCalledWith(profiles);
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(3);
    expect(result.message).toBe('');
  });

  test('returns Alt Flow 1a failure when no profiles are available', async () => {
    UserProfileType.getAll.mockResolvedValue([]);
    UserProfileType.hasAvailableProfiles.mockReturnValue(false);

    const result = await ctrl.fetchAllProfiles();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/no user profiles are currently available/i);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    UserProfileType.getAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchAllProfiles();

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.message).toMatch(/unable to load user profiles/i);
  });
});


// =====================================================================
//  90. ViewWeightHistoryController
// =====================================================================

describe('ViewWeightHistoryController — fetchWeightHistory()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewWeightHistoryController(); });

  test('returns sorted history, latest entry, and totalChange on success', async () => {
    const entries = [
      { entryId: 1, weightKg: 70, loggedAt: '2024-01-01' },
      { entryId: 2, weightKg: 69, loggedAt: '2024-06-01' },
    ];
    WeightEntry.fetchAll.mockResolvedValue({ success: true, data: entries });
    WeightEntry.getLatest.mockReturnValue({ weightKg: 69, loggedAt: '2024-06-01' });
    WeightEntry.getTotalChange.mockReturnValue(-1);

    const result = await ctrl.fetchWeightHistory(1);

    expect(WeightEntry.fetchAll).toHaveBeenCalledWith(1);
    expect(result.success).toBe(true);
    expect(result.data[0].weightKg).toBe(69); // sorted newest-first
    expect(result.latest.weightKg).toBe(69);
    expect(result.totalChange).toBe(-1);
  });

  test('passes data to WeightEntry.getLatest() and getTotalChange()', async () => {
    const entries = [{ weightKg: 70, loggedAt: '2024-01-01' }];
    WeightEntry.fetchAll.mockResolvedValue({ success: true, data: entries });
    WeightEntry.getLatest.mockReturnValue({ weightKg: 70 });
    WeightEntry.getTotalChange.mockReturnValue(0);

    await ctrl.fetchWeightHistory(1);

    expect(WeightEntry.getLatest).toHaveBeenCalledWith(entries);
    expect(WeightEntry.getTotalChange).toHaveBeenCalledWith(entries);
  });

  test('returns latest:null and totalChange:0 when fetchAll() fails', async () => {
    WeightEntry.fetchAll.mockResolvedValue({ success: false, data: [], message: 'Error' });

    const result = await ctrl.fetchWeightHistory(1);

    expect(result.success).toBe(false);
    expect(result.latest).toBeNull();
    expect(result.totalChange).toBe(0);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    WeightEntry.fetchAll.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.fetchWeightHistory(1);

    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
    expect(result.latest).toBeNull();
    expect(result.totalChange).toBe(0);
    expect(result.message).toMatch(/unable to load weight history/i);
  });
});

describe('ViewWeightHistoryController — deleteEntry()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new ViewWeightHistoryController(); });

  test('delegates to WeightEntry.delete() and returns result', async () => {
    WeightEntry.delete.mockResolvedValue({ success: true, message: 'Entry removed.' });

    const result = await ctrl.deleteEntry(5);

    expect(WeightEntry.delete).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Entry removed.');
  });

  test('passes through failure from WeightEntry.delete()', async () => {
    WeightEntry.delete.mockResolvedValue({ success: false, message: 'Entry not found.' });

    const result = await ctrl.deleteEntry(999);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Entry not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    WeightEntry.delete.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.deleteEntry(5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to load weight history/i);
  });
});


// =====================================================================
//  91. WriteReviewController
// =====================================================================

describe('WriteReviewController — submitReview()', () => {
  let ctrl;
  const validFields = { rating: 5, title: 'Great!', content: 'This app changed my life completely.', profileType: 'Athlete' };
  beforeEach(() => { ctrl = new WriteReviewController(); });

  test('delegates to Review.create() and returns success result', async () => {
    Review.create.mockResolvedValue({ success: true, review_id: 10, message: 'Review submitted!' });

    const result = await ctrl.submitReview(1, validFields);

    expect(Review.create).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.review_id).toBe(10);
  });

  test('passes through validation error (rating out of range)', async () => {
    Review.create.mockResolvedValue({ success: false, field: 'rating', message: 'Please select a rating between 1 and 5.', data: null });

    const result = await ctrl.submitReview(1, { ...validFields, rating: 0 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('rating');
  });

  test('passes through validation error (empty title)', async () => {
    Review.create.mockResolvedValue({ success: false, field: 'title', message: 'Review title is required.', data: null });

    const result = await ctrl.submitReview(1, { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('passes through validation error (content too short)', async () => {
    Review.create.mockResolvedValue({ success: false, field: 'content', message: 'Review must be at least 10 characters.', data: null });

    const result = await ctrl.submitReview(1, { ...validFields, content: 'Short.' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('content');
  });

  test('passes userId and all fields correctly to Review.create()', async () => {
    Review.create.mockResolvedValue({ success: true, review_id: 11 });

    await ctrl.submitReview(42, validFields);

    expect(Review.create).toHaveBeenCalledWith(42, validFields);
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    Review.create.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.submitReview(1, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
    expect(result.data).toBeNull();
  });
});
