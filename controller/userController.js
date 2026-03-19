const { User } = require("../model/userModel");
const { Branch } = require("../model/resturantModel");
const { OTPValidate } = require("../model/otpValidateModel");
const {
  generateOTP,
  getOTPExpiration,
  sendOTPEmail,
} = require("../utils/otpHandler");
const { sendResponse } = require("../utils/responseHelper");
const bcrypt = require("bcrypt");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/jwtHelper");

const checkUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return sendResponse(res, 400, "Email is required");
    }

    // Check if user exists
    const user = await User.findOne({ email: email });

    if (user) {
      return sendResponse(res, 400, "Mail id already exist! Try to Sign in");
    }

    // User does not exist, initiate OTP flow
    const otp = generateOTP();
    const expiration = getOTPExpiration();

    // Save OTP to DB
    const otpRecord = await OTPValidate.create({
      otp: otp,
      email: email,
      is_validate: false,
      expiration_time: expiration,
    });

    // Send OTP Email
    const emailSent = await sendOTPEmail(email, otp);

    if (emailSent) {
      // Mongoose uses _id, not id by default, but virtual 'id' might exist. Safer to use _id
      return sendResponse(res, 200, "OTP sent to email", {
        otpId: otpRecord._id,
        email: email,
      });
    } else {
      return sendResponse(res, 500, "Failed to send OTP email");
    }
  } catch (error) {
    console.error("Error in checkUser:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

const signin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendResponse(res, 400, "Email and password are required");
    }

    const user = await User.findOne({ email: email });

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return sendResponse(res, 400, "Invalid password");
    }

    let tokenPayload = {};

    if (user.branch_id !== null) {
      tokenPayload = {
        id: user._id, // Use _id
        email: user.email,
        branch_id: user.branch_id,
      };
    } else {
      tokenPayload = {
        id: user._id, // Use _id
        email: user.email,
        branch_id: user.branch_id,
        newUser: true,
      };
    }

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);


    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return sendResponse(res, 200, "User signed in successfully", {
      user: {
        branch_id: user.branch_id,
        email: user.email,
        username: user.username,
        id: user._id, // Use _id
      },
      redirect: user.branch_id ? "/dashboard" : "/registration",
      success: true,
      token: accessToken,
    });
  } catch (error) {
    console.error("Error in signin:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

const verifyOTPAndRegister = async (req, res) => {
  try {
    const { otpId, otp, email, password } = req.body;

    if (!otpId || !otp || !email || !password) {
      return sendResponse(
        res,
        400,
        "All fields are required: otpId, otp, email, password",
      );
    }

    // Find OTP record
    const otpRecord = await OTPValidate.findById(otpId);

    if (!otpRecord) {
      return sendResponse(res, 404, "OTP record not found");
    }

    // Validate OTP
    if (otpRecord.email !== email) {
      return sendResponse(res, 400, "Email does not match OTP record");
    }

    if (otpRecord.otp !== parseInt(otp)) {
      return sendResponse(res, 400, "Invalid OTP");
    }

    if (otpRecord.is_validate) {
      return sendResponse(res, 400, "OTP already used");
    }

    if (new Date() > new Date(otpRecord.expiration_time)) {
      return sendResponse(res, 400, "OTP expired");
    }

    // OTP is valid, register user
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email: email,
      Password: hashedPassword,
      username: email.split("@")[0],
      branch_id: null,
    });

    // Mark OTP as validated
    otpRecord.is_validate = true;
    await otpRecord.save();

    let tokenPayload = {};

    if (user.branch_id !== null) {
      tokenPayload = {
        id: user.id,
        email: user.email,
        branch_id: user.branch_id,
      };
    } else {
      tokenPayload = {
        id: user.id,
        email: user.email,
        branch_id: user.branch_id,
        newUser: true,
      };
    }

    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);

    res.cookie("accessToken", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return sendResponse(res, 201, "User registered successfully", {
      user: user,
      status: null,
    });
  } catch (error) {
    console.error("Error in verifyOTPAndRegister:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

module.exports = {
  checkUser,
  verifyOTPAndRegister,
  signin,
};
