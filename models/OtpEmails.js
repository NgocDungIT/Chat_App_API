const mongoose = require('mongoose');

const optEmailSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required!'],
        unique: true,
    },
    otp: {
        type: String,
        required: [true, 'OTP is required!'],
        unique: true,
        minlength: 6,
    },
    createDate: {
        type: Date,
        required: false,
        default: new Date(),
    },
    expiresAt: {
        type: Date,
        required: true,
        default: new Date(),
    },
});

module.exports = mongoose.model('OtpEmail', optEmailSchema);
