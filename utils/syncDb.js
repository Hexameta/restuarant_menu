const { DBConn } = require("../config/postgresSequelize");

const syncDatabase = async () => {
  try {
    // Sync all models that are not already in the database
    // alter: true checks what is the current state of the table in the database
    // (which columns it has, what are their data types, etc), and then performs the
    // necessary changes in the table to make it match the model.
    // await DBConn.query("DROP TYPE IF EXISTS enum_special_tag_item_tag;")
    // await DBConn.query("DROP TYPE IF EXISTS enum_menu_item_tag;")

    await DBConn.sync({ alter: true, logging: console.log });
    console.log("✅ Database synchronized successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error synchronizing database:", error);
    process.exit(1);
  }
};

syncDatabase();

module.exports = syncDatabase;
