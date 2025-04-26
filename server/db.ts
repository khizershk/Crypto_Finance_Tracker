import mongoose from 'mongoose';
import pg from 'pg';
const { Pool } = pg;
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';

// Connect to MongoDB and export the connection (legacy)
export const connectToDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      console.warn('MONGODB_URI environment variable is not defined, skipping MongoDB connection');
      return false; // Return false to indicate connection was not established
    }
    
    // Fix for TypeScript string vs undefined issue
    const mongoUri: string = process.env.MONGODB_URI;
    
    // Set a reasonable timeout to avoid hanging
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // 5 seconds
      connectTimeoutMS: 10000, // 10 seconds
    });
    
    console.log('Connected to MongoDB successfully');
    return true; // Return true to indicate successful connection
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    return false; // Return false to indicate connection failed
  }
};

export const mongoDb = mongoose.connection;

// Set up MongoDB connection event handlers
mongoDb.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoDb.once('open', () => {
  console.log('MongoDB connection established successfully');
});

// PostgreSQL connection with Drizzle
export const connectToPgDatabase = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL environment variable is not defined, skipping PostgreSQL connection');
      return false;
    }
    
    console.log('Connecting to PostgreSQL...');
    // Pool will be created and connections validated
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    
    // Test if the connection works
    await pool.query('SELECT NOW()');
    
    console.log('Connected to PostgreSQL successfully');
    return true;
  } catch (error) {
    console.error('Failed to connect to PostgreSQL:', error);
    return false;
  }
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