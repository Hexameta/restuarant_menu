const { Category } = require("../model/categoryModel");
const { Branch } = require("../model/resturantModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");
const { sendResponse } = require("../utils/responseHelper");
const mongoose = require("mongoose");

// =============================
// CREATE CATEGORY
// =============================
const createCategory = async (req, res) => {
  try {
    const branch_id = req.user.branchId;
    const { name, image_url, display_order } = req.body;

    if (!branch_id || !name) {
      return sendResponse(res, 400, "branch_id and name are required");
    }

    // Check branch exists
    const branch = await Branch.findById(branch_id);
    if (!branch) {
      return sendResponse(res, 404, "Branch not found");
    }

    // Case-insensitive category check
    const exists = await Category.findOne({
      branch_id,
      is_active: true,
      name: { $regex: new RegExp(`^${name.trim()}$`, "i") } // Exact match, case insensitive
    });

    if (exists) {
      return sendResponse(res, 400, `Category "${name}" already exists in this branch`);
    }

    const category = new Category({
      branch_id,
      name,
      image_url: image_url || null,
      is_active: true,
      display_order: display_order || 0,
    });

    await category.save();

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
    const branch_id = req.user.branchId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const filter = { branch_id, is_deleted: false };

    const [totalCount, rows] = await Promise.all([
      Category.countDocuments(filter),
      Category.find(filter)
        .sort({ display_order: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    return sendResponse(res, 200, "Categories fetched successfully", rows, {
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
// GET SINGLE CATEGORY
// =============================
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id).lean();
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

    const category = await Category.findById(id);
    if (!category) {
      return sendResponse(res, 404, "Category not found");
    }

    // If user changed the name → check for duplicates
    if (name && name.trim().toLowerCase() !== category.name.toLowerCase()) {
      const existing = await Category.findOne({
        branch_id: category.branch_id,
        is_active: true,
        name: { $regex: new RegExp(`^${name.trim()}$`, "i") },
        _id: { $ne: id }, // exclude current id
      });

      if (existing) {
        return sendResponse(res, 400, `Another category with name "${name}" already exists`);
      }
    }

    if(name) category.name = name.trim().replace(/\s+/g, " ");
    if(image_url !== undefined) category.image_url = image_url;
    if(is_active !== undefined) category.is_active = is_active;
    if(display_order !== undefined) category.display_order = display_order;

    await category.save();

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

    const category = await Category.findById(id);
    if (!category) {
      return sendResponse(res, 404, "Category not found");
    }

    let nameMatch = false;
    nameMatch = await Category.exists({ 
      name: category.name, 
      _id: { $ne: id }, 
      is_deleted: false 
    });
    if(!nameMatch){
      category.is_deleted = true;
      await category.save();
    }
    else{
      await MenuItem.deleteMany({ category_id: id });
      await Category.findByIdAndDelete(id);
    }
    return sendResponse(res, 200, "Category deleted successfully");
  } catch (error) {
    console.log("Delete Category Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
  }
};


const searchCategory = async (req, res) => {
  try {
    const searchId = req.params.id || null;
    let branch_id = null
    if(searchId){
      branch_id = req.user.branchId; 
    }
    const q = req.query.q || "";

    if (!q || q.trim() === "") {
      return sendResponse(res, 200, "No query provided", []);
    }

    // ----- BUILD WHERE CONDITION SAFELY -----
    const filter = {
      name: { $regex: q, $options: "i" },
      is_active: true,
    };

    if (branch_id) {
      filter.branch_id = branch_id;
    }

    const categories = await Category.find(filter)
      .sort({ name: 1 })
      .limit(10)
      .lean();

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

    const filter = {
      image_url: fileName,
    };

    // If editing — exclude the current category
    if (id) {
      filter._id = { $ne: id };
    }

    const exists = await Category.findOne(filter).select('_id').lean();

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

    const bulkOps = orderedIds.map((id, index) => ({
        updateOne: {
            filter: { _id: id },
            update: { display_order: index }
        }
    }));

    await Category.bulkWrite(bulkOps);

    return sendResponse(res, 200, "Category priority updated");
  } catch (err) {
    console.error(err);
    return sendResponse(res, 500, "Server error", { error: err.message });
  }
}

const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return sendResponse(res, 404, "Category not found");
    }

    category.is_active = is_active;
    await category.save();

    return sendResponse(res, 200, "Category status updated successfully");
  } catch (error) {
    console.log("Update Status Error:", error);
    return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
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
  reOrderCategory,
  updateStatus
};
