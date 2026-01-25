const { MenuItem } = require("../model/menuItemModel");
const { Category } = require("../model/categoryModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");
const { sendResponse } = require("../utils/responseHelper");
const mongoose = require("mongoose");


// =============================
// CREATE MENU ITEM
// =============================
const createMenuItem = async (req, res) => {
  try {
    const {
      category_id,
      name,
      description,
      image_url,
      options,
      // price,
      // offer_price,
      is_available,
      special_note,
      tag,
    } = req.body;

    if (!category_id || !name) {
      return sendResponse(res, 400, "category_id and name are required");
    }

    // Ensure category exists
    const category = await Category.findById(category_id);
    if (!category) {
      return sendResponse(res, 404, "Category not found");
    }

     const exists = await MenuItem.findOne({
        category_id,
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") }
    });

    if (exists) {
      return sendResponse(res, 409, "A menu item with this name already exists in this category");
    }


    const item = new MenuItem({
      category_id,
      name,
      description: description || null,
      image_url: image_url || null,
      // price: price || null,
      // offer_price: offer_price || null,
      is_available: is_available ?? true,
      special_note: special_note || null,
      tag: tag || null,
      options: options || [] // Embedded options
    });

    await item.save();

    return sendResponse(res, 201, "Menu item created successfully", item);

  } catch (error) {
    console.log("Create Menu Item Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// GET MENU ITEMS (WITH PAGINATION)
// =============================
const getMenuItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const branch_id = req.user.branchId
    const { category_id } = req.query;

    const filter = {};

    // 🟦 FILTER: CATEGORY
    if (category_id) {
      filter.category_id = category_id;
    }

    // 🟥 FILTER: BRANCH
    if (branch_id) {
      // Find all categories for this branch first
      const branchCategories = await Category.find({ branch_id: branch_id }).select('_id');
      const categoryIds = branchCategories.map(c => c._id);
      
      // If we also had a category_id filter, we need to make sure it belongs to the branch
      if (category_id) {
          // Check if the requested category_id is in the branch's categories
          const isCategoryInBranch = categoryIds.some(id => id.toString() === category_id);
          if (!isCategoryInBranch) {
               // Return empty if category doesn't belong to branch
              return sendResponse(res, 200, "Menu items fetched successfully", [], {
                  totalCount: 0, currentPage: page, pageSize: limit, totalPages: 0
              });
          }
           // filter already set by category_id above
      } else {
           // No specific category requested, so get all items for categories in this branch
           filter.category_id = { $in: categoryIds };
      }
    }

    const totalCount = await MenuItem.countDocuments(filter);
    const rows = await MenuItem.find(filter)
      .populate('category_id') // Populate category info if needed
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit);

    return sendResponse(res, 200, "Menu items fetched successfully", rows, {
      totalCount: totalCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalCount / limit),
    });

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


// =============================
// GET ITEMS BY CATEGORY ID
// =============================
const getItemsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const items = await MenuItem.find({ category_id })
      .sort({ _id: -1 });

    return sendResponse(res, 200, "Menu items fetched successfully", items);

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// GET SINGLE ITEM
// =============================
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id);
    if (!item) {
      return sendResponse(res, 404, "Menu item not found");
    }

    return sendResponse(res, 200, "Menu item fetched successfully", item);

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// UPDATE MENU ITEM
// =============================
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);

    if (!item) {
      return sendResponse(res, 404, "Menu item not found");
    }

    const { category_id, name } = req.body;

    // Duplicate check only if name is provided
    if (name && name.trim()) {
      const exists = await MenuItem.findOne({
          name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
          category_id: category_id ?? item.category_id,
          _id: { $ne: id }, // exclude itself
      });

      if (exists) {
        return sendResponse(res, 409, "Another item with this name already exists in this category");
      }
    }

    const { options, ...rest } = req.body;

    // Update simple fields
    Object.assign(item, rest);

    // Update options if provided
    if (options && Array.isArray(options)) {
        item.options = options;
    }

    await item.save();

    return sendResponse(res, 200, "Menu item updated successfully", item);

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// DELETE ITEM (SOFT DELETE / HARD DELETE optional)
// =============================
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findById(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }
    const fileName = item.image_url;
    
    await MenuItem.findByIdAndDelete(id);

     sendResponse(res, 200, "Menu item deleted successfully");

     if (fileName) {
        checkMenuItemImageExistsDB(fileName).then((exists) => {
            if (!exists?.exists) {
            const { deleteImageDirectly } = require("./ImageController");
            deleteImageDirectly(fileName).catch((err) =>
                console.error("Failed to delete image in background:", err)
            );
            }
        });
    }

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// SEARCH MENU ITEM
// =============================
const searchMenuItem = async (req, res) => {
  try {
    const { category_id } = req.params;
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return sendResponse(res, 200, "No query provided", []);
    }

    const filter = {
      name: { $regex: q, $options: "i" },
    };

    if (category_id) {
      filter.category_id = category_id;
    }

    const items = await MenuItem.find(filter)
      .sort({ name: 1 })
      .limit(10);

    return sendResponse(res, 200, "Menu items fetched successfully", items);

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};



const checkMenuItemImageExistsDB = async (fileName, id = null) => {
  try {
    if (!fileName) {
      return { success: false, exists: false };
    }

    const filter = {
      image_url: fileName,
    };

    // If editing — exclude the current category
    if (id) {
      filter._id = { $ne: id };
    }

    const exists = await MenuItem.findOne(filter);

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


module.exports = {
  createMenuItem,
  getMenuItems,
  getItemsByCategory,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  searchMenuItem,
  checkMenuItemImageExistsDB
};
