/**
 * Backend Test Fixtures
 * Reusable test data for consistent testing
 */

const now = new Date();

const activityFixtures = {
  validPottyActivity: {
    type: 'potty',
    subtype: 'pee',
    timestamp: now.toISOString(),
    notes: 'Regular break',
    gps_lat: 40.7128,
    gps_lon: -74.0060
  },

  validVomitActivity: {
    type: 'vomit',
    timestamp: new Date(now.getTime() - 3600000).toISOString(),
    notes: 'After eating too fast',
    gps_lat: 51.5074,
    gps_lon: -0.1278
  },

  validEatingActivity: {
    type: 'eating',
    timestamp: new Date(now.getTime() - 7200000).toISOString(),
    notes: 'Dinner time',
    gps_lat: 48.8566,
    gps_lon: 2.3522
  },

  validGroomActivity: {
    type: 'groom',
    timestamp: new Date(now.getTime() - 86400000).toISOString(),
    notes: 'Bath day',
    gps_lat: 35.6762,
    gps_lon: 139.6503
  },

  validSurgeryActivity: {
    type: 'surgery',
    timestamp: new Date(now.getTime() - 172800000).toISOString(),
    notes: 'Post-surgery monitoring'
  },

  minimalActivity: {
    type: 'eating',
    timestamp: now.toISOString()
  },

  noGpsActivity: {
    type: 'potty',
    subtype: 'poo',
    timestamp: now.toISOString(),
    notes: 'No GPS captured'
  },

  invalidActivities: {
    noType: {
      timestamp: now.toISOString()
    },
    noTimestamp: {
      type: 'potty',
      subtype: 'pee' // Include subtype for valid structure (will still fail on missing timestamp)
    },
    invalidType: {
      type: 'unknown',
      timestamp: now.toISOString()
    }
  },

  gpsVariations: {
    newYork: { lat: 40.7128, lon: -74.0060 },
    london: { lat: 51.5074, lon: -0.1278 },
    paris: { lat: 48.8566, lon: 2.3522 },
    tokyo: { lat: 35.6762, lon: 139.6503 },
    sydney: { lat: -33.8688, lon: 151.2093 },
    equator: { lat: 0, lon: 0 }
  },

  invalidGPS: {
    latTooHigh: { lat: 91, lon: 0 },
    latTooLow: { lat: -91, lon: 0 },
    lonTooHigh: { lat: 0, lon: 181 },
    lonTooLow: { lat: 0, lon: -181 },
    stringCoords: { lat: '40.7128', lon: '-74.0060' }
  },

  allActivityTypes: [
    'potty',
    'vomit',
    'eating',
    'groom',
    'surgery'
  ],

  pottySubtypes: [
    'pee',
    'poo',
    'both'
  ]
};

module.exports = activityFixtures;
