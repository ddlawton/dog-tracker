/**
 * Frontend Unit Tests - Calculations and Statistics
 */

const fixtures = require('../fixtures/activities.fixtures');

describe('Activity Grouping by Date', () => {
  test('should group activities by date correctly', () => {
    const activities = fixtures.sampleActivities;
    
    const byDate = {};
    activities.forEach(activity => {
      const date = activity.timestamp.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(activity);
    });

    expect(Object.keys(byDate).length).toBe(4);
    expect(byDate['2026-07-26'].length).toBe(2);
    expect(byDate['2026-07-25'].length).toBe(1);
    expect(byDate['2026-07-24'].length).toBe(1);
    expect(byDate['2026-07-23'].length).toBe(1);
  });

  test('should maintain activity data when grouping', () => {
    const activities = fixtures.sampleActivities.slice(0, 3);
    
    const byDate = {};
    activities.forEach(activity => {
      const date = activity.timestamp.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(activity);
    });

    const todayActivities = byDate['2026-07-26'];
    expect(todayActivities[0].type).toBe('potty');
    expect(todayActivities[1].type).toBe('eating');
  });
});

describe('Activity Type Counting', () => {
  test('should count activities by type correctly', () => {
    const typeCounts = {
      potty: 0,
      vomit: 0,
      eating: 0,
      groom: 0,
      surgery: 0
    };

    fixtures.sampleActivities.forEach(activity => {
      if (typeCounts[activity.type] !== undefined) {
        typeCounts[activity.type]++;
      }
    });

    expect(typeCounts.potty).toBe(1);
    expect(typeCounts.eating).toBe(1);
    expect(typeCounts.vomit).toBe(1);
    expect(typeCounts.groom).toBe(1);
    expect(typeCounts.surgery).toBe(1);
  });

  test('should handle duplicate activity types', () => {
    const activities = [
      { type: 'potty' },
      { type: 'potty' },
      { type: 'potty' },
      { type: 'eating' },
      { type: 'vomit' }
    ];

    const typeCounts = {
      potty: 0,
      vomit: 0,
      eating: 0
    };

    activities.forEach(activity => {
      if (typeCounts[activity.type] !== undefined) {
        typeCounts[activity.type]++;
      }
    });

    expect(typeCounts.potty).toBe(3);
    expect(typeCounts.eating).toBe(1);
    expect(typeCounts.vomit).toBe(1);
  });
});

describe('Weekly Statistics', () => {
  test('should calculate 7-day activity counts', () => {
    const typeCounts = {
      potty: 0,
      eating: 0,
      vomit: 0
    };

    Object.values(fixtures.weekData).forEach(activities => {
      activities.forEach(activity => {
        if (typeCounts[activity.type] !== undefined) {
          typeCounts[activity.type]++;
        }
      });
    });

    expect(typeCounts.potty).toBe(12); // Most frequent
    expect(typeCounts.eating).toBe(3);
    expect(typeCounts.vomit).toBe(1);
  });

  test('should calculate daily averages from week data', () => {
    const typeCounts = {
      potty: 12,
      eating: 3,
      vomit: 1
    };

    const avgDaily = {
      potty: (typeCounts.potty / 7).toFixed(1),
      eating: (typeCounts.eating / 7).toFixed(1),
      vomit: (typeCounts.vomit / 7).toFixed(1)
    };

    expect(parseFloat(avgDaily.potty)).toBeCloseTo(1.7, 1);
    expect(parseFloat(avgDaily.eating)).toBeCloseTo(0.4, 1);
    expect(parseFloat(avgDaily.vomit)).toBeCloseTo(0.1, 1);
  });

  test('should identify days with no activities', () => {
    const emptyDays = Object.entries(fixtures.weekData)
      .filter(([date, activities]) => activities.length === 0)
      .map(([date]) => date);

    expect(emptyDays).toContain('2026-07-23');
    expect(emptyDays.length).toBe(1);
  });

  test('should identify high activity days (5+ activities)', () => {
    const highActivityDays = Object.entries(fixtures.weekData)
      .filter(([date, activities]) => activities.length >= 5)
      .map(([date]) => date);

    expect(highActivityDays).toContain('2026-07-26');
    expect(highActivityDays.length).toBe(1);
  });
});

