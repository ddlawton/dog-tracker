const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Initialize database
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS activities (
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
    console.log('Database initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// API Routes

// POST /api/activities - Log new activity
app.post('/api/activities', async (req, res) => {
  const { type, subtype, timestamp, notes, gps_lat, gps_lon } = req.body;

  if (!type || !timestamp) {
    return res.status(400).json({ error: 'type and timestamp are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO activities (type, subtype, timestamp, notes, gps_lat, gps_lon)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at`,
      [type, subtype ?? null, timestamp, notes ?? null, gps_lat ?? null, gps_lon ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error inserting activity:', error);
    res.status(500).json({ error: 'Failed to log activity' });
  }
});

// GET /api/activities - Fetch activities by date
app.get('/api/activities', async (req, res) => {
  const { date } = req.query;

  try {
    let query = `SELECT id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at FROM activities ORDER BY timestamp DESC`;
    let params = [];

    if (date) {
      query = `SELECT id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at FROM activities 
               WHERE DATE(timestamp) = $1 
               ORDER BY timestamp DESC`;
      params = [date];
    }

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Failed to fetch activities' });
  }
});

// GET /api/activities/stats - Activity statistics
app.get('/api/activities/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT type, COUNT(*)::INTEGER as count
      FROM activities
      WHERE DATE(timestamp) = CURRENT_DATE
      GROUP BY type
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// DELETE /api/activities/:id - Delete activity
app.delete('/api/activities/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      `DELETE FROM activities WHERE id = $1 RETURNING id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Activity not found' });
    }

    res.json({ message: 'Activity deleted', activity: result.rows[0] });
  } catch (error) {
    console.error('Error deleting activity:', error);
    res.status(500).json({ error: 'Failed to delete activity' });
  }
});

// GET /api/export - Export all activities as JSON
app.get('/api/export', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, type, subtype, timestamp, notes, gps_lat::FLOAT, gps_lon::FLOAT, created_at FROM activities ORDER BY timestamp DESC`);
    res.json({
      exported_at: new Date().toISOString(),
      count: result.rows.length,
      activities: result.rows
    });
  } catch (error) {
    console.error('Error exporting activities:', error);
    res.status(500).json({ error: 'Failed to export activities' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Serve frontend from root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend/index.html'));
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    initDB();
  });
}

module.exports = app;
