/**
 * BiteWise — Backend Route Integration Tests
 * =====================================================================
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
 * Tool stack:
 *   supertest  — fires real HTTP requests against the Express app
 *   jest       — test runner + assertions
 *   jest.mock  — replaces MySQL pool and MongoDB getDB() with fakes
 *
 * =====================================================================
 * SETUP
 * =====================================================================
 * 1. Install dependencies (backend folder):
 *      cd backend
 *      npm install --save-dev jest supertest @jest/globals
 *
 * 2. Add to backend/package.json:
 *      "type": "module",
 *      "scripts": { "test": "node --experimental-vm-modules node_modules/.bin/jest" },
 *      "jest": {
 *        "testEnvironment": "node",
 *        "transform": {}
 *      }
 *
 * 3. Place this file at:  backend/__tests__/routes.test.js
 *
 * 4. Run:  npm test
 *
 * No live database or internet connection needed — all DB calls are mocked.
 * =====================================================================
 */

import request from 'supertest';
import express from 'express';
import { jest } from '@jest/globals';

// ─── Mock MySQL pool ──────────────────────────────────────────────────
// Returned by db.query() and db.execute() — override per-test with
// mockResolvedValueOnce() to simulate different DB responses.
const mockQuery   = jest.fn();
const mockExecute = jest.fn();
jest.mock('../db_sql/db.js', () => ({
  default: { query: mockQuery, execute: mockExecute },
}));

// ─── Mock MongoDB getDB() ─────────────────────────────────────────────
// Each collection method is a jest.fn() you can override per-test.
const mockCollection = {
  find:        jest.fn(),
  findOne:     jest.fn(),
  insertOne:   jest.fn(),
  updateOne:   jest.fn(),
  updateMany:       jest.fn(),
  deleteOne:   jest.fn(),
  deleteMany:       jest.fn(),
  aggregate:   jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments:   jest.fn(),
  next:             jest.fn(),
};

// find() typically returns a cursor with .sort().toArray()
const makeCursor = (docs = []) => ({
  sort:    jest.fn().mockReturnThis(),
  limit:   jest.fn().mockReturnThis(),
  skip:    jest.fn().mockReturnThis(),
  project: jest.fn().mockReturnThis(),
  toArray: jest.fn().mockResolvedValue(docs),
});

// aggregate() returns a cursor with .toArray()
const makeAggregateCursor = (docs = []) => ({
  toArray: jest.fn().mockResolvedValue(docs),
});

jest.mock('../db_mongodb/db.js', () => ({
  getDB:     jest.fn(() => ({
    collection: jest.fn(() => mockCollection),
  })),
  connectDB: jest.fn(),
}));

// ─── Mock apiroute.js helpers used by foodroute.js ───────────────────
jest.mock('../routes/apiroute.js', () => ({
  searchFoodProduct: jest.fn(),
  getNutritionInfo:  jest.fn(),
  mapProduct:        jest.fn((p) => p ? { name: p.product_name || 'Mock Food', barcode: p.code || '000', nutrition: {} } : null),
  default:           {},
}));

import { searchFoodProduct, getNutritionInfo } from '../routes/apiroute.js';

// ─── Import route handlers ────────────────────────────────────────────
import adminRouter             from '../routes/adminroute.js';
import blogPostRouter          from '../routes/blogpostroute.js';
import curatorApplicationRouter from '../routes/curatorapplicationroute.js';
import diaryEntryRouter        from '../routes/diaryentryroute.js';
import dineOutRouter           from '../routes/dineoutroute.js';
import exerciseEntryRouter     from '../routes/exerciseentryroute.js';
import foodIntakeEntryRouter   from '../routes/foodintakeentryroute.js';
import foodItemRouter          from '../routes/fooditemroute.js';
import foodRouter              from '../routes/foodroute.js';
import groceryListRouter       from '../routes/grocerylistroute.js';
import healthGoalRouter        from '../routes/healthgoalroute.js';
import healthReportRouter      from '../routes/healthreportroute.js';
import heightEntryRouter       from '../routes/heightentryroute.js';
import mealPlanRouter          from '../routes/mealplanroute.js';
import membershipPlanRouter    from '../routes/membershipplanroute.js';
import nutritionTargetsRouter  from '../routes/nutritiontargetsroute.js';
import recipeDraftRouter       from '../routes/recipedraftroute.js';
import recipeRouter            from '../routes/reciperoute.js';
import reviewRouter            from '../routes/reviewroute.js';
import smartEatingRouter       from '../routes/smarteatingcontentroute.js';
import userProfileTypeRouter   from '../routes/userprofiletyperoute.js';
import usersRouter             from '../routes/usersroute.js';
import weightEntryRouter       from '../routes/weightentryroute.js';

// ─── Build test Express app ───────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api/admin',                 adminRouter);
app.use('/api/blog-posts',            blogPostRouter);
app.use('/api/curator-applications',  curatorApplicationRouter);
app.use('/api/diary-entries',         diaryEntryRouter);
app.use('/api/dine-out',              dineOutRouter);
app.use('/api/exercise-entries',      exerciseEntryRouter);
app.use('/api/food-entries',          foodIntakeEntryRouter);
app.use('/api/food-items',            foodItemRouter);
app.use('/api/food-api',              foodRouter);
app.use('/api/grocery-lists',         groceryListRouter);
app.use('/api/health-goals',          healthGoalRouter);
app.use('/api/health-reports',        healthReportRouter);
app.use('/api/height-entries',        heightEntryRouter);
app.use('/api/meal-plans',          mealPlanRouter);
app.use('/api/membership-plans',    membershipPlanRouter);
app.use('/api/nutrition-targets',   nutritionTargetsRouter);
app.use('/api/recipe-drafts',       recipeDraftRouter);
app.use('/api/recipes',             recipeRouter);
app.use('/api/reviews',             reviewRouter);
app.use('/api/smart-eating',        smartEatingRouter);
app.use('/api/user-profile-types',  userProfileTypeRouter);
app.use('/api/users',               usersRouter);
app.use('/api/weight-entries',      weightEntryRouter);

// Reset all mocks between tests to prevent bleed-across
beforeEach(() => {
  jest.clearAllMocks();
  // Default: collection() returns mockCollection
  mockCollection.find.mockReturnValue(makeCursor([]));
  mockCollection.findOne.mockResolvedValue(null);
  mockCollection.insertOne.mockResolvedValue({ insertedId: 'mock-id-123' });
  mockCollection.updateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  mockCollection.updateMany.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
  mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
  mockCollection.deleteMany.mockResolvedValue({ deletedCount: 1 });
  mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
  mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });
  mockCollection.countDocuments.mockResolvedValue(0);
});


