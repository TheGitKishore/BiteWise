/**
 * BiteWise — Controller Unit Tests (Batch 2: controllers 21–40)
 * =====================================================================
 * Controllers covered:
 *   CreateAccountController
 *   CreateBlogPostController
 *   CreateCuratorRecipeController
 *   CreateDiaryEntryController
 *   CreateManualFoodEntryController
 *   CreateMealPlanController
 *   CreateRecipeController
 *   DeleteBlogPostController
 *   DeleteCuratorRecipeController
 *   DeleteCustomRecipeController
 *   DeleteDiaryEntryController
 *   DeleteExerciseLogController
 *   DeleteGroceryItemController
 *   DeleteMealPlanController
 *   EditAutoMealPlanController
 *   EditBlogPostController
 *   EditCuratorRecipeController
 *   EditCustomMealPlanController
 *   EditDiaryEntryController
 *   EditExerciseLogController
 *
 * Testing strategy:
 *   - All entity dependencies mocked with jest.mock()
 *   - Normal flow: entity called with correct args, result returned
 *   - Alt flows: missing/invalid fields, entity returning failure
 *   - _safe/_safeCall wrappers: catches unexpected throws
 *   - Pure logic (getPlanTypes, published guard) tested inline
 * =====================================================================
 */

jest.mock('../entity/User');
jest.mock('../entity/BlogPost');
jest.mock('../entity/RecipeDraft');
jest.mock('../entity/DiaryEntry');
jest.mock('../entity/FoodIntakeEntry');
jest.mock('../entity/MealPlan');
jest.mock('../entity/Recipe');
jest.mock('../entity/ExerciseEntry');
jest.mock('../entity/GroceryList');

import User           from '../entity/User';
import BlogPost       from '../entity/BlogPost';
import RecipeDraft    from '../entity/RecipeDraft';
import DiaryEntry     from '../entity/DiaryEntry';
import FoodIntakeEntry from '../entity/FoodIntakeEntry';
import MealPlan       from '../entity/MealPlan';
import Recipe         from '../entity/Recipe';
import ExerciseEntry  from '../entity/ExerciseEntry';
import GroceryList    from '../entity/GroceryList';

import CreateAccountController        from '../controller/CreateAccountController';
import CreateBlogPostController       from '../controller/CreateBlogPostController';
import CreateCuratorRecipeController  from '../controller/CreateCuratorRecipeController';
import CreateDiaryEntryController     from '../controller/CreateDiaryEntryController';
import CreateManualFoodEntryController from '../controller/CreateManualFoodEntryController';
import CreateMealPlanController       from '../controller/CreateMealPlanController';
import CreateRecipeController         from '../controller/CreateRecipeController';
import DeleteBlogPostController       from '../controller/DeleteBlogPostController';
import DeleteCuratorRecipeController  from '../controller/DeleteCuratorRecipeController';
import DeleteCustomRecipeController   from '../controller/DeleteCustomRecipeController';
import DeleteDiaryEntryController     from '../controller/DeleteDiaryEntryController';
import DeleteExerciseLogController    from '../controller/DeleteExerciseLogController';
import DeleteGroceryItemController    from '../controller/DeleteGroceryItemController';
import DeleteMealPlanController       from '../controller/DeleteMealPlanController';
import EditAutoMealPlanController     from '../controller/EditAutoMealPlanController';
import EditBlogPostController         from '../controller/EditBlogPostController';
import EditCuratorRecipeController    from '../controller/EditCuratorRecipeController';
import EditCustomMealPlanController   from '../controller/EditCustomMealPlanController';
import EditDiaryEntryController       from '../controller/EditDiaryEntryController';
import EditExerciseLogController      from '../controller/EditExerciseLogController';

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
//  21. CreateAccountController
// =====================================================================

