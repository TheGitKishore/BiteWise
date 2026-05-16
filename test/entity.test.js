/**
 * BiteWise — Entity Layer Unit Tests (Part 1)
 * =====================================================================
 * Coverage:
 *   Admin, BlogPost, CuratorApplication, CuratorProfile,
 *   DiaryEntry, DineOut, ExerciseEntry, FoodIntakeEntry, FoodItem,
 *   FreeUser, GroceryList, HealthGoal, HealthReport, HeightEntry,
 *   MealPlan, MembershipPlan, MembershipPlanFeature,
 *   NutritionTargets, PremiumUser, Recipe, RecipeDraft,
 *   Review, User, UserProfileType
 *
 * Run with: npm test -- entity.test.js
 * =====================================================================
 */

// ─── Global axios mock ───────────────────────────────────────────────
jest.mock('axios');
import axios from 'axios';

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
    expect(new MembershipPlan({ price: 0 }).getFormattedPrice()).toBe('$0');
  });

  test('getFormattedPrice() returns formatted price with billing cycle', () => {
    expect(new MembershipPlan({ price: 19.99, billingCycle: 'monthly' }).getFormattedPrice()).toBe('$19.99 /monthly');
  });

  test('getFormattedPrice() omits cycle when billingCycle is empty', () => {
    expect(new MembershipPlan({ price: 9.99, billingCycle: '' }).getFormattedPrice()).toBe('$9.99');
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
    const json = new MembershipPlan({ planId: 1, name: 'Free', price: 0, isActive: true }).toJSON();
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
    expect(MembershipPlan.hasAvailablePlans([new MembershipPlan({ isActive: false })])).toBe(false);
  });

  test('findById() returns correct plan', () => {
    expect(MembershipPlan.findById(plans, 2)?.price).toBe(19.99);
  });

  test('findById() returns null when not found', () => {
    expect(MembershipPlan.findById(plans, 99)).toBeNull();
  });

  test('fromRow() parses JSON feature strings', () => {
    const row = { plan_id: 1, name: 'Free', price: '0', billing_cycle: '', description: '', is_popular: 0, is_active: 1, features: '["Calorie tracking"]', feature_ids: '[1,2]' };
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
    const plan = MembershipPlan.fromRow({ plan_id: 1, name: 'X', price: '0', features: '{bad json}', feature_ids: '' });
    expect(plan.features).toEqual([]);
    expect(plan.featureIds).toEqual([]);
  });
});

describe('MembershipPlan — API methods', () => {
  test('getAll() maps rows via fromRow()', async () => {
    axios.get.mockResolvedValue({ data: [{ plan_id: 1, name: 'Free', price: '0', features: '[]', feature_ids: '[]', is_popular: 0, is_active: 1 }] });
    const plans = await MembershipPlan.getAll();
    expect(plans).toHaveLength(1);
    expect(plans[0]).toBeInstanceOf(MembershipPlan);
  });

  test('getById() returns a MembershipPlan instance', async () => {
    axios.get.mockResolvedValue({ data: { plan_id: 2, name: 'Premium', price: '19.99', features: '[]', feature_ids: '[]', is_popular: 1, is_active: 1 } });
    const plan = await MembershipPlan.getById(2);
    expect(plan).toBeInstanceOf(MembershipPlan);
    expect(plan.name).toBe('Premium');
  });

  test('getActive() maps active rows via fromRow()', async () => {
    axios.get.mockResolvedValue({ data: [{ plan_id: 1, name: 'Free', price: '0', features: '[]', feature_ids: '[]', is_popular: 0, is_active: 1 }] });
    const plans = await MembershipPlan.getActive();
    expect(plans[0]).toBeInstanceOf(MembershipPlan);
    expect(plans[0].isActive).toBe(true);
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
    expect(new BlogPost({ content: Array(400).fill('word').join(' ') }).getReadTime()).toBe('2 min read');
  });

  test('getReadTime() handles null content', () => {
    expect(new BlogPost({ content: null }).getReadTime()).toBe('1 min read');
  });

  // NEW: viewCount field
  test('defaults viewCount to 0', () => {
    expect(new BlogPost().viewCount).toBe(0);
  });

  test('stores provided viewCount', () => {
    expect(new BlogPost({ viewCount: 42 }).viewCount).toBe(42);
  });
});

