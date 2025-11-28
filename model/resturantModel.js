const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");

const Restaurant = DBConn.define("restaurants", {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  name: DataTypes.STRING,
  email: DataTypes.STRING,
  phone: DataTypes.STRING,
  logo: DataTypes.STRING,
  type: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM,
    values: ["active", "inactive"],
    defaultValue: "inactive",
  }
});

const Branch = DBConn.define("branches", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  restaurant_id: DataTypes.INTEGER,
  name: DataTypes.STRING,
  description: DataTypes.TEXT,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  place: DataTypes.STRING,
  city: DataTypes.STRING,
  district: DataTypes.STRING,
  state: DataTypes.STRING,
  country: DataTypes.STRING,
  slug: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM,
    values: ["active", "pending", "inactive", "block"],
    defaultValue: "pending",
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  }
});

const Settings = DBConn.define("settings", {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  branch_id: DataTypes.INTEGER,
  logo: DataTypes.STRING,
  currency: DataTypes.STRING,
  symbol: DataTypes.STRING,
  pdf_menu_url: DataTypes.STRING,
  symbol_position: {
    type: DataTypes.ENUM,
    values: ["left", "right"],
  },
  facebook_url: DataTypes.STRING,
  instagram_url: DataTypes.STRING,
  google_feedback_url: DataTypes.STRING,
});

// 🔗 Associations
Restaurant.hasMany(Branch, { foreignKey: "restaurant_id", as: "branches" });
Branch.belongsTo(Restaurant, { foreignKey: "restaurant_id", as: "restaurant" });

Branch.hasOne(Settings, { foreignKey: "branch_id", as: "settings" });
Settings.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });



module.exports = { Restaurant, Branch, Settings };

