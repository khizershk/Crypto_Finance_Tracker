import mongoose from 'mongoose';

// Connect to MongoDB and export the connection
export const connectToDatabase = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connection established successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    return false;
  }
};

export const mongoDb = mongoose.connection;

// Set up MongoDB connection event handlers
mongoDb.on('error', console.error.bind(console, 'MongoDB connection error:'));
mongoDb.once('open', () => {
  console.log('MongoDB connection established successfully');
});