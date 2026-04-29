/**
 * BiteWise — Entity Layer Unit Tests
 * =====================================================================
 * Coverage : Admin, BlogPost, CuratorApplication, DiaryEntry, DineOut,
 *            ExerciseEntry, FoodIntakeEntry, FoodItem, FreeUser,
 *            GroceryList, HealthGoal, HealthReport, HeightEntry,
 *            MealPlan, MembershipPlan, MembershipPlanFeature,
 *            NutritionTargets, PremiumUser, User, Recipe, RecipeDraft,
 *            Review, SmartEatingContent, UserProfileType, WeightEntry
 *
 * Run      : npx jest entity.test.js  (from project root)
 * Requires : jest  (already in Expo)
 *            jest.config.js  →  transform: { "^.+\\.[jt]sx?$": "babel-jest" }
 *
 * All axios calls are mocked — no live server needed.
 * =====================================================================
 */

// ─── Global axios mock ───────────────────────────────────────────────
jest.mock('axios');
import axios from 'axios';

// ─── Silence console.log / console.error noise from entity files ─────
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore();
  console.error.mockRestore();
});

// Reset mocks between tests so calls don't bleed across tests
afterEach(() => jest.clearAllMocks());


// =====================================================================
//  HELPERS
// =====================================================================
const mockSuccess = (data) =>
  Promise.resolve({ data: { success: true, data, message: 'OK' } });

const mockError = (message = 'Server error', status = 500) =>
  Promise.reject({ response: { status, data: { success: false, message } } });


// =====================================================================
//  1. MembershipPlan
// =====================================================================
import MembershipPlan from '../entity/MembershipPlan';

describe('MembershipPlan — instance methods', () => {
  test('getFormattedPrice() returns "$0" for free plan', () => {
    const plan = new MembershipPlan({ price: 0 });
    expect(plan.getFormattedPrice()).toBe('$0');
  });

  test('getFormattedPrice() returns formatted price with billing cycle', () => {
    const plan = new MembershipPlan({ price: 19.99, billingCycle: 'monthly' });
    expect(plan.getFormattedPrice()).toBe('$19.99 /monthly');
  });

  test('getFormattedPrice() omits cycle when billingCycle is empty', () => {
    const plan = new MembershipPlan({ price: 9.99, billingCycle: '' });
    expect(plan.getFormattedPrice()).toBe('$9.99');
  });

  test('isAvailable() returns true when isActive is true', () => {
    expect(new MembershipPlan({ isActive: true }).isAvailable()).toBe(true);
  });

  test('isAvailable() returns false when isActive is false', () => {
    expect(new MembershipPlan({ isActive: false }).isAvailable()).toBe(false);
  });

  test('isFree() returns true when price is 0', () => {
    expect(new MembershipPlan({ price: 0 }).isFree()).toBe(true);
  });

  test('isFree() returns false when price > 0', () => {
    expect(new MembershipPlan({ price: 19.99 }).isFree()).toBe(false);
  });

  test('isMostPopular() returns true when isPopular is true', () => {
    expect(new MembershipPlan({ isPopular: true }).isMostPopular()).toBe(true);
  });

  test('getFeatureList() returns features array', () => {
    const features = ['Calorie tracking', 'Barcode scanning'];
    expect(new MembershipPlan({ features }).getFeatureList()).toEqual(features);
  });

  test('toJSON() maps camelCase fields to snake_case', () => {
    const plan = new MembershipPlan({ planId: 1, name: 'Free', price: 0, isActive: true });
    const json = plan.toJSON();
    expect(json.plan_id).toBe(1);
    expect(json.name).toBe('Free');
    expect(json.is_active).toBe(true);
  });
});

describe('MembershipPlan — static methods', () => {
  const plans = [
    new MembershipPlan({ planId: 1, price: 0,     isActive: true  }),
    new MembershipPlan({ planId: 2, price: 19.99, isActive: true  }),
    new MembershipPlan({ planId: 3, price: 9.99,  isActive: false }),
  ];

  test('getActivePlans() filters inactive and sorts by price asc', () => {
    const active = MembershipPlan.getActivePlans(plans);
    expect(active).toHaveLength(2);
    expect(active[0].price).toBe(0);
    expect(active[1].price).toBe(19.99);
  });

  test('hasAvailablePlans() returns true if any plan is active', () => {
    expect(MembershipPlan.hasAvailablePlans(plans)).toBe(true);
  });

  test('hasAvailablePlans() returns false when all inactive', () => {
    const inactive = [new MembershipPlan({ isActive: false })];
    expect(MembershipPlan.hasAvailablePlans(inactive)).toBe(false);
  });

  test('findById() returns correct plan', () => {
    const found = MembershipPlan.findById(plans, 2);
    expect(found?.price).toBe(19.99);
  });

  test('findById() returns null when not found', () => {
    expect(MembershipPlan.findById(plans, 99)).toBeNull();
  });

  test('fromRow() parses JSON feature strings', () => {
    const row = {
      plan_id: 1, name: 'Free', price: '0', billing_cycle: '',
      description: '', is_popular: 0, is_active: 1,
      features: '["Calorie tracking"]',
      feature_ids: '[1,2]',
    };
    const plan = MembershipPlan.fromRow(row);
    expect(plan.features).toEqual(['Calorie tracking']);
    expect(plan.featureIds).toEqual([1, 2]);
    expect(plan.isActive).toBe(true);
    expect(plan.price).toBe(0);
  });

  test('fromRow() returns null when row is null', () => {
    expect(MembershipPlan.fromRow(null)).toBeNull();
  });

  test('fromRow() handles malformed features JSON gracefully', () => {
    const row = { plan_id: 1, name: 'X', price: '0', features: '{bad json}', feature_ids: '' };
    const plan = MembershipPlan.fromRow(row);
    expect(plan.features).toEqual([]);
    expect(plan.featureIds).toEqual([]);
  });
});

describe('MembershipPlan — API methods', () => {
  test('getAll() maps rows via fromRow()', async () => {
    axios.get.mockResolvedValue({
      data: [{ plan_id: 1, name: 'Free', price: '0', features: '[]', feature_ids: '[]', is_popular: 0, is_active: 1 }],
    });
    const plans = await MembershipPlan.getAll();
    expect(plans).toHaveLength(1);
    expect(plans[0]).toBeInstanceOf(MembershipPlan);
  });

  test('getById() returns a MembershipPlan instance', async () => {
    axios.get.mockResolvedValue({
      data: { plan_id: 2, name: 'Premium', price: '19.99', features: '[]', feature_ids: '[]', is_popular: 1, is_active: 1 },
    });
    const plan = await MembershipPlan.getById(2);
    expect(plan).toBeInstanceOf(MembershipPlan);
    expect(plan.name).toBe('Premium');
  });
});


// =====================================================================
//  2. MembershipPlanFeature
// =====================================================================
import MembershipPlanFeature from '../entity/MembershipPlanFeature';

describe('MembershipPlanFeature — constructor', () => {
  test('constructs with defaults', () => {
    const f = new MembershipPlanFeature();
    expect(f.featureId).toBeNull();
    expect(f.isHighlighted).toBe(false);
  });

  test('stores provided values', () => {
    const f = new MembershipPlanFeature({ featureId: 5, planId: 2, featureName: 'Barcode scanning', isHighlighted: true });
    expect(f.featureId).toBe(5);
    expect(f.featureName).toBe('Barcode scanning');
    expect(f.isHighlighted).toBe(true);
  });
});


// =====================================================================
//  3. BlogPost
// =====================================================================
import BlogPost from '../entity/BlogPost';

describe('BlogPost — instance methods', () => {
  test('isDraft() returns true for DRAFT status', () => {
    expect(new BlogPost({ status: 'DRAFT' }).isDraft()).toBe(true);
  });

  test('isPublished() returns true for PUBLISHED status', () => {
    expect(new BlogPost({ status: 'PUBLISHED' }).isPublished()).toBe(true);
  });

  test('getReadTime() returns "1 min read" for short content', () => {
    expect(new BlogPost({ content: 'Short post.' }).getReadTime()).toBe('1 min read');
  });

  test('getReadTime() calculates correctly for longer content', () => {
    const words = Array(400).fill('word').join(' ');
    expect(new BlogPost({ content: words }).getReadTime()).toBe('2 min read');
  });

  test('getReadTime() handles null content', () => {
    expect(new BlogPost({ content: null }).getReadTime()).toBe('1 min read');
  });
});

describe('BlogPost — validatePost()', () => {
  test('returns invalid when title is empty', () => {
    const result = BlogPost.validatePost({ title: '', content: 'Some long content here for the test.' });
    expect(result.valid).toBe(false);
    expect(result.field).toBe('title');
  });

  test('returns invalid when title is whitespace only', () => {
    const result = BlogPost.validatePost({ title: '   ', content: 'Content that is long enough.' });
    expect(result.valid).toBe(false);
    expect(result.field).toBe('title');
  });

  test('returns invalid when content is fewer than 20 characters', () => {
    const result = BlogPost.validatePost({ title: 'My Post', content: 'Too short.' });
    expect(result.valid).toBe(false);
    expect(result.field).toBe('content');
  });

  test('returns valid when title and content meet requirements', () => {
    const result = BlogPost.validatePost({ title: 'My Post', content: 'This is a valid blog post with enough content.' });
    expect(result.valid).toBe(true);
  });
});

describe('BlogPost — fromApi()', () => {
  test('maps raw API response to BlogPost instance', () => {
    const raw = { blogPostId: '123', curatorUserId: 5, title: 'Hello', content: 'World', status: 'published', tags: ['health'], likeCount: 10 };
    const post = BlogPost.fromApi(raw);
    expect(post).toBeInstanceOf(BlogPost);
    expect(post.status).toBe('PUBLISHED');   // uppercased
    expect(post.likeCount).toBe(10);
    expect(post.tags).toEqual(['health']);
  });

  test('defaults tags to [] when missing', () => {
    const post = BlogPost.fromApi({ title: 'T', content: 'C' });
    expect(Array.isArray(post.tags)).toBe(true);
  });
});

describe('BlogPost — sortByDate()', () => {
  test('sorts posts newest-first', () => {
    const posts = [
      new BlogPost({ createdAt: '2024-01-01' }),
      new BlogPost({ createdAt: '2024-03-15' }),
      new BlogPost({ createdAt: '2024-02-10' }),
    ];
    const sorted = BlogPost.sortByDate(posts);
    expect(sorted[0].createdAt).toBe('2024-03-15');
    expect(sorted[2].createdAt).toBe('2024-01-01');
  });
});

describe('BlogPost — API methods', () => {
  test('create() returns validation error without calling API when title is empty', async () => {
    const result = await BlogPost.create(1, 'User', { title: '', content: 'Content', tags: [], bannerImageUrl: '' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('create() calls axios.post with correct payload when valid', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Saved!', data: { blogPostId: '1', title: 'My Post', content: 'Valid content here enough chars', status: 'DRAFT', tags: [] } } });
    const result = await BlogPost.create(1, 'Alice', { title: 'My Post', content: 'Valid content here enough chars', tags: [], bannerImageUrl: '' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('fetchAllPublished() returns empty array on network error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Network error' } } });
    const result = await BlogPost.fetchAllPublished();
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });

  test('fetchByUser() maps data array to BlogPost instances', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: [{ blogPostId: '1', title: 'T', content: 'C', status: 'DRAFT', tags: [] }] } });
    const result = await BlogPost.fetchByUser(1);
    expect(result.data[0]).toBeInstanceOf(BlogPost);
  });
});


// =====================================================================
//  4. CuratorApplication
// =====================================================================
import CuratorApplication from '../entity/CuratorApplication';

