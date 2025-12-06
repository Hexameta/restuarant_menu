const { verifyToken } = require("../utils/jwtHelper");
const { sendResponse } = require("../utils/responseHelper");

const  authMiddleware = (req, res, next) => {
  // Check for excluded routes
  // Note: This check can also be done in app.js by applying middleware conditionally
  // But doing it here adds an extra layer of safety if applied globally
  // Check for excluded routes
  const publicPaths = [

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

  if(!decoded.branchId){
      return sendResponse(res, 401, "Branch id missing in token.");
  }

  req.user = decoded;
  next();
};

module.exports = { authMiddleware };
