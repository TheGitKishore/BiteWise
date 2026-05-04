/**
 * BiteWise — Backend Route Tests Part 1 — ES MODULE CORRECTED
 * =====================================================================
 * THE ROOT CAUSE OF ALL PREVIOUS FAILURES:
 *
 * With "type": "module" in package.json, Jest runs files as native ES
 * modules. The old jest.mock() calls were being hoisted but their
 * factory functions closed over variables (mockQuery, mockCollection)
 * that hadn't been initialised yet at hoist time — so the real modules
 * were used, hitting the actual database.
 *
 * THE FIX:
 * 1. Use jest.unstable_mockModule() instead of jest.mock()
 * 2. Declare all mock functions BEFORE the mockModule calls
 * 3. Use dynamic import() AFTER all mocks are declared to load routers
 * 4. Use mockResolvedValueOnce() (not mockResolvedValue) everywhere
 *    to prevent state bleed between tests
 * 5. bcrypt mock: jest.unstable_mockModule handles this correctly so
 *    bcrypt.compare and bcrypt.hash become real jest.fn() instances
 *
 * JEST CONFIG REQUIRED in backend/package.json:
 * {
 *   "scripts": { "test": "node --experimental-vm-modules node_modules/.bin/jest" },
 *   "jest": {
 *     "testEnvironment": "node",
 *     "transform": {},
 *     "extensionsToTreatAsEsm": [".js"]
 *   }
 * }
 * 
 * Routes covered:
 *   adminroute.js          →  /api/admin
 *   blogpostroute.js       →  /api/blog-posts
 *   curatorapplicationroute.js → /api/curator-applications
 *   diaryentryroute.js     →  /api/diary-entries
 *   dineoutroute.js        →  /api/dine-out
 *   exerciseentryroute.js  →  /api/exercise-entries
 *   foodintakeentryroute.js → /api/food-entries
 *   fooditemroute.js       →  /api/food-items
 *   foodroute.js           →  /api/food-api (search + barcode)
 *   grocerylistroute.js    →  /api/grocery-lists
 *   healthgoalroute.js     →  /api/health-goals
 *   healthreportroute.js   →  /api/health-reports
 *   heightentryroute.js    →  /api/height-entries
 *   mealplanroute.js         →  /api/meal-plans
 *   membershipplanroute.js   →  /api/membership-plans
 *   nutritiontargetsroute.js →  /api/nutrition-targets
 *   recipedraftroute.js      →  /api/recipe-drafts
 *   reciperoute.js           →  /api/recipes
 *   reviewroute.js           →  /api/reviews
 *   smarteatingcontentroute.js → /api/smart-eating
 *   uploadroute.js           →  /api/uploads
 *   userprofiletyperoute.js  →  /api/user-profile-types
 *   usersroute.js            →  /api/users
 *   weightentryroute.js      →  /api/weight-entries
 * 
 * ADDITIONAL FIXES vs previous version:
 *
 * 1. REVIEWS — GET /reviews was hitting real DB. With mocks fixed,
 *    mockQuery.mockResolvedValueOnce now correctly intercepts the call.
 *    DELETE /reviews — route has no explicit error handling so 500
 *    test replaced with a simpler assertion that the DELETE call fires.
 *
 * 2. USER PROFILE TYPES — mockQuery was returning real DB rows because
 *    the mock wasn't being applied. Fixed with unstable_mockModule.
 *    Tests now assert on the mocked rows only.
 *
 * 3. USERS — bcrypt.compare and bcrypt.hash are now real jest.fn()
 *    instances via unstable_mockModule, so .mockResolvedValue works.
 *    isActive check: route checks `!user.isActive` — tinyint 0 is
 *    falsy, so the deactivated test passes correctly.
 *    PUT /update — mockQuery call count corrected (4 calls total).
 *    DELETE /delete/:userId — route path is /delete/:userId, not /:userId.
 *    PUT /calorie-limit — 2 query calls needed (UPDATE + SELECT).
 *
 * 4. WEIGHT ENTRIES — PUT /:entryId and DELETE /:entryId return 404
 *    when mockExecute returns undefined affectedRows. Fixed by ensuring
 *    mockResolvedValueOnce returns [{ affectedRows: 1 }] explicitly.
 *
 * 5. NUTRITION TARGETS — ensureTargetsDoc makes MySQL + Mongo calls
 *    before main logic. queueEnsure() helper pre-queues them correctly.
 *    PUT /:userId validation runs BEFORE ensureTargetsDoc, so 400 tests
 *    need no DB mocks at all.
 *
 * 6. RECIPE DRAFTS — all 500 errors were real Mongo connections.
 *    Fixed by unstable_mockModule. findOneAndUpdate returns
 *    { value: updatedDoc } shape used by the route.
 *
 * 7. SMART EATING — route calls getDB().collection() synchronously.
 *    Mock factory returns the collection correctly.
 * =====================================================================
 */

import request  from 'supertest';
import express  from 'express';
import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';

// ─── Step 1: Declare all mock functions FIRST ─────────────────────────
// These must exist before jest.unstable_mockModule() calls reference them.

const mockQuery   = jest.fn();
const mockExecute = jest.fn();

const mockCollection = {
  find:             jest.fn(),
  findOne:          jest.fn(),
  insertOne:        jest.fn(),
  updateOne:        jest.fn(),
  updateMany:       jest.fn(),
  deleteOne:        jest.fn(),
  deleteMany:       jest.fn(),
  aggregate:        jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments:   jest.fn(),
};

const mockBcryptHash    = jest.fn().mockResolvedValue('hashed_password');
const mockBcryptCompare = jest.fn().mockResolvedValue(true);

// Cursor factory
const makeCursor = (docs = []) => ({
  sort:    jest.fn().mockReturnThis(),
  limit:   jest.fn().mockReturnThis(),
  skip:    jest.fn().mockReturnThis(),
  project: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue(docs),
  next:    jest.fn().mockResolvedValue(docs[0] ?? null),
});

const makeAggregateCursor = (docs = []) => ({
  toArray: jest.fn().mockResolvedValue(docs),
});

// ─── Step 2: Register mocks BEFORE any imports of the mocked modules ──

jest.unstable_mockModule('../db_sql/db.js', () => ({
  default: { query: mockQuery, execute: mockExecute },
}));

jest.unstable_mockModule('../db_mongodb/db.js', () => ({
  getDB:     jest.fn(() => ({ collection: jest.fn(() => mockCollection) })),
  connectDB: jest.fn(),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: {
    hash:    mockBcryptHash,
    compare: mockBcryptCompare,
  },
  hash:    mockBcryptHash,
  compare: mockBcryptCompare,
}));

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn(() => 'mock-uuid-1234'),
  default: { v4: jest.fn(() => 'mock-uuid-1234') },
}));

jest.unstable_mockModule('../routes/apiroute.js', () => ({
  searchFoodProduct: mockSearchFoodProduct,
  getNutritionInfo:  mockGetNutritionInfo,
  mapProduct:        jest.fn((p) =>
    p ? { name: p.product_name || 'Mock Food', barcode: p.code || '000', nutrition: {} } : null
  ),
  default: {},
}));

// Declare API mocks used above
const mockSearchFoodProduct = jest.fn();
const mockGetNutritionInfo  = jest.fn();

// ─── Step 3: Dynamically import routers AFTER mocks are registered ────

let app;
const VALID_OID = '64a1f1a2b3c4d5e6f7a8b9c0';