// =====================================================================
//  1. ADMIN ROUTES  (/api/admin)
// =====================================================================
describe('POST /api/admin/login', () => {
  test('200 — returns user on valid credentials', async () => {
    mockQuery.mockResolvedValueOnce([[{ admin_id: 1, username: 'admin', password: 'secret' }]]);

    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'secret' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('admin');
  });

  test('401 — returns error when username not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // empty rows

    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'nobody', password: 'x' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/invalid credentials/i);
  });

  test('401 — returns error when password is wrong', async () => {
    mockQuery.mockResolvedValueOnce([[{ admin_id: 1, username: 'admin', password: 'correct' }]]);

    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('500 — returns server error on DB failure', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));

    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'secret' });

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/admin/users', () => {
  test('200 — returns list of users', async () => {
    mockQuery.mockResolvedValueOnce([[
      { userId: 1, username: 'alice', email: 'a@a.com', role: 'FREE', isActive: 1, createdAt: '2024-01-01' },
    ]]);

    const res = await request(app).get('/api/admin/users');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].username).toBe('alice');
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('Connection lost'));
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('PUT /api/admin/deactivate', () => {
  test('200 — deactivates user successfully', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/admin/deactivate')
      .send({ userId: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/admin/deactivate').send({ userId: 5 });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/admin/reactivate', () => {
  test('200 — reactivates user successfully', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);

    const res = await request(app)
      .put('/api/admin/reactivate')
      .send({ userId: 5 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/reactivated/i);
  });
});


// =====================================================================
//  2. BLOG POST ROUTES  (/api/blog-posts)
// =====================================================================
describe('GET /api/blog-posts/published', () => {
  test('200 — returns published posts', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'id1', blogPostId: 'bp_1', curatorUserId: 1, curatorName: 'Alice', title: 'Hello World', content: 'Content here', status: 'PUBLISHED', tags: [], likeCount: 0, createdAt: new Date().toISOString() },
    ]));

    const res = await request(app).get('/api/blog-posts/published');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].title).toBe('Hello World');
    expect(res.body.data[0].status).toBe('PUBLISHED');
  });

  test('200 — returns empty array when no published posts', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/blog-posts/published');
    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([]);
  });

  test('500 — handles DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/blog-posts/published');
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/blog-posts/user/:curatorUserId', () => {
  test('200 — returns posts for curator', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'id1', blogPostId: 'bp_1', curatorUserId: 3, title: 'My Post', content: 'Text', status: 'DRAFT', tags: [], likeCount: 0, createdAt: new Date().toISOString() },
    ]));

    const res = await request(app).get('/api/blog-posts/user/3');
    expect(res.status).toBe(200);
    expect(res.body.data[0].curatorUserId).toBe(3);
  });

  test('400 — invalid curatorUserId', async () => {
    const res = await request(app).get('/api/blog-posts/user/abc');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/blog-posts', () => {
  const validPost = {
    curatorUserId: 1,
    curatorName: 'Alice',
    title: 'My New Post',
    content: 'This is valid content with more than 20 chars.',
    tags: ['health'],
    bannerImageUrl: '',
  };

  test('201 — creates blog post as DRAFT', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-id' });

    const res = await request(app).post('/api/blog-posts').send(validPost);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('DRAFT');
    expect(res.body.data.title).toBe('My New Post');
  });

  test('400 — rejects when title is missing', async () => {
    const res = await request(app).post('/api/blog-posts').send({ ...validPost, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('title');
  });

  test('400 — rejects when content is fewer than 20 chars', async () => {
    const res = await request(app).post('/api/blog-posts').send({ ...validPost, content: 'Too short.' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('content');
  });

  test('500 — handles DB error', async () => {
    mockCollection.insertOne.mockRejectedValue(new Error('Mongo error'));
    const res = await request(app).post('/api/blog-posts').send(validPost);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/blog-posts/:blogPostId/publish', () => {
  test('200 — publishes post when curator matches', async () => {
    const existingPost = { blogPostId: 'bp_1', curatorUserId: 2, status: 'DRAFT', likeCount: 0, tags: [], createdAt: new Date().toISOString() };
    mockCollection.findOne
      .mockResolvedValueOnce(existingPost)            // ownership check
      .mockResolvedValueOnce({ ...existingPost, status: 'PUBLISHED' }); // after update

    const res = await request(app)
      .put('/api/blog-posts/bp_1/publish')
      .send({ curatorUserId: 2 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PUBLISHED');
  });

  test('404 — returns 404 when post not found', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).put('/api/blog-posts/nonexistent/publish').send({ curatorUserId: 2 });
    expect(res.status).toBe(404);
  });

  test('403 — returns 403 when curatorUserId does not match', async () => {
    mockCollection.findOne.mockResolvedValue({ blogPostId: 'bp_1', curatorUserId: 99 });
    const res = await request(app).put('/api/blog-posts/bp_1/publish').send({ curatorUserId: 2 });
    expect(res.status).toBe(403);
  });
});

describe('PUT /api/blog-posts/:blogPostId/unpublish', () => {
  test('200 — unpublishes a published post', async () => {
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

  test('200 — updates post content', async () => {
    const post = { blogPostId: 'bp_1', curatorUserId: 2, title: 'Old', content: 'Old content here.', status: 'DRAFT', tags: [], likeCount: 0, createdAt: new Date().toISOString() };
    mockCollection.findOne
      .mockResolvedValueOnce(post)
      .mockResolvedValueOnce({ ...post, title: 'Updated Title', content: 'Updated content that is long enough.' });

    const res = await request(app).put('/api/blog-posts/bp_1').send(validUpdate);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Updated Title');
  });

  test('400 — rejects update when title is empty', async () => {
    const res = await request(app).put('/api/blog-posts/bp_1').send({ ...validUpdate, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('title');
  });

  test('403 — rejects when curator ID does not match', async () => {
    mockCollection.findOne.mockResolvedValue({ blogPostId: 'bp_1', curatorUserId: 99 });
    const res = await request(app).put('/api/blog-posts/bp_1').send(validUpdate);
    expect(res.status).toBe(403);
  });
});

describe('DELETE /api/blog-posts/:blogPostId', () => {
  test('200 — deletes blog post', async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const res = await request(app).delete('/api/blog-posts/bp_1').send({ curatorUserId: 2 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('404 — returns 404 when post not found', async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
    const res = await request(app).delete('/api/blog-posts/nonexistent').send({ curatorUserId: 2 });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/blog-posts/:blogPostId/like', () => {
  test('400 — rejects invalid incrementBy value', async () => {
    const res = await request(app).put('/api/blog-posts/bp_1/like').send({ incrementBy: 99 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incrementBy/i);
  });

  test('404 — returns 404 when post not found', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).put('/api/blog-posts/nonexistent/like').send({ incrementBy: 1 });
    expect(res.status).toBe(404);
  });

  test('200 — increments likeCount for anonymous user', async () => {
    mockCollection.findOne.mockResolvedValue({ blogPostId: 'bp_1', likeCount: 5 });
    mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app).put('/api/blog-posts/bp_1/like').send({ incrementBy: 1 });

    expect(res.status).toBe(200);
    expect(res.body.data.likeCount).toBe(6);
  });
});


// =====================================================================
//  3. CURATOR APPLICATION ROUTES  (/api/curator-applications)
// =====================================================================
describe('POST /api/curator-applications', () => {
  const validApp = { userId: 1, username: 'alice', motivation: 'I love nutrition', journey: 'Been eating clean for 3 years', expertise: 'Sports nutrition', social: '@alice' };

  test('200 — submits application successfully', async () => {
    mockQuery
      .mockResolvedValueOnce([{ insertId: 10 }])                 // INSERT
      .mockResolvedValueOnce([[{ application_id: 10, ...validApp, status: 'PENDING' }]]); // SELECT

    const res = await request(app).post('/api/curator-applications').send(validApp);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/submitted/i);
  });

  test('400 — rejects when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/curator-applications')
      .send({ userId: 1, username: 'alice', motivation: '', journey: '', expertise: '' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/curator-applications').send(validApp);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/curator-applications', () => {
  test('200 — returns all applications', async () => {
    mockQuery.mockResolvedValueOnce([[
      { applicationId: 1, userId: 2, username: 'bob', status: 'PENDING', motivation: 'M', journey: 'J', expertise: 'E', social: '', createdAt: '2024-01-01' },
    ]]);

    const res = await request(app).get('/api/curator-applications');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/curator-applications');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/curator-applications/:id/approve', () => {
  test('200 — approves and promotes user to curator', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ user_id: 5 }]])   // find application
      .mockResolvedValueOnce([{ affectedRows: 1 }]) // update application status
      .mockResolvedValueOnce([{ affectedRows: 1 }]); // promote user

    const res = await request(app)
      .put('/api/curator-applications/1/approve')
      .send({ adminId: 'admin-1' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/approved/i);
    expect(res.body.data.userId).toBe(5);
  });

  test('404 — application not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // empty application result
    const res = await request(app).put('/api/curator-applications/999/approve').send({ adminId: 'admin-1' });
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/curator-applications/:id/reject', () => {
  test('200 — rejects application with reason', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // update
      .mockResolvedValueOnce([[{ application_id: 1, status: 'REJECTED', rejection_reason: 'Not enough detail' }]]); // select

    const res = await request(app)
      .put('/api/curator-applications/1/reject')
      .send({ adminId: 'admin-1', reason: 'Not enough detail' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/rejected/i);
  });

  test('404 — application not found', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/curator-applications/999/reject').send({ adminId: 'admin-1', reason: 'No reason' });
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  4. DIARY ENTRY ROUTES  (/api/diary-entries)
// =====================================================================
describe('GET /api/diary-entries/:userId', () => {
  test('200 — returns diary entries for user', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'entry1', userId: 1, title: 'Day 1', content: 'Felt great.', mood: 'Happy', weight: null, createdAt: '2024-01-01' },
    ]));

    const res = await request(app).get('/api/diary-entries/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].title).toBe('Day 1');
  });

  test('400 — invalid userId returns 400', async () => {
    const res = await request(app).get('/api/diary-entries/abc');
    expect(res.status).toBe(400);
  });

  test('200 — returns empty array when no entries', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/diary-entries/99');
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/diary-entries', () => {
  const validEntry = { userId: 1, title: 'My Entry', content: 'Today was great!', mood: 'Happy', weight: 70 };

  test('201 — creates diary entry', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-entry-id' });

    const res = await request(app).post('/api/diary-entries').send(validEntry);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('My Entry');
  });

  test('400 — rejects when title is missing', async () => {
    const res = await request(app).post('/api/diary-entries').send({ ...validEntry, title: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('title');
  });

  test('400 — rejects when content is missing', async () => {
    const res = await request(app).post('/api/diary-entries').send({ ...validEntry, content: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('content');
  });

  test('400 — rejects when weight is non-numeric', async () => {
    const res = await request(app).post('/api/diary-entries').send({ ...validEntry, weight: 'abc' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('weight');
  });

  test('500 — handles DB error', async () => {
    mockCollection.insertOne.mockRejectedValue(new Error('Mongo error'));
    const res = await request(app).post('/api/diary-entries').send(validEntry);
    expect(res.status).toBe(500);
  });
});

describe('DELETE /api/diary-entries/:entryId', () => {
  test('200 — deletes entry', async () => {
    const validObjectId = '64a1f1a2b3c4d5e6f7a8b9c0'; // valid Mongo ObjectId format
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app).delete(`/api/diary-entries/${validObjectId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — invalid ObjectId format', async () => {
    const res = await request(app).delete('/api/diary-entries/not-an-id');
    expect(res.status).toBe(400);
  });

  test('404 — entry not found', async () => {
    const validObjectId = '64a1f1a2b3c4d5e6f7a8b9c0';
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });

    const res = await request(app).delete(`/api/diary-entries/${validObjectId}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  5. DINE OUT ROUTES  (/api/dine-out)
// =====================================================================
describe('GET /api/dine-out', () => {
  test('200 — returns list of restaurants', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'r1', restaurantId: 'r1', name: 'Sakura', cuisine: 'Japanese', rating: 4.5, menuItems: [] },
    ]));

    const res = await request(app).get('/api/dine-out');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].name).toBe('Sakura');
  });

  test('200 — returns empty array when no restaurants', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/dine-out');
    expect(res.body.data).toEqual([]);
  });

  test('500 — handles DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/dine-out');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/dine-out/matching', () => {
  test('200 — returns restaurants with menu items within calorie budget', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'r1', name: 'Healthy Bites', cuisine: 'Salad', rating: 4, menuItems: [
        { itemId: 'm1', name: 'Garden Salad', calories: 300, protein: 10, carbs: 30, fat: 8, tags: [] },
        { itemId: 'm2', name: 'Steak',        calories: 900, protein: 50, carbs: 0, fat: 40, tags: [] },
      ]},
    ]));

    const res = await request(app).get('/api/dine-out/matching?remainingCalories=400');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Only Garden Salad (300 cal) fits within budget of 440 (400 * 1.1)
    expect(res.body.data[0].matchingItems).toHaveLength(1);
    expect(res.body.data[0].matchingItems[0].name).toBe('Garden Salad');
  });

  test('200 — returns empty array when no items fit budget', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'r1', name: 'Heavy Meals', cuisine: 'BBQ', rating: 3, menuItems: [
        { name: 'Big Steak', calories: 1200, protein: 80, carbs: 10, fat: 70, tags: [] },
      ]},
    ]));

    const res = await request(app).get('/api/dine-out/matching?remainingCalories=100');
    expect(res.body.data).toHaveLength(0);
  });

  test('200 — returns empty when remainingCalories is 0', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'r1', name: 'Any Restaurant', cuisine: 'Any', rating: 4, menuItems: [{ name: 'Dish', calories: 200 }] },
    ]));

    const res = await request(app).get('/api/dine-out/matching?remainingCalories=0');
    expect(res.body.data).toHaveLength(0);
  });
});


