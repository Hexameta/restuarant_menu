const express = require("express");
const router = express.Router();
const {
  searchRestaurants,
  createBranch,
} = require("../controller/restaurantController");

router.get("/search", searchRestaurants);

router.post("/create", createBranch);

module.exports = router;
