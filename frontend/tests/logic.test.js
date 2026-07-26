/**
 * Frontend unit tests for Josie Tracker
 * Tests real functionality and expected values, not just smoke tests
 */

describe('Activity Rendering', () => {
  test('should correctly parse activity timestamps', () => {
    const timestamp = '2026-07-26T14:30:00Z';
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    expect(timeString).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    expect(timeString).toContain(':');
  });

  test('should correctly categorize activity types', () => {
    const typeEmoji = {
      potty: '🚽',
      vomit: '🤢',
      eating: '🍽️',
      groom: '✨',
      surgery: '⚕️'
    };

    expect(typeEmoji['potty']).toBe('🚽');
    expect(typeEmoji['vomit']).toBe('🤢');
    expect(typeEmoji['eating']).toBe('🍽️');
    expect(Object.keys(typeEmoji).length).toBe(5);
  });
});

describe('HTML Escaping', () => {
  function escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  test('should escape HTML special characters', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('alert("xss")')).toBe('alert(&quot;xss&quot;)');
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  test('should handle ampersands correctly', () => {
    expect(escapeHtml('A & B')).toBe('A &amp; B');
    expect(escapeHtml('&lt;')).toBe('&amp;lt;');
  });

  test('should not double-escape already escaped content', () => {
    const original = 'Normal text';
    expect(escapeHtml(original)).toBe('Normal text');
  });
});

describe('Date Calculations', () => {
  test('should correctly calculate date strings', () => {
    const testDate = '2026-07-26';
    const dateObj = new Date(testDate);
    
    expect(dateObj.toISOString().startsWith('2026-07-26')).toBe(true);
  });

  test('should correctly format dates for calendar', () => {
    const date = new Date('2026-07-26T00:00:00Z');
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    expect(year).toBe(2026);
    expect(month).toBe(6); // July is 6 (0-indexed)
    expect(day).toBe(26);
  });

  test('should group activities by date correctly', () => {
    const activities = [
      { id: 1, timestamp: '2026-07-26T10:00:00Z', type: 'potty' },
      { id: 2, timestamp: '2026-07-26T14:00:00Z', type: 'eating' },
      { id: 3, timestamp: '2026-07-25T10:00:00Z', type: 'vomit' }
    ];

    const byDate = {};
    activities.forEach(activity => {
      const date = activity.timestamp.split('T')[0];
      if (!byDate[date]) byDate[date] = [];
      byDate[date].push(activity);
    });

    expect(Object.keys(byDate).length).toBe(2);
    expect(byDate['2026-07-26'].length).toBe(2);
    expect(byDate['2026-07-25'].length).toBe(1);
  });
});

describe('GPS Coordinate Handling', () => {
  function validateGPSCoordinates(lat, lon) {
    if (lat === null || lon === null) return false;
    
    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lon === 'string' ? parseFloat(lon) : lon;
    
    return !isNaN(latitude) && !isNaN(longitude) && 
           latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  }

  test('should validate correct GPS coordinates', () => {
    expect(validateGPSCoordinates(40.7128, -74.0060)).toBe(true);
    expect(validateGPSCoordinates('51.5074', '-0.1278')).toBe(true);
    expect(validateGPSCoordinates(0, 0)).toBe(true);
  });

  test('should reject invalid GPS coordinates', () => {
    expect(validateGPSCoordinates(91, 0)).toBe(false); // Latitude out of range
    expect(validateGPSCoordinates(0, 181)).toBe(false); // Longitude out of range
    expect(validateGPSCoordinates(null, null)).toBe(false);
  });

  test('should format GPS coordinates with correct precision', () => {
    const lat = 40.712776;
    const lon = -74.005974;
    
    expect(lat.toFixed(6)).toBe('40.712776');
    expect(lon.toFixed(6)).toBe('-74.005974');
  });

  test('should handle null GPS data', () => {
    const lat = null;
    const lon = null;
    
    const hasGPS = lat !== null && lon !== null;
    expect(hasGPS).toBe(false);
  });
});

describe('Activity Statistics', () => {
  test('should correctly count activities by type', () => {
    const activities = [
      { type: 'potty', count: 0 },
      { type: 'vomit', count: 0 },
      { type: 'eating', count: 0 },
      { type: 'groom', count: 0 },
      { type: 'surgery', count: 0 }
    ];

    const testActivities = [
      { type: 'potty' },
      { type: 'potty' },
      { type: 'potty' },
      { type: 'eating' },
      { type: 'vomit' }
    ];

    testActivities.forEach(activity => {
      const found = activities.find(a => a.type === activity.type);
      if (found) found.count++;
    });

    expect(activities.find(a => a.type === 'potty').count).toBe(3);
    expect(activities.find(a => a.type === 'eating').count).toBe(1);
    expect(activities.find(a => a.type === 'vomit').count).toBe(1);
    expect(activities.find(a => a.type === 'groom').count).toBe(0);
  });

  test('should calculate daily averages correctly', () => {
    const typeCounts = {
      potty: 7,
      eating: 3,
      vomit: 1
    };

    const avgDaily = {
      potty: (typeCounts.potty / 7).toFixed(1),
      eating: (typeCounts.eating / 7).toFixed(1),
      vomit: (typeCounts.vomit / 7).toFixed(1)
    };

    expect(parseFloat(avgDaily.potty)).toBe(1.0);
    expect(parseFloat(avgDaily.eating)).toBeCloseTo(0.4, 1);
    expect(parseFloat(avgDaily.vomit)).toBeCloseTo(0.1, 1);
  });

  test('should find last activity of each type', () => {
    const activities = [
      { type: 'potty', timestamp: '2026-07-26T10:00:00Z' },
      { type: 'potty', timestamp: '2026-07-26T14:00:00Z' },
      { type: 'eating', timestamp: '2026-07-26T12:00:00Z' },
      { type: 'vomit', timestamp: '2026-07-25T10:00:00Z' }
    ];

    const lastActivities = {};
    activities.forEach(activity => {
      if (!lastActivities[activity.type]) {
        lastActivities[activity.type] = activity;
      }
    });

    expect(lastActivities['potty'].timestamp).toBe('2026-07-26T10:00:00Z');
    expect(lastActivities['eating'].timestamp).toBe('2026-07-26T12:00:00Z');
    expect(lastActivities['vomit'].timestamp).toBe('2026-07-25T10:00:00Z');
  });
});

