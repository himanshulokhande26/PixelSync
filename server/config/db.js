const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`⚠️ MongoDB Error: ${error.message}`);
    console.warn('Backend is running in Dev Offline Mode (WebSockets still work). Try checking your DNS or Atlas permissions.');
  }
};

module.exports = connectDB;
