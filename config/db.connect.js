const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

const isProduction = process.env.NODE_ENV === "production";

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  if (connectionPromise) {
    await connectionPromise;
    return;
  }

  connectionPromise = mongoose.connect(process.env.DATABASE_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    // Production optimizations
    autoIndex: !isProduction, // Don't rebuild indexes on Lambda cold starts
    maxPoolSize: 10,          // Allow more concurrent queries
    minPoolSize: 2,           // Keep warm connections
  }).then((db) => {
    isConnected = db.connections[0].readyState === 1;
    return db;
  }).catch((error) => {
    isConnected = false;
    connectionPromise = null;
    console.error("MongoDB connection error:", error);
    throw error;
  });

  await connectionPromise;
};

module.exports = connectDB;

