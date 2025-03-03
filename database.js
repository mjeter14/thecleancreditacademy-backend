const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER,          // Database username
  host: process.env.DB_HOST,          // Database host (Render provides this)
  database: process.env.DB_NAME,      // Database name
  password: process.env.DB_PASSWORD,  // Database password
  port: process.env.DB_PORT || 5432,  // Default PostgreSQL port
  ssl: { rejectUnauthorized: false }  // Required for Render database connections
});

// Test the database connection
pool.connect()
  .then(() => console.log("✅ Connected to PostgreSQL database!"))
  .catch(err => console.error("🚨 Database connection error:", err));

module.exports = pool;
