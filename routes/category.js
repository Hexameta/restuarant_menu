const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  searchCategory,
  reOrderCategory
} = require("../controller/categoryController");

router.post("/", createCategory);
router.get("/search?", searchCategory); 
router.get("/", getCategories);
router.get("/single/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);


router.post("/reorder", reOrderCategory);

module.exports = router;