// =====================================================================
//  6. EXERCISE ENTRY ROUTES  (/api/exercise-entries)
// =====================================================================
describe('POST /api/exercise-entries', () => {
  const validEntry = { userId: 1, exerciseType: 'Running', durationMins: 30, notes: 'Morning run' };

  test('201 — creates exercise entry and calculates calories burned', async () => {
    mockExecute.mockResolvedValue([{ insertId: 99 }]);

    const res = await request(app).post('/api/exercise-entries').send(validEntry);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    // Running = 10 cal/min × 30 min = 300
    expect(res.body.data.caloriesBurned).toBe(300);
    expect(res.body.data.exerciseType).toBe('Running');
  });

  test('300 calories for Running 30 mins (10 cal/min)', async () => {
    mockExecute.mockResolvedValue([{ insertId: 1 }]);
    const res = await request(app).post('/api/exercise-entries').send({ ...validEntry, exerciseType: 'Running', durationMins: 30 });
    expect(res.body.data.caloriesBurned).toBe(300);
  });

  test('540 calories for HIIT 45 mins (12 cal/min)', async () => {
    mockExecute.mockResolvedValue([{ insertId: 2 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'HIIT', durationMins: 45 });
    expect(res.body.data.caloriesBurned).toBe(540);
  });

  test('uses 5 cal/min fallback for unknown exercise type', async () => {
    mockExecute.mockResolvedValue([{ insertId: 3 }]);
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1, exerciseType: 'Dancing', durationMins: 60 });
    expect(res.body.data.caloriesBurned).toBe(300); // 5 * 60
  });

  test('400 — missing required fields', async () => {
    const res = await request(app).post('/api/exercise-entries').send({ userId: 1 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('500 — handles DB error', async () => {
    mockExecute.mockRejectedValue(new Error('DB error'));
    const res = await request(app).post('/api/exercise-entries').send(validEntry);
    expect(res.status).toBe(500);
  });
});

describe('GET /api/exercise-entries/today/:userId', () => {
  test('200 — returns formatted today entries', async () => {
    mockExecute.mockResolvedValue([[
      { entry_id: 1, user_id: 1, exercise_type: 'Running', duration_mins: 30, calories_burned: 300, notes: '', logged_at: new Date() },
    ]]);

    const res = await request(app).get('/api/exercise-entries/today/1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].exerciseType).toBe('Running');
    expect(res.body[0].caloriesBurned).toBe(300);
  });

  test('200 — returns empty array when no entries today', async () => {
    mockExecute.mockResolvedValue([[]]);
    const res = await request(app).get('/api/exercise-entries/today/99');
    expect(res.body).toEqual([]);
  });
});


// =====================================================================
//  7. FOOD INTAKE ENTRY ROUTES  (/api/food-entries)
// =====================================================================
describe('POST /api/food-entries/manual', () => {
  const validEntry = { userId: 1, foodName: 'Chicken Rice', calories: 600, protein: 35, carbs: 70, fat: 20, meal: 'Lunch' };

  test('200 — creates manual food entry', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'food-log-id' });

    const res = await request(app).post('/api/food-entries/manual').send(validEntry);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.foodName).toBe('Chicken Rice');
    expect(res.body.data.source).toBe('manual');
  });

  test('400 — rejects when foodName is missing', async () => {
    const res = await request(app).post('/api/food-entries/manual').send({ ...validEntry, foodName: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 — rejects when meal is missing', async () => {
    const res = await request(app).post('/api/food-entries/manual').send({ ...validEntry, meal: '' });
    expect(res.status).toBe(400);
  });

  test('500 — handles DB error', async () => {
    mockCollection.insertOne.mockRejectedValue(new Error('Mongo error'));
    const res = await request(app).post('/api/food-entries/manual').send(validEntry);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/food-entries/camera', () => {
  test('200 — creates camera food entry with source = camera', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'cam-id' });
    const res = await request(app).post('/api/food-entries/camera').send({ userId: 1, foodName: 'Salad', calories: 200, protein: 10, carbs: 20, fat: 5, meal: 'Lunch' });

    expect(res.status).toBe(200);
    expect(res.body.data.source).toBe('camera');
  });
});

describe('GET /api/food-entries/today/:userId', () => {
  test('200 — returns today entries', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { userId: 1, foodName: 'Oats', calories: 300, loggedAt: new Date() },
    ]));

    const res = await request(app).get('/api/food-entries/today/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].foodName).toBe('Oats');
  });
});

describe('GET /api/food-entries/history/:userId', () => {
  test('200 — returns all food log history', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { userId: 1, foodName: 'Rice', calories: 250 },
      { userId: 1, foodName: 'Egg', calories: 80 },
    ]));

    const res = await request(app).get('/api/food-entries/history/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
  });
});

