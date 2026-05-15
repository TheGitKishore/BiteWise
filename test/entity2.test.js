/**
 * BiteWise — Entity Layer Unit Tests (Part 2)
 * =====================================================================
 * Coverage:  User, Recipe, RecipeDraft, Review,
 *            SmartEatingContent, UserProfileType, WeightEntry
 *
 * Run with: npm test -- entity.test.js
 * =====================================================================
 */

// ─── Global axios mock ───────────────────────────────────────────────
jest.mock('axios');
import axios from 'axios';

// ─── Silence console noise from entity files ─────────────────────────
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

afterEach(() => jest.clearAllMocks());


// =====================================================================
//  1. User
// =====================================================================
import User from '../entity/User';

describe('User — validateUsername()', () => {
  test('valid for a normal username', () => {
    expect(User.validateUsername('alice_99').valid).toBe(true);
  });

  test('invalid when empty', () => {
    const r = User.validateUsername('');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/required/i);
  });

  test('invalid when fewer than 3 characters', () => {
    const r = User.validateUsername('ab');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/3 characters/i);
  });

  test('invalid when more than 20 characters', () => {
    const r = User.validateUsername('a'.repeat(21));
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/20 characters/i);
  });

  test('invalid when contains special characters', () => {
    const r = User.validateUsername('alice!@#');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/letters, numbers and underscores/i);
  });

  test('valid when exactly 3 characters', () => {
    expect(User.validateUsername('abc').valid).toBe(true);
  });

  test('valid when exactly 20 characters', () => {
    expect(User.validateUsername('a'.repeat(20)).valid).toBe(true);
  });

  test('valid with underscores', () => {
    expect(User.validateUsername('my_user_123').valid).toBe(true);
  });
});

describe('User — validateEmail()', () => {
  test('valid for standard email', () => {
    expect(User.validateEmail('alice@example.com').valid).toBe(true);
  });

  test('invalid when empty', () => {
    expect(User.validateEmail('').valid).toBe(false);
  });

  test('invalid when missing @', () => {
    expect(User.validateEmail('notanemail.com').valid).toBe(false);
  });

  test('invalid when missing domain', () => {
    expect(User.validateEmail('alice@').valid).toBe(false);
  });

  test('invalid when missing TLD', () => {
    expect(User.validateEmail('alice@example').valid).toBe(false);
  });

  test('invalid when contains spaces', () => {
    expect(User.validateEmail('alice @example.com').valid).toBe(false);
  });
});

describe('User — validatePassword()', () => {
  test('valid for password with 6+ characters', () => {
    expect(User.validatePassword('secret').valid).toBe(true);
  });

  test('invalid when empty', () => {
    expect(User.validatePassword('').valid).toBe(false);
  });

  test('invalid when fewer than 6 characters', () => {
    const r = User.validatePassword('abc');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/6 characters/i);
  });

  test('valid when exactly 6 characters', () => {
    expect(User.validatePassword('abcdef').valid).toBe(true);
  });
});

describe('User — validateCalorieLimit()', () => {
  test('valid for 2000 kcal', () => {
    expect(User.validateCalorieLimit(2000).valid).toBe(true);
  });

  test('invalid when 0', () => {
    expect(User.validateCalorieLimit(0).valid).toBe(false);
  });

  test('invalid when null', () => {
    expect(User.validateCalorieLimit(null).valid).toBe(false);
  });

  test('invalid when below 500', () => {
    const r = User.validateCalorieLimit(499);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/500/);
  });

  test('invalid when above 10000', () => {
    const r = User.validateCalorieLimit(10001);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/10,000/);
  });

  test('valid at lower boundary 500', () => {
    expect(User.validateCalorieLimit(500).valid).toBe(true);
  });

  test('valid at upper boundary 10000', () => {
    expect(User.validateCalorieLimit(10000).valid).toBe(true);
  });
});

describe('User — normalizeProfileType()', () => {
  test('uppercases lowercase input', () => {
    expect(User.normalizeProfileType('athlete')).toBe('ATHLETE');
  });

  test('trims whitespace before uppercasing', () => {
    expect(User.normalizeProfileType('  meal_planner  ')).toBe('MEAL_PLANNER');
  });

  test('returns null for null input', () => {
    expect(User.normalizeProfileType(null)).toBeNull();
  });

  test('returns null for undefined input', () => {
    expect(User.normalizeProfileType(undefined)).toBeNull();
  });

  test('returns null for empty string', () => {
    expect(User.normalizeProfileType('')).toBeNull();
  });
});

describe('User — normalizeUserProfile()', () => {
  test('normalizes profileType inside data object', () => {
    const result = User.normalizeUserProfile({ userId: 1, profileType: 'athlete' });
    expect(result.profileType).toBe('ATHLETE');
  });

  test('keeps profileType as null when already null', () => {
    const result = User.normalizeUserProfile({ userId: 1, profileType: null });
    expect(result.profileType).toBeNull();
  });

  test('returns input as-is when data is not an object', () => {
    expect(User.normalizeUserProfile(null)).toBeNull();
    expect(User.normalizeUserProfile('string')).toBe('string');
  });
});

