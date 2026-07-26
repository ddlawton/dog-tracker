/**
 * Backend Integration Tests - Activity CRUD Operations
 */

const request = require('supertest');
const { setupTestDatabase, cleanupTestDatabase, getPool } = require('../setup');
const fixtures = require('../fixtures/activities.fixtures');

let app;

beforeAll(async () => {
  await setupTestDatabase();
  app = require('../../server');
});

afterAll(async () => {
  await cleanupTestDatabase();
});

describe('POST /api/activities - Create Activity', () => {
  test('should create potty activity with all fields', async () => {
    const res = await request(app)
      .post('/api/activities')
      .send(fixtures.validPottyActivity)
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.type).toBe('potty');
    expect(res.body.subtype).toBe('pee');
    expect(res.body.notes).toBe('Regular break');
    expect(parseFloat(res.body.gps_lat)).toBeCloseTo(40.7128, 4);
    expect(parseFloat(res.body.gps_lon)).toBeCloseTo(-74.0060, 4);
  });

  test('should create minimal activity without optional fields', async () => {
    const res = await request(app)
      .post('/api/activities')
      .send(fixtures.minimalActivity)
      .expect(201);

    expect(res.body.type).toBe('eating');
    expect(res.body.subtype).toBeNull();
    expect(res.body.notes).toBeNull();
    expect(res.body.gps_lat).toBeNull();
    expect(res.body.gps_lon).toBeNull();
  });

  test('should reject activity without type', async () => {
    const res = await request(app)
      .post('/api/activities')
      .send(fixtures.invalidActivities.noType)
      .expect(400);

    expect(res.body).toHaveProperty('error');
  });

  test('should reject activity without timestamp', async () => {
    const res = await request(app)
      .post('/api/activities')
      .send(fixtures.invalidActivities.noTimestamp)
      .expect(400);

    expect(res.body).toHaveProperty('error');
  });

  test('should create all valid activity types', async () => {
    for (const type of fixtures.allActivityTypes) {
      const activity = {
        type,
        timestamp: new Date().toISOString()
      };

      const res = await request(app)
        .post('/api/activities')
        .send(activity)
        .expect(201);

      expect(res.body.type).toBe(type);
    }
  });

  test('should store correct GPS coordinates from multiple locations', async () => {
    for (const [location, coords] of Object.entries(fixtures.gpsVariations)) {
      const activity = {
        type: 'potty',
        timestamp: new Date().toISOString(),
        gps_lat: coords.lat,
        gps_lon: coords.lon
      };

      const res = await request(app)
        .post('/api/activities')
        .send(activity)
        .expect(201);

      expect(parseFloat(res.body.gps_lat)).toBeCloseTo(coords.lat, 4);
      expect(parseFloat(res.body.gps_lon)).toBeCloseTo(coords.lon, 4);
    }
  });
});

describe('GET /api/activities - Retrieve Activities', () => {
  beforeEach(async () => {
    const pool = await getPool();
    await pool.query('TRUNCATE activities RESTART IDENTITY');
    
    // Seed test data
    await request(app)
      .post('/api/activities')
      .send(fixtures.validPottyActivity);
    
    await request(app)
      .post('/api/activities')
      .send(fixtures.validEatingActivity);
  });

  test('should retrieve all activities', async () => {
    const res = await request(app)
      .get('/api/activities')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  test('should return activities in descending timestamp order', async () => {
    const res = await request(app)
      .get('/api/activities')
      .expect(200);

    for (let i = 0; i < res.body.length - 1; i++) {
      const current = new Date(res.body[i].timestamp);
      const next = new Date(res.body[i + 1].timestamp);
      expect(current.getTime()).toBeGreaterThanOrEqual(next.getTime());
    }
  });

  test('should filter activities by specific date', async () => {
    const testDate = new Date().toISOString().split('T')[0];
    const res = await request(app)
      .get(`/api/activities?date=${testDate}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe('DELETE /api/activities/:id - Delete Activity', () => {
  let activityId;

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/activities')
      .send(fixtures.validPottyActivity);
    
    activityId = res.body.id;
  });

  test('should delete an existing activity', async () => {
    const res = await request(app)
      .delete(`/api/activities/${activityId}`)
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('deleted');
  });

  test('should return 404 when deleting non-existent activity', async () => {
    const res = await request(app)
      .delete('/api/activities/99999')
      .expect(404);

    expect(res.body).toHaveProperty('error');
  });

  test('should not retrieve deleted activity', async () => {
    await request(app)
      .delete(`/api/activities/${activityId}`)
      .expect(200);

    const getRes = await request(app)
      .get(`/api/activities?date=${new Date().toISOString().split('T')[0]}`)
      .expect(200);

    const deleted = getRes.body.find(a => a.id === activityId);
    expect(deleted).toBeUndefined();
  });
});
