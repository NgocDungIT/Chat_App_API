const { Router } = require('express');
const { signup, login, logout, loginWithGoogle } = require('../controllers/AuthController');

const authRoutes = Router();

authRoutes.post('/signup', signup);
authRoutes.post('/login', login);
authRoutes.post('/login-google', loginWithGoogle);
authRoutes.post('/logout', logout);

module.exports = authRoutes;