describe('CuratorApplication — validateApplication()', () => {
  test('returns valid when all required fields provided', () => {
    const result = CuratorApplication.validateApplication({ motivation: 'I love health', journey: 'Been eating clean for 3 years', expertise: 'Nutrition' });
    expect(result.valid).toBe(true);
    expect(Object.keys(result.errors)).toHaveLength(0);
  });

  test('returns error for each missing field', () => {
    const result = CuratorApplication.validateApplication({ motivation: '', journey: '', expertise: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.motivation).toBeDefined();
    expect(result.errors.journey).toBeDefined();
    expect(result.errors.expertise).toBeDefined();
  });

  test('returns error for missing expertise only', () => {
    const result = CuratorApplication.validateApplication({ motivation: 'Motivation text', journey: 'My journey', expertise: '' });
    expect(result.valid).toBe(false);
    expect(result.errors.expertise).toBeDefined();
    expect(result.errors.motivation).toBeUndefined();
  });
});

describe('CuratorApplication — create()', () => {
  test('returns validation error without calling API when fields are empty', async () => {
    const result = await CuratorApplication.create(1, 'user', { motivation: '', journey: '', expertise: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls axios.post when validation passes', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Submitted!' } });
    const result = await CuratorApplication.create(1, 'user', { motivation: 'Motivated', journey: 'Journey text', expertise: 'Nutrition', social: '' });
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  test('handles axios error gracefully', async () => {
    axios.post.mockRejectedValue({ response: { data: { message: 'Already applied' } } });
    const result = await CuratorApplication.create(1, 'user', { motivation: 'M', journey: 'J', expertise: 'E' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Already applied');
  });
});

describe('CuratorApplication — approve() / reject()', () => {
  test('approve() calls PUT endpoint', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await CuratorApplication.approve('app-1', 'admin-1');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('app-1/approve'), { adminId: 'admin-1' });
  });

  test('reject() calls PUT endpoint with reason', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await CuratorApplication.reject('app-1', 'admin-1', 'Not enough detail');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('app-1/reject'), { adminId: 'admin-1', reason: 'Not enough detail' });
  });
});


// =====================================================================
//  5. DiaryEntry
// =====================================================================
import DiaryEntry from '../entity/DiaryEntry';

describe('DiaryEntry — validateEntry()', () => {
  test('valid when title and content provided', () => {
    expect(DiaryEntry.validateEntry({ title: 'Day 1', content: 'Felt great today' }).valid).toBe(true);
  });

  test('invalid when title is missing', () => {
    const r = DiaryEntry.validateEntry({ title: '', content: 'Some content' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when content is missing', () => {
    const r = DiaryEntry.validateEntry({ title: 'Title', content: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('content');
  });
});

describe('DiaryEntry — sortByDate()', () => {
  test('sorts entries newest-first', () => {
    const entries = [
      new DiaryEntry({ createdAt: '2024-01-01' }),
      new DiaryEntry({ createdAt: '2024-06-15' }),
    ];
    const sorted = DiaryEntry.sortByDate(entries);
    expect(sorted[0].createdAt).toBe('2024-06-15');
  });
});

describe('DiaryEntry — hasEntries()', () => {
  test('returns true for non-empty array', () => {
    expect(DiaryEntry.hasEntries([new DiaryEntry()])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(DiaryEntry.hasEntries([])).toBe(false);
  });

  test('returns false for non-array', () => {
    expect(DiaryEntry.hasEntries(null)).toBe(false);
  });
});

describe('DiaryEntry — fromApi()', () => {
  test('maps raw object to DiaryEntry', () => {
    const raw = { _id: { toString: () => 'abc' }, userId: '5', title: 'T', content: 'C', mood: 'Happy', weight: 70 };
    const entry = DiaryEntry.fromApi(raw);
    expect(entry).toBeInstanceOf(DiaryEntry);
    expect(entry.userId).toBe(5);
    expect(entry.mood).toBe('Happy');
  });
});

describe('DiaryEntry — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await DiaryEntry.create(1, { title: '', content: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls axios.post on valid entry', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Created!', data: { _id: '1', title: 'T', content: 'C' } } });
    const result = await DiaryEntry.create(1, { title: 'Day 1', content: 'Felt great', mood: 'Happy', weight: 70 });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});


// =====================================================================
//  6. DineOut
// =====================================================================
import DineOut from '../entity/DineOut';

describe('DineOut — constructor', () => {
  test('sets restaurantId from _id when restaurantId not provided', () => {
    const r = new DineOut({ _id: 'mongo-id-1' });
    expect(r.restaurantId).toBe('mongo-id-1');
  });

  test('defaults menuItems and matchingItems to []', () => {
    const r = new DineOut();
    expect(r.menuItems).toEqual([]);
    expect(r.matchingItems).toEqual([]);
  });

  test('casts rating to Number', () => {
    const r = new DineOut({ rating: '4.5' });
    expect(r.rating).toBe(4.5);
  });
});

describe('DineOut — filterByCuisine()', () => {
  const restaurants = [
    new DineOut({ name: 'A', cuisine: 'Japanese' }),
    new DineOut({ name: 'B', cuisine: 'Italian' }),
    new DineOut({ name: 'C', cuisine: 'Japanese' }),
  ];

  test('returns all when cuisine is "All"', () => {
    expect(DineOut.filterByCuisine(restaurants, 'All')).toHaveLength(3);
  });

  test('filters by cuisine correctly', () => {
    const japanese = DineOut.filterByCuisine(restaurants, 'Japanese');
    expect(japanese).toHaveLength(2);
    expect(japanese.every(r => r.cuisine === 'Japanese')).toBe(true);
  });

  test('returns all when cuisine is null', () => {
    expect(DineOut.filterByCuisine(restaurants, null)).toHaveLength(3);
  });
});

describe('DineOut — search()', () => {
  const restaurants = [
    new DineOut({ name: 'Sakura Sushi', cuisine: 'Japanese', menuItems: [] }),
    new DineOut({ name: 'Pasta Palace', cuisine: 'Italian',  menuItems: [] }),
  ];

  test('matches by restaurant name (case-insensitive)', () => {
    expect(DineOut.search(restaurants, 'sakura')).toHaveLength(1);
  });

  test('matches by cuisine', () => {
    expect(DineOut.search(restaurants, 'italian')).toHaveLength(1);
  });

  test('returns all when query is empty', () => {
    expect(DineOut.search(restaurants, '')).toHaveLength(2);
  });

  test('returns [] when no match', () => {
    expect(DineOut.search(restaurants, 'zzzzz')).toHaveLength(0);
  });
});

describe('DineOut — fetchAll()', () => {
  test('returns success with DineOut instances', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: [{ _id: '1', name: 'Resto', cuisine: 'Thai', rating: 4 }] } });
    const result = await DineOut.fetchAll();
    expect(result.success).toBe(true);
    expect(result.data[0]).toBeInstanceOf(DineOut);
  });

  test('returns empty array on error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await DineOut.fetchAll();
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });
});


// =====================================================================
//  7. ExerciseEntry
// =====================================================================
import ExerciseEntry, { EXERCISE_TYPES } from '../entity/ExerciseEntry';

