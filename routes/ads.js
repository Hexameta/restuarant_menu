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
router.get("/:branch_id", getAds);
router.put("/:id", updateAd);
router.delete("/:id", deleteAd);

// Customer facing Banner / Carousel
router.get("/active/:branch_id", getActiveAds);

module.exports = router;
