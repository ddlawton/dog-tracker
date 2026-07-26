/**
 * Frontend Test Fixtures
 * Reusable test data and helper functions
 */

const activityFixtures = {
  sampleActivities: [
    {
      id: 1,
      type: 'potty',
      subtype: 'pee',
      timestamp: '2026-07-26T10:00:00Z',
      notes: 'Morning potty',
      gps_lat: 40.7128,
      gps_lon: -74.0060,
      created_at: '2026-07-26T10:00:00Z'
    },
    {
      id: 2,
      type: 'eating',
      timestamp: '2026-07-26T12:00:00Z',
      notes: 'Lunch time',
      gps_lat: 40.7150,
      gps_lon: -74.0080,
      created_at: '2026-07-26T12:00:00Z'
    },
    {
      id: 3,
      type: 'vomit',
      timestamp: '2026-07-25T14:00:00Z',
      notes: 'After eating too fast',
      gps_lat: null,
      gps_lon: null,
      created_at: '2026-07-25T14:00:00Z'
    },
    {
      id: 4,
      type: 'groom',
      timestamp: '2026-07-24T10:00:00Z',
      notes: 'Bath day',
      gps_lat: 40.7100,
      gps_lon: -74.0060,
      created_at: '2026-07-24T10:00:00Z'
    },
    {
      id: 5,
      type: 'surgery',
      timestamp: '2026-07-23T09:00:00Z',
      notes: 'Post-surgery monitoring day 1',
      gps_lat: null,
      gps_lon: null,
      created_at: '2026-07-23T09:00:00Z'
    }
  ],

  typeEmoji: {
    potty: '🚽',
    vomit: '🤢',
    eating: '🍽️',
    groom: '✨',
    surgery: '⚕️'
  },

  allActivityTypes: ['potty', 'vomit', 'eating', 'groom', 'surgery'],

  gpsCoordinates: {
    valid: [
      { lat: 40.7128, lon: -74.0060 },
      { lat: '51.5074', lon: '-0.1278' },
      { lat: 0, lon: 0 },
      { lat: -33.8688, lon: 151.2093 },
      { lat: 90, lon: 180 },
      { lat: -90, lon: -180 }
    ],
    invalid: [
      { lat: 91, lon: 0 },
      { lat: -91, lon: 0 },
      { lat: 0, lon: 181 },
      { lat: 0, lon: -181 },
      { lat: null, lon: null },
      { lat: 'invalid', lon: 'coords' }
    ]
  },

  weekData: {
    '2026-07-20': [
      { type: 'potty' },
      { type: 'eating' }
    ],
    '2026-07-21': [
      { type: 'potty' },
      { type: 'potty' },
      { type: 'eating' }
    ],
    '2026-07-22': [
      { type: 'potty' },
      { type: 'potty' },
      { type: 'potty' }
    ],
    '2026-07-23': [],
    '2026-07-24': [
      { type: 'vomit' }
    ],
    '2026-07-25': [
      { type: 'eating' },
      { type: 'potty' }
    ],
    '2026-07-26': [
      { type: 'potty' },
      { type: 'potty' },
      { type: 'eating' },
      { type: 'potty' },
      { type: 'potty' },
      { type: 'potty' }
    ]
  },

  htmlInjectionTests: [
    '<script>alert("xss")</script>',
    '"><script>alert("xss")</script>',
    '<img src=x onerror="alert(\'xss\')">',
    'javascript:alert("xss")',
    '<iframe src="javascript:alert(\'xss\')"></iframe>'
  ]
};

module.exports = activityFixtures;
