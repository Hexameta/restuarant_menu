const { Ads } = require("../model/adsModal");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");
const { sendResponse } = require("../utils/responseHelper");

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

    const ad = new Ads({
      branch_id,
      title,
      ad_type,
      valid_from,
      valid_to,
      image_url,
      is_admin: is_admin || false,
    });
    
    await ad.save();

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
    const skip = (page - 1) * limit;

    const filter = { branch_id, is_admin: false, is_expired: false };

    const [count, rows] = await Promise.all([
      Ads.countDocuments(filter),
      Ads.find(filter)
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

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
    const branch_id = req.user.branchId; 
    const now = new Date();

    const ads = await Ads.find({
      branch_id,
      valid_from: { $lte: now },
      valid_to: { $gte: now },
    }).sort({ _id: -1 }).lean();

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
    const ad = await Ads.findById(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

    // Force strict branch check if needed, but current logic mimics previous behavior
    // which just set req.body.branch_id. 
    // Mongoose update:
    req.body.branch_id = branchId;
    
    Object.assign(ad, req.body);
    await ad.save();

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
    const ad = await Ads.findByIdAndDelete(id);

    if (!ad) {
      return res.status(404).json({
        success: false,
        message: "Ad not found",
      });
    }

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

    const filter = {
      image_url: fileName,
    };

    // If editing — exclude the current category
    if (id) {
      filter._id = { $ne: id };
    }

    const exists = await Ads.findOne(filter).select('_id').lean();

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
