const { Category } = require("../model/categoryModel");
const { MenuAccessLog } = require("../model/menuAccessLogModel");
const { MenuItem } = require("../model/menuItemModel");
const { Restaurant, Branch } = require("../model/resturantModel");
const { User } = require("../model/userModel");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwtHelper");
const { sendResponse } = require("../utils/responseHelper");
const mongoose = require("mongoose");

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
    let filter = {};

    if (search) {
      filter.name = { $regex: search, $options: "i" }; // Case-insensitive partial match
    }

    const restaurants = await Restaurant.find(filter).select("name logo");

    // Map _id to id for frontend compatibility if needed, or just return as is
    // Mongoose returns _id by default.

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
  const { userId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

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
      pdf_menu_url,
    } = req.body;

    let finalRestaurantId = restaurant_id;
    let currentRestaurantName = restaurant_name;

    // 1. Handle Restaurant
    if (restaurant_id) {
      // Check if exists
      const restaurant = await Restaurant.findById(restaurant_id).session(
        session
      );
      if (!restaurant) {
        await session.abortTransaction();
        session.endSession();
        return sendResponse(res, 404, "Restaurant not found");
      }
      currentRestaurantName = restaurant.name;
    } else {
      // Create new Restaurant
      if (!restaurant_name) {
        await session.abortTransaction();
        session.endSession();
        return sendResponse(
          res,
          400,
          "Restaurant name is required when creating a new restaurant"
        );
      }

      const newRestaurant = new Restaurant({
        name: restaurant_name,
        email: restaurant_email,
        phone: phone,
        type: restaurant_type,
        logo: restaurant_logo,
        status: "inactive",
      });

      await newRestaurant.save({ session });
      finalRestaurantId = newRestaurant._id;
    }

    // 2. Create Branch
    const countryCode = country ? country.substring(0, 2).toUpperCase() : "XX";
    const randomDigits = Math.floor(100 + Math.random() * 900);
    const slug = `${currentRestaurantName
      .replace(/\s+/g, "-")
      .toLowerCase()}-${countryCode}-${randomDigits}`;

    const newBranch = new Branch({
      restaurant_id: finalRestaurantId,
      name: branch_name,
      phone: phone,
      email: restaurant_email,
      country,
      state,
      district,
      city,
      place,
      slug,
      status: "pending",
      isActive: true, // Note: Schema uses 'is_active', check consistency. Model defined 'is_active', ensure frontend sends right key or map it.
      // Mapping 'isActive' input to 'is_active' in schema if needed, but schema has 'is_active'.
      // If code used isActive, let's stick to is_active in Mongoose schema for consistency with SQL column request?
      // Checking resturantModel.js: branchSchema has `is_active`.
      is_active: true,

      // Embedded Settings
      settings: {
        logo: restaurant_logo,
        currency,
        symbol,
        symbol_position,
        facebook_url,
        instagram_url,
        google_feedback_url,
        pdf_menu_url,
      },
    });

    await newBranch.save({ session });

    // Update User
    await User.findByIdAndUpdate(
      userId,
      { branch_id: newBranch._id },
      { session }
    );

    const user = await User.findById(userId).session(session);

    console.log(user);

    // Mongoose objects are BSON, need .toObject() or direct access usually works but better to be safe for JWT
    const userPayload = {
      id: user._id,
      email: user.email,
      branch_id: user.branch_id,
    };

    const accessToken = generateAccessToken(userPayload);
    const refreshToken = generateRefreshToken(userPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 201, "Branch created successfully", {
      branch: newBranch,
      restaurant_id: finalRestaurantId,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Create branch error:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

const getResturantById = async (req, res) => {
  try {
    const { branchId } = req.user;

    // In Mongoose, settings are embedded in Branch
    const restaurant = await Branch.findById(branchId);

    if (!restaurant) {
      return sendResponse(res, 404, "Restaurant not found");
    }

    // Return structure similar to before: restaurant (branch info) and settings
    // Since settings is inside restaurant (branch), we can extract it or return the whole object
    // Original code returned { restaurant, settings } where restaurant was branch

    return sendResponse(res, 200, "Restaurant fetched successfully", {
      restaurant: restaurant,
      settings: restaurant.settings,
    });
  } catch (error) {
    console.error("Get restaurant error:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

const checkRestaurantsImageExistDB = async (fileName, id = null) => {
  try {
    if (!fileName) {
      return { success: false, exists: false };
    }

    const filter = {
      "settings.logo": fileName,
    };

    // If editing — exclude the current branch
    if (id) {
      filter._id = { $ne: id };
    }

    const exists = await Branch.findOne(filter); // Check if any branch uses this logo in settings

    return {
      success: true,
      exists: !!exists,
    };
  } catch (error) {
    console.log("Check Image in DB Error:", error);
    return {
      success: false,
      exists: false,
      error,
    };
  }
};

const updateBranchAndSettings = async (req, res) => {
  const { branchId } = req.user;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      // BRANCH editable fields
      branch_name,
      branch_phone,
      branch_email,
      country,
      state,
      district,
      city,
      place,
      description,
      // SETTINGS editable fields (including LOGO)
      settings_logo,
      currency,
      symbol,
      symbol_position,
      facebook_url,
      instagram_url,
      google_feedback_url,
      pdf_menu_url,
    } = req.body;

    const branch = await Branch.findById(branchId).session(session);

    if (!branch) {
      await session.abortTransaction();
      session.endSession();
      return sendResponse(res, 404, "Branch not found");
    }

    // Update Branch Fields
    if (branch_name) branch.name = branch_name;
    if (branch_phone) branch.phone = branch_phone;
    if (branch_email) branch.email = branch_email;
    if (country) branch.country = country;
    if (state) branch.state = state;
    if (district) branch.district = district;
    if (city) branch.city = city;
    if (place) branch.place = place;
    if (description) branch.description = description;

    // Update Settings (Embedded)
    if (!branch.settings) branch.settings = {}; // Should exist, but safety check

    if (settings_logo) branch.settings.logo = settings_logo;
    if (currency) branch.settings.currency = currency;
    if (symbol) branch.settings.symbol = symbol;
    if (symbol_position) branch.settings.symbol_position = symbol_position;
    if (facebook_url) branch.settings.facebook_url = facebook_url;
    if (instagram_url) branch.settings.instagram_url = instagram_url;
    if (google_feedback_url)
      branch.settings.google_feedback_url = google_feedback_url;
    if (pdf_menu_url) branch.settings.pdf_menu_url = pdf_menu_url;

    await branch.save({ session });

    await session.commitTransaction();
    session.endSession();

    return sendResponse(res, 200, "Updated successfully", {
      branch,
      settings: branch.settings,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    session.endSession();
    console.error("Update error:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

const getAnalytics = async (req, res) => {
  try {
    const { slug } = req.params;

    const branch = await Branch.findOne({ slug: slug, is_active: true });

    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const branchId = branch._id;

    // 1) categories
    const totalCategories = await Category.countDocuments({
      branch_id: branchId,
      is_active: true,
    });

    // 2) items (through category) if categories are linked
    // In Mongoose, MenuItem has category_id. We need to find categories for this branch first?
    // Or if MenuItem has direct branch_id?
    // Checking MenuItem model... Only category_id.
    // So: Find all categories for branch -> Get their IDs -> Count MenuItems with those Category IDs.

    const branchCategories = await Category.find({
      branch_id: branchId,
    }).select("_id");
    const categoryIds = branchCategories.map((c) => c._id);

    const totalItems = await MenuItem.countDocuments({
      category_id: { $in: categoryIds },
    });

    // 3) monthly visitors
    const visitors = await MenuAccessLog.aggregate([
      { $match: { branch_id: branchId } },
      {
        $group: {
          _id: {
            month: { $month: "$accessed_at" },
            year: { $year: "$accessed_at" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    let monthlyVisitors = Array(12).fill(0);
    const currentYear = new Date().getFullYear();

    visitors.forEach((row) => {
      if (row._id.year === currentYear) {
        monthlyVisitors[row._id.month - 1] = row.count; // month 1-12
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        totalCategories,
        totalItems,
        monthlyVisitors,
      },
    });
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = {
  searchRestaurants,
  createBranch,
  getResturantById,
  updateBranchAndSettings,
  checkRestaurantsImageExistDB,
  getAnalytics,
};
