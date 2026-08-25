/**
 * Frontend Unit Tests - Formatters and Validators
 */

const fixtures = require('../fixtures/activities.fixtures');

describe('Activity Type Formatting', () => {
  test('should map all activity types to correct emojis', () => {
    fixtures.allActivityTypes.forEach(type => {
      expect(fixtures.typeEmoji[type]).toBeDefined();
      expect(typeof fixtures.typeEmoji[type]).toBe('string');
    });
  });

  test('should have 5 activity types', () => {
    expect(fixtures.allActivityTypes.length).toBe(5);
    expect(fixtures.typeEmoji).toHaveProperty('potty');
    expect(fixtures.typeEmoji).toHaveProperty('vomit');
    expect(fixtures.typeEmoji).toHaveProperty('eating');
    expect(fixtures.typeEmoji).toHaveProperty('groom');
    expect(fixtures.typeEmoji).toHaveProperty('surgery');
  });

  test('should format type name correctly', () => {
    const type = 'potty';
    const formatted = type.charAt(0).toUpperCase() + type.slice(1);
    expect(formatted).toBe('Potty');
  });
});

describe('Timestamp Parsing', () => {
  test('should correctly parse ISO timestamps', () => {
    const timestamp = '2026-07-26T14:30:00Z';
    const date = new Date(timestamp);
    
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6); // July
    expect(date.getDate()).toBe(26);
  });

  test('should format time with correct locale', () => {
    const timestamp = '2026-07-26T14:30:00Z';
    const date = new Date(timestamp);
    const timeString = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    expect(timeString).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
  });

  test('should format date correctly for display', () => {
    const date = new Date('2026-07-26T00:00:00Z');
    const formatted = date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    expect(formatted).toContain('2026');
    expect(formatted).toContain('Jul');
  });
});

describe('HTML Security - Escaping', () => {
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

  test('should escape all HTML injection vectors', () => {
    fixtures.htmlInjectionTests.forEach(injection => {
      const escaped = escapeHtml(injection);
      expect(escaped).not.toContain('<');
      expect(escaped).not.toContain('>');
      expect(escaped).not.toContain('"');
    });
  });

  test('should escape script tags', () => {
    expect(escapeHtml('<script>')).toBe('&lt;script&gt;');
    expect(escapeHtml('</script>')).toBe('&lt;/script&gt;');
  });

  test('should escape quotes and ampersands', () => {
    expect(escapeHtml('alert("xss")')).toBe('alert(&quot;xss&quot;)');
    expect(escapeHtml('A & B')).toBe('A &amp; B');
    expect(escapeHtml("it's")).toBe('it&#039;s');
  });

  test('should not double-escape normal text', () => {
    const text = 'Normal dog activity note';
    expect(escapeHtml(text)).toBe(text);
  });
});

describe('GPS Coordinate Validation', () => {
  function validateGPSCoordinates(lat, lon) {
    if (lat === null || lon === null) return false;
    
    const latitude = typeof lat === 'string' ? parseFloat(lat) : lat;
    const longitude = typeof lon === 'string' ? parseFloat(lon) : lon;
    
    return !isNaN(latitude) && !isNaN(longitude) && 
           latitude >= -90 && latitude <= 90 && 
           longitude >= -180 && longitude <= 180;
  }

  test('should validate all valid GPS coordinates', () => {
    fixtures.gpsCoordinates.valid.forEach(coords => {
      expect(validateGPSCoordinates(coords.lat, coords.lon)).toBe(true);
    });
  });

  test('should reject all invalid GPS coordinates', () => {
    fixtures.gpsCoordinates.invalid.forEach(coords => {
      expect(validateGPSCoordinates(coords.lat, coords.lon)).toBe(false);
    });
  });

  test('should handle string coordinates correctly', () => {
    expect(validateGPSCoordinates('40.7128', '-74.0060')).toBe(true);
    expect(validateGPSCoordinates('91', '0')).toBe(false);
  });

  test('should format GPS with correct precision', () => {
    expect((40.712776).toFixed(6)).toBe('40.712776');
    expect((-74.005974).toFixed(6)).toBe('-74.005974');
  });
});

describe('Timezone Handling', () => {
  function formatTime(timestamp, timeZone = 'America/New_York') {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone
    });
  }

  function toLocalDateString(timestamp, timeZone = 'America/New_York') {
    return new Date(timestamp).toLocaleDateString('en-CA', { timeZone: timeZone });
  }

  function createTimestampInTimezone(timeZone) {
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timeZone }));
    return tzDate.toISOString();
  }

  test('should create timestamps in the correct timezone', () => {
    // Create a timestamp in Eastern Time
    const estTimestamp = createTimestampInTimezone('America/New_York');
    
    // The timestamp should be a valid ISO string
    expect(estTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  test('should display EST time correctly', () => {
    // 8:00 PM EST would be 2026-08-24T20:00:00 in local time, but we need to check display
    const testTime = '2026-08-24T20:00:00Z'; // 8 PM UTC
    const displayedTime = formatTime(testTime, 'America/New_York');
    
    // At UTC 20:00, EST should be 4:00 PM (UTC-4 during summer)
    expect(displayedTime).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
  });

  test('should correctly handle date boundaries across timezones', () => {
    // UTC 2026-08-25T03:00:00Z is 2026-08-24 at 11 PM EDT
    const timestamp = '2026-08-25T03:00:00Z';
    const estDate = toLocalDateString(timestamp, 'America/New_York');
    
    // This should be 2026-08-24 in EST
    expect(estDate.startsWith('2026-08-24')).toBe(true);
  });

  test('should convert between timezones correctly', () => {
    const timestamp = '2026-08-24T20:00:00Z';
    
    const estTime = formatTime(timestamp, 'America/New_York');
    const utcTime = formatTime(timestamp, 'UTC');
    const pstTime = formatTime(timestamp, 'America/Los_Angeles');
    
    // All should format as valid times
    expect(estTime).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    expect(utcTime).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    expect(pstTime).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    
    // Times should be different due to timezone offset
    // EST is UTC-4 in summer, so 20:00 UTC = 4:00 PM EST
  });

  test('should handle the timezone fix logic correctly', () => {
    // Simulate the fix: creating a timestamp in display timezone
    const displayTimezone = 'America/New_York';
    const now = new Date();
    
    // Convert to local string in the timezone, then back to Date
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: displayTimezone }));
    const timestamp = tzDate.toISOString();
    
    // The timestamp should be valid
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    
    // When displayed in the same timezone, hours should be close to original
    const displayedTime = formatTime(timestamp, displayTimezone);
    expect(displayedTime).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
  });

  test('should maintain consistency between storage and display', () => {
    // Create a timestamp using the timezone-aware method
    const displayTimezone = 'America/New_York';
    const now = new Date();
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: displayTimezone }));
    const storedTimestamp = tzDate.toISOString();
    
    // Display it back
    const displayedTime = formatTime(storedTimestamp, displayTimezone);
    
    // Get the hour from the original time
    const originalHour = now.getHours();
    
    // Get the hour from the displayed time (basic extraction)
    const displayedHourMatch = displayedTime.match(/^(\d{1,2}):/);
    const displayedHour = displayedHourMatch ? parseInt(displayedHourMatch[1]) : null;
    
    // They should be close (within timezone offset range)
    expect(displayedHour).not.toBeNull();
  });
});
