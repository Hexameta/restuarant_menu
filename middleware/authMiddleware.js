const { verifyToken, generateAccessToken } = require("../utils/jwtHelper");
const { sendResponse } = require("../utils/responseHelper");

const authMiddleware = (req, res, next) => {

 if (req.method === "OPTIONS") {
  return next();
}
  
  // Check for excluded routes
  const publicPaths = [
    "/api/v1/users/signin",
    "/api/v1/users/check",
    "/api/v1/users/verify-otp",
    "/api/v1/restaurant/search",
    "/api/v1/menu/",
    "/api/v1/users"
  ];

  const publicGetPaths = [
  ];

  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  if (
    req.method === "GET" &&
    publicGetPaths.some((path) => req.path.startsWith(path))
  ) {
    return next();
  }

  // Get access token from cookie or header
  let accessToken = req.cookies.accessToken;

  if (
    !accessToken &&
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    accessToken = req.headers.authorization.split(" ")[1];
  }

  // Try to verify access token
  let decoded = verifyToken(accessToken);

  // If access token is invalid or expired, try to refresh it
  if (!decoded) {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return sendResponse(res, 401, "Access denied. No valid token provided.");
    }

    // Verify refresh token
    const refreshDecoded = verifyToken(refreshToken, true);

    if (!refreshDecoded) {
      return sendResponse(
        res,
        401,
        "Invalid or expired refresh token. Please login again."
      );
    }

    // Generate new access token from refresh token
    const user = {
      id: refreshDecoded.userId,
      email: refreshDecoded.email,
      branch_id: refreshDecoded.branchId,
    };

    const newAccessToken = generateAccessToken(user);

    // Set new access token in cookie
    res.cookie("accessToken", newAccessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    });

    // Use the refreshed token data for the request
    decoded = refreshDecoded;
  }


  if (!decoded.branchId && !decoded.newUser) {
    return sendResponse(res, 401, "Branch id missing in token.");
  }

  req.user = decoded;
  next();
};

module.exports = { authMiddleware };
