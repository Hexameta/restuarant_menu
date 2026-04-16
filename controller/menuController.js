const { Ads } = require("../model/adsModal");
const { Category } = require("../model/categoryModel");
const { MenuItem } = require("../model/menuItemModel");
const { Branch } = require("../model/resturantModel");
const { SpecialTag } = require("../model/specialTagModel");
const { MenuAccessLog } = require("../model/menuAccessLogModel");
const { sendResponse } = require("../utils/responseHelper");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");

// ─── Reusable field projections ───
const BRANCH_SELECT = "-__v";
const CATEGORY_SELECT = "_id name image_url is_active display_order";
const MENU_ITEM_SELECT =
  "_id category_id name description image_url is_available special_note tag no_price options";
const CAROUSEL_SELECT =
  "_id branch_id title ad_type image_url valid_from valid_to";
const SPECIAL_TAG_SELECT = "_id title display_order menu_items";

// API for Restaurant Details
const getBranchDetailsByslug = async (req, res) => {
  try {
    const { slug } = req.params;

    const branch = await Branch.findOne({ slug, is_active: true })
      .select(BRANCH_SELECT)
      .lean();

    if (!branch) {
      return sendResponse(res, 404, "Branch not found");
    }

    return sendResponse(
      res,
      200,
      "Branch details fetched successfully",
      branch,
    );
  } catch (error) {
    console.error("Get Restaurant Details By Branch Slug Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

const getCategoriesbyIdForMenu = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return sendResponse(res, 400, "Branch ID is required");
    }

    const category = await Category.find({
      branch_id: branchId,
      is_active: true,
      is_deleted: false,
    })
      .sort({ display_order: 1 })
      .select(CATEGORY_SELECT)
      .lean();

    return sendResponse(res, 200, "Categories fetched successfully", category);
  } catch (error) {
    console.error("Get Category By Branch Slug Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// API for Menu Items (fetching all menu items for a specific branch)
const getMenuItemsByBranchIdForMenu = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return sendResponse(res, 404, "Branch not found");
    }

    // Fetch categories and build name map — avoids populate() round-trip
    const branchCategories = await Category.find({
      branch_id: branchId,
      is_deleted: false,
    })
      .select("_id name")
      .lean();

    const categoryIds = branchCategories.map((c) => c._id);

    if (categoryIds.length === 0) {
      return sendResponse(res, 200, "Menu items fetched successfully", []);
    }

    // Build O(1) lookup map instead of populate
    const categoryNameMap = {};
    for (let i = 0; i < branchCategories.length; i++) {
      categoryNameMap[branchCategories[i]._id.toString()] =
        branchCategories[i].name;
    }

    const menuItems = await MenuItem.find({
      category_id: { $in: categoryIds },
    })
      .sort({ is_available: -1, created_at: 1 })
      .select(MENU_ITEM_SELECT)
      .lean();

    // Attach category name in-memory (replaces populate)
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      item.category_id = {
        _id: item.category_id,
        name: categoryNameMap[item.category_id.toString()] || null,
      };
    }

    return sendResponse(res, 200, "Menu items fetched successfully", menuItems);
  } catch (error) {
    console.error("Get Menu Items By Branch Slug Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

const getSpecialMenuItemsByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return sendResponse(res, 400, "Branch ID is required");
    }

    const specialMenuItems = await SpecialTag.find({ branch_id: branchId })
      .sort({ display_order: 1 })
      .select(SPECIAL_TAG_SELECT)
      .populate({
        path: "menu_items",
        model: "MenuItem",
        select: MENU_ITEM_SELECT,
      })
      .lean();

    // Pre-allocate result array
    const finalData = new Array(specialMenuItems.length);
    for (let i = 0; i < specialMenuItems.length; i++) {
      const tag = specialMenuItems[i];
      finalData[i] = {
        id: tag._id,
        title: tag.title,
        special_items: tag.menu_items,
      };
    }

    return sendResponse(
      res,
      200,
      "Special menu items fetched successfully",
      finalData,
    );
  } catch (error) {
    console.error("Get Special Menu Items By Branch ID Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

const getCarasoulByBranchId = async (req, res) => {
  try {
    const { branchId } = req.params;

    if (!branchId) {
      return sendResponse(res, 400, "Branch ID is required");
    }

    const now = new Date();
    const carasoulMenuItems = await Ads.find({
      branch_id: branchId,
      is_expired: false,
      valid_from: { $lte: now },
      valid_to: { $gte: now },
    })
      .select(CAROUSEL_SELECT)
      .lean();

    return sendResponse(
      res,
      200,
      "Carousel items fetched successfully",
      carasoulMenuItems,
    );
  } catch (error) {
    console.error("Get Carasoul Menu Items By Branch ID Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// API for logging menu access — fire-and-forget for fastest response
const logMenuAccess = async (req, res) => {
  try {
    const { slug } = req.params;

    const branch = await Branch.findOne({ slug, is_active: true })
      .select("_id")
      .lean();

    if (!branch) {
      return sendResponse(res, 404, "Branch not found");
    }

    // Respond immediately, write log in background (fire-and-forget)
    sendResponse(res, 201, "Menu access logged successfully", {
      branch_id: branch._id,
      accessed_at: new Date(),
    });

    // Non-blocking DB write — uses create() (single round-trip vs new+save)
    MenuAccessLog.create({
      branch_id: branch._id,
      accessed_at: new Date(),
    }).catch((err) => console.error("Menu access log write failed:", err));
  } catch (error) {
    console.error("Log Menu Access Error:", error);
    // Only send error if headers haven't been sent
    if (!res.headersSent) {
      return sendResponse(
        res,
        500,
        "Internal Server Error",
        errorHandler(error),
      );
    }
  }
};

// ─── FULL MENU — Maximum Optimization ───
const getFullMenuBySlug = async (req, res) => {
  try {
    const { slug } = req.params;

    // 1. Branch lookup — required before parallel queries
    const branch = await Branch.findOne({ slug, is_active: true })
      .select(BRANCH_SELECT)
      .lean();

    if (!branch) {
      return sendResponse(res, 404, "Branch not found");
    }

    const branchId = branch._id;
    const now = new Date();

    // 2. Launch ALL independent queries in parallel
    const [categories, specialTagsRaw, carasoulMenuItems] = await Promise.all([
      // Categories
      Category.find({
        branch_id: branchId,
        is_active: true,
        is_deleted: false,
      })
        .sort({ display_order: 1 })
        .select(CATEGORY_SELECT)
        .lean(),

      // Special tags (without populate — we'll batch-fetch items separately)
      SpecialTag.find({ branch_id: branchId })
        .sort({ display_order: 1 })
        .select(SPECIAL_TAG_SELECT)
        .lean(),

      // Carousel / Ads
      Ads.find({
        branch_id: branchId,
        is_expired: false,
        valid_from: { $lte: now },
        valid_to: { $gte: now },
      })
        .select(CAROUSEL_SELECT)
        .lean(),
    ]);

    // 3. Build category ID list and name map (O(n) — microseconds)
    const categoryIds = new Array(categories.length);
    const categoryNameMap = {};
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      categoryIds[i] = cat._id;
      categoryNameMap[cat._id.toString()] = cat.name;
    }

    // 4. Collect all special item IDs for batch fetch
    const specialItemIdSet = new Set();
    for (let i = 0; i < specialTagsRaw.length; i++) {
      const items = specialTagsRaw[i].menu_items;
      if (items) {
        for (let j = 0; j < items.length; j++) {
          specialItemIdSet.add(items[j].toString());
        }
      }
    }
    const specialItemIds = Array.from(specialItemIdSet);

    // 5. Fetch menu items and special items in parallel (no populate!)
    const menuItemsQuery =
      categoryIds.length > 0
        ? MenuItem.find({ category_id: { $in: categoryIds } })
            .sort({ is_available: -1, created_at: 1 })
            .select(MENU_ITEM_SELECT)
            .lean()
        : Promise.resolve([]);

    const specialItemsQuery =
      specialItemIds.length > 0
        ? MenuItem.find({ _id: { $in: specialItemIds } })
            .select(MENU_ITEM_SELECT)
            .lean()
        : Promise.resolve([]);

    const [menuItems, specialItemDocs] = await Promise.all([
      menuItemsQuery,
      specialItemsQuery,
    ]);

    // 6. Attach category names to menuItems in-memory (replaces populate)
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      item.category_id = {
        _id: item.category_id,
        name: categoryNameMap[item.category_id.toString()] || null,
      };
    }

    // 7. Build special item lookup map (O(n))
    const specialItemMap = {};
    for (let i = 0; i < specialItemDocs.length; i++) {
      specialItemMap[specialItemDocs[i]._id.toString()] = specialItemDocs[i];
    }

    // 8. Format special tags with resolved items
    const specialMenuItems = new Array(specialTagsRaw.length);
    for (let i = 0; i < specialTagsRaw.length; i++) {
      const tag = specialTagsRaw[i];
      const resolvedItems = [];
      if (tag.menu_items) {
        for (let j = 0; j < tag.menu_items.length; j++) {
          const doc = specialItemMap[tag.menu_items[j].toString()];
          if (doc) resolvedItems.push(doc);
        }
      }
      specialMenuItems[i] = {
        id: tag._id,
        title: tag.title,
        special_items: resolvedItems,
      };
    }

    // // 9. Set cache header and respond
    // If we add this it will cache, so updates need hard refresh in browser then only it will reflect
    // res.set("Cache-Control", "public, max-age=120");

    return sendResponse(res, 200, "Full menu retrieved successfully", {
      restaurant: branch,
      categories,
      menuItems,
      specialItems: specialMenuItems,
      carousel: carasoulMenuItems,
    });
  } catch (error) {
    console.error("Get Full Menu By Slug Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

module.exports = {
  getFullMenuBySlug,
  getBranchDetailsByslug,
  getCategoriesbyIdForMenu,
  getMenuItemsByBranchIdForMenu,
  getSpecialMenuItemsByBranchId,
  getCarasoulByBranchId,
  logMenuAccess,
};
