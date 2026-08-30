import { DateTime } from 'luxon';

/**
 * Timezone utility class for consistent date/time formatting
 * Uses Luxon for robust timezone handling
 */
export class TimezoneFormatter {
  constructor(timezone = 'America/New_York') {
    this.timezone = timezone;
  }

  /**
   * Set the timezone for all formatting operations
   */
  setTimezone(timezone) {
    this.timezone = timezone;
  }

  /**
   * Format timestamp to time string (e.g., "3:45 PM")
   */
  formatTime(timestamp) {
    return DateTime.fromISO(timestamp, { zone: this.timezone })
      .toLocaleString(DateTime.TIME_SIMPLE);
  }

  /**
   * Format timestamp to date string (e.g., "Jan 15, 2024")
   */
  formatDate(timestamp, format = DateTime.DATE_MED) {
    return DateTime.fromISO(timestamp, { zone: this.timezone })
      .toLocaleString(format);
  }

  /**
   * Format timestamp to datetime string (e.g., "Jan 15, 2024, 3:45 PM")
   */
  formatDateTime(timestamp) {
    return DateTime.fromISO(timestamp, { zone: this.timezone })
      .toLocaleString(DateTime.DATETIME_MED);
  }

  /**
   * Convert timestamp to YYYY-MM-DD format in the display timezone
   * This is used for date grouping and filtering
   */
  toLocalDateString(timestamp) {
    return DateTime.fromISO(timestamp, { zone: this.timezone })
      .toFormat('yyyy-MM-dd');
  }

  /**
   * Get the current date in YYYY-MM-DD format in the display timezone
   */
  getCurrentDate() {
    return DateTime.now().setZone(this.timezone).toFormat('yyyy-MM-dd');
  }

  /**
   * Create a timestamp from current moment in the user's timezone
   * This fixes the timezone bug where activities were created with UTC time
   */
  createTimestamp() {
    return DateTime.now().setZone(this.timezone).toISO();
  }

  /**
   * Get relative time (e.g., "2 hours ago", "just now")
   */
  getRelativeTime(timestamp) {
    const dt = DateTime.fromISO(timestamp, { zone: this.timezone });
    return dt.toRelative();
  }

  /**
   * Parse a date string into a DateTime object
   */
  parseDate(dateString) {
    return DateTime.fromISO(dateString, { zone: this.timezone });
  }

  /**
   * Check if a timestamp is today in the user's timezone
   */
  isToday(timestamp) {
    const date = this.toLocalDateString(timestamp);
    const today = this.getCurrentDate();
    return date === today;
  }

  /**
   * Get formatted date range for display
   */
  formatDateRange(startDate, endDate) {
    const start = DateTime.fromISO(startDate, { zone: this.timezone });
    const end = DateTime.fromISO(endDate, { zone: this.timezone });
    
    if (start.hasSame(end, 'month')) {
      return `${start.toFormat('MMM d')} - ${end.toFormat('d, yyyy')}`;
    }
    return `${start.toFormat('MMM d, yyyy')} - ${end.toFormat('MMM d, yyyy')}`;
  }
}

// Create a singleton instance
const timezoneFormatter = new TimezoneFormatter();

export default timezoneFormatter;
