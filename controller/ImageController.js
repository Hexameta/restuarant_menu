const multer = require("multer");
const sharp = require("sharp");
const errorHandler = require("../error/joiErrorHandler/joiErrorHandler");
const {
  checkCategoryImageExistsDB,
} = require("../controller/categoryController");
const { checkMenuItemImageExistsDB } = require("./menuItemController");
const { checkAdsImageExistsDB } = require("./adsController");
const { checkRestaurantsImageExistDB } = require("./restaurantController");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const r2 = require("../config/r2Client");

const upload = multer({ storage: multer.memoryStorage() });

// =============================
// IMAGE COMPRESSION HELPER
// =============================
const compressUntilTarget = async (buffer) => {
  let quality = 80;
  let output = buffer;

  // Step 1 — reduce JPEG quality
  while (output.length > 2 * 1024 * 1024 && quality > 10) {
    output = await sharp(buffer).jpeg({ quality }).toBuffer();
    quality -= 10;
  }

  // Step 2 — resize width if still too large
  let width = 1800;
  while (output.length > 2 * 1024 * 1024 && width > 600) {
    output = await sharp(buffer)
      .resize({ width })
      .jpeg({ quality: 70 })
      .toBuffer();

    width -= 200;
  }

  // Prevent over-compression (<300KB)
  if (output.length < 300 * 1024) {
    return buffer; // restore original
  }

  return output;
};

// =============================
// UPLOAD IMAGE TO Cloud flare
// =============================
const uploadImage = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "Image file is required",
      });
    }

    // Convert to webp buffer
    let buffer = await sharp(file.buffer).webp({ quality: 85 }).toBuffer();

    if (buffer.length > 2 * 1024 * 1024) {
      buffer = await sharp(file.buffer)
        .resize({ width: 1800 })
        .webp({ quality: 70 })
        .toBuffer();
    }

    if (buffer.length > 2 * 1024 * 1024) {
      buffer = await sharp(file.buffer)
        .resize({ width: 1400 })
        .webp({ quality: 60 })
        .toBuffer();
    }

    // safer filename
    const fileName = `uploads/${Date.now()}-${file.originalname}`.replace(
      /\.(jpg|jpeg|png|gif|webp)/gi,
      ".webp",
    );

    // Upload to R2
    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: fileName,
        Body: buffer,
        ContentType: "image/webp",
      }),
    );

    // Public URL
    const imageUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url: imageUrl,
      sizeKB: Math.round(buffer.length / 1024),
      fileName,
    });
  } catch (error) {
    console.log("Upload Image Error:", error);
    return res.status(500).json({
      success: false,
      message: "Image upload failed",
      error: error.message,
    });
  }
};

const deleteImage = async (req, res) => {
  try {
    const { fileName, tableName, id } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required",
      });
    }
    if (tableName) {
      let response = null;
      if (tableName == "category") {
        response = await checkCategoryImageExistsDB(fileName, id);
      }
      if (tableName == "menu_item") {
        response = await checkMenuItemImageExistsDB(fileName, id);
      }
      if (tableName == "ads") {
        response = await checkAdsImageExistsDB(fileName, id);
      }
      if (tableName == "restaurants") {
        response = await checkRestaurantsImageExistDB(fileName, id);
      }
      if (response?.exists) {
        return res.status(200).json({
          success: true,
          message: "It's a Shared Image, removed successfully",
        });
      }
    }
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([fileName]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete image",
        error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Image deleted successfully",
    });
  } catch (error) {
    console.log("Delete Image Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

const uploadPdf = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        message: "PDF file is required",
      });
    }

    const MAX_PDF_SIZE_MB = 5;
    const MAX_PDF_SIZE_BYTES = MAX_PDF_SIZE_MB * 1024 * 1024; // 5 MB

    if (file.buffer.length > MAX_PDF_SIZE_BYTES) {
      return res.status(400).json({
        success: false,
        message: `PDF file size exceeds the ${MAX_PDF_SIZE_MB}MB limit`,
      });
    }

    // PDF compression is more complex than image compression and typically requires
    // specialized libraries (e.g., 'pdf-lib' for programmatic modifications) or
    // external services. For this implementation, we will upload the PDF as-is.
    // If further compression is needed, consider adding a specific PDF processing step here.

    // Generate unique filename, ensuring .pdf extension
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname.replace(/\.[^/.]+$/, "")}.pdf`;

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, file.buffer, {
        upsert: true,
        contentType: "application/pdf",
      });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "PDF upload failed",
        error,
      });
    }

    const { data: publicData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return res.status(201).json({
      success: true,
      message: "PDF uploaded successfully",
      url: publicData.publicUrl,
      sizeKB: Math.round(file.buffer.length / 1024),
      fileName,
    });
  } catch (error) {
    console.log("Upload PDF Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

const deletePdf = async (req, res) => {
  try {
    const { fileName } = req.body;

    if (!fileName) {
      return res.status(400).json({
        success: false,
        message: "fileName is required",
      });
    }

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .remove([fileName]);

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Failed to delete PDF",
        error,
      });
    }

    return res.status(200).json({
      success: true,
      message: "PDF deleted successfully",
    });
  } catch (error) {
    console.log("Delete PDF Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};

async function deleteImageDirectly(fileName) {
  if (!fileName) return;
  supabase.storage
    .from(process.env.SUPABASE_BUCKET)
    .remove([fileName])
    .then(() => console.log("✔ Image deleted in background:", fileName))
    .catch((err) => console.log("❗ Async delete failed:", err.message));
}

module.exports = {
  upload,
  uploadImage,
  deleteImage,
  deleteImageDirectly,
  uploadPdf,
  deletePdf,
};
