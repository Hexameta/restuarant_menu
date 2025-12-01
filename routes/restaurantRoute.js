const express = require("express");
const router = express.Router();
const {
  searchRestaurants,
  createBranch,
  getResturantById,
} = require("../controller/restaurantController");

router.get("/search", searchRestaurants);

router.post("/create/:userId", createBranch);

router.get("/:id", getResturantById);

module.exports = router;