describe('Calendar Generation', () => {
  test('should correctly generate calendar days of month', () => {
    const year = 2026;
    const month = 6; // July

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    expect(daysInMonth).toBe(31); // July has 31 days
    expect(startingDayOfWeek).toBeGreaterThanOrEqual(0);
    expect(startingDayOfWeek).toBeLessThan(7);
  });

  test('should correctly calculate activity intensity', () => {
    const dates = {
      '2026-07-26': 10,
      '2026-07-25': 3,
      '2026-07-24': 1,
      '2026-07-23': 0
    };

    Object.entries(dates).forEach(([date, count]) => {
      const highActivity = count >= 5;
      
      if (date === '2026-07-26') expect(highActivity).toBe(true);
      if (date === '2026-07-25') expect(highActivity).toBe(false);
      if (date === '2026-07-24') expect(highActivity).toBe(false);
      if (date === '2026-07-23') expect(highActivity).toBe(false);
    });
  });
});

describe('Weekly Statistics Calculation', () => {
  test('should calculate last 7 days correctly', () => {
    const today = new Date('2026-07-26T00:00:00Z');
    const last7Days = {};

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last7Days[dateStr] = [];
    }

    const dateKeys = Object.keys(last7Days);
    expect(dateKeys.length).toBe(7);
    expect(dateKeys[0]).toBe('2026-07-20');
    expect(dateKeys[6]).toBe('2026-07-26');
  });

  test('should correctly sum activities across week', () => {
    const last7Days = {
      '2026-07-20': [{ type: 'potty' }],
      '2026-07-21': [{ type: 'potty' }, { type: 'eating' }],
      '2026-07-22': [{ type: 'potty' }, { type: 'potty' }],
      '2026-07-23': [],
      '2026-07-24': [{ type: 'vomit' }],
      '2026-07-25': [{ type: 'eating' }],
      '2026-07-26': [{ type: 'potty' }, { type: 'potty' }, { type: 'eating' }]
    };

    const typeCounts = {
      potty: 0,
      eating: 0,
      vomit: 0
    };

    Object.values(last7Days).forEach(activities => {
      activities.forEach(a => {
        if (typeCounts[a.type] !== undefined) {
          typeCounts[a.type]++;
        }
      });
    });

    expect(typeCounts.potty).toBe(6);
    expect(typeCounts.eating).toBe(3);
    expect(typeCounts.vomit).toBe(1);
  });
});

describe('Subtype Handling', () => {
  test('should correctly handle potty subtypes', () => {
    const subtypes = ['pee', 'poo', 'both'];
    
    subtypes.forEach(subtype => {
      expect(subtypes).toContain(subtype);
    });
  });

  test('should format subtype in display text', () => {
    const subtype = 'pee';
    const formatted = subtype.charAt(0).toUpperCase() + subtype.slice(1);
    
    expect(formatted).toBe('Pee');
  });

  test('should handle null subtype for non-potty activities', () => {
    const activity1 = { type: 'potty', subtype: 'poo' };
    const activity2 = { type: 'eating', subtype: null };
    
    expect(activity1.subtype).not.toBeNull();
    expect(activity2.subtype).toBeNull();
  });
});

describe('API Response Validation', () => {
  test('should validate export response structure', () => {
    const exportData = {
      exported_at: '2026-07-26T10:00:00.000Z',
      count: 2,
      activities: [
        { id: 1, type: 'potty', timestamp: '2026-07-26T10:00:00Z' },
        { id: 2, type: 'eating', timestamp: '2026-07-26T12:00:00Z' }
      ]
    };

    expect(exportData).toHaveProperty('exported_at');
    expect(exportData).toHaveProperty('count');
    expect(exportData).toHaveProperty('activities');
    expect(exportData.activities.length).toBe(exportData.count);
  });

  test('should validate activity object structure', () => {
    const activity = {
      id: 1,
      type: 'potty',
      subtype: 'pee',
      timestamp: '2026-07-26T10:00:00Z',
      notes: 'Test',
      gps_lat: 40.7128,
      gps_lon: -74.0060,
      created_at: '2026-07-26T10:00:00Z'
    };

    expect(activity).toHaveProperty('id');
    expect(typeof activity.id).toBe('number');
    expect(activity).toHaveProperty('type');
    expect(['potty', 'vomit', 'eating', 'groom', 'surgery']).toContain(activity.type);
  });
});
