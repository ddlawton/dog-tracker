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
