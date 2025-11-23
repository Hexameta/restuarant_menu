const express = require("express");
const router = express.Router();
const {
  upload,
  uploadImage,
} = require("../controller/ImageController");
const { deleteImage } = require("../controller/ImageController");

router.post("/upload", upload.single("image"), uploadImage);
router.post("/delete", deleteImage);
module.exports = router;