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

  // Get access token from header
  let accessToken;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    accessToken = req.headers.authorization.split(" ")[1];
  }

  if (!accessToken) {
    return sendResponse(res, 401, "Access denied. No valid token provided.");
  }

  // Try to verify access token
  let decoded = verifyToken(accessToken);

  // If access token is invalid or expired
  if (!decoded) {
    return sendResponse(res, 401, "Invalid or expired token. Please login again.");
  }

  if (!decoded.branchId && !decoded.newUser) {
    return sendResponse(res, 401, "Branch id missing in token.");
  }

  req.user = decoded;
  next();
};

module.exports = { authMiddleware };
