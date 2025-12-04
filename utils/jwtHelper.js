const jwt = require("jsonwebtoken");

const SECRET_KEY = process.env.JWT_SECRET || "your_secret_key_here"; // Use env var in production

const generateToken = (user) => {
  const payload = {
    userId: user.id,
    email: user.email,
    branchId: user.branch_id,
  };

  // Token expires in 1 day
  return jwt.sign(payload, SECRET_KEY, { expiresIn: "1d" });
};

module.exports = { generateToken };