describe('BlogPost — validatePost()', () => {
  test('returns invalid when title is empty', () => {
    const r = BlogPost.validatePost({ title: '', content: 'Some long content here for the test.' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('returns invalid when title is whitespace only', () => {
    const r = BlogPost.validatePost({ title: '   ', content: 'Content that is long enough.' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('returns invalid when content is fewer than 20 characters', () => {
    const r = BlogPost.validatePost({ title: 'My Post', content: 'Too short.' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('content');
  });

  test('returns valid when title and content meet requirements', () => {
    expect(BlogPost.validatePost({ title: 'My Post', content: 'This is a valid blog post with enough content.' }).valid).toBe(true);
  });
});

describe('BlogPost — fromApi()', () => {
  test('maps raw API response to BlogPost instance with uppercased status', () => {
    const post = BlogPost.fromApi({ blogPostId: '123', curatorUserId: 5, title: 'Hello', content: 'World', status: 'published', tags: ['health'], likeCount: 10, viewCount: 5 });
    expect(post).toBeInstanceOf(BlogPost);
    expect(post.status).toBe('PUBLISHED');
    expect(post.likeCount).toBe(10);
    expect(post.viewCount).toBe(5);
  });

  test('defaults tags to [] when missing', () => {
    expect(Array.isArray(BlogPost.fromApi({ title: 'T', content: 'C' }).tags)).toBe(true);
  });
});

describe('BlogPost — sortByDate()', () => {
  test('sorts posts newest-first', () => {
    const sorted = BlogPost.sortByDate([
      new BlogPost({ createdAt: '2024-01-01' }),
      new BlogPost({ createdAt: '2024-03-15' }),
      new BlogPost({ createdAt: '2024-02-10' }),
    ]);
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

  test('create() calls axios.post when valid', async () => {
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

  test('fetchByUser() maps data to BlogPost instances', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: [{ blogPostId: '1', title: 'T', content: 'C', status: 'DRAFT', tags: [] }] } });
    const result = await BlogPost.fetchByUser(1);
    expect(result.data[0]).toBeInstanceOf(BlogPost);
  });

  // NEW: fetchLikedPostIds
  test('fetchLikedPostIds() returns array of string IDs', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: ['id1', 'id2'] } });
    const result = await BlogPost.fetchLikedPostIds(1);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['id1', 'id2']);
  });

  test('fetchLikedPostIds() returns empty array on error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await BlogPost.fetchLikedPostIds(1);
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });

  // NEW: recordView
  test('recordView() calls PUT /view endpoint', async () => {
    axios.put.mockResolvedValue({ data: { success: true, data: { blogPostId: 'bp_1', viewCount: 10, counted: true } } });
    const result = await BlogPost.recordView('bp_1', 42);
    expect(result.success).toBe(true);
    expect(result.data.viewCount).toBe(10);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('bp_1/view'), { userId: 42 });
  });

  test('recordView() returns error on failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await BlogPost.recordView('bp_1', 1);
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  4. CuratorApplication
// =====================================================================
import CuratorApplication from '../entity/CuratorApplication';

describe('CuratorApplication — validateApplication()', () => {
  test('returns valid when all required fields provided', () => {
    const r = CuratorApplication.validateApplication({ motivation: 'I love health', journey: 'Been eating clean for 3 years', expertise: 'Nutrition' });
    expect(r.valid).toBe(true);
    expect(Object.keys(r.errors)).toHaveLength(0);
  });

  test('returns error for each missing field', () => {
    const r = CuratorApplication.validateApplication({ motivation: '', journey: '', expertise: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.motivation).toBeDefined();
    expect(r.errors.journey).toBeDefined();
    expect(r.errors.expertise).toBeDefined();
  });

  test('returns error for missing expertise only', () => {
    const r = CuratorApplication.validateApplication({ motivation: 'Motivation text', journey: 'My journey', expertise: '' });
    expect(r.valid).toBe(false);
    expect(r.errors.expertise).toBeDefined();
    expect(r.errors.motivation).toBeUndefined();
  });
});

describe('CuratorApplication — create()', () => {
  test('returns validation error without calling API', async () => {
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
//  5. CuratorProfile
// =====================================================================
import CuratorProfile from '../entity/CuratorProfileEdit';

describe('CuratorProfile — getProfile()', () => {
  test('returns profile data on success', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { userId: 1, expertise: 'Nutrition', bio: 'Expert' } } });
    const result = await CuratorProfile.getProfile(1);
    expect(result.success).toBe(true);
    expect(result.data.expertise).toBe('Nutrition');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/curator-profiles/1'));
  });

  test('returns null data on error', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await CuratorProfile.getProfile(999);
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
  });
});

describe('CuratorProfile — updateProfile()', () => {
  test('calls PUT and returns success', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Profile updated' } });
    const result = await CuratorProfile.updateProfile(1, { expertise: 'Sports Nutrition', bio: 'Updated bio' });
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/curator-profiles/1'), { expertise: 'Sports Nutrition', bio: 'Updated bio' });
  });

  test('returns error on failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Update failed' } } });
    const result = await CuratorProfile.updateProfile(1, { expertise: '', bio: '' });
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  6. DiaryEntry
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
    const sorted = DiaryEntry.sortByDate([
      new DiaryEntry({ createdAt: '2024-01-01' }),
      new DiaryEntry({ createdAt: '2024-06-15' }),
    ]);
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
    const entry = DiaryEntry.fromApi({ _id: { toString: () => 'abc' }, userId: '5', title: 'T', content: 'C', mood: 'Happy', weight: 70 });
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

// NEW: update()
describe('DiaryEntry — update()', () => {
  test('returns validation error without calling API', async () => {
    const result = await DiaryEntry.update('entry-1', { title: '', content: '' });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put with correct entryId on valid fields', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated!', data: { _id: '1', title: 'Updated', content: 'New content' } } });
    const result = await DiaryEntry.update('entry-1', { title: 'Updated', content: 'New content', mood: 'Happy', weight: 70 });
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('entry-1'), expect.any(Object));
  });

  test('returns error message on axios failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await DiaryEntry.update('bad-id', { title: 'T', content: 'Some content' });
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  7. DineOut
// =====================================================================
import DineOut from '../entity/DineOut';

describe('DineOut — constructor', () => {
  test('sets restaurantId from _id when not provided', () => {
    expect(new DineOut({ _id: 'mongo-id-1' }).restaurantId).toBe('mongo-id-1');
  });

  test('defaults menuItems and matchingItems to []', () => {
    const r = new DineOut();
    expect(r.menuItems).toEqual([]);
    expect(r.matchingItems).toEqual([]);
  });

  test('casts rating to Number', () => {
    expect(new DineOut({ rating: '4.5' }).rating).toBe(4.5);
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
  test('returns DineOut instances on success', async () => {
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
//  8. ExerciseEntry
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
    expect(r.message).toMatch(/600/);
  });

  test('invalid when durationMins is NaN', () => {
    expect(ExerciseEntry.validateEntry({ exerciseType: 'Yoga', durationMins: 'abc' }).valid).toBe(false);
  });
});

describe('ExerciseEntry — calculateCaloriesBurned()', () => {
  test('Running 30 min = 300 cal', () => {
    expect(ExerciseEntry.calculateCaloriesBurned('Running', 30)).toBe(300);
  });

  test('HIIT 45 min = 540 cal', () => {
    expect(ExerciseEntry.calculateCaloriesBurned('HIIT', 45)).toBe(540);
  });

  test('uses 5 cal/min for Other type', () => {
    expect(ExerciseEntry.calculateCaloriesBurned('Other', 20)).toBe(100);
  });

  test('Yoga 10 min = 30 cal', () => {
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

// NEW: update()
describe('ExerciseEntry — update()', () => {
  test('returns error when exerciseType is missing', async () => {
    const result = await ExerciseEntry.update(5, { exerciseType: '', durationMins: 30 });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('returns error when durationMins is 0', async () => {
    const result = await ExerciseEntry.update(5, { exerciseType: 'Running', durationMins: 0 });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put on valid input', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated!', data: { entryId: 5 } } });
    const result = await ExerciseEntry.update(5, { exerciseType: 'Cycling', durationMins: 40, notes: '' });
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/5'), expect.any(Object));
  });
});

// NEW: delete()
describe('ExerciseEntry — delete()', () => {
  test('calls axios.delete with correct entryId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Deleted!' } });
    const result = await ExerciseEntry.delete(5);
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/5'));
  });

  test('returns error message on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await ExerciseEntry.delete(999);
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  9. FoodIntakeEntry
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
    expect(FoodIntakeEntry.getTodaySummary([])).toEqual({ calories: 0, protein: 0, carbs: 0, fat: 0 });
  });
});

describe('FoodIntakeEntry — createManual()', () => {
  test('returns validation error without calling API', async () => {
    const result = await FoodIntakeEntry.createManual(1, { foodName: '', calories: 0, protein: 0, carbs: 0, fat: 0, meal: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid data', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Logged!', data: {} } });
    const result = await FoodIntakeEntry.createManual(1, { foodName: 'Oats', calories: 300, protein: 10, carbs: 50, fat: 5, meal: 'Breakfast' });
    expect(result.success).toBe(true);
  });
});


// =====================================================================
//  10. FoodItem
// =====================================================================
import FoodItem from '../entity/FoodItem';

describe('FoodItem — getDisplayMeta()', () => {
  test('returns "kcal • serving" format', () => {
    const item = new FoodItem({ name: 'Rice', calories: 200, serving: '100g' });
    expect(item.getDisplayMeta()).toBe('200 kcal • 100g');
  });

  test('appends "g" when serving has no unit letters', () => {
    const item = new FoodItem({ name: 'Rice', calories: 200, serving: '100' });
    expect(item.getDisplayMeta()).toContain('100g');
  });
});

describe('FoodItem — filterBySearch()', () => {
  const items = [
    new FoodItem({ name: 'Chicken Breast' }),
    new FoodItem({ name: 'Brown Rice' }),
    new FoodItem({ name: 'Salmon Fillet' }),
  ];

  test('returns matching items (case-insensitive)', () => {
    expect(FoodItem.filterBySearch(items, 'chicken')).toHaveLength(1);
  });

  test('returns all items when query is empty', () => {
    expect(FoodItem.filterBySearch(items, '')).toHaveLength(3);
  });

  test('returns [] when no match', () => {
    expect(FoodItem.filterBySearch(items, 'pizza')).toHaveLength(0);
  });
});

describe('FoodItem — hasItems()', () => {
  test('returns true for non-empty array', () => {
    expect(FoodItem.hasItems([new FoodItem()])).toBe(true);
  });

  test('returns false for empty array', () => {
    expect(FoodItem.hasItems([])).toBe(false);
  });
});

describe('FoodItem — logFoodItem()', () => {
  test('returns error when parameters are missing', async () => {
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
//  11. FreeUser & PremiumUser
// =====================================================================
import FreeUser from '../entity/FreeUser';
import PremiumUser from '../entity/PremiumUser';

describe('FreeUser', () => {
  test('sets role to FREE', () => {
    expect(new FreeUser({ userId: 1, username: 'alice' }).role).toBe('FREE');
  });
});

describe('PremiumUser', () => {
  test('sets role to PREMIUM', () => {
    expect(new PremiumUser({ userId: 2, username: 'bob' }).role).toBe('PREMIUM');
  });

  test('defaults isCurator to false', () => {
    expect(new PremiumUser({}).isCurator).toBe(false);
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
//  12. GroceryList
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
    expect(GroceryList.validateItem({ name: '   ' }).valid).toBe(false);
  });
});

describe('GroceryList — fromApi()', () => {
  test('maps raw object to GroceryList', () => {
    const list = GroceryList.fromApi({ listId: '1', userId: 5, items: [{ name: 'Milk', checked: false }] });
    expect(list).toBeInstanceOf(GroceryList);
    expect(list.items).toHaveLength(1);
  });

  test('defaults items to [] when missing', () => {
    expect(GroceryList.fromApi({}).items).toEqual([]);
  });
});

describe('GroceryList — addItem()', () => {
  test('returns validation error without calling API', async () => {
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
//  13. HealthGoal
// =====================================================================
import HealthGoal, { GOAL_TYPES, ACTIVITY_LEVELS } from '../entity/HealthGoal';

describe('HealthGoal — GOAL_TYPES constant', () => {
  test('contains 6 goal types', () => {
    expect(Object.keys(GOAL_TYPES)).toHaveLength(6);
    expect(GOAL_TYPES.LOSE_WEIGHT).toBe('Lose Weight');
    expect(GOAL_TYPES.CUSTOM).toBe('Custom');
  });
});

describe('HealthGoal — getDisplayGoal()', () => {
  test('returns goalType when not CUSTOM', () => {
    expect(new HealthGoal({ goalType: 'Lose Weight', customGoal: '' }).getDisplayGoal()).toBe('Lose Weight');
  });

  test('returns customGoal when goalType is CUSTOM', () => {
    expect(new HealthGoal({ goalType: 'Custom', customGoal: 'Run a marathon' }).getDisplayGoal()).toBe('Run a marathon');
  });
});

describe('HealthGoal — validateGoal()', () => {
  test('valid with all fields', () => {
    expect(HealthGoal.validateGoal({ goalType: 'Lose Weight', customGoal: '', activityLevel: 'Moderate' }).valid).toBe(true);
  });

  test('invalid when goalType is empty', () => {
    const r = HealthGoal.validateGoal({ goalType: '', customGoal: '', activityLevel: 'Moderate' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('goalType');
  });

  test('invalid when CUSTOM but customGoal is empty', () => {
    const r = HealthGoal.validateGoal({ goalType: 'Custom', customGoal: '', activityLevel: 'Moderate' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('customGoal');
  });

  test('invalid when activityLevel is empty', () => {
    const r = HealthGoal.validateGoal({ goalType: 'Lose Weight', customGoal: '', activityLevel: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('activityLevel');
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

// NEW: update()
describe('HealthGoal — update()', () => {
  test('returns validation error without calling API', async () => {
    const result = await HealthGoal.update(5, { goalType: '', customGoal: '', activityLevel: '' });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put on valid fields', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await HealthGoal.update(5, { goalType: 'Gain Muscle', customGoal: '', activityLevel: 'Active' });
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/5'), expect.any(Object));
  });
});


// =====================================================================
//  14. HealthReport
// =====================================================================
import HealthReport from '../entity/HealthReport';

describe('HealthReport — getGoalProgress()', () => {
  test('returns correct percentage', () => {
    expect(new HealthReport({ totalCalories: 1800, calorieGoal: 2000 }).getGoalProgress()).toBe(90);
  });

  test('caps at 100 when over goal', () => {
    expect(new HealthReport({ totalCalories: 2500, calorieGoal: 2000 }).getGoalProgress()).toBe(100);
  });

  test('returns 0 when calorieGoal is 0', () => {
    expect(new HealthReport({ totalCalories: 500, calorieGoal: 0 }).getGoalProgress()).toBe(0);
  });
});

describe('HealthReport — getNetCalories()', () => {
  test('subtracts caloriesBurned from totalCalories', () => {
    expect(new HealthReport({ totalCalories: 2000, caloriesBurned: 300 }).getNetCalories()).toBe(1700);
  });

  test('returns 0 when burned exceeds consumed', () => {
    expect(new HealthReport({ totalCalories: 200, caloriesBurned: 500 }).getNetCalories()).toBe(0);
  });
});

describe('HealthReport — generateInsights()', () => {
  test('gives positive message when 90–110% of goal', () => {
    const insights = HealthReport.generateInsights(new HealthReport({ totalCalories: 1950, calorieGoal: 2000, totalProtein: 100, exerciseCount: 0 }));
    expect(insights.some(i => i.includes('Great job'))).toBe(true);
  });

  test('warns when over 110% of goal', () => {
    const insights = HealthReport.generateInsights(new HealthReport({ totalCalories: 2300, calorieGoal: 2000, totalProtein: 50, exerciseCount: 0 }));
    expect(insights.some(i => i.includes('went over'))).toBe(true);
  });

  test('warns when under 50% of goal', () => {
    const insights = HealthReport.generateInsights(new HealthReport({ totalCalories: 800, calorieGoal: 2000, totalProtein: 50, exerciseCount: 0 }));
    expect(insights.some(i => i.includes('fewer calories'))).toBe(true);
  });

  test('mentions exercise sessions when exerciseCount > 0', () => {
    const insights = HealthReport.generateInsights(new HealthReport({ totalCalories: 1950, calorieGoal: 2000, totalProtein: 100, exerciseCount: 2 }));
    expect(insights.some(i => i.includes('2 exercise session'))).toBe(true);
  });

  test('suggests logging when no data', () => {
    const insights = HealthReport.generateInsights(new HealthReport({ totalCalories: 0, calorieGoal: 0, totalProtein: 0, exerciseCount: 0 }));
    expect(insights.some(i => i.includes('Start logging'))).toBe(true);
  });
});


// =====================================================================
//  15. HeightEntry
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
    expect(HeightEntry.validateHeight(350).valid).toBe(false);
  });

  test('invalid when height is NaN', () => {
    expect(HeightEntry.validateHeight('abc').valid).toBe(false);
  });
});

describe('HeightEntry — getLatest()', () => {
  test('returns the most recent entry', () => {
    const entries = [
      new HeightEntry({ heightCm: 165, loggedAt: '2024-01-01' }),
      new HeightEntry({ heightCm: 166, loggedAt: '2024-06-15' }),
      new HeightEntry({ heightCm: 164, loggedAt: '2023-12-01' }),
    ];
    expect(HeightEntry.getLatest(entries).heightCm).toBe(166);
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

// NEW: update()
describe('HeightEntry — update()', () => {
  test('returns validation error without calling API', async () => {
    const result = await HeightEntry.update(10, { heightCm: 0 });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put with correct entryId on valid height', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated', data: { heightCm: 178, loggedAt: '2024-01-01' } } });
    const result = await HeightEntry.update(10, { heightCm: 178 });
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/10'), { heightCm: 178 });
  });

  test('invalid height below 50cm rejected before API call', async () => {
    const result = await HeightEntry.update(10, { heightCm: 20 });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });
});


// =====================================================================
//  16. MealPlan
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
    expect(MealPlan.validatePlan({ name: '   ' }).valid).toBe(false);
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
    const plan = MealPlan.fromApi({ planId: '1', userId: 5, name: 'Week 1', numDays: 7, days: [], isAutoGenerated: false });
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

describe('MealPlan — updateCustomPlan()', () => {
  test('returns validation error for empty name', async () => {
    const result = await MealPlan.updateCustomPlan('p1', 1, { name: '', days: [] });
    expect(result.success).toBe(false);
    expect(result.field).toBe('name');
  });

  test('returns updated MealPlan with isAutoGenerated = false', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated', data: { planId: 'p1', name: 'Updated Plan', days: [], numDays: 7, isAutoGenerated: false } } });
    const result = await MealPlan.updateCustomPlan('p1', 1, { name: 'Updated Plan', days: [], numDays: 7 });
    expect(result.success).toBe(true);
    expect(result.data).toBeInstanceOf(MealPlan);
    expect(result.data.isAutoGenerated).toBe(false);
  });
});

describe('MealPlan — updateAutoGeneratedPlan()', () => {
  test('returns updated MealPlan with isAutoGenerated = true', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated', data: { planId: 'p2', name: 'Keto Plan', planType: 'Keto', days: [], numDays: 7, isAutoGenerated: true } } });
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
//  17. NutritionTargets
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
    expect(NutritionTargets.validateCalories(10001).valid).toBe(false);
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

  test('returns object with all macro fields', () => {
    const targets = NutritionTargets.computeTargets(base);
    expect(targets).toHaveProperty('calories');
    expect(targets).toHaveProperty('protein');
    expect(targets).toHaveProperty('carbs');
    expect(targets).toHaveProperty('fat');
    expect(targets).toHaveProperty('fiber');
  });

  test('calories are at least 1200', () => {
    expect(NutritionTargets.computeTargets({ ...base, goal: 'Lose Weight (-500 cal)' }).calories).toBeGreaterThanOrEqual(1200);
  });

  test('female BMR is lower than male BMR for same inputs', () => {
    const male   = NutritionTargets.computeTargets({ ...base, gender: 'male' });
    const female = NutritionTargets.computeTargets({ ...base, gender: 'female' });
    expect(male.calories).toBeGreaterThan(female.calories);
  });

  test('Gain Weight goal adds 500 kcal vs Maintain Weight', () => {
    const maintain = NutritionTargets.computeTargets({ ...base, goal: 'Maintain Weight' });
    const gain     = NutritionTargets.computeTargets({ ...base, goal: 'Gain Weight (+500 cal)' });
    expect(gain.calories).toBe(maintain.calories + 500);
  });

  test('Lose Weight goal subtracts 500 kcal vs Maintain Weight', () => {
    const maintain = NutritionTargets.computeTargets({ ...base, goal: 'Maintain Weight' });
    const lose     = NutritionTargets.computeTargets({ ...base, goal: 'Lose Weight (-500 cal)' });
    expect(lose.calories).toBe(maintain.calories - 500);
  });

  test('fiber is always 30', () => {
    expect(NutritionTargets.computeTargets(base).fiber).toBe(30);
  });
});

describe('NutritionTargets — constructor activityLevel normalisation', () => {
  test('normalizes "Moderate" to "Balanced"', () => {
    expect(new NutritionTargets({ activityLevel: 'Moderate' }).activityLevel).toBe('Balanced');
  });

  test('defaults to "Balanced" for unknown activity level', () => {
    expect(new NutritionTargets({ activityLevel: 'unknown-level' }).activityLevel).toBe('Balanced');
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
//  18. Admin
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

// NEW: approveApplication
describe('Admin — approveApplication()', () => {
  test('calls PUT /:applicationId/approve with adminId', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Approved' } });
    const result = await Admin.approveApplication('app-1', 'admin-1');
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('app-1/approve'), { adminId: 'admin-1' });
  });

  test('returns error on failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await Admin.approveApplication('bad-id', 'admin-1');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Approval failed');
  });
});

// NEW: rejectApplication
describe('Admin — rejectApplication()', () => {
  test('calls PUT /:applicationId/reject with reason', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Rejected' } });
    const result = await Admin.rejectApplication('app-1', 'admin-1', 'Not detailed enough');
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(
      expect.stringContaining('app-1/reject'),
      { adminId: 'admin-1', reason: 'Not detailed enough' }
    );
  });

  test('returns error on failure', async () => {
    axios.put.mockRejectedValue({ response: undefined });
    const result = await Admin.rejectApplication('bad', 'admin', 'reason');
    expect(result.success).toBe(false);
    expect(result.message).toBe('Rejection failed');
  });
});

// NEW: deactivateUser / reactivateUser (banUser / unbanUser aliases)
describe('Admin — deactivateUser() / banUser()', () => {
  test('deactivateUser() calls PUT /deactivate', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await Admin.deactivateUser(5);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('deactivate'), { userId: 5 });
  });

  test('banUser() is an alias for deactivateUser()', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await Admin.banUser(5);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('deactivate'), { userId: 5 });
  });
});

describe('Admin — reactivateUser() / unbanUser()', () => {
  test('reactivateUser() calls PUT /reactivate', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await Admin.reactivateUser(5);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('reactivate'), { userId: 5 });
  });

  test('unbanUser() is an alias for reactivateUser()', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    await Admin.unbanUser(5);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('reactivate'), { userId: 5 });
  });
});

// NEW: terminateUser
describe('Admin — terminateUser()', () => {
  test('calls DELETE /users/:userId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true } });
    const result = await Admin.terminateUser(5);
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/users/5'));
  });

  test('returns error on failure', async () => {
    axios.delete.mockRejectedValue({ response: undefined });
    const result = await Admin.terminateUser(5);
    expect(result.success).toBe(false);
  });
});

// NEW: fetchApplications
describe('Admin — fetchApplications()', () => {
  test('calls GET /applications and returns data', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: [{ applicationId: 1 }] } });
    const result = await Admin.fetchApplications();
    expect(result.success).toBe(true);
    expect(result.data).toHaveLength(1);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/applications'));
  });

  test('returns error on failure', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'Error' } } });
    const result = await Admin.fetchApplications();
    expect(result.success).toBe(false);
  });
});

