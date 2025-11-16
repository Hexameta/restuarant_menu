const { DataTypes } = require("sequelize");
const { DBConn, DBSync } = require("../config/mysqlSequelize.js");

const Ads = DBConn.define(
  "ads",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    branch_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    ad_type: {
      type: DataTypes.ENUM,
      values: ["carousel", "banner"],
    },
    valid_from: DataTypes.DATE,
    valid_to: DataTypes.DATE,
    imageUrl: DataTypes.STRING,
    isAdmin: DataTypes.BOOLEAN
  },
  {}
);

DBSync();

module.exports = { Ads };