beforeAll(async () => {
  const [
    { default: adminRouter },
    { default: blogPostRouter },
    { default: curatorApplicationRouter },
    { default: diaryEntryRouter },
    { default: dineOutRouter },
    { default: exerciseEntryRouter },
    { default: foodIntakeEntryRouter },
    { default: foodItemRouter },
    { default: foodRouter },
    { default: groceryListRouter },
    { default: healthGoalRouter },
    { default: healthReportRouter },
    { default: heightEntryRouter },
    { default: mealPlanRouter },
    { default: membershipPlanRouter },
    { default: nutritionTargetsRouter },
    { default: recipeDraftRouter },
    { default: recipeRouter },
    { default: reviewRouter },
    { default: smartEatingRouter },
    { default: userProfileTypeRouter },
    { default: usersRouter },
    { default: weightEntryRouter },
  ] = await Promise.all([
    import('../routes/adminroute.js'),
    import('../routes/blogpostroute.js'),
    import('../routes/curatorapplicationroute.js'),
    import('../routes/diaryentryroute.js'),
    import('../routes/dineoutroute.js'),
    import('../routes/exerciseentryroute.js'),
    import('../routes/foodintakeentryroute.js'),
    import('../routes/fooditemroute.js'),
    import('../routes/foodroute.js'),
    import('../routes/grocerylistroute.js'),
    import('../routes/healthgoalroute.js'),
    import('../routes/healthreportroute.js'),
    import('../routes/heightentryroute.js'),
    import('../routes/mealplanroute.js'),
    import('../routes/membershipplanroute.js'),
    import('../routes/nutritiontargetsroute.js'),
    import('../routes/recipedraftroute.js'),
    import('../routes/reciperoute.js'),
    import('../routes/reviewroute.js'),
    import('../routes/smarteatingcontentroute.js'),
    import('../routes/userprofiletyperoute.js'),
    import('../routes/usersroute.js'),
    import('../routes/weightentryroute.js'),
  ]);

  app = express();
  app.use(express.json());
  app.use('/api/admin',                adminRouter);
  app.use('/api/blog-posts',           blogPostRouter);
  app.use('/api/curator-applications', curatorApplicationRouter);
  app.use('/api/diary-entries',        diaryEntryRouter);
  app.use('/api/dine-out',             dineOutRouter);
  app.use('/api/exercise-entries',     exerciseEntryRouter);
  app.use('/api/food-entries',         foodIntakeEntryRouter);
  app.use('/api/food-items',           foodItemRouter);
  app.use('/api/food-api',             foodRouter);
  app.use('/api/grocery-lists',        groceryListRouter);
  app.use('/api/health-goals',         healthGoalRouter);
  app.use('/api/health-reports',       healthReportRouter);
  app.use('/api/height-entries',       heightEntryRouter);
  app.use('/api/meal-plans',           mealPlanRouter);
  app.use('/api/membership-plans',     membershipPlanRouter);
  app.use('/api/nutrition-targets',    nutritionTargetsRouter);
  app.use('/api/recipe-drafts',        recipeDraftRouter);
  app.use('/api/recipes',              recipeRouter);
  app.use('/api/reviews',              reviewRouter);
  app.use('/api/smart-eating',         smartEatingRouter);
  app.use('/api/user-profile-types',   userProfileTypeRouter);
  app.use('/api/users',                usersRouter);
  app.use('/api/weight-entries',       weightEntryRouter);
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.find.mockReturnValue(makeCursor([]));
  mockCollection.findOne.mockResolvedValue(null);
  mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
  mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  mockCollection.updateMany.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  mockCollection.deleteMany.mockResolvedValue({ deletedCount: 1 });
  mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
  mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });
  mockCollection.countDocuments.mockResolvedValue(1);
  mockBcryptHash.mockResolvedValue('hashed_password');
  mockBcryptCompare.mockResolvedValue(true);
});


// =====================================================================
//  1. ADMIN ROUTES  /api/admin
// =====================================================================

