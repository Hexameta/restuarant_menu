const express = require("express");
const router = express.Router();
const {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  searchCategory,
  reOrderCategory,
  updateStatus
} = require("../controller/categoryController");

router.post("/", createCategory);
router.get("/search/:id?", searchCategory); 
router.get("/", getCategories);
router.get("/single/:id", getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.put("/status/:id", updateStatus);

router.post("/reorder", reOrderCategory);

module.exports = router;
