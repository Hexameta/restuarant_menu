const { Sequelize } = require("sequelize");

const DBConn = new Sequelize("restaurant_digital_menu", "root", "", {
  host: "localhost",
  dialect: "mysql",
});

const mysqlTest = async () => {
  try {
    await DBConn.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

mysqlTest()

const DBSync = async () => {
  try {
    await DBConn.sync({ force: true }); // This will create tables if they don't exist
    console.log("All tables synced successfully!");
  } catch (err) {
    console.error("Error syncing tables:", err);
  }
};

module.exports = { DBConn, DBSync };
