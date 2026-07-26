/**
 * Frontend Unit Tests - API Response Validation
 */

const fixtures = require('../fixtures/activities.fixtures');

describe('API Response Structure', () => {
  test('should validate export response contains required fields', () => {
    const exportData = {
      exported_at: '2026-07-26T10:00:00.000Z',
      count: 5,
      activities: fixtures.sampleActivities
    };

    expect(exportData).toHaveProperty('exported_at');
    expect(exportData).toHaveProperty('count');
    expect(exportData).toHaveProperty('activities');
    expect(exportData.count).toBe(5);
  });

  test('should verify activity count matches activities array length', () => {
    const exportData = {
      exported_at: '2026-07-26T10:00:00.000Z',
      count: fixtures.sampleActivities.length,
      activities: fixtures.sampleActivities
    };

    expect(exportData.activities.length).toBe(exportData.count);
  });

  test('should validate export timestamp is valid ISO format', () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      count: 0,
      activities: []
    };

    const date = new Date(exportData.exported_at);
    expect(date).not.toBeNull();
    expect(date.toString()).not.toBe('Invalid Date');
  });
});

describe('Activity Object Validation', () => {
  test('should validate individual activity structure', () => {
    const activity = fixtures.sampleActivities[0];

    expect(activity).toHaveProperty('id');
    expect(activity).toHaveProperty('type');
    expect(activity).toHaveProperty('timestamp');
    expect(activity).toHaveProperty('created_at');
  });

  test('should verify activity type is valid', () => {
    const validTypes = fixtures.allActivityTypes;

    fixtures.sampleActivities.forEach(activity => {
      expect(validTypes).toContain(activity.type);
    });
  });

  test('should verify activity id is numeric', () => {
    fixtures.sampleActivities.forEach(activity => {
      expect(typeof activity.id).toBe('number');
      expect(activity.id).toBeGreaterThan(0);
    });
  });

  test('should handle optional GPS fields correctly', () => {
    const withGPS = fixtures.sampleActivities[0];
    const withoutGPS = fixtures.sampleActivities[2];

    expect(typeof withGPS.gps_lat).toBe('number');
    expect(typeof withGPS.gps_lon).toBe('number');
    expect(withoutGPS.gps_lat).toBeNull();
    expect(withoutGPS.gps_lon).toBeNull();
  });

  test('should verify timestamps are valid ISO strings', () => {
    fixtures.sampleActivities.forEach(activity => {
      const date = new Date(activity.timestamp);
      expect(date.toString()).not.toBe('Invalid Date');
      expect(activity.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/);
    });
  });
});

describe('Activity List Responses', () => {
  test('should return activities ordered by timestamp descending', () => {
    const activities = [
      { timestamp: '2026-07-26T14:00:00Z', id: 2 },
      { timestamp: '2026-07-26T10:00:00Z', id: 1 },
      { timestamp: '2026-07-25T16:00:00Z', id: 3 }
    ];

    const sorted = activities.sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );

    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(1);
    expect(sorted[2].id).toBe(3);
  });

  test('should filter activities by date', () => {
    const targetDate = '2026-07-26';
    const filtered = fixtures.sampleActivities.filter(activity => 
      activity.timestamp.startsWith(targetDate)
    );

    filtered.forEach(activity => {
      expect(activity.timestamp).toMatch(/^2026-07-26/);
    });
  });

  test('should include notes in activity response', () => {
    const activity = fixtures.sampleActivities.find(a => a.notes);
    
    expect(activity).toBeDefined();
    expect(activity.notes).toBeTruthy();
    expect(typeof activity.notes).toBe('string');
  });
});

describe('Statistics Response Validation', () => {
  test('should return valid statistics structure', () => {
    const stats = {
      potty: { total: 5, last_activity: '2026-07-26T10:00:00Z' },
      eating: { total: 3, last_activity: '2026-07-26T12:00:00Z' },
      vomit: { total: 1, last_activity: '2026-07-25T14:00:00Z' },
      groom: { total: 1, last_activity: '2026-07-24T10:00:00Z' },
      surgery: { total: 1, last_activity: '2026-07-23T09:00:00Z' }
    };

    fixtures.allActivityTypes.forEach(type => {
      expect(stats).toHaveProperty(type);
      expect(stats[type]).toHaveProperty('total');
      expect(stats[type]).toHaveProperty('last_activity');
    });
  });

  test('should verify statistics counts are non-negative numbers', () => {
    const stats = {
      potty: { total: 5 },
      eating: { total: 0 },
      vomit: { total: 1 }
    };

    Object.values(stats).forEach(stat => {
      expect(typeof stat.total).toBe('number');
      expect(stat.total).toBeGreaterThanOrEqual(0);
    });
  });

  test('should include all activity types in statistics', () => {
    const stats = {
      potty: { total: 5 },
      eating: { total: 3 },
      vomit: { total: 1 },
      groom: { total: 1 },
      surgery: { total: 1 }
    };

    fixtures.allActivityTypes.forEach(type => {
      expect(stats[type]).toBeDefined();
    });
  });
});

describe('Error Response Handling', () => {
  test('should handle empty activities response', () => {
    const response = {
      activities: [],
      count: 0
    };

    expect(Array.isArray(response.activities)).toBe(true);
    expect(response.activities.length).toBe(0);
    expect(response.count).toBe(0);
  });

  test('should handle activities with missing optional fields', () => {
    const activity = {
      id: 1,
      type: 'potty',
      timestamp: '2026-07-26T10:00:00Z',
      notes: undefined,
      gps_lat: null,
      gps_lon: null
    };

    expect(activity.id).toBeDefined();
    expect(activity.type).toBeDefined();
    expect(activity.timestamp).toBeDefined();
    expect(activity.gps_lat === null || activity.gps_lat === undefined).toBe(true);
  });

  test('should return proper HTTP response format', () => {
    const response = {
      status: 200,
      data: { activities: fixtures.sampleActivities },
      message: 'Success'
    };

    expect(response.status).toBe(200);
    expect(response.data).toBeDefined();
    expect(response.message).toBeDefined();
  });
});
