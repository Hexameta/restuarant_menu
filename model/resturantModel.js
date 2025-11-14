const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/mysqlSequelize.js");

const Restaurant = DBConn.define(
  "Restaurant",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    restaurantName: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ["active", "pending", "deactive"],
      defaultValue: "active",
    },
  },
  {}
);

const Branch = DBConn.define(
  "Branch",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    restaurantId: {
      type: DataTypes.INTEGER,
    },
    branchName: DataTypes.STRING,
    address: DataTypes.STRING,
    city: DataTypes.STRING,
    country: DataTypes.STRING,
    email: DataTypes.STRING,
    phone: DataTypes.STRING,
    status: {
      type: DataTypes.ENUM,
      values: ["active", "pending", "deactive"],
      defaultValue: "active",
    },
  },
  {}
);

const Settings = DBConn.define(
  "Settings",
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    branchId: {
      type: DataTypes.STRING,
    },
    logo: DataTypes.STRING,
    currency: DataTypes.STRING,
    currencySymbol: DataTypes.STRING,
    pdfMenu: DataTypes.STRING,
    currencyPlacement: {
      type: DataTypes.ENUM,
      values: ["left", "right"],
    }
  },
  {}
);

Branch.belongsTo(Restaurant, { foreignKey: "restaurantId" });
Settings.belongsTo(Branch,{foreignKey:"branchId"});

(async () => {
  try {
    await DBConn.sync({ force: true }); // This will create tables if they don't exist
    console.log("All tables synced successfully!");
  } catch (err) {
    console.error("Error syncing tables:", err);
  }
})();

module.exports = { Restaurant,Branch,Settings };
