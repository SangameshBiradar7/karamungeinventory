const mongoose = require('mongoose');

async function connectDatabase() {
  try {
    await mongoose.connect(process.env.DATABASE_URL);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

module.exports = { connectDatabase, mongoose };
