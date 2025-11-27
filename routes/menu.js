const express = require("express");
const router = express.Router();

const { getBranchDetailsByslug, getCategoriesbyIdForMenu, getMenuItemsByBranchIdForMenu, getSpecialMenuItemsByBranchId, getCarasoulByBranchId } = require("../controller/menuController");

router.get("/:slug", getBranchDetailsByslug);
router.get("/category/:branchId", getCategoriesbyIdForMenu);
router.get("/menu/:branchId", getMenuItemsByBranchIdForMenu);
router.get("/special-item/:branchId", getSpecialMenuItemsByBranchId);
router.get("/carasoul/:branchId", getCarasoulByBranchId);


module.exports = router;
