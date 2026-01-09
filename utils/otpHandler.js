const nodemailer = require("nodemailer");
const ejs = require("ejs");
const path = require("path");
const {
  NODEMAILER_EMAIL,
  NODEMAILER_PASSWORD,
} = require("../config/envVariable");

const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

const getOTPExpiration = () => {
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  return expiresAt;
};

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: NODEMAILER_EMAIL,
    pass: NODEMAILER_PASSWORD,
  },
});

const sendOTPEmail = async (email, otp, userName) => {
  try {
    const templatePath = path.join(
      __dirname,
      "..",
      "templates",
      "signupOtpEmail.ejs"
    );

    const html = await ejs.renderFile(templatePath, {
      otp,
      userName,
    });

    await transporter.sendMail({
      from: `"Digify Menu" <${NODEMAILER_EMAIL}>`,
      to: email,
      subject: "Your Digify Menu OTP",
      html,
    });

    return true;
  } catch (error) {
    console.error("Error sending OTP email:", error);
    return false;
  }
};

module.exports = {
  generateOTP,
  getOTPExpiration,
  sendOTPEmail,
};
