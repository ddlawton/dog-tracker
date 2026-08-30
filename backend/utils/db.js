const { Pool } = require('pg');
const logger = require('./logger');

// Validate required environment variables
// Note: DB_PASSWORD is optional for local development (macOS PostgreSQL often uses peer authentication)
const requiredEnvVars = ['DB_HOST', 'DB_NAME', 'DB_USER'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
}

// Database connection pool configuration
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || undefined, // Optional for local dev
  max: 20, // Maximum pool size
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 2000, // Return error if connection takes longer than 2 seconds
});

// Log pool errors
pool.on('error', (err, client) => {
  logger.error('Unexpected error on idle client', { error: err.message });
});

// Connection with retry logic
async function connectWithRetry(maxRetries = 5, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const client = await pool.connect();
      logger.info('Database connection established');
      client.release();
      return true;
    } catch (error) {
      logger.warn(`Database connection attempt ${attempt}/${maxRetries} failed`, {
        error: error.message
      });
      
      if (attempt === maxRetries) {
        logger.error('Failed to connect to database after maximum retries');
        throw error;
      }
      
      // Exponential backoff
      const delay = delayMs * Math.pow(2, attempt - 1);
      logger.info(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Test database connection
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    return { healthy: true, timestamp: result.rows[0].now };
  } catch (error) {
    logger.error('Database health check failed', { error: error.message });
    return { healthy: false, error: error.message };
  }
}

// Helper function to get user timezone
async function getUserTimezone() {
  try {
    const result = await pool.query('SELECT timezone FROM user_settings LIMIT 1');
    return result.rows[0]?.timezone || 'America/New_York';
  } catch (error) {
    logger.error('Error fetching timezone', { error: error.message });
    throw error; // Don't silently fail - let caller handle
  }
}

module.exports = {
  pool,
  connectWithRetry,
  testConnection,
  getUserTimezone
};
