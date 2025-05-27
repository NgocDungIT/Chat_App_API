const jwt = require('jsonwebtoken');
const { compare } = require('bcrypt');
const User = require('../models/User');
const {
    getGoogleUserProfile,
    createOTPEmail,
} = require('../service/userService');
const OtpEmail = require('../models/OtpEmails');

const maxAge = Math.floor(Date.now() / 1000) + 60 * 60 * 30;
function createToken(email, userId) {
    return jwt.sign(
        {
            exp: maxAge,
            data: { email, userId },
        },
        process.env.JWT_KEY
    );
}

async function signup(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(200).json({
                message: 'Vui lòng điền tài khoản và mật khẩu.',
            });
        }

        const checkUser = await User.findOne({ email });
        if (checkUser) {
            return res.status(200).json({
                message: 'Email đã đăng kí tài khoản.',
            });
        }

        await createOTPEmail(email);

        return res.status(200).json({
            message: 'Send email otp successfully!',
            success: true,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function verifyOtp(req, res, next) {
    try {
        const { email, otp, password } = req.body;

        if (!otp) {
            return res.status(200).json({
                message: 'Vui lòng điền otp.',
            });
        }

        const otpRecord = await OtpEmail.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(200).json({
                message: 'OTP không hợp lệ.',
            });
        }

        if (otpRecord.expiresAt < new Date()) {
            await OtpEmail.deleteOne({ email, otp });
            return res.status(200).json({
                message: 'OTP đã hết hạn.',
            });
        }

        const user = await User.create({ email, password });
        await OtpEmail.deleteOne({ email, otp });

        if (user) {
            const dataResponse = {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
            };

            return res.status(201).json({
                message: 'Success!',
                data: dataResponse,
            });
        }
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(200).json({
                message: 'Vui lòng điền tài khoản và mật khẩu.',
            });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(200).json({
                message: 'Tài khoản không tồn tại.',
            });
        }

        const checkPassword = await compare(password, user.password);
        if (!checkPassword) {
            return res.status(200).json({
                message: 'Mật khẩu không chính xác!',
            });
        }

        res.cookie('jwt', createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSite: 'None',
        });
        const dataResponse = {
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        };

        return res.status(200).json({
            message: 'Success!',
            data: dataResponse,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function loginWithGoogle(req, res, next) {
    const { credential } = req.body;

    if (!credential.access_token || !credential.token_type) {
        return res.status(200).json({
            message: 'Invalid accessToken or tokenType!',
        });
    }

    try {
        const googleUserProfile = await getGoogleUserProfile(credential);

        if (!googleUserProfile) {
            return res.status(200).json({
                message: 'Unauthorized',
            });
        }

        let user = await User.findOne({ email: googleUserProfile.email });

        if (!user) {
            user = await User.create({
                email: googleUserProfile.email,
                password: googleUserProfile.email,
            });
        }
        const email = googleUserProfile.email;
        res.cookie('jwt', createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSite: 'None',
        });

        const dataResponse = {
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        };

        return res.status(200).json({
            message: 'Success!',
            data: dataResponse,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: error.message,
        });
    }
}

async function logout(req, res, next) {
    try {
        res.cookie('jwt', '', {
            maxAge: 1,
            secure: true,
            sameSite: 'None',
        });
        res.status(200).send('Logout was successful');
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

module.exports = { signup, login, logout, loginWithGoogle, verifyOtp };