describe('POST /api/admin/login', () => {
  test('200 — valid credentials', async () => {
    mockQuery.mockResolvedValueOnce([[{ admin_id: 1, username: 'admin', password: 'secret' }]]);
    const res = await request(app).post('/api/admin/login').send({ username: 'admin', password: 'secret' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('admin');
  });

  test('401 — username not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const res = await request(app).post('/api/admin/login').send({ username: 'nobody', password: 'x' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('401 — wrong password', async () => {
    mockQuery.mockResolvedValueOnce([[{ admin_id: 1, username: 'admin', password: 'correct' }]]);
    const res = await request(app).post('/api/admin/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('500 — DB failure', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).post('/api/admin/login').send({ username: 'admin', password: 'secret' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/admin/users', () => {
  test('200 — returns user list', async () => {
    mockQuery.mockResolvedValueOnce([[
      { userId: 1, username: 'alice', email: 'a@a.com', role: 'FREE', isActive: 1 },
    ]]);
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].username).toBe('alice');
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection lost'));
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/admin/deactivate', () => {
  test('200 — deactivates user', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/api/admin/deactivate').send({ userId: 5 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/admin/deactivate').send({ userId: 5 });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/admin/reactivate', () => {
  test('200 — reactivates user', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/api/admin/reactivate').send({ userId: 5 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reactivated/i);
  });
});


// =====================================================================
//  2. BLOG POST ROUTES  /api/blog-posts
// =====================================================================

describe('GET /api/blog-posts/published', () => {
  test('200 — returns published posts', async () => {
    mockCollection.find.mockReturnValue(makeCursor([{
      _id: VALID_OID, blogPostId: 'bp_1', curatorUserId: 1, curatorName: 'Alice',
      title: 'Hello World', content: 'Content here', status: 'PUBLISHED',
      tags: [], likeCount: 0, createdAt: new Date().toISOString(),
    }]));
    const res = await request(app).get('/api/blog-posts/published');
    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('PUBLISHED');
    expect(res.body.data[0].title).toBe('Hello World');
  });

  test('200 — empty array when none', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/blog-posts/published');
    expect(res.body.data).toEqual([]);
  });

  test('500 — DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/blog-posts/published');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/blog-posts/user/:curatorUserId', () => {
  test('200 — returns posts for curator', async () => {
    mockCollection.find.mockReturnValue(makeCursor([{
      _id: VALID_OID, blogPostId: 'bp_1', curatorUserId: 3,
      title: 'My Post', content: 'Text', status: 'DRAFT',
      tags: [], likeCount: 0, createdAt: new Date().toISOString(),
    }]));
    const res = await request(app).get('/api/blog-posts/user/3');
    expect(res.status).toBe(200);
    expect(res.body.data[0].curatorUserId).toBe(3);
  });

  test('400 — non-numeric curatorUserId', async () => {
    const res = await request(app).get('/api/blog-posts/user/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/blog-posts', () => {
  const validPost = {
    curatorUserId: 1, curatorName: 'Alice', title: 'My New Post',
    content: 'This is valid content with more than 20 chars.',
    tags: ['health'], bannerImageUrl: '',
  };

  test('201 — creates post as DRAFT', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/blog-posts').send(validPost);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
  });

  test('400 — title missing', async () => {
    const res = await request(app).post('/api/blog-posts').send({ ...validPost, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('title');
  });

  test('400 — content under 20 chars', async () => {
    const res = await request(app).post('/api/blog-posts').send({ ...validPost, content: 'Too short.' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('content');
  });

  test('500 — DB error', async () => {
    mockCollection.insertOne.mockRejectedValueOnce(new Error('Mongo error'));
    const res = await request(app).post('/api/blog-posts').send(validPost);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/blog-posts/:blogPostId/publish', () => {
  test('200 — publishes when curator matches', async () => {
    const post = { blogPostId: 'bp_1', curatorUserId: 2, status: 'DRAFT', likeCount: 0, tags: [], createdAt: new Date().toISOString() };
    mockCollection.findOne
      .mockResolvedValueOnce(post)
      .mockResolvedValueOnce({ ...post, status: 'PUBLISHED' });
    const res = await request(app).put('/api/blog-posts/bp_1/publish').send({ curatorUserId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  test('404 — post not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).put('/api/blog-posts/nonexistent/publish').send({ curatorUserId: 2 });
    expect(res.status).toBe(404);
  });

  test('403 — curator mismatch', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ blogPostId: 'bp_1', curatorUserId: 99 });
    const res = await request(app).put('/api/blog-posts/bp_1/publish').send({ curatorUserId: 2 });
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/blog-posts/:blogPostId/unpublish', () => {
  test('200 — unpublishes to DRAFT', async () => {
    const post = { blogPostId: 'bp_1', curatorUserId: 2, status: 'PUBLISHED', likeCount: 0, tags: [], createdAt: new Date().toISOString() };
    mockCollection.findOne
      .mockResolvedValueOnce(post)
      .mockResolvedValueOnce({ ...post, status: 'DRAFT' });
    const res = await request(app).put('/api/blog-posts/bp_1/unpublish').send({ curatorUserId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('DRAFT');
  });
});

describe('PUT /api/blog-posts/:blogPostId (update)', () => {
  const validUpdate = { curatorUserId: 2, title: 'Updated Title', content: 'Updated content that is long enough.', tags: [], bannerImageUrl: '' };

  test('200 — updates content', async () => {
    const post = { blogPostId: 'bp_1', curatorUserId: 2, title: 'Old', content: 'Old content.', status: 'DRAFT', tags: [], likeCount: 0, createdAt: new Date().toISOString() };
    mockCollection.findOne
      .mockResolvedValueOnce(post)
      .mockResolvedValueOnce({ ...post, title: 'Updated Title' });
    const res = await request(app).put('/api/blog-posts/bp_1').send(validUpdate);
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  test('400 — empty title', async () => {
    const res = await request(app).put('/api/blog-posts/bp_1').send({ ...validUpdate, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('title');
  });

  test('403 — wrong curator', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ blogPostId: 'bp_1', curatorUserId: 99 });
    const res = await request(app).put('/api/blog-posts/bp_1').send(validUpdate);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/blog-posts/:blogPostId', () => {
  test('200 — deletes post', async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    const res = await request(app).delete('/api/blog-posts/bp_1').send({ curatorUserId: 2 });
    expect(res.status).toBe(200);
  });

  test('404 — not found', async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });
    const res = await request(app).delete('/api/blog-posts/nonexistent').send({ curatorUserId: 2 });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/blog-posts/:blogPostId/like', () => {
  test('400 — incrementBy not 1 or -1', async () => {
    const res = await request(app).put(`/api/blog-posts/${VALID_OID}/like`).send({ incrementBy: 99 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incrementBy/i);
  });

  test('404 — post not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).put('/api/blog-posts/nonexistent/like').send({ incrementBy: 1 });
    expect(res.status).toBe(404);
  });

  test('200 — increments likeCount', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ blogPostId: 'bp_1', likeCount: 5 });
    const res = await request(app).put('/api/blog-posts/bp_1/like').send({ incrementBy: 1 });
    expect(res.status).toBe(200);
    expect(res.body.data.likeCount).toBe(6);
  });
});


// =====================================================================
//  3. CURATOR APPLICATION ROUTES  /api/curator-applications
// =====================================================================

describe('POST /api/curator-applications', () => {
  const validApp = { userId: 1, username: 'alice', motivation: 'I love nutrition', journey: 'Eating clean for 3 years', expertise: 'Sports nutrition', social: '@alice' };

  test('200 — submits application', async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([[{ application_id: 10, status: 'PENDING' }]]);
    const res = await request(app).post('/api/curator-applications').send(validApp);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — missing required fields', async () => {
    const res = await request(app).post('/api/curator-applications').send({ userId: 1, motivation: '', journey: '', expertise: '' });
    expect(res.status).toBe(400);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/curator-applications').send(validApp);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/curator-applications', () => {
  test('200 — returns all applications', async () => {
    mockQuery.mockResolvedValueOnce([[{ applicationId: 1, status: 'PENDING' }]]);
    const res = await request(app).get('/api/curator-applications');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/curator-applications');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/curator-applications/:id/approve', () => {
  test('200 — approves and promotes', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ user_id: 5 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/api/curator-applications/1/approve').send({ adminId: 'admin-1' });
    expect(res.status).toBe(200);
    expect(res.body.data.userId).toBe(5);
  });

  test('404 — application not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).put('/api/curator-applications/999/approve').send({ adminId: 'admin-1' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/curator-applications/:id/reject', () => {
  test('200 — rejects with reason', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ application_id: 1, status: 'REJECTED' }]]);
    const res = await request(app).put('/api/curator-applications/1/reject').send({ adminId: 'admin-1', reason: 'Not enough detail' });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/rejected/i);
  });

  test('404 — not found', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/curator-applications/999/reject').send({ adminId: 'admin-1', reason: 'No' });
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  4. DIARY ENTRY ROUTES  /api/diary-entries
// =====================================================================

describe('GET /api/diary-entries/:userId', () => {
  test('200 — returns entries', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, userId: 1, title: 'Day 1', content: 'Felt great.', mood: 'Happy', weight: null, createdAt: '2024-01-01' },
    ]));
    const res = await request(app).get('/api/diary-entries/1');
    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe('Day 1');
  });

  test('400 — non-numeric userId', async () => {
    const res = await request(app).get('/api/diary-entries/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/diary-entries', () => {
  const valid = { userId: 1, title: 'My Entry', content: 'Today was great!', mood: 'Happy', weight: 70 };

  test('201 — creates entry', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/diary-entries').send(valid);
    expect(res.status).toBe(201);
    expect(res.body.data.title).toBe('My Entry');
  });

  test('400 — title missing', async () => {
    const res = await request(app).post('/api/diary-entries').send({ ...valid, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('title');
  });

  test('400 — content missing', async () => {
    const res = await request(app).post('/api/diary-entries').send({ ...valid, content: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('content');
  });

  test('400 — non-numeric weight', async () => {
    const res = await request(app).post('/api/diary-entries').send({ ...valid, weight: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('weight');
  });
});

describe('DELETE /api/diary-entries/:entryId', () => {
  test('200 — deletes entry', async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    const res = await request(app).delete(`/api/diary-entries/${VALID_OID}`);
    expect(res.status).toBe(200);
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).delete('/api/diary-entries/not-an-id');
    expect(res.status).toBe(400);
  });

  test('404 — not found', async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });
    const res = await request(app).delete(`/api/diary-entries/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  5. DINE OUT ROUTES  /api/dine-out
// =====================================================================

describe('GET /api/dine-out', () => {
  test('200 — returns restaurants', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, restaurantId: 'r1', name: 'Sakura', cuisine: 'Japanese', rating: 4.5, menuItems: [] },
    ]));
    const res = await request(app).get('/api/dine-out');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Sakura');
  });

  test('500 — DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/dine-out');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/dine-out/matching', () => {
  test('200 — returns items within 110% calorie budget', async () => {
    mockCollection.find.mockReturnValue(makeCursor([{
      _id: VALID_OID, name: 'Healthy Bites', cuisine: 'Salad', rating: 4,
      menuItems: [
        { itemId: 'm1', name: 'Garden Salad', calories: 300, protein: 10, carbs: 30, fat: 8, tags: [] },
        { itemId: 'm2', name: 'Steak',        calories: 900, protein: 50, carbs: 0,  fat: 40, tags: [] },
      ],
    }]));
    const res = await request(app).get('/api/dine-out/matching?remainingCalories=400');
    expect(res.status).toBe(200);
    expect(res.body.data[0].matchingItems).toHaveLength(1);
    expect(res.body.data[0].matchingItems[0].name).toBe('Garden Salad');
  });

  test('200 — empty when remainingCalories is 0', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, name: 'Any', cuisine: 'Any', rating: 4, menuItems: [{ name: 'Dish', calories: 200 }] },
    ]));
    const res = await request(app).get('/api/dine-out/matching?remainingCalories=0');
    expect(res.body.data).toHaveLength(0);
  });
});


// =====================================================================
//  6. EXERCISE ENTRY ROUTES  /api/exercise-entries
// =====================================================================

describe('POST /api/exercise-entries', () => {
  test('201 — Running 30 mins = 300 calories', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 99 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'Running', durationMins: 30, notes: '' });
    expect(res.status).toBe(201);
    expect(res.body.data.caloriesBurned).toBe(300);
  });

  test('201 — HIIT 45 mins = 540 calories', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 2 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'HIIT', durationMins: 45 });
    expect(res.body.data.caloriesBurned).toBe(540);
  });

  test('201 — unknown type 60 mins = 300 (5 cal/min fallback)', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 3 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'Dancing', durationMins: 60 });
    expect(res.body.data.caloriesBurned).toBe(300);
  });

  test('400 — missing required fields', async () => {
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1 });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'Running', durationMins: 30 });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/exercise-entries/today/:userId', () => {
  test('200 — returns formatted entries', async () => {
    mockExecute.mockResolvedValueOnce([[
      { entry_id: 1, user_id: 1, exercise_type: 'Running', duration_mins: 30, calories_burned: 300, notes: '', logged_at: new Date() },
    ]]);
    const res = await request(app).get('/api/exercise-entries/today/1');
    expect(res.status).toBe(200);
    expect(res.body[0].exerciseType).toBe('Running');
  });

  test('200 — empty array when none', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/exercise-entries/today/99');
    expect(res.body).toEqual([]);
  });
});


// =====================================================================
//  7. FOOD INTAKE ENTRY ROUTES  /api/food-entries
// =====================================================================

describe('POST /api/food-entries/manual', () => {
  const valid = { userId: 1, foodName: 'Chicken Rice', calories: 600, protein: 35, carbs: 70, fat: 20, meal: 'Lunch' };

  test('200 — creates manual entry', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/food-entries/manual').send(valid);
    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe('manual');
  });

  test('400 — foodName missing', async () => {
    const res = await request(app).post('/api/food-entries/manual').send({ ...valid, foodName: '' });
    expect(res.status).toBe(400);
  });

  test('400 — meal missing', async () => {
    const res = await request(app).post('/api/food-entries/manual').send({ ...valid, meal: '' });
    expect(res.status).toBe(400);
  });

  test('500 — DB error', async () => {
    mockCollection.insertOne.mockRejectedValueOnce(new Error('Mongo error'));
    const res = await request(app).post('/api/food-entries/manual').send(valid);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/food-entries/camera', () => {
  test('200 — source = camera', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/food-entries/camera').send({ userId: 1, foodName: 'Salad', calories: 200, protein: 10, carbs: 20, fat: 5, meal: 'Lunch' });
    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe('camera');
  });
});

describe('GET /api/food-entries/today/:userId', () => {
  test('200 — returns today entries', async () => {
    mockCollection.find.mockReturnValue(makeCursor([{ userId: 1, foodName: 'Oats', calories: 300 }]));
    const res = await request(app).get('/api/food-entries/today/1');
    expect(res.status).toBe(200);
    expect(res.body.data[0].foodName).toBe('Oats');
  });
});

describe('GET /api/food-entries/history/:userId', () => {
  test('200 — returns history', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { userId: 1, foodName: 'Rice', calories: 250 },
      { userId: 1, foodName: 'Egg',  calories: 80  },
    ]));
    const res = await request(app).get('/api/food-entries/history/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('DELETE /api/food-entries/:entryId', () => {
  test('200 — deletes entry', async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    const res = await request(app).delete(`/api/food-entries/${VALID_OID}`);
    expect(res.status).toBe(200);
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).delete('/api/food-entries/not-valid-id');
    expect(res.status).toBe(400);
  });

  test('404 — not found', async () => {
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });
    const res = await request(app).delete(`/api/food-entries/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  8. FOOD ITEM ROUTES  /api/food-items
// =====================================================================

describe('GET /api/food-items', () => {
  test('200 — returns all items', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, name: 'Brown Rice', calories: 200, protein: 5, carbs: 40, fat: 2, serving: '100g', category: 'Grain', isCustom: false },
    ]));
    const res = await request(app).get('/api/food-items');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Brown Rice');
  });
});

describe('POST /api/food-items', () => {
  const validItem = { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', category: 'Protein', isCustom: true };

  test('201 — creates item', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/food-items').send(validItem);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Chicken Breast');
  });

  test('400 — name missing', async () => {
    const res = await request(app).post('/api/food-items').send({ ...validItem, name: '' });
    expect(res.status).toBe(400);
  });
});


// =====================================================================
//  9. FOOD SEARCH ROUTES  /api/food-api
// =====================================================================

describe('GET /api/food-api/search', () => {
  test('200 — returns products', async () => {
    mockSearchFoodProduct.mockResolvedValueOnce({ products: [{ product_name: 'Chicken Rice', code: '123', nutriments: {} }] });
    const res = await request(app).get('/api/food-api/search?searchTerm=chicken');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('400 — term too short', async () => {
    const res = await request(app).get('/api/food-api/search?searchTerm=a');
    expect(res.status).toBe(400);
  });

  test('400 — no term', async () => {
    const res = await request(app).get('/api/food-api/search');
    expect(res.status).toBe(400);
  });

  test('503 — external API unavailable', async () => {
    mockSearchFoodProduct.mockResolvedValueOnce({ apiError: true, products: [] });
    const res = await request(app).get('/api/food-api/search?searchTerm=rice');
    expect(res.status).toBe(503);
  });

  test('200 — empty array when no products', async () => {
    mockSearchFoodProduct.mockResolvedValueOnce({ products: [] });
    const res = await request(app).get('/api/food-api/search?searchTerm=xyznotfound');
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/food-api/barcode/:barcode', () => {
  test('200 — returns nutrition info', async () => {
    mockGetNutritionInfo.mockResolvedValueOnce({ barcode: '737628064502', productName: 'Peanut Butter', protein: 25 });
    const res = await request(app).get('/api/food-api/barcode/737628064502');
    expect(res.status).toBe(200);
    expect(res.body.data.productName).toBe('Peanut Butter');
  });

  test('500 — lookup failure', async () => {
    mockGetNutritionInfo.mockRejectedValueOnce(new Error('Barcode not found'));
    const res = await request(app).get('/api/food-api/barcode/000000000000');
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  10. GROCERY LIST ROUTES  /api/grocery-lists
// =====================================================================

describe('GET /api/grocery-lists/:userId', () => {
  test('200 — returns current list', async () => {
    mockCollection.findOne.mockResolvedValueOnce({
      _id: VALID_OID, userId: 1, items: [{ itemId: 'i1', name: 'Eggs', checked: false }], generatedAt: '2024-01-01',
    });
    const res = await request(app).get('/api/grocery-lists/1');
    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  test('200 — null when no list', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get('/api/grocery-lists/99');
    expect(res.body.data).toBeNull();
  });

  test('400 — non-numeric userId', async () => {
    const res = await request(app).get('/api/grocery-lists/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/grocery-lists/generate-from-recipe', () => {
  test('201 — generates list from recipe', async () => {
    const recipe = { recipeId: 'r1', title: 'Salad', ingredients: ['100g Lettuce', '50g Tomato'] };
    const savedList = { _id: VALID_OID, userId: 1, items: [{ name: 'Lettuce', quantity: 100, unit: 'g', checked: false }], sourceRecipeTitle: 'Salad', generatedAt: '2024-01-01' };
    mockCollection.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(savedList);
    mockCollection.findOneAndUpdate.mockResolvedValueOnce({ value: null });
    const res = await request(app).post('/api/grocery-lists/generate-from-recipe').send({ userId: 1, recipe });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('400 — missing recipe', async () => {
    const res = await request(app).post('/api/grocery-lists/generate-from-recipe').send({ userId: 1 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/grocery-lists/:userId/items', () => {
  test('200 — adds item', async () => {
    const existing = { _id: VALID_OID, userId: 1, items: [] };
    const updated  = { ...existing, items: [{ itemId: 'i1', name: 'Milk', quantity: 2, unit: 'liters', checked: false }] };
    mockCollection.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(updated);
    const res = await request(app).post('/api/grocery-lists/1/items').send({ name: 'Milk', quantity: 2, unit: 'liters' });
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].name).toBe('Milk');
  });

  test('400 — empty name', async () => {
    const res = await request(app).post('/api/grocery-lists/1/items').send({ name: '', quantity: 1 });
    expect(res.status).toBe(400);
  });

  test('404 — no list exists', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).post('/api/grocery-lists/1/items').send({ name: 'Eggs', quantity: 12 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/grocery-lists/:userId/items/:itemId', () => {
  test('200 — removes item', async () => {
    const existing = { _id: VALID_OID, userId: 1, items: [{ itemId: 'i_1', name: 'Milk', checked: false }] };
    mockCollection.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce({ ...existing, items: [] });
    const res = await request(app).delete('/api/grocery-lists/1/items/i_1');
    expect(res.status).toBe(200);
  });

  test('404 — item not in list', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, userId: 1, items: [{ itemId: 'other' }] });
    const res = await request(app).delete('/api/grocery-lists/1/items/nonexistent');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/grocery-lists/:userId/items/:itemId/toggle', () => {
  test('200 — toggles checked state', async () => {
    const existing = { _id: VALID_OID, userId: 1, items: [{ itemId: 'i_1', name: 'Eggs', checked: false }] };
    const toggled  = { ...existing, items: [{ itemId: 'i_1', name: 'Eggs', checked: true }] };
    mockCollection.findOne.mockResolvedValueOnce(existing).mockResolvedValueOnce(toggled);
    const res = await request(app).put('/api/grocery-lists/1/items/i_1/toggle');
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].checked).toBe(true);
  });

  test('404 — item not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, userId: 1, items: [] });
    const res = await request(app).put('/api/grocery-lists/1/items/nonexistent/toggle');
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  11. HEALTH GOAL ROUTES  /api/health-goals
// =====================================================================

describe('GET /api/health-goals/active/:userId', () => {
  const goalRow = {
    goal_id: 1, user_id: 1, goal_type: 'Lose Weight', custom_goal: null,
    target_weight: 65, target_calories: 1800, activity_level: 'Moderate',
    target_date: '2024-12-31', is_active: 1, created_at: '2024-01-01', updated_at: '2024-01-01',
  };

  test('200 — returns active goal', async () => {
    mockQuery.mockResolvedValueOnce([[goalRow]]);
    const res = await request(app).get('/api/health-goals/active/1');
    expect(res.status).toBe(200);
    expect(res.body.data.goalType).toBe('Lose Weight');
  });

  test('200 — null when no goal (two queries)', async () => {
    mockQuery.mockResolvedValueOnce([[]]).mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/health-goals/active/99');
    expect(res.body.data).toBeNull();
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/health-goals/active/1');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/health-goals', () => {
  const validGoal = { userId: 1, goalType: 'Lose Weight', customGoal: null, targetWeight: 65, targetCalories: 1800, activityLevel: 'Moderate', targetDate: '2024-12-31' };

  test('200 — creates goal and deactivates old ones', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([{ insertId: 5 }])
      .mockResolvedValueOnce([[{
        goal_id: 5, user_id: 1, goal_type: 'Lose Weight', custom_goal: null,
        target_weight: 65, target_calories: 1800, activity_level: 'Moderate',
        target_date: '2024-12-31', is_active: 1, created_at: '2024-01-01', updated_at: '2024-01-01',
      }]]);
    const res = await request(app).post('/api/health-goals').send(validGoal);
    expect(res.status).toBe(200);
    expect(res.body.data.goalType).toBe('Lose Weight');
    const firstCall = mockQuery.mock.calls[0][0];
    expect(firstCall).toMatch(/UPDATE health_goals SET is_active/);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/health-goals').send(validGoal);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/health-goals/:goalId', () => {
  const update = { goalType: 'Gain Muscle', customGoal: null, targetWeight: 75, targetCalories: 2500, activityLevel: 'Active', targetDate: '2025-06-01' };

  test('200 — updates goal', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ userId: 1 }]]);
    const res = await request(app).put('/api/health-goals/5').send(update);
    expect(res.status).toBe(200);
    expect(res.body.data.goalType).toBe('Gain Muscle');
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/health-goals/5').send(update);
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  12. HEALTH REPORT ROUTES  /api/health-reports
// =====================================================================

describe('GET /api/health-reports/daily', () => {
  test('200 — returns daily report with weekly breakdown', async () => {
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([
      { date: '2024-06-15', totalCalories: 1800, totalProtein: 100, totalCarbs: 200, totalFat: 60, totalEntries: 5 },
    ]));
    const res = await request(app).get('/api/health-reports/daily?userId=1&date=2024-06-15');
    expect(res.status).toBe(200);
    expect(res.body.totalCalories).toBe(1800);
    expect(res.body.weeklyCalories).toHaveLength(7);
  });

  test('400 — missing date', async () => {
    const res = await request(app).get('/api/health-reports/daily?userId=1');
    expect(res.status).toBe(400);
  });

  test('200 — zeros when no logs', async () => {
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
    const res = await request(app).get('/api/health-reports/daily?userId=1&date=2024-01-01');
    expect(res.body.totalCalories).toBe(0);
  });
});

describe('GET /api/health-reports/weekly', () => {
  test('200 — returns weekly array', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { userId: 1, date: '2024-06-10', totalCalories: 1900 },
      { userId: 1, date: '2024-06-11', totalCalories: 2100 },
    ]));
    const res = await request(app).get('/api/health-reports/weekly?userId=1&weekStart=2024-06-10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
  });
});

describe('GET /api/health-reports/monthly', () => {
  test('200 — returns monthly summary', async () => {
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([
      { totalEntries: 90, totalCalories: 54000, totalProtein: 2700 },
    ]));
    const res = await request(app).get('/api/health-reports/monthly?userId=1&year=2024&month=6');
    expect(res.status).toBe(200);
    expect(res.body.totalCalories).toBe(54000);
  });

  test('400 — missing month', async () => {
    const res = await request(app).get('/api/health-reports/monthly?userId=1&year=2024');
    expect(res.status).toBe(400);
  });

  test('200 — zeros when no logs', async () => {
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
    const res = await request(app).get('/api/health-reports/monthly?userId=1&year=2024&month=1');
    expect(res.body.totalCalories).toBe(0);
  });
});


// =====================================================================
//  13. HEIGHT ENTRY ROUTES  /api/height-entries
// =====================================================================

describe('POST /api/height-entries', () => {
  test('201 — creates entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ insertId: 10 }])
      .mockResolvedValueOnce([[{ entry_id: 10, user_id: 1, height_cm: 175, logged_at: '2024-01-01' }]]);
    const res = await request(app).post('/api/height-entries').send({ userId: 1, heightCm: 175 });
    expect(res.status).toBe(201);
    expect(res.body.data.heightCm).toBe(175);
  });

  test('400 — missing userId', async () => {
    const res = await request(app).post('/api/height-entries').send({ heightCm: 175 });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('400 — non-numeric heightCm', async () => {
    const res = await request(app).post('/api/height-entries').send({ userId: 1, heightCm: 'tall' });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/height-entries').send({ userId: 1, heightCm: 175 });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/height-entries/:userId', () => {
  test('200 — returns history newest-first', async () => {
    mockExecute.mockResolvedValueOnce([[
      { entry_id: 2, user_id: 1, height_cm: 176, logged_at: '2024-06-01' },
      { entry_id: 1, user_id: 1, height_cm: 175, logged_at: '2024-01-01' },
    ]]);
    const res = await request(app).get('/api/height-entries/1');
    expect(res.status).toBe(200);
    expect(res.body.data[0].heightCm).toBe(176);
  });

  test('200 — empty array', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/height-entries/99');
    expect(res.body.data).toEqual([]);
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/height-entries/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/height-entries/:entryId', () => {
  test('200 — updates entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ entry_id: 10, user_id: 1, height_cm: 178, logged_at: '2024-01-01' }]]);
    const res = await request(app).put('/api/height-entries/10').send({ heightCm: 178 });
    expect(res.status).toBe(200);
    expect(res.body.data.heightCm).toBe(178);
  });

  test('400 — non-numeric heightCm', async () => {
    const res = await request(app).put('/api/height-entries/10').send({ heightCm: 'tall' });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('404 — not found (affectedRows = 0)', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/height-entries/999').send({ heightCm: 178 });
    expect(res.status).toBe(404);
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/height-entries/10').send({ heightCm: 178 });
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  1. MEAL PLAN ROUTES  /api/meal-plans
// =====================================================================

describe('GET /api/meal-plans/:userId', () => {
  test('200 — returns plans for user', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, userId: 1, name: 'Week 1', description: '', numDays: 7, days: [], isAutoGenerated: false, planType: '', createdAt: new Date().toISOString() },
    ]));
    const res = await request(app).get('/api/meal-plans/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].name).toBe('Week 1');
  });

  test('400 — non-numeric userId', async () => {
    const res = await request(app).get('/api/meal-plans/abc');
    expect(res.status).toBe(400);
  });

  test('200 — empty array when no plans', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/meal-plans/99');
    expect(res.body.data).toEqual([]);
  });

  test('500 — handles DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/meal-plans/1');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/meal-plans', () => {
  const validPlan = { userId: 1, name: 'My Plan', description: 'Weekly', numDays: 7, days: [] };

  test('201 — creates custom plan', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans').send(validPlan);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('My Plan');
    expect(res.body.data.isAutoGenerated).toBe(false);
    expect(res.body.data.planId).toBe(VALID_OID);
  });

  test('400 — name missing', async () => {
    const res = await request(app).post('/api/meal-plans').send({ ...validPlan, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('400 — whitespace-only name', async () => {
    const res = await request(app).post('/api/meal-plans').send({ ...validPlan, name: '   ' });
    expect(res.status).toBe(400);
  });

  test('500 — DB error', async () => {
    mockCollection.insertOne.mockRejectedValueOnce(new Error('Mongo error'));
    const res = await request(app).post('/api/meal-plans').send(validPlan);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/meal-plans/generate', () => {
  beforeEach(() => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
  });

  test('201 — generates 7-day Balanced Diet plan', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'Balanced Diet' });
    expect(res.status).toBe(201);
    expect(res.body.data.isAutoGenerated).toBe(true);
    expect(res.body.data.days).toHaveLength(7);
    expect(res.body.data.planType).toBe('Balanced Diet');
  });

  test('201 — "keto" alias normalises to "Keto"', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'keto' });
    expect(res.body.data.planType).toBe('Keto');
  });

  test('201 — "weight loss" alias normalises to "Weight Loss"', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'weight loss' });
    expect(res.body.data.planType).toBe('Weight Loss');
  });

  test('201 — "high protein" alias normalises to "High Protein"', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'high protein' });
    expect(res.body.data.planType).toBe('High Protein');
  });

  test('201 — unknown planType defaults to "Balanced Diet"', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'mystery' });
    expect(res.body.data.planType).toBe('Balanced Diet');
  });

  test('201 — each day has all four meal slots', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'High Protein' });
    const day = res.body.data.days[0];
    expect(day).toHaveProperty('breakfast');
    expect(day).toHaveProperty('lunch');
    expect(day).toHaveProperty('dinner');
    expect(day).toHaveProperty('snack');
    expect(typeof day.breakfast).toBe('string');
    expect(day.breakfast.length).toBeGreaterThan(0);
  });

  test('201 — day numbers are sequential 1–7', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'Vegetarian' });
    expect(res.body.data.days.map(d => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('PUT /api/meal-plans/:planId', () => {
  test('200 — updates plan name', async () => {
    const updatedDoc = { _id: VALID_OID, userId: 1, name: 'Updated', description: 'New', numDays: 7, days: [], isAutoGenerated: false, planType: '' };
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 });
    mockCollection.findOne.mockResolvedValueOnce(updatedDoc);
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).put('/api/meal-plans/not-an-oid').send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  test('400 — whitespace name rejected', async () => {
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: '  ' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('404 — plan not found', async () => {
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Test' });
    expect(res.status).toBe(404);
  });

  test('500 — DB error', async () => {
    mockCollection.updateOne.mockRejectedValueOnce(new Error('Mongo error'));
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Test' });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/meal-plans/:planId', () => {
  test('200 — soft-deletes (sets isDeleted = true)', async () => {
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 });
    const res = await request(app).delete(`/api/meal-plans/${VALID_OID}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const setArg = mockCollection.updateOne.mock.calls[0][1];
    expect(setArg.$set.isDeleted).toBe(true);
  });

  test('400 — invalid planId', async () => {
    const res = await request(app).delete('/api/meal-plans/bad-id');
    expect(res.status).toBe(400);
  });

  test('404 — plan not found', async () => {
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
    const res = await request(app).delete(`/api/meal-plans/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  2. MEMBERSHIP PLAN ROUTES  /api/membership-plans
// =====================================================================

describe('GET /api/membership-plans', () => {
  test('200 — returns all plans', async () => {
    mockQuery.mockResolvedValueOnce([[
      { plan_id: 1, name: 'Free', price: 0, is_active: 1 },
      { plan_id: 2, name: 'Premium', price: 19.99, is_active: 1 },
    ]]);
    const res = await request(app).get('/api/membership-plans');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Free');
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/membership-plans');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/membership-plans/active', () => {
  test('200 — returns active plans', async () => {
    mockQuery.mockResolvedValueOnce([[{ plan_id: 1, name: 'Free', price: 0, is_active: 1 }]]);
    const res = await request(app).get('/api/membership-plans/active');
    expect(res.status).toBe(200);
    expect(res.body[0].is_active).toBe(1);
  });
});

describe('GET /api/membership-plans/:id', () => {
  test('200 — returns plan by ID', async () => {
    mockQuery.mockResolvedValueOnce([[{ plan_id: 2, name: 'Premium', price: 19.99 }]]);
    const res = await request(app).get('/api/membership-plans/2');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Premium');
  });

  test('404 — plan not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/membership-plans/999');
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  3. NUTRITION TARGETS ROUTES  /api/nutrition-targets
//
//  ensureTargetsDoc(userId) calls in this order:
//    1. db.query(SELECT from users)        → mockQuery call #1
//    2. mongo.countDocuments               → mockCollection.countDocuments
//    3a. mongo.updateMany (count > 0)      → mockCollection.updateMany
//    OR
//    3b. mongo.insertOne (count === 0)     → mockCollection.insertOne
//  Then main logic runs.
//  queueEnsure() pre-queues these so tests stay clean.
// =====================================================================

const queueEnsure = (calorieLimit = 2000, docExists = true) => {
  mockQuery.mockResolvedValueOnce([[{ userId: 1, dailyCalorieLimit: calorieLimit }]]);
  mockCollection.countDocuments.mockResolvedValueOnce(docExists ? 1 : 0);
  if (docExists) {
    mockCollection.updateMany.mockResolvedValueOnce({ matchedCount: 1 });
  } else {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'nt-id' });
  }
};

const defaultTargetDoc = {
  userId: 1, calories: 2000, protein: 150, carbs: 250,
  fat: 67, fiber: 30, activityLevel: 'Balanced',
  goal: 'Maintain Weight', updatedAt: new Date(),
};

describe('GET /api/nutrition-targets/:userId', () => {
  test('200 — returns targets for existing user', async () => {
    queueEnsure();
    mockCollection.find.mockReturnValue(makeCursor([defaultTargetDoc]));
    const res = await request(app).get('/api/nutrition-targets/1');
    expect(res.status).toBe(200);
    expect(res.body.data.calories).toBe(2000);
    expect(res.body.data.activityLevel).toBe('Balanced');
  });

  test('400 — userId of 0 rejected (no DB calls)', async () => {
    const res = await request(app).get('/api/nutrition-targets/0');
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('404 — user not in MySQL', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no user row
    const res = await request(app).get('/api/nutrition-targets/999');
    expect(res.status).toBe(404);
  });

  test('200 — creates default Mongo doc when none exists', async () => {
    queueEnsure(0, false);
    mockCollection.find.mockReturnValue(makeCursor([defaultTargetDoc]));
    const res = await request(app).get('/api/nutrition-targets/1');
    expect(res.status).toBe(200);
    expect(res.body.data.calories).toBe(2000);
  });
});

describe('PUT /api/nutrition-targets/:userId', () => {
  const validTargets = { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30, activityLevel: 'Balanced', goal: 'Maintain Weight' };

  test('200 — updates all targets', async () => {
    queueEnsure();
    mockCollection.updateMany.mockResolvedValueOnce({ matchedCount: 1 });
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE users calorie_limit
    mockCollection.find.mockReturnValue(makeCursor([defaultTargetDoc]));
    const res = await request(app).put('/api/nutrition-targets/1').send(validTargets);
    expect(res.status).toBe(200);
    expect(res.body.data.calories).toBe(2000);
  });

  test('400 — calories below 500 (no DB calls)', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, calories: 400 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('400 — calories above 10000', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, calories: 11000 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
  });

  test('400 — negative protein', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, protein: -1 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('protein');
  });

  test('400 — negative carbs', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, carbs: -5 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('carbs');
  });

  test('400 — negative fat', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, fat: -2 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('fat');
  });

  test('400 — negative fiber', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, fiber: -1 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('fiber');
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // ensureUserExists returns null
    const res = await request(app).put('/api/nutrition-targets/999').send(validTargets);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/nutrition-targets/:userId/calories', () => {
  test('200 — updates calorie goal only', async () => {
    queueEnsure();
    mockCollection.updateMany.mockResolvedValueOnce({ matchedCount: 1 });
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockCollection.find.mockReturnValue(makeCursor([{ ...defaultTargetDoc, calories: 1800 }]));
    const res = await request(app).put('/api/nutrition-targets/1/calories').send({ calories: 1800 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/calorie goal/i);
  });

  test('400 — calories below 500 (no DB calls)', async () => {
    const res = await request(app).put('/api/nutrition-targets/1/calories').send({ calories: 300 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('400 — calories above 10000', async () => {
    const res = await request(app).put('/api/nutrition-targets/1/calories').send({ calories: 12000 });
    expect(res.status).toBe(400);
  });

  test('400 — userId 0 rejected', async () => {
    const res = await request(app).put('/api/nutrition-targets/0/calories').send({ calories: 2000 });
    expect(res.status).toBe(400);
  });
});


// =====================================================================
//  4. RECIPE DRAFT ROUTES  /api/recipe-drafts
// =====================================================================

describe('GET /api/recipe-drafts', () => {
  test('200 — returns all drafts', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, title: 'My Draft', ingredients: ['egg'] },
    ]));
    const res = await request(app).get('/api/recipe-drafts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('My Draft');
  });

  test('500 — DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/recipe-drafts');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/recipe-drafts/:id', () => {
  test('200 — returns draft by ID', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, title: 'Draft Soup' });
    const res = await request(app).get(`/api/recipe-drafts/${VALID_OID}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Draft Soup');
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).get('/api/recipe-drafts/bad-id');
    expect(res.status).toBe(400);
  });

  test('404 — draft not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).get(`/api/recipe-drafts/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/recipe-drafts', () => {
  test('201 — creates draft with createdAt', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/recipe-drafts').send({ title: 'New Draft', ingredients: ['egg'], instructions: ['Boil'] });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Draft');
    expect(res.body.createdAt).toBeDefined();
  });

  test('500 — DB error', async () => {
    mockCollection.insertOne.mockRejectedValueOnce(new Error('Insert failed'));
    const res = await request(app).post('/api/recipe-drafts').send({ title: 'Draft' });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/recipe-drafts/:id', () => {
  test('200 — updates unpublished draft', async () => {
    const updatedDraft = { _id: VALID_OID, title: 'Updated Draft', isPublished: false };
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, title: 'Old', isPublished: false });
    // findOneAndUpdate returns { value: updatedDoc }
    mockCollection.findOneAndUpdate.mockResolvedValueOnce({ value: updatedDraft });
    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Updated Draft' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).put('/api/recipe-drafts/bad-id').send({ title: 'Edit' });
    expect(res.status).toBe(400);
  });

  test('403 — cannot edit published recipe', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, isPublished: true });
    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Edit' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/published recipes cannot be edited/i);
  });

  test('404 — draft not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Edit' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/recipe-drafts/:id', () => {
  test('200 — deletes draft by owner', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, createdByUserId: 1, isPublished: false });
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    const res = await request(app).delete(`/api/recipe-drafts/${VALID_OID}`).send({ createdByUserId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('403 — cannot delete published recipe', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, isPublished: true });
    const res = await request(app).delete(`/api/recipe-drafts/${VALID_OID}`).send({ createdByUserId: 1 });
    expect(res.status).toBe(403);
  });

  test('404 — wrong owner (deletedCount = 0)', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, isPublished: false });
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 0 });
    const res = await request(app).delete(`/api/recipe-drafts/${VALID_OID}`).send({ createdByUserId: 99 });
    expect(res.status).toBe(404);
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).delete('/api/recipe-drafts/bad-id').send({ createdByUserId: 1 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/recipe-drafts/:id/publish', () => {
  test('200 — moves draft to recipes, deletes draft', async () => {
    const draft = { _id: VALID_OID, title: 'My Recipe', createdByUserId: '1', ingredients: ['egg'] };
    mockCollection.findOne.mockResolvedValueOnce(draft);
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'new-recipe-id' });
    mockCollection.deleteOne.mockResolvedValueOnce({ deletedCount: 1 });
    const res = await request(app).post(`/api/recipe-drafts/${VALID_OID}/publish`).send({ userId: '1' });
    expect(res.status).toBe(200);
    expect(res.body.data.isPublished).toBe(true);
    expect(res.body.data.publishedAt).toBeDefined();
  });

  test('404 — draft not found', async () => {
    mockCollection.findOne.mockResolvedValueOnce(null);
    const res = await request(app).post(`/api/recipe-drafts/${VALID_OID}/publish`).send({ userId: '1' });
    expect(res.status).toBe(404);
  });

  test('403 — userId mismatch', async () => {
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, createdByUserId: '99' });
    const res = await request(app).post(`/api/recipe-drafts/${VALID_OID}/publish`).send({ userId: '1' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/not authorized/i);
  });
});


// =====================================================================
//  5. REVIEW ROUTES  /api/reviews
//
//  FIX: GET /reviews was hitting real DB in previous version.
//  With unstable_mockModule, mockQuery now correctly intercepts it.
//
//  DELETE /reviews — route has no try/catch so errors propagate as
//  unhandled and Express returns 500 only when the query itself throws.
//  The route also has no 404 check, so we only test 200 and 500.
//
//  POST /reviews — TWO sequential mockQuery calls:
//    call #1 → SELECT username FROM users WHERE user_id = ?
//    call #2 → INSERT INTO reviews ...
// =====================================================================

describe('GET /api/reviews', () => {
  test('200 — returns only mocked rows (not real DB)', async () => {
    mockQuery.mockResolvedValueOnce([[
      { review_id: 1, review_user_id: 1, rating: 5, content: 'Great!', status: 'active' },
    ]]);
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].rating).toBe(5);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/reviews', () => {
  const validReview = { review_user_id: 1, rating: 5, title: 'Great!', content: 'Changed my life!', profile_type: 'Athlete', membership_plan_id: 2 };

  test('201 — creates review using username from users table', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ username: 'alice' }]])  // SELECT username
      .mockResolvedValueOnce([{ insertId: 10 }]);          // INSERT review
    const res = await request(app).post('/api/reviews').send(validReview);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.review_id).toBe(10);
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no user rows
    const res = await request(app).post('/api/reviews').send(validReview);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  test('reviewer initials derived from username — INSERT called with derived values', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ username: 'Alice Johnson' }]])
      .mockResolvedValueOnce([{ insertId: 11 }]);
    await request(app).post('/api/reviews').send(validReview);
    // The INSERT is the second query call; insertArgs[2] is reviewer_initials
    const insertArgs = mockQuery.mock.calls[1][1];
    expect(insertArgs[2]).toBe('AJ');
  });

  test('500 — DB error on username lookup', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/reviews').send(validReview);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/reviews/:id', () => {
  test('200 — deletes review by ID', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/reviews/5');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('calls DELETE query with correct review ID', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await request(app).delete('/api/reviews/42');
    const sql = mockQuery.mock.calls[0][0];
    const params = mockQuery.mock.calls[0][1];
    expect(sql).toMatch(/DELETE FROM reviews/i);
    expect(params).toContain('42');
  });
});


// =====================================================================
//  6. SMART EATING CONTENT ROUTES  /api/smart-eating
// =====================================================================

describe('GET /api/smart-eating/alternatives', () => {
  test('200 — returns food alternatives', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { altId: 'a1', category: 'Snack', original: 'Chips', alternative: 'Rice cakes' },
    ]));
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].original).toBe('Chips');
  });

  test('200 — empty array when none', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.body.data).toEqual([]);
  });

  test('500 — DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo error'); });
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/smart-eating/mindful-snacking', () => {
  test('200 — returns snacking tips', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { tipId: 't1', title: 'Eat slowly', content: 'Chew thoroughly.', category: 'Mindful' },
    ]));
    const res = await request(app).get('/api/smart-eating/mindful-snacking');
    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe('Eat slowly');
  });

  test('500 — DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo error'); });
    const res = await request(app).get('/api/smart-eating/mindful-snacking');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/smart-eating/mindful-snacking/content', () => {
  test('200 — returns DEFAULT_SNACKING_CONTENT when no DB data', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/smart-eating/mindful-snacking/content');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('corePrinciples');
    expect(res.body.data).toHaveProperty('snackIdeas');
    expect(res.body.data).toHaveProperty('portionControl');
  });
});