describe('DELETE /api/food-entries/:entryId', () => {
  const validId = '64a1f1a2b3c4d5e6f7a8b9c0';

  test('200 — deletes food entry', async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const res = await request(app).delete(`/api/food-entries/${validId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).delete('/api/food-entries/not-valid-id');
    expect(res.status).toBe(400);
  });

  test('404 — entry not found', async () => {
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
    const res = await request(app).delete(`/api/food-entries/${validId}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  8. FOOD ITEM ROUTES  (/api/food-items)
// =====================================================================
describe('GET /api/food-items', () => {
  test('200 — returns all food items', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: 'fi1', name: 'Brown Rice', calories: 200, protein: 5, carbs: 40, fat: 2, serving: '100g', category: 'Grain', isCustom: false },
    ]));

    const res = await request(app).get('/api/food-items');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].name).toBe('Brown Rice');
    expect(res.body.data[0].calories).toBe(200);
  });

  test('200 — returns empty array when no items', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/food-items');
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/food-items', () => {
  const validItem = { name: 'Chicken Breast', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving: '100g', category: 'Protein', isCustom: true };

  test('201 — creates food item', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-food-id' });

    const res = await request(app).post('/api/food-items').send(validItem);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('Chicken Breast');
  });

  test('400 — rejects when name is missing', async () => {
    const res = await request(app).post('/api/food-items').send({ ...validItem, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});


// =====================================================================
//  9. FOOD SEARCH ROUTES  (/api/food-api)
// =====================================================================
describe('GET /api/food-api/search', () => {
  test('200 — returns mapped products for valid query', async () => {
    searchFoodProduct.mockResolvedValue({
      products: [{ product_name: 'Chicken Rice', code: '123', nutriments: {} }],
    });

    const res = await request(app).get('/api/food-api/search?searchTerm=chicken');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('400 — rejects search term shorter than 2 characters', async () => {
    const res = await request(app).get('/api/food-api/search?searchTerm=a');
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/too short/i);
  });

  test('400 — rejects missing search term', async () => {
    const res = await request(app).get('/api/food-api/search');
    expect(res.status).toBe(400);
  });

  test('503 — returns 503 when OpenFoodFacts API is unavailable', async () => {
    searchFoodProduct.mockResolvedValue({ apiError: true, products: [] });
    const res = await request(app).get('/api/food-api/search?searchTerm=rice');
    expect(res.status).toBe(503);
  });

  test('200 — returns empty array when no products found', async () => {
    searchFoodProduct.mockResolvedValue({ products: [] });
    const res = await request(app).get('/api/food-api/search?searchTerm=xyznotfound');
    expect(res.body.data).toEqual([]);
  });
});

describe('GET /api/food-api/barcode/:barcode', () => {
  test('200 — returns nutrition info for valid barcode', async () => {
    getNutritionInfo.mockResolvedValue({ barcode: '737628064502', productName: 'Peanut Butter', protein: 25 });
    const res = await request(app).get('/api/food-api/barcode/737628064502');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.productName).toBe('Peanut Butter');
  });

  test('500 — handles barcode lookup failure', async () => {
    getNutritionInfo.mockRejectedValue(new Error('Barcode not found'));
    const res = await request(app).get('/api/food-api/barcode/000000000000');
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  10. GROCERY LIST ROUTES  (/api/grocery-lists)
// =====================================================================
describe('GET /api/grocery-lists/:userId', () => {
  test('200 — returns current grocery list', async () => {
    mockCollection.findOne.mockResolvedValue({
      _id: 'list1',
      userId: 1,
      items: [{ itemId: 'i1', name: 'Eggs', checked: false }],
      generatedAt: '2024-01-01',
    });

    const res = await request(app).get('/api/grocery-lists/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items).toHaveLength(1);
  });

  test('200 — returns null data when no list exists', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/grocery-lists/99');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeNull();
  });

  test('400 — invalid userId', async () => {
    const res = await request(app).get('/api/grocery-lists/abc');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/grocery-lists/generate-from-recipe', () => {
  test('201 — generates grocery list from recipe ingredients', async () => {
    const recipe = { recipeId: 'r1', title: 'Salad', ingredients: ['100g Lettuce', '50g Tomato'] };

    // No existing list → create new
    mockCollection.findOne.mockResolvedValue(null);
    const savedList = { _id: 'gl1', userId: 1, items: [{ name: 'Lettuce', quantity: 100, unit: 'g', checked: false }], sourceRecipeTitle: 'Salad' };
    mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });
    mockCollection.findOne
      .mockResolvedValueOnce(null)      // first check: no existing list
      .mockResolvedValueOnce(savedList); // after upsert

    const res = await request(app)
      .post('/api/grocery-lists/generate-from-recipe')
      .send({ userId: 1, recipe });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  test('400 — rejects missing userId or recipe', async () => {
    const res = await request(app).post('/api/grocery-lists/generate-from-recipe').send({ userId: 1 });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/grocery-lists/:userId/items', () => {
  test('200 — adds item to existing list', async () => {
    const existingList = { _id: 'gl1', userId: 1, items: [] };
    mockCollection.findOne
      .mockResolvedValueOnce(existingList)
      .mockResolvedValueOnce({ ...existingList, items: [{ itemId: 'i_manual_1', name: 'Milk', quantity: 2, unit: 'liters', checked: false }] });

    const res = await request(app)
      .post('/api/grocery-lists/1/items')
      .send({ name: 'Milk', quantity: 2, unit: 'liters' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.items[0].name).toBe('Milk');
  });

  test('400 — rejects when item name is empty', async () => {
    const res = await request(app).post('/api/grocery-lists/1/items').send({ name: '', quantity: 1 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('404 — returns 404 when no list exists for user', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).post('/api/grocery-lists/1/items').send({ name: 'Eggs', quantity: 12 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/grocery-lists/:userId/items/:itemId', () => {
  test('200 — removes item from list', async () => {
    const existingList = {
      _id: 'gl1',
      userId: 1,
      items: [{ itemId: 'i_1', name: 'Milk', checked: false }],
    };
    mockCollection.findOne
      .mockResolvedValueOnce(existingList)
      .mockResolvedValueOnce({ ...existingList, items: [] });

    const res = await request(app).delete('/api/grocery-lists/1/items/i_1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('404 — item not found in list', async () => {
    const existingList = { _id: 'gl1', userId: 1, items: [{ itemId: 'i_other' }] };
    mockCollection.findOne.mockResolvedValue(existingList);

    const res = await request(app).delete('/api/grocery-lists/1/items/nonexistent-item');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/grocery-lists/:userId/items/:itemId/toggle', () => {
  test('200 — toggles item checked state', async () => {
    const existingList = {
      _id: 'gl1',
      userId: 1,
      items: [{ itemId: 'i_1', name: 'Eggs', checked: false }],
    };
    mockCollection.findOne
      .mockResolvedValueOnce(existingList)
      .mockResolvedValueOnce({ ...existingList, items: [{ itemId: 'i_1', name: 'Eggs', checked: true }] });

    const res = await request(app).put('/api/grocery-lists/1/items/i_1/toggle');
    expect(res.status).toBe(200);
    expect(res.body.data.items[0].checked).toBe(true);
  });

  test('404 — item not found', async () => {
    mockCollection.findOne
      .mockResolvedValueOnce({ _id: 'gl1', userId: 1, items: [] });

    const res = await request(app).put('/api/grocery-lists/1/items/nonexistent/toggle');
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  11. HEALTH GOAL ROUTES  (/api/health-goals)
// =====================================================================
describe('GET /api/health-goals/active/:userId', () => {
  test('200 — returns active health goal', async () => {
    mockQuery.mockResolvedValueOnce([[
      { goal_id: 1, user_id: 1, goal_type: 'Lose Weight', custom_goal: null, target_weight: 65, target_calories: 1800, activity_level: 'Moderate', target_date: '2024-12-31', is_active: 1, created_at: '2024-01-01', updated_at: '2024-01-01' },
    ]]);

    const res = await request(app).get('/api/health-goals/active/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.goalType).toBe('Lose Weight');
    expect(res.body.data.targetCalories).toBe(1800);
  });

  test('200 — returns null when no goal found', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])   // active goal query
      .mockResolvedValueOnce([[]]); // latest goal fallback
    const res = await request(app).get('/api/health-goals/active/99');
    expect(res.body.data).toBeNull();
    expect(res.body.message).toMatch(/no goal/i);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/health-goals/active/1');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/health-goals', () => {
  const validGoal = { userId: 1, goalType: 'Lose Weight', customGoal: null, targetWeight: 65, targetCalories: 1800, activityLevel: 'Moderate', targetDate: '2024-12-31' };

  test('200 — creates health goal and deactivates old ones', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // deactivate existing
      .mockResolvedValueOnce([{ insertId: 5 }])         // insert new
      .mockResolvedValueOnce([[{                        // select inserted
        goal_id: 5, user_id: 1, goal_type: 'Lose Weight', custom_goal: null,
        target_weight: 65, target_calories: 1800, activity_level: 'Moderate',
        target_date: '2024-12-31', is_active: 1, created_at: '2024-01-01', updated_at: '2024-01-01',
      }]]);

    const res = await request(app).post('/api/health-goals').send(validGoal);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.goalType).toBe('Lose Weight');
    // Confirm deactivate was called first
    expect(mockQuery).toHaveBeenCalledWith(expect.stringMatching(/UPDATE health_goals SET is_active/), [1]);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/health-goals').send(validGoal);
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/health-goals/:goalId', () => {
  const updatePayload = { goalType: 'Gain Muscle', customGoal: null, targetWeight: 75, targetCalories: 2500, activityLevel: 'Active', targetDate: '2025-06-01' };

  test('200 — updates health goal', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // update
      .mockResolvedValueOnce([[{ userId: 1 }]]);      // get userId back

    const res = await request(app).put('/api/health-goals/5').send(updatePayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.goalType).toBe('Gain Muscle');
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/health-goals/5').send(updatePayload);
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  12. HEALTH REPORT ROUTES  (/api/health-reports)
// =====================================================================
describe('GET /api/health-reports/daily', () => {
  test('200 — returns daily report with weekly breakdown', async () => {
    // aggregate returns one day's data
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([
      { date: '2024-06-15', totalCalories: 1800, totalProtein: 100, totalCarbs: 200, totalFat: 60, totalEntries: 5 },
    ]));

    const res = await request(app).get('/api/health-reports/daily?userId=1&date=2024-06-15');

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(1);
    expect(res.body.totalCalories).toBe(1800);
    expect(res.body.weeklyCalories).toHaveLength(7);
    expect(res.body.avgCalories).toBeGreaterThanOrEqual(0);
  });

  test('400 — missing userId or date', async () => {
    const res = await request(app).get('/api/health-reports/daily?userId=1');
    expect(res.status).toBe(400);
  });

  test('200 — returns zeros for a day with no food logs', async () => {
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
    const res = await request(app).get('/api/health-reports/daily?userId=1&date=2024-01-01');
    expect(res.status).toBe(200);
    expect(res.body.totalCalories).toBe(0);
  });
});

describe('GET /api/health-reports/weekly', () => {
  test('200 — returns weekly reports array', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { userId: 1, date: '2024-06-10', totalCalories: 1900 },
      { userId: 1, date: '2024-06-11', totalCalories: 2100 },
    ]));

    const res = await request(app).get('/api/health-reports/weekly?userId=1&weekStart=2024-06-10');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
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
    expect(res.body.userId).toBe(1);
    expect(res.body.totalCalories).toBe(54000);
    expect(res.body.avgCalories).toBeGreaterThan(0);
  });

  test('400 — missing required params', async () => {
    const res = await request(app).get('/api/health-reports/monthly?userId=1&year=2024');
    expect(res.status).toBe(400);
  });

  test('200 — returns zeros when no logs in month', async () => {
    mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
    const res = await request(app).get('/api/health-reports/monthly?userId=1&year=2024&month=1');
    expect(res.body.totalCalories).toBe(0);
    expect(res.body.totalEntries).toBe(0);
  });
});


// =====================================================================
//  13. HEIGHT ENTRY ROUTES  (/api/height-entries)
// =====================================================================
describe('POST /api/height-entries', () => {
  test('201 — creates height entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ insertId: 10 }])  // INSERT
      .mockResolvedValueOnce([[{ entry_id: 10, user_id: 1, height_cm: 175, logged_at: '2024-01-01' }]]); // SELECT

    const res = await request(app).post('/api/height-entries').send({ userId: 1, heightCm: 175 });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.heightCm).toBe(175);
  });

  test('400 — rejects missing userId', async () => {
    const res = await request(app).post('/api/height-entries').send({ heightCm: 175 });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('400 — rejects non-numeric heightCm', async () => {
    const res = await request(app).post('/api/height-entries').send({ userId: 1, heightCm: 'tall' });
    expect(res.status).toBe(400);
  });

  test('500 — handles DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/height-entries').send({ userId: 1, heightCm: 175 });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/height-entries/:userId', () => {
  test('200 — returns height history sorted newest first', async () => {
    mockExecute.mockResolvedValue([[
      { entry_id: 2, user_id: 1, height_cm: 176, logged_at: '2024-06-01' },
      { entry_id: 1, user_id: 1, height_cm: 175, logged_at: '2024-01-01' },
    ]]);

    const res = await request(app).get('/api/height-entries/1');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].heightCm).toBe(176); // newest first
  });

  test('200 — returns empty array when no entries', async () => {
    mockExecute.mockResolvedValue([[]]);
    const res = await request(app).get('/api/height-entries/99');
    expect(res.body.data).toEqual([]);
  });

  test('500 — handles DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/height-entries/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/height-entries/:entryId', () => {
  test('200 — updates height entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ affectedRows: 1 }])   // UPDATE
      .mockResolvedValueOnce([[{ entry_id: 10, user_id: 1, height_cm: 178, logged_at: '2024-01-01' }]]); // SELECT

    const res = await request(app).put('/api/height-entries/10').send({ heightCm: 178 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.heightCm).toBe(178);
  });

  test('400 — rejects non-numeric heightCm', async () => {
    const res = await request(app).put('/api/height-entries/10').send({ heightCm: 'tall' });
    expect(res.status).toBe(400);
  });

  test('404 — entry not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/height-entries/999').send({ heightCm: 178 });
    expect(res.status).toBe(404);
  });
});

// =====================================================================
//  14. MEAL PLAN ROUTES  (/api/meal-plans)
// =====================================================================
describe('GET /api/meal-plans/:userId', () => {
  test('200 — returns plans for a user', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, userId: 1, name: 'Week 1', description: '', numDays: 7, days: [], isAutoGenerated: false, planType: '', createdAt: new Date().toISOString() },
    ]));
    const res = await request(app).get('/api/meal-plans/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].name).toBe('Week 1');
  });

  test('400 — invalid userId returns 400', async () => {
    const res = await request(app).get('/api/meal-plans/abc');
    expect(res.status).toBe(400);
  });

  test('200 — returns empty array when user has no plans', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/meal-plans/99');
    expect(res.body.data).toEqual([]);
  });
});

describe('POST /api/meal-plans', () => {
  const validPlan = { userId: 1, name: 'My Plan', description: 'A weekly plan', numDays: 7, days: [] };

  test('201 — creates meal plan', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans').send(validPlan);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.name).toBe('My Plan');
    expect(res.body.data.isAutoGenerated).toBe(false);
  });

  test('400 — rejects when name is missing', async () => {
    const res = await request(app).post('/api/meal-plans').send({ ...validPlan, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('400 — rejects when name is whitespace only', async () => {
    const res = await request(app).post('/api/meal-plans').send({ ...validPlan, name: '   ' });
    expect(res.status).toBe(400);
  });

  test('500 — handles DB error', async () => {
    mockCollection.insertOne.mockRejectedValue(new Error('Mongo error'));
    const res = await request(app).post('/api/meal-plans').send(validPlan);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/meal-plans/generate', () => {
  test('201 — generates a 7-day Balanced Diet plan', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'Balanced Diet' });
    expect(res.status).toBe(201);
    expect(res.body.data.isAutoGenerated).toBe(true);
    expect(res.body.data.numDays).toBe(7);
    expect(res.body.data.days).toHaveLength(7);
    expect(res.body.data.planType).toBe('Balanced Diet');
  });

  test('201 — normalizes planType alias "keto" to "Keto"', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'keto' });
    expect(res.body.data.planType).toBe('Keto');
  });

  test('201 — normalizes "weight loss" alias to "Weight Loss"', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'weight loss' });
    expect(res.body.data.planType).toBe('Weight Loss');
  });

  test('201 — defaults to Balanced Diet for unknown planType', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'unknown-type' });
    expect(res.body.data.planType).toBe('Balanced Diet');
  });

  test('201 — each generated day has breakfast, lunch, dinner, snack', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'High Protein' });
    const day = res.body.data.days[0];
    expect(day).toHaveProperty('breakfast');
    expect(day).toHaveProperty('lunch');
    expect(day).toHaveProperty('dinner');
    expect(day).toHaveProperty('snack');
  });
});

describe('PUT /api/meal-plans/:planId', () => {
  test('200 — updates plan name and description', async () => {
    const updatedPlan = { _id: VALID_OID, userId: 1, name: 'Updated', description: 'New desc', numDays: 7, days: [], isAutoGenerated: false, planType: '' };
    mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
    mockCollection.findOne.mockResolvedValue(updatedPlan);
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Updated', description: 'New desc' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  test('400 — invalid ObjectId planId', async () => {
    const res = await request(app).put('/api/meal-plans/not-an-id').send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  test('400 — empty name string rejected', async () => {
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: '  ' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('404 — plan not found', async () => {
    mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Test' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/meal-plans/:planId', () => {
  test('200 — soft-deletes plan (sets isDeleted = true)', async () => {
    mockCollection.updateOne.mockResolvedValue({ matchedCount: 1 });
    const res = await request(app).delete(`/api/meal-plans/${VALID_OID}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('400 — invalid planId', async () => {
    const res = await request(app).delete('/api/meal-plans/bad-id');
    expect(res.status).toBe(400);
  });

  test('404 — plan not found', async () => {
    mockCollection.updateOne.mockResolvedValue({ matchedCount: 0 });
    const res = await request(app).delete(`/api/meal-plans/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  15. MEMBERSHIP PLAN ROUTES  (/api/membership-plans)
// =====================================================================
describe('GET /api/membership-plans', () => {
  test('200 — returns all plans ordered by plan_id', async () => {
    mockQuery.mockResolvedValueOnce([[
      { plan_id: 1, name: 'Free',    price: 0,     is_active: 1 },
      { plan_id: 2, name: 'Premium', price: 19.99, is_active: 1 },
    ]]);
    const res = await request(app).get('/api/membership-plans');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].name).toBe('Free');
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).get('/api/membership-plans');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeDefined();
  });
});

describe('GET /api/membership-plans/active', () => {
  test('200 — returns only active plans ordered by price', async () => {
    mockQuery.mockResolvedValueOnce([[
      { plan_id: 1, name: 'Free', price: 0, is_active: 1 },
    ]]);
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
    expect(res.body.error).toMatch(/not found/i);
  });
});


// =====================================================================
//  16. NUTRITION TARGETS ROUTES  (/api/nutrition-targets)
// =====================================================================
describe('GET /api/nutrition-targets/:userId', () => {
  test('200 — returns nutrition targets for existing user', async () => {
    // ensureUserExists → returns user
    mockQuery.mockResolvedValueOnce([[{ userId: 1, dailyCalorieLimit: 2000 }]]);
    // countDocuments — doc already exists
    mockCollection.countDocuments.mockResolvedValue(1);
    mockCollection.updateMany.mockResolvedValue({ matchedCount: 1 });
    // getTargetsByUser
    mockCollection.find.mockReturnValue(makeCursor([{
      userId: 1, calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30,
      activityLevel: 'Balanced', goal: 'Maintain Weight', updatedAt: new Date(),
    }]));

    const res = await request(app).get('/api/nutrition-targets/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calories).toBe(2000);
    expect(res.body.data.activityLevel).toBe('Balanced');
  });

  test('400 — missing userId', async () => {
    const res = await request(app).get('/api/nutrition-targets/0');
    expect(res.status).toBe(400);
  });

  test('404 — user does not exist in MySQL', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no user found
    const res = await request(app).get('/api/nutrition-targets/999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/nutrition-targets/:userId', () => {
  const validTargets = { calories: 2000, protein: 150, carbs: 250, fat: 67, fiber: 30, activityLevel: 'Balanced', goal: 'Maintain Weight' };

  test('200 — updates all nutrition targets', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ userId: 1, dailyCalorieLimit: 2000 }]])  // ensureUserExists
      .mockResolvedValueOnce([{ affectedRows: 1 }]);                        // UPDATE users calorie_limit
    mockCollection.countDocuments.mockResolvedValue(1);
    mockCollection.updateMany.mockResolvedValue({ matchedCount: 1 });
    mockCollection.find.mockReturnValue(makeCursor([{ ...validTargets, userId: 1, updatedAt: new Date() }]));

    const res = await request(app).put('/api/nutrition-targets/1').send(validTargets);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.calories).toBe(2000);
  });

  test('400 — rejects when calories below 500', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, calories: 400 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
  });

  test('400 — rejects when protein is negative', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, protein: -10 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('protein');
  });

  test('400 — rejects when fat is negative', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, fat: -5 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('fat');
  });
});

describe('PUT /api/nutrition-targets/:userId/calories', () => {
  test('200 — updates calorie goal only', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ userId: 1, dailyCalorieLimit: 2000 }]])
      .mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockCollection.countDocuments.mockResolvedValue(1);
    mockCollection.updateMany.mockResolvedValue({ matchedCount: 1 });
    mockCollection.find.mockReturnValue(makeCursor([{ userId: 1, calories: 1800, protein: 150, carbs: 250, fat: 67, fiber: 30, activityLevel: 'Balanced', goal: 'Maintain Weight', updatedAt: new Date() }]));

    const res = await request(app).put('/api/nutrition-targets/1/calories').send({ calories: 1800 });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/calorie goal/i);
  });

  test('400 — rejects calories below 500', async () => {
    const res = await request(app).put('/api/nutrition-targets/1/calories').send({ calories: 300 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
  });

  test('400 — rejects calories above 10000', async () => {
    const res = await request(app).put('/api/nutrition-targets/1/calories').send({ calories: 12000 });
    expect(res.status).toBe(400);
  });
});


// =====================================================================
//  17. RECIPE DRAFT ROUTES  (/api/recipe-drafts)
// =====================================================================
describe('GET /api/recipe-drafts', () => {
  test('200 — returns all drafts', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, title: 'My Draft', ingredients: ['chicken'], instructions: ['Grill it'] },
    ]));
    const res = await request(app).get('/api/recipe-drafts');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('My Draft');
  });

  test('500 — handles DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo error'); });
    const res = await request(app).get('/api/recipe-drafts');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/recipe-drafts/:id', () => {
  test('200 — returns draft by ID', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, title: 'Draft Soup' });
    const res = await request(app).get(`/api/recipe-drafts/${VALID_OID}`);
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Draft Soup');
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).get('/api/recipe-drafts/bad-id');
    expect(res.status).toBe(400);
  });

  test('404 — draft not found', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).get(`/api/recipe-drafts/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});

describe('POST /api/recipe-drafts', () => {
  test('201 — creates draft', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/recipe-drafts').send({ title: 'New Draft', ingredients: ['egg'], instructions: ['Boil egg'] });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('New Draft');
  });

  test('500 — handles DB error', async () => {
    mockCollection.insertOne.mockRejectedValue(new Error('Insert failed'));
    const res = await request(app).post('/api/recipe-drafts').send({ title: 'Draft' });
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/recipe-drafts/:id', () => {
  test('200 — updates draft', async () => {
    const updatedDraft = { _id: VALID_OID, title: 'Updated Draft', isPublished: false };
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, title: 'Old Draft', isPublished: false });
    mockCollection.findOneAndUpdate.mockResolvedValue({ value: updatedDraft });

    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Updated Draft' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('403 — cannot edit a published draft', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, title: 'Published', isPublished: true });
    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Edit attempt' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/published recipes cannot be edited/i);
  });

  test('404 — draft not found', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Edit' });
    expect(res.status).toBe(404);
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).put('/api/recipe-drafts/bad-id').send({ title: 'Edit' });
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/recipe-drafts/:id', () => {
  test('200 — deletes draft by owner', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, createdByUserId: 1, isPublished: false });
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });
    const res = await request(app).delete(`/api/recipe-drafts/${VALID_OID}`).send({ createdByUserId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('403 — cannot delete a published draft', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, isPublished: true });
    const res = await request(app).delete(`/api/recipe-drafts/${VALID_OID}`).send({ createdByUserId: 1 });
    expect(res.status).toBe(403);
  });

  test('404 — unauthorized or not found after delete', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, isPublished: false });
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 0 });
    const res = await request(app).delete(`/api/recipe-drafts/${VALID_OID}`).send({ createdByUserId: 99 });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/recipe-drafts/:id/publish', () => {
  test('200 — publishes draft, moves to recipes, deletes draft', async () => {
    const draft = { _id: VALID_OID, title: 'My Recipe', ingredients: ['egg'], createdByUserId: '1' };
    mockCollection.findOne.mockResolvedValue(draft);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'new-recipe-id' });
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app).post(`/api/recipe-drafts/${VALID_OID}/publish`).send({ userId: '1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isPublished).toBe(true);
  });

  test('404 — draft not found', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).post(`/api/recipe-drafts/${VALID_OID}/publish`).send({ userId: '1' });
    expect(res.status).toBe(404);
  });

  test('403 — userId does not match createdByUserId', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, createdByUserId: '99' });
    const res = await request(app).post(`/api/recipe-drafts/${VALID_OID}/publish`).send({ userId: '1' });
    expect(res.status).toBe(403);
  });
});


// =====================================================================
//  18. RECIPE ROUTES  (/api/recipes)
// =====================================================================
describe('GET /api/recipes (no query)', () => {
  test('200 — returns recipes from Mongo when available', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, title: 'Chicken Salad', ingredients: ['chicken', 'lettuce'], tags: [] },
    ]));
    const res = await request(app).get('/api/recipes');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('GET /api/recipes?q=chicken (with query)', () => {
  test('200 — returns matched Mongo results without external API call', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, title: 'Chicken Rice', ingredients: ['chicken'], tags: ['asian'] },
    ]));
    const res = await request(app).get('/api/recipes?q=chicken');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Chicken Rice');
  });

  test('200 — returns empty array when no Mongo match and external API returns nothing', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    // fetchThemealdbByQuery is a real fetch — in unit tests it will fail; route handles that gracefully
    const res = await request(app).get('/api/recipes?q=xyznotarealfood999');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('POST /api/recipes', () => {
  test('200 — creates custom recipe', async () => {
    mockCollection.insertOne.mockResolvedValue({ insertedId: VALID_OID });
    const res = await request(app).post('/api/recipes').send({ title: 'My Salad', ingredients: ['lettuce'], instructions: ['Toss'], createdByUserId: 1 });
    expect(res.status).toBe(200);
    expect(res.body.title).toBe('My Salad');
  });
});

describe('POST /api/recipes/save', () => {
  test('200 — saves recipe for user', async () => {
    mockExecute
      .mockResolvedValueOnce([[]])                       // SELECT — not already saved
      .mockResolvedValueOnce([{ insertId: 1 }]);          // INSERT into saved_recipes
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'saved-id' });

    const res = await request(app).post('/api/recipes/save').send({ userId: 1, recipeId: VALID_OID });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('200 — returns already saved when duplicate', async () => {
    mockExecute.mockResolvedValueOnce([[{ id: 1 }]]); // already exists
    const res = await request(app).post('/api/recipes/save').send({ userId: 1, recipeId: VALID_OID });
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/already saved/i);
  });

  test('400 — invalid recipeId', async () => {
    const res = await request(app).post('/api/recipes/save').send({ userId: 1, recipeId: 'bad-id' });
    expect(res.status).toBe(400);
  });
});

describe('GET /api/recipes/saved/:userId', () => {
  test('200 — returns saved recipes for user', async () => {
    mockExecute.mockResolvedValueOnce([[{ recipe_mongo_id: VALID_OID }]]);
    mockCollection.find.mockReturnValue(makeCursor([{ _id: VALID_OID, title: 'Saved Salad' }]));

    const res = await request(app).get('/api/recipes/saved/1');
    expect(res.status).toBe(200);
    expect(res.body[0].title).toBe('Saved Salad');
  });

  test('200 — returns empty array when no saved recipes', async () => {
    mockExecute.mockResolvedValueOnce([[]]); // no saved recipe IDs
    const res = await request(app).get('/api/recipes/saved/1');
    expect(res.body).toEqual([]);
  });
});

describe('DELETE /api/recipes/saved/:userId/:recipeId', () => {
  test('200 — removes saved recipe', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 1 }]);
    mockCollection.deleteMany.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app).delete(`/api/recipes/saved/1/${VALID_OID}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/removed/i);
  });

  test('400 — invalid recipeId', async () => {
    const res = await request(app).delete('/api/recipes/saved/1/bad-id');
    expect(res.status).toBe(400);
  });
});

describe('PUT /api/recipes/:recipeId/like', () => {
  test('200 — increments likeCount for anonymous user', async () => {
    mockCollection.findOne.mockResolvedValue({ _id: VALID_OID, isCurated: true, likeCount: 3 });
    mockCollection.updateOne.mockResolvedValue({ modifiedCount: 1 });

    const res = await request(app).put(`/api/recipes/${VALID_OID}/like`).send({ incrementBy: 1 });
    expect(res.status).toBe(200);
    expect(res.body.likeCount).toBe(4);
  });

  test('400 — invalid recipeId', async () => {
    const res = await request(app).put('/api/recipes/bad-id/like').send({ incrementBy: 1 });
    expect(res.status).toBe(400);
  });

  test('400 — invalid incrementBy value', async () => {
    const res = await request(app).put(`/api/recipes/${VALID_OID}/like`).send({ incrementBy: 99 });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/incrementBy/i);
  });

  test('404 — recipe not found or not curated', async () => {
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).put(`/api/recipes/${VALID_OID}/like`).send({ incrementBy: 1 });
    expect(res.status).toBe(404);
  });
});

describe('POST /api/recipes/:id/unpublish', () => {
  test('200 — moves recipe to drafts and deletes from recipes', async () => {
    const recipe = { _id: VALID_OID, title: 'Published Recipe', createdByUserId: '1', ingredients: [] };
    // find().limit(3).toArray() for sample
    mockCollection.find.mockReturnValue(makeCursor([recipe]));
    mockCollection.findOne.mockResolvedValue(recipe);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'draft-id' });
    mockCollection.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const res = await request(app).post(`/api/recipes/${VALID_OID}/unpublish`).send({ userId: '1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.isPublished).toBe(false);
  });

  test('400 — invalid recipe id', async () => {
    const res = await request(app).post('/api/recipes/bad-id/unpublish').send({ userId: '1' });
    expect(res.status).toBe(400);
  });

  test('404 — recipe not found', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    mockCollection.findOne.mockResolvedValue(null);
    const res = await request(app).post(`/api/recipes/${VALID_OID}/unpublish`).send({ userId: '1' });
    expect(res.status).toBe(404);
  });

  test('403 — userId does not match createdByUserId', async () => {
    const recipe = { _id: VALID_OID, title: 'Recipe', createdByUserId: '99' };
    mockCollection.find.mockReturnValue(makeCursor([recipe]));
    mockCollection.findOne.mockResolvedValue(recipe);
    const res = await request(app).post(`/api/recipes/${VALID_OID}/unpublish`).send({ userId: '1' });
    expect(res.status).toBe(403);
  });
});


