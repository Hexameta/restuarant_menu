const { Restaurant } = require("../model/resturantModel.js");

// ➤ Add Restaurant
const addRestaurant = async (req, res,next) => {
  try {
    const { restaurantName, email, phone } = req.body;

    // Validation
    if (!restaurantName || restaurantName.trim() === "") {
      return res
        .status(400)
        .json({ success: false, message: "Restaurant name is required" });
    }

    const newRestaurant = await Restaurant.create({
      restaurantName,
      email: email || null,
      phone: phone || null,
    });

    res.status(201).json({
      success: true,
      message: "Restaurant created successfully",
      data: newRestaurant,
    });
  } catch (err) {
    console.error("Add Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ➤ Get all restaurants
const getRestaurants = async (req, res,next) => {
  try {
    const restaurants = await Restaurant.findAll();

    res.json({
      success: true,
      data: restaurants,
    });
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ➤ Get by ID
const getRestaurantById = async (req, res,next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    res.json({ success: true, data: restaurant });
  } catch (err) {
    console.error("Fetch One Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ➤ Update Restaurant
const updateRestaurant = async (req, res,next) => {
  try {
    const { restaurantName, email, phone, status } = req.body;

    const restaurant = await Restaurant.findByPk(req.params.id);

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    await restaurant.update({
      restaurantName,
      email,
      phone,
      status,
    });

    res.json({
      success: true,
      message: "Restaurant updated successfully",
      data: restaurant,
    });
  } catch (err) {
    console.error("Update Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// ➤ Delete restaurant
const deleteRestaurant = async (req, res,next) => {
  try {
    const restaurant = await Restaurant.findByPk(req.params.id);

    if (!restaurant) {
      return res
        .status(404)
        .json({ success: false, message: "Restaurant not found" });
    }

    await restaurant.destroy();

    res.json({ success: true, message: "Restaurant deleted successfully" });
  } catch (err) {
    console.error("Delete Error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  addRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
};
