const bcrypt = require("bcrypt");
// const { Restaurant, Branch, User, OTPValidate } = require("../model");

const { User } = require("../model/userModel");
const { OTPValidate } = require("../model/otpValidateModel");
const { Restaurant } = require("../model/resturantModel");
const {
  signupValidator,
  verifyOTPValidator,
} = require("../utils/joiValidator.js/restaurantValidator");
const {
  generateOTP,
  getOTPExpiration,
  sendOTPEmail,
} = require("../utils/otpHandler");
const errorHandler = require("../error/joiErrorHandler/joiErrorHanlder");

/**
 * Signup Controller
 * Handles restaurant and branch registration with OTP sending
 *
 * Flow:
 * 1. If restaurant_id provided -> Create branch under existing restaurant
 * 2. If no restaurant_id -> Create new restaurant and branch
 * 3. Generate and send OTP
 * 4. Store temporary data for verification
 */
const signup = async (req, res) => {
  try {
    // Validate request body
    const { error } = signupValidator(req.body);
    if (error) {
      const errorResponse = errorHandler(error);
      return res.status(400).json(errorResponse);
    }

    const {
      email,
      password,
      restaurant_id,
      branch_name,
      branch_phone,
      country,
      state,
      district,
      city,
      place,
      restaurant_name,
      restaurant_phone,
      restaurant_type,
      logo,
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        status: "error",
        success: false,
        message: "User with this email already exists",
      });
    }

    // If restaurant_id provided, verify it exists
    if (restaurant_id) {
      const restaurant = await Restaurant.findByPk(restaurant_id);
      if (!restaurant) {
        return res.status(404).json({
          status: "error",
          success: false,
          message: "Selected restaurant not found",
        });
      }
    }

    // Check if OTP already exists for this email
    const existingOTP = await OTPValidate.findOne({ where: { email } });
    if (existingOTP) {
      // Delete existing OTP
      await existingOTP.destroy();
    }

    // Generate OTP
    const otp = generateOTP();
    const expirationTime = getOTPExpiration();

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Store OTP with registration data
    await OTPValidate.create({
      email,
      otp,
      is_validated: false,
      expiration_time: expirationTime,
    });

    // Store temporary registration data in session or cache
    // For now, we'll send it back in response (In production, use Redis or session)
    const tempData = {
      email,
      hashedPassword,
      restaurant_id,
      branch_name,
      branch_phone,
      country,
      state,
      district,
      city,
      place,
      restaurant_name,
      restaurant_phone,
      restaurant_type,
      logo,
    };

    // Send OTP email
    const emailSent = await sendOTPEmail(email, otp);
    if (!emailSent) {
      return res.status(500).json({
        status: "error",
        success: false,
        message: "Failed to send OTP email. Please try again.",
      });
    }

    // Return success response with OTP (for development only)
    return res.status(200).json({
      status: "success",
      success: true,
      message: "OTP sent successfully to your email",
      data: {
        email,
        otp, // Remove this in production
        expires_in: "10 minutes",
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    const errorResponse = errorHandler(error);
    return res.status(500).json(errorResponse);
  }
};

/**
 * Verify OTP Controller
 * Verifies OTP and creates restaurant/branch/user records
 *
 * Flow:
 * 1. Validate OTP
 * 2. Check expiration
 * 3. Create restaurant (if new)
 * 4. Create branch
 * 5. Create user
 * 6. Delete OTP record
 */
const verifyOTP = async (req, res) => {
  try {
    // Validate request body
    const { error } = verifyOTPValidator(req.body);
    if (error) {
      const errorResponse = errorHandler(error);
      return res.status(400).json(errorResponse);
    }

    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await OTPValidate.findOne({ where: { email } });

    if (!otpRecord) {
      return res.status(404).json({
        status: "error",
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // Check if OTP is expired
    if (new Date() > new Date(otpRecord.expiration_time)) {
      await otpRecord.destroy();
      return res.status(400).json({
        status: "error",
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (otpRecord.otp !== parseInt(otp)) {
      return res.status(400).json({
        status: "error",
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // TODO: In production, retrieve tempData from session/cache
    // For now, you need to pass the registration data again or store in session
    // This is a limitation - you should implement session management

    // Since we need the original signup data, let's modify the approach
    // The client should send the complete data again with OTP
    return res.status(400).json({
      status: "error",
      success: false,
      message:
        "Please provide complete registration data with OTP for verification",
      note: "This endpoint needs to be called with full registration data. See verifyOTPComplete function.",
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    const errorResponse = errorHandler(error);
    return res.status(500).json(errorResponse);
  }
};

/**
 * Complete Verify OTP Controller
 * This version accepts both OTP and registration data
 */
const verifyOTPComplete = async (req, res) => {
  try {
    // Validate OTP
    const { error: otpError } = verifyOTPValidator({
      email: req.body.email,
      otp: req.body.otp,
    });
    if (otpError) {
      const errorResponse = errorHandler(otpError);
      return res.status(400).json(errorResponse);
    }

    // Validate full signup data
    const { error: signupError } = signupValidator(req.body);
    if (signupError) {
      const errorResponse = errorHandler(signupError);
      return res.status(400).json(errorResponse);
    }

    const {
      email,
      otp,
      password,
      restaurant_id,
      branch_name,
      branch_phone,
      country,
      state,
      district,
      city,
      place,
      restaurant_name,
      restaurant_phone,
      restaurant_type,
      logo,
    } = req.body;

    // Find and verify OTP
    const otpRecord = await OTPValidate.findOne({ where: { email } });

    if (!otpRecord) {
      return res.status(404).json({
        status: "error",
        success: false,
        message: "OTP not found. Please request a new OTP.",
      });
    }

    // Check expiration
    if (new Date() > new Date(otpRecord.expiration_time)) {
      await otpRecord.destroy();
      return res.status(400).json({
        status: "error",
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    // Verify OTP
    if (otpRecord.otp !== parseInt(otp)) {
      return res.status(400).json({
        status: "error",
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    let finalRestaurantId = restaurant_id;
    let newRestaurant = null;
    let newBranch = null;
    let newUser = null;

    // Start transaction
    const transaction = await Restaurant.sequelize.transaction();

    try {
      // If no restaurant_id provided, create new restaurant
      if (!restaurant_id) {
        newRestaurant = await Restaurant.create(
          {
            name: restaurant_name,
            email: email,
            phone: restaurant_phone,
            logo: logo || null,
            type: restaurant_type,
            status: "pending",
          },
          { transaction }
        );

        finalRestaurantId = newRestaurant.id;
      }

      // Generate unique slug for branch
      const slugBase = `${branch_name
        .toLowerCase()
        .replace(/\s+/g, "-")}-${country.substring(0, 2).toLowerCase()}`;
      const randomDigits = Math.floor(100 + Math.random() * 900);
      const slug = `${slugBase}-${randomDigits}`;

      // Create branch
      newBranch = await Branch.create(
        {
          restaurant_id: finalRestaurantId,
          name: branch_name,
          phone: branch_phone,
          country,
          state,
          district,
          city,
          place,
          slug,
          status: "pending",
          isActive: true,
        },
        { transaction }
      );

      // Create user
      newUser = await User.create(
        {
          branch_id: newBranch.id,
          username: email.split("@")[0], // Generate username from email
          email,
          password: hashedPassword,
        },
        { transaction }
      );

      // Delete OTP record
      await otpRecord.destroy({ transaction });

      // Commit transaction
      await transaction.commit();

      // Return success response
      return res.status(201).json({
        status: "success",
        success: true,
        message: "Registration completed successfully",
        data: {
          restaurant: newRestaurant
            ? {
                id: newRestaurant.id,
                name: newRestaurant.name,
                email: newRestaurant.email,
                phone: newRestaurant.phone,
                type: newRestaurant.type,
                status: newRestaurant.status,
              }
            : { id: finalRestaurantId },
          branch: {
            id: newBranch.id,
            name: newBranch.name,
            phone: newBranch.phone,
            slug: newBranch.slug,
            location: {
              country,
              state,
              district,
              city,
              place,
            },
            status: newBranch.status,
          },
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
          },
        },
      });
    } catch (txError) {
      // Rollback transaction on error
      await transaction.rollback();
      throw txError;
    }
  } catch (error) {
    console.error("Verify OTP Complete error:", error);
    const errorResponse = errorHandler(error);
    return res.status(500).json(errorResponse);
  }
};

module.exports = {
  signup,
  verifyOTP,
  verifyOTPComplete,
};
