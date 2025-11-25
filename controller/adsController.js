const { Ads } = require("../model/adsModal");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const { Op } = require("sequelize");

/**
 * CREATE AD
 */
const createAd = async (req, res) => {
  try {
    const {
      branch_id,
      title,
      ad_type,
      valid_from,
      valid_to,
      imageUrl,
      isAdmin,
    } = req.body;

    if (!branch_id || !imageUrl || !ad_type) {
      return res.status(400).json({
        success: false,
        message: "branch_id, imageUrl, ad_type are required",
      });
    }

    const ad = await Ads.create({
      branch_id,
      title,
      ad_type,
      valid_from,
      valid_to,
      imageUrl,
      isAdmin: isAdmin || false,
    });

    return res.status(201).json({
      success: true,
      message: "Ad created successfully",
      data: ad,
    });
  } catch (error) {
    console.log("Create Ad Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

/**
 * GET ADS (paginated)
 */
const getAds = async (req, res) => {
  try {
    const { branch_id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ads.findAndCountAll({
      where: { branch_id },
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

/**
 * GET ACTIVE ADS FOR FRONTEND DISPLAY
 */
const getActiveAds = async (req, res) => {
  try {
    const { branch_id } = req.params;

    const now = new Date();

    const ads = await Ads.findAll({
      where: {
        branch_id,
        valid_from: { [Op.lte]: now },
        valid_to: { [Op.gte]: now },
      },
      order: [["id", "DESC"]],
    });

    return res.status(200).json({ success: true, data: ads });
  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

/**
 * UPDATE AD
 */
const updateAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ads.findByPk(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    await ad.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Ad updated successfully",
      data: ad,
    });
  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};

/**
 * DELETE AD
 */
const deleteAd = async (req, res) => {
  try {
    const { id } = req.params;
    const ad = await Ads.findByPk(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    await ad.destroy();

    return res.status(200).json({
      success: true,
      message: "Ad deleted successfully",
    });
  } catch (error) {
    return res.status(500).json(errorHandler(error));
  }
};
module.exports = {
  createAd,
  getAds,
  updateAd,
  deleteAd,
  getActiveAds
};