describe('CreateAccountController — createAccount()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new CreateAccountController(); });

  test('delegates all fields to User.createAccount() and returns result', async () => {
    User.createAccount.mockResolvedValue({ success: true, user: { userId: 1, username: 'alice', role: 'free' } });

    const result = await ctrl.createAccount({
      username: 'alice', email: 'a@b.com',
      password: 'secure123', confirmPassword: 'secure123', selectedPlanId: 1,
    });

    expect(User.createAccount).toHaveBeenCalledWith({
      username: 'alice', email: 'a@b.com',
      password: 'secure123', confirmPassword: 'secure123', selectedPlanId: 1,
    });
    expect(result.success).toBe(true);
    expect(result.user.username).toBe('alice');
  });

  test('passes through validation error from User.createAccount() (username too short)', async () => {
    User.createAccount.mockResolvedValue({ success: false, field: 'username', message: 'Username too short.' });

    const result = await ctrl.createAccount({
      username: 'ab', email: 'a@b.com',
      password: 'secure123', confirmPassword: 'secure123', selectedPlanId: 1,
    });

    expect(result.success).toBe(false);
    expect(result.field).toBe('username');
  });

  test('passes through 409 conflict error (email taken)', async () => {
    User.createAccount.mockResolvedValue({ success: false, field: 'email', message: 'Email already in use.' });

    const result = await ctrl.createAccount({
      username: 'alice', email: 'taken@b.com',
      password: 'secure123', confirmPassword: 'secure123', selectedPlanId: 1,
    });

    expect(result.success).toBe(false);
    expect(result.field).toBe('email');
  });

  test('passes through confirmPassword mismatch error from entity', async () => {
    User.createAccount.mockResolvedValue({ success: false, field: 'confirmPassword', message: 'Passwords do not match.' });

    const result = await ctrl.createAccount({
      username: 'alice', email: 'a@b.com',
      password: 'secure123', confirmPassword: 'different', selectedPlanId: 1,
    });

    expect(result.success).toBe(false);
    expect(result.field).toBe('confirmPassword');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    User.createAccount.mockRejectedValue(new Error('Network failure'));

    const result = await ctrl.createAccount({
      username: 'alice', email: 'a@b.com',
      password: 'secure123', confirmPassword: 'secure123', selectedPlanId: 1,
    });

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  22. CreateBlogPostController
// =====================================================================

describe('CreateBlogPostController — createPost()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new CreateBlogPostController(); });

  test('delegates to BlogPost.create() and returns DRAFT post', async () => {
    const mockPost = { blogPostId: 'bp_1', title: 'My Post', status: 'DRAFT' };
    BlogPost.create.mockResolvedValue({ success: true, data: mockPost, message: 'Saved as draft!' });

    const result = await ctrl.createPost(1, 'Alice', { title: 'My Post', content: 'Valid content here enough chars.', tags: [] });

    expect(BlogPost.create).toHaveBeenCalledWith(1, 'Alice', { title: 'My Post', content: 'Valid content here enough chars.', tags: [] });
    expect(result.success).toBe(true);
    expect(result.data.status).toBe('DRAFT');
  });

  test('passes through validation error (empty title) from BlogPost.create()', async () => {
    BlogPost.create.mockResolvedValue({ success: false, field: 'title', message: 'Title is required.', data: null });

    const result = await ctrl.createPost(1, 'Alice', { title: '', content: '', tags: [] });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('passes through content-too-short error', async () => {
    BlogPost.create.mockResolvedValue({ success: false, field: 'content', message: 'Content must be at least 20 characters.', data: null });

    const result = await ctrl.createPost(1, 'Alice', { title: 'Title', content: 'Short.', tags: [] });

    expect(result.success).toBe(false);
    expect(result.field).toBe('content');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    BlogPost.create.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.createPost(1, 'Alice', { title: 'T', content: 'C', tags: [] });

    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  23. CreateCuratorRecipeController
// =====================================================================

describe('CreateCuratorRecipeController — createRecipe()', () => {
  let ctrl;
  const validFields = { title: 'Salad', ingredients: ['Lettuce'], instructions: ['Mix'], tags: [] };
  beforeEach(() => { ctrl = new CreateCuratorRecipeController(); });

  test('forces isCurated: true in payload to RecipeDraft.create()', async () => {
    RecipeDraft.create.mockResolvedValue({ success: true, data: { title: 'Salad', isCurated: true } });

    await ctrl.createRecipe(1, validFields);

    const callArgs = RecipeDraft.create.mock.calls[0];
    expect(callArgs[0]).toBe(1);          // userId
    expect(callArgs[1].isCurated).toBe(true);
  });

  test('returns success result from RecipeDraft.create()', async () => {
    RecipeDraft.create.mockResolvedValue({ success: true, data: { title: 'Salad' }, message: 'Draft created!' });

    const result = await ctrl.createRecipe(1, validFields);

    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Salad');
  });

  test('passes through validation error (empty title) from RecipeDraft.create()', async () => {
    RecipeDraft.create.mockResolvedValue({ success: false, field: 'title', message: 'Recipe name is required.' });

    const result = await ctrl.createRecipe(1, { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('caller-supplied isCurated: false is overridden to true', async () => {
    RecipeDraft.create.mockResolvedValue({ success: true, data: {} });

    await ctrl.createRecipe(1, { ...validFields, isCurated: false });

    const payload = RecipeDraft.create.mock.calls[0][1];
    expect(payload.isCurated).toBe(true);
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    RecipeDraft.create.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.createRecipe(1, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  24. CreateDiaryEntryController
// =====================================================================

describe('CreateDiaryEntryController — createEntry()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new CreateDiaryEntryController(); });

  test('delegates to DiaryEntry.create() and returns new entry', async () => {
    DiaryEntry.create.mockResolvedValue({ success: true, data: { entryId: '1', title: 'Day 1' }, message: 'Created!' });

    const result = await ctrl.createEntry(1, { title: 'Day 1', content: 'Felt great.', mood: 'Happy', weight: 70 });

    expect(DiaryEntry.create).toHaveBeenCalledWith(1, { title: 'Day 1', content: 'Felt great.', mood: 'Happy', weight: 70 });
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Day 1');
  });

  test('passes through missing title error from DiaryEntry.create()', async () => {
    DiaryEntry.create.mockResolvedValue({ success: false, field: 'title', message: 'Title is required.', data: null });

    const result = await ctrl.createEntry(1, { title: '', content: 'Content', mood: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('passes through missing content error', async () => {
    DiaryEntry.create.mockResolvedValue({ success: false, field: 'content', message: 'Entry content is required.', data: null });

    const result = await ctrl.createEntry(1, { title: 'Title', content: '', mood: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('content');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    DiaryEntry.create.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.createEntry(1, { title: 'T', content: 'C', mood: '' });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('CreateDiaryEntryController — addPhoto()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new CreateDiaryEntryController(); });

  test('delegates to DiaryEntry.addPhoto() when photoUri is provided', async () => {
    DiaryEntry.addPhoto.mockResolvedValue({ success: true, data: { photoUri: 'file://photo.jpg' }, message: 'Photo added.' });

    const result = await ctrl.addPhoto('entry-1', 'file://photo.jpg');

    expect(DiaryEntry.addPhoto).toHaveBeenCalledWith('entry-1', 'file://photo.jpg');
    expect(result.success).toBe(true);
  });

  test('returns error without calling entity when photoUri is empty', async () => {
    const result = await ctrl.addPhoto('entry-1', '');

    expect(result.success).toBe(false);
    expect(result.message).toBe('No photo selected.');
    expect(DiaryEntry.addPhoto).not.toHaveBeenCalled();
  });

  test('returns error without calling entity when photoUri is null', async () => {
    const result = await ctrl.addPhoto('entry-1', null);

    expect(result.success).toBe(false);
    expect(DiaryEntry.addPhoto).not.toHaveBeenCalled();
  });

  test('_safeCall catches unexpected throws', async () => {
    DiaryEntry.addPhoto.mockRejectedValue(new Error('Upload failed'));

    const result = await ctrl.addPhoto('entry-1', 'file://photo.jpg');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  25. CreateManualFoodEntryController
// =====================================================================

describe('CreateManualFoodEntryController — createManualEntry()', () => {
  let ctrl;
  const validFields = { foodName: 'Chicken Rice', calories: 600, protein: 35, carbs: 70, fat: 20, meal: 'Lunch' };
  beforeEach(() => { ctrl = new CreateManualFoodEntryController(); });

  test('delegates to FoodIntakeEntry.createManual() and returns result', async () => {
    FoodIntakeEntry.createManual.mockResolvedValue({ success: true, data: { foodName: 'Chicken Rice' }, message: 'Logged!' });

    const result = await ctrl.createManualEntry(1, validFields);

    expect(FoodIntakeEntry.createManual).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.foodName).toBe('Chicken Rice');
  });

  test('passes through validation error (empty foodName)', async () => {
    FoodIntakeEntry.createManual.mockResolvedValue({ success: false, field: 'foodName', message: 'Food name is required.', data: null });

    const result = await ctrl.createManualEntry(1, { ...validFields, foodName: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('foodName');
  });

  test('passes through validation error (calories 0)', async () => {
    FoodIntakeEntry.createManual.mockResolvedValue({ success: false, field: 'calories', message: 'Please enter a valid calorie amount.', data: null });

    const result = await ctrl.createManualEntry(1, { ...validFields, calories: 0 });

    expect(result.success).toBe(false);
    expect(result.field).toBe('calories');
  });

  test('passes through validation error (meal empty)', async () => {
    FoodIntakeEntry.createManual.mockResolvedValue({ success: false, field: 'meal', message: 'Please select a meal.', data: null });

    const result = await ctrl.createManualEntry(1, { ...validFields, meal: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('meal');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    FoodIntakeEntry.createManual.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.createManualEntry(1, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  26. CreateMealPlanController
// =====================================================================

describe('CreateMealPlanController — createMealPlan()', () => {
  let ctrl;
  const validFields = { name: 'Week 1', description: 'My weekly plan', numDays: 7, days: [] };
  beforeEach(() => { ctrl = new CreateMealPlanController(); });

  test('delegates to MealPlan.create() and returns new plan', async () => {
    MealPlan.create.mockResolvedValue({ success: true, data: { planId: '1', name: 'Week 1' }, message: 'Plan created!' });

    const result = await ctrl.createMealPlan(1, validFields);

    expect(MealPlan.create).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.name).toBe('Week 1');
  });

  test('passes through missing name error from MealPlan.create()', async () => {
    MealPlan.create.mockResolvedValue({ success: false, field: 'name', message: 'Plan name is required.', data: null });

    const result = await ctrl.createMealPlan(1, { ...validFields, name: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    MealPlan.create.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.createMealPlan(1, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  27. CreateRecipeController
// =====================================================================

describe('CreateRecipeController — createRecipe()', () => {
  let ctrl;
  const validFields = { title: 'Salad', ingredients: ['Lettuce'], instructions: ['Mix'], tags: [], calories: 300 };
  beforeEach(() => { ctrl = new CreateRecipeController(); });

  test('delegates to Recipe.create() and returns new recipe', async () => {
    Recipe.create.mockResolvedValue({ success: true, data: { title: 'Salad' }, message: 'Created!' });

    const result = await ctrl.createRecipe(1, validFields);

    expect(Recipe.create).toHaveBeenCalledWith(1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Salad');
  });

  test('passes through validation error (empty title)', async () => {
    Recipe.create.mockResolvedValue({ success: false, field: 'title', message: 'Recipe name is required.', data: null });

    const result = await ctrl.createRecipe(1, { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('passes through validation error (empty ingredients)', async () => {
    Recipe.create.mockResolvedValue({ success: false, field: 'ingredients', message: 'At least one ingredient is required.', data: null });

    const result = await ctrl.createRecipe(1, { ...validFields, ingredients: [] });

    expect(result.success).toBe(false);
    expect(result.field).toBe('ingredients');
  });

  test('passes through validation error (empty instructions)', async () => {
    Recipe.create.mockResolvedValue({ success: false, field: 'instructions', message: 'At least one instruction step is required.', data: null });

    const result = await ctrl.createRecipe(1, { ...validFields, instructions: [] });

    expect(result.success).toBe(false);
    expect(result.field).toBe('instructions');
  });

  test('_safeCall catches unexpected throws and returns generic error', async () => {
    Recipe.create.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.createRecipe(1, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  28. DeleteBlogPostController
// =====================================================================

describe('DeleteBlogPostController — deletePost()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteBlogPostController(); });

  test('delegates to BlogPost.delete() with correct args and returns result', async () => {
    BlogPost.delete.mockResolvedValue({ success: true, message: 'Blog post deleted.' });

    const result = await ctrl.deletePost('bp_1', 2);

    expect(BlogPost.delete).toHaveBeenCalledWith('bp_1', 2);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Blog post deleted.');
  });

  test('passes through failure from BlogPost.delete()', async () => {
    BlogPost.delete.mockResolvedValue({ success: false, message: 'Post not found.' });

    const result = await ctrl.deletePost('nonexistent', 2);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Post not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    BlogPost.delete.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.deletePost('bp_1', 2);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to delete/i);
  });
});


// =====================================================================
//  29. DeleteCuratorRecipeController
// =====================================================================

describe('DeleteCuratorRecipeController — deleteRecipe()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteCuratorRecipeController(); });

  test('delegates to RecipeDraft.delete() with correct args', async () => {
    RecipeDraft.delete.mockResolvedValue({ success: true, message: 'Draft deleted.' });

    const result = await ctrl.deleteRecipe('draft-1', 5);

    expect(RecipeDraft.delete).toHaveBeenCalledWith('draft-1', 5);
    expect(result.success).toBe(true);
  });

  test('passes through failure from RecipeDraft.delete()', async () => {
    RecipeDraft.delete.mockResolvedValue({ success: false, message: 'Draft not found.' });

    const result = await ctrl.deleteRecipe('bad-id', 5);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Draft not found.');
  });

  test('_safeCall catches throws and returns fallback error', async () => {
    RecipeDraft.delete.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.deleteRecipe('draft-1', 5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to delete recipe/i);
  });
});


// =====================================================================
//  30. DeleteCustomRecipeController
// =====================================================================

describe('DeleteCustomRecipeController — deleteRecipe()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteCustomRecipeController(); });

  test('delegates to Recipe.deleteCustomRecipe() with correct args', async () => {
    Recipe.deleteCustomRecipe.mockResolvedValue({ success: true, message: 'Recipe removed.' });

    const result = await ctrl.deleteRecipe('recipe-1', 5);

    expect(Recipe.deleteCustomRecipe).toHaveBeenCalledWith('recipe-1', 5);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Recipe removed.');
  });

  test('returns error when recipeId is missing', async () => {
    const result = await ctrl.deleteRecipe(null, 5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid recipe or user/i);
    expect(Recipe.deleteCustomRecipe).not.toHaveBeenCalled();
  });

  test('returns error when userId is missing', async () => {
    const result = await ctrl.deleteRecipe('recipe-1', null);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid recipe or user/i);
    expect(Recipe.deleteCustomRecipe).not.toHaveBeenCalled();
  });

  test('returns error when both recipeId and userId are missing', async () => {
    const result = await ctrl.deleteRecipe(null, null);

    expect(result.success).toBe(false);
    expect(Recipe.deleteCustomRecipe).not.toHaveBeenCalled();
  });

  test('passes through failure from Recipe.deleteCustomRecipe()', async () => {
    Recipe.deleteCustomRecipe.mockResolvedValue({ success: false, message: 'Recipe not found.' });

    const result = await ctrl.deleteRecipe('recipe-1', 5);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Recipe not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    Recipe.deleteCustomRecipe.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.deleteRecipe('recipe-1', 5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to delete recipe/i);
  });
});


// =====================================================================
//  31. DeleteDiaryEntryController
// =====================================================================

describe('DeleteDiaryEntryController — deleteEntry()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteDiaryEntryController(); });

  test('delegates to DiaryEntry.delete() with correct entryId', async () => {
    DiaryEntry.delete.mockResolvedValue({ success: true, message: 'Diary entry deleted.' });

    const result = await ctrl.deleteEntry('entry-1');

    expect(DiaryEntry.delete).toHaveBeenCalledWith('entry-1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Diary entry deleted.');
  });

  test('passes through failure from DiaryEntry.delete()', async () => {
    DiaryEntry.delete.mockResolvedValue({ success: false, message: 'Entry not found.' });

    const result = await ctrl.deleteEntry('bad-id');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Entry not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    DiaryEntry.delete.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.deleteEntry('entry-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to delete entry/i);
  });
});


// =====================================================================
//  32. DeleteExerciseLogController
// =====================================================================

describe('DeleteExerciseLogController — deleteExercise()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteExerciseLogController(); });

  test('delegates to ExerciseEntry.delete() with correct entryId', async () => {
    ExerciseEntry.delete.mockResolvedValue({ success: true, message: 'Exercise log deleted successfully!' });

    const result = await ctrl.deleteExercise(5);

    expect(ExerciseEntry.delete).toHaveBeenCalledWith(5);
    expect(result.success).toBe(true);
    expect(result.message).toBe('Exercise log deleted successfully!');
  });

  test('returns error when entryId is falsy (0)', async () => {
    const result = await ctrl.deleteExercise(0);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid exercise log/i);
    expect(ExerciseEntry.delete).not.toHaveBeenCalled();
  });

  test('returns error when entryId is null', async () => {
    const result = await ctrl.deleteExercise(null);

    expect(result.success).toBe(false);
    expect(ExerciseEntry.delete).not.toHaveBeenCalled();
  });

  test('passes through failure from ExerciseEntry.delete()', async () => {
    ExerciseEntry.delete.mockResolvedValue({ success: false, message: 'Log not found.' });

    const result = await ctrl.deleteExercise(999);

    expect(result.success).toBe(false);
    expect(result.message).toBe('Log not found.');
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    ExerciseEntry.delete.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.deleteExercise(5);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to delete exercise log/i);
  });
});


// =====================================================================
//  33. DeleteGroceryItemController
// =====================================================================

describe('DeleteGroceryItemController — deleteItem()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteGroceryItemController(); });

  test('delegates to GroceryList.deleteItem() with correct args', async () => {
    GroceryList.deleteItem.mockResolvedValue({ success: true, data: { items: [] }, message: 'Item removed.' });

    const result = await ctrl.deleteItem(1, 'item-1');

    expect(GroceryList.deleteItem).toHaveBeenCalledWith(1, 'item-1');
    expect(result.success).toBe(true);
  });

  test('passes through failure from GroceryList.deleteItem()', async () => {
    GroceryList.deleteItem.mockResolvedValue({ success: false, message: 'Item not found.', data: null });

    const result = await ctrl.deleteItem(1, 'nonexistent');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Item not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    GroceryList.deleteItem.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.deleteItem(1, 'item-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/failed to remove item/i);
    expect(result.data).toBeNull();
  });
});


// =====================================================================
//  34. DeleteMealPlanController
// =====================================================================

describe('DeleteMealPlanController — deleteMealPlan()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new DeleteMealPlanController(); });

  test('delegates to MealPlan.delete() with correct planId', async () => {
    MealPlan.delete.mockResolvedValue({ success: true, message: 'Meal plan deleted' });

    const result = await ctrl.deleteMealPlan('plan-1');

    expect(MealPlan.delete).toHaveBeenCalledWith('plan-1');
    expect(result.success).toBe(true);
    expect(result.message).toBe('Meal plan deleted');
  });

  test('passes through failure from MealPlan.delete()', async () => {
    MealPlan.delete.mockResolvedValue({ success: false, message: 'Plan not found.' });

    const result = await ctrl.deleteMealPlan('bad-id');

    expect(result.success).toBe(false);
    expect(result.message).toBe('Plan not found.');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    MealPlan.delete.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.deleteMealPlan('plan-1');

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to delete meal plan/i);
  });
});


// =====================================================================
//  35. EditAutoMealPlanController
// =====================================================================

describe('EditAutoMealPlanController — getPlanTypes()', () => {
  let ctrl;
  beforeEach(() => { ctrl = new EditAutoMealPlanController(); });

  test('returns an array of 5 plan type strings', () => {
    const types = ctrl.getPlanTypes();
    expect(Array.isArray(types)).toBe(true);
    expect(types).toHaveLength(5);
  });

  test('includes all expected plan types', () => {
    const types = ctrl.getPlanTypes();
    expect(types).toContain('Balanced Diet');
    expect(types).toContain('High Protein');
    expect(types).toContain('Weight Loss');
    expect(types).toContain('Vegetarian');
    expect(types).toContain('Keto');
  });
});

describe('EditAutoMealPlanController — updateAutoMealPlan()', () => {
  let ctrl;
  const validFields = { name: 'Keto Plan', description: '', planType: 'Keto', numDays: 7, days: [] };
  beforeEach(() => { ctrl = new EditAutoMealPlanController(); });

  test('delegates to MealPlan.updateAutoGeneratedPlan() and returns result', async () => {
    MealPlan.updateAutoGeneratedPlan.mockResolvedValue({ success: true, data: { name: 'Keto Plan', isAutoGenerated: true }, message: 'Updated!' });

    const result = await ctrl.updateAutoMealPlan('plan-1', 1, validFields);

    expect(MealPlan.updateAutoGeneratedPlan).toHaveBeenCalledWith('plan-1', 1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.isAutoGenerated).toBe(true);
  });

  test('returns error when planId is missing', async () => {
    const result = await ctrl.updateAutoMealPlan(null, 1, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid plan or user/i);
    expect(MealPlan.updateAutoGeneratedPlan).not.toHaveBeenCalled();
  });

  test('returns error when userId is missing', async () => {
    const result = await ctrl.updateAutoMealPlan('plan-1', null, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid plan or user/i);
    expect(MealPlan.updateAutoGeneratedPlan).not.toHaveBeenCalled();
  });

  test('passes through empty name error from MealPlan.updateAutoGeneratedPlan()', async () => {
    MealPlan.updateAutoGeneratedPlan.mockResolvedValue({ success: false, field: 'name', message: 'Plan name is required.', data: null });

    const result = await ctrl.updateAutoMealPlan('plan-1', 1, { ...validFields, name: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    MealPlan.updateAutoGeneratedPlan.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.updateAutoMealPlan('plan-1', 1, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/unable to update meal plan/i);
  });
});


// =====================================================================
//  36. EditBlogPostController
// =====================================================================

describe('EditBlogPostController — updatePost()', () => {
  let ctrl;
  const validFields = { title: 'Updated Title', content: 'Updated content that is long enough.', tags: [] };
  beforeEach(() => { ctrl = new EditBlogPostController(); });

  test('delegates to BlogPost.update() with correct args and returns result', async () => {
    BlogPost.update.mockResolvedValue({ success: true, data: { title: 'Updated Title' }, message: 'Updated!' });

    const result = await ctrl.updatePost('bp_1', 2, validFields);

    expect(BlogPost.update).toHaveBeenCalledWith('bp_1', 2, validFields);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Updated Title');
  });

  test('passes through empty title validation error', async () => {
    BlogPost.update.mockResolvedValue({ success: false, field: 'title', message: 'Title is required.', data: null });

    const result = await ctrl.updatePost('bp_1', 2, { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('passes through content-too-short validation error', async () => {
    BlogPost.update.mockResolvedValue({ success: false, field: 'content', message: 'Content must be at least 20 characters.', data: null });

    const result = await ctrl.updatePost('bp_1', 2, { ...validFields, content: 'Short.' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('content');
  });

  test('passes through 403 wrong-curator error', async () => {
    BlogPost.update.mockResolvedValue({ success: false, field: null, message: 'Not authorised.', data: null });

    const result = await ctrl.updatePost('bp_1', 99, validFields);

    expect(result.success).toBe(false);
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    BlogPost.update.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.updatePost('bp_1', 2, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  37. EditCuratorRecipeController
// =====================================================================

describe('EditCuratorRecipeController — updateRecipe()', () => {
  let ctrl;
  const validFields = { title: 'Updated Salad', ingredients: ['Lettuce'], instructions: ['Mix'] };
  beforeEach(() => { ctrl = new EditCuratorRecipeController(); });

  test('delegates to RecipeDraft.update() for unpublished draft', async () => {
    const recipe = { recipeId: 'draft-1', _id: null, status: 'DRAFT', isPublished: false };
    RecipeDraft.update.mockResolvedValue({ success: true, data: { title: 'Updated Salad' }, message: 'Draft updated.' });

    const result = await ctrl.updateRecipe(recipe, 5, validFields);

    expect(RecipeDraft.update).toHaveBeenCalledWith('draft-1', 5, validFields);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Updated Salad');
  });

  test('uses _id when recipeId is not set', async () => {
    const recipe = { recipeId: null, _id: 'mongo-id-1', status: 'DRAFT', isPublished: false };
    RecipeDraft.update.mockResolvedValue({ success: true, data: {} });

    await ctrl.updateRecipe(recipe, 5, validFields);

    expect(RecipeDraft.update).toHaveBeenCalledWith('mongo-id-1', 5, validFields);
  });

  test('blocks edit when recipe status is PUBLISHED', async () => {
    const recipe = { recipeId: 'r-1', status: 'PUBLISHED', isPublished: true };

    const result = await ctrl.updateRecipe(recipe, 5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/published recipes cannot be edited/i);
    expect(RecipeDraft.update).not.toHaveBeenCalled();
  });

  test('blocks edit when isPublished is true (even if status not set)', async () => {
    const recipe = { recipeId: 'r-1', status: undefined, isPublished: true };

    const result = await ctrl.updateRecipe(recipe, 5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/published recipes cannot be edited/i);
    expect(RecipeDraft.update).not.toHaveBeenCalled();
  });

  test('returns error when recipe has no id', async () => {
    const recipe = { recipeId: null, _id: null, status: 'DRAFT', isPublished: false };

    const result = await ctrl.updateRecipe(recipe, 5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/recipe id is missing/i);
    expect(RecipeDraft.update).not.toHaveBeenCalled();
  });

  test('passes through validation error from RecipeDraft.update()', async () => {
    const recipe = { recipeId: 'draft-1', status: 'DRAFT', isPublished: false };
    RecipeDraft.update.mockResolvedValue({ success: false, field: 'title', message: 'Recipe name is required.' });

    const result = await ctrl.updateRecipe(recipe, 5, { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('_safeCall catches unexpected throws and returns fallback error', async () => {
    const recipe = { recipeId: 'draft-1', status: 'DRAFT', isPublished: false };
    RecipeDraft.update.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.updateRecipe(recipe, 5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});


// =====================================================================
//  38. EditCustomMealPlanController
// =====================================================================

describe('EditCustomMealPlanController — updateCustomPlan()', () => {
  let ctrl;
  const validFields = { name: 'Updated Plan', description: 'New desc', numDays: 7, days: [] };
  beforeEach(() => { ctrl = new EditCustomMealPlanController(); });

  test('delegates to MealPlan.updateCustomPlan() and returns result', async () => {
    MealPlan.updateCustomPlan.mockResolvedValue({ success: true, data: { name: 'Updated Plan', isAutoGenerated: false }, message: 'Updated!' });

    const result = await ctrl.updateCustomPlan('plan-1', 1, validFields);

    expect(MealPlan.updateCustomPlan).toHaveBeenCalledWith('plan-1', 1, validFields);
    expect(result.success).toBe(true);
    expect(result.data.isAutoGenerated).toBe(false);
  });

  test('returns error when planId is missing', async () => {
    const result = await ctrl.updateCustomPlan(null, 1, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid plan or user/i);
    expect(result.field).toBeNull();
    expect(MealPlan.updateCustomPlan).not.toHaveBeenCalled();
  });

  test('returns error when userId is missing', async () => {
    const result = await ctrl.updateCustomPlan('plan-1', null, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid plan or user/i);
    expect(MealPlan.updateCustomPlan).not.toHaveBeenCalled();
  });

  test('passes through empty name validation error', async () => {
    MealPlan.updateCustomPlan.mockResolvedValue({ success: false, field: 'name', message: 'Plan name is required.', data: null });

    const result = await ctrl.updateCustomPlan('plan-1', 1, { ...validFields, name: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    MealPlan.updateCustomPlan.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.updateCustomPlan('plan-1', 1, validFields);

    expect(result.success).toBe(false);
    expect(result.field).toBeNull();
    expect(result.message).toMatch(/unable to update meal plan/i);
  });
});


// =====================================================================
//  39. EditDiaryEntryController
// =====================================================================

describe('EditDiaryEntryController — updateEntry()', () => {
  let ctrl;
  const validFields = { title: 'Updated Title', content: 'Updated content.', mood: 'Happy', weight: 70 };
  beforeEach(() => { ctrl = new EditDiaryEntryController(); });

  test('delegates to DiaryEntry.update() and returns updated entry', async () => {
    DiaryEntry.update.mockResolvedValue({ success: true, data: { title: 'Updated Title' }, message: 'Updated!' });

    const result = await ctrl.updateEntry('entry-1', validFields);

    expect(DiaryEntry.update).toHaveBeenCalledWith('entry-1', validFields);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Updated Title');
  });

  test('returns error when entryId is falsy', async () => {
    const result = await ctrl.updateEntry(null, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid entry/i);
    expect(result.data).toBeNull();
    expect(DiaryEntry.update).not.toHaveBeenCalled();
  });

  test('returns error when entryId is empty string', async () => {
    const result = await ctrl.updateEntry('', validFields);

    expect(result.success).toBe(false);
    expect(DiaryEntry.update).not.toHaveBeenCalled();
  });

  test('passes through validation error (empty title) from DiaryEntry.update()', async () => {
    DiaryEntry.update.mockResolvedValue({ success: false, field: 'title', message: 'Title is required.', data: null });

    const result = await ctrl.updateEntry('entry-1', { ...validFields, title: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('passes through validation error (empty content)', async () => {
    DiaryEntry.update.mockResolvedValue({ success: false, field: 'content', message: 'Entry content is required.', data: null });

    const result = await ctrl.updateEntry('entry-1', { ...validFields, content: '' });

    expect(result.success).toBe(false);
    expect(result.field).toBe('content');
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    DiaryEntry.update.mockRejectedValue(new Error('DB error'));

    const result = await ctrl.updateEntry('entry-1', validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to update diary entry/i);
    expect(result.data).toBeNull();
  });
});


// =====================================================================
//  40. EditExerciseLogController
// =====================================================================

describe('EditExerciseLogController — updateExercise()', () => {
  let ctrl;
  const validFields = { exerciseType: 'Cycling', durationMins: 40, caloriesBurned: 320, notes: '' };
  beforeEach(() => { ctrl = new EditExerciseLogController(); });

  test('delegates to ExerciseEntry.update() and returns updated entry', async () => {
    ExerciseEntry.update.mockResolvedValue({ success: true, data: { exerciseType: 'Cycling', durationMins: 40 }, message: 'Updated!' });

    const result = await ctrl.updateExercise(5, validFields);

    expect(ExerciseEntry.update).toHaveBeenCalledWith(5, validFields);
    expect(result.success).toBe(true);
    expect(result.data.exerciseType).toBe('Cycling');
  });

  test('returns error when entryId is falsy (0)', async () => {
    const result = await ctrl.updateExercise(0, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid exercise log/i);
    expect(result.data).toBeNull();
    expect(ExerciseEntry.update).not.toHaveBeenCalled();
  });

  test('returns error when entryId is null', async () => {
    const result = await ctrl.updateExercise(null, validFields);

    expect(result.success).toBe(false);
    expect(ExerciseEntry.update).not.toHaveBeenCalled();
  });

  test('passes through validation error (empty exerciseType) from ExerciseEntry.update()', async () => {
    ExerciseEntry.update.mockResolvedValue({ success: false, message: 'Exercise type is required.', data: null });

    const result = await ctrl.updateExercise(5, { ...validFields, exerciseType: '' });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Exercise type is required.');
  });

  test('passes through validation error (duration 0) from ExerciseEntry.update()', async () => {
    ExerciseEntry.update.mockResolvedValue({ success: false, message: 'Duration must be greater than 0.', data: null });

    const result = await ctrl.updateExercise(5, { ...validFields, durationMins: 0 });

    expect(result.success).toBe(false);
    expect(result.message).toBe('Duration must be greater than 0.');
  });

  test('destructures and passes all four fields correctly to ExerciseEntry.update()', async () => {
    ExerciseEntry.update.mockResolvedValue({ success: true, data: {} });

    await ctrl.updateExercise(5, { exerciseType: 'Running', durationMins: 30, caloriesBurned: 300, notes: 'Morning run' });

    expect(ExerciseEntry.update).toHaveBeenCalledWith(5, {
      exerciseType: 'Running', durationMins: 30, caloriesBurned: 300, notes: 'Morning run',
    });
  });

  test('_safe catches unexpected throws and returns fallback error', async () => {
    ExerciseEntry.update.mockRejectedValue(new Error('Network error'));

    const result = await ctrl.updateExercise(5, validFields);

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/unable to update exercise log/i);
    expect(result.data).toBeNull();
  });
});
