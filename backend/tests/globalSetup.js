/**
 * Global Jest Setup
 * Runs once before all tests
 */

const { Pool } = require('pg');
require('dotenv').config();

module.exports = async () => {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'josie_tracker_test',
    user: process.env.DB_USER || 'test',
    password: process.env.DB_PASSWORD || 'test',
  });

  // Wait for database to be ready
  let retries = 10;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      break;
    } catch (e) {
      retries--;
      if (retries === 0) throw e;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Drop and recreate tables (clean slate for tests)
  await pool.query(`
    DROP TABLE IF EXISTS activities;
    DROP TABLE IF EXISTS user_settings;
  `);

  // Create user_settings table
  await pool.query(`
    CREATE TABLE user_settings (
      id SERIAL PRIMARY KEY,
      timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create activities table with all required fields
  await pool.query(`
    CREATE TABLE activities (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      subtype VARCHAR(50),
      timestamp TIMESTAMP NOT NULL,
      timestamp_local_date DATE,
      user_timezone VARCHAR(100),
      notes TEXT,
      gps_lat DECIMAL(10, 8),
      gps_lon DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_activities_local_date ON activities(timestamp_local_date);
    CREATE INDEX IF NOT EXISTS idx_activities_type_date ON activities(type, timestamp_local_date);
  `);

  // Insert default user settings
  await pool.query(`
    INSERT INTO user_settings (timezone) VALUES ('America/New_York');
  `);

  console.log('Test database initialized');
  
  await pool.end();
};
