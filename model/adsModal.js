const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize");

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
    is_expired: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    valid_from: DataTypes.DATE,
    valid_to: DataTypes.DATE,
    image_url: DataTypes.STRING,
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    }
  },
  {}
);

module.exports = { Ads };
