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
const { generateAccessToken, generateRefreshToken } = require("../utils/jwtHelper");

const checkUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email) {
      return sendResponse(res, 400, "Email is required");
    }

    // Check if user exists
    const user = await User.findOne({ where: { email: email } });

    if (user) {
      // If password is provided, verify it and issue token
      if (password) {
        const isMatch = await bcrypt.compare(password, user.Password);
        if (isMatch) {
          const accessToken = generateAccessToken(user);
          const refreshToken = generateRefreshToken(user);
          
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
        } else {
          // If password provided but wrong, maybe we should return error?
          // But original logic just returned user info.
          // Let's assume if password provided, we want to auth.
          // But to be safe and minimally invasive to existing logic if password is wrong,
          // I will just NOT set the cookie, or maybe return 401?
          // The user request implies this curl IS for auth.
          return sendResponse(res, 401, "Invalid password");
        }
      }

      // User exists, check branch
      if (user.branch_id) {
        const branch = await Branch.findByPk(user.branch_id);
        if (branch) {
          return sendResponse(res, 200, "User found with branch", {
            user: user,
            branch: branch,
            status: branch.status, // Return status of branch model as requested
          });
        } else {
          // Branch ID exists but branch not found (edge case)
          return sendResponse(
            res,
            200,
            "User found but branch details missing",
            { status: null }
          );
        }
      } else {
        // User exists but no branch_id
        return sendResponse(res, 200, "User found without branch", {
          status: null,
        });
      }
    } else {
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
        return sendResponse(res, 200, "OTP sent to email", {
          otpId: otpRecord.id,
          otp,
          email: email,
        });
      } else {
        return sendResponse(res, 500, "Failed to send OTP email");
      }
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

    const user = await User.findOne({ where: { email: email } });

    if (!user) {
      return sendResponse(res, 404, "User not found");
    }

    const isMatch = await bcrypt.compare(password, user.Password);

    if (!isMatch) {
      return sendResponse(res, 401, "Invalid password");
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

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
        id: user.id,
      },
      redirect: user.branch_id ? "/dashboard" : "/registration",
      success: true,
      token: accessToken, // Optional: return token in body too if needed by frontend
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
        "All fields are required: otpId, otp, email, password"
      );
    }

    // Find OTP record
    const otpRecord = await OTPValidate.findByPk(otpId);

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

    const newUser = await User.create({
      email: email,
      Password: hashedPassword, // Note: Model uses 'Password' with capital P based on file view
      username: email.split("@")[0], // Default username
      branch_id: null, // Default null as per flow
    });

    // Mark OTP as validated
    await otpRecord.update({ is_validate: true });

    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

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
      user: newUser,
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
