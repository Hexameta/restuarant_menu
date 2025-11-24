const { DBConn } = require("../config/postgresSequelize");
const { Ads } = require("../model/adsModal");
const { Category } = require("../model/categoryModel");
const { MenuItem } = require("../model/menuItemModel");
const { OTPValidate } = require("../model/otpValidateModel");
const { Restaurant, Branch, Settings } = require("../model/resturantModel");
const { SpecialTag, SpecialTagItem } = require("../model/specialTagModel");
const { User } = require("../model/userModel");

const syncDatabase = async () => {
  try {
    // Sync all models that are not already in the database
    // alter: true checks what is the current state of the table in the database
    // (which columns it has, what are their data types, etc), and then performs the
    // necessary changes in the table to make it match the model.
    await DBConn.sync({ force: true });
    console.log("✅ Database synchronized successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    process.exit(1);
  }
};

syncDatabase();

module.exports = syncDatabase;
