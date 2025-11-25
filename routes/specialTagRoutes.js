const express = require("express");
const router = express.Router();

const {
  createSpecialTag,
  getSpecialTags,
  updateSpecialTag,
  deleteSpecialTag,
  getSpecialTagItems,
  assignSpecialItems,
  removeSpecialItem,
} = require("../controller/specialTagController");

// =============================
// SPECIAL TAG ROUTES
// =============================

// Create new tag
router.post("/", createSpecialTag);

// Get tags for branch
router.get("/:branch_id", getSpecialTags);

// Update tag
router.put("/:id", updateSpecialTag);

// Delete tag
router.delete("/:id", deleteSpecialTag);


// =============================
// SPECIAL TAG ITEMS ROUTES
// =============================

// Get assigned menu items for tag
router.get("/items/:tag_id", getSpecialTagItems);

// Assign multiple items to tag
router.post("/items/assign", assignSpecialItems);

// Remove item from tag
router.post("/items/remove", removeSpecialItem);


module.exports = router;
