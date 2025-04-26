import mongoose from 'mongoose';
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Connect to MongoDB and export the connection (legacy)
export const connectToDatabase = async () => {
  // Skip MongoDB connection - we're using persistent storage
  console.log('Skipping MongoDB connection - using persistent file storage');
  return false; // Return false to indicate connection was not established
};

export const mongoDb = mongoose.connection;

// Set up MongoDB connection event handlers
mongoDb.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoDb.once('open', () => {
  console.log('MongoDB connection established successfully');
});

// PostgreSQL connection with Drizzle
export const connectToPgDatabase = async () => {
  // Skip PostgreSQL connection attempt - we're using persistent storage
  console.log('Skipping PostgreSQL connection - using persistent file storage');
  return false;
};

// Create the PostgreSQL pool and Drizzle DB instance
let pgPool: any = null;
if (process.env.DATABASE_URL) {
  pgPool = new Pool({ 
    connectionString: process.env.DATABASE_URL 
  });
}

// Export the drizzle db instance if pool is available
export const db = pgPool ? drizzle(pgPool, { schema }) : null;