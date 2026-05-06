/**
 * BiteWise — Backend Route Tests Part 2 — UPDATED FOR CHANGED ROUTES
 * =====================================================================
 * CHANGES APPLIED vs PREVIOUS VERSION:
 *
 * 1. membershipplanroute.js — mock call ordering fixed. GET /active
 *    was consuming the mock intended for GET /:id because tests ran in
 *    sequence with shared mockQuery state. Each test now queues its own
 *    mockResolvedValueOnce independently.
 *
 * 2. nutritiontargetsroute.js — queueEnsure() helper fixed:
 *    - 404 test: when user not in MySQL, only ONE mockQuery call needed
 *      (ensureUserExists returns null immediately, no Mongo calls made).
 *    - "creates default doc" test: queueEnsure(0, false) correctly
 *      queues insertOne (not updateMany) for the new-doc path.
 *    - validateTargets runs BEFORE ensureTargetsDoc, so 400 tests
 *      need no DB mocks at all.
 *
 * 3. reviewroute.js — reviewer_initials derived as:
 *    username.split(' ').map(w => w[0]).join('').toUpperCase()
 *    Single word 'alice' → 'A'. Multi-word 'Alice Johnson' → 'AJ'.
 *    Tests that check initials use 'Alice Johnson' as username.
 *    GET /reviews and DELETE /reviews 500 tests: route has no explicit
 *    try/catch on DELETE so 500 only fires if query throws — confirmed
 *    mockRejectedValueOnce correctly triggers it.
 *
 * 4. userprofiletyperoute.js — mock now intercepted correctly via
 *    unstable_mockModule. Tests assert on mocked rows only.
 *    Route has a double res.status(500).json() bug in the source but
 *    only the first one fires — tests pass correctly.
 *
 * 5. usersroute.js:
 *    - register: 4 db.query calls + 1 mongo insertOne.
 *      Call order: SELECT username, SELECT email, INSERT user,
 *      INSERT mongo, SELECT created user.
 *    - login: bcrypt.compare uses mockBcryptCompare.mockResolvedValueOnce.
 *      isActive check: route uses `if (!user.isActive)` — tinyint 0
 *      is falsy so deactivated test works with { isActive: 0 }.
 *    - profile-type PUT: 2 calls — UPDATE returns [{ affectedRows }],
 *      SELECT returns [[{...row}]].
 *    - delete: uses db.query (not db.execute). Returns [{ affectedRows }].
 *    - calorie-limit: 2 db.query calls (UPDATE then SELECT).
 *    - update: 4 db.query calls (2 conflict checks, UPDATE, SELECT).
 *
 * 6. weightentryroute.js — all mockExecute return shapes verified:
 *    INSERT → [{ insertId }], SELECT → [[{...rows}]],
 *    UPDATE/DELETE → [{ affectedRows: N }] (explicitly 1 or 0).
 *
 * 7. recipedraftroute.js — GET / now supports ?userId query param filter.
 *    findOneAndUpdate returns { value: updatedDoc } shape.
 *
 * 8. reciperoute.js — POST /save uses db.execute for MySQL saved_recipes.
 *    GET /saved/:userId uses db.execute. DELETE /saved uses db.execute
 *    then mongo deleteMany. PUT /:recipeId/like requires isCurated:true.
 *
 * Place at:  backend/__tests__/routes2.test.js
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
  updateMany:       jest.fn(),
  deleteOne:        jest.fn(),
  deleteMany:       jest.fn(),
  aggregate:        jest.fn(),
  findOneAndUpdate: jest.fn(),
  countDocuments:   jest.fn(),
};

const mockBcryptHash    = jest.fn().mockResolvedValue('hashed_password');
const mockBcryptCompare = jest.fn().mockResolvedValue(true);

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

// ─── Step 3: Dynamic imports AFTER mocks are registered ──────────────

let app;
const VALID_OID = '64a1f1a2b3c4d5e6f7a8b9c0';

beforeAll(async () => {
  const [
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
  mockCollection.findOneAndUpdate.mockResolvedValue({ value: null });
  mockCollection.countDocuments.mockResolvedValue(1);
  mockCollection.aggregate.mockReturnValue(makeAggregateCursor([]));
  mockBcryptHash.mockResolvedValue('hashed_password');
  mockBcryptCompare.mockResolvedValue(true);
});


// =====================================================================
//  1. MEAL PLAN ROUTES  /api/meal-plans (unchanged)
// =====================================================================

describe('GET /api/meal-plans/:userId', () => {
  test('200 — returns plans', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, userId: 1, name: 'Week 1', description: '', numDays: 7, days: [], isAutoGenerated: false, planType: '', createdAt: new Date().toISOString() },
    ]));
    const res = await request(app).get('/api/meal-plans/1');
    expect(res.status).toBe(200);
    expect(res.body.data[0].name).toBe('Week 1');
  });

  test('400 — non-numeric userId', async () => {
    const res = await request(app).get('/api/meal-plans/abc');
    expect(res.status).toBe(400);
  });

  test('200 — empty when no plans', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/meal-plans/99');
    expect(res.body.data).toEqual([]);
  });

  test('500 — DB error', async () => {
    mockCollection.find.mockImplementation(() => { throw new Error('Mongo down'); });
    const res = await request(app).get('/api/meal-plans/1');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/meal-plans', () => {
  const validPlan = { userId: 1, name: 'My Plan', description: 'Weekly', numDays: 7, days: [] };

  test('201 — creates plan', async () => {
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: VALID_OID });
    const res = await request(app).post('/api/meal-plans').send(validPlan);
    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('My Plan');
    expect(res.body.data.isAutoGenerated).toBe(false);
  });

  test('400 — name missing', async () => {
    const res = await request(app).post('/api/meal-plans').send({ ...validPlan, name: '' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
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

  test('201 — generates 7-day Balanced Diet', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'Balanced Diet' });
    expect(res.status).toBe(201);
    expect(res.body.data.isAutoGenerated).toBe(true);
    expect(res.body.data.days).toHaveLength(7);
    expect(res.body.data.planType).toBe('Balanced Diet');
  });

  test('201 — "keto" → "Keto"', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'keto' });
    expect(res.body.data.planType).toBe('Keto');
  });

  test('201 — "weight loss" → "Weight Loss"', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'weight loss' });
    expect(res.body.data.planType).toBe('Weight Loss');
  });

  test('201 — unknown type defaults to Balanced Diet', async () => {
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
  });

  test('201 — day numbers sequential 1–7', async () => {
    const res = await request(app).post('/api/meal-plans/generate').send({ userId: 1, planType: 'Vegetarian' });
    expect(res.body.data.days.map(d => d.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });
});

describe('PUT /api/meal-plans/:planId', () => {
  test('200 — updates plan name', async () => {
    const updated = { _id: VALID_OID, userId: 1, name: 'Updated', description: '', numDays: 7, days: [], isAutoGenerated: false, planType: '' };
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 1 });
    mockCollection.findOne.mockResolvedValueOnce(updated);
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Updated' });
    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Updated');
  });

  test('400 — invalid ObjectId', async () => {
    const res = await request(app).put('/api/meal-plans/not-an-oid').send({ name: 'Test' });
    expect(res.status).toBe(400);
  });

  test('400 — whitespace name', async () => {
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: '  ' });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('name');
  });

  test('404 — plan not found', async () => {
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
    const res = await request(app).put(`/api/meal-plans/${VALID_OID}`).send({ name: 'Test' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/meal-plans/:planId', () => {
  test('200 — soft-deletes (isDeleted = true)', async () => {
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

  test('404 — not found', async () => {
    mockCollection.updateOne.mockResolvedValueOnce({ matchedCount: 0 });
    const res = await request(app).delete(`/api/meal-plans/${VALID_OID}`);
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  2. MEMBERSHIP PLAN ROUTES  /api/membership-plans
//  FIX: Each test queues its own mock independently. Do not share state.
//  GET /active and GET /:id must each queue exactly ONE mockResolvedValueOnce.
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
  test('200 — returns only active plans', async () => {
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
    mockQuery.mockResolvedValueOnce([[
      { plan_id: 2, name: 'Premium', price: 19.99 },
    ]]);
    const res = await request(app).get('/api/membership-plans/2');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Premium');
  });

  test('404 — plan not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // empty rows
    const res = await request(app).get('/api/membership-plans/999');
    expect(res.status).toBe(404);
  });
});


// =====================================================================
//  3. NUTRITION TARGETS ROUTES  /api/nutrition-targets
//
//  ensureTargetsDoc(userId) call order:
//    1. db.query(SELECT from users)           → mockQuery call #1
//    2. mongo.countDocuments                  → mockCollection.countDocuments
//    3a. mongo.updateMany  (doc exists)       → mockCollection.updateMany
//    OR
//    3b. mongo.insertOne   (no doc yet)       → mockCollection.insertOne
//  Then main handler logic runs.
//
//  FIX: 404 test — when MySQL user SELECT returns empty, ensureUserExists
//  returns null immediately. No Mongo calls made. Only 1 mockQuery needed.
//  FIX: validateTargets runs BEFORE ensureTargetsDoc for PUT routes,
//  so 400 tests need zero DB mock calls.
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

  test('400 — userId 0 rejected immediately (no DB calls)', async () => {
    const res = await request(app).get('/api/nutrition-targets/0');
    expect(res.status).toBe(400);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('404 — user not in MySQL (one query, no Mongo calls)', async () => {
    // ensureUserExists returns null when SELECT returns empty array
    mockQuery.mockResolvedValueOnce([[]]); // only one call needed
    const res = await request(app).get('/api/nutrition-targets/999');
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  test('200 — creates default Mongo doc when none exists', async () => {
    queueEnsure(0, false); // docExists=false → insertOne path
    mockCollection.find.mockReturnValue(makeCursor([defaultTargetDoc]));
    const res = await request(app).get('/api/nutrition-targets/1');
    expect(res.status).toBe(200);
    expect(res.body.data.calories).toBe(2000);
  });
});

describe('PUT /api/nutrition-targets/:userId', () => {
  const validTargets = {
    calories: 2000, protein: 150, carbs: 250,
    fat: 67, fiber: 30, activityLevel: 'Balanced', goal: 'Maintain Weight',
  };

  test('200 — updates all targets', async () => {
    queueEnsure();
    mockCollection.updateMany.mockResolvedValueOnce({ matchedCount: 1 });
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]); // UPDATE users calorie_limit
    mockCollection.find.mockReturnValue(makeCursor([defaultTargetDoc]));
    const res = await request(app).put('/api/nutrition-targets/1').send(validTargets);
    expect(res.status).toBe(200);
    expect(res.body.data.calories).toBe(2000);
  });

  test('400 — calories below 500 (no DB calls — validation runs first)', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, calories: 400 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('400 — calories above 10000', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, calories: 11000 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('calories');
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('400 — negative protein', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, protein: -1 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('protein');
  });

  test('400 — negative fat', async () => {
    const res = await request(app).put('/api/nutrition-targets/1').send({ ...validTargets, fat: -2 });
    expect(res.status).toBe(400);
    expect(res.body.field).toBe('fat');
  });

  test('404 — user not found', async () => {
    mockQuery.mockResolvedValueOnce([[]]); // ensureUserExists → null
    const res = await request(app).put('/api/nutrition-targets/999').send(validTargets);
    expect(res.status).toBe(404);
  });
});

describe('PUT /api/nutrition-targets/:userId/calories', () => {
  test('200 — updates calorie goal', async () => {
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
//  CHANGED: GET / now supports ?userId query param.
//  findOneAndUpdate returns { value: updatedDoc }.
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

  test('200 — filters by userId query param', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { _id: VALID_OID, title: 'User Draft', createdByUserId: 5 },
    ]));
    const res = await request(app).get('/api/recipe-drafts?userId=5');
    expect(res.status).toBe(200);
    expect(res.body[0].createdByUserId).toBe(5);
    // Confirm find() was called with userId filter
    const filterArg = mockCollection.find.mock.calls[0][0];
    expect(filterArg).toMatchObject({ createdByUserId: 5 });
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

  test('404 — not found', async () => {
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
    mockCollection.findOne.mockResolvedValueOnce({ _id: VALID_OID, title: 'Old', isPublished: false });
    // findOneAndUpdate returns { value: updatedDoc }
    mockCollection.findOneAndUpdate.mockResolvedValueOnce({ value: { _id: VALID_OID, title: 'Updated' } });
    const res = await request(app).put(`/api/recipe-drafts/${VALID_OID}`).send({ title: 'Updated' });
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
    const draft = { _id: VALID_OID, title: 'My Recipe', createdByUserId: '1', ingredients: ['egg'], likeCount: 0, viewCount: 0 };
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
//  CHANGED: reviewer_initials derived from username split on spaces.
//  'alice' (one word) → 'A'. 'Alice Johnson' (two words) → 'AJ'.
//  GET / and DELETE / DB error tests confirmed working with mockRejectedValueOnce.
// =====================================================================

describe('GET /api/reviews', () => {
  test('200 — returns mocked rows only', async () => {
    mockQuery.mockResolvedValueOnce([[
      { review_id: 1, review_user_id: 1, rating: 5, content: 'Great!', status: 'active' },
    ]]);
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].rating).toBe(5);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB error'));
    const res = await request(app).get('/api/reviews');
    expect(res.status).toBe(500);
  });
});

describe('POST /api/reviews', () => {
  const validReview = {
    review_user_id: 1, rating: 5, title: 'Great!',
    content: 'Changed my life!', profile_type: 'Athlete', membership_plan_id: 2,
  };

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
    mockQuery.mockResolvedValueOnce([[]]); // no rows
    const res = await request(app).post('/api/reviews').send(validReview);
    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/user not found/i);
  });

  test('reviewer initials — single word "alice" → "A"', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ username: 'alice' }]])
      .mockResolvedValueOnce([{ insertId: 11 }]);
    await request(app).post('/api/reviews').send(validReview);
    const insertArgs = mockQuery.mock.calls[1][1];
    // reviewer_initials is insertArgs[2]
    expect(insertArgs[2]).toBe('A');
  });

  test('reviewer initials — two words "Alice Johnson" → "AJ"', async () => {
    mockQuery
      .mockResolvedValueOnce([[{ username: 'Alice Johnson' }]])
      .mockResolvedValueOnce([{ insertId: 12 }]);
    await request(app).post('/api/reviews').send(validReview);
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
  test('200 — deletes review', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    const res = await request(app).delete('/api/reviews/5');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });

  test('confirms DELETE query called with correct ID', async () => {
    mockQuery.mockResolvedValueOnce([{ affectedRows: 1 }]);
    await request(app).delete('/api/reviews/42');
    const sql    = mockQuery.mock.calls[0][0];
    const params = mockQuery.mock.calls[0][1];
    expect(sql).toMatch(/DELETE FROM reviews/i);
    expect(params).toContain('42');
  });
});


// =====================================================================
//  6. SMART EATING CONTENT ROUTES  /api/smart-eating (unchanged)
// =====================================================================

describe('GET /api/smart-eating/alternatives', () => {
  test('200 — returns food alternatives', async () => {
    mockCollection.find.mockReturnValue(makeCursor([
      { altId: 'a1', category: 'Snack', original: 'Chips', alternative: 'Rice cakes' },
    ]));
    const res = await request(app).get('/api/smart-eating/alternatives');
    expect(res.status).toBe(200);
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
      { tipId: 't1', title: 'Eat slowly', content: 'Chew thoroughly.' },
    ]));
    const res = await request(app).get('/api/smart-eating/mindful-snacking');
    expect(res.status).toBe(200);
    expect(res.body.data[0].title).toBe('Eat slowly');
  });
});

describe('GET /api/smart-eating/mindful-snacking/content', () => {
  test('200 — returns DEFAULT_SNACKING_CONTENT when no data', async () => {
    mockCollection.find.mockReturnValue(makeCursor([]));
    const res = await request(app).get('/api/smart-eating/mindful-snacking/content');
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('corePrinciples');
    expect(res.body.data).toHaveProperty('snackIdeas');
  });
});


// =====================================================================
//  7. USER PROFILE TYPE ROUTES  /api/user-profile-types
//  FIX: With unstable_mockModule, mockQuery now intercepted correctly.
//  Assert only on mocked rows. Route has a double-response bug in source
//  but only the first res.json() fires — tests pass correctly.
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
  test('200 — returns by numeric ID', async () => {
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
//  CHANGED mock sequences:
//  register: SELECT username, SELECT email, INSERT MySQL, MongoDB insertOne,
//            SELECT created user → 4 mockQuery + 1 mockCollection.insertOne
//  login: bcrypt.compare uses mockBcryptCompare.mockResolvedValueOnce
//  profile-type: 2 mockQuery calls — [{ affectedRows }] then [[...rows]]
//  delete: db.query (not execute) — [{ affectedRows }]
//  calorie-limit: 2 db.query calls — UPDATE then SELECT
//  update: 4 db.query calls — 2 conflict checks + UPDATE + SELECT
// =====================================================================

describe('POST /api/users/register', () => {
  const validReg = {
    username: 'alice_01', email: 'alice@example.com',
    password: 'secure1', confirmPassword: 'secure1', selectedPlanId: 1,
  };

  test('201 — registers user with role "free" for plan 1', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])              // SELECT: username not taken
      .mockResolvedValueOnce([[]])              // SELECT: email not taken
      .mockResolvedValueOnce([{ insertId: 10 }]) // INSERT MySQL user
      .mockResolvedValueOnce([[{ userId: 10, username: 'alice_01', email: 'alice@example.com', role: 'free', isActive: 1 }]]); // SELECT created user
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'mongo-id' }); // MongoDB insert
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('free');
  });

  test('201 — role "premium" for selectedPlanId 2', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([[]])
      .mockResolvedValueOnce([{ insertId: 11 }])
      .mockResolvedValueOnce([[{ userId: 11, username: 'bob', role: 'premium', isActive: 1 }]]);
    mockCollection.insertOne.mockResolvedValueOnce({ insertedId: 'mongo-id-2' });
    const res = await request(app).post('/api/users/register').send({
      ...validReg, username: 'bob', email: 'bob@b.com', selectedPlanId: 2,
    });
    expect(res.body.user.role).toBe('premium');
  });

  test('409 — username taken', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 5 }]]); // username conflict
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(409);
    expect(res.body.field).toBe('username');
  });

  test('409 — email taken (second query returns row)', async () => {
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
    await request(app).post('/api/users/register').send({
      ...validReg, username: 'carol', email: 'carol@c.com',
    });
    expect(mockBcryptHash).toHaveBeenCalledWith('secure1', 10);
  });

  test('500 — DB error', async () => {
    mockQuery.mockRejectedValueOnce(new Error('DB down'));
    const res = await request(app).post('/api/users/register').send(validReg);
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/something went wrong/i);
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
    mockQuery.mockResolvedValueOnce([[]]);
    const res = await request(app).post('/api/users/login').send({ username: 'ghost', password: 'pw' });
    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/incorrect credentials/i);
  });

  test('403 — deactivated account (isActive = 0 is falsy)', async () => {
    mockQuery.mockResolvedValueOnce([[{ ...activeUser, isActive: 0 }]]);
    const res = await request(app).post('/api/users/login').send({ username: 'alice', password: 'secure1' });
    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/deactivated/i);
  });

  test('401 — wrong password (bcrypt returns false)', async () => {
    mockQuery.mockResolvedValueOnce([[activeUser]]);
    mockBcryptCompare.mockResolvedValueOnce(false);
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
  const updateBody = {
    userId: 1, username: 'alice_new', email: 'new@example.com',
    membershipPlanId: 2, role: 'premium',
  };

  test('200 — updates account (4 query calls)', async () => {
    mockQuery
      .mockResolvedValueOnce([[]])   // username not taken by other user
      .mockResolvedValueOnce([[]])   // email not taken by other user
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE users
      .mockResolvedValueOnce([[{ userId: 1, username: 'alice_new', email: 'new@example.com', role: 'premium' }]]); // SELECT
    const res = await request(app).put('/api/users/update').send(updateBody);
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('alice_new');
  });

  test('409 — username taken by different user', async () => {
    mockQuery.mockResolvedValueOnce([[{ user_id: 99 }]]); // conflict
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
  test('200 — sets ATHLETE (2 query calls)', async () => {
    mockQuery
      .mockResolvedValueOnce([{ affectedRows: 1 }])  // UPDATE
      .mockResolvedValueOnce([[{ userId: 1, profileType: 'ATHLETE' }]]); // SELECT
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

  test('400 — userId missing (no DB calls)', async () => {
    const res = await request(app).put('/api/users/profile-type').send({ profileType: 'ATHLETE' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/user id is required/i);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('400 — invalid profile type (no DB calls)', async () => {
    const res = await request(app).put('/api/users/profile-type').send({ userId: 1, profileType: 'INVALID' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid profile type/i);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  test('404 — user not found (affectedRows = 0, first call only)', async () => {
    // Route checks updateResult.affectedRows === 0 after first query
    mockQuery.mockResolvedValueOnce([{ affectedRows: 0 }]);
    const res = await request(app).put('/api/users/profile-type').send({ userId: 999, profileType: 'ATHLETE' });
    expect(res.status).toBe(404);
  });
});

describe('DELETE /api/users/delete/:userId', () => {
  // Route uses db.query (not db.execute) — returns [{ affectedRows }]
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
  // Route uses db.query for both UPDATE and SELECT (not db.execute)
  test('200 — updates calorie limit (2 query calls)', async () => {
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
//  All mockExecute shapes:
//    INSERT → [{ insertId: N }]
//    SELECT → [[{...rows}]]
//    UPDATE → [{ affectedRows: N }]   (explicitly 1 or 0)
//    DELETE → [{ affectedRows: N }]   (explicitly 1 or 0)
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

  test('200 — empty array', async () => {
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
      .mockResolvedValueOnce([{ affectedRows: 1 }])
      .mockResolvedValueOnce([[{ entry_id: 5, user_id: 1, weight_kg: 72, logged_at: '2024-06-01' }]]);
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
