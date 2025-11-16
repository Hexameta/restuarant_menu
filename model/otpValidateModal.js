const { DataTypes } =  require("sequelize");
const { DBConn, DBSync } = require("../config/mysqlSequelize.js");

const OTPValidate = DBConn.define(
  "otp_validate",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    otp: DataTypes.INTEGER,
    email: DataTypes.STRING,
    is_validate: DataTypes.BOOLEAN,
    expiration_time : DataTypes.DATE
  },
  {}
);

DBSync()

module.exports = { OTPValidate }