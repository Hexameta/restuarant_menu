const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");
const { Branch } = require("./resturantModel.js");
const { MenuItem } = require("./menuItemModel.js");

const SpecialTag = DBConn.define(
  "special_tags",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    branch_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    display_order: DataTypes.INTEGER,
    is_active: DataTypes.BOOLEAN,
  },
  {}
);

const SpecialTagItem = DBConn.define(
  "special_items",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    special_tag_id: DataTypes.INTEGER,
    menu_item_id: DataTypes.INTEGER,
  },
  {}
);

SpecialTag.belongsTo(Branch, { foreignKey: "branch_id" });
Branch.hasMany(SpecialTag, { foreignKey: "branch_id" });

SpecialTagItem.belongsTo(SpecialTag, { foreignKey: "special_tag_id" });
SpecialTag.hasMany(SpecialTagItem, { foreignKey: "special_tag_id",as: "special_items" });

// MenuItem.belongsTo(SpecialTagItem, { foreignKey: "menu_item_id" });
// SpecialTagItem.hasOne(MenuItem, { foreignKey: "menu_item_id" });

SpecialTagItem.belongsTo(MenuItem, {
  foreignKey: "menu_item_id",
  as: "menu_item"
});

MenuItem.hasMany(SpecialTagItem, {
  foreignKey: "menu_item_id"
});

module.exports = { SpecialTag, SpecialTagItem };
