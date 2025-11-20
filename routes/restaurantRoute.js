const express = require("express");
const router = express.Router();
const {
  signup,
  verifyOTP,
  verifyOTPComplete,
} = require("../controller/restaurantController");

/**
 * @route   POST /api/restaurants/signup
 * @desc    Register new restaurant/branch and send OTP
 * @access  Public
 */
router.post("/signup", signup);

/**
 * @route   POST /api/restaurants/verify-otp
 * @desc    Verify OTP and complete registration
 * @access  Public
 * @note    Use /verify-otp-complete instead - this requires session management
 */
router.post("/verify-otp", verifyOTP);

/**
 * @route   POST /api/restaurants/verify-otp-complete
 * @desc    Verify OTP with complete registration data
 * @access  Public
 * @note    Recommended approach - send full data with OTP
 */
router.post("/verify-otp-complete", verifyOTPComplete);

module.exports = router;
