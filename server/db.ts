import mongoose from 'mongoose';

// Connect to MongoDB and export the connection
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

export const db = mongoose.connection;

// Set up connection event handlers
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('MongoDB connection established successfully');
});