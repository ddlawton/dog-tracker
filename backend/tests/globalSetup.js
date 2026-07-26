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

  // Create table
  await pool.query(`
    DROP TABLE IF EXISTS activities;
    CREATE TABLE activities (
      id SERIAL PRIMARY KEY,
      type VARCHAR(50) NOT NULL,
      subtype VARCHAR(50),
      timestamp TIMESTAMP NOT NULL,
      notes TEXT,
      gps_lat DECIMAL(10, 8),
      gps_lon DECIMAL(11, 8),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Test database initialized');
  
  await pool.end();
};
