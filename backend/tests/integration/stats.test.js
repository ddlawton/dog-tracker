/**
 * Backend Integration Tests - Statistics and Export
 */

const request = require('supertest');
const { Pool } = require('pg');
const fixtures = require('../fixtures/activities.fixtures');
require('dotenv').config();

let app;
let pool;

beforeAll(async () => {
  // Database already set up by globalSetup.js
  app = require('../../server');
  
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'josie_tracker_test',
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
  });
});

afterAll(async () => {
  if (pool) await pool.end();
});

describe('GET /api/activities/stats - Activity Statistics', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE activities RESTART IDENTITY CASCADE');

    // Create varied activities for today
    for (const type of fixtures.allActivityTypes) {
      await request(app)
        .post('/api/activities')
        .send({
          type,
          timestamp: new Date().toISOString(),
          // Add subtype for potty activities (required by validation)
          ...(type === 'potty' && { subtype: 'pee' })
        });
    }
  });

  test('should return statistics for all activity types', async () => {
    const res = await request(app)
      .get('/api/activities/stats')
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  test('should include type and count in stats', async () => {
    const res = await request(app)
      .get('/api/activities/stats')
      .expect(200);

    res.body.forEach(stat => {
      expect(stat).toHaveProperty('type');
      expect(stat).toHaveProperty('count');
      expect(typeof stat.count).toBe('number');
      expect(stat.count).toBeGreaterThanOrEqual(0);
    });
  });
});

describe('GET /api/export - Export Data', () => {
  beforeEach(async () => {
    await pool.query('TRUNCATE activities RESTART IDENTITY CASCADE');

    // Create test activities
    await request(app)
      .post('/api/activities')
      .send(fixtures.validPottyActivity);

    await request(app)
      .post('/api/activities')
      .send(fixtures.validEatingActivity);
  });

  test('should export all activities as JSON', async () => {
    const res = await request(app)
      .get('/api/export')
      .expect(200);

    expect(res.body).toHaveProperty('exported_at');
    expect(res.body).toHaveProperty('count');
    expect(res.body).toHaveProperty('activities');
  });

  test('should include valid ISO timestamp in export', async () => {
    const res = await request(app)
      .get('/api/export')
      .expect(200);

    expect(res.body.exported_at).toBeDefined();
    expect(new Date(res.body.exported_at)).toBeTruthy();
  });

  test('should match count with activities array length', async () => {
    const res = await request(app)
      .get('/api/export')
      .expect(200);

    expect(res.body.activities.length).toBe(res.body.count);
  });

  test('should include all required fields in exported activities', async () => {
    const res = await request(app)
      .get('/api/export')
      .expect(200);

    if (res.body.activities.length > 0) {
      const activity = res.body.activities[0];
      expect(activity).toHaveProperty('id');
      expect(activity).toHaveProperty('type');
      expect(activity).toHaveProperty('timestamp');
      expect(activity).toHaveProperty('created_at');
    }
  });
});

describe('GET /health - Health Check', () => {
  test('should return ok status', async () => {
    const res = await request(app)
      .get('/health')
      .expect(200);

    expect(res.body).toHaveProperty('status');
    expect(res.body.status).toBe('ok');
  });
});

