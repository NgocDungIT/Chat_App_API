const multer = require('multer');
const { Router } = require('express');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const { getUserById, updateUserById, uploadImage, deleteImage } = require('../controllers/UserController');

const userRoutes = Router();
const upload = multer({ dest: 'uploads/' });

userRoutes.get('/user-info', verifyToken, getUserById);
userRoutes.post('/update-profile', verifyToken, updateUserById);
userRoutes.post('/upload-image', upload.single('image'), uploadImage);
userRoutes.post('/delete-image', verifyToken, deleteImage);

module.exports = userRoutes;
