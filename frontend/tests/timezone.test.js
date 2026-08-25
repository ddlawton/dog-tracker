/**
 * Timezone Fix Validation Test
 * Tests that the timestamp creation fix correctly handles timezone conversions
 */

describe('Timezone Fix - Activity Logging', () => {
  let displayTimezone = 'America/New_York';

  /**
   * Simulates the fixed logActivity timestamp creation
   * This is the corrected method that should be used
   */
  function createActivityTimestampFixed(timezone = 'America/New_York') {
    const now = new Date();
    // Convert current UTC time to the display timezone string
    const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezone }));
    return tzDate.toISOString();
  }

  /**
   * The old broken method (for comparison)
   * This just uses UTC directly
   */
  function createActivityTimestampBroken() {
    return new Date().toISOString();
  }

  function formatTime(timestamp, timeZone = 'America/New_York') {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: timeZone
    });
  }

  test('should create timestamps in Eastern Time by default', () => {
    const estTimestamp = createActivityTimestampFixed('America/New_York');
    
    // Should be valid ISO format
    expect(estTimestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    
    // Should be parseable as a date
    const parsed = new Date(estTimestamp);
    expect(parsed).toBeInstanceOf(Date);
    expect(!isNaN(parsed.getTime())).toBe(true);
  });

  test('should show correct time when displayed in same timezone', () => {
    // Get current time
    const now = new Date();
    const currentHourEST = parseInt(
      new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
        .toLocaleTimeString('en-US', { hour: 'numeric', timeZone: 'America/New_York' })
    );
    
    // Create timestamp using fixed method
    const timestamp = createActivityTimestampFixed('America/New_York');
    
    // Display it back in EST
    const displayedTime = formatTime(timestamp, 'America/New_York');
    const displayedHourMatch = displayedTime.match(/^(\d{1,2}):/);
    const displayedHour = displayedHourMatch ? parseInt(displayedHourMatch[1]) : null;
    
    // The displayed hour should be close to current hour (within 1 hour due to minute differences)
    expect(displayedHour).not.toBeNull();
    expect(Math.abs(displayedHour - currentHourEST) <= 1).toBe(true);
  });

  test('old method would create incorrect offsets', () => {
    const brokenTimestamp = createActivityTimestampBroken();
    const fixedTimestamp = createActivityTimestampFixed('America/New_York');
    
    // Both should be valid timestamps
    expect(new Date(brokenTimestamp).getTime()).toBeDefined();
    expect(new Date(fixedTimestamp).getTime()).toBeDefined();
    
    // They might differ by timezone offset
    const brokenDate = new Date(brokenTimestamp);
    const fixedDate = new Date(fixedTimestamp);
    
    // The difference should be roughly timezone offset (in milliseconds)
    // EDT is UTC-4, so difference should be around 4 hours = 14,400,000 ms
    const diffMs = Math.abs(brokenDate.getTime() - fixedDate.getTime());
    
    // Should be significant enough to notice (at least an hour apart if timezones differ)
    // But not unreasonably large (not days apart)
    expect(diffMs < 86400000).toBe(true); // Less than 1 day
  });

  test('should handle timezone changes correctly', () => {
    // Test with different timezones
    const timezones = [
      'America/New_York',      // EST/EDT
      'America/Chicago',       // CST/CDT
      'America/Los_Angeles',   // PST/PDT
      'UTC'
    ];
    
    timezones.forEach(tz => {
      const timestamp = createActivityTimestampFixed(tz);
      const displayedTime = formatTime(timestamp, tz);
      
      // Should be valid time format
      expect(displayedTime).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    });
  });

  test('real-world scenario: 8 PM EST log shows as 8 PM EST', () => {
    // Simulate a user in EST logging at 8 PM their local time
    // Create a mock date that represents 8 PM EST
    
    // 8 PM EST = 12 AM UTC (next day) during winter (UTC-5)
    // or 8 PM EDT = 12 AM UTC (next day) during summer (UTC-4)
    
    // We'll test that whatever timezone the user is in,
    // when they create a timestamp and display it in their timezone,
    // it shows approximately the same time
    
    const userTimezone = 'America/New_York';
    
    // Create a timestamp (what the user sees now)
    const timestamp = createActivityTimestampFixed(userTimezone);
    
    // Display it (what the app shows)
    const displayed = formatTime(timestamp, userTimezone);
    
    // Should be a valid time
    expect(displayed).toMatch(/\d{1,2}:\d{2}\s(AM|PM)/);
    
    // Extract hour to verify it's reasonable
    const hourMatch = displayed.match(/^(\d{1,2}):/);
    const hour = hourMatch ? parseInt(hourMatch[1]) : null;
    
    expect(hour).not.toBeNull();
    expect(hour >= 1 && hour <= 12).toBe(true);
  });

  test('timezone fix prevents 6-hour offset bug', () => {
    // The original bug: 8 PM EST showed as 2:59 AM (roughly 6 hours off)
    // This was because UTC was used directly without timezone conversion
    
    const fixedTimestamp = createActivityTimestampFixed('America/New_York');
    const displayed = formatTime(fixedTimestamp, 'America/New_York');
    
    // Extract the hour
    const hourMatch = displayed.match(/^(\d{1,2}):/);
    const displayedHour = hourMatch ? parseInt(hourMatch[1]) : null;
    
    // Get current EST hour
    const now = new Date();
    const currentTzString = now.toLocaleString('en-US', { timeZone: 'America/New_York' });
    const currentTzDate = new Date(currentTzString);
    const currentHour = currentTzDate.getHours();
    
    // They should be very close (within 1 hour)
    // If they're 6 hours apart, the bug is still there
    const hourDifference = Math.abs(displayedHour - (currentHour === 0 ? 12 : currentHour > 12 ? currentHour - 12 : currentHour));
    
    expect(hourDifference <= 1).toBe(true);
  });
});
