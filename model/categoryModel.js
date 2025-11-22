const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");
const { Branch } = require("./resturantModel.js");

const Category = DBConn.define(
  "categories",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    branch_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    image_url: DataTypes.STRING,
    is_active: DataTypes.BOOLEAN,
    display_order: DataTypes.INTEGER,
  },
  {}
);

Category.belongsTo(Branch, { foreignKey: "branch_id" });

module.exports = { Category };
