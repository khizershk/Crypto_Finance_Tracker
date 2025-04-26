import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import * as schema from '@shared/schema';

// Initialize the database and push the schema
export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL environment variable is not defined');
    return false;
  }
  
  try {
    console.log('Initializing PostgreSQL database...');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    
    // Test connection
    const client = await pool.connect();
    try {
      await client.query('SELECT 1');
      console.log('PostgreSQL connection successful');
      
      // Push schema to database
      const db = drizzle(pool, { schema });
      
      // Create tables if they don't exist
      await db.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS budgets (
          id SERIAL PRIMARY KEY,
          userId INTEGER NOT NULL REFERENCES users(id),
          amount TEXT NOT NULL,
          periodStart TEXT NOT NULL,
          periodEnd TEXT NOT NULL,
          currency TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS transactions (
          id SERIAL PRIMARY KEY,
          userId INTEGER NOT NULL REFERENCES users(id),
          hash TEXT NOT NULL UNIQUE,
          "from" TEXT NOT NULL,
          "to" TEXT NOT NULL,
          amount TEXT NOT NULL,
          "timestamp" TEXT NOT NULL,
          currency TEXT NOT NULL,
          category TEXT,
          status TEXT NOT NULL,
          type TEXT NOT NULL
        );
        
        CREATE TABLE IF NOT EXISTS notifications (
          id SERIAL PRIMARY KEY,
          userId INTEGER NOT NULL REFERENCES users(id),
          message TEXT NOT NULL,
          read BOOLEAN NOT NULL DEFAULT FALSE,
          "timestamp" TEXT NOT NULL
        );
      `);
      
      console.log('Database schema initialized successfully');
      
      // Create default user if it doesn't exist
      const { rows } = await client.query(
        'SELECT * FROM users WHERE username = $1',
        ['user1']
      );
      
      if (rows.length === 0) {
        await client.query(
          'INSERT INTO users (username, password) VALUES ($1, $2)',
          ['user1', 'password123']
        );
        console.log('Default user created successfully');
      }
      
      return true;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
    return false;
  }
}