import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const dbConn = mysql.createPool({
  host: process.env.DB_HOST ? process.env.DB_HOST : "localhost",
  user: process.env.DB_USER ? process.env.DB_USER : "root",
  password: process.env.DB_PASSWORD ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME ? process.env.DB_NAME : "restarant_menu",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default dbConn;
