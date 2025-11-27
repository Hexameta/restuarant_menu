const { Ads } = require("../model/adsModal");
const { Category } = require("../model/categoryModel");
const { MenuItem } = require("../model/menuItemModel");
const { Branch, Settings } = require("../model/resturantModel");
const { SpecialTag, SpecialTagItem } = require("../model/specialTagModel");


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
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
        }

        return res.status(200).json({
            success: true,
            data: branch,
        });
    } catch (error) {
        console.error("Get Restaurant Details By Branch Slug Error:", error);
        return res.status(500).json(errorHandler(error)); // Assuming errorHandler is available
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

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found for this branch",
            });
        }

        return res.status(200).json({
            success: true,
            data: category,
        });
    } catch (error) {
        console.error("Get Category By Branch Slug Error:", error);
        return res.status(500).json(errorHandler(error));
    }
};

// API for Menu Items (fetching all menu items for a specific branch)
const getMenuItemsByBranchIdForMenu = async (req, res) => {
    try {
        const {
            branchId
        } = req.params;

        if (!branchId) {
            return res.status(404).json({
                success: false,
                message: "Branch not found",
            });
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

        if (!menuItems || menuItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No menu items found for this branch",
            });
        }

        return res.status(200).json({
            success: true,
            data: menuItems,
        });
    } catch (error) {
        console.error("Get Menu Items By Branch Slug Error:", error);
        return res.status(500).json(errorHandler(error));
    }
};

const getSpecialMenuItemsByBranchId = async (req, res) => {
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


        if (!specialMenuItems || specialMenuItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No special menu items found for this branch",
            });
        }


        const finalData = specialMenuItems.map(tag => ({
            id: tag.id,
            title: tag.title,
            special_items: tag.special_items
                .map(item => item.menu_item)         
        }));

        return res.status(200).json({
            success: true,
            data: finalData,
        });
    } catch (error) {
        console.error("Get Special Menu Items By Branch ID Error:", error);
        return res.status(500).json(errorHandler(error));
    }
};

const getCarasoulByBranchId = async (req, res) => {
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

        const carasoulMenuItems = await Ads.findAll({
            where: {
                branch_id: branchId
            }
        });

        if (!carasoulMenuItems || carasoulMenuItems.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No carasoul menu items found for this branch",
            });
        }

        return res.status(200).json({
            success: true,
            data: carasoulMenuItems,
        });
    } catch (error) {
        console.error("Get Carasoul Menu Items By Branch ID Error:", error);
        return res.status(500).json(errorHandler(error));
    }
};


module.exports = {
    getBranchDetailsByslug,
    getCategoriesbyIdForMenu,
    getMenuItemsByBranchIdForMenu,
    getSpecialMenuItemsByBranchId,
    getCarasoulByBranchId
};
