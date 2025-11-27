const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");
const { Branch } = require("./resturantModel.js");

const User = DBConn.define(
  "users",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    branch_id: DataTypes.INTEGER,
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    Password: DataTypes.STRING,
  },
  {}
);

User.belongsTo(Branch, { foreignKey: "branch_id" });
Branch.hasMany(User, { foreignKey: "branch_id" });

module.exports = { User };
