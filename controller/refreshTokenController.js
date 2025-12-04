const { verifyToken, generateAccessToken } = require("../utils/jwtHelper");
const { sendResponse } = require("../utils/responseHelper");

const refreshToken = (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendResponse(res, 401, "Refresh token not found");
    }

    const decoded = verifyToken(refreshToken, true);

    if (!decoded) {
      return sendResponse(res, 403, "Invalid or expired refresh token");
    }

    // Generate new access token
    // Note: In a real app, we might want to fetch the user from DB to ensure they still exist/aren't banned
    // But for stateless refresh, we can use the decoded data
    const user = {
      id: decoded.userId,
      email: decoded.email,
      branch_id: decoded.branchId,
    };

    const newAccessToken = generateAccessToken(user);

    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    return sendResponse(res, 200, "Token refreshed successfully", {
      token: newAccessToken,
    });
  } catch (error) {
    console.error("Error in refreshToken:", error);
    return sendResponse(res, 500, "Internal Server Error", {
      error: error.message,
    });
  }
};

module.exports = { refreshToken };