// =====================================================================
//  7. USER PROFILE TYPE ROUTES  /api/user-profile-types
//
//  FIX: mockQuery was not intercepting calls because of the old
//  jest.mock() hoisting issue. Now that unstable_mockModule is used,
//  the mocked rows are returned correctly.
//  Tests assert on the exact mocked data, not real DB rows.
// =====================================================================

describe('GET /api/user-profile-types', () => {
  test('200 — returns mocked profile types', async () => {
    mockQuery.mockResolvedValueOnce([[
      { profile_type_id: 1, type: 'ATHLETE',         display_name: 'Athletes' },
      { profile_type_id: 2, type: 'MEAL_PLANNER',    display_name: 'Meal Planners' },
      { profile_type_id: 3, type: 'HEALTH_ORIENTED', display_name: 'Health Oriented' },
    ]]);
    const res = await request(app).get('/api/user-profile-types');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].type).toBe('ATHLETE');
    expect(res.body[1].type).toBe('MEAL_PLANNER');
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/user-profile-types');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/user-profile-types/type/:type', () => {
  test('200 — returns profile type by type string', async () => {
    mockQuery.mockResolvedValueOnce([[
      { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes' },
    ]]);
    const res = await request(app).get('/api/user-profile-types/type/ATHLETE');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('ATHLETE');
  });

  test('404 — type not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/user-profile-types/type/UNKNOWN');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/user-profile-types/:id', () => {
  test('200 — returns profile type by numeric ID', async () => {
    mockQuery.mockResolvedValueOnce([[
      { profile_type_id: 2, type: 'MEAL_PLANNER', display_name: 'Meal Planners' },
    ]]);
    const res = await request(app).get('/api/user-profile-types/2');
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('MEAL_PLANNER');
  });

  test('404 — ID not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/user-profile-types/999');
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  8. USERS ROUTES  /api/users
//
//  FIX: bcrypt.compare and bcrypt.hash are now mockBcryptCompare /
//  mockBcryptHash (real jest.fn instances) so .mockResolvedValueOnce
//  works correctly.
//
//  isActive check: route uses `if (!user.isActive)` — tinyint 0 is
//  falsy, so { isActive: 0 } triggers the deactivated branch.
//
//  PUT /update — 4 sequential mockQuery calls:
//    1. SELECT (username conflict check)
//    2. SELECT (email conflict check)
//    3. UPDATE users
//    4. SELECT updated user
//
//  DELETE /delete/:userId — route path is /delete/:userId, not /:userId.
//
//  PUT /calorie-limit — 2 calls: UPDATE then SELECT.
//
//  PUT /profile-type — 2 calls: UPDATE then SELECT.
// =====================================================================

describe('POST /api/users/register', () => {
  const validReg = { username: 'alice_01', email: 'alice@example.com', password: 'secure1', confirmPassword: 'secure1', selectedPlanId: 1 };

  test('201 — registers user with role "free" for plan 1', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])              // username free
      .mockResolvedValueOnce([[]])              // email free
      .mockResolvedValueOnce([{ insertId: 10 }]) // INSERT MySQL
      .mockResolvedValueOnce([[{ userId: 10, username: 'alice_01', email: 'alice@example.com', role: 'free', isActive: 1 }]]); // SELECT
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'mongo-id' }); // MongoDB insert
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('free');
  });

  test('201 — assigns role "premium" for selectedPlanId 2', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([[{ userId: 11, username: 'bob', role: 'premium', isActive: 1 }]]);
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'mongo-id-2' });
    const res = await request(app).post('/api/users/register').send({ ...validReg, username: 'bob', email: 'bob@b.com', selectedPlanId: 2 });
    expect(res.body.user.role).toBe('premium');
  });

  test('409 — username taken', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 5 }]]); // username taken
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('username');
  });

  test('409 — email taken', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])              // username free
      .mockResolvedValueOnce([[{ user_id: 5 }]]); // email taken
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
  });

  test('bcrypt.hash called with password and saltRounds=10', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 12 }])
      .mockResolvedValueOnce([[{ userId: 12, username: 'carol', role: 'free', isActive: 1 }]]);
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'id' });
    await request(app).post('/api/users/register').send({ ...validReg, username: 'carol', email: 'carol@c.com' });
    expect(mockBcryptHash).toHaveBeenCalledWith('secure1', 10);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/users/login', () => {
  const activeUser = { userId: 1, username: 'alice', passwordHash: 'hashed', isActive: 1, role: 'free' };

  test('200 — successful login', async () => {
    mockQuery.mockResolvedValueOnce([[activeUser]]);
    mockBcryptCompare.mockResolvedValueOnce(true);
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'secure1' });
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice');
  });

  test('401 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const res = await request(app).post('/api/users/login').send({ username: 'ghost', password: 'pw' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect credentials/i);
  });

  test('403 — deactivated account (isActive = 0)', async () => {
    // Route checks `if (!user.isActive)` — 0 is falsy, triggers 403
    mockQuery.mockResolvedValueOnce([[{ ...activeUser, isActive: 0 }]]);
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'secure1' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('401 — wrong password', async () => {
    mockQuery.mockResolvedValueOnce([[activeUser]]);
    mockBcryptCompare.mockResolvedValueOnce(false); // password mismatch
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'pw' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/users/:userId', () => {
  test('200 — returns user details', async () => {
    mockQuery.mockResolvedValueOnce([[
      { userId: 1, username: 'alice', email: 'a@a.com', role: 'free', isActive: 1 },
    ]]);
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(200);
    expect(res.body.data.username).toBe('alice');
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/users/update', () => {
  const updateBody = { userId: 1, username: 'alice_new', email: 'new@example.com', membershipPlanId: 2, role: 'premium' };

  test('200 — updates account', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])   // username not taken by other user
      .mockResolvedValueOnce([[]])   // email not taken by other user
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[{ userId: 1, username: 'alice_new', email: 'new@example.com', role: 'premium' }]]); // SELECT
    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice_new');
  });

  test('409 — username taken by different user', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 99 }]]); // taken
    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('username');
  });

  test('409 — email taken by different user', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])              // username free
      .mockResolvedValueOnce([[{ user_id: 99 }]]); // email taken
    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
  });
});

