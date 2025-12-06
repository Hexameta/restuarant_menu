const { Category } = require("../model/categoryModel");
const { Branch } = require("../model/resturantModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const { Op } = require("sequelize");
const { sendResponse } = require("../utils/responseHelper");

// =============================
// CREATE CATEGORY
// =============================
const createCategory = async (req, res) => {
  try {
    const branch_id = req.user.branchId
    const {  name, image_url, display_order } = req.body;

    if (!branch_id || !name) {
      return sendResponse(res, 400, "branch_id and name are required");
    }

    // Check branch exists
    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      return sendResponse(res, 404, "Branch not found");
    }

        // Case-insensitive category check
    const exists = await Category.findOne({
      where: {
        branch_id,
        is_active: true,
        name: { [Op.iLike]: name.trim() }   // matches "Pizza" and "pizza"
      }
    });

    if (exists) {
      return sendResponse(res, 400, `Category "${name}" already exists in this branch`);
    }


    const category = await Category.create({
      branch_id,
      name,
      image_url: image_url || null,
      is_active: true,
      display_order: display_order || 0,
    });

    return sendResponse(res, 201, "Category created successfully", category);
  } catch (error) {
    console.log("Create Category Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// GET ALL CATEGORIES (BY BRANCH)
// =============================
const getCategories = async (req, res) => {
  try {
    // const { branch_id } = req.params;
    const branch_id = req.user.branchId; 
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { rows, count } = await Category.findAndCountAll({
      where: { branch_id, is_active: true },
      limit,
      offset,
      order: [["display_order", "ASC"]],
    });

    return sendResponse(res, 200, "Categories fetched successfully", rows, {
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

    return sendResponse(res, 200, "Category fetched successfully", category);
  } catch (error) {
    console.log("Get Category Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};

// =============================
// UPDATE CATEGORY
// =============================
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image_url, is_active, display_order } = req.body;

    const category = await Category.findByPk(id);
    if (!category) {
      return sendResponse(res, 404, "Category not found");
    }

    // If user changed the name → check for duplicates
    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({
        where: {
          branch_id: category.branch_id,
           is_active: true,
          name: { [Op.iLike]: name.trim() },
          id: { [Op.ne]: id }, // exclude current id
        },
      });

      if (existing) {
        return sendResponse(res, 400, `Another category with name "${name}" already exists`);
      }
    }

    await category.update({
      name: name ? name.trim().replace(/\s+/g, " ") : category.name,
      image_url: image_url ?? category.image_url,
      is_active: is_active ?? category.is_active,
      display_order: display_order ?? category.display_order,
    });

    return sendResponse(res, 200, "Category updated successfully", category);
  } catch (error) {
    console.log("Update Category Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
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
      return sendResponse(res, 404, "Category not found");
    }

    await category.update({ is_active: false });

    return sendResponse(res, 200, "Category deleted successfully");
  } catch (error) {
    console.log("Delete Category Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


const searchCategory = async (req, res) => {
  try {
    const searchId = req.params.id || null;
     let  branch_id = null
    if(searchId){

      branch_id = req.user.branchId; 
    }
    const q = req.query.q || "";

    if (!q || q.trim() === "") {
      return sendResponse(res, 200, "No query provided", []);
    }

    // ----- BUILD WHERE CONDITION SAFELY -----
    const whereCondition = {
      name: { [Op.iLike]: `%${q}%` },
       is_active: true,
    };

    if (branch_id) {
      whereCondition.branch_id = branch_id;
    }

    const categories = await Category.findAll({
      where: whereCondition,
      order: [["name", "ASC"]],
      limit: 10,
    });

    return sendResponse(res, 200, "Categories fetched successfully", categories);

  } catch (error) {
    console.error("Search Category Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


const checkCategoryImageExistsDB = async (fileName, id = null) => {
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
      return sendResponse(res, 400, "orderedIds must be array");
    }

    for (let index = 0; index < orderedIds.length; index++) {
      await Category.update(
        { display_order: index },
        { where: { id: orderedIds[index] } }
      );
    }

    return sendResponse(res, 200, "Category priority updated");
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, "Server error", { error: err.message });
  }
}

module.exports = {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  searchCategory,
  checkCategoryImageExistsDB,
  reOrderCategory
};
