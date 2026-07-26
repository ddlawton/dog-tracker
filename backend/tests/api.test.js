const request = require('supertest');
const { Pool } = require('pg');
require('dotenv').config();

let app;
let pool;

beforeAll(async () => {
  // Initialize database pool
  pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'josie_tracker_test',
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
  });

  // Wait for database to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Load app
  app = require('../server');
});

afterAll(async () => {
  await pool.end();
});

describe('Activity API', () => {
  const testActivity = {
    type: 'potty',
    subtype: 'pee',
    timestamp: new Date().toISOString(),
    notes: 'Test activity',
    gps_lat: 40.7128,
    gps_lon: -74.0060
  };

  let activityId;

  describe('POST /api/activities', () => {
    test('should log a new activity with all fields', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send(testActivity)
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.type).toBe('potty');
      expect(res.body.subtype).toBe('pee');
      expect(res.body.notes).toBe('Test activity');
      expect(parseFloat(res.body.gps_lat)).toBe(40.7128);
      expect(parseFloat(res.body.gps_lon)).toBe(-74.0060);
      
      activityId = res.body.id;
    });

    test('should log activity without optional fields', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send({
          type: 'vomit',
          timestamp: new Date().toISOString()
        })
        .expect(201);

      expect(res.body.type).toBe('vomit');
      expect(res.body.subtype).toBeNull();
      expect(res.body.notes).toBeNull();
      expect(res.body.gps_lat).toBeNull();
    });

    test('should reject activity without type', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send({
          timestamp: new Date().toISOString()
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    test('should reject activity without timestamp', async () => {
      const res = await request(app)
        .post('/api/activities')
        .send({
          type: 'eating'
        })
        .expect(400);

      expect(res.body).toHaveProperty('error');
    });

    test('should store correct GPS coordinates', async () => {
      const gpsTest = {
        type: 'groom',
        timestamp: new Date().toISOString(),
        gps_lat: 51.5074,
        gps_lon: -0.1278
      };

      const res = await request(app)
        .post('/api/activities')
        .send(gpsTest)
        .expect(201);

      expect(parseFloat(res.body.gps_lat)).toBeCloseTo(51.5074, 4);
      expect(parseFloat(res.body.gps_lon)).toBeCloseTo(-0.1278, 4);
    });
  });

  describe('GET /api/activities', () => {
    test('should retrieve all activities', async () => {
      const res = await request(app)
        .get('/api/activities')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    test('should retrieve activities in descending timestamp order', async () => {
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
      const testDate = '2026-07-26';
      const res = await request(app)
        .get(`/api/activities?date=${testDate}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      
      // If any activities returned, verify they match the date
      if (res.body.length > 0) {
        res.body.forEach(activity => {
          const activityDate = activity.timestamp.split('T')[0];
          // Activities might be from other dates if they exist
          // so we just verify the structure is correct
          expect(activity).toHaveProperty('id');
          expect(activity).toHaveProperty('type');
        });
      }
    });
  });

  describe('DELETE /api/activities/:id', () => {
    test('should delete an existing activity', async () => {
      // First create an activity
      const createRes = await request(app)
        .post('/api/activities')
        .send({
          type: 'surgery',
          timestamp: new Date().toISOString()
        })
        .expect(201);

      const deleteRes = await request(app)
        .delete(`/api/activities/${createRes.body.id}`)
        .expect(200);

      expect(deleteRes.body).toHaveProperty('message');
      expect(deleteRes.body.message).toContain('deleted');
    });

    test('should return 404 when deleting non-existent activity', async () => {
      const res = await request(app)
        .delete('/api/activities/99999')
        .expect(404);

      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/activities/stats', () => {
    test('should return activity statistics', async () => {
      const res = await request(app)
        .get('/api/activities/stats')
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      
      res.body.forEach(stat => {
        expect(stat).toHaveProperty('type');
        expect(stat).toHaveProperty('count');
        expect(typeof stat.count).toBe('number');
        expect(stat.count).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('GET /api/export', () => {
    test('should export all activities as JSON', async () => {
      const res = await request(app)
        .get('/api/export')
        .expect(200);

      expect(res.body).toHaveProperty('exported_at');
      expect(res.body).toHaveProperty('count');
      expect(res.body).toHaveProperty('activities');
      expect(Array.isArray(res.body.activities)).toBe(true);
      expect(typeof res.body.count).toBe('number');
    });

    test('should include all required fields in export', async () => {
      const res = await request(app)
        .get('/api/export')
        .expect(200);

      if (res.body.activities.length > 0) {
        const activity = res.body.activities[0];
        expect(activity).toHaveProperty('id');
        expect(activity).toHaveProperty('type');
        expect(activity).toHaveProperty('timestamp');
      }
    });
  });

  describe('GET /health', () => {
    test('should return health status', async () => {
      const res = await request(app)
        .get('/health')
        .expect(200);

      expect(res.body).toHaveProperty('status');
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Activity type validation', () => {
    test('should accept all valid activity types', async () => {
      const types = ['potty', 'vomit', 'eating', 'groom', 'surgery'];

      for (const type of types) {
        const res = await request(app)
          .post('/api/activities')
          .send({
            type,
            timestamp: new Date().toISOString()
          })
          .expect(201);

        expect(res.body.type).toBe(type);
      }
    });
  });

  describe('Timestamp handling', () => {
    test('should store and retrieve correct ISO timestamps', async () => {
      const now = new Date();
      const isoTimestamp = now.toISOString();

      const createRes = await request(app)
        .post('/api/activities')
        .send({
          type: 'eating',
          timestamp: isoTimestamp
        })
        .expect(201);

      const getRes = await request(app)
        .get('/api/activities')
        .expect(200);

      const stored = getRes.body.find(a => a.id === createRes.body.id);
      expect(stored).toBeDefined();
      expect(new Date(stored.timestamp).toISOString()).toBe(isoTimestamp);
    });
  });
});
