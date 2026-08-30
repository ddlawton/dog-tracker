const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
require('dotenv').config();

const logger = require('./utils/logger');
const { pool, connectWithRetry, testConnection, getUserTimezone } = require('./utils/db');
const { errorHandler, asyncHandler, notFoundHandler } = require('./middleware/errorHandler');
const requestLogger = require('./middleware/requestLogger');
const { 
  activitySchema, 
  settingsSchema, 
  dateQuerySchema, 
  idParamSchema 
} = require('./utils/validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(compression()); // Compress responses
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Remove body-parser, use built-in
app.use(limiter);
app.use(requestLogger);
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Initialize database
async function initDB() {
  try {
    logger.info('Initializing database...');
    
    // Create user_settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_settings (
        id SERIAL PRIMARY KEY,
        timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create activities table with timezone fields
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        subtype VARCHAR(50),
        timestamp TIMESTAMPTZ NOT NULL,
        timestamp_local_date DATE,
        user_timezone VARCHAR(100),
        notes TEXT,
        gps_lat DECIMAL(10, 8),
        gps_lon DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'activities'
            AND column_name = 'timestamp'
            AND data_type = 'timestamp without time zone'
        ) THEN
          ALTER TABLE activities
          ALTER COLUMN timestamp TYPE TIMESTAMPTZ
          USING timestamp AT TIME ZONE current_setting('TIMEZONE');
        END IF;
      END $$;
    `);

    // Create indexes for faster queries
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activities_local_date ON activities(timestamp_local_date);
      CREATE INDEX IF NOT EXISTS idx_activities_type_date ON activities(type, timestamp_local_date);
    `);

    // Ensure default user settings exist
    await pool.query(`
      INSERT INTO user_settings (timezone) 
      SELECT 'America/New_York' 
      WHERE NOT EXISTS (SELECT 1 FROM user_settings);
    `);

    logger.info('Database initialized successfully');
  } catch (error) {
    logger.error('Database initialization error', { error: error.message });
    throw error;
  }
}

// API Routes

// GET /api/settings - Get user settings
app.get('/api/settings', asyncHandler(async (req, res) => {
  const result = await pool.query('SELECT id, timezone, created_at, updated_at FROM user_settings LIMIT 1');
  
  if (result.rows.length === 0) {
    return res.status(404).json({ 
      error: 'Settings not found',
      requestId: req.id 
    });
  }
  
  res.json(result.rows[0]);
}));

// PUT /api/settings - Update user settings
app.put('/api/settings', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = settingsSchema.validate(req.body);
  if (error) {
    error.isJoi = true;
    throw error;
  }

  const { timezone } = value;
  
  const result = await pool.query(
    `UPDATE user_settings 
     SET timezone = $1, updated_at = CURRENT_TIMESTAMP 
     RETURNING id, timezone, created_at, updated_at`,
    [timezone]
  );
  
  logger.info('Timezone updated', { 
    timezone, 
    requestId: req.id 
  });
  
  res.json(result.rows[0]);
}));

// POST /api/activities - Log new activity
app.post('/api/activities', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = activitySchema.validate(req.body);
  if (error) {
    error.isJoi = true;
    throw error;
  }

  const { type, subtype, timestamp, notes, gps_lat, gps_lon } = value;
  
  const userTimezone = await getUserTimezone();
  
  // Compute the local date in user's timezone
  const result = await pool.query(
    `INSERT INTO activities (type, subtype, timestamp, timestamp_local_date, user_timezone, notes, gps_lat, gps_lon)
     VALUES ($1, $2, $3::TIMESTAMPTZ, (($3::TIMESTAMPTZ) AT TIME ZONE $4)::DATE, $4, $5, $6, $7)
     RETURNING id, type, subtype, timestamp, timestamp_local_date, user_timezone, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at`,
    [type, subtype, timestamp, userTimezone, notes, gps_lat, gps_lon]
  );
  
  logger.info('Activity logged', { 
    type, 
    subtype, 
    timestamp, 
    requestId: req.id 
  });
  
  res.status(201).json(result.rows[0]);
}));

// GET /api/activities - Fetch activities by date
app.get('/api/activities', asyncHandler(async (req, res) => {
  const { date } = req.query;
  
  let query = `SELECT id, type, subtype, timestamp, timestamp_local_date, user_timezone, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at FROM activities ORDER BY timestamp DESC`;
  let params = [];

  if (date) {
    // Validate date parameter
    const { error } = dateQuerySchema.validate({ date });
    if (error) {
      error.isJoi = true;
      throw error;
    }
    
    // Simple date filtering using the pre-computed local date
    query = `SELECT id, type, subtype, timestamp, timestamp_local_date, user_timezone, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at FROM activities 
             WHERE timestamp_local_date = $1::date
             ORDER BY timestamp DESC`;
    params = [date];
  }

  const result = await pool.query(query, params);
  res.json(result.rows);
}));

// GET /api/activities/stats - Activity statistics
app.get('/api/activities/stats', asyncHandler(async (req, res) => {
  const userTimezone = await getUserTimezone();
  
  // Get today's date in user's timezone
  const result = await pool.query(
    `SELECT type, COUNT(*)::INTEGER as count
     FROM activities
     WHERE timestamp_local_date = DATE(NOW() AT TIME ZONE $1)
     GROUP BY type`,
    [userTimezone]
  );
  
  res.json(result.rows);
}));

// DELETE /api/activities/:id - Delete activity
app.delete('/api/activities/:id', asyncHandler(async (req, res) => {
  // Validate ID parameter
  const { error, value } = idParamSchema.validate(req.params);
  if (error) {
    error.isJoi = true;
    throw error;
  }
  
  const { id } = value;
  
  const result = await pool.query(
    `DELETE FROM activities WHERE id = $1 RETURNING id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ 
      error: 'Activity not found',
      requestId: req.id 
    });
  }

  logger.info('Activity deleted', { 
    id, 
    type: result.rows[0].type, 
    requestId: req.id 
  });

  res.json({ message: 'Activity deleted', activity: result.rows[0] });
}));

// GET /api/export - Export all activities as JSON
app.get('/api/export', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at 
     FROM activities 
     ORDER BY timestamp DESC`
  );
  
  logger.info('Data exported', { 
    count: result.rows.length, 
    requestId: req.id 
  });
  
  res.json({
    exported_at: new Date().toISOString(),
    count: result.rows.length,
    activities: result.rows
  });
}));

// Health check with database ping
app.get('/health', asyncHandler(async (req, res) => {
  const dbHealth = await testConnection();
  
  res.json({
    status: dbHealth.healthy ? 'ok' : 'degraded',
    database: dbHealth,
    timestamp: new Date().toISOString()
  });
}));

// Serve frontend from root
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  (async () => {
    try {
      // Connect to database with retries
      await connectWithRetry();
      
      // Initialize database tables
      await initDB();
      
      // Start server
      app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
        logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      });
    } catch (error) {
      logger.error('Failed to start server', { error: error.message });
      process.exit(1);
    }
  })();
}

module.exports = app;
