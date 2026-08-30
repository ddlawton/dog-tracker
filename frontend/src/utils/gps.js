import { GPS_RANGES } from '../constants';

/**
 * Validate GPS coordinates are within valid ranges
 * Returns false for null/undefined values - use this for validation
 * For optional GPS fields, check for null before calling this function
 */
export function validateGPSCoordinates(lat, lon) {
  if (lat === null || lon === null || lat === undefined || lon === undefined) {
    return false;
  }

  const latNum = Number(lat);
  const lonNum = Number(lon);

  if (isNaN(latNum) || isNaN(lonNum)) {
    return false;
  }

  if (latNum < GPS_RANGES.LAT_MIN || latNum > GPS_RANGES.LAT_MAX) {
    return false;
  }

  if (lonNum < GPS_RANGES.LON_MIN || lonNum > GPS_RANGES.LON_MAX) {
    return false;
  }

  return true;
}

/**
 * Format GPS coordinates for display with N/S/E/W indicators
 */
export function formatGPSCoordinates(lat, lon, precision = 6) {
  if (lat === null || lon === null) {
    return null;
  }
  
  const latNum = Number(lat);
  const lonNum = Number(lon);
  const latDir = latNum >= 0 ? 'N' : 'S';
  const lonDir = lonNum >= 0 ? 'E' : 'W';
  
  return {
    lat: `${Math.abs(latNum).toFixed(precision)}°${latDir}`,
    lon: `${Math.abs(lonNum).toFixed(precision)}°${lonDir}`
  };
}

/**
 * Check if activity has valid GPS coordinates
 */
export function hasValidGPS(activity) {
  return activity.gps_lat !== null && 
         activity.gps_lon !== null &&
         validateGPSCoordinates(activity.gps_lat, activity.gps_lon);
}

/**
 * Request user's current GPS location
 * Returns a promise that resolves with {lat, lon} or {lat: null, lon: null}
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported by this browser');
      resolve({ lat: null, lon: null });
      return;
    }

    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      ...options
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude
        });
      },
      (error) => {
        console.warn('GPS error:', error.message);
        resolve({ lat: null, lon: null });
      },
      defaultOptions
    );
  });
}

/**
 * Calculate distance between two GPS coordinates in kilometers
 * Uses the Haversine formula
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}
