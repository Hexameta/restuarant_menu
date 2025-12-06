const { DataTypes } = require("sequelize");
const { DBConn } = require("../config/postgresSequelize.js");
const { Branch } = require("./resturantModel.js");

const MenuAccessLog = DBConn.define("menu_access_logs", {
  id: { 
    type: DataTypes.INTEGER, 
    autoIncrement: true, 
    primaryKey: true 
  },
  branch_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'branches',
      key: 'id'
    }
  },
  accessed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false
  }
});

// 🔗 Association
MenuAccessLog.belongsTo(Branch, { foreignKey: "branch_id", as: "branch" });

module.exports = { MenuAccessLog };
