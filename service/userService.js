const nodemailer = require('nodemailer');
const OtpEmail = require('../models/OtpEmails');

const getGoogleUserProfile = async (identityData) => {
    const url = await fetch(
        `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${identityData.access_token}`,
        {
            headers: {
                Authorization: `${identityData.token_type} ${identityData.access_token}`,
                'Content-Type': 'application/json',
            },
        }
    );
    const data = await url.json();
    return data;
};

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

const createOTPEmail = async (email) => {
    try {
        const otp = generateOTP();

        await OtpEmail.deleteMany({ email: email });

        await OtpEmail.create({
            email: email,
            otp: otp,
            expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        });

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your OTP Code Chat App',
            text: `Your OTP code is ${otp}. It is valid for 10 minutes.`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email:', error);
            } else {
                console.log('Email sent:', info.response);
            }
        });

        return otp;
    } catch (error) {
        console.error('Error creating OTP email:', error);
        throw new Error('Failed to create OTP email');
    }
};

module.exports = { getGoogleUserProfile, createOTPEmail };
