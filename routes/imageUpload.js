const express = require("express");
const router = express.Router();
const {
  upload,
  uploadImage,
  deletePdf,
  uploadPdf,
} = require("../controller/ImageController");
const { deleteImage } = require("../controller/ImageController");

router.post("/upload", upload.single("image"), uploadImage);
router.post("/delete", deleteImage);
router.post("/upload-pdf", upload.single("pdf"), uploadPdf);
router.post("/delete-pdf", deletePdf);
module.exports = router;