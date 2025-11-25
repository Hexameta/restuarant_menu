const multer = require("multer");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");
const {checkCategoryImageExistsDB} = require("../controller/categoryController");
const { checkMenuItemImageExistsDB } = require("./menuItemController");
// =============================
// SUPABASE CLIENT
// =============================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

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
// UPLOAD IMAGE TO SUPABASE
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
    let buffer = await sharp(file.buffer)
      .webp({ quality: 85 })
      .toBuffer();

    // If still above 2MB → further compress
    if (buffer.length > 2 * 1024 * 1024) {
      buffer = await sharp(file.buffer)
        .resize({ width: 1800 })
        .webp({ quality: 70 })
        .toBuffer();
    }

    // Final safety
    if (buffer.length > 2 * 1024 * 1024) {
      buffer = await sharp(file.buffer)
        .resize({ width: 1400 })
        .webp({ quality: 60 })
        .toBuffer();
    }

    // Generate unique filename — MAKE IT WEBP
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}.webp`
      .replace(/\.jpg|\.jpeg|\.png|\.gif|\.webp/gi, ".webp");

    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, buffer, {
        upsert: true,
        contentType: "image/webp",
      });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Supabase upload failed",
        error,
      });
    }

    const { data: publicData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url: publicData.publicUrl,
      sizeKB: Math.round(buffer.length / 1024),
      fileName,
    });

  } catch (error) {
    console.log("Upload Image Error:", error);
    return res.status(500).json(errorHandler(error));
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
    if(tableName){
     let response = null
      if(tableName == "category"){
      response = await checkCategoryImageExistsDB(fileName,id)
      }
      if(tableName == "menu_item"){
      response = await checkMenuItemImageExistsDB(fileName,id)

      }
     if(response?.exists){
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


module.exports = {
  upload,
  uploadImage,
  deleteImage
};
