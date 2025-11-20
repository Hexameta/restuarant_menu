const { Sequelize } = require("sequelize");
require("dotenv").config();

const DBConn = new Sequelize(
  process.env.DB_NAME || "restaurant_digital_menu",
  process.env.DB_USER || "postgres",
  process.env.DB_PASSWORD || "",
  {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5432,
    dialect: "postgres", // Changed from mysql
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  }
);

const postgresTest = async () => {
  try {
    await DBConn.authenticate();
    console.log("✅ PostgreSQL Database connection established successfully.");
    console.log(
      `📊 Connected to: ${process.env.DB_NAME || "restaurant_digital_menu"}`
    );
    return true;
  } catch (error) {
    console.error("❌ Unable to connect to PostgreSQL database:");
    console.error("Error:", error.message);
    return false;
  }
};

postgresTest();

module.exports = { DBConn };
