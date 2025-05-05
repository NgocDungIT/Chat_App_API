const { Router } = require('express');
const multer = require('multer');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const {
    getMessagesByUser,
    uploadFile,
} = require('../controllers/MessagesController');

const messagesRoutes = Router();
const upload = multer({ dest: 'uploads/files' });

messagesRoutes.post('/get-messages-by-user', verifyToken, getMessagesByUser);
messagesRoutes.post(
    '/upload-file',
    verifyToken,
    upload.single('file'),
    uploadFile
);

module.exports = messagesRoutes;
