const { verifyToken } = require("../utils/jwtHelper");
const { sendResponse } = require("../utils/responseHelper");

const authMiddleware = (req, res, next) => {
  // Check for excluded routes
  // Note: This check can also be done in app.js by applying middleware conditionally
  // But doing it here adds an extra layer of safety if applied globally
  // Check for excluded routes
  const publicPaths = [
    "/api/v1/users/signin",
    "/api/v1/users/check",
    "/api/v1/users/verify-otp",
    "/api/v1/users/refresh-token",
    "/api/v1/restaurant/search",
  ];

  const publicGetPaths = [
    "/api/v1/menu-item",
    "/api/v1/category",
    "/api/v1/menu",
    "/api/v1/special-tag",
    "/api/v1/ads",
    "/api/v1/restaurant", // For fetching restaurant details by ID
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

  // Get token from cookie or header
  let token = req.cookies.accessToken;

  if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return sendResponse(res, 401, "Access denied. No token provided.");
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return sendResponse(res, 401, "Invalid or expired token.");
  }

  req.user = decoded;
  next();
};

module.exports = { authMiddleware };
