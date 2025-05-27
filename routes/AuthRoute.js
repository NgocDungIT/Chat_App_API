const { Router } = require('express');
const { signup, login, logout, loginWithGoogle, verifyOtp } = require('../controllers/AuthController');

const authRoutes = Router();

authRoutes.post('/signup', signup);
authRoutes.post('/verify-otp', verifyOtp);
authRoutes.post('/login', login);
authRoutes.post('/login-google', loginWithGoogle);
authRoutes.post('/logout', logout);

module.exports = authRoutes;
