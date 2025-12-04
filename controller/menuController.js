const { Ads } = require("../model/adsModal");
const { Category } = require("../model/categoryModel");
const { MenuItem } = require("../model/menuItemModel");
const { Branch, Settings } = require("../model/resturantModel");
const { SpecialTag, SpecialTagItem } = require("../model/specialTagModel");
const { sendResponse } = require("../utils/responseHelper");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");


// Helper to get branch ID from slug
const getBranchIdFromSlug = async (slug) => {
    const branch = await Branch.findOne({
        where: {
            slug: slug,
            is_active: true
        },
        attributes: ['id']
    });
    return branch ? branch.id : null;
};

// API for Restaurant Details (assuming a restaurant has multiple branches, and we fetch by branch slug)
const getBranchDetailsByslug = async (req, res) => {
    try {
        const {
            slug
        } = req.params;

        const branch = await Branch.findOne({
            where: {
                slug: slug,
                is_active: true
            },
            include: [{
                model: Settings,
                as: 'settings'
            }]
        });

        if (!branch) {
            return sendResponse(res, 404, "Branch not found");
        }

        return sendResponse(res, 200, "Branch details fetched successfully", branch);
    } catch (error) {
        console.error("Get Restaurant Details By Branch Slug Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};


// Refactored Category API to use branchSlug and then categoryId (or category slug if Categories are unique per branch)
// Assuming categories are unique per branch and `slug` refers to the category's own slug,
// but we first find the branch by its slug.
const getCategoriesbyIdForMenu = async (req, res) => {
    try {
        const {
            branchId
        } = req.params;

        if (!branchId) {
            return res.status(400).json({
                success: false,
                message: "Branch ID is required",
            });
        }

        const category = await Category.findAll({
            where: {
                branch_id: branchId,
                is_active: true
            },
        });

        return sendResponse(res, 200, "Categories fetched successfully", category);
    } catch (error) {
        console.error("Get Category By Branch Slug Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};

// API for Menu Items (fetching all menu items for a specific branch)
const getMenuItemsByBranchIdForMenu = async (req, res) => {
    try {
        const {
            branchId
        } = req.params;

        if (!branchId) {
            return sendResponse(res, 404, "Branch not found");
        }

        const menuItems = await MenuItem.findAll({
            include: [{
                model: Category,
                as: 'category',
                where: {
                    branch_id: branchId
                },
                attributes: []
            }]
        });

        return sendResponse(res, 200, "Menu items fetched successfully", menuItems);
    } catch (error) {
        console.error("Get Menu Items By Branch Slug Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};

const getSpecialMenuItemsByBranchId = async (req, res) => {
    try {
        const {
            branchId
        } = req.params;

        if (!branchId) {
            return sendResponse(res, 400, "Branch ID is required");
        }

        const specialMenuItems = await SpecialTag.findAll({
            where: { branch_id: branchId },
            order: [["display_order", "ASC"]],
            include: [
                {
                    model: SpecialTagItem,
                    as: "special_items",
                    include: [
                        {
                            model: MenuItem,
                            as: "menu_item"
                        }
                    ]
                }
            ]
        });


        const finalData = specialMenuItems.map(tag => ({
            id: tag.id,
            title: tag.title,
            special_items: tag.special_items
                .map(item => item.menu_item)         
        }));

        return sendResponse(res, 200, "Special menu items fetched successfully", finalData);
    } catch (error) {
        console.error("Get Special Menu Items By Branch ID Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};

const getCarasoulByBranchId = async (req, res) => {
    try {
        const {
            branchId
        } = req.params;

        if (!branchId) {
            return sendResponse(res, 400, "Branch ID is required");
        }

        const carasoulMenuItems = await Ads.findAll({
            where: {
                branch_id: branchId
            }
        });

        return sendResponse(res, 200, "Carousel items fetched successfully", carasoulMenuItems);
    } catch (error) {
        console.error("Get Carasoul Menu Items By Branch ID Error:", error);
        return sendResponse(res, 500, "Internal Server Error", errorHandler(error));
    }
};


module.exports = {
    getBranchDetailsByslug,
    getCategoriesbyIdForMenu,
    getMenuItemsByBranchIdForMenu,
    getSpecialMenuItemsByBranchId,
    getCarasoulByBranchId
};
