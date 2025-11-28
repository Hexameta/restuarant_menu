const { SpecialTag, SpecialTagItem } = require("../model/specialTagModel");
const { Branch } = require("../model/resturantModel");
const { MenuItem } = require("../model/menuItemModel");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const { Op } = require("sequelize");

// =============================
// CREATE SPECIAL TAG
// =============================
const createSpecialTag = async (req, res) => {
  try {
    const { branch_id, title, is_active, display_order } = req.body;

    if (!branch_id || !title) {
      return res.status(400).json({
        success: false,
        message: "branch_id and title are required",
      });
    }

    const branch = await Branch.findByPk(branch_id);
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: "Branch not found",
      });
    }

    // DUPLICATE CHECK CASE INSENSITIVE
    const exists = await SpecialTag.findOne({
      where: {
        branch_id,
        title: { [Op.iLike]: title.trim() }
      }
    });

    if (exists) {
      return res.status(409).json({
        success: false,
        message: "Special tag already exists",
      });
    }

    const tag = await SpecialTag.create({
      branch_id,
      title,
      is_active: is_active ?? true,
      display_order: display_order || 0
    });

    return res.status(201).json({
      success: true,
      message: "Special tag created successfully",
      data: tag,
    });

  } catch (error) {
    console.log("Create Special Tag Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};


// =============================
// GET SPECIAL TAGS
// =============================
const getSpecialTags = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const tags = await SpecialTag.findAll({
      where: { branch_id },
      order: [["display_order", "ASC"]],
    });

    return res.status(200).json({
      success: true,
      data: tags,
    });

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
    const tag = await SpecialTag.findByPk(id);

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Special tag not found",
      });
    }

    const { title } = req.body;

    if (title && title.trim()) {
      const exists = await SpecialTag.findOne({
        where: {
          title: { [Op.iLike]: title.trim() },
          branch_id: tag.branch_id,
          id: { [Op.not]: id }
        }
      });
      if (exists) {
        return res.status(409).json({
          success: false,
          message: "Another tag with this name already exists",
        });
      }
    }

    await tag.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Special tag updated successfully",
      data: tag,
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};


// =============================
// DELETE SPECIAL TAG
// =============================
const deleteSpecialTag = async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await SpecialTag.findByPk(id);
    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Special tag not found",
      });
    }

    await SpecialTagItem.destroy({ where: { special_tag_id: id } });
    await tag.destroy();

    return res.status(200).json({
      success: true,
      message: "Special tag deleted successfully",
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};


// =============================
// GET ITEMS ASSIGNED TO TAG
// =============================
const getSpecialTagItems = async (req, res) => {
  try {
    const { tag_id } = req.params;

    const items = await SpecialTagItem.findAll({
      where: { special_tag_id: tag_id },
      include: [
        { model: MenuItem, as: "menu_item", attributes: ["id", "name", "image_url"] }
      ]
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
// ASSIGN ITEMS TO TAG
// =============================
const assignSpecialItems = async (req, res) => {
  try {
    const { special_tag_id, menu_item_ids } = req.body;

    if (!special_tag_id || !menu_item_ids?.length) {
      return res.status(400).json({
        success: false,
        message: "special_tag_id & menu_item_ids required",
      });
    }

    const insertData = menu_item_ids.map((menu_item_id) => ({
      special_tag_id,
      menu_item_id,
    }));

    await SpecialTagItem.bulkCreate(insertData, {
      ignoreDuplicates: true,
    });

    return res.status(200).json({
      success: true,
      message: "Items assigned successfully",
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};


// =============================
// REMOVE ITEM FROM TAG
// =============================
const removeSpecialItem = async (req, res) => {
  try {
    const { special_tag_id, menu_item_id } = req.body;

    if (!special_tag_id || !menu_item_id) {
      return res.status(400).json({
        success: false,
        message: "special_tag_id & menu_item_id are required",
      });
    }

    await SpecialTagItem.destroy({
      where: { special_tag_id, menu_item_id },
    });

    return res.status(200).json({
      success: true,
      message: "Item removed from tag",
    });

  } catch (error) {
    return res.status(500).json(errorHandler(error));
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