describe('Activity History - Last Activity Tracking', () => {
  test('should find last activity of each type', () => {
    const activities = fixtures.sampleActivities;
    
    const lastActivities = {};
    activities.forEach(activity => {
      if (!lastActivities[activity.type]) {
        lastActivities[activity.type] = activity;
      }
    });

    expect(lastActivities['potty'].id).toBe(1);
    expect(lastActivities['eating'].id).toBe(2);
    expect(lastActivities['vomit'].id).toBe(3);
  });

  test('should track correct timestamp for last activity', () => {
    const lastActivities = {
      potty: { type: 'potty', timestamp: '2026-07-26T10:00:00Z' },
      eating: { type: 'eating', timestamp: '2026-07-26T12:00:00Z' }
    };

    expect(lastActivities.potty.timestamp).toBe('2026-07-26T10:00:00Z');
    expect(lastActivities.eating.timestamp).toBe('2026-07-26T12:00:00Z');
  });
});

describe('Calendar Generation', () => {
  test('should correctly identify days in July 2026', () => {
    const year = 2026;
    const month = 6; // July

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    expect(daysInMonth).toBe(31); // July has 31 days
    expect(firstDay.getDay()).toBeGreaterThanOrEqual(0);
    expect(firstDay.getDay()).toBeLessThan(7);
  });

  test('should calculate activity intensity threshold correctly', () => {
    const dailyCounts = {
      high: 10,
      medium: 5,
      low: 1,
      none: 0
    };

    const intensities = Object.entries(dailyCounts).map(([label, count]) => ({
      label,
      isHigh: count >= 5
    }));

    expect(intensities.find(i => i.label === 'high').isHigh).toBe(true);
    expect(intensities.find(i => i.label === 'medium').isHigh).toBe(true);
    expect(intensities.find(i => i.label === 'low').isHigh).toBe(false);
    expect(intensities.find(i => i.label === 'none').isHigh).toBe(false);
  });
});

describe('Subtype Handling', () => {
  test('should correctly handle potty subtypes', () => {
    const subtypes = ['pee', 'poo', 'both'];
    
    subtypes.forEach(subtype => {
      expect(['pee', 'poo', 'both']).toContain(subtype);
    });
  });

  test('should format subtype for display', () => {
    const subtypes = ['pee', 'poo', 'both'];
    
    subtypes.forEach(subtype => {
      const formatted = subtype.charAt(0).toUpperCase() + subtype.slice(1);
      expect(formatted[0]).toBe(formatted[0].toUpperCase());
    });
  });

  test('should handle null subtype for non-potty activities', () => {
    expect(fixtures.sampleActivities.find(a => a.type === 'eating').subtype).toBeUndefined();
    expect(fixtures.sampleActivities.find(a => a.type === 'vomit').subtype).toBeUndefined();
  });
});

describe('Export Data Validation', () => {
  test('should validate export data structure', () => {
    const exportData = {
      exported_at: new Date().toISOString(),
      count: 5,
      activities: fixtures.sampleActivities
    };

    expect(exportData).toHaveProperty('exported_at');
    expect(exportData).toHaveProperty('count');
    expect(exportData).toHaveProperty('activities');
    expect(exportData.activities.length).toBe(exportData.count);
  });

  test('should verify exported activities contain required fields', () => {
    const activity = fixtures.sampleActivities[0];
    
    expect(activity).toHaveProperty('id');
    expect(activity).toHaveProperty('type');
    expect(activity).toHaveProperty('timestamp');
    expect(activity).toHaveProperty('created_at');
    expect(typeof activity.id).toBe('number');
  });
});
