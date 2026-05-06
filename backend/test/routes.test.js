/**
 * BiteWise — Backend Route Tests Part 1 — UPDATED FOR CHANGED ROUTES
 * =====================================================================
 * CHANGES APPLIED vs PREVIOUS VERSION:
 *
 * 1. adminroute.js — approve/reject routes MOVED from curatorapplication
 *    into adminroute. Now at PUT /api/admin/:applicationId/approve and
 *    PUT /api/admin/:applicationId/reject. Approve makes 4 queries:
 *    SELECT app, UPDATE app status, UPDATE user role, INSERT curator_profile.
 *    Reject makes 1 query (UPDATE only, no SELECT after).
 *
 * 2. curatorapplicationroute.js — now only POST / and GET /. All approve/
 *    reject tests removed from this describe block.
 *
 * 3. healthgoalroute.js — mapGoal() maps snake_case DB rows to camelCase.
 *    Mock rows must use snake_case keys (goal_type, user_id, etc).
 *
 * 4. reviewroute.js — reviewer_initials derived as:
 *    username.split(' ').map(w => w[0]).join('').toUpperCase()
 *    Single-word 'alice' → 'A'. Test uses 'Alice Johnson' → 'AJ'.
 *
 * 5. usersroute.js — register: 4 db.query calls + 1 mongo insertOne.
 *    profile-type PUT: mockQuery returns [{ affectedRows }] for UPDATE
 *    then [[...rows]] for SELECT (two calls, both query not execute).
 *    delete/calorie-limit both use db.query (not db.execute).
 *
 * Place at:  backend/__tests__/routes.test.js
 * Run with:  node --experimental-vm-modules node_modules/.bin/jest
 * =====================================================================
 */

import request  from 'supertest';
import express  from 'express';
import { jest, describe, test, expect, beforeEach, beforeAll } from '@jest/globals';

// ─── Step 1: Declare mock functions BEFORE mockModule calls ───────────

const mockQuery   = jest.fn();
const mockExecute = jest.fn();

const mockCollection = {
  find:             jest.fn(),
  findOne:          jest.fn(),
  insertOne:        jest.fn(),
  updateOne:        jest.fn(),
  deleteOne:        jest.fn(),
  aggregate:        jest.fn(),
  findOneAndUpdate: jest.fn(),
};

const mockBcryptHash    = jest.fn().mockResolvedValue('hashed_password');
const mockBcryptCompare = jest.fn().mockResolvedValue(true);

const makeCursor = (docs = []) => ({
  sort:    jest.fn().mockReturnThis(),
  limit:   jest.fn().mockReturnThis(),
  skip:    jest.fn().mockReturnThis(),
  project: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue(docs),
});

const makeAggregateCursor = (docs = []) => ({
  toArray: jest.fn().mockResolvedValue(docs),
});

const mockSearchFoodProduct = jest.fn();
const mockGetNutritionInfo  = jest.fn();
const mockMapProduct        = jest.fn((p) =>
  p ? { name: p.product_name || 'Mock Food', barcode: p.code || '000', nutrition: {} } : null
);

// ─── Step 2: Register mocks BEFORE imports ────────────────────────────

jest.unstable_mockModule('../db_sql/db.js', () => ({
  default: { query: mockQuery, execute: mockExecute },
}));

jest.unstable_mockModule('../db_mongodb/db.js', () => ({
  getDB:     jest.fn(() => ({ collection: jest.fn(() => mockCollection) })),
  connectDB: jest.fn(),
}));

jest.unstable_mockModule('bcrypt', () => ({
  default: { hash: mockBcryptHash, compare: mockBcryptCompare },
  hash:    mockBcryptHash,
  compare: mockBcryptCompare,
}));

jest.unstable_mockModule('uuid', () => ({
  v4:      jest.fn(() => 'mock-uuid-1234'),
  default: { v4: jest.fn(() => 'mock-uuid-1234') },
}));

jest.unstable_mockModule('../routes/apiroute.js', () => ({
  searchFoodProduct: mockSearchFoodProduct,
  getNutritionInfo:  mockGetNutritionInfo,
  mapProduct:        mockMapProduct,
  default:           {},
}));

// ─── Step 3: Dynamic imports AFTER mocks are registered ──────────────

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
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCollection.find.mockReturnValue(makeCursor([]));
  mockCollection.findOne.mockResolvedValue(null);
  mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
  mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
  mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });
  mockBcryptHash.mockResolvedValue('hashed_password');
  mockBcryptCompare.mockResolvedValue(true);
});


