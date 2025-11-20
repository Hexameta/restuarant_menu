const { DBConn } = require("../config/postgresSequelize");
const { Ads } = require("../model/adsModal");
const { Category } = require("../model/categoryModal");
const { MenuItem } = require("../model/menuItemModal");
const { OTPValidate } = require("../model/otpValidateModal");
const { Restaurant, Branch, Settings } = require("../model/resturantModel");
const { SpecialTag, SpecialTagItem } = require("../model/specialTagModal");
const { User } = require("../model/userModel");

const syncDatabase = async () => {
  try {
    // Sync all models that are not already in the database
    // alter: true checks what is the current state of the table in the database
    // (which columns it has, what are their data types, etc), and then performs the
    // necessary changes in the table to make it match the model.
    await DBConn.sync({ alter: true });
    console.log("✅ Database synchronized successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    process.exit(1);
  }
};

syncDatabase();
