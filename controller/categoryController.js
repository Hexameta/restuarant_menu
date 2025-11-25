const { Category } = require("../model/categoryModel");
const { Branch } = require("../model/resturantModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const { Op } = require("sequelize");

// =============================
// CREATE CATEGORY
// =============================
const createCategory = async (req, res) => {
  try {
    const { branch_id, name, image_url, display_order } = req.body;

    if (!branch_id || !name) {
      return res.status(400).json({
        success: false,
        message: "branch_id and name are required",
      });
    }

    // Check branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    const category = await Category.create({
      branch_id,
      name,
      image_url: image_url || null,
      is_active: true,
      display_order: display_order || 0,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    console.log("Create Category Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// GET ALL CATEGORIES (BY BRANCH)
// =============================
const getCategories = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Category.findAndCountAll({
      where: { branch_id },
      limit,
      offset,
      order: [["display_order", "ASC"]],
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
// GET SINGLE CATEGORY
// =============================
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: category,
    });
  } catch (error) {
    console.log("Get Category Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// UPDATE CATEGORY
// =============================
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    const { name, image_url, is_active, display_order } = req.body;

    await category.update({
      name: name ?? category.name,
      image_url: image_url ?? category.image_url,
      is_active: is_active ?? category.is_active,
      display_order: display_order ?? category.display_order,
    });

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    console.log("Update Category Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

// =============================
// DELETE CATEGORY (SOFT DELETE)
// =============================
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findByPk(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    await category.update({ is_active: false });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.log("Delete Category Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};


const searchCategory = async (req, res) => {
  try {
    const branch_id = req.params.branch_id || null;
    const q = req.query.q || "";

    if (!q || q.trim() === "") {
      return res.status(200).json({ success: true, data: [] });
    }

    // ----- BUILD WHERE CONDITION SAFELY -----
    const whereCondition = {
      name: { [Op.iLike]: `%${q}%` },
    };

    if (branch_id) {
      whereCondition.branch_id = branch_id;
    }

    const categories = await Category.findAll({
      where: whereCondition,
      order: [["name", "ASC"]],
      limit: 10,
    });

    return res.status(200).json({
      success: true,
      data: categories,
    });

  } catch (error) {
    console.error("Search Category Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};


const checkImageExistsDB = async (fileName, id = null) => {
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

    const exists = await Category.findOne({
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



const reOrderCategory = async (req, res) => {
  try {
    const { orderedIds } = req.body; // e.g. [5, 3, 9, 1, 4]

    if (!Array.isArray(orderedIds)) {
      return res.status(400).json({ success: false, message: "orderedIds must be array" });
    }

    for (let index = 0; index < orderedIds.length; index++) {
      await Category.update(
        { display_order: index },
        { where: { id: orderedIds[index] } }
      );
    }

    res.status(200).json({
      success: true,
      message: "Category priority updated",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  searchCategory,
  checkImageExistsDB,
  reOrderCategory
};