// =====================================================================
//  1. ADMIN ROUTES  /api/admin
//
//  CHANGED: approve/reject routes now live in adminroute.js at:
//    PUT /api/admin/:applicationId/approve  (4 queries)
//    PUT /api/admin/:applicationId/reject   (1 query)
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
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).post('/api/admin/login').send({ username: 'nobody', password: 'x' });
    expect(res.status).toBe(401);
  });

  test('401 — wrong password', async () => {
    mockQuery.mockResolvedValueOnce([[{ admin_id: 1, username: 'admin', password: 'correct' }]]);
    const res = await request(app).post('/api/admin/login').send({ username: 'admin', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).post('/api/admin/login').send({ username: 'admin', password: 'secret' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/admin/users', () => {
  test('200 — returns user list', async () => {
    mockQuery.mockResolvedValueOnce([[{ userId: 1, username: 'alice', role: 'FREE', isActive: 1 }]]);
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(200);
    expect(res.body.data[0].username).toBe('alice');
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
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
});

describe('PUT /api/admin/reactivate', () => {
  test('200 — reactivates user', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).put('/api/admin/reactivate').send({ userId: 5 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/reactivated/i);
  });
});

// CHANGED: approve now makes 4 queries and is at /api/admin/:id/approve
describe('PUT /api/admin/:applicationId/approve', () => {
  test('200 — approves, promotes user, creates curator profile', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ user_id: 5, expertise: 'Nutrition', journey: 'J', motivation: 'M' }]]) // SELECT app
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE app status
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE user role
      .mockResolvedValueOnce([{ insertId: 1 }]);       // INSERT curator_profile

    const res = await request(app).put('/api/admin/1/approve').send({ adminId: 'admin-1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/approved/i);
  });

  test('404 — application not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // SELECT returns empty
    const res = await request(app).put('/api/admin/999/approve').send({ adminId: 'admin-1' });
    expect(res.status).toBe(404);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/admin/1/approve').send({ adminId: 'admin-1' });
    expect(res.status).toBe(500);
  });
});