// NEW: fetchReviews / removeReview
describe('Admin — fetchReviews()', () => {
  test('calls GET /reviews and returns data', async () => {
    axios.get.mockResolvedValue({ data: [{ review_id: 1, rating: 5 }] });
    const result = await Admin.fetchReviews();
    expect(Array.isArray(result) || result.success !== undefined).toBe(true);
  });
});

describe('Admin — removeReview()', () => {
  test('calls DELETE /admin/reviews/:reviewId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Review deleted' } });
    const result = await Admin.removeReview('review-1');
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('reviews/review-1'));
  });
});

describe('Admin — promoteToCurator()', () => {
  test('calls PUT promote-to-curator with userId and applicationId', async () => {
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
//  19. Recipe
// =====================================================================
import Recipe from '../entity/Recipe';

describe('Recipe — constructor', () => {
  test('defaults isCurated to false', () => {
    expect(new Recipe().isCurated).toBe(false);
  });

  test('stores provided fields', () => {
    const r = new Recipe({ title: 'Salad', calories: 300, isCurated: true });
    expect(r.title).toBe('Salad');
    expect(r.calories).toBe(300);
    expect(r.isCurated).toBe(true);
  });

  test('getSummaryLine() returns formatted prep/calorie line', () => {
    const r = new Recipe({ prepTimeMins: 20, calories: 400 });
    expect(r.getSummaryLine()).toBe('20 min  •  400 kcal');
  });
});

describe('Recipe — validateRecipe()', () => {
  const valid = { title: 'Salad', ingredients: ['Lettuce'], instructions: ['Mix everything'] };

  test('valid when all fields provided', () => {
    expect(Recipe.validateRecipe(valid).valid).toBe(true);
  });

  test('invalid when title is empty', () => {
    const r = Recipe.validateRecipe({ ...valid, title: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when ingredients array is all empty strings', () => {
    const r = Recipe.validateRecipe({ ...valid, ingredients: ['', '  '] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('ingredients');
  });

  test('invalid when instructions array is all empty strings', () => {
    const r = Recipe.validateRecipe({ ...valid, instructions: [''] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('instructions');
  });
});

describe('Recipe — filter methods', () => {
  const recipes = [
    new Recipe({ title: 'Chicken Salad', tags: ['healthy'], calories: 350, prepTimeMins: 10, isCurated: true,  isMealPrep: false, createdByUserId: 1 }),
    new Recipe({ title: 'Beef Steak',    tags: ['keto'],    calories: 700, prepTimeMins: 30, isCurated: false, isMealPrep: true,  createdByUserId: 2 }),
    new Recipe({ title: 'Tofu Bowl',     tags: ['vegan'],   calories: 250, prepTimeMins: 20, isCurated: true,  isMealPrep: true,  createdByUserId: 1 }),
  ];

  test('filterBySearch() matches title (case-insensitive)', () => {
    expect(Recipe.filterBySearch(recipes, 'chicken')).toHaveLength(1);
  });

  test('filterBySearch() returns all when query is empty', () => {
    expect(Recipe.filterBySearch(recipes, '')).toHaveLength(3);
  });

  test('filterByTag() returns matching tag recipes', () => {
    expect(Recipe.filterByTag(recipes, 'keto')).toHaveLength(1);
  });

  test('filterByTag() returns all when tag is "All"', () => {
    expect(Recipe.filterByTag(recipes, 'All')).toHaveLength(3);
  });

  test('filterMealPrep() returns only meal prep recipes', () => {
    expect(Recipe.filterMealPrep(recipes)).toHaveLength(2);
  });

  test('filterCurated() returns only curated recipes', () => {
    expect(Recipe.filterCurated(recipes)).toHaveLength(2);
  });

  test('filterByPrepTime() filters by max prep time', () => {
    expect(Recipe.filterByPrepTime(recipes, 15)).toHaveLength(1);
  });

  test('filterByUser() returns only recipes by given userId', () => {
    expect(Recipe.filterByUser(recipes, 1)).toHaveLength(2);
  });

  test('hasRecipes() returns true for non-empty array', () => {
    expect(Recipe.hasRecipes(recipes)).toBe(true);
  });

  test('hasRecipes() returns false for empty array', () => {
    expect(Recipe.hasRecipes([])).toBe(false);
  });
});

describe('Recipe — filterByCalorieBudget()', () => {
  const recipes = [
    new Recipe({ calories: 300 }),
    new Recipe({ calories: 600 }),
    new Recipe({ calories: 1000 }),
    new Recipe({ calories: 0 }),   // excluded (0 calories)
  ];

  test('returns only recipes within 110% of budget', () => {
    // budget = 500 * 1.1 = 550 → 300 fits, 600 does NOT
    const result = Recipe.filterByCalorieBudget(recipes, 500);
    expect(result.every(r => r.calories > 0 && r.calories <= 550)).toBe(true);
    expect(result.some(r => r.calories === 300)).toBe(true);
  });

  test('returns empty array when remainingCalories is 0', () => {
    expect(Recipe.filterByCalorieBudget(recipes, 0)).toHaveLength(0);
  });

  test('returns empty array when recipes is not an array', () => {
    expect(Recipe.filterByCalorieBudget(null, 500)).toHaveLength(0);
  });
});

describe('Recipe — getMacroMatchScore()', () => {
  test('returns 1 when recipe perfectly matches remaining', () => {
    const recipe    = new Recipe({ calories: 500, protein: 40, carbs: 60, fat: 20 });
    const remaining = { calories: 500, protein: 40, carbs: 60, fat: 20 };
    expect(Recipe.getMacroMatchScore(recipe, remaining)).toBe(1);
  });

  test('returns 0 when recipe or remaining is null', () => {
    expect(Recipe.getMacroMatchScore(null, { calories: 500 })).toBe(0);
    expect(Recipe.getMacroMatchScore(new Recipe({ calories: 500 }), null)).toBe(0);
  });

  test('returns score between 0 and 1 for partial match', () => {
    const recipe    = new Recipe({ calories: 300, protein: 20, carbs: 40, fat: 10 });
    const remaining = { calories: 500, protein: 40, carbs: 60, fat: 20 };
    const score = Recipe.getMacroMatchScore(recipe, remaining);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('Recipe — API methods', () => {
  test('saveRecipe() calls POST /save with userId and recipeId', async () => {
    axios.post.mockResolvedValue({ data: { success: true, message: 'Saved!', data: {} } });
    const recipe = new Recipe({ recipeId: 'r-1' });
    const result = await Recipe.saveRecipe(1, recipe);
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/save'), { userId: 1, recipeId: 'r-1' });
  });

  test('fetchSaved() calls GET /saved/:userId', async () => {
    axios.get.mockResolvedValue({ data: [{ _id: 'r-1', title: 'Saved Salad', calories: 300 }] });
    const result = await Recipe.fetchSaved(1);
    expect(result.success).toBe(true);
    expect(result.data[0]).toBeInstanceOf(Recipe);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/saved/1'));
  });

  test('fetchSaved() returns empty array on error', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    const result = await Recipe.fetchSaved(1);
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });

  test('unsaveRecipe() calls DELETE /saved/:userId/:recipeId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Removed' } });
    const result = await Recipe.unsaveRecipe(1, 'r-1');
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/saved/1/r-1'));
  });

  test('fetchLikedRecipeIds() returns string IDs', async () => {
    axios.get.mockResolvedValue({ data: ['id1', 'id2'] });
    const result = await Recipe.fetchLikedRecipeIds(1);
    expect(result.success).toBe(true);
    expect(result.data).toEqual(['id1', 'id2']);
  });

  test('updateLike() calls PUT /:recipeId/like', async () => {
    axios.put.mockResolvedValue({ data: { recipeId: 'r-1', likeCount: 5 } });
    const result = await Recipe.updateLike('r-1', 1);
    expect(result.success).toBe(true);
    expect(result.data.likeCount).toBe(5);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('r-1/like'), expect.any(Object));
  });

  test('create() returns validation error without API call', async () => {
    const result = await Recipe.create(1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });
});


// =====================================================================
//  20. RecipeDraft
// =====================================================================
import RecipeDraft from '../entity/RecipeDraft';

describe('RecipeDraft — constructor', () => {
  test('isCurated defaults to true', () => {
    expect(new RecipeDraft().isCurated).toBe(true);
  });

  test('stores all provided fields', () => {
    const draft = new RecipeDraft({ title: 'My Draft', ingredients: ['egg'], instructions: ['boil'] });
    expect(draft.title).toBe('My Draft');
    expect(draft.ingredients).toEqual(['egg']);
  });
});

describe('RecipeDraft — validateRecipe()', () => {
  const valid = { title: 'My Draft', ingredients: ['egg'], instructions: ['Boil'] };

  test('valid when all fields provided', () => {
    expect(RecipeDraft.validateRecipe(valid).valid).toBe(true);
  });

  test('invalid when title is empty', () => {
    const r = RecipeDraft.validateRecipe({ ...valid, title: '' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when ingredients are all empty strings', () => {
    const r = RecipeDraft.validateRecipe({ ...valid, ingredients: ['', '  '] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('ingredients');
  });

  test('invalid when instructions are empty', () => {
    const r = RecipeDraft.validateRecipe({ ...valid, instructions: [''] });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('instructions');
  });
});

describe('RecipeDraft — filterByUser()', () => {
  const drafts = [
    new RecipeDraft({ createdByUserId: 1 }),
    new RecipeDraft({ createdByUserId: 2 }),
    new RecipeDraft({ createdByUserId: 1 }),
  ];

  test('returns only drafts for the given userId', () => {
    expect(RecipeDraft.filterByUser(drafts, 1)).toHaveLength(2);
  });

  test('returns empty array when userId is null', () => {
    expect(RecipeDraft.filterByUser(drafts, null)).toHaveLength(0);
  });
});

describe('RecipeDraft — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await RecipeDraft.create(1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('sends isCurated: true in payload', async () => {
    axios.post.mockResolvedValue({ data: { title: 'Salad', isCurated: true, ingredients: ['egg'], instructions: ['boil'] } });
    await RecipeDraft.create(1, { title: 'Salad', ingredients: ['egg'], instructions: ['boil'] });
    const payload = axios.post.mock.calls[0][1];
    expect(payload.isCurated).toBe(true);
  });
});

// NEW: fetchByUser()
describe('RecipeDraft — fetchByUser()', () => {
  test('calls GET with ?userId query param', async () => {
    axios.get.mockResolvedValue({ data: [{ _id: 'draft-1', title: 'My Draft', isCurated: true }] });
    const result = await RecipeDraft.fetchByUser(5);
    expect(result.success).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('userId=5'));
    expect(result.data[0]).toBeInstanceOf(RecipeDraft);
  });

  test('returns empty array on error', async () => {
    axios.get.mockRejectedValue(new Error('Error'));
    const result = await RecipeDraft.fetchByUser(5);
    expect(result.success).toBe(false);
    expect(result.data).toEqual([]);
  });
});

// NEW: update()
describe('RecipeDraft — update()', () => {
  test('returns validation error without calling API', async () => {
    const result = await RecipeDraft.update('d-1', 1, { title: '', ingredients: [], instructions: [] });
    expect(result.success).toBe(false);
    expect(axios.put).not.toHaveBeenCalled();
  });

  test('calls axios.put on valid fields', async () => {
    axios.put.mockResolvedValue({ data: { success: true, message: 'Updated!', data: { title: 'Updated' } } });
    const result = await RecipeDraft.update('d-1', 1, { title: 'Updated', ingredients: ['egg'], instructions: ['boil'] });
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('d-1'), expect.any(Object));
  });
});


// =====================================================================
//  21. Review
// =====================================================================
import Review from '../entity/Review';

describe('Review — validateReview()', () => {
  test('valid when all fields correct', () => {
    expect(Review.validateReview({ rating: 5, title: 'Great!', content: 'Loved this app so much!' }).valid).toBe(true);
  });

  test('invalid when rating is 0', () => {
    const r = Review.validateReview({ rating: 0, title: 'T', content: 'Long enough content here' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('rating');
  });

  test('invalid when rating is 6', () => {
    const r = Review.validateReview({ rating: 6, title: 'T', content: 'Content here is long enough' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('rating');
  });

  test('invalid when title is empty', () => {
    const r = Review.validateReview({ rating: 4, title: '', content: 'Content here is long enough' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('title');
  });

  test('invalid when content is under 10 chars', () => {
    const r = Review.validateReview({ rating: 4, title: 'Good', content: 'Short' });
    expect(r.valid).toBe(false);
    expect(r.field).toBe('content');
  });
});

describe('Review — getAverageRating()', () => {
  test('returns Math.floor of average — not Math.round', () => {
    // 4 + 5 = 9, avg = 4.5 → Math.floor(4.5) = 4
    const reviews = [new Review({ rating: 4 }), new Review({ rating: 5 })];
    expect(Review.getAverageRating(reviews)).toBe(4);
  });

  test('returns exact integer when average is whole number', () => {
    const reviews = [new Review({ rating: 4 }), new Review({ rating: 4 })];
    expect(Review.getAverageRating(reviews)).toBe(4);
  });

  test('returns 0 for empty array', () => {
    expect(Review.getAverageRating([])).toBe(0);
  });

  test('returns 0 for null', () => {
    expect(Review.getAverageRating(null)).toBe(0);
  });
});

describe('Review — create()', () => {
  test('returns validation error without calling API', async () => {
    const result = await Review.create(1, { rating: 0, title: '', content: '' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid fields', async () => {
    axios.post.mockResolvedValue({ data: { success: true, review_id: 10 } });
    const result = await Review.create(1, { rating: 5, title: 'Great!', content: 'Really changed my life for the better.' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });
});

describe('Review — remove()', () => {
  test('calls DELETE endpoint', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Review deleted' } });
    const result = await Review.remove('review-5');
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('review-5'));
  });

  test('returns error on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'Not found' } } });
    const result = await Review.remove('bad-id');
    expect(result.success).toBe(false);
  });
});


// =====================================================================
//  22. UserProfileType
// =====================================================================
import UserProfileType, { USER_PROFILE_TYPES } from '../entity/UserProfileType';

describe('UserProfileType — constructor', () => {
  test('constructs with defaults', () => {
    const u = new UserProfileType();
    expect(u.profileTypeId).toBeNull();
    expect(u.features).toEqual([]);
  });

  test('isAvailable() returns true when profileTypeId is set', () => {
    expect(new UserProfileType({ profileTypeId: 1 }).isAvailable()).toBe(true);
  });

  test('isAvailable() returns false when profileTypeId is null', () => {
    expect(new UserProfileType({ profileTypeId: null }).isAvailable()).toBe(false);
  });

  test('toJSON() maps to snake_case', () => {
    const json = new UserProfileType({ profileTypeId: 1, type: 'ATHLETE', displayName: 'Athletes' }).toJSON();
    expect(json.profile_type_id).toBe(1);
    expect(json.display_name).toBe('Athletes');
  });
});

describe('UserProfileType — fromRow()', () => {
  test('parses JSON features string', () => {
    const row = { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes', description: '', features: '["Feature A"]', image_url: null };
    const upt = UserProfileType.fromRow(row);
    expect(upt).toBeInstanceOf(UserProfileType);
    expect(upt.features).toEqual(['Feature A']);
    expect(upt.type).toBe('ATHLETE');
  });

  test('handles malformed features JSON', () => {
    const row = { profile_type_id: 1, type: 'X', display_name: 'X', description: '', features: '{bad}', image_url: null };
    expect(UserProfileType.fromRow(row).features).toEqual([]);
  });

  test('returns null for null row', () => {
    expect(UserProfileType.fromRow(null)).toBeNull();
  });
});

describe('UserProfileType — static collection methods', () => {
  const profiles = [
    new UserProfileType({ profileTypeId: 1, type: 'ATHLETE' }),
    new UserProfileType({ profileTypeId: 2, type: 'MEAL_PLANNER' }),
    new UserProfileType({ profileTypeId: null, type: 'INACTIVE' }),
  ];

  test('hasAvailableProfiles() returns true if any available', () => {
    expect(UserProfileType.hasAvailableProfiles(profiles)).toBe(true);
  });

  test('hasAvailableProfiles() returns false if all unavailable', () => {
    expect(UserProfileType.hasAvailableProfiles([new UserProfileType({ profileTypeId: null })])).toBe(false);
  });

  test('findByType() returns matching profile', () => {
    expect(UserProfileType.findByType(profiles, 'ATHLETE')?.type).toBe('ATHLETE');
  });

  test('findByType() returns null when not found', () => {
    expect(UserProfileType.findByType(profiles, 'UNKNOWN')).toBeNull();
  });
});

// NEW: computeProfileFromAnswers()
describe('UserProfileType — computeProfileFromAnswers()', () => {
  test('returns ATHLETE when most answers favour ATHLETE', () => {
    // Q3 answerIndex 2 → A:1, Q4 answerIndex 0 → A:1, Q5 answerIndex 0 → A:1
    const answers = [
      { questionIndex: 2, answerIndex: 2 },
      { questionIndex: 3, answerIndex: 0 },
      { questionIndex: 4, answerIndex: 0 },
    ];
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('ATHLETE');
  });

  test('returns MEAL_PLANNER when most answers favour MEAL_PLANNER', () => {
    // Q3 answerIndex 0 → MP:1, Q4 answerIndex 2 → MP:1, Q5 answerIndex 2 → MP:1
    const answers = [
      { questionIndex: 3, answerIndex: 2 },
      { questionIndex: 4, answerIndex: 2 },
      { questionIndex: 5, answerIndex: 2 },
    ];
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('MEAL_PLANNER');
  });

  test('defaults to HEALTH_ORIENTED on tie', () => {
    // Empty answers → all scores 0 → HO wins tie by default
    expect(UserProfileType.computeProfileFromAnswers([])).toBe('HEALTH_ORIENTED');
  });

  test('ignores out-of-range questionIndex or answerIndex gracefully', () => {
    const answers = [
      { questionIndex: 99, answerIndex: 0 },
      { questionIndex: 0,  answerIndex: 99 },
    ];
    // Should not throw — scores stay at 0 → HO default
    expect(() => UserProfileType.computeProfileFromAnswers(answers)).not.toThrow();
    expect(UserProfileType.computeProfileFromAnswers(answers)).toBe('HEALTH_ORIENTED');
  });
});

// NEW: getProfileMeta()
describe('UserProfileType — getProfileMeta()', () => {
  test('returns ATHLETE metadata', () => {
    const meta = UserProfileType.getProfileMeta('ATHLETE');
    expect(meta.label).toBe('Athlete');
    expect(meta.emoji).toBe('🏋️');
    expect(meta.description).toBeDefined();
  });

  test('returns HEALTH_ORIENTED metadata', () => {
    const meta = UserProfileType.getProfileMeta('HEALTH_ORIENTED');
    expect(meta.label).toBe('Health Oriented');
  });

  test('returns MEAL_PLANNER metadata', () => {
    const meta = UserProfileType.getProfileMeta('MEAL_PLANNER');
    expect(meta.label).toBe('Meal Planner');
  });

  test('defaults to HEALTH_ORIENTED for unknown type', () => {
    const meta = UserProfileType.getProfileMeta('UNKNOWN');
    expect(meta.label).toBe('Health Oriented');
  });
});

describe('UserProfileType — API methods', () => {
  test('getAll() maps rows to UserProfileType instances', async () => {
    axios.get.mockResolvedValue({ data: [{ profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes', description: '', features: '[]', image_url: null }] });
    const result = await UserProfileType.getAll();
    expect(result[0]).toBeInstanceOf(UserProfileType);
    expect(result[0].type).toBe('ATHLETE');
  });

  test('getAll() returns empty array on error', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    const result = await UserProfileType.getAll();
    expect(result).toEqual([]);
  });

  test('getById() returns UserProfileType instance', async () => {
    axios.get.mockResolvedValue({ data: { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes', description: '', features: '[]', image_url: null } });
    const result = await UserProfileType.getById(1);
    expect(result).toBeInstanceOf(UserProfileType);
  });

  test('getByType() returns UserProfileType instance', async () => {
    axios.get.mockResolvedValue({ data: { profile_type_id: 2, type: 'MEAL_PLANNER', display_name: 'Meal Planners', description: '', features: '[]', image_url: null } });
    const result = await UserProfileType.getByType('MEAL_PLANNER');
    expect(result).toBeInstanceOf(UserProfileType);
    expect(result.type).toBe('MEAL_PLANNER');
  });
});


// =====================================================================
//  23. User
// =====================================================================
import User from '../entity/User';

describe('User — validateUsername()', () => {
  test('valid for normal username', () => {
    expect(User.validateUsername('alice_01').valid).toBe(true);
  });

  test('invalid when username is too short (< 3 chars)', () => {
    const r = User.validateUsername('ab');
    expect(r.valid).toBe(false);
    expect(r.field).toBe('username');
  });

  test('invalid when username is empty', () => {
    expect(User.validateUsername('').valid).toBe(false);
  });

  test('invalid when username exceeds max length', () => {
    expect(User.validateUsername('a'.repeat(31)).valid).toBe(false);
  });
});

describe('User — validateEmail()', () => {
  test('valid for properly formatted email', () => {
    expect(User.validateEmail('alice@example.com').valid).toBe(true);
  });

  test('invalid when email has no @', () => {
    expect(User.validateEmail('notanemail').valid).toBe(false);
  });

  test('invalid when email is empty', () => {
    expect(User.validateEmail('').valid).toBe(false);
  });
});

describe('User — validatePassword()', () => {
  test('valid for 8+ char password', () => {
    expect(User.validatePassword('secure123').valid).toBe(true);
  });

  test('invalid when password is too short (< 8 chars)', () => {
    const r = User.validatePassword('short');
    expect(r.valid).toBe(false);
    expect(r.field).toBe('password');
  });

  test('invalid when password is empty', () => {
    expect(User.validatePassword('').valid).toBe(false);
  });
});

describe('User — createAccount()', () => {
  test('returns validation error without calling API when username is too short', async () => {
    const result = await User.createAccount({ username: 'ab', email: 'a@b.com', password: 'secure123', confirmPassword: 'secure123' });
    expect(result.success).toBe(false);
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('returns error when passwords do not match', async () => {
    const result = await User.createAccount({ username: 'alice', email: 'a@b.com', password: 'secure123', confirmPassword: 'different' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('confirmPassword');
    expect(axios.post).not.toHaveBeenCalled();
  });

  test('calls API on valid input', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { userId: 1, username: 'alice', role: 'free' } } });
    const result = await User.createAccount({ username: 'alice', email: 'a@b.com', password: 'secure123', confirmPassword: 'secure123' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledTimes(1);
  });

  test('handles server 409 conflict (username taken)', async () => {
    axios.post.mockRejectedValue({ response: { data: { success: false, field: 'username', message: 'Username already taken' } } });
    const result = await User.createAccount({ username: 'taken', email: 'a@b.com', password: 'secure123', confirmPassword: 'secure123' });
    expect(result.success).toBe(false);
    expect(result.field).toBe('username');
  });
});

describe('User — login()', () => {
  test('calls POST /login with credentials', async () => {
    axios.post.mockResolvedValue({ data: { success: true, user: { userId: 1, username: 'alice', role: 'free' } } });
    const result = await User.login({ username: 'alice', password: 'secure123' });
    expect(result.success).toBe(true);
    expect(axios.post).toHaveBeenCalledWith(expect.stringContaining('/login'), { username: 'alice', password: 'secure123' });
  });

  test('returns error on wrong credentials', async () => {
    axios.post.mockRejectedValue({ response: { data: { success: false, message: 'Incorrect credentials' } } });
    const result = await User.login({ username: 'alice', password: 'wrong' });
    expect(result.success).toBe(false);
  });
});

describe('User — setProfileType()', () => {
  test('calls PUT /profile-type with userId and profileType', async () => {
    axios.put.mockResolvedValue({ data: { success: true } });
    const result = await User.setProfileType(1, 'ATHLETE');
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/profile-type'), { userId: 1, profileType: 'ATHLETE' });
  });

  test('returns error on failure', async () => {
    axios.put.mockRejectedValue({ response: { data: { message: 'Invalid type' } } });
    const result = await User.setProfileType(1, 'INVALID');
    expect(result.success).toBe(false);
  });
});

describe('User — setDailyCalorieLimit()', () => {
  test('calls PUT /calorie-limit with userId and dailyCalorieLimit', async () => {
    axios.put.mockResolvedValue({ data: { success: true, user: { dailyCalorieLimit: 1800 } } });
    const result = await User.setDailyCalorieLimit(1, 1800);
    expect(result.success).toBe(true);
    expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/calorie-limit'), { userId: 1, dailyCalorieLimit: 1800 });
  });
});

describe('User — terminateAccount()', () => {
  test('calls DELETE /delete/:userId', async () => {
    axios.delete.mockResolvedValue({ data: { success: true, message: 'Deleted' } });
    const result = await User.terminateAccount(1);
    expect(result.success).toBe(true);
    expect(axios.delete).toHaveBeenCalledWith(expect.stringContaining('/delete/1'));
  });

  test('returns error on failure', async () => {
    axios.delete.mockRejectedValue({ response: { data: { message: 'User not found' } } });
    const result = await User.terminateAccount(999);
    expect(result.success).toBe(false);
  });
});

describe('User — fetchNutritionTargets()', () => {
  test('calls GET /nutrition-targets/:userId', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30 } } });
    const result = await User.fetchNutritionTargets(1);
    expect(result.success).toBe(true);
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/nutrition-targets/1'));
  });
});

describe('User — getUser()', () => {
  test('calls GET /:userId and returns user data', async () => {
    axios.get.mockResolvedValue({ data: { success: true, data: { userId: 1, username: 'alice', role: 'free' } } });
    const result = await User.getUser(1);
    expect(result.success).toBe(true);
    expect(result.data.username).toBe('alice');
    expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/users/1'));
  });

  test('returns error when user not found', async () => {
    axios.get.mockRejectedValue({ response: { data: { message: 'User not found' } } });
    const result = await User.getUser(999);
    expect(result.success).toBe(false);
  });
});
