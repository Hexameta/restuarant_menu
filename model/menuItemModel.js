const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");
const { Category } = require("./categoryModel.js");

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
    // price: DataTypes.DECIMAL,
    // offer_price: DataTypes.DECIMAL,
    is_available: DataTypes.BOOLEAN,
    special_note: DataTypes.TEXT, //give place holder . eg: containe pork .
    tag: {
      type: DataTypes.ENUM,
      values: ["veg", "non-veg", "cool", "hot"],
    },
  },
  {}
);

const Options = DBConn.define(
  "menu_item_options",
  {
    menu_item_id: DataTypes.INTEGER,
    option_name: DataTypes.STRING,
    option_price: DataTypes.DECIMAL,
    option_offer_price: DataTypes.DECIMAL,
  },
  {}
);

MenuItem.belongsTo(Category, { foreignKey: "category_id" });
Category.hasMany(MenuItem, { foreignKey: "category_id" });
Options.belongsTo(MenuItem, { foreignKey: "menu_item_id" });
MenuItem.hasMany(Options, { foreignKey: "menu_item_id" });

module.exports = { MenuItem, Options };
