const { MenuItem } = require("../model/menuItemModel");
const { Category } = require("../model/categoryModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const { Op } = require("sequelize");

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
      price,
      offer_price,
      is_available,
      special_note,
      tag,
    } = req.body;

    if (!category_id || !name) {
      return res.status(400).json({
        success: false,
        message: "category_id and name are required",
      });
    }

    // Ensure category exists
    const category = await Category.findByPk(category_id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const item = await MenuItem.create({
      category_id,
      name,
      description: description || null,
      image_url: image_url || null,
      price: price || null,
      offer_price: offer_price || null,
      is_available: is_available ?? true,
      special_note: special_note || null,
      tag: tag || null,
    });

    return res.status(201).json({
      success: true,
      message: "Menu item created successfully",
      data: item,
    });

  } catch (error) {
    console.log("Create Menu Item Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// GET MENU ITEMS (WITH PAGINATION)
// =============================
const getMenuItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { rows, count } = await MenuItem.findAndCountAll({
      include: [{ model: Category }],
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page,
        totalPages: Math.ceil(count / limit),
      },
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// GET ITEMS BY CATEGORY ID
// =============================
const getItemsByCategory = async (req, res) => {
  try {
    const { category_id } = req.params;

    const items = await MenuItem.findAll({
      where: { category_id },
      order: [["id", "DESC"]],
    });

    return res.status(200).json({
      success: true,
      data: items,
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// GET SINGLE ITEM
// =============================
const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findByPk(id);
    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: item,
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// UPDATE MENU ITEM
// =============================
const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    const data = req.body;

    await item.update(data);

    return res.status(200).json({
      success: true,
      message: "Menu item updated successfully",
      data: item,
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// DELETE ITEM (SOFT DELETE / HARD DELETE optional)
// =============================
const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    await item.destroy(); // ❗ actual delete

    return res.status(200).json({
      success: true,
      message: "Menu item deleted successfully",
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// SEARCH MENU ITEM
// =============================
const searchMenuItem = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const { q } = req.query;

    if (!q || q.trim() === "") {
      return res.status(200).json({ success: true, data: [] });
    }

    const whereCondition = {
      name: { [Op.iLike]: `%${q}%` },
    };

    if (branch_id) {
      whereCondition.branch_id = branch_id;
    }

    const items = await MenuItem.findAll({
      where: whereCondition,
      order: [["name", "ASC"]],
      limit: 10,
    });

    return res.status(200).json({ success: true, data: items });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
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
};
