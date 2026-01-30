const { Ads } = require("../model/adsModal");
const { Category } = require("../model/categoryModel");
const { MenuItem } = require("../model/menuItemModel");
const { Branch, Restaurant } = require("../model/resturantModel");
const { SpecialTag } = require("../model/specialTagModel");
const { MenuAccessLog } = require("../model/menuAccessLogModel");
const { sendResponse } = require("../utils/responseHelper");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");

// Helper to get branch ID from slug
const getBranchIdFromSlug = async (slug) => {
    const branch = await Branch.findOne({ slug: slug, is_active: true }).select('_id').lean();
    return branch ? branch._id : null;
};

// API for Restaurant Details
const getBranchDetailsByslug = async (req, res) => {
    try {
        const { slug } = req.params;

        const branch = await Branch.findOne({ slug: slug, is_active: true }).lean();
        // Settings are embedded, so we already have them in branch.settings

        if (!branch) {
            return sendResponse(res, 404, "Branch not found");
        }

        return sendResponse(res, 200, "Branch details fetched successfully", branch);
    } catch (error) {
        console.error("Get Restaurant Details By Branch Slug Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};


const getCategoriesbyIdForMenu = async (req, res) => {
    try {
        const { branchId } = req.params;

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: "Branch ID is required",
            });
        }

        const category = await Category.find({
            branch_id: branchId,
            is_active: true
        })
        .sort({ display_order: 1 })
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

        // Get all categories for this branch
        const branchCategories = await Category.find({ branch_id: branchId }).select('_id').lean();
        const categoryIds = branchCategories.map(c => c._id);

        // Get Menu Items
        const menuItems = await MenuItem.find({
            category_id: { $in: categoryIds }
        })
        .sort({ is_available: -1 }) 
        .populate({ path: 'category_id', select: 'name' })
        .lean();

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

        // In the new model, SpecialTag has `menu_items` array of References. 
        // We populate that array.
        const specialMenuItems = await SpecialTag.find({ branch_id: branchId })
            .sort({ display_order: 1 })
            .populate({
                path: 'menu_items',
                model: 'MenuItem', 
            })
            .lean();

        // Filter out tags that might have empty menu_items if desired, or just map
        const finalData = specialMenuItems.map(tag => ({
            id: tag._id,
            title: tag.title,
            special_items: tag.menu_items
        }));

        return sendResponse(res, 200, "Special menu items fetched successfully", finalData);
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
            valid_to: { $gte: now }
        }).lean();

        return sendResponse(res, 200, "Carousel items fetched successfully", carasoulMenuItems);
    } catch (error) {
        console.error("Get Carasoul Menu Items By Branch ID Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};


// API for logging menu access when QR code is scanned
const logMenuAccess = async (req, res) => {
    try {
        const { slug } = req.params;

        // Find branch by slug
        const branch = await Branch.findOne({ slug: slug, is_active: true }).select('_id');

        if (!branch) {
            return sendResponse(res, 404, "Branch not found");
        }

        // Create log entry
        const logEntry = new MenuAccessLog({
            branch_id: branch._id,
            accessed_at: new Date()
        });
        await logEntry.save();

        return sendResponse(res, 201, "Menu access logged successfully", {
            log_id: logEntry._id,
            branch_id: logEntry.branch_id,
            accessed_at: logEntry.accessed_at
        });
    } catch (error) {
        console.error("Log Menu Access Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};

module.exports = {
    getBranchDetailsByslug,
    getCategoriesbyIdForMenu,
    getMenuItemsByBranchIdForMenu,
    getSpecialMenuItemsByBranchId,
    getCarasoulByBranchId,
    logMenuAccess
};
