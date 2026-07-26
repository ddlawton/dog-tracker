/**
 * Global Jest Teardown
 * Runs once after all tests
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

  try {
    await pool.query('DROP TABLE IF EXISTS activities');
    console.log('Test database cleaned up');
  } finally {
    await pool.end();
  }
};
