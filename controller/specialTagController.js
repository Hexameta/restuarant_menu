const { SpecialTag } = require("../model/specialTagModel");
const { Branch } = require("../model/resturantModel");
const { MenuItem } = require("../model/menuItemModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");
const { sendResponse } = require("../utils/responseHelper");

// =============================
// CREATE SPECIAL TAG
// =============================
const createSpecialTag = async (req, res) => {
  try {
    const branch_id = req.user.branchId;
    const { title, is_active, display_order } = req.body;

    if (!branch_id || !title) {
      return sendResponse(res, 400, "branch_id and title are required");
    }

    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return sendResponse(res, 404, "Branch not found");
    }

    // DUPLICATE CHECK CASE INSENSITIVE
    const exists = await SpecialTag.findOne({
      branch_id,
      title: { $regex: new RegExp(`^${title.trim()}$`, "i") }
    });

    if (exists) {
      return sendResponse(res, 409, "Special tag already exists");
    }

    const tag = await SpecialTag.create({
      branch_id,
      title,
      is_active: is_active ?? true,
      display_order: display_order || 0,
      menu_items: []
    });

    return sendResponse(res, 201, "Special tag created successfully", tag);

  } catch (error) {
    console.log("Create Special Tag Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


// =============================
// GET SPECIAL TAGS
// =============================
const getSpecialTags = async (req, res) => {
  try {
    const branch_id = req.user.branchId; 

    const tags = await SpecialTag.find({ branch_id })
      .sort({ display_order: 1 })
      .lean();

    return sendResponse(res, 200, "Special tags fetched successfully", tags);

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};


// =============================
// UPDATE SPECIAL TAG
// =============================
const updateSpecialTag = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await SpecialTag.findById(id);

    if (!tag) {
      return sendResponse(res, 404, "Special tag not found");
    }

    const { title } = req.body;

    if (title && title.trim()) {
      const exists = await SpecialTag.findOne({
        title: { $regex: new RegExp(`^${title.trim()}$`, "i") },
        branch_id: tag.branch_id,
        _id: { $ne: id }
      });
      if (exists) {
        return sendResponse(res, 409, "Another tag with this name already exists");
      }
    }

    Object.assign(tag, req.body);
    await tag.save();

    return sendResponse(res, 200, "Special tag updated successfully", tag);

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


// =============================
// DELETE SPECIAL TAG
// =============================
const deleteSpecialTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await SpecialTag.findByIdAndDelete(id);
    if (!tag) {
      return sendResponse(res, 404, "Special tag not found");
    }

    return sendResponse(res, 200, "Special tag deleted successfully");

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


// =============================
// GET ITEMS ASSIGNED TO TAG
// =============================
const getSpecialTagItems = async (req, res) => {
  try {
    const { tag_id } = req.params;

    const tag = await SpecialTag.findById(tag_id).populate({
      path: 'menu_items',
      select: 'name image_url'
    }).lean();

    if (!tag) {
      return sendResponse(res, 404, "Special tag not found");
    }

    return sendResponse(res, 200, "Special tag items fetched successfully", tag.menu_items || []);

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


// =============================
// ASSIGN ITEMS TO TAG
// =============================
const assignSpecialItems = async (req, res) => {
  try {
    const { special_tag_id, menu_item_ids } = req.body;

    if (!special_tag_id || !menu_item_ids?.length) {
      return sendResponse(res, 400, "special_tag_id & menu_item_ids required");
    }

    await SpecialTag.updateOne(
      { _id: special_tag_id },
      { $addToSet: { menu_items: { $each: menu_item_ids } } }
    );

    return sendResponse(res, 200, "Items assigned successfully");

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


// =============================
// REMOVE ITEM FROM TAG
// =============================
const removeSpecialItem = async (req, res) => {
  try {
    const { special_tag_id, menu_item_id } = req.body;

    if (!special_tag_id || !menu_item_id) {
      return sendResponse(res, 400, "special_tag_id & menu_item_id are required");
    }

    await SpecialTag.updateOne(
      { _id: special_tag_id },
      { $pull: { menu_items: menu_item_id } }
    );

    return sendResponse(res, 200, "Item removed from tag");

  } catch (error) {
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


module.exports = {
  createSpecialTag,
  getSpecialTags,
  updateSpecialTag,
  deleteSpecialTag,
  getSpecialTagItems,
  assignSpecialItems,
  removeSpecialItem,
};
