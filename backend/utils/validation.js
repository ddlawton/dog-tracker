const Joi = require('joi');

// Activity constants (previously in shared/constants.js)
const ACTIVITY_TYPES = ['potty', 'vomit', 'eating', 'groom', 'surgery'];
const POTTY_SUBTYPES = ['pee', 'poo', 'both'];
const GPS_RANGES = {
  LAT_MIN: -90,
  LAT_MAX: 90,
  LON_MIN: -180,
  LON_MAX: 180
};

// Get list of valid IANA timezones
const getValidTimezones = () => {
  try {
    // Use Intl API to get all supported timezone names
    if (Intl.supportedValuesOf) {
      return Intl.supportedValuesOf('timeZone');
    }
    // Fallback for older Node versions - common timezones
    return [
      'America/New_York', 'America/Chicago', 'America/Denver', 'America/Los_Angeles',
      'America/Phoenix', 'America/Anchorage', 'Pacific/Honolulu',
      'Europe/London', 'Europe/Paris', 'Europe/Berlin',
      'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Dubai',
      'Australia/Sydney', 'UTC'
    ];
  } catch (error) {
    console.error('Error getting timezones:', error);
    return ['America/New_York', 'UTC'];
  }
};

// Activity creation validation schema
const activitySchema = Joi.object({
  type: Joi.string().valid(...ACTIVITY_TYPES).required()
    .messages({
      'any.only': `type must be one of: ${ACTIVITY_TYPES.join(', ')}`,
      'any.required': 'type is required'
    }),
  
  subtype: Joi.string().valid(...POTTY_SUBTYPES).allow(null)
    .when('type', {
      is: 'potty',
      then: Joi.required(),
      otherwise: Joi.optional()
    })
    .messages({
      'any.only': `subtype must be one of: ${POTTY_SUBTYPES.join(', ')}`,
      'any.required': 'subtype is required for potty activities'
    }),
  
  timestamp: Joi.date().iso().required()
    .messages({
      'date.format': 'timestamp must be a valid ISO 8601 date',
      'any.required': 'timestamp is required'
    }),
  
  notes: Joi.string().max(5000).allow(null, '')
    .messages({
      'string.max': 'notes cannot exceed 5000 characters'
    }),
  
  gps_lat: Joi.number()
    .min(GPS_RANGES.LAT_MIN)
    .max(GPS_RANGES.LAT_MAX)
    .allow(null)
    .messages({
      'number.min': `latitude must be between ${GPS_RANGES.LAT_MIN} and ${GPS_RANGES.LAT_MAX}`,
      'number.max': `latitude must be between ${GPS_RANGES.LAT_MIN} and ${GPS_RANGES.LAT_MAX}`
    }),
  
  gps_lon: Joi.number()
    .min(GPS_RANGES.LON_MIN)
    .max(GPS_RANGES.LON_MAX)
    .allow(null)
    .messages({
      'number.min': `longitude must be between ${GPS_RANGES.LON_MIN} and ${GPS_RANGES.LON_MAX}`,
      'number.max': `longitude must be between ${GPS_RANGES.LON_MIN} and ${GPS_RANGES.LON_MAX}`
    })
});

// Settings update validation schema
const settingsSchema = Joi.object({
  timezone: Joi.string()
    .valid(...getValidTimezones())
    .required()
    .messages({
      'any.only': 'timezone must be a valid IANA timezone name',
      'any.required': 'timezone is required'
    })
});

// Query parameter validation schemas
const dateQuerySchema = Joi.object({
  date: Joi.date().iso().required()
    .messages({
      'date.format': 'date must be in YYYY-MM-DD format',
      'any.required': 'date parameter is required'
    })
});

const idParamSchema = Joi.object({
  id: Joi.number().integer().positive().required()
    .messages({
      'number.base': 'id must be a number',
      'number.integer': 'id must be an integer',
      'number.positive': 'id must be positive',
      'any.required': 'id is required'
    })
});

module.exports = {
  activitySchema,
  settingsSchema,
  dateQuerySchema,
  idParamSchema,
  getValidTimezones
};
