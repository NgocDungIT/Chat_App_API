const { Router } = require('express');
const {
    signup,
    login,
    logout,
    loginWithGoogle,
    verifyOtp,
    sendOTP,
    verifyEmail,
    changePassword,
} = require('../controllers/AuthController');

const authRoutes = Router();

authRoutes.get('/hehe', (req, res, next) => {
    res.status(200).json({ message: 'hehe' });
});

authRoutes.post('/signup', signup);
authRoutes.post('/verify-otp', verifyOtp);
authRoutes.post('/send-otp', sendOTP);
authRoutes.post('/verify-email', verifyEmail);
authRoutes.post('/login', login);
authRoutes.post('/login-google', loginWithGoogle);
authRoutes.post('/logout', logout);
authRoutes.post('/change-password', changePassword);


module.exports = authRoutes;
