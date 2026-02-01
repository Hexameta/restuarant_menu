const express = require("express");
const router = express.Router();

const {
  createMenuItem,
  getMenuItems,
  getItemsByCategory,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItem,
  updateMenuItemStatus,
  getInactiveMenuItems,
} = require("../controller/menuItemController");

router.post("/", createMenuItem);
router.get("/", getMenuItems);
router.get("/inactive", getInactiveMenuItems);
router.get("/by-category/:category_id", getItemsByCategory);
router.get("/single/:id", getMenuItemById);
router.put("/:id", updateMenuItem);
router.delete("/:id", deleteMenuItem);
router.get("/search/:branch_id?", searchMenuItem);  
router.put("/status/:id", updateMenuItemStatus);

module.exports = router;

