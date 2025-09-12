/**
 * Database configuration for RDS PostgreSQL
 */
import { Pool, QueryResult } from 'pg';

const DATABASE_USER = process.env.DB_USER as string;
const DATABASE_PASSWORD = process.env.DB_PASSWORD as string;
const DATABASE_HOST = process.env.DB_HOST as string;
const DATABASE_NAME = process.env.DB_NAME as string;
const DATABASE_PORT = parseInt(process.env.DB_PORT as string);

const pool = new Pool({
  user: DATABASE_USER,
  host: DATABASE_HOST,
  database: DATABASE_NAME,
  password: DATABASE_PASSWORD,
  port: DATABASE_PORT,
  ssl: { rejectUnauthorized: false },
});

/**
 * Execute a SQL query on the database
 * @param {string} text - SQL query text
 * @param {Array<any>} params - Query parameters
 * @returns {Promise<QueryResult>} - Query result
 */
const query = async (text: string, params?: any[]): Promise<QueryResult> => {
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

export {
  query,
  pool,
};
