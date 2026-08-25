const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('MONGODB_URI not set. Skipping MongoDB connection for now.');
    return;
  }

  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected successfully.');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
