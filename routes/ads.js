const express = require("express");
const router = express.Router();

const {
  createAd,
  getAds,
  updateAd,
  deleteAd,
  getActiveAds,
} = require("../controller/adsController");

// Admin & merchant UI
router.post("/", createAd);
router.get("/", getAds);
router.put("/:id", updateAd);
router.delete("/:id", deleteAd);

// Customer facing Banner / Carousel
router.get("/active", getActiveAds);

module.exports = router;