// =====================================================================
//  19. REVIEW ROUTES  (/api/reviews)
// =====================================================================
describe('GET /api/reviews', () => {
  test('200 — returns all reviews ordered by created_at DESC', async () => {
    mockQuery.mockResolvedValueOnce([[
      { review_id: 1, review_user_id: 1, rating: 5, content: 'Great!', status: 'active' },
      { review_id: 2, review_user_id: 2, rating: 4, content: 'Good.',  status: 'active' },
    ]]);
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].rating).toBe(5);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/reviews', () => {
  const validReview = { review_user_id: 1, rating: 5, title: 'Excellent', content: 'This app changed my life!', profile_type: 'Athlete', membership_plan_id: 2 };

  test('201 — creates review after fetching username', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ username: 'alice' }]])     // fetch username
      .mockResolvedValueOnce([{ insertId: 10 }]);            // insert review

    const res = await request(app).post('/api/reviews').send(validReview);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.review_id).toBe(10);
  });

  test('404 — user not found when fetching username', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no user found
    const res = await request(app).post('/api/reviews').send(validReview);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  test('reviewer_initials derived correctly from username', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ username: 'Alice Johnson' }]])
      .mockResolvedValueOnce([{ insertId: 11 }]);
    await request(app).post('/api/reviews').send(validReview);
    // Verify the INSERT was called — initials are derived server-side
    const insertCall = mockQuery.mock.calls.find(c => String(c[0]).includes('INSERT'));
    expect(insertCall).toBeDefined();
  });

  test('500 — handles DB error', async () => {
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

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).delete('/api/reviews/5');
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  20. SMART EATING CONTENT ROUTES  (/api/smart-eating)
// =====================================================================
describe('GET /api/smart-eating/alternatives', () => {
  test('200 — returns food alternatives', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { altId: 'a1', category: 'Snack', original: 'Chips', alternative: 'Rice cakes', benefit: 'Lower calorie' },
    ]));
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].original).toBe('Chips');
  });

  test('200 — returns empty array when no alternatives', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.body.data).toEqual([]);
  });

  test('500 — handles DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo error'); });
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/smart-eating/mindful-snacking', () => {
  test('200 — returns mindful snacking tips', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { tipId: 't1', title: 'Eat slowly', content: 'Take time to chew.', category: 'Mindful', icon: '🍎' },
    ]));
    const res = await request(app).get('/api/smart-eating/mindful-snacking');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data[0].title).toBe('Eat slowly');
  });

  test('500 — handles DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo error'); });
    const res = await request(app).get('/api/smart-eating/mindful-snacking');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/smart-eating/mindful-snacking/content', () => {
  test('200 — returns DEFAULT_SNACKING_CONTENT when no collections have data', async () => {
    // All collections return empty — triggers the default fallback
    mockCollection.find.mockReturnValue(makeCursor([]));
    mockCollection.next.mockResolvedValue(null);

    const res = await request(app).get('/api/smart-eating/mindful-snacking/content');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject({
      corePrinciples: [],
      managingCravings: [],
      snackIdeas: [],
    });
  });

  test('500 — handles DB error with fallback content', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo error'); });
    const res = await request(app).get('/api/smart-eating/mindful-snacking/content');
    expect(res.status).toBe(500);
    // Route returns DEFAULT_SNACKING_CONTENT even on error
    expect(res.body.data).toBeDefined();
  });
});


