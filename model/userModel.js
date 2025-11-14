const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/mysqlSequelize.js");
const { Branch } = require("./resturantModel.js");

const User = DBConn.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    branchId: DataTypes.STRING,
    email: DataTypes.STRING,
    Password: DataTypes.STRING,
  },
  {}
);



User.belongsTo(Branch, { foreignKey: "branchId" });

(async () => {
  try {
    await DBConn.sync({ force: true }); // This will create tables if they don't exist
    console.log("All tables synced successfully!");
  } catch (err) {
    console.error("Error syncing tables:", err);
  }
})();

module.exports = { User };
