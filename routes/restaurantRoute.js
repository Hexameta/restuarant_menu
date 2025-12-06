const express = require("express");
const router = express.Router();
const {
  searchRestaurants,
  createBranch,
  getResturantById,
  updateBranchAndSettings
} = require("../controller/restaurantController");

router.get("/search", searchRestaurants);

router.post("/create/:userId", createBranch);

router.patch("/update-settings/:branchId", updateBranchAndSettings)

router.get("/:id", getResturantById);


module.exports = router;
