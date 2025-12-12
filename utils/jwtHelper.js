const jwt = require("jsonwebtoken");
const {
  JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRATION,
  JWT_REFRESH_EXPIRATION,
} = require("../config/envVariable");

const ACCESS_TOKEN_SECRET = JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET = JWT_REFRESH_SECRET;

const generateAccessToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    branchId: user.branch_id,
    newUser: user.newUser ? true : false,
  };
  return jwt.sign(payload, ACCESS_TOKEN_SECRET, { expiresIn: JWT_ACCESS_EXPIRATION });
};

const generateRefreshToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    branchId: user.branch_id,
    newUser: user.newUser ? true : false,
  };
  return jwt.sign(payload, REFRESH_TOKEN_SECRET, { expiresIn: JWT_REFRESH_EXPIRATION });
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
