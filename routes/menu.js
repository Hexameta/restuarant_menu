const express = require("express");
const router = express.Router();

const {
  getFullMenuBySlug,
  getBranchDetailsByslug,
  getCategoriesbyIdForMenu,
  getMenuItemsByBranchIdForMenu,
  getSpecialMenuItemsByBranchId,
  getCarasoulByBranchId,
  logMenuAccess,
} = require("../controller/menuController");

// Extremely optimized full payload
router.get("/full/:slug", getFullMenuBySlug);

// old backups
router.get("/:slug", getBranchDetailsByslug);
router.get("/category/:branchId", getCategoriesbyIdForMenu);
router.get("/menu/:branchId", getMenuItemsByBranchIdForMenu);
router.get("/special-item/:branchId", getSpecialMenuItemsByBranchId);
router.get("/carasoul/:branchId", getCarasoulByBranchId);
router.get("/access-log/:slug", logMenuAccess);

module.exports = router;
