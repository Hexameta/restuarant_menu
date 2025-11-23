const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  searchCategory,
} = require("../controller/categoryController");

router.post("/", createCategory);
router.get("/search/:branch_id?", searchCategory); 
router.get("/:branch_id", getCategories);
router.get("/single/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);

module.exports = router;
