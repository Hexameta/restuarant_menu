const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");
const { Category } = require("./categoryModal.js");

const MenuItem = DBConn.define(
  "menu_item",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    category_id: DataTypes.INTEGER,
    name: DataTypes.STRING,
    description: DataTypes.TEXT,
    image_url: DataTypes.STRING,
    price: DataTypes.DECIMAL,
    offer_price: DataTypes.DECIMAL,
    is_available: DataTypes.BOOLEAN,
    special_note: DataTypes.TEXT, //give place holder .
    tag: {
      type: DataTypes.ENUM,
      values: ["veg,non veg", "cool", "hot"],
    },
  },
  {}
);

MenuItem.belongsTo(Category, { foreignKey: "category_id" });

module.exports = { MenuItem };
