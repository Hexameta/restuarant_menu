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
  updateStatus,
} = require("../controller/categoryController");

router.post("/", createCategory);
router.get(["/search", "/search/:id"], searchCategory);
router.get("/", getCategories);
router.get(["/search", "/search/:id"], getCategoryById);
router.put("/:id", updateCategory);
router.delete("/:id", deleteCategory);
router.put(["/status", "/status/:id"], updateStatus);

router.post("/reorder", reOrderCategory);

module.exports = router;
