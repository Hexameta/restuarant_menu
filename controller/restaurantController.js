const { Restaurant, Branch, Settings } = require("../model/resturantModel");
const { sendResponse } = require("../utils/responseHelper");

const { Op } = require("sequelize");

/**
 * Search Restaurants Controller
 * Fetches all restaurants with id and name
 * Query Params: ?search=name
 */
const searchRestaurants = async (req, res) => {
  try {
    const { search } = req.query;

    if (search === "") {
      return sendResponse(res, 200, "Restaurants fetched successfully", []);
    }
    let whereClause = {};

    if (search) {
      whereClause.name = {
        [Op.iLike]: `%${search}%`, // Case-insensitive partial match
      };
    }

    const restaurants = await Restaurant.findAll({
      attributes: ["id", "name","logo"],
      where: whereClause,
    });

    return sendResponse(
      res,
      200,
      "Restaurants fetched successfully",
      restaurants
    );
  } catch (error) {
    console.error("Search restaurants error:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

/**
 * Create Branch Controller
 * Creates a branch and optionally a restaurant if it doesn't exist
 */
const createBranch = async (req, res) => {
  const transaction = await Restaurant.sequelize.transaction();
  try {
    const {
      restaurant_id,
      // Restaurant details (if creating new)
      restaurant_name,
      restaurant_email,
      restaurant_type,
      restaurant_logo,

      // Branch details
      branch_name,
      phone,
      country,
      state,
      district,
      city,
      place,
      // Settings details
      currency,
      symbol,
      symbol_position,
      facebook_url,
      instagram_url,
      google_feedback_url,
    } = req.body;

    let finalRestaurantId = restaurant_id;

    // 1. Handle Restaurant
    if (restaurant_id) {
      // Check if exists
      const restaurant = await Restaurant.findByPk(restaurant_id);
      if (!restaurant) {
        await transaction.rollback();
        return sendResponse(res, 404, "Restaurant not found");
      }
    } else {
      // Create new Restaurant
      if (!restaurant_name) {
        await transaction.rollback();
        return sendResponse(
          res,
          400,
          "Restaurant name is required when creating a new restaurant"
        );
      }

      const newRestaurant = await Restaurant.create(
        {
          name: restaurant_name,
          email: restaurant_email,
          phone: phone,
          type: restaurant_type,
          logo: restaurant_logo,
          status: "inactive", // Default as per requirement
        },
        { transaction }
      );

      finalRestaurantId = newRestaurant.id;
    }

    // 2. Create Branch
    // Generate slug: restaurant name + country code + 3 random digits
    // User said "resturant name + Country code + 3 digit"
    // We need restaurant name. If we have ID, we might need to fetch it if we didn't already.
    // If we created it, we have it.

    let currentRestaurantName = restaurant_name;
    if (restaurant_id && !currentRestaurantName) {
      const r = await Restaurant.findByPk(restaurant_id);
      currentRestaurantName = r.name;
    }

    const countryCode = country ? country.substring(0, 2).toUpperCase() : "XX";
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const slug = `${currentRestaurantName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${countryCode}-${randomDigits}`;

    const newBranch = await Branch.create(
      {
        restaurant_id: finalRestaurantId,
        name: branch_name,
        phone: phone,

        country,
        state,
        district,
        city,
        place,
        slug,
        status: "pending", // Default as per requirement
        isActive: true, // Default as per requirement
      },
      { transaction }
    );

    // 3. Create Settings
    await Settings.create(
      {
        branch_id: newBranch.id,
        logo: restaurant_logo, // Assuming branch logo is same as restaurant logo initially? Or passed separately?
        // User didn't specify branch logo input, but table has it. I'll use restaurant_logo or null.
        currency,
        symbol,
        symbol_position,
        facebook_url,
        instagram_url,
        google_feedback_url,
      },
      { transaction }
    );

    await transaction.commit();

    return sendResponse(res, 201, "Branch created successfully", {
      branch: newBranch,
      restaurant_id: finalRestaurantId,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Create branch error:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
      details: error.errors ? error.errors.map((e) => e.message) : null,
    });
  }
};

module.exports = {
  searchRestaurants,
  createBranch,
};