describe('User — createAccount()', () => {
  const valid = {
    username: 'alice_99',
    email: 'alice@example.com',
    password: 'secret123',
    confirmPassword: 'secret123',
    selectedPlanId: 1,
  };

  test('returns error for invalid username without calling API', async () => {
    const result = await User.createAccount({ ...valid, username: 'ab' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('username');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error for invalid email without calling API', async () => {
    const result = await User.createAccount({ ...valid, email: 'bad-email' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('email');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error for short password without calling API', async () => {
    const result = await User.createAccount({ ...valid, password: 'abc', confirmPassword: 'abc' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('password');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error when passwords do not match without calling API', async () => {
    const result = await User.createAccount({ ...valid, confirmPassword: 'different' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('confirm');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API when all fields are valid', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { userId: 1 } } });
    const result = await User.createAccount(valid);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/register'),
      expect.objectContaining({ username: 'alice_99', email: 'alice@example.com' })
    );
    expect(result.success).toBe(true);
  });

  test('returns fallback error on plain network failure', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));
    const result = await User.createAccount(valid);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('User — login()', () => {
  test('returns error when username is empty without calling API', async () => {
    const result = await User.login({ username: '', password: 'secret' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/username is required/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error when password is empty without calling API', async () => {
    const result = await User.login({ username: 'alice', password: '' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/password is required/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API with correct payload on valid input', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { userId: 1 } } });
    const result = await User.login({ username: 'alice', password: 'secret' });
    expect(axios.post).toHaveBeenCalledWith(
      expect.stringContaining('/login'),
      { username: 'alice', password: 'secret' }
    );
    expect(result.success).toBe(true);
  });

  test('returns fallback error on plain network failure', async () => {
    axios.post.mockRejectedValue(new Error('Network down'));
    const result = await User.login({ username: 'alice', password: 'secret' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/incorrect credentials/i);
  });
});

describe('User — setDailyCalorieLimit()', () => {
  const mockUser = { userId: 1 };

  test('returns validation error without calling API for limit below 500', async () => {
    const result = await User.setDailyCalorieLimit(mockUser, 400);
    expect(result.success).toBe(false);
    expect(result.field).toBe('limit');
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls PUT endpoint on valid limit', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await User.setDailyCalorieLimit(mockUser, 2000);
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/calorie-limit'),
      { userId: 1, dailyCalorieLimit: 2000 }
    );
  });
});

describe('User — setProfileType()', () => {
  test('returns error for invalid profile type without calling API', async () => {
    const result = await User.setProfileType(1, 'INVALID_TYPE');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid profile type/i);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('normalizes lowercase profile type before sending', async () => {
    axios.put.mockResolvedValue({ data: { success: true, data: { profileType: 'ATHLETE' } } });
    await User.setProfileType(1, 'athlete');
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('/profile-type'),
      { userId: 1, profileType: 'ATHLETE' }
    );
  });

  test('accepts all 3 valid profile types', async () => {
    axios.put.mockResolvedValue({ data: { success: true, data: {} } });
    for (const type of ['ATHLETE', 'HEALTH_ORIENTED', 'MEAL_PLANNER']) {
      jest.clearAllMocks();
      await User.setProfileType(1, type);
      expect(axios.put).toHaveBeenCalledTimes(1);
    }
  });
});

describe('User — fetchNutritionTargets()', () => {
  test('returns error when user is null', async () => {
    const result = await User.fetchNutritionTargets(null);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no user session/i);
  });

  test('returns default targets when user has no nutritionTargets', async () => {
    const result = await User.fetchNutritionTargets({ userId: 1, nutritionTargets: null });
    expect(result.success).toBe(true);
    expect(result.data.calories).toBe(2546);
    expect(result.data.fiber).toBe(30);
  });

  test('returns user-specific targets when nutritionTargets is set', async () => {
    const user = { userId: 1, nutritionTargets: { calories: 1800, protein: 120, carbs: 200, fat: 60, fiber: 25, activityLevel: 'Light', goal: 'Lose Weight' } };
    const result = await User.fetchNutritionTargets(user);
    expect(result.data.calories).toBe(1800);
    expect(result.data.protein).toBe(120);
  });
});

describe('User — getUser()', () => {
  test('returns error immediately when userId is missing', async () => {
    const result = await User.getUser(null);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/user id is required/i);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('calls API and normalizes profileType on success', async () => {
    axios.get.mockResolvedValue({ data: { user: { userId: 1, profileType: 'athlete' } } });
    const result = await User.getUser(1);
    expect(result.success).toBe(true);
    expect(result.data.profileType).toBe('ATHLETE');
  });
});

describe('User — terminateAccount()', () => {
  test('returns error when user is null', async () => {
    const result = await User.terminateAccount(null);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no user session/i);
  });

  test('calls DELETE endpoint with userId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Account deleted.' } });
    const result = await User.terminateAccount({ userId: 5 });
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/delete/5'));
    expect(result.success).toBe(true);
  });
});


// =====================================================================
//  2. Recipe
// =====================================================================
import Recipe from '../entity/Recipe';

describe('Recipe — getSummaryLine()', () => {
  test('formats prepTime and calories correctly', () => {
    const r = new Recipe({ prepTimeMins: 30, calories: 450 });
    expect(r.getSummaryLine()).toBe('30 min  •  450 kcal');
  });
});

describe('Recipe — validateRecipe()', () => {
  const valid = {
    title: 'Chicken Salad',
    ingredients: ['Chicken', 'Lettuce'],
    instructions: ['Grill chicken', 'Toss salad'],
  };

  test('valid when all fields provided', () => {
    expect(Recipe.validateRecipe(valid).valid).toBe(true);
  });

  test('invalid when title is empty', () => {
    const r = Recipe.validateRecipe({ ...valid, title: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when title is whitespace only', () => {
    expect(Recipe.validateRecipe({ ...valid, title: '   ' }).valid).toBe(false);
  });

  test('invalid when ingredients array contains only empty strings', () => {
    const r = Recipe.validateRecipe({ ...valid, ingredients: ['', '  '] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('ingredients');
  });

  test('invalid when instructions array contains only empty strings', () => {
    const r = Recipe.validateRecipe({ ...valid, instructions: [''] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('instructions');
  });

  test('invalid when ingredients is empty array', () => {
    const r = Recipe.validateRecipe({ ...valid, ingredients: [] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('ingredients');
  });
});

describe('Recipe — filterBySearch()', () => {
  const recipes = [
    new Recipe({ title: 'Chicken Salad', ingredients: ['chicken', 'lettuce'] }),
    new Recipe({ title: 'Pasta Bolognese', ingredients: ['pasta', 'beef'] }),
    new Recipe({ title: 'Salmon Bowl', ingredients: ['salmon', 'rice'] }),
  ];

  test('filters by title (case-insensitive)', () => {
    expect(Recipe.filterBySearch(recipes, 'chicken')).toHaveLength(1);
  });

  test('filters by ingredient name', () => {
    expect(Recipe.filterBySearch(recipes, 'salmon')).toHaveLength(1);
  });

  test('returns all when query is empty', () => {
    expect(Recipe.filterBySearch(recipes, '')).toHaveLength(3);
  });

  test('returns empty when no match found', () => {
    expect(Recipe.filterBySearch(recipes, 'zzzzzz')).toHaveLength(0);
  });
});

describe('Recipe — filterByTag()', () => {
  const recipes = [
    new Recipe({ title: 'A', tags: ['high-protein', 'keto'] }),
    new Recipe({ title: 'B', tags: ['vegan'] }),
    new Recipe({ title: 'C', tags: ['keto'] }),
  ];

  test('filters correctly by tag', () => {
    expect(Recipe.filterByTag(recipes, 'keto')).toHaveLength(2);
  });

  test('returns all when tag is "All"', () => {
    expect(Recipe.filterByTag(recipes, 'All')).toHaveLength(3);
  });

  test('returns all when tag is null', () => {
    expect(Recipe.filterByTag(recipes, null)).toHaveLength(3);
  });
});

describe('Recipe — filterMealPrep()', () => {
  const recipes = [
    new Recipe({ title: 'A', isMealPrep: true }),
    new Recipe({ title: 'B', isMealPrep: false }),
  ];

  test('returns only meal prep recipes', () => {
    const result = Recipe.filterMealPrep(recipes);
    expect(result).toHaveLength(1);
    expect(result[0].isMealPrep).toBe(true);
  });
});

describe('Recipe — filterCurated()', () => {
  const recipes = [
    new Recipe({ title: 'A', isCurated: true }),
    new Recipe({ title: 'B', isCurated: false }),
    new Recipe({ title: 'C', isCurated: true }),
  ];

  test('returns only curated recipes', () => {
    expect(Recipe.filterCurated(recipes)).toHaveLength(2);
  });
});

describe('Recipe — filterByPrepTime()', () => {
  const recipes = [
    new Recipe({ title: 'Quick',  prepTimeMins: 10 }),
    new Recipe({ title: 'Medium', prepTimeMins: 30 }),
    new Recipe({ title: 'Long',   prepTimeMins: 60 }),
  ];

  test('includes recipes at or under maxMins', () => {
    expect(Recipe.filterByPrepTime(recipes, 30)).toHaveLength(2);
  });

  test('returns all when maxMins is null', () => {
    expect(Recipe.filterByPrepTime(recipes, null)).toHaveLength(3);
  });
});

describe('Recipe — filterByUser()', () => {
  const recipes = [
    new Recipe({ title: 'A', createdByUserId: '1' }),
    new Recipe({ title: 'B', createdByUserId: '2' }),
    new Recipe({ title: 'C', createdByUserId: '1' }),
  ];

  test('returns recipes belonging to specified user', () => {
    expect(Recipe.filterByUser(recipes, '1')).toHaveLength(2);
  });

  test('returns empty array when userId is null', () => {
    expect(Recipe.filterByUser(recipes, null)).toHaveLength(0);
  });
});

describe('Recipe — hasRecipes()', () => {
  test('returns true for non-empty array', () => {
    expect(Recipe.hasRecipes([new Recipe()])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(Recipe.hasRecipes([])).toBe(false);
  });

  test('returns false for non-array input', () => {
    expect(Recipe.hasRecipes(null)).toBe(false);
  });
});

describe('Recipe — filterByCalorieBudget()', () => {
  const recipes = [
    new Recipe({ title: 'Light',  calories: 200 }),
    new Recipe({ title: 'Medium', calories: 500 }),
    new Recipe({ title: 'Heavy',  calories: 900 }),
  ];

  test('excludes recipes over 110% of budget', () => {
    // budget = 600 * 1.1 = 660 → Heavy (900) excluded
    const result = Recipe.filterByCalorieBudget(recipes, 600);
    expect(result.find(r => r.title === 'Heavy')).toBeUndefined();
  });

  test('returns empty array when remainingCalories is 0', () => {
    expect(Recipe.filterByCalorieBudget(recipes, 0)).toHaveLength(0);
  });

  test('returns empty array when input is not an array', () => {
    expect(Recipe.filterByCalorieBudget(null, 500)).toHaveLength(0);
  });

  test('sorts results by proximity to sweet spot (40% of remaining)', () => {
    // remaining = 500, sweet spot = 200 → Light (200) should be closest
    const result = Recipe.filterByCalorieBudget(recipes, 500);
    expect(result[0].title).toBe('Light');
  });
});

describe('Recipe — getMacroMatchScore()', () => {
  test('returns 1 when recipe exactly matches remaining macros', () => {
    const recipe = new Recipe({ calories: 500, protein: 30, carbs: 60, fat: 15 });
    const score = Recipe.getMacroMatchScore(recipe, { calories: 500, protein: 30, carbs: 60, fat: 15 });
    expect(score).toBe(1);
  });

  test('returns 0 when recipe is null', () => {
    expect(Recipe.getMacroMatchScore(null, { calories: 500 })).toBe(0);
  });

  test('returns 0 when remaining is null', () => {
    expect(Recipe.getMacroMatchScore(new Recipe(), null)).toBe(0);
  });

  test('returns value between 0 and 1 for partial match', () => {
    const recipe = new Recipe({ calories: 600, protein: 40, carbs: 70, fat: 20 });
    const score = Recipe.getMacroMatchScore(recipe, { calories: 500, protein: 30, carbs: 60, fat: 15 });
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('Recipe — create()', () => {
  test('returns validation error without calling API when title is empty', async () => {
    const result = await Recipe.create(1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid fields and returns Recipe instance', async () => {
    axios.post.mockResolvedValue({ data: { title: 'Chicken Salad', ingredients: ['Chicken'], instructions: ['Grill'] } });
    const result = await Recipe.create(1, { title: 'Chicken Salad', ingredients: ['Chicken'], instructions: ['Grill'] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Recipe);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe('Recipe — update() [stub — no axios]', () => {
  test('returns validation error for empty title', async () => {
    const result = await Recipe.update('r1', 1, { title: '', ingredients: ['x'], instructions: ['y'] });
    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('returns Recipe instance on valid fields', async () => {
    const result = await Recipe.update('r1', 1, { title: 'Updated', ingredients: ['Egg'], instructions: ['Boil egg'] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Recipe);
    expect(result.data.title).toBe('Updated');
  });
});

describe('Recipe — search()', () => {
  test('returns empty array immediately when query is empty string', async () => {
    const result = await Recipe.search('');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('calls fetchAll (axios.get) when query is non-empty', async () => {
    axios.get.mockResolvedValue({ data: [] });
    await Recipe.search('chicken');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});

describe('Recipe — updateLike()', () => {
  test('calls PUT with incrementBy payload and returns likeCount', async () => {
    axios.put.mockResolvedValue({ data: { recipeId: 'r1', likeCount: 5, isLiked: true } });
    const result = await Recipe.updateLike('r1', 1);
    expect(result.success).toBe(true);
    expect(result.data.likeCount).toBe(5);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('r1/like'), { incrementBy: 1 });
  });

  test('returns success: false on API failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await Recipe.updateLike('r1', 1);
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  3. RecipeDraft
// =====================================================================
import RecipeDraft from '../entity/RecipeDraft';

describe('RecipeDraft — validateRecipe()', () => {
  const valid = {
    title: 'Draft Recipe',
    ingredients: ['Tomato', 'Basil'],
    instructions: ['Mix ingredients'],
  };

  test('valid when all fields provided', () => {
    expect(RecipeDraft.validateRecipe(valid).valid).toBe(true);
  });

  test('invalid when title is empty', () => {
    const r = RecipeDraft.validateRecipe({ ...valid, title: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when all ingredients are empty strings', () => {
    const r = RecipeDraft.validateRecipe({ ...valid, ingredients: ['', '  '] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('ingredients');
  });

  test('invalid when instructions is empty array', () => {
    const r = RecipeDraft.validateRecipe({ ...valid, instructions: [] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('instructions');
  });
});

describe('RecipeDraft — filterByUser()', () => {
  const drafts = [
    new RecipeDraft({ title: 'A', createdByUserId: '10' }),
    new RecipeDraft({ title: 'B', createdByUserId: '20' }),
    new RecipeDraft({ title: 'C', createdByUserId: '10' }),
  ];

  test('returns drafts for specified user', () => {
    expect(RecipeDraft.filterByUser(drafts, '10')).toHaveLength(2);
  });

  test('returns empty array when userId is null', () => {
    expect(RecipeDraft.filterByUser(drafts, null)).toHaveLength(0);
  });

  test('uses String() comparison so numeric userId matches', () => {
    expect(RecipeDraft.filterByUser(drafts, 10)).toHaveLength(2);
  });
});

describe('RecipeDraft — constructor defaults', () => {
  test('isCurated defaults to true (unlike Recipe which defaults to false)', () => {
    expect(new RecipeDraft().isCurated).toBe(true);
  });

  test('difficulty defaults to "Easy"', () => {
    expect(new RecipeDraft().difficulty).toBe('Easy');
  });

  test('servings defaults to 1', () => {
    expect(new RecipeDraft().servings).toBe(1);
  });
});

describe('RecipeDraft — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await RecipeDraft.create(1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('forces isCurated = true in the API payload', async () => {
    axios.post.mockResolvedValue({ data: { title: 'Draft', ingredients: ['x'], instructions: ['y'], isCurated: true } });
    await RecipeDraft.create(1, { title: 'Draft', ingredients: ['Egg'], instructions: ['Boil egg'] });
    const payload = axios.post.mock.calls[0][1];
    expect(payload.isCurated).toBe(true);
  });

  test('returns RecipeDraft instance on success', async () => {
    axios.post.mockResolvedValue({ data: { title: 'Draft', ingredients: ['x'], instructions: ['y'] } });
    const result = await RecipeDraft.create(1, { title: 'Draft', ingredients: ['Egg'], instructions: ['Boil'] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(RecipeDraft);
  });
});

describe('RecipeDraft — update()', () => {
  test('returns validation error without calling API', async () => {
    const result = await RecipeDraft.update('d1', 1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls PUT and returns RecipeDraft instance on success', async () => {
    axios.put.mockResolvedValue({
      data: { message: 'Updated!', data: { title: 'Updated Draft', ingredients: ['Egg'], instructions: ['Boil'] } },
    });
    const result = await RecipeDraft.update('d1', 1, { title: 'Updated Draft', ingredients: ['Egg'], instructions: ['Boil'] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(RecipeDraft);
  });
});

describe('RecipeDraft — delete()', () => {
  test('sends createdByUserId in the DELETE body', async () => {
    axios.delete.mockResolvedValue({ data: {} });
    await RecipeDraft.delete('d1', 42);
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('d1'),
      { data: { createdByUserId: 42 } }
    );
  });

  test('returns success: false on API error', async () => {
    axios.delete.mockRejectedValue(new Error('Server error'));
    const result = await RecipeDraft.delete('d1', 1);
    expect(result.success).toBe(false);
  });
});

describe('RecipeDraft — fetchAll()', () => {
  test('returns RecipeDraft instances on success', async () => {
    axios.get.mockResolvedValue({
      data: [{ _id: '1', title: 'Draft A', ingredients: [], instructions: [] }],
    });
    const result = await RecipeDraft.fetchAll();
    expect(result.success).toBe(true);
    expect(result.data[0]).toBeInstanceOf(RecipeDraft);
  });

  test('returns empty array on network error', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    const result = await RecipeDraft.fetchAll();
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });
});


// =====================================================================
//  4. Review
// =====================================================================
import Review from '../entity/Review';

describe('Review — validateReview()', () => {
  const valid = { rating: 5, title: 'Great app!', content: 'Really love using this app daily.' };

  test('valid when all fields are correct', () => {
    expect(Review.validateReview(valid).valid).toBe(true);
  });

  test('invalid when rating is 0', () => {
    const r = Review.validateReview({ ...valid, rating: 0 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('rating');
  });

  test('invalid when rating is 6 (above max of 5)', () => {
    const r = Review.validateReview({ ...valid, rating: 6 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('rating');
  });

  test('invalid when rating is null', () => {
    const r = Review.validateReview({ ...valid, rating: null });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('rating');
  });

  test('invalid when title is empty', () => {
    const r = Review.validateReview({ ...valid, title: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when title is whitespace only', () => {
    const r = Review.validateReview({ ...valid, title: '   ' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when content is fewer than 10 characters', () => {
    const r = Review.validateReview({ ...valid, content: 'Short' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('content');
  });

  test('valid when content is exactly 10 characters', () => {
    expect(Review.validateReview({ ...valid, content: '1234567890' }).valid).toBe(true);
  });

  test('valid at rating lower boundary of 1', () => {
    expect(Review.validateReview({ ...valid, rating: 1 }).valid).toBe(true);
  });

  test('valid at rating upper boundary of 5', () => {
    expect(Review.validateReview({ ...valid, rating: 5 }).valid).toBe(true);
  });
});

describe('Review — getAverageRating()', () => {
  test('returns 0 for empty array', () => {
    expect(Review.getAverageRating([])).toBe(0);
  });

  test('returns 0 for null input', () => {
    expect(Review.getAverageRating(null)).toBe(0);
  });

  test('returns floor of average for mixed ratings', () => {
    // avg = (5 + 4 + 3) / 3 = 4.0 → floor = 4
    const reviews = [new Review({ rating: 5 }), new Review({ rating: 4 }), new Review({ rating: 3 })];
    expect(Review.getAverageRating(reviews)).toBe(4);
  });

  test('uses Math.floor not Math.round — 4.5 becomes 4, not 5', () => {
    const reviews = [new Review({ rating: 5 }), new Review({ rating: 4 })];
    expect(Review.getAverageRating(reviews)).toBe(4);
  });

  test('handles single review correctly', () => {
    expect(Review.getAverageRating([new Review({ rating: 3 })])).toBe(3);
  });

  test('treats missing rating as 0 in the sum', () => {
    // (4 + 0) / 2 = 2.0 → floor = 2
    const reviews = [new Review({ rating: 4 }), new Review({})];
    expect(Review.getAverageRating(reviews)).toBe(2);
  });
});

describe('Review — create()', () => {
  const valid = { rating: 4, title: 'Great!', content: 'Really enjoy using this app every day.' };

  test('returns validation error without calling API', async () => {
    const result = await Review.create(1, { rating: 0, title: '', content: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('trims title and content before sending to API', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    await Review.create(1, { ...valid, title: '  Great!  ', content: '  Really enjoy this app daily  ' });
    const payload = axios.post.mock.calls[0][1];
    expect(payload.title).toBe('Great!');
    expect(payload.content).toBe('Really enjoy this app daily');
  });

  test('sends rating as a Number even when string is provided', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    await Review.create(1, { ...valid, rating: '4' });
    const payload = axios.post.mock.calls[0][1];
    expect(typeof payload.rating).toBe('number');
    expect(payload.rating).toBe(4);
  });

  test('calls API on valid input', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    await Review.create(1, valid);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe('Review — remove()', () => {
  test('calls DELETE endpoint with reviewId in URL', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'Review deleted' } });
    const result = await Review.remove('rev-123');
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('rev-123'));
    expect(result.success).toBe(true);
  });

  test('returns success: false and backend message on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await Review.remove('bad-id');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Not found');
  });
});


// =====================================================================
//  5. SmartEatingContent
// =====================================================================
import SmartEatingContent from '../entity/SmartEatingContent';

describe('SmartEatingContent — filterByCategory()', () => {
  const alternatives = [
    { name: 'Apple',    category: 'Fruits' },
    { name: 'Broccoli', category: 'Vegetables' },
    { name: 'Banana',   category: 'Fruits' },
  ];

  test('filters by specific category', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, 'Fruits')).toHaveLength(2);
  });

  test('returns all when category is "All"', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, 'All')).toHaveLength(3);
  });

  test('returns all when category is null', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, null)).toHaveLength(3);
  });
});

describe('SmartEatingContent — getCategories()', () => {
  const alternatives = [
    { category: 'Fruits' },
    { category: 'Vegetables' },
    { category: 'Fruits' },
  ];

  test('prepends "All" and deduplicates categories', () => {
    const cats = SmartEatingContent.getCategories(alternatives);
    expect(cats[0]).toBe('All');
    expect(cats).toContain('Fruits');
    expect(cats).toContain('Vegetables');
    expect(cats.filter(c => c === 'Fruits')).toHaveLength(1);
  });
});

describe('SmartEatingContent — filterSnackIdeas()', () => {
  const snackIdeas = [
    { name: 'Nuts',   timing: 'Pre-workout' },
    { name: 'Yogurt', timing: 'Post-workout' },
    { name: 'Banana', timing: 'Pre-workout' },
  ];

  test('filters by timing (case-insensitive)', () => {
    expect(SmartEatingContent.filterSnackIdeas(snackIdeas, 'pre-workout')).toHaveLength(2);
  });

  test('returns all when filter is "All"', () => {
    expect(SmartEatingContent.filterSnackIdeas(snackIdeas, 'All')).toHaveLength(3);
  });

  test('returns all when filter is null', () => {
    expect(SmartEatingContent.filterSnackIdeas(snackIdeas, null)).toHaveLength(3);
  });
});

describe('SmartEatingContent — searchAlternatives()', () => {
  const groups = [
    {
      original: 'White Rice',
      alternatives: [
        { name: 'Brown Rice',       goal: 'Weight Loss' },
        { name: 'Cauliflower Rice', goal: 'Low Carb'    },
      ],
    },
    {
      original: 'Butter',
      alternatives: [
        { name: 'Avocado', goal: 'Heart Health' },
      ],
    },
  ];

  test('matches by original food name', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'white rice');
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('White Rice');
  });

  test('matches by alternative name', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'avocado');
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('Butter');
  });

  test('matches by goal text', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'low carb');
    expect(result).toHaveLength(1);
    expect(result[0].alternatives[0].name).toBe('Cauliflower Rice');
  });

  test('returns all groups when query is empty', () => {
    expect(SmartEatingContent.searchAlternatives(groups, '')).toHaveLength(2);
  });

  test('returns empty array when no match found', () => {
    expect(SmartEatingContent.searchAlternatives(groups, 'zzzz')).toHaveLength(0);
  });
});

describe('SmartEatingContent — _normalizeSnackingContent()', () => {
  test('returns all empty arrays when called with empty object', () => {
    const result = SmartEatingContent._normalizeSnackingContent({});
    expect(Array.isArray(result.corePrinciples)).toBe(true);
    expect(Array.isArray(result.snackIdeas)).toBe(true);
    expect(Array.isArray(result.portionControl.visualGuides)).toBe(true);
    expect(Array.isArray(result.warningSign.signs)).toBe(true);
  });

  test('preserves valid arrays from input', () => {
    const result = SmartEatingContent._normalizeSnackingContent({
      corePrinciples: ['Eat slowly', 'Drink water'],
      snackIdeas: [{ name: 'Apple' }],
    });
    expect(result.corePrinciples).toHaveLength(2);
    expect(result.snackIdeas).toHaveLength(1);
  });

  test('handles null input without throwing', () => {
    const result = SmartEatingContent._normalizeSnackingContent(null);
    expect(result.corePrinciples).toEqual([]);
  });
});

describe('SmartEatingContent — _normalizeAlternativesGrouped()', () => {
  test('returns empty groups and tips for empty object', () => {
    const result = SmartEatingContent._normalizeAlternativesGrouped({});
    expect(result.groups).toEqual([]);
    expect(result.tips).toEqual([]);
  });

  test('preserves valid groups and tips from input', () => {
    const result = SmartEatingContent._normalizeAlternativesGrouped({
      groups: [{ original: 'Rice', alternatives: [] }],
      tips: ['Tip 1'],
    });
    expect(result.groups).toHaveLength(1);
    expect(result.tips).toHaveLength(1);
  });
});

describe('SmartEatingContent — fetchSnackingContent()', () => {
  test('returns EMPTY_SNACKING_CONTENT structure on network error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await SmartEatingContent.fetchSnackingContent();
    expect(result.success).toBe(false);
    expect(result.data.corePrinciples).toEqual([]);
    expect(result.data.snackIdeas).toEqual([]);
  });

  test('returns normalized content on API success', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { corePrinciples: ['Eat slowly'], managingCravings: [], whenToSnack: [], snackIdeas: [] },
      },
    });
    const result = await SmartEatingContent.fetchSnackingContent();
    expect(result.success).toBe(true);
    expect(result.data.corePrinciples).toEqual(['Eat slowly']);
  });
});

describe('SmartEatingContent — fetchFoodAlternativesGrouped()', () => {
  test('returns EMPTY_ALTERNATIVES_GROUPED on network error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await SmartEatingContent.fetchFoodAlternativesGrouped();
    expect(result.success).toBe(false);
    expect(result.data.groups).toEqual([]);
  });

  test('returns grouped alternatives on success', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { groups: [{ original: 'Rice', alternatives: [] }], tips: [] },
      },
    });
    const result = await SmartEatingContent.fetchFoodAlternativesGrouped();
    expect(result.success).toBe(true);
    expect(result.data.groups).toHaveLength(1);
  });
});


// =====================================================================
//  6. UserProfileType
// =====================================================================
import UserProfileType, { USER_PROFILE_TYPES } from '../entity/UserProfileType';

describe('UserProfileType — USER_PROFILE_TYPES constant', () => {
  test('contains exactly 3 profile types', () => {
    expect(Object.keys(USER_PROFILE_TYPES)).toHaveLength(3);
    expect(USER_PROFILE_TYPES.MEAL_PLANNER).toBe('MEAL_PLANNER');
    expect(USER_PROFILE_TYPES.ATHLETE).toBe('ATHLETE');
    expect(USER_PROFILE_TYPES.HEALTH_ORIENTED).toBe('HEALTH_ORIENTED');
  });

  test('is frozen and cannot be mutated', () => {
    expect(() => { USER_PROFILE_TYPES.NEW_TYPE = 'X'; }).toThrow();
  });
});

describe('UserProfileType — instance methods', () => {
  test('getFeatureList() returns the features array', () => {
    const pt = new UserProfileType({ features: ['Track macros', 'Set goals'] });
    expect(pt.getFeatureList()).toEqual(['Track macros', 'Set goals']);
  });

  test('isAvailable() returns true when profileTypeId is set', () => {
    expect(new UserProfileType({ profileTypeId: 1 }).isAvailable()).toBe(true);
  });

  test('isAvailable() returns false when profileTypeId is null', () => {
    expect(new UserProfileType({ profileTypeId: null }).isAvailable()).toBe(false);
  });

  test('toJSON() maps camelCase fields to snake_case', () => {
    const pt = new UserProfileType({ profileTypeId: 2, type: 'ATHLETE', displayName: 'Athlete' });
    const json = pt.toJSON();
    expect(json.profile_type_id).toBe(2);
    expect(json.display_name).toBe('Athlete');
    expect(json.type).toBe('ATHLETE');
  });
});

describe('UserProfileType — fromRow()', () => {
  test('maps snake_case DB row to UserProfileType and parses JSON features', () => {
    const row = {
      profile_type_id: 1,
      type: 'MEAL_PLANNER',
      display_name: 'Meal Planner',
      description: 'Plan your meals',
      features: '["Weekly planning","Grocery lists"]',
      image_url: null,
    };
    const pt = UserProfileType.fromRow(row);
    expect(pt).toBeInstanceOf(UserProfileType);
    expect(pt.type).toBe('MEAL_PLANNER');
    expect(pt.features).toEqual(['Weekly planning', 'Grocery lists']);
  });

  test('handles features as an array directly without JSON parsing', () => {
    const row = { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athlete', description: '', features: ['Track macros'], image_url: null };
    expect(UserProfileType.fromRow(row).features).toEqual(['Track macros']);
  });

  test('handles malformed features JSON string gracefully', () => {
    const row = { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athlete', description: '', features: '{bad json}', image_url: null };
    expect(UserProfileType.fromRow(row).features).toEqual([]);
  });

  test('returns null when row is null', () => {
    expect(UserProfileType.fromRow(null)).toBeNull();
  });
});

describe('UserProfileType — static collection methods', () => {
  const profiles = [
    new UserProfileType({ profileTypeId: 1, type: 'ATHLETE' }),
    new UserProfileType({ profileTypeId: null, type: 'MEAL_PLANNER' }),
    new UserProfileType({ profileTypeId: 3, type: 'HEALTH_ORIENTED' }),
  ];

  test('hasAvailableProfiles() returns true when at least one has a profileTypeId', () => {
    expect(UserProfileType.hasAvailableProfiles(profiles)).toBe(true);
  });

  test('hasAvailableProfiles() returns false when all profileTypeIds are null', () => {
    const inactive = [new UserProfileType({ profileTypeId: null })];
    expect(UserProfileType.hasAvailableProfiles(inactive)).toBe(false);
  });

  test('findByType() returns the matching profile', () => {
    expect(UserProfileType.findByType(profiles, 'ATHLETE')?.type).toBe('ATHLETE');
  });

  test('findByType() returns null when type is not found', () => {
    expect(UserProfileType.findByType(profiles, 'UNKNOWN')).toBeNull();
  });
});

describe('UserProfileType — computeProfileFromAnswers()', () => {
  test('returns ATHLETE when athlete answers dominate', () => {
    const answers = [
      { questionIndex: 2, answerIndex: 2 }, // A:1
      { questionIndex: 3, answerIndex: 0 }, // A:1
      { questionIndex: 4, answerIndex: 0 }, // A:1
    ];
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('ATHLETE');
  });

  test('returns MEAL_PLANNER when meal planner answers dominate', () => {
    const answers = [
      { questionIndex: 2, answerIndex: 0 }, // MP:1
      { questionIndex: 3, answerIndex: 2 }, // MP:1
      { questionIndex: 4, answerIndex: 2 }, // MP:1
      { questionIndex: 5, answerIndex: 2 }, // MP:1
    ];
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('MEAL_PLANNER');
  });

  test('returns HEALTH_ORIENTED as the default when all scores are tied at 0', () => {
    expect(UserProfileType.computeProfileFromAnswers([])).toBe('HEALTH_ORIENTED');
  });

  test('ignores out-of-range question/answer indices gracefully without throwing', () => {
    expect(() => UserProfileType.computeProfileFromAnswers([{ questionIndex: 99, answerIndex: 99 }])).not.toThrow();
  });
});

describe('UserProfileType — getProfileMeta()', () => {
  test('returns correct label and emoji for ATHLETE', () => {
    const meta = UserProfileType.getProfileMeta('ATHLETE');
    expect(meta.label).toBe('Athlete');
    expect(meta.emoji).toBe('🏋️');
  });

  test('returns correct label for HEALTH_ORIENTED', () => {
    expect(UserProfileType.getProfileMeta('HEALTH_ORIENTED').label).toBe('Health Oriented');
  });

  test('returns correct label for MEAL_PLANNER', () => {
    expect(UserProfileType.getProfileMeta('MEAL_PLANNER').label).toBe('Meal Planner');
  });

  test('falls back to HEALTH_ORIENTED metadata for unknown type', () => {
    expect(UserProfileType.getProfileMeta('UNKNOWN').label).toBe('Health Oriented');
  });
});

describe('UserProfileType — API methods', () => {
  test('getAll() maps rows and returns UserProfileType instances', async () => {
    axios.get.mockResolvedValue({
      data: [{ profile_type_id: 1, type: 'ATHLETE', display_name: 'Athlete', description: '', features: '[]', image_url: null }],
    });
    const result = await UserProfileType.getAll();
    expect(result[0]).toBeInstanceOf(UserProfileType);
  });

  test('getAll() returns empty array on network error', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    const result = await UserProfileType.getAll();
    expect(result).toEqual([]);
  });

  test('getById() returns null on error', async () => {
    axios.get.mockRejectedValue(new Error('Not found'));
    expect(await UserProfileType.getById(99)).toBeNull();
  });

  test('getByType() returns null on error', async () => {
    axios.get.mockRejectedValue(new Error('Not found'));
    expect(await UserProfileType.getByType('ATHLETE')).toBeNull();
  });
});


// =====================================================================
//  7. WeightEntry
// =====================================================================
import WeightEntry from '../entity/WeightEntry';

describe('WeightEntry — validateWeight()', () => {
  test('valid for a normal weight of 70kg', () => {
    expect(WeightEntry.validateWeight(70).valid).toBe(true);
  });

  test('invalid when weight is 0', () => {
    const r = WeightEntry.validateWeight(0);
    expect(r.valid).toBe(false);
    expect(r.field).toBe('weightKg');
  });

  test('invalid when weight is null', () => {
    expect(WeightEntry.validateWeight(null).valid).toBe(false);
  });

  test('invalid when weight is NaN string', () => {
    expect(WeightEntry.validateWeight('abc').valid).toBe(false);
  });

  test('invalid when below minimum of 10kg', () => {
    const r = WeightEntry.validateWeight(5);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/10/);
  });

  test('invalid when above maximum of 500kg', () => {
    expect(WeightEntry.validateWeight(501).valid).toBe(false);
  });

  test('valid at lower boundary of 10kg', () => {
    expect(WeightEntry.validateWeight(10).valid).toBe(true);
  });

  test('valid at upper boundary of 500kg', () => {
    expect(WeightEntry.validateWeight(500).valid).toBe(true);
  });
});

describe('WeightEntry — getLatest()', () => {
  test('returns the entry with the most recent loggedAt date', () => {
    const entries = [
      new WeightEntry({ weightKg: 70, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 68, loggedAt: '2024-06-15' }),
      new WeightEntry({ weightKg: 69, loggedAt: '2024-03-10' }),
    ];
    expect(WeightEntry.getLatest(entries).weightKg).toBe(68);
  });

  test('returns null for empty array', () => {
    expect(WeightEntry.getLatest([])).toBeNull();
  });

  test('returns null for null input', () => {
    expect(WeightEntry.getLatest(null)).toBeNull();
  });
});

describe('WeightEntry — getTotalChange()', () => {
  test('returns negative value when weight has decreased', () => {
    const entries = [
      new WeightEntry({ weightKg: 75, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 70, loggedAt: '2024-06-15' }),
    ];
    expect(WeightEntry.getTotalChange(entries)).toBe(-5);
  });

  test('returns positive value when weight has increased', () => {
    const entries = [
      new WeightEntry({ weightKg: 65, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 70, loggedAt: '2024-06-01' }),
    ];
    expect(WeightEntry.getTotalChange(entries)).toBe(5);
  });

  test('returns 0 when only one entry provided', () => {
    expect(WeightEntry.getTotalChange([new WeightEntry({ weightKg: 70, loggedAt: '2024-01-01' })])).toBe(0);
  });

  test('returns 0 for empty array', () => {
    expect(WeightEntry.getTotalChange([])).toBe(0);
  });

  test('rounds result to 1 decimal place', () => {
    const entries = [
      new WeightEntry({ weightKg: 70.15, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 68.05, loggedAt: '2024-06-01' }),
    ];
    expect(WeightEntry.getTotalChange(entries)).toBe(-2.1);
  });
});

describe('WeightEntry — calculateBMI()', () => {
  test('calculates BMI correctly for 70kg at 175cm (expected ~22.9)', () => {
    expect(WeightEntry.calculateBMI(70, 175)).toBe(22.9);
  });

  test('returns null when weight is 0', () => {
    expect(WeightEntry.calculateBMI(0, 175)).toBeNull();
  });

  test('returns null when height is 0', () => {
    expect(WeightEntry.calculateBMI(70, 0)).toBeNull();
  });

  test('returns null when weight is null', () => {
    expect(WeightEntry.calculateBMI(null, 175)).toBeNull();
  });

  test('calulateBMI() alias returns the same result as calculateBMI()', () => {
    expect(WeightEntry.calulateBMI(70, 175)).toBe(WeightEntry.calculateBMI(70, 175));
  });
});

describe('WeightEntry — getBMICategory()', () => {
  test('returns "Underweight" for BMI below 18.5', () => {
    expect(WeightEntry.getBMICategory(17)).toBe('Underweight');
  });

  test('returns "Normal weight" for BMI 18.5', () => {
    expect(WeightEntry.getBMICategory(18.5)).toBe('Normal weight');
  });

  test('returns "Normal weight" for BMI 22', () => {
    expect(WeightEntry.getBMICategory(22)).toBe('Normal weight');
  });

  test('returns "Overweight" for BMI 25', () => {
    expect(WeightEntry.getBMICategory(25)).toBe('Overweight');
  });

  test('returns "Overweight" for BMI 27', () => {
    expect(WeightEntry.getBMICategory(27)).toBe('Overweight');
  });

  test('returns "Obese" for BMI 30', () => {
    expect(WeightEntry.getBMICategory(30)).toBe('Obese');
  });

  test('returns "Obese" for BMI above 30', () => {
    expect(WeightEntry.getBMICategory(35)).toBe('Obese');
  });

  test('returns "-" for null BMI', () => {
    expect(WeightEntry.getBMICategory(null)).toBe('-');
  });

  test('returns "-" for undefined BMI', () => {
    expect(WeightEntry.getBMICategory(undefined)).toBe('-');
  });
});

describe('WeightEntry — create()', () => {
  test('returns validation error without calling API for invalid weight', async () => {
    const result = await WeightEntry.create(1, { weightKg: 0 });
    expect(result.success).toBe(false);
    expect(result.field).toBe('weightKg');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API with correct payload on valid weight', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Logged', data: { weightKg: 70, loggedAt: '2024-01-01' } } });
    const result = await WeightEntry.create(1, { weightKg: 70 });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.any(String), { userId: 1, weightKg: 70 });
  });
});

describe('WeightEntry — update()', () => {
  test('returns validation error without calling API for weight below minimum', async () => {
    const result = await WeightEntry.update('e1', { weightKg: 5 });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls PUT endpoint with correct payload on valid weight', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated', data: { weightKg: 72 } } });
    const result = await WeightEntry.update('e1', { weightKg: 72 });
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('e1'), { weightKg: 72 });
  });
});

describe('WeightEntry — delete()', () => {
  test('calls DELETE endpoint with the entryId in URL', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Entry removed.' } });
    const result = await WeightEntry.delete('e1');
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('e1'));
    expect(result.success).toBe(true);
  });

  test('returns success: false and error message on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await WeightEntry.delete('bad-id');
    expect(result.success).toBe(false);
  });
});
