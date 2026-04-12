const { verifyToken, generateAccessToken } = require("../utils/jwtHelper");
const { sendResponse } = require("../utils/responseHelper");

const refreshToken = (req, res) => {
  try {
    const refreshToken = req.body.refreshToken;

    if (!refreshToken) {
      return sendResponse(res, 401, "Refresh token not found");
    }

    const decoded = verifyToken(refreshToken, true);

    if (!decoded) {
      return sendResponse(res, 403, "Invalid or expired refresh token");
    }

    // Generate new access token
    const user = {
      id: decoded.userId,
      email: decoded.email,
      branch_id: decoded.branchId,
    };

    const newAccessToken = generateAccessToken(user);

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