describe('ExerciseEntry — validateEntry()', () => {
  test('valid with correct type and duration', () => {
    expect(ExerciseEntry.validateEntry({ exerciseType: 'Running', durationMins: 30 }).valid).toBe(true);
  });

  test('invalid when exerciseType is empty', () => {
    const r = ExerciseEntry.validateEntry({ exerciseType: '', durationMins: 30 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('exerciseType');
  });

  test('invalid when durationMins is 0', () => {
    const r = ExerciseEntry.validateEntry({ exerciseType: 'Running', durationMins: 0 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('durationMins');
  });

  test('invalid when durationMins exceeds 600', () => {
    const r = ExerciseEntry.validateEntry({ exerciseType: 'Running', durationMins: 601 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('durationMins');
    expect(r.message).toMatch(/600/);
  });

  test('invalid when durationMins is NaN', () => {
    const r = ExerciseEntry.validateEntry({ exerciseType: 'Yoga', durationMins: 'abc' });
    expect(r.valid).toBe(false);
  });
});

describe('ExerciseEntry — calculateCaloriesBurned()', () => {
  test('calculates correctly for Running (10 cal/min)', () => {
    expect(ExerciseEntry.calculateCaloriesBurned('Running', 30)).toBe(300);
  });

  test('calculates correctly for HIIT (12 cal/min)', () => {
    expect(ExerciseEntry.calculateCaloriesBurned('HIIT', 45)).toBe(540);
  });

  test('uses default 5 cal/min for unknown exercise type', () => {
    expect(ExerciseEntry.calculateCaloriesBurned('Other', 20)).toBe(100);
  });

  test('rounds result to nearest integer', () => {
    // Yoga = 3 cal/min, 10 min = 30 (exact)
    expect(ExerciseEntry.calculateCaloriesBurned('Yoga', 10)).toBe(30);
  });
});

describe('ExerciseEntry — getTotalCaloriesBurned()', () => {
  test('sums caloriesBurned across entries', () => {
    const entries = [
      new ExerciseEntry({ caloriesBurned: 200 }),
      new ExerciseEntry({ caloriesBurned: 150 }),
      new ExerciseEntry({ caloriesBurned: 80 }),
    ];
    expect(ExerciseEntry.getTotalCaloriesBurned(entries)).toBe(430);
  });

  test('returns 0 for empty array', () => {
    expect(ExerciseEntry.getTotalCaloriesBurned([])).toBe(0);
  });
});

describe('ExerciseEntry — EXERCISE_TYPES constant', () => {
  test('contains at least 7 exercise types', () => {
    expect(EXERCISE_TYPES.length).toBeGreaterThanOrEqual(7);
  });

  test('each type has value, label, and calPerMin', () => {
    EXERCISE_TYPES.forEach(t => {
      expect(t).toHaveProperty('value');
      expect(t).toHaveProperty('label');
      expect(t).toHaveProperty('calPerMin');
    });
  });
});

describe('ExerciseEntry — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await ExerciseEntry.create(1, { exerciseType: '', durationMins: 0 });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid input', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Logged!' } });
    const result = await ExerciseEntry.create(1, { exerciseType: 'Running', durationMins: 30, notes: '' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});


// =====================================================================
//  8. FoodIntakeEntry
// =====================================================================
import FoodIntakeEntry from '../entity/FoodIntakeEntry';

describe('FoodIntakeEntry — validateManualEntry()', () => {
  const valid = { foodName: 'Chicken Rice', calories: 500, protein: 30, carbs: 60, fat: 10, meal: 'Lunch' };

  test('valid when all fields correct', () => {
    expect(FoodIntakeEntry.validateManualEntry(valid).valid).toBe(true);
  });

  test('invalid when foodName is empty', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, foodName: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('foodName');
  });

  test('invalid when calories is 0', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, calories: 0 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('calories');
  });

  test('invalid when calories is negative', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, calories: -100 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('calories');
  });

  test('invalid when protein is negative', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, protein: -1 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('protein');
  });

  test('invalid when carbs is negative', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, carbs: -5 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('carbs');
  });

  test('invalid when fat is negative', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, fat: -2 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('fat');
  });

  test('invalid when meal is empty', () => {
    const r = FoodIntakeEntry.validateManualEntry({ ...valid, meal: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('meal');
  });
});

describe('FoodIntakeEntry — getTodaySummary()', () => {
  test('correctly sums all macros', () => {
    const entries = [
      new FoodIntakeEntry({ calories: 400, protein: 30, carbs: 50, fat: 10 }),
      new FoodIntakeEntry({ calories: 600, protein: 40, carbs: 70, fat: 15 }),
    ];
    const summary = FoodIntakeEntry.getTodaySummary(entries);
    expect(summary.calories).toBe(1000);
    expect(summary.protein).toBe(70);
    expect(summary.carbs).toBe(120);
    expect(summary.fat).toBe(25);
  });

  test('returns zeros for empty array', () => {
    const summary = FoodIntakeEntry.getTodaySummary([]);
    expect(summary).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('FoodIntakeEntry — createManual()', () => {
  test('returns validation error without calling API', async () => {
    const result = await FoodIntakeEntry.createManual(1, { foodName: '', calories: 0, protein: 0, carbs: 0, fat: 0, meal: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API when valid', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    await FoodIntakeEntry.createManual(1, { foodName: 'Rice', calories: 300, protein: 5, carbs: 60, fat: 2, meal: 'Lunch' });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});


// =====================================================================
//  9. FoodItem
// =====================================================================
import FoodItem from '../entity/FoodItem';

describe('FoodItem — getDisplayMeta()', () => {
  test('appends "g" when serving is a plain number string', () => {
    const item = new FoodItem({ calories: 200, serving: '100' });
    expect(item.getDisplayMeta()).toBe('200 kcal • 100g');
  });

  test('does not append "g" when serving already has a unit', () => {
    const item = new FoodItem({ calories: 150, serving: '1 cup' });
    expect(item.getDisplayMeta()).toBe('150 kcal • 1 cup');
  });

  test('handles empty serving gracefully', () => {
    const item = new FoodItem({ calories: 100, serving: '' });
    expect(item.getDisplayMeta()).toBe('100 kcal • ');
  });
});

describe('FoodItem — filterBySearch()', () => {
  const items = [
    new FoodItem({ name: 'Brown Rice' }),
    new FoodItem({ name: 'White Rice' }),
    new FoodItem({ name: 'Chicken Breast' }),
  ];

  test('filters case-insensitively', () => {
    expect(FoodItem.filterBySearch(items, 'rice')).toHaveLength(2);
  });

  test('returns all items when query is empty', () => {
    expect(FoodItem.filterBySearch(items, '')).toHaveLength(3);
  });

  test('returns empty array when no match', () => {
    expect(FoodItem.filterBySearch(items, 'salmon')).toHaveLength(0);
  });
});

describe('FoodItem — hasItems()', () => {
  test('returns true for non-empty array', () => {
    expect(FoodItem.hasItems([new FoodItem()])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(FoodItem.hasItems([])).toBe(false);
  });

  test('returns false for non-array', () => {
    expect(FoodItem.hasItems(null)).toBe(false);
  });
});

describe('FoodItem — logFoodItem()', () => {
  test('returns error when required params are missing', async () => {
    const result = await FoodItem.logFoodItem(null, 1, 1, 'Lunch');
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('scales macros by quantity and calls API', async () => {
    axios.post.mockResolvedValue({ data: { success: true, data: {}, message: 'Logged' } });
    const item = new FoodItem({ name: 'Rice', calories: 100, protein: 5, carbs: 20, fat: 1 });
    const result = await FoodItem.logFoodItem(item, 2, 1, 'Lunch');
    expect(result.success).toBe(true);
    const payload = axios.post.mock.calls[0][1];
    expect(payload.calories).toBe(200);
    expect(payload.protein).toBe(10);
  });
});


// =====================================================================
//  10. FreeUser & PremiumUser
// =====================================================================
// Note: User.js is not uploaded yet, so we test the role assignment
// that FreeUser and PremiumUser add on top of User.
import FreeUser from '../entity/FreeUser';
import PremiumUser from '../entity/PremiumUser';

describe('FreeUser', () => {
  test('sets role to FREE', () => {
    const user = new FreeUser({ userId: 1, username: 'alice' });
    expect(user.role).toBe('FREE');
  });
});

describe('PremiumUser', () => {
  test('sets role to PREMIUM', () => {
    const user = new PremiumUser({ userId: 2, username: 'bob' });
    expect(user.role).toBe('PREMIUM');
  });

  test('defaults isCurator to false', () => {
    const user = new PremiumUser({});
    expect(user.isCurator).toBe(false);
  });

  test('stores isCurator = true when provided', () => {
    const user = new PremiumUser({ isCurator: true, curatorApplicationId: 'app-99' });
    expect(user.isCurator).toBe(true);
    expect(user.curatorApplicationId).toBe('app-99');
  });

  test('PremiumUser is a different role from FreeUser', () => {
    expect(new PremiumUser({}).role).not.toBe(new FreeUser({}).role);
  });
});


// =====================================================================
//  11. GroceryList
// =====================================================================
import GroceryList from '../entity/GroceryList';

describe('GroceryList — instance methods', () => {
  test('getCheckedCount() returns count of checked items', () => {
    const list = new GroceryList({ items: [{ checked: true }, { checked: false }, { checked: true }] });
    expect(list.getCheckedCount()).toBe(2);
  });

  test('getPendingItems() returns unchecked items', () => {
    const list = new GroceryList({ items: [{ name: 'Milk', checked: true }, { name: 'Eggs', checked: false }] });
    expect(list.getPendingItems()).toHaveLength(1);
    expect(list.getPendingItems()[0].name).toBe('Eggs');
  });

  test('getCheckedCount() returns 0 when no items', () => {
    expect(new GroceryList({ items: [] }).getCheckedCount()).toBe(0);
  });
});

describe('GroceryList — validateItem()', () => {
  test('valid when name is provided', () => {
    expect(GroceryList.validateItem({ name: 'Apples' }).valid).toBe(true);
  });

  test('invalid when name is empty', () => {
    const r = GroceryList.validateItem({ name: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('name');
  });

  test('invalid when name is whitespace only', () => {
    const r = GroceryList.validateItem({ name: '   ' });
    expect(r.valid).toBe(false);
  });
});

describe('GroceryList — fromApi()', () => {
  test('maps raw object to GroceryList', () => {
    const raw = { listId: '1', userId: 5, items: [{ name: 'Milk', checked: false }] };
    const list = GroceryList.fromApi(raw);
    expect(list).toBeInstanceOf(GroceryList);
    expect(list.items).toHaveLength(1);
  });

  test('defaults items to [] when missing', () => {
    const list = GroceryList.fromApi({});
    expect(list.items).toEqual([]);
  });
});

describe('GroceryList — addItem()', () => {
  test('returns validation error without calling API when name is empty', async () => {
    const result = await GroceryList.addItem(1, { name: '', quantity: 1, unit: 'pcs' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid item', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Added', data: { listId: '1', items: [] } } });
    const result = await GroceryList.addItem(1, { name: 'Eggs', quantity: 12, unit: 'pcs' });
    expect(result.success).toBe(true);
  });
});


// =====================================================================
//  12. HealthGoal
// =====================================================================
import HealthGoal, { GOAL_TYPES, ACTIVITY_LEVELS } from '../entity/HealthGoal';

describe('HealthGoal — GOAL_TYPES constant', () => {
  test('contains LOSE_WEIGHT, GAIN_MUSCLE, MAINTAIN_WEIGHT, IMPROVE_FITNESS, EAT_HEALTHIER, CUSTOM', () => {
    expect(Object.keys(GOAL_TYPES)).toHaveLength(6);
    expect(GOAL_TYPES.LOSE_WEIGHT).toBe('Lose Weight');
    expect(GOAL_TYPES.CUSTOM).toBe('Custom');
  });
});

describe('HealthGoal — getDisplayGoal()', () => {
  test('returns goalType when not CUSTOM', () => {
    const goal = new HealthGoal({ goalType: 'Lose Weight', customGoal: '' });
    expect(goal.getDisplayGoal()).toBe('Lose Weight');
  });

  test('returns customGoal when goalType is CUSTOM', () => {
    const goal = new HealthGoal({ goalType: 'Custom', customGoal: 'Run a marathon' });
    expect(goal.getDisplayGoal()).toBe('Run a marathon');
  });
});

describe('HealthGoal — validateGoal()', () => {
  test('valid with all fields provided', () => {
    const r = HealthGoal.validateGoal({ goalType: 'Lose Weight', customGoal: '', activityLevel: 'Moderate' });
    expect(r.valid).toBe(true);
  });

  test('invalid when goalType is empty', () => {
    const r = HealthGoal.validateGoal({ goalType: '', customGoal: '', activityLevel: 'Moderate' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('goalType');
  });

  test('invalid when CUSTOM goalType but customGoal is empty', () => {
    const r = HealthGoal.validateGoal({ goalType: 'Custom', customGoal: '', activityLevel: 'Moderate' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('customGoal');
  });

  test('invalid when activityLevel is empty', () => {
    const r = HealthGoal.validateGoal({ goalType: 'Lose Weight', customGoal: '', activityLevel: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('activityLevel');
  });

  test('valid when CUSTOM goalType and customGoal is provided', () => {
    const r = HealthGoal.validateGoal({ goalType: 'Custom', customGoal: 'Run daily', activityLevel: 'Active' });
    expect(r.valid).toBe(true);
  });
});

describe('HealthGoal — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await HealthGoal.create(1, { goalType: '', customGoal: '', activityLevel: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid fields', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    await HealthGoal.create(1, { goalType: 'Lose Weight', customGoal: '', activityLevel: 'Moderate' });
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});


// =====================================================================
//  13. HealthReport
// =====================================================================
import HealthReport from '../entity/HealthReport';

describe('HealthReport — getGoalProgress()', () => {
  test('returns correct percentage', () => {
    const report = new HealthReport({ totalCalories: 1800, calorieGoal: 2000 });
    expect(report.getGoalProgress()).toBe(90);
  });

  test('caps at 100 when over goal', () => {
    const report = new HealthReport({ totalCalories: 2500, calorieGoal: 2000 });
    expect(report.getGoalProgress()).toBe(100);
  });

  test('returns 0 when calorieGoal is 0', () => {
    const report = new HealthReport({ totalCalories: 500, calorieGoal: 0 });
    expect(report.getGoalProgress()).toBe(0);
  });
});

describe('HealthReport — getNetCalories()', () => {
  test('subtracts caloriesBurned from totalCalories', () => {
    const report = new HealthReport({ totalCalories: 2000, caloriesBurned: 300 });
    expect(report.getNetCalories()).toBe(1700);
  });

  test('returns 0 when burned exceeds consumed', () => {
    const report = new HealthReport({ totalCalories: 200, caloriesBurned: 500 });
    expect(report.getNetCalories()).toBe(0);
  });
});

describe('HealthReport — generateInsights()', () => {
  test('gives positive message when calories are 90–110% of goal', () => {
    const report = new HealthReport({ totalCalories: 1950, calorieGoal: 2000, totalProtein: 100, exerciseCount: 0 });
    const insights = HealthReport.generateInsights(report);
    expect(insights.some(i => i.includes('Great job'))).toBe(true);
  });

  test('warns when over 110% of calorie goal', () => {
    const report = new HealthReport({ totalCalories: 2300, calorieGoal: 2000, totalProtein: 50, exerciseCount: 0 });
    const insights = HealthReport.generateInsights(report);
    expect(insights.some(i => i.includes('went over'))).toBe(true);
  });

  test('warns when under 50% of calorie goal', () => {
    const report = new HealthReport({ totalCalories: 800, calorieGoal: 2000, totalProtein: 50, exerciseCount: 0 });
    const insights = HealthReport.generateInsights(report);
    expect(insights.some(i => i.includes('fewer calories'))).toBe(true);
  });

  test('mentions exercise sessions when exerciseCount > 0', () => {
    const report = new HealthReport({ totalCalories: 1950, calorieGoal: 2000, totalProtein: 100, exerciseCount: 2 });
    const insights = HealthReport.generateInsights(report);
    expect(insights.some(i => i.includes('2 exercise session'))).toBe(true);
  });

  test('suggests logging when no data (fallback insight)', () => {
    const report = new HealthReport({ totalCalories: 0, calorieGoal: 0, totalProtein: 0, exerciseCount: 0 });
    const insights = HealthReport.generateInsights(report);
    expect(insights.some(i => i.includes('Start logging'))).toBe(true);
  });

  test('suggests more protein when protein is below 15% of calories', () => {
    const report = new HealthReport({ totalCalories: 2000, calorieGoal: 2000, totalProtein: 10, exerciseCount: 0 });
    const insights = HealthReport.generateInsights(report);
    expect(insights.some(i => i.includes('protein'))).toBe(true);
  });
});


// =====================================================================
//  14. HeightEntry
// =====================================================================
import HeightEntry from '../entity/HeightEntry';

describe('HeightEntry — validateHeight()', () => {
  test('valid for a normal height', () => {
    expect(HeightEntry.validateHeight(170).valid).toBe(true);
  });

  test('invalid when height is 0', () => {
    const r = HeightEntry.validateHeight(0);
    expect(r.valid).toBe(false);
    expect(r.field).toBe('heightCm');
  });

  test('invalid when height is below 50cm', () => {
    const r = HeightEntry.validateHeight(30);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/50/);
  });

  test('invalid when height exceeds 300cm', () => {
    const r = HeightEntry.validateHeight(350);
    expect(r.valid).toBe(false);
  });

  test('invalid when height is NaN', () => {
    const r = HeightEntry.validateHeight('abc');
    expect(r.valid).toBe(false);
  });
});

describe('HeightEntry — getLatest()', () => {
  test('returns the most recent entry', () => {
    const entries = [
      new HeightEntry({ heightCm: 165, loggedAt: '2024-01-01' }),
      new HeightEntry({ heightCm: 166, loggedAt: '2024-06-15' }),
      new HeightEntry({ heightCm: 164, loggedAt: '2023-12-01' }),
    ];
    const latest = HeightEntry.getLatest(entries);
    expect(latest.heightCm).toBe(166);
  });

  test('returns null for empty array', () => {
    expect(HeightEntry.getLatest([])).toBeNull();
  });

  test('returns null for null input', () => {
    expect(HeightEntry.getLatest(null)).toBeNull();
  });
});

describe('HeightEntry — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await HeightEntry.create(1, { heightCm: 0 });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid height', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Logged', data: { heightCm: 170, loggedAt: '2024-01-01' } } });
    const result = await HeightEntry.create(1, { heightCm: 170 });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.any(String), { userId: 1, heightCm: 170 });
  });
});


// =====================================================================
//  15. MealPlan
// =====================================================================
import MealPlan from '../entity/MealPlan';

describe('MealPlan — validatePlan()', () => {
  test('valid when name is provided', () => {
    expect(MealPlan.validatePlan({ name: 'My Plan' }).valid).toBe(true);
  });

  test('invalid when name is empty', () => {
    const r = MealPlan.validatePlan({ name: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('name');
  });

  test('invalid when name is whitespace only', () => {
    const r = MealPlan.validatePlan({ name: '   ' });
    expect(r.valid).toBe(false);
  });
});

describe('MealPlan — hasPlans()', () => {
  test('returns true for non-empty array', () => {
    expect(MealPlan.hasPlans([new MealPlan()])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(MealPlan.hasPlans([])).toBe(false);
  });
});

describe('MealPlan — fromApi()', () => {
  test('maps raw object to MealPlan', () => {
    const raw = { planId: '1', userId: 5, name: 'Week 1', numDays: 7, days: [], isAutoGenerated: false };
    const plan = MealPlan.fromApi(raw);
    expect(plan).toBeInstanceOf(MealPlan);
    expect(plan.numDays).toBe(7);
    expect(plan.isAutoGenerated).toBe(false);
  });

  test('defaults numDays to 7 when missing', () => {
    expect(MealPlan.fromApi({}).numDays).toBe(7);
  });
});

describe('MealPlan — getSampleDayPreview()', () => {
  test('returns null when days is empty', () => {
    expect(new MealPlan({ days: [] }).getSampleDayPreview()).toBeNull();
  });

  test('returns preview string for first day', () => {
    const plan = new MealPlan({ days: [{ breakfast: 'Oats', lunch: 'Salad', dinner: 'Grilled Chicken' }] });
    const preview = plan.getSampleDayPreview();
    expect(preview).toContain('Sample Day 1');
    expect(preview).toContain('Oats');
  });
});

describe('MealPlan — updateCustomPlan() (stub)', () => {
  test('returns validation error for empty name', async () => {
    const result = await MealPlan.updateCustomPlan('p1', 1, { name: '', days: [] });
    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('returns updated MealPlan when name is valid', async () => {
    const result = await MealPlan.updateCustomPlan('p1', 1, { name: 'Updated Plan', days: [], numDays: 7 });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(MealPlan);
    expect(result.data.isAutoGenerated).toBe(false);
  });
});

describe('MealPlan — updateAutoGeneratedPlan() (stub)', () => {
  test('returns updated MealPlan with isAutoGenerated = true', async () => {
    const result = await MealPlan.updateAutoGeneratedPlan('p2', 1, { name: 'Keto Plan', planType: 'Keto', days: [], numDays: 7 });
    expect(result.success).toBe(true);
    expect(result.data.isAutoGenerated).toBe(true);
    expect(result.data.planType).toBe('Keto');
  });
});

describe('MealPlan — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await MealPlan.create(1, { name: '', description: '', numDays: 7, days: [] });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid input', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Created!', data: { planId: '1', name: 'Week 1', days: [] } } });
    const result = await MealPlan.create(1, { name: 'Week 1', description: '', numDays: 7, days: [] });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});


// =====================================================================
//  16. NutritionTargets
// =====================================================================
import NutritionTargets from '../entity/NutritionTargets';

describe('NutritionTargets — validateCalories()', () => {
  test('valid for 2000 kcal', () => {
    expect(NutritionTargets.validateCalories(2000).valid).toBe(true);
  });

  test('invalid when calories < 500', () => {
    const r = NutritionTargets.validateCalories(400);
    expect(r.valid).toBe(false);
    expect(r.field).toBe('calories');
  });

  test('invalid when calories > 10000', () => {
    const r = NutritionTargets.validateCalories(10001);
    expect(r.valid).toBe(false);
  });

  test('invalid when calories is NaN', () => {
    expect(NutritionTargets.validateCalories('abc').valid).toBe(false);
  });
});

describe('NutritionTargets — validateTargets()', () => {
  const valid = { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 };

  test('valid when all fields are correct', () => {
    expect(NutritionTargets.validateTargets(valid).valid).toBe(true);
  });

  test('invalid when protein is negative', () => {
    expect(NutritionTargets.validateTargets({ ...valid, protein: -1 }).valid).toBe(false);
  });

  test('invalid when fat is negative', () => {
    expect(NutritionTargets.validateTargets({ ...valid, fat: -5 }).valid).toBe(false);
  });

  test('invalid when fiber is negative', () => {
    expect(NutritionTargets.validateTargets({ ...valid, fiber: -1 }).valid).toBe(false);
  });
});

describe('NutritionTargets — computeTargets()', () => {
  const base = { weightKg: 70, heightCm: 175, age: 25, gender: 'male', activityLevel: 'Moderate', goal: 'Maintain Weight' };

  test('returns object with calories, protein, carbs, fat, fiber', () => {
    const targets = NutritionTargets.computeTargets(base);
    expect(targets).toHaveProperty('calories');
    expect(targets).toHaveProperty('protein');
    expect(targets).toHaveProperty('carbs');
    expect(targets).toHaveProperty('fat');
    expect(targets).toHaveProperty('fiber');
  });

  test('calories are at least 1200', () => {
    const targets = NutritionTargets.computeTargets({ ...base, goal: 'Lose Weight (-500 cal)' });
    expect(targets.calories).toBeGreaterThanOrEqual(1200);
  });

  test('female BMR is lower than male BMR for same inputs', () => {
    const male = NutritionTargets.computeTargets({ ...base, gender: 'male' });
    const female = NutritionTargets.computeTargets({ ...base, gender: 'female' });
    expect(male.calories).toBeGreaterThan(female.calories);
  });

  test('Gain Weight goal adds 500 kcal vs Maintain Weight', () => {
    const maintain = NutritionTargets.computeTargets({ ...base, goal: 'Maintain Weight' });
    const gain = NutritionTargets.computeTargets({ ...base, goal: 'Gain Weight (+500 cal)' });
    expect(gain.calories).toBe(maintain.calories + 500);
  });

  test('Lose Weight goal subtracts 500 kcal vs Maintain Weight', () => {
    const maintain = NutritionTargets.computeTargets({ ...base, goal: 'Maintain Weight' });
    const lose = NutritionTargets.computeTargets({ ...base, goal: 'Lose Weight (-500 cal)' });
    expect(lose.calories).toBe(maintain.calories - 500);
  });

  test('higher activity level produces more calories', () => {
    const minimal = NutritionTargets.computeTargets({ ...base, activityLevel: 'Minimal' });
    const strict = NutritionTargets.computeTargets({ ...base, activityLevel: 'Strict' });
    expect(strict.calories).toBeGreaterThan(minimal.calories);
  });

  test('normalizes legacy "Sedentary" activityLevel to "Minimal"', () => {
    const targets = NutritionTargets.computeTargets({ ...base, activityLevel: 'Sedentary' });
    expect(targets.calories).toBeGreaterThan(0);
  });

  test('fiber is always 30', () => {
    const targets = NutritionTargets.computeTargets(base);
    expect(targets.fiber).toBe(30);
  });
});

describe('NutritionTargets — constructor activityLevel normalisation', () => {
  test('normalizes "Moderate" to "Balanced"', () => {
    const nt = new NutritionTargets({ activityLevel: 'Moderate' });
    expect(nt.activityLevel).toBe('Balanced');
  });

  test('defaults to "Balanced" for unknown activity level', () => {
    const nt = new NutritionTargets({ activityLevel: 'unknown-level' });
    expect(nt.activityLevel).toBe('Balanced');
  });
});

describe('NutritionTargets — fetchByUser()', () => {
  test('returns error when userId is missing', async () => {
    const result = await NutritionTargets.fetchByUser(null);
    expect(result.success).toBe(false);
    expect(result.message).toBe('User ID is required.');
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('returns NutritionTargets instance on success', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 } } });
    const result = await NutritionTargets.fetchByUser(1);
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(NutritionTargets);
  });
});


// =====================================================================
//  17. Admin
// =====================================================================
import Admin from '../entity/Admin';

describe('Admin — login()', () => {
  test('returns res.data on success', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { id: 1 } } });
    const result = await Admin.login({ username: 'admin', password: 'secret' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/admin/login'), { username: 'admin', password: 'secret' });
  });

  test('returns fallback object on network error', async () => {
    axios.post.mockRejectedValue({ response: undefined });
    const result = await Admin.login({ username: 'admin', password: 'wrong' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Admin login failed');
  });
});

describe('Admin — fetchAllUsers()', () => {
  test('returns user list on success', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: [{ userId: 1 }] } });
    const result = await Admin.fetchAllUsers();
    expect(result.success).toBe(true);
  });

  test('returns error on failure', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Unauthorized' } } });
    const result = await Admin.fetchAllUsers();
    expect(result.success).toBe(false);
    expect(result.message).toBe('Unauthorized');
  });
});

describe('Admin — promoteToCurator()', () => {
  test('calls PUT endpoint with userId and applicationId', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await Admin.promoteToCurator('user-1', 'app-1');
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('promote-to-curator'), { userId: 'user-1', applicationId: 'app-1' });
  });

  test('returns error message on failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Already curator' } } });
    const result = await Admin.promoteToCurator('user-1', 'app-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Already curator');
  });
});

// =====================================================================
//  18. User
// =====================================================================
import User from '../entity/User';

describe('User — validateUsername()', () => {
  test('valid for a normal username', () => {
    expect(User.validateUsername('alice_01').valid).toBe(true);
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
    expect(User.validateUsername('a'.repeat(21)).valid).toBe(false);
  });

  test('invalid when contains spaces', () => {
    expect(User.validateUsername('alice smith').valid).toBe(false);
  });

  test('invalid when contains special characters like @', () => {
    expect(User.validateUsername('alice@123').valid).toBe(false);
  });

  test('valid at exactly 3 characters (lower boundary)', () => {
    expect(User.validateUsername('abc').valid).toBe(true);
  });

  test('valid at exactly 20 characters (upper boundary)', () => {
    expect(User.validateUsername('a'.repeat(20)).valid).toBe(true);
  });
});

describe('User — validateEmail()', () => {
  test('valid for a correct email address', () => {
    expect(User.validateEmail('user@example.com').valid).toBe(true);
  });

  test('invalid when empty', () => {
    const r = User.validateEmail('');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/required/i);
  });

  test('invalid when missing @', () => {
    expect(User.validateEmail('userexample.com').valid).toBe(false);
  });

  test('invalid when missing domain extension', () => {
    expect(User.validateEmail('user@example').valid).toBe(false);
  });

  test('invalid when contains spaces', () => {
    expect(User.validateEmail('user @example.com').valid).toBe(false);
  });
});

describe('User — validatePassword()', () => {
  test('valid when 6 or more characters', () => {
    expect(User.validatePassword('secure1').valid).toBe(true);
  });

  test('invalid when empty', () => {
    const r = User.validatePassword('');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/required/i);
  });

  test('invalid when fewer than 6 characters', () => {
    const r = User.validatePassword('abc');
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/6 characters/i);
  });

  test('valid at exactly 6 characters (boundary)', () => {
    expect(User.validatePassword('123456').valid).toBe(true);
  });
});

describe('User — validateCalorieLimit()', () => {
  test('valid for 2000', () => {
    expect(User.validateCalorieLimit(2000).valid).toBe(true);
  });

  test('invalid when null', () => {
    expect(User.validateCalorieLimit(null).valid).toBe(false);
  });

  test('invalid when 0', () => {
    expect(User.validateCalorieLimit(0).valid).toBe(false);
  });

  test('invalid when below 500', () => {
    const r = User.validateCalorieLimit(400);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/500/);
  });

  test('invalid when above 10000', () => {
    expect(User.validateCalorieLimit(10001).valid).toBe(false);
  });

  test('valid at exactly 500 (lower boundary)', () => {
    expect(User.validateCalorieLimit(500).valid).toBe(true);
  });

  test('valid at exactly 10000 (upper boundary)', () => {
    expect(User.validateCalorieLimit(10000).valid).toBe(true);
  });
});

describe('User — normalizeProfileType()', () => {
  test('uppercases profileType string', () => {
    expect(User.normalizeProfileType('athlete')).toBe('ATHLETE');
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

  test('trims whitespace before normalizing', () => {
    expect(User.normalizeProfileType('  meal_planner  ')).toBe('MEAL_PLANNER');
  });
});

describe('User — normalizeUserProfile()', () => {
  test('normalizes profileType inside a user object', () => {
    const raw = { userId: 1, profileType: 'health_oriented' };
    expect(User.normalizeUserProfile(raw).profileType).toBe('HEALTH_ORIENTED');
  });

  test('preserves other fields unchanged', () => {
    const raw = { userId: 5, email: 'a@b.com', profileType: 'ATHLETE' };
    const result = User.normalizeUserProfile(raw);
    expect(result.email).toBe('a@b.com');
    expect(result.userId).toBe(5);
  });

  test('returns the input unchanged when not an object', () => {
    expect(User.normalizeUserProfile(null)).toBeNull();
    expect(User.normalizeUserProfile('string')).toBe('string');
  });
});

describe('User — createAccount()', () => {
  const valid = {
    username: 'alice_01',
    email: 'alice@example.com',
    password: 'secure1',
    confirmPassword: 'secure1',
    selectedPlanId: 1,
  };

  test('returns error for invalid username — no API call made', async () => {
    const result = await User.createAccount({ ...valid, username: 'ab' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('username');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error for invalid email — no API call made', async () => {
    const result = await User.createAccount({ ...valid, email: 'bad-email' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('email');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error for short password — no API call made', async () => {
    const result = await User.createAccount({ ...valid, password: '123', confirmPassword: '123' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('password');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error when passwords do not match — no API call made', async () => {
    const result = await User.createAccount({ ...valid, confirmPassword: 'different' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('confirm');
    expect(result.message).toMatch(/do not match/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls axios.post when all fields are valid', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { userId: 1 } } });
    const result = await User.createAccount(valid);
    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(result.success).toBe(true);
  });

  test('returns fallback error when axios throws with no response', async () => {
    axios.post.mockRejectedValue(new Error('Network Error'));
    const result = await User.createAccount(valid);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/something went wrong/i);
  });
});

describe('User — login()', () => {
  test('returns error immediately when username is empty — no API call', async () => {
    const result = await User.login({ username: '', password: 'pass123' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/username is required/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error immediately when password is empty — no API call', async () => {
    const result = await User.login({ username: 'alice', password: '' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/password is required/i);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API and returns res.data on success', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { userId: 1 } } });
    const result = await User.login({ username: 'alice', password: 'secure1' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('returns backend error message on failed login', async () => {
    axios.post.mockRejectedValue({ response: { data: { success: false, message: 'Invalid credentials.' } } });
    const result = await User.login({ username: 'alice', password: 'wrong' });
    expect(result.success).toBe(false);
    expect(result.message).toBe('Invalid credentials.');
  });

  test('returns fallback message when server unreachable', async () => {
    axios.post.mockRejectedValue(new Error('Network error'));
    const result = await User.login({ username: 'alice', password: 'secure1' });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/incorrect credentials/i);
  });
});

describe('User — setProfileType()', () => {
  test('returns error for invalid profile type — no API call', async () => {
    const result = await User.setProfileType(1, 'INVALID_TYPE');
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/invalid profile type/i);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('normalizes lowercase input before calling API', async () => {
    axios.put.mockResolvedValue({ data: { success: true, data: { profileType: 'ATHLETE' } } });
    await User.setProfileType(1, 'athlete');
    expect(axios.put).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ profileType: 'ATHLETE' })
    );
  });

  test('accepts MEAL_PLANNER as valid type', async () => {
    axios.put.mockResolvedValue({ data: { success: true, data: { profileType: 'MEAL_PLANNER' } } });
    const result = await User.setProfileType(1, 'MEAL_PLANNER');
    expect(result.success).toBe(true);
  });
});

describe('User — setDailyCalorieLimit()', () => {
  const mockUser = new User({ userId: 1 });

  test('returns validation error for limit below 500 — no API call', async () => {
    const result = await User.setDailyCalorieLimit(mockUser, 400);
    expect(result.success).toBe(false);
    expect(result.field).toBe('limit');
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls API with correct payload on valid limit', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await User.setDailyCalorieLimit(mockUser, 2000);
    expect(axios.put).toHaveBeenCalledWith(
      expect.any(String),
      { userId: 1, dailyCalorieLimit: 2000 }
    );
  });
});

describe('User — fetchNutritionTargets()', () => {
  test('returns error when user is null', async () => {
    const result = await User.fetchNutritionTargets(null);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/no user session/i);
  });

  test('returns default targets when nutritionTargets is null on user', async () => {
    const user = new User({ userId: 1, nutritionTargets: null });
    const result = await User.fetchNutritionTargets(user);
    expect(result.success).toBe(true);
    expect(result.data.calories).toBe(2546);
    expect(result.data.fiber).toBe(30);
  });

  test('returns stored targets when set on user', async () => {
    const user = new User({
      userId: 1,
      nutritionTargets: { calories: 1800, protein: 120, carbs: 200, fat: 60, fiber: 25, activityLevel: 'Light', goal: 'Lose Weight' },
    });
    const result = await User.fetchNutritionTargets(user);
    expect(result.data.calories).toBe(1800);
    expect(result.data.activityLevel).toBe('Light');
  });
});

describe('User — terminateAccount()', () => {
  test('returns error immediately when user is null — no API call', async () => {
    const result = await User.terminateAccount(null);
    expect(result.success).toBe(false);
    expect(axios.delete).not.toHaveBeenCalled();
  });

  test('calls axios.delete with correct userId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Account deleted.' } });
    const result = await User.terminateAccount(new User({ userId: 5 }));
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('5'));
  });
});

describe('User — getUser()', () => {
  test('returns error immediately when userId is null — no API call', async () => {
    const result = await User.getUser(null);
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/required/i);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('returns normalized user profile on success', async () => {
    axios.get.mockResolvedValue({ data: { user: { userId: 1, profileType: 'athlete' } } });
    const result = await User.getUser(1);
    expect(result.success).toBe(true);
    expect(result.data.profileType).toBe('ATHLETE');
  });
});


// =====================================================================
//  19. WeightEntry
// =====================================================================
import WeightEntry from '../entity/WeightEntry';

describe('WeightEntry — validateWeight()', () => {
  test('valid for a normal weight', () => {
    expect(WeightEntry.validateWeight(70).valid).toBe(true);
  });

  test('invalid when 0', () => {
    expect(WeightEntry.validateWeight(0).valid).toBe(false);
  });

  test('invalid when below 10 kg (minimum)', () => {
    const r = WeightEntry.validateWeight(5);
    expect(r.valid).toBe(false);
    expect(r.message).toMatch(/10/);
  });

  test('invalid when above 500 kg (maximum)', () => {
    expect(WeightEntry.validateWeight(501).valid).toBe(false);
  });

  test('invalid when NaN string', () => {
    expect(WeightEntry.validateWeight('abc').valid).toBe(false);
  });

  test('valid at exactly 10 kg (lower boundary)', () => {
    expect(WeightEntry.validateWeight(10).valid).toBe(true);
  });

  test('valid at exactly 500 kg (upper boundary)', () => {
    expect(WeightEntry.validateWeight(500).valid).toBe(true);
  });
});

describe('WeightEntry — getLatest()', () => {
  test('returns the most recent entry by loggedAt date', () => {
    const entries = [
      new WeightEntry({ weightKg: 70, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 69, loggedAt: '2024-06-15' }),
      new WeightEntry({ weightKg: 71, loggedAt: '2023-12-01' }),
    ];
    expect(WeightEntry.getLatest(entries).weightKg).toBe(69);
  });

  test('returns null for empty array', () => {
    expect(WeightEntry.getLatest([])).toBeNull();
  });

  test('returns null for null input', () => {
    expect(WeightEntry.getLatest(null)).toBeNull();
  });

  test('returns the single entry when array has one item', () => {
    expect(WeightEntry.getLatest([new WeightEntry({ weightKg: 75, loggedAt: '2024-03-01' })]).weightKg).toBe(75);
  });
});

describe('WeightEntry — getTotalChange()', () => {
  test('returns positive change when weight increased', () => {
    const entries = [
      new WeightEntry({ weightKg: 70, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 73, loggedAt: '2024-06-01' }),
    ];
    expect(WeightEntry.getTotalChange(entries)).toBe(3);
  });

  test('returns negative change when weight decreased', () => {
    const entries = [
      new WeightEntry({ weightKg: 80, loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 75, loggedAt: '2024-06-01' }),
    ];
    expect(WeightEntry.getTotalChange(entries)).toBe(-5);
  });

  test('returns 0 for single entry', () => {
    expect(WeightEntry.getTotalChange([new WeightEntry({ weightKg: 70, loggedAt: '2024-01-01' })])).toBe(0);
  });

  test('returns 0 for empty array', () => {
    expect(WeightEntry.getTotalChange([])).toBe(0);
  });

  test('rounds result to 1 decimal place', () => {
    const entries = [
      new WeightEntry({ weightKg: 70.0,  loggedAt: '2024-01-01' }),
      new WeightEntry({ weightKg: 70.15, loggedAt: '2024-06-01' }),
    ];
    expect(WeightEntry.getTotalChange(entries)).toBe(0.2);
  });
});

describe('WeightEntry — calculateBMI()', () => {
  test('calculates BMI correctly for 70kg / 175cm', () => {
    // 70 / (1.75)^2 = 22.857… → rounds to 22.9
    expect(WeightEntry.calculateBMI(70, 175)).toBe(22.9);
  });

  test('returns null when heightCm is 0', () => {
    expect(WeightEntry.calculateBMI(70, 0)).toBeNull();
  });

  test('returns null when weightKg is 0', () => {
    expect(WeightEntry.calculateBMI(0, 175)).toBeNull();
  });

  test('returns null when weightKg is null', () => {
    expect(WeightEntry.calculateBMI(null, 175)).toBeNull();
  });

  test('rounds to 1 decimal place', () => {
    const bmi = WeightEntry.calculateBMI(85, 180);
    expect(Number.isFinite(bmi)).toBe(true);
    const decimalPlaces = String(bmi).split('.')[1]?.length ?? 0;
    expect(decimalPlaces).toBeLessThanOrEqual(1);
  });

  test('calulateBMI() alias returns same result as calculateBMI()', () => {
    expect(WeightEntry.calulateBMI(70, 175)).toBe(WeightEntry.calculateBMI(70, 175));
  });
});

describe('WeightEntry — getBMICategory()', () => {
  test('returns "Underweight" for BMI below 18.5', () => {
    expect(WeightEntry.getBMICategory(17)).toBe('Underweight');
  });

  test('returns "Normal weight" for BMI 18.5–24.9', () => {
    expect(WeightEntry.getBMICategory(22)).toBe('Normal weight');
  });

  test('returns "Overweight" for BMI 25–29.9', () => {
    expect(WeightEntry.getBMICategory(27)).toBe('Overweight');
  });

  test('returns "Obese" for BMI 30 and above', () => {
    expect(WeightEntry.getBMICategory(32)).toBe('Obese');
  });

  test('returns "-" for null BMI', () => {
    expect(WeightEntry.getBMICategory(null)).toBe('-');
  });

  test('boundary: exactly 18.5 is "Normal weight"', () => {
    expect(WeightEntry.getBMICategory(18.5)).toBe('Normal weight');
  });

  test('boundary: exactly 25.0 is "Overweight"', () => {
    expect(WeightEntry.getBMICategory(25)).toBe('Overweight');
  });

  test('boundary: exactly 30.0 is "Obese"', () => {
    expect(WeightEntry.getBMICategory(30)).toBe('Obese');
  });
});

describe('WeightEntry — create()', () => {
  test('returns validation error without calling API when weight is 0', async () => {
    const result = await WeightEntry.create(1, { weightKg: 0 });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls axios.post with correct payload on valid weight', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Logged', data: { weightKg: 70, loggedAt: '2024-01-01' } } });
    const result = await WeightEntry.create(1, { weightKg: 70 });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.any(String), { userId: 1, weightKg: 70 });
  });
});

describe('WeightEntry — update()', () => {
  test('returns validation error without calling API when weight is too low', async () => {
    const result = await WeightEntry.update('entry-1', { weightKg: 3 });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put on valid weight', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated', data: { weightKg: 72, loggedAt: '2024-01-01' } } });
    await WeightEntry.update('entry-1', { weightKg: 72 });
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('entry-1'), { weightKg: 72 });
  });
});

describe('WeightEntry — delete()', () => {
  test('calls axios.delete with the entry ID', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Entry removed.' } });
    const result = await WeightEntry.delete('entry-99');
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('entry-99'));
  });

  test('returns error on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await WeightEntry.delete('bad-id');
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  20. Review
// =====================================================================
import Review from '../entity/Review';

describe('Review — validateReview()', () => {
  const valid = { rating: 4, title: 'Great app!', content: 'Really helped me track my meals.' };

  test('valid when all fields correct', () => {
    expect(Review.validateReview(valid).valid).toBe(true);
  });

  test('invalid when rating is 0', () => {
    const r = Review.validateReview({ ...valid, rating: 0 });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('rating');
  });

  test('invalid when rating is 6 (above maximum)', () => {
    expect(Review.validateReview({ ...valid, rating: 6 }).valid).toBe(false);
  });

  test('invalid when rating is null', () => {
    expect(Review.validateReview({ ...valid, rating: null }).valid).toBe(false);
  });

  test('invalid when title is empty', () => {
    const r = Review.validateReview({ ...valid, title: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when title is whitespace only', () => {
    expect(Review.validateReview({ ...valid, title: '   ' }).valid).toBe(false);
  });

  test('invalid when content is fewer than 10 characters', () => {
    const r = Review.validateReview({ ...valid, content: 'Too short' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('content');
    expect(r.message).toMatch(/10 characters/i);
  });

  test('valid at rating 1 (minimum boundary)', () => {
    expect(Review.validateReview({ ...valid, rating: 1 }).valid).toBe(true);
  });

  test('valid at rating 5 (maximum boundary)', () => {
    expect(Review.validateReview({ ...valid, rating: 5 }).valid).toBe(true);
  });

  test('valid when content is exactly 10 characters', () => {
    expect(Review.validateReview({ ...valid, content: '1234567890' }).valid).toBe(true);
  });
});

describe('Review — getAverageRating()', () => {
  test('returns 0 for empty array', () => {
    expect(Review.getAverageRating([])).toBe(0);
  });

  test('returns 0 for null input', () => {
    expect(Review.getAverageRating(null)).toBe(0);
  });

  test('floors the average — (5+4+3)/3 = 4.0 → 4', () => {
    const reviews = [
      new Review({ rating: 5 }),
      new Review({ rating: 4 }),
      new Review({ rating: 3 }),
    ];
    expect(Review.getAverageRating(reviews)).toBe(4);
  });

  test('floors rather than rounds — (5+5+4)/3 = 4.66 → 4', () => {
    const reviews = [
      new Review({ rating: 5 }),
      new Review({ rating: 5 }),
      new Review({ rating: 4 }),
    ];
    expect(Review.getAverageRating(reviews)).toBe(4);
  });

  test('handles single review', () => {
    expect(Review.getAverageRating([new Review({ rating: 3 })])).toBe(3);
  });

  test('treats missing rating as 0 in average', () => {
    // (4 + 0) / 2 = 2
    const reviews = [new Review({ rating: 4 }), new Review({})];
    expect(Review.getAverageRating(reviews)).toBe(2);
  });
});

describe('Review — create()', () => {
  test('returns validation error without calling API when rating is 0', async () => {
    const result = await Review.create(1, { rating: 0, title: 'Title', content: 'Valid content here' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns validation error when content is too short', async () => {
    const result = await Review.create(1, { rating: 4, title: 'Title', content: 'Short' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('content');
  });

  test('calls axios.post with snake_case keys when all fields valid', async () => {
    axios.post.mockResolvedValue({ data: { success: true } });
    await Review.create(1, { rating: 5, title: 'Great!', content: 'Long enough content here.', profileType: 'ATHLETE' });
    const payload = axios.post.mock.calls[0][1];
    expect(payload.review_user_id).toBe(1);
    expect(payload.profile_type).toBe('ATHLETE');
    expect(payload.rating).toBe(5);
  });
});

describe('Review — remove()', () => {
  test('calls axios.delete with the correct review ID', async () => {
    axios.delete.mockResolvedValue({ data: { message: 'Review deleted' } });
    const result = await Review.remove('review-123');
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('review-123'));
  });

  test('returns error on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await Review.remove('bad-id');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Not found');
  });
});

describe('Review — constructor', () => {
  test('stores all fields correctly', () => {
    const r = new Review({
      reviewId: 'r-1', userId: 5, reviewerName: 'Alice', reviewerInitials: 'AJ',
      profileType: 'Athlete', rating: 5, title: 'Title', content: 'Content.',
      membershipPlanId: 2, createdAt: '2024-01-01', updatedAt: null,
    });
    expect(r.reviewerName).toBe('Alice');
    expect(r.membershipPlanId).toBe(2);
    expect(r.updatedAt).toBeNull();
  });
});


// =====================================================================
//  21. Recipe
// =====================================================================
import Recipe from '../entity/Recipe';

describe('Recipe — constructor & getSummaryLine()', () => {
  test('getSummaryLine() returns correctly formatted string', () => {
    expect(new Recipe({ prepTimeMins: 30, calories: 450 }).getSummaryLine()).toBe('30 min  •  450 kcal');
  });

  test('sets recipeId from _id when recipeId not provided', () => {
    expect(new Recipe({ _id: 'mongo-abc' }).recipeId).toBe('mongo-abc');
  });

  test('likeCount defaults to 0', () => {
    expect(new Recipe({}).likeCount).toBe(0);
  });

  test('likeCount casts string to Number', () => {
    expect(new Recipe({ likeCount: '5' }).likeCount).toBe(5);
  });
});

describe('Recipe — validateRecipe()', () => {
  const valid = {
    title: 'Chicken Salad',
    ingredients: ['Chicken', 'Lettuce'],
    instructions: ['Mix everything together.'],
  };

  test('valid when all fields provided', () => {
    expect(Recipe.validateRecipe(valid).valid).toBe(true);
  });

  test('invalid when title is empty', () => {
    expect(Recipe.validateRecipe({ ...valid, title: '' }).field).toBe('title');
  });

  test('invalid when ingredients array is empty', () => {
    expect(Recipe.validateRecipe({ ...valid, ingredients: [] }).field).toBe('ingredients');
  });

  test('invalid when ingredients contains only whitespace strings', () => {
    expect(Recipe.validateRecipe({ ...valid, ingredients: ['   ', ''] }).field).toBe('ingredients');
  });

  test('invalid when instructions array is empty', () => {
    expect(Recipe.validateRecipe({ ...valid, instructions: [] }).field).toBe('instructions');
  });

  test('invalid when instructions contains only whitespace strings', () => {
    expect(Recipe.validateRecipe({ ...valid, instructions: ['  '] }).field).toBe('instructions');
  });
});

describe('Recipe — filterBySearch()', () => {
  const recipes = [
    new Recipe({ title: 'Chicken Rice', ingredients: ['chicken', 'rice'] }),
    new Recipe({ title: 'Tuna Pasta',  ingredients: ['tuna', 'pasta'] }),
    new Recipe({ title: 'Egg Salad',   ingredients: ['eggs', 'mayo'] }),
  ];

  test('matches by title (case-insensitive)', () => {
    expect(Recipe.filterBySearch(recipes, 'chicken')).toHaveLength(1);
  });

  test('matches by ingredient', () => {
    expect(Recipe.filterBySearch(recipes, 'tuna')).toHaveLength(1);
  });

  test('returns all when query is empty', () => {
    expect(Recipe.filterBySearch(recipes, '')).toHaveLength(3);
  });

  test('returns empty array when no match', () => {
    expect(Recipe.filterBySearch(recipes, 'salmon')).toHaveLength(0);
  });
});

describe('Recipe — filterByTag()', () => {
  const recipes = [
    new Recipe({ title: 'A', tags: ['high-protein', 'keto'] }),
    new Recipe({ title: 'B', tags: ['vegan'] }),
  ];

  test('filters by exact matching tag', () => {
    expect(Recipe.filterByTag(recipes, 'vegan')).toHaveLength(1);
  });

  test('returns all when tag is "All"', () => {
    expect(Recipe.filterByTag(recipes, 'All')).toHaveLength(2);
  });

  test('returns all when tag is null', () => {
    expect(Recipe.filterByTag(recipes, null)).toHaveLength(2);
  });
});

describe('Recipe — filterMealPrep()', () => {
  const recipes = [
    new Recipe({ title: 'A', isMealPrep: true }),
    new Recipe({ title: 'B', isMealPrep: false }),
    new Recipe({ title: 'C', isMealPrep: true }),
  ];

  test('returns only meal prep recipes', () => {
    expect(Recipe.filterMealPrep(recipes)).toHaveLength(2);
  });
});

describe('Recipe — filterCurated()', () => {
  const recipes = [
    new Recipe({ title: 'A', isCurated: true }),
    new Recipe({ title: 'B', isCurated: false }),
  ];

  test('returns only curated recipes', () => {
    expect(Recipe.filterCurated(recipes)).toHaveLength(1);
  });
});

describe('Recipe — filterByPrepTime()', () => {
  const recipes = [
    new Recipe({ title: 'Quick',  prepTimeMins: 10 }),
    new Recipe({ title: 'Medium', prepTimeMins: 30 }),
    new Recipe({ title: 'Long',   prepTimeMins: 60 }),
  ];

  test('filters recipes at or under max prep time', () => {
    expect(Recipe.filterByPrepTime(recipes, 30)).toHaveLength(2);
  });

  test('returns all when maxMins is null', () => {
    expect(Recipe.filterByPrepTime(recipes, null)).toHaveLength(3);
  });
});

describe('Recipe — filterByUser()', () => {
  const recipes = [
    new Recipe({ createdByUserId: 1 }),
    new Recipe({ createdByUserId: 2 }),
    new Recipe({ createdByUserId: 1 }),
  ];

  test('returns recipes belonging to user', () => {
    expect(Recipe.filterByUser(recipes, 1)).toHaveLength(2);
  });

  test('returns [] when userId is null', () => {
    expect(Recipe.filterByUser(recipes, null)).toHaveLength(0);
  });

  test('matches using string comparison so "1" matches 1', () => {
    expect(Recipe.filterByUser(recipes, '1')).toHaveLength(2);
  });
});

describe('Recipe — hasRecipes()', () => {
  test('returns true for non-empty array', () => {
    expect(Recipe.hasRecipes([new Recipe()])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(Recipe.hasRecipes([])).toBe(false);
  });

  test('returns false for null', () => {
    expect(Recipe.hasRecipes(null)).toBe(false);
  });
});

describe('Recipe — filterByCalorieBudget()', () => {
  const recipes = [
    new Recipe({ title: 'Light',  calories: 200 }),
    new Recipe({ title: 'Medium', calories: 500 }),
    new Recipe({ title: 'Heavy',  calories: 900 }),
  ];

  test('returns empty array when remainingCalories is 0 or negative', () => {
    expect(Recipe.filterByCalorieBudget(recipes, 0)).toHaveLength(0);
    expect(Recipe.filterByCalorieBudget(recipes, -100)).toHaveLength(0);
  });

  test('excludes recipes above 110% of budget', () => {
    // budget 500, ceiling = 550 → Light(200) + Medium(500) pass, Heavy(900) fails
    const result = Recipe.filterByCalorieBudget(recipes, 500);
    expect(result.every(r => r.calories <= 550)).toBe(true);
  });

  test('returns empty array for non-array input', () => {
    expect(Recipe.filterByCalorieBudget(null, 500)).toHaveLength(0);
  });
});

describe('Recipe — getMacroMatchScore()', () => {
  test('returns 0 when recipe is null', () => {
    expect(Recipe.getMacroMatchScore(null, { calories: 500 })).toBe(0);
  });

  test('returns 0 when remaining is null', () => {
    expect(Recipe.getMacroMatchScore(new Recipe(), null)).toBe(0);
  });

  test('returns 1 (perfect score) when recipe exactly matches remaining macros', () => {
    const recipe = new Recipe({ calories: 500, protein: 30, carbs: 60, fat: 15 });
    const remaining = { calories: 500, protein: 30, carbs: 60, fat: 15 };
    expect(Recipe.getMacroMatchScore(recipe, remaining)).toBe(1);
  });

  test('returns a score between 0 and 1 for typical inputs', () => {
    const recipe = new Recipe({ calories: 400, protein: 25, carbs: 50, fat: 12 });
    const remaining = { calories: 500, protein: 30, carbs: 60, fat: 15 };
    const score = Recipe.getMacroMatchScore(recipe, remaining);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('Recipe — create()', () => {
  test('returns validation error without calling API when title is empty', async () => {
    const result = await Recipe.create(1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API with createdByUserId prepended', async () => {
    axios.post.mockResolvedValue({ data: { title: 'Salad', ingredients: ['Lettuce'], instructions: ['Toss'] } });
    await Recipe.create(1, { title: 'Salad', ingredients: ['Lettuce'], instructions: ['Toss'] });
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ createdByUserId: 1, title: 'Salad' })
    );
  });
});

describe('Recipe — update() stub', () => {
  test('returns validation error for empty title', async () => {
    const result = await Recipe.update('r-1', 1, { title: '', ingredients: ['x'], instructions: ['y'] });
    expect(result.success).toBe(false);
    expect(result.field).toBe('title');
  });

  test('returns updated Recipe instance when valid', async () => {
    const result = await Recipe.update('r-1', 1, { title: 'Updated', ingredients: ['x'], instructions: ['y'] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(Recipe);
    expect(result.data.recipeId).toBe('r-1');
  });
});

describe('Recipe — search()', () => {
  test('returns empty data without calling API for empty query', async () => {
    const result = await Recipe.search('');
    expect(result.success).toBe(true);
    expect(result.data).toEqual([]);
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('calls fetchAll for non-empty query', async () => {
    axios.get.mockResolvedValue({ data: [] });
    await Recipe.search('chicken');
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});


// =====================================================================
//  22. RecipeDraft
// =====================================================================
import RecipeDraft from '../entity/RecipeDraft';

describe('RecipeDraft — validateRecipe()', () => {
  const valid = {
    title: 'Draft Salad',
    ingredients: ['Lettuce', 'Tomato'],
    instructions: ['Toss ingredients together.'],
  };

  test('valid when all fields provided', () => {
    expect(RecipeDraft.validateRecipe(valid).valid).toBe(true);
  });

  test('invalid when title is empty', () => {
    expect(RecipeDraft.validateRecipe({ ...valid, title: '' }).valid).toBe(false);
  });

  test('invalid when ingredients is empty', () => {
    expect(RecipeDraft.validateRecipe({ ...valid, ingredients: [] }).valid).toBe(false);
  });

  test('invalid when ingredients contains only whitespace', () => {
    expect(RecipeDraft.validateRecipe({ ...valid, ingredients: ['  '] }).valid).toBe(false);
  });

  test('invalid when instructions is empty', () => {
    expect(RecipeDraft.validateRecipe({ ...valid, instructions: [] }).valid).toBe(false);
  });
});

describe('RecipeDraft — filterByUser()', () => {
  const drafts = [
    new RecipeDraft({ createdByUserId: 1 }),
    new RecipeDraft({ createdByUserId: 2 }),
    new RecipeDraft({ createdByUserId: 1 }),
  ];

  test('returns drafts belonging to given user', () => {
    expect(RecipeDraft.filterByUser(drafts, 1)).toHaveLength(2);
  });

  test('returns [] when userId is null', () => {
    expect(RecipeDraft.filterByUser(drafts, null)).toHaveLength(0);
  });
});

describe('RecipeDraft — constructor defaults', () => {
  test('isCurated defaults to true (curators own all drafts)', () => {
    expect(new RecipeDraft({}).isCurated).toBe(true);
  });

  test('isMealPrep defaults to false', () => {
    expect(new RecipeDraft({}).isMealPrep).toBe(false);
  });

  test('ingredients and instructions default to empty arrays', () => {
    const d = new RecipeDraft({});
    expect(d.ingredients).toEqual([]);
    expect(d.instructions).toEqual([]);
  });
});

describe('RecipeDraft — create()', () => {
  test('returns validation error without calling API when title empty', async () => {
    const result = await RecipeDraft.create(1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('forces isCurated = true in the POST payload', async () => {
    axios.post.mockResolvedValue({ data: { title: 'D', ingredients: ['x'], instructions: ['y'], isCurated: true } });
    await RecipeDraft.create(1, { title: 'D', ingredients: ['x'], instructions: ['y'] });
    const payload = axios.post.mock.calls[0][1];
    expect(payload.isCurated).toBe(true);
    expect(payload.createdByUserId).toBe(1);
  });
});

describe('RecipeDraft — update()', () => {
  test('returns validation error without calling API when title empty', async () => {
    const result = await RecipeDraft.update('d-1', 1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put and returns RecipeDraft instance on valid fields', async () => {
    const responseData = { message: 'Updated!', data: { title: 'Updated Draft', ingredients: ['x'], instructions: ['y'] } };
    axios.put.mockResolvedValue({ data: responseData });
    const result = await RecipeDraft.update('d-1', 1, { title: 'Updated Draft', ingredients: ['x'], instructions: ['y'] });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(RecipeDraft);
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('d-1'),
      expect.objectContaining({ createdByUserId: 1 })
    );
  });
});

describe('RecipeDraft — delete()', () => {
  test('calls axios.delete with recipeId and createdByUserId in body', async () => {
    axios.delete.mockResolvedValue({ data: {} });
    const result = await RecipeDraft.delete('d-1', 1);
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(
      expect.stringContaining('d-1'),
      { data: { createdByUserId: 1 } }
    );
  });
});


// =====================================================================
//  23. UserProfileType
// =====================================================================
import UserProfileType, { USER_PROFILE_TYPES } from '../entity/UserProfileType';

describe('UserProfileType — USER_PROFILE_TYPES constant', () => {
  test('contains exactly 3 types', () => {
    expect(Object.keys(USER_PROFILE_TYPES)).toHaveLength(3);
  });

  test('MEAL_PLANNER, ATHLETE, HEALTH_ORIENTED values are correct', () => {
    expect(USER_PROFILE_TYPES.MEAL_PLANNER).toBe('MEAL_PLANNER');
    expect(USER_PROFILE_TYPES.ATHLETE).toBe('ATHLETE');
    expect(USER_PROFILE_TYPES.HEALTH_ORIENTED).toBe('HEALTH_ORIENTED');
  });

  test('is frozen (immutable)', () => {
    expect(Object.isFrozen(USER_PROFILE_TYPES)).toBe(true);
  });
});

describe('UserProfileType — instance methods', () => {
  test('getFeatureList() returns the features array', () => {
    const p = new UserProfileType({ features: ['Meal planning', 'Grocery list'] });
    expect(p.getFeatureList()).toEqual(['Meal planning', 'Grocery list']);
  });

  test('isAvailable() returns true when profileTypeId is set', () => {
    expect(new UserProfileType({ profileTypeId: 1 }).isAvailable()).toBe(true);
  });

  test('isAvailable() returns false when profileTypeId is null', () => {
    expect(new UserProfileType({ profileTypeId: null }).isAvailable()).toBe(false);
  });

  test('toJSON() maps camelCase to snake_case', () => {
    const p = new UserProfileType({ profileTypeId: 2, type: 'ATHLETE', displayName: 'Athletes', imageUrl: 'img.jpg' });
    const json = p.toJSON();
    expect(json.profile_type_id).toBe(2);
    expect(json.display_name).toBe('Athletes');
    expect(json.image_url).toBe('img.jpg');
  });
});

describe('UserProfileType — fromRow()', () => {
  test('returns null when row is null', () => {
    expect(UserProfileType.fromRow(null)).toBeNull();
  });

  test('parses JSON features string into array', () => {
    const row = { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes', description: 'Desc', features: '["Macro tracking","Hydration"]', image_url: null };
    const p = UserProfileType.fromRow(row);
    expect(p.features).toEqual(['Macro tracking', 'Hydration']);
    expect(p.displayName).toBe('Athletes');
  });

  test('handles array features directly without parsing', () => {
    const row = { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes', description: '', features: ['Macro tracking'], image_url: null };
    expect(UserProfileType.fromRow(row).features).toEqual(['Macro tracking']);
  });

  test('handles malformed JSON features gracefully (returns [])', () => {
    const row = { profile_type_id: 1, type: 'X', display_name: 'X', description: '', features: '{bad json}', image_url: null };
    expect(UserProfileType.fromRow(row).features).toEqual([]);
  });
});

describe('UserProfileType — hasAvailableProfiles()', () => {
  test('returns true when at least one profile has profileTypeId set', () => {
    const profiles = [new UserProfileType({ profileTypeId: null }), new UserProfileType({ profileTypeId: 2 })];
    expect(UserProfileType.hasAvailableProfiles(profiles)).toBe(true);
  });

  test('returns false when all profiles have null profileTypeId', () => {
    expect(UserProfileType.hasAvailableProfiles([new UserProfileType({ profileTypeId: null })])).toBe(false);
  });
});

describe('UserProfileType — findByType()', () => {
  const profiles = [
    new UserProfileType({ profileTypeId: 1, type: 'ATHLETE' }),
    new UserProfileType({ profileTypeId: 2, type: 'MEAL_PLANNER' }),
  ];

  test('returns matching profile', () => {
    expect(UserProfileType.findByType(profiles, 'ATHLETE')?.type).toBe('ATHLETE');
  });

  test('returns null when type not found', () => {
    expect(UserProfileType.findByType(profiles, 'HEALTH_ORIENTED')).toBeNull();
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
      { questionIndex: 0, answerIndex: 3 }, // MP:1
      { questionIndex: 2, answerIndex: 0 }, // MP:1
      { questionIndex: 3, answerIndex: 2 }, // MP:1
    ];
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('MEAL_PLANNER');
  });

  test('returns HEALTH_ORIENTED when health answers dominate', () => {
    const answers = [
      { questionIndex: 0, answerIndex: 0 }, // HO:1
      { questionIndex: 3, answerIndex: 1 }, // HO:1
      { questionIndex: 4, answerIndex: 1 }, // HO:1
    ];
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('HEALTH_ORIENTED');
  });

  test('defaults to HEALTH_ORIENTED on empty answers (tie at 0)', () => {
    expect(UserProfileType.computeProfileFromAnswers([])).toBe('HEALTH_ORIENTED');
  });

  test('ignores out-of-range questionIndex and answerIndex without throwing', () => {
    expect(() => UserProfileType.computeProfileFromAnswers([{ questionIndex: 99, answerIndex: 99 }])).not.toThrow();
  });
});

describe('UserProfileType — getProfileMeta()', () => {
  test('returns correct meta for ATHLETE', () => {
    const meta = UserProfileType.getProfileMeta('ATHLETE');
    expect(meta.label).toBe('Athlete');
    expect(meta.emoji).toBe('🏋️');
  });

  test('returns correct meta for MEAL_PLANNER', () => {
    expect(UserProfileType.getProfileMeta('MEAL_PLANNER').label).toBe('Meal Planner');
  });

  test('returns correct meta for HEALTH_ORIENTED', () => {
    expect(UserProfileType.getProfileMeta('HEALTH_ORIENTED').label).toBe('Health Oriented');
  });

  test('falls back to HEALTH_ORIENTED for unknown type', () => {
    expect(UserProfileType.getProfileMeta('UNKNOWN').label).toBe('Health Oriented');
  });

  test('every type has label, emoji, description and appName', () => {
    ['ATHLETE', 'HEALTH_ORIENTED', 'MEAL_PLANNER'].forEach(type => {
      const meta = UserProfileType.getProfileMeta(type);
      expect(meta).toHaveProperty('label');
      expect(meta).toHaveProperty('emoji');
      expect(meta).toHaveProperty('description');
      expect(meta).toHaveProperty('appName');
    });
  });
});


// =====================================================================
//  24. SmartEatingContent
// =====================================================================
import SmartEatingContent from '../entity/SmartEatingContent';

describe('SmartEatingContent — filterByCategory()', () => {
  const alternatives = [
    { name: 'Apple',    category: 'Fruit'      },
    { name: 'Broccoli', category: 'Vegetable'  },
    { name: 'Banana',   category: 'Fruit'      },
  ];

  test('returns all items when category is "All"', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, 'All')).toHaveLength(3);
  });

  test('returns all items when category is null', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, null)).toHaveLength(3);
  });

  test('filters to matching category only', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, 'Fruit')).toHaveLength(2);
  });

  test('returns empty array when category has no matches', () => {
    expect(SmartEatingContent.filterByCategory(alternatives, 'Grain')).toHaveLength(0);
  });
});

describe('SmartEatingContent — getCategories()', () => {
  test('returns "All" as first item', () => {
    const alts = [{ category: 'Fruit' }, { category: 'Vegetable' }];
    expect(SmartEatingContent.getCategories(alts)[0]).toBe('All');
  });

  test('de-duplicates categories', () => {
    const alts = [{ category: 'Fruit' }, { category: 'Fruit' }, { category: 'Vegetable' }];
    // All + Fruit + Vegetable = 3
    expect(SmartEatingContent.getCategories(alts)).toHaveLength(3);
  });
});

describe('SmartEatingContent — filterSnackIdeas()', () => {
  const snacks = [
    { name: 'Apple',       timing: 'Morning'    },
    { name: 'Protein Bar', timing: 'Pre-workout' },
    { name: 'Yogurt',      timing: 'Morning'    },
  ];

  test('returns all when filter is "All"', () => {
    expect(SmartEatingContent.filterSnackIdeas(snacks, 'All')).toHaveLength(3);
  });

  test('returns all when filter is null', () => {
    expect(SmartEatingContent.filterSnackIdeas(snacks, null)).toHaveLength(3);
  });

  test('filters by timing (case-insensitive)', () => {
    expect(SmartEatingContent.filterSnackIdeas(snacks, 'morning')).toHaveLength(2);
  });

  test('returns empty array when timing has no match', () => {
    expect(SmartEatingContent.filterSnackIdeas(snacks, 'Evening')).toHaveLength(0);
  });
});

describe('SmartEatingContent — searchAlternatives()', () => {
  const groups = [
    {
      original: 'Chips',
      alternatives: [
        { name: 'Rice cakes', goal: 'Low calorie' },
        { name: 'Popcorn',    goal: 'High fiber'  },
      ],
    },
    {
      original: 'Chocolate',
      alternatives: [
        { name: 'Dark chocolate', goal: 'Antioxidant' },
      ],
    },
  ];

  test('returns all groups when query is empty', () => {
    expect(SmartEatingContent.searchAlternatives(groups, '')).toHaveLength(2);
  });

  test('matches by original food name (case-insensitive)', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'chips');
    expect(result).toHaveLength(1);
    expect(result[0].original).toBe('Chips');
  });

  test('matches by alternative item name', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'dark chocolate');
    expect(result).toHaveLength(1);
  });

  test('matches by goal keyword', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'high fiber');
    expect(result).toHaveLength(1);
    expect(result[0].alternatives[0].name).toBe('Popcorn');
  });

  test('returns only matching alternatives within a group', () => {
    const result = SmartEatingContent.searchAlternatives(groups, 'popcorn');
    expect(result[0].alternatives).toHaveLength(1);
    expect(result[0].alternatives[0].name).toBe('Popcorn');
  });

  test('returns empty array when no match found', () => {
    expect(SmartEatingContent.searchAlternatives(groups, 'zzzzz')).toHaveLength(0);
  });
});

describe('SmartEatingContent — _normalizeSnackingContent()', () => {
  test('returns empty structure for null input', () => {
    const result = SmartEatingContent._normalizeSnackingContent(null);
    expect(result.corePrinciples).toEqual([]);
    expect(result.portionControl.visualGuides).toEqual([]);
    expect(result.warningSign.title).toBe('');
  });

  test('preserves valid arrays from input', () => {
    const result = SmartEatingContent._normalizeSnackingContent({ corePrinciples: ['Eat slowly'] });
    expect(result.corePrinciples).toEqual(['Eat slowly']);
  });

  test('defaults non-array fields to empty arrays', () => {
    const result = SmartEatingContent._normalizeSnackingContent({ corePrinciples: 'not an array' });
    expect(result.corePrinciples).toEqual([]);
  });
});

describe('SmartEatingContent — _normalizeAlternativesGrouped()', () => {
  test('returns empty structure for null input', () => {
    const result = SmartEatingContent._normalizeAlternativesGrouped(null);
    expect(result.groups).toEqual([]);
    expect(result.tips).toEqual([]);
  });

  test('preserves valid groups and tips', () => {
    const result = SmartEatingContent._normalizeAlternativesGrouped({
      groups: [{ original: 'X' }],
      tips: ['Tip 1'],
    });
    expect(result.groups).toHaveLength(1);
    expect(result.tips).toContain('Tip 1');
  });
});

describe('SmartEatingContent — fetchSnackingContent()', () => {
  test('returns EMPTY_SNACKING_CONTENT on network error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await SmartEatingContent.fetchSnackingContent();
    expect(result.success).toBe(false);
    expect(result.data.corePrinciples).toEqual([]);
    expect(result.data.snackIdeas).toEqual([]);
  });

  test('returns EMPTY_SNACKING_CONTENT when API returns success: false', async () => {
    axios.get.mockResolvedValue({ data: { success: false, data: {} } });
    const result = await SmartEatingContent.fetchSnackingContent();
    expect(result.success).toBe(false);
    expect(result.data.corePrinciples).toEqual([]);
  });

  test('returns populated content when API returns valid data', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: {
          corePrinciples: ['Eat slowly'],
          managingCravings: ['Drink water'],
          whenToSnack: ['Between meals'],
          snackIdeas: [{ name: 'Apple', timing: 'Morning' }],
          portionControl: { visualGuides: ['Use a plate'], prePortioningStrategies: ['Meal prep'] },
          warningSign: { title: 'Warning', intro: 'Watch out:', signs: ['Stress eating'], footer: 'Seek help' },
        },
      },
    });
    const result = await SmartEatingContent.fetchSnackingContent();
    expect(result.success).toBe(true);
    expect(result.data.corePrinciples).toEqual(['Eat slowly']);
    expect(result.data.snackIdeas).toHaveLength(1);
  });
});

describe('SmartEatingContent — fetchFoodAlternativesGrouped()', () => {
  test('returns EMPTY_ALTERNATIVES_GROUPED on network error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await SmartEatingContent.fetchFoodAlternativesGrouped();
    expect(result.success).toBe(false);
    expect(result.data.groups).toEqual([]);
    expect(result.data.tips).toEqual([]);
  });

  test('returns normalized groups and tips when API succeeds', async () => {
    axios.get.mockResolvedValue({
      data: {
        success: true,
        data: { groups: [{ original: 'Chips', alternatives: [] }], tips: ['Eat slowly'] },
      },
    });
    const result = await SmartEatingContent.fetchFoodAlternativesGrouped();
    expect(result.success).toBe(true);
    expect(result.data.groups).toHaveLength(1);
    expect(result.data.tips).toContain('Eat slowly');
  });
});
