const { MenuItem, Options } = require("../model/menuItemModel");
const { Category } = require("../model/categoryModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");
const { Op } = require("sequelize");
const { sendResponse } = require("../utils/responseHelper");

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
    const category = await Category.findByPk(category_id);
    if (!category) {
      return sendResponse(res, 404, "Category not found");
    }

     const exists = await MenuItem.findOne({
      where: {
        category_id,
        name: { [Op.iLike]: name.trim() }
      }
    });

    if (exists) {
      return sendResponse(res, 409, "A menu item with this name already exists in this category");
    }


    const item = await MenuItem.create({
      category_id,
      name,
      description: description || null,
      image_url: image_url || null,
      // price: price || null,
      // offer_price: offer_price || null,
      is_available: is_available ?? true,
      special_note: special_note || null,
      tag: tag || null,
    });

    const itemId = item.id;

    if (options && options.length > 0) {
      await Options.bulkCreate(
        options.map((option) => ({
          ...option,
          menu_item_id: itemId,
        }))
      );
    }

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
    const offset = (page - 1) * limit;

    const branch_id = req.user.branchId
    const { category_id } = req.query;

    const whereCondition = {};
    const categoryCondition = {};

    // 🟦 FILTER: CATEGORY
    if (category_id) {
      whereCondition.category_id = category_id;
    }

    // 🟥 FILTER: BRANCH
    if (branch_id) {
      categoryCondition.branch_id = branch_id;
    }

    const { rows, count } = await MenuItem.findAndCountAll({
      where: whereCondition,
      include: [
        {
          model: Category,
          where: categoryCondition, // applied only if branch_id provided
        },
        {
          model: Options,
          as: 'menu_item_options',
        },
      ],
      limit,
      offset,
      order: [["id", "DESC"]],
    });

    return sendResponse(res, 200, "Menu items fetched successfully", rows, {
      totalCount: count,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(count / limit),
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

    const items = await MenuItem.findAll({
      where: { category_id },
      include: [
        {
          model: Options,
          as: 'menu_item_options',
        },
      ],
      order: [["id", "DESC"]],
    });

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

    const item = await MenuItem.findByPk(id, {
      include: [
        {
          model: Options,
        },
      ],
    });
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
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return sendResponse(res, 404, "Menu item not found");
    }

    const { category_id, name } = req.body;

    // Duplicate check only if name is provided
    if (name && name.trim()) {
      const exists = await MenuItem.findOne({
        where: {
          name: { [Op.iLike]: name.trim() },
          category_id: category_id ?? item.category_id,
          id: { [Op.not]: id }, // exclude itself
        },
      });

      if (exists) {
        return sendResponse(res, 409, "Another item with this name already exists in this category");
      }
    }

    const { options, ...rest } = req.body;

    await item.update(rest);

    if (options && options.length > 0) {
      await Options.destroy({ where: { menu_item_id: id } });
      await Options.bulkCreate(
        options.map((option) => ({
          ...option,
          menu_item_id: id,
        }))
      );
    }

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
    const item = await MenuItem.findByPk(id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }
    const fileName = item.image_url;
        await Options.destroy({
      where: { menu_item_id: id },
    });
   await item.destroy(); 

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

    const whereCondition = {
      name: { [Op.iLike]: `%${q}%` },
    };

    if (category_id) {
      whereCondition.category_id = category_id;
    }

    const items = await MenuItem.findAll({
      where: whereCondition,
      order: [["name", "ASC"]],
      limit: 10,
    });

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

    const whereCondition = {
      image_url: fileName,
    };

    // If editing — exclude the current category
    if (id) {
      whereCondition.id = { [Op.ne]: id };  // id != this record
    }

    const exists = await MenuItem.findOne({
      where: whereCondition,
    });

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
