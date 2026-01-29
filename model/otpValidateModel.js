const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpValidateSchema = new Schema({
    otp: Number,
    email: String,
    is_validate: Boolean,
    expiration_time: Date
}, { timestamps: true });

const OTPValidate = mongoose.model('OTPValidate', otpValidateSchema);

module.exports = { OTPValidate };
