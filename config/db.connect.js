const mongoose = require("mongoose");

let isConnected = false;
let connectionPromise = null;

const connectDB = async () => {
  if (isConnected) {
    console.log("Using existing MongoDB connection");
    return;
  }

  if (connectionPromise) {
    console.log("Waiting for existing connection attempt...");
    await connectionPromise;
    return;
  }

  console.log("Connecting to MongoDB...");
  connectionPromise = mongoose.connect(process.env.DATABASE_URI, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  }).then((db) => {
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB connected successfully");
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
