import { describe, test, expect } from 'vitest';
import { validateGPSCoordinates, formatGPSCoordinates, calculateDistance } from '../gps';

describe('GPS Utilities', () => {
  describe('validateGPSCoordinates', () => {
    test('accepts valid coordinates', () => {
      expect(validateGPSCoordinates(40.7128, -74.0060)).toBe(true); // NYC
      expect(validateGPSCoordinates(0, 0)).toBe(true); // Equator
      expect(validateGPSCoordinates(90, 180)).toBe(true); // Extremes
      expect(validateGPSCoordinates(-90, -180)).toBe(true); // Extremes
    });

    test('rejects invalid latitude', () => {
      expect(validateGPSCoordinates(91, 0)).toBe(false); // Too high
      expect(validateGPSCoordinates(-91, 0)).toBe(false); // Too low
      expect(validateGPSCoordinates(NaN, 0)).toBe(false);
      expect(validateGPSCoordinates(null, 0)).toBe(false);
    });

    test('rejects invalid longitude', () => {
      expect(validateGPSCoordinates(0, 181)).toBe(false); // Too high
      expect(validateGPSCoordinates(0, -181)).toBe(false); // Too low
      expect(validateGPSCoordinates(0, NaN)).toBe(false);
      expect(validateGPSCoordinates(0, null)).toBe(false);
    });
  });

  describe('formatGPSCoordinates', () => {
    test('formats coordinates with 6 decimal places', () => {
      const formatted = formatGPSCoordinates(40.712776, -74.005974);
      expect(formatted).toHaveProperty('lat');
      expect(formatted).toHaveProperty('lon');
      expect(formatted.lat).toContain('40.712776');
      expect(formatted.lon).toContain('74.005974');
    });

    test('formats with N/S and E/W indicators', () => {
      const north = formatGPSCoordinates(40.7128, -74.0060);
      expect(north.lat).toContain('N');
      expect(north.lon).toContain('W');

      const south = formatGPSCoordinates(-33.8688, 151.2093);
      expect(south.lat).toContain('S');
      expect(south.lon).toContain('E');
    });

    test('handles edge cases', () => {
      const equator = formatGPSCoordinates(0, 0);
      expect(equator).toBeTruthy();
      expect(equator.lat).toContain('N'); // 0 latitude is considered north
      expect(equator.lon).toContain('E'); // 0 longitude is considered east
    });
  });

  describe('calculateDistance', () => {
    test('calculates distance between NYC and LA', () => {
      const nyc = { lat: 40.7128, lon: -74.0060 };
      const la = { lat: 34.0522, lon: -118.2437 };
      const distance = calculateDistance(nyc.lat, nyc.lon, la.lat, la.lon);
      
      // Approximately 3944 km
      expect(distance).toBeGreaterThan(3900);
      expect(distance).toBeLessThan(4000);
    });

    test('returns 0 for same coordinates', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7128, -74.0060);
      expect(distance).toBeCloseTo(0, 1);
    });

    test('calculates short distances accurately', () => {
      const distance = calculateDistance(40.7128, -74.0060, 40.7138, -74.0050);
      
      // Should be less than 1 km for nearby points
      expect(distance).toBeLessThan(1);
      expect(distance).toBeGreaterThan(0);
    });
  });
});