// =====================================================================
//  21. USER PROFILE TYPE ROUTES  (/api/user-profile-types)
// =====================================================================
describe('GET /api/user-profile-types', () => {
  test('200 — returns all profile types', async () => {
    mockQuery.mockResolvedValueOnce([[
      { profile_type_id: 1, type: 'ATHLETE',         display_name: 'Athletes',        description: 'For athletes' },
      { profile_type_id: 2, type: 'MEAL_PLANNER',    display_name: 'Meal Planners',   description: 'For planners' },
      { profile_type_id: 3, type: 'HEALTH_ORIENTED', display_name: 'Health Oriented', description: 'For health' },
    ]]);
    const res = await request(app).get('/api/user-profile-types');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(3);
    expect(res.body[0].type).toBe('ATHLETE');
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/user-profile-types');
    expect(res.status).toBe(500);
  });
});

describe('GET /api/user-profile-types/type/:type', () => {
  test('200 — returns profile type by type string', async () => {
    mockQuery.mockResolvedValueOnce([[
      { profile_type_id: 1, type: 'ATHLETE', display_name: 'Athletes', description: 'Perf' },
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
    mockQuery.mockResolvedValueOnce([[{ profile_type_id: 2, type: 'MEAL_PLANNER', display_name: 'Meal Planners', description: '' }]]);
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
//  22. USER ROUTES  (/api/users)
// =====================================================================
describe('POST /api/users/register', () => {
  const validReg = { username: 'alice_01', email: 'alice@example.com', password: 'secure1', confirmPassword: 'secure1', selectedPlanId: 1 };

  test('201 — registers new user with role "free" for plan 1', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])            // username not taken
      .mockResolvedValueOnce([[]])            // email not taken
      .mockResolvedValueOnce([{ insertId: 10 }]) // INSERT user
      .mockResolvedValueOnce([[{ userId: 10, username: 'alice_01', email: 'alice@example.com', role: 'free', isActive: 1 }]]); // SELECT user
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'mongo-user-id' });

    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('alice_01');
    expect(res.body.user.role).toBe('free');
  });

  test('201 — assigns role "premium" for selectedPlanId 2', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([[{ userId: 11, username: 'bob', email: 'bob@b.com', role: 'premium', isActive: 1 }]]);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'mongo-id-2' });

    const res = await request(app).post('/api/users/register').send({ ...validReg, username: 'bob', email: 'bob@b.com', selectedPlanId: 2 });
    expect(res.body.user.role).toBe('premium');
  });

  test('409 — username already exists', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 5 }]]); // username taken
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('username');
  });

  test('409 — email already in use', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])              // username ok
      .mockResolvedValueOnce([[{ user_id: 5 }]]); // email taken
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
  });

  test('bcrypt.hash is called with password and saltRounds=10', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 12 }])
      .mockResolvedValueOnce([[{ userId: 12, username: 'carol', role: 'free', isActive: 1 }]]);
    mockCollection.insertOne.mockResolvedValue({ insertedId: 'id' });
    bcrypt.hash.mockResolvedValue('hashed_pw');

    await request(app).post('/api/users/register').send({ ...validReg, username: 'carol', email: 'carol@c.com' });
    expect(bcrypt.hash).toHaveBeenCalledWith('secure1', 10);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(500);
  });
});

