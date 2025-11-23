const multer = require("multer");
const sharp = require("sharp");
const { createClient } = require("@supabase/supabase-js");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");

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

    let finalBuffer = file.buffer;

    // Only compress if >3MB
    if (file.size > 3 * 1024 * 1024) {
      finalBuffer = await compressUntilTarget(file.buffer);
    }

    // Generate unique filename
    const timestamp = Date.now();
    const fileName = `${timestamp}-${file.originalname}`;

    // Upload to Supabase
    const { error } = await supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .upload(fileName, finalBuffer, {
        upsert: true,
        contentType: file.mimetype,
      });

    if (error) {
      return res.status(500).json({
        success: false,
        message: "Supabase upload failed",
        error,
      });
    }

    // Get public URL
    const { data: publicData } = supabase.storage
      .from(process.env.SUPABASE_BUCKET)
      .getPublicUrl(fileName);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url: publicData.publicUrl,
      sizeKB: Math.round(finalBuffer.length / 1024),
      fileName,
    });
  } catch (error) {
    console.log("Upload Image Error:", error);
    return res.status(500).json(errorHandler(error));
  }
};


const deleteImage = async (req, res) => {
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