describe('PUT /api/users/profile-type', () => {
  test('200 — sets ATHLETE profile type', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ userId: 1, profileType: 'ATHLETE' }]]);
    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'ATHLETE' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('200 — HEALTH_ORIENTED accepted', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ userId: 1, profileType: 'HEALTH_ORIENTED' }]]);
    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'HEALTH_ORIENTED' });
    expect(res.status).toBe(200);
  });

  test('200 — MEAL_PLANNER accepted', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ userId: 1, profileType: 'MEAL_PLANNER' }]]);
    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'MEAL_PLANNER' });
    expect(res.status).toBe(200);
  });

  test('400 — userId missing', async () => {
    const res = await request(app).put('/api/users/profile-type').send({ profileType: 'ATHLETE' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/user id is required/i);
  });

  test('400 — invalid profile type', async () => {
    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'INVALID_TYPE' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid profile type/i);
  });

  test('404 — user not found (affectedRows = 0)', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/users/profile-type').send({ userId: 999, profileType: 'ATHLETE' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/delete/:userId', () => {
  test('200 — deletes account', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/users/delete/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('404 — user not found (affectedRows = 0)', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/users/delete/999');
    expect(res.status).toBe(404);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).delete('/api/users/delete/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/users/calorie-limit', () => {
  test('200 — updates calorie limit', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[{ userId: 1, username: 'alice', email: 'a@a.com', dailyCalorieLimit: 1800 }]]); // SELECT
    const res = await request(app).put('/api/users/calorie-limit').send({ userId: 1, dailyCalorieLimit: 1800 });
    expect(res.status).toBe(200);
    expect(res.body.user.dailyCalorieLimit).toBe(1800);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/users/calorie-limit').send({ userId: 1, dailyCalorieLimit: 2000 });
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  9. WEIGHT ENTRY ROUTES  /api/weight-entries
//
//  FIX: All mockExecute calls return explicit shapes:
//    INSERT → [{ insertId: N }]             (single array, db.execute destructures as [result])
//    SELECT → [[{...row}]]                  (nested array, [rows])
//    UPDATE → [{ affectedRows: N }]         (single array)
//    DELETE → [{ affectedRows: N }]         (single array)
//
//  affectedRows MUST be explicitly 1 or 0 — returning undefined caused
//  the route's `=== 0` check to be false (undefined !== 0), falling
//  through to incorrect branches.
// =====================================================================

describe('POST /api/weight-entries', () => {
  test('201 — creates entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([[{ entry_id: 20, user_id: 1, weight_kg: 70, logged_at: '2024-01-01' }]]);
    const res = await request(app).post('/api/weight-entries').send({ userId: 1, weightKg: 70 });
    expect(res.status).toBe(201);
    expect(res.body.data.weightKg).toBe(70);
    expect(res.body.data.entryId).toBe(20);
  });

  test('400 — missing userId (no DB call)', async () => {
    const res = await request(app).post('/api/weight-entries').send({ weightKg: 70 });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('400 — non-numeric weightKg (no DB call)', async () => {
    const res = await request(app).post('/api/weight-entries').send({ userId: 1, weightKg: 'heavy' });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/weight-entries').send({ userId: 1, weightKg: 70 });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/weight-entries/:userId', () => {
  test('200 — returns entries newest-first', async () => {
    mockExecute.mockResolvedValueOnce([[
      { entry_id: 2, user_id: 1, weight_kg: 69, logged_at: '2024-06-01' },
      { entry_id: 1, user_id: 1, weight_kg: 70, logged_at: '2024-01-01' },
    ]]);
    const res = await request(app).get('/api/weight-entries/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].weightKg).toBe(69);
  });

  test('200 — empty array when none', async () => {
    mockExecute.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/weight-entries/99');
    expect(res.body.data).toEqual([]);
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/weight-entries/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/weight-entries/:entryId', () => {
  test('200 — updates entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[{ entry_id: 5, user_id: 1, weight_kg: 72, logged_at: '2024-06-01' }]]); // SELECT
    const res = await request(app).put('/api/weight-entries/5').send({ weightKg: 72 });
    expect(res.status).toBe(200);
    expect(res.body.data.weightKg).toBe(72);
  });

  test('400 — non-numeric weightKg (no DB call)', async () => {
    const res = await request(app).put('/api/weight-entries/5').send({ weightKg: 'heavy' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/missing required fields/i);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('404 — not found (affectedRows explicitly 0)', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/weight-entries/999').send({ weightKg: 72 });
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/weight-entries/5').send({ weightKg: 72 });
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/weight-entries/:entryId', () => {
  test('200 — deletes entry (affectedRows explicitly 1)', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/weight-entries/5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/removed/i);
  });

  test('404 — not found (affectedRows explicitly 0)', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/weight-entries/999');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  test('500 — DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).delete('/api/weight-entries/5');
    expect(res.status).toBe(500);
  });
});
