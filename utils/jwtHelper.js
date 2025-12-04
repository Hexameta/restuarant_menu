const jwt = require("jsonwebtoken");

const ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || "your_access_secret_key";
const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || "your_refresh_secret_key";

const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    branchId: user.branch_id,
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
};

const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    branchId: user.branch_id,
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};

const verifyToken = (token, isRefreshToken = false) => {
  try {
    const secret = isRefreshToken ? REFRESH_TOKEN_SECRET : ACCESS_TOKEN_SECRET;
    return jwt.verify(token, secret);
  } catch (error) {
    return null;
  }
};

module.exports = { generateAccessToken, generateRefreshToken, verifyToken };