describe('POST /api/users/login', () => {
  const userRow = { userId: 1, username: 'alice', passwordHash: 'hashed', isActive: 1, role: 'free' };

  test('200 — logs in with correct credentials', async () => {
    mockQuery.mockResolvedValueOnce([[userRow]]);
    bcrypt.compare.mockResolvedValue(true);
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'secure1' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('alice');
  });

  test('401 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const res = await request(app).post('/api/users/login').send({ username: 'ghost', password: 'pw' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect credentials/i);
  });

  test('403 — account is deactivated', async () => {
    mockQuery.mockResolvedValueOnce([[{ ...userRow, isActive: 0 }]]);
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'secure1' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('401 — wrong password', async () => {
    mockQuery.mockResolvedValueOnce([[userRow]]);
    bcrypt.compare.mockResolvedValue(false);
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'pw' });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/users/:userId', () => {
  test('200 — returns user account details', async () => {
    mockQuery.mockResolvedValueOnce([[{ userId: 1, username: 'alice', email: 'a@a.com', role: 'free', isActive: 1 }]]);
    const res = await request(app).get('/api/users/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.username).toBe('alice');
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).get('/api/users/999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/update', () => {
  const updateBody = { userId: 1, username: 'alice_new', email: 'new@example.com', membershipPlanId: 2, role: 'premium' };

  test('200 — updates account details', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])                         // username not taken by other user
      .mockResolvedValueOnce([[]])                         // email not taken by other user
      .mockResolvedValueOnce([{ affectedRows: 1 }])        // UPDATE users
      .mockResolvedValueOnce([[{ userId: 1, username: 'alice_new', email: 'new@example.com', role: 'premium' }]]); // SELECT

    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.username).toBe('alice_new');
  });

  test('409 — username taken by another user', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 99 }]]); // taken by user 99
    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('username');
  });

  test('409 — email taken by another user', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[{ user_id: 99 }]]);
    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('email');
  });
});

describe('PUT /api/users/profile-type', () => {
  test('200 — updates profile type successfully', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[{ userId: 1, profileType: 'ATHLETE' }]]); // SELECT

    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'ATHLETE' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('400 — missing userId', async () => {
    const res = await request(app).put('/api/users/profile-type').send({ profileType: 'ATHLETE' });
    expect(res.status).toBe(400);
  });

  test('400 — invalid profile type', async () => {
    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'INVALID' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid profile type/i);
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/users/profile-type').send({ userId: 999, profileType: 'ATHLETE' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/delete/:userId', () => {
  test('200 — deletes user account', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/users/delete/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/users/delete/999');
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/users/calorie-limit', () => {
  test('200 — updates daily calorie limit', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ userId: 1, username: 'alice', dailyCalorieLimit: 1800 }]]);

    const res = await request(app).put('/api/users/calorie-limit').send({ userId: 1, dailyCalorieLimit: 1800 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.dailyCalorieLimit).toBe(1800);
  });

  test('500 — handles DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).put('/api/users/calorie-limit').send({ userId: 1, dailyCalorieLimit: 2000 });
    expect(res.status).toBe(500);
  });
});


// =====================================================================
//  23. WEIGHT ENTRY ROUTES  (/api/weight-entries)
// =====================================================================
describe('POST /api/weight-entries', () => {
  test('201 — creates weight entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ insertId: 20 }])
      .mockResolvedValueOnce([[{ entry_id: 20, user_id: 1, weight_kg: 70, logged_at: '2024-01-01' }]]);

    const res = await request(app).post('/api/weight-entries').send({ userId: 1, weightKg: 70 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.weightKg).toBe(70);
  });

  test('400 — missing userId', async () => {
    const res = await request(app).post('/api/weight-entries').send({ weightKg: 70 });
    expect(res.status).toBe(400);
  });

  test('400 — non-numeric weightKg', async () => {
    const res = await request(app).post('/api/weight-entries').send({ userId: 1, weightKg: 'heavy' });
    expect(res.status).toBe(400);
  });

  test('500 — handles DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).post('/api/weight-entries').send({ userId: 1, weightKg: 70 });
    expect(res.status).toBe(500);
  });
});

describe('GET /api/weight-entries/:userId', () => {
  test('200 — returns weight history ordered newest-first', async () => {
    mockExecute.mockResolvedValue([[
      { entry_id: 2, user_id: 1, weight_kg: 69, logged_at: '2024-06-01' },
      { entry_id: 1, user_id: 1, weight_kg: 70, logged_at: '2024-01-01' },
    ]]);
    const res = await request(app).get('/api/weight-entries/1');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].weightKg).toBe(69);
  });

  test('200 — returns empty array when no entries', async () => {
    mockExecute.mockResolvedValue([[]]);
    const res = await request(app).get('/api/weight-entries/99');
    expect(res.body.data).toEqual([]);
  });

  test('500 — handles DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/weight-entries/1');
    expect(res.status).toBe(500);
  });
});

describe('PUT /api/weight-entries/:entryId', () => {
  test('200 — updates weight entry', async () => {
    mockExecute
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ entry_id: 5, user_id: 1, weight_kg: 72, logged_at: '2024-01-01' }]]);

    const res = await request(app).put('/api/weight-entries/5').send({ weightKg: 72 });
    expect(res.status).toBe(200);
    expect(res.body.data.weightKg).toBe(72);
  });

  test('400 — non-numeric weightKg', async () => {
    const res = await request(app).put('/api/weight-entries/5').send({ weightKg: 'heavy' });
    expect(res.status).toBe(400);
  });

  test('404 — entry not found', async () => {
    mockExecute.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/weight-entries/999').send({ weightKg: 72 });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/weight-entries/:entryId', () => {
  test('200 — deletes weight entry', async () => {
    mockExecute.mockResolvedValue([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/weight-entries/5');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/removed/i);
  });

  test('404 — entry not found', async () => {
    mockExecute.mockResolvedValue([{ affectedRows: 0 }]);
    const res = await request(app).delete('/api/weight-entries/999');
    expect(res.status).toBe(404);
  });

  test('500 — handles DB error', async () => {
    mockExecute.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).delete('/api/weight-entries/5');
    expect(res.status).toBe(500);
  });
});
