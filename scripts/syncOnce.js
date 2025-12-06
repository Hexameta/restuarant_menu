// One-time script to sync database and create the menu_access_logs table
// Run this with: node scripts/syncOnce.js

const { DBConn } = require("../config/postgresSequelize");
// Import all models to ensure they are registered with Sequelize
const { Restaurant, Branch, Settings } = require("../model/resturantModel");
const { User } = require("../model/userModel");
const { Category } = require("../model/categoryModel");
const { MenuItem } = require("../model/menuItemModel");
const { SpecialTag, SpecialTagItem } = require("../model/specialTagModel");
const { Ads } = require("../model/adsModal");
const { OTPValidate } = require("../model/otpValidateModel");
const { MenuAccessLog } = require("../model/menuAccessLogModel");

const syncDatabase = async () => {
  try {
    console.log("🔄 Starting database sync...");
    
    // alter: true will only add new tables/columns without dropping existing data
    await DBConn.sync({ alter: true, logging: console.log });
    
    console.log("✅ Database synchronized successfully.");
    console.log("✅ menu_access_logs table created/updated.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    process.exit(1);
  }
};

syncDatabase();
