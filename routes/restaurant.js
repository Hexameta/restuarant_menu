var express = require('express');
var router = express.Router();

const {
  addRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
} = require("../controller/resturantController.js");


router.route("/").post(addRestaurant).get(getRestaurants);
router
  .route("/:id", getRestaurantById)
  .get(getRestaurantById)
  .put(updateRestaurant)
  .delete(deleteRestaurant);

module.exports = router
