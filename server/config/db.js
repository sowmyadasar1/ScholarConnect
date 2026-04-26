/**
 * SQLite Connection Pool Wrapper
 *
 * Mimics the mysql2/promise interface so we don't have to rewrite models.
 * Uses sqlite and sqlite3 to persist data locally without needing a MySQL server.
 */

const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '..', '..', 'database', 'scholarconnect.db'),
      driver: sqlite3.Database
    });
    
    // Ensure foreign keys are enforced
    const db = await dbPromise;
    await db.exec('PRAGMA foreign_keys = ON;');
  }
  return dbPromise;
}

const pool = {
  async query(sql, params = []) {
    const db = await getDb();
    // Replace MySQL specific syntax if any, mostly ? works natively in SQLite.
    // If it's a SELECT, return rows. If INSERT/UPDATE, return result object mimicking MySQL.
    
    // Basic heuristic:
    if (sql.trim().toUpperCase().startsWith('SELECT')) {
      const rows = await db.all(sql, params);
      return [rows, []];
    } else {
      const result = await db.run(sql, params);
      return [{ insertId: result.lastID, affectedRows: result.changes }, []];
    }
  },
  
  async getConnection() {
    await getDb();
    return { release: () => {} };
  }
};

/**
 * Quick connectivity check on startup.
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ SQLite database connected successfully');
    conn.release();
  } catch (err) {
    console.error('❌ SQLite connection failed:', err.message);
    throw err;
  }
}

module.exports = { pool, testConnection, getDb };
