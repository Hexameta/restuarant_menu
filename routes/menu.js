const express = require("express");
const router = express.Router();

const { getBranchDetailsByslug, getCategoriesbyIdForMenu, getMenuItemsByBranchIdForMenu, getSpecialMenuItemsByBranchId, getCarasoulByBranchId, logMenuAccess } = require("../controller/menuController");

router.get("/:slug", getBranchDetailsByslug);
router.get("/category/:branchId", getCategoriesbyIdForMenu);
router.get("/menu/:branchId", getMenuItemsByBranchIdForMenu);
router.get("/special-item/:branchId", getSpecialMenuItemsByBranchId);
router.get("/carasoul/:branchId", getCarasoulByBranchId);
router.post("/access-log/:slug", logMenuAccess);


module.exports = router;