// CHANGED: reject now makes 1 query and is at /api/admin/:id/reject
describe('PUT /api/admin/:applicationId/reject', () => {
  test('200 — rejects application', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE only
    const res = await request(app).put('/api/admin/1/reject').send({ adminId: 'admin-1', reason: 'Not enough detail' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/rejected/i);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/admin/1/reject').send({ adminId: 'admin-1', reason: 'No' });
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  2. BLOG POST ROUTES  /api/blog-posts
//  (blogpostroute.js unchanged — same tests as before)
// =====================================================================

describe('GET /api/blog-posts/published', () => {
  test('200 — returns published posts', async () => {
    mockCollection.find.mockReturnValue(makeCursor([{
      _id: VALID_OID, blogPostId: 'bp_1', curatorUserId: 1,
      title: 'Hello World', content: 'Content', status: 'PUBLISHED',
      tags: [], likeCount: 0, viewCount: 0, createdAt: new Date().toISOString(),
    }]));
    const res = await request(app).get('/api/blog-posts/published');
    expect(res.status).toBe(200);
    expect(res.body.data[0].status).toBe('PUBLISHED');
  });

  test('200 — empty array', async () => {
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
      tags: [], likeCount: 0, viewCount: 0, createdAt: new Date().toISOString(),
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

  test('201 — creates post as DRAFT with viewCount:0', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/blog-posts').send(validPost);
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.viewCount).toBe(0);
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
    const post = { blogPostId: 'bp_1', curatorUserId: 2, status: 'DRAFT', likeCount: 0, viewCount: 0, tags: [], createdAt: new Date().toISOString() };
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
    const post = { blogPostId: 'bp_1', curatorUserId: 2, status: 'PUBLISHED', likeCount: 0, viewCount: 0, tags: [], createdAt: new Date().toISOString() };
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
    const post = { blogPostId: 'bp_1', curatorUserId: 2, title: 'Old', content: 'Old content.', status: 'DRAFT', tags: [], likeCount: 0, viewCount: 0, createdAt: new Date().toISOString() };
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
//  CHANGED: only POST / and GET / remain — approve/reject moved to adminroute
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


// =====================================================================
//  4. DIARY ENTRY ROUTES  /api/diary-entries (unchanged)
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
//  5. DINE OUT ROUTES  /api/dine-out (unchanged)
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
  test('200 — filters by 110% calorie budget', async () => {
    mockCollection.find.mockReturnValue(makeCursor([{
      _id: VALID_OID, name: 'Healthy Bites', cuisine: 'Salad', rating: 4,
      menuItems: [
        { itemId: 'm1', name: 'Garden Salad', calories: 300, protein: 10, carbs: 30, fat: 8, tags: [] },
        { itemId: 'm2', name: 'Steak', calories: 900, protein: 50, carbs: 0, fat: 40, tags: [] },
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
//  CHANGED: now has PUT /:entryId and DELETE /:entryId
// =====================================================================

describe('POST /api/exercise-entries', () => {
  test('201 — Running 30 mins = 300 cal', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 99 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'Running', durationMins: 30, notes: '' });
    expect(res.status).toBe(201);
    expect(res.body.data.caloriesBurned).toBe(300);
  });

  test('201 — HIIT 45 mins = 540 cal', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 2 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'HIIT', durationMins: 45 });
    expect(res.body.data.caloriesBurned).toBe(540);
  });

  test('201 — unknown type defaults to 5 cal/min', async () => {
    mockExecute.mockResolvedValueOnce([{ insertId: 3 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'Dancing', durationMins: 60 });
    expect(res.body.data.caloriesBurned).toBe(300);
  });

  test('400 — missing fields (no DB call)', async () => {
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
});

describe('PUT /api/exercise-entries/:entryId', () => {
  test('200 — updates entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ entry_id: 5, user_id: 1, exercise_type: 'Cycling', duration_mins: 40, calories_burned: 320, notes: '', logged_at: new Date() }]]);
    const res = await request(app).put('/api/exercise-entries/5').send({ exerciseType: 'Cycling', durationMins: 40, notes: '' });
    expect(res.status).toBe(200);
    expect(res.body.data.exerciseType).toBe('Cycling');
  });

  test('400 — invalid entryId (0)', async () => {
    const res = await request(app).put('/api/exercise-entries/0').send({ exerciseType: 'Running', durationMins: 30 });
    expect(res.status).toBe(400);
  });

  test('404 — entry not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/exercise-entries/999').send({ exerciseType: 'Running', durationMins: 30 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/exercise-entries/:entryId', () => {
  test('200 — deletes entry', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/exercise-entries/5');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('404 — not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/exercise-entries/999');
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  7. FOOD INTAKE ENTRY ROUTES  /api/food-entries (unchanged)
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
//  8. FOOD ITEM ROUTES  /api/food-items (unchanged)
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
  test('201 — creates item', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/food-items').send({ name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6 });
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Chicken Breast');
  });

  test('400 — name missing', async () => {
    const res = await request(app).post('/api/food-items').send({ calories: 165 });
    expect(res.status).toBe(400);
  });
});


// =====================================================================
//  9. FOOD SEARCH ROUTES  /api/food-api (unchanged)
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

  test('503 — external API unavailable', async () => {
    mockSearchFoodProduct.mockResolvedValueOnce({ apiError: true, products: [] });
    const res = await request(app).get('/api/food-api/search?searchTerm=rice');
    expect(res.status).toBe(503);
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
//  10. GROCERY LIST ROUTES  /api/grocery-lists (unchanged)
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
//  CHANGED: mock rows must use snake_case keys to match mapGoal()
//  mapGoal: row.goal_type → goalType, row.user_id → userId etc.
// =====================================================================

describe('GET /api/health-goals/active/:userId', () => {
  // CRITICAL: mock rows must use snake_case to match DB column names
  const goalRow = {
    goal_id: 1,
    user_id: 1,
    goal_type: 'Lose Weight',   // mapGoal reads row.goal_type
    custom_goal: null,
    target_weight: 65,
    target_calories: 1800,
    activity_level: 'Moderate',
    target_date: '2024-12-31',
    is_active: 1,
    created_at: '2024-01-01',
    updated_at: '2024-01-01',
  };

  test('200 — returns active goal with camelCase mapping', async () => {
    mockQuery.mockResolvedValueOnce([[goalRow]]);
    const res = await request(app).get('/api/health-goals/active/1');
    expect(res.status).toBe(200);
    expect(res.body.data.goalType).toBe('Lose Weight');
    expect(res.body.data.targetCalories).toBe(1800);
  });

  test('200 — null when no goal (two queries consumed)', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])  // active query → empty
      .mockResolvedValueOnce([[]]); // latest fallback → empty
    const res = await request(app).get('/api/health-goals/active/99');
    expect(res.status).toBe(200);
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

  test('200 — creates goal (deactivates old ones first)', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // UPDATE SET is_active = FALSE
      .mockResolvedValueOnce([{ insertId: 5 }])         // INSERT new goal
      .mockResolvedValueOnce([[{                        // SELECT to return created goal (snake_case)
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
//  12. HEALTH REPORT ROUTES  /api/health-reports (unchanged)
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
});


// =====================================================================
//  13. HEIGHT ENTRY ROUTES  /api/height-entries (unchanged)
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

  test('400 — missing userId (no DB call)', async () => {
    const res = await request(app).post('/api/height-entries').send({ heightCm: 175 });
    expect(res.status).toBe(400);
    expect(mockExecute).not.toHaveBeenCalled();
  });

  test('400 — non-numeric heightCm (no DB call)', async () => {
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

  test('400 — non-numeric heightCm (no DB call)', async () => {
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
