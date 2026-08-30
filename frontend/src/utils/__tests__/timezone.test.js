import { describe, test, expect } from 'vitest';
import { TimezoneFormatter } from '../timezone';
import { DateTime } from 'luxon';

describe('TimezoneFormatter', () => {
  test('creates timezone formatter with valid timezone', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    expect(formatter.timezone).toBe('America/New_York');
  });

  test('createTimestamp returns ISO 8601 format', () => {
    const formatter = new TimezoneFormatter('America/Los_Angeles');
    const timestamp = formatter.createTimestamp();
    
    // Should be valid ISO 8601
    expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{2}:\d{2}$/);
    
    // Should be parseable
    const parsed = DateTime.fromISO(timestamp);
    expect(parsed.isValid).toBe(true);
  });

  test('createTimestamp uses correct timezone', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const timestamp = formatter.createTimestamp();
    const dt = DateTime.fromISO(timestamp);
    
    // Should have correct zone
    expect(dt.zoneName).toBe('America/New_York');
  });

  test('formatTime returns 12-hour format', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const testTime = '2026-08-30T14:30:00-04:00';
    const formatted = formatter.formatTime(testTime);
    
    expect(formatted).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
  });

  test('formatDate returns readable date', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const testTime = '2026-08-30T14:30:00-04:00';
    const formatted = formatter.formatDate(testTime);
    
    expect(formatted).toContain('Aug');
    expect(formatted).toContain('30');
    expect(formatted).toContain('2026');
  });

  test('isToday correctly identifies today', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const now = DateTime.now().setZone('America/New_York').toISO();
    
    expect(formatter.isToday(now)).toBe(true);
  });

  test('isToday correctly identifies not today', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const yesterday = DateTime.now().setZone('America/New_York').minus({ days: 1 }).toISO();
    
    expect(formatter.isToday(yesterday)).toBe(false);
  });

  test('getRelativeTime returns relative time strings', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const now = DateTime.now().setZone('America/New_York').toISO();
    
    const result = formatter.getRelativeTime(now);
    // Luxon returns "0 seconds ago", "in 0 seconds", etc
    expect(result).toMatch(/ago|in|now/i);
  });

  test('getRelativeTime handles past timestamps', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const yesterday = DateTime.now().setZone('America/New_York').minus({ days: 1 }).toISO();
    
    const result = formatter.getRelativeTime(yesterday);
    // Should contain "day" or "hour" or "ago"
    expect(result).toMatch(/day|hour|ago/i);
  });

  test('toLocalDateString returns YYYY-MM-DD format', () => {
    const formatter = new TimezoneFormatter('America/New_York');
    const testTime = '2026-08-30T14:30:00-04:00';
    const dateString = formatter.toLocalDateString(testTime);
    
    expect(dateString).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(dateString).toBe('2026-08-30');
  });
});
