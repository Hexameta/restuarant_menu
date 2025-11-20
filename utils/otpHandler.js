/**
 * OTP Utility Functions
 * Handles OTP generation and email sending
 */

/**
 * Generate a random 4-digit OTP
 * @returns {number} 4-digit OTP
 */
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000);
};

/**
 * Calculate OTP expiration time (10 minutes from now)
 * @returns {Date} Expiration datetime
 */
const getOTPExpiration = () => {
  const expirationTime = new Date();
  expirationTime.setMinutes(expirationTime.getMinutes() + 10);
  return expirationTime;
};

/**
 * Send OTP email (Mock function - implement with your email service)
 * @param {string} email - Recipient email
 * @param {number} otp - OTP to send
 * @returns {Promise<boolean>} Success status
 */
const sendOTPEmail = async (email, otp) => {
  try {
    // TODO: Implement actual email sending service
    // Example: nodemailer, SendGrid, AWS SES, etc.
    console.log(`Sending OTP ${otp} to ${email}`);

    // Mock successful email send
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
