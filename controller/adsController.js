const { Ads } = require("../model/adsModal");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const { Op } = require("sequelize");
const jwt = require('jsonwebtoken');

/**
 * CREATE AD
 */
const createAd = async (req, res) => {
  try {
    const {
      title,
      ad_type,
      valid_from,
      valid_to,
      image_url,
      is_admin,
    } = req.body;

     const branch_id = req.user.branchId; 

    if (!branch_id || !image_url || !ad_type) {
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
      image_url,
      is_admin: is_admin || false,
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
    const branch_id = req.user.branchId; 
    

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows } = await Ads.findAndCountAll({
      where: { branch_id,is_admin:false,is_expired:false },
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
    // const { branch_id } = req.params;

    const branch_id = req.user.branchId; 

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
    const {branchId} = req.user
    const { id } = req.params;
    const ad = await Ads.findByPk(id);

    req.body.branch_id = branchId
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


const checkAdsImageExistsDB = async (fileName, id = null) => {
  try {
    if (!fileName) {
      return { success: false, exists: false };
    }

    const whereCondition = {
      imageUrl: fileName,
    };

    // If editing — exclude the current category
    if (id) {
      whereCondition.id = { [Op.ne]: id };  // id != this record
    }

    const exists = await ad.findOne({
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
  createAd,
  getAds,
  updateAd,
  deleteAd,
  getActiveAds,
  checkAdsImageExistsDB
};
