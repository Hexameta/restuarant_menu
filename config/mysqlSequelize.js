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

module.exports ={DBConn}
