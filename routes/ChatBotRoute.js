const { Router } = require('express');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const { createSessionChat, addMessageSession, getAllSessionsUser, deleteSessionById } = require('../controllers/ChatBotController');

const chatBotRouter = Router();

chatBotRouter.post('/create-session', verifyToken, createSessionChat);
chatBotRouter.post('/add-message-session', verifyToken, addMessageSession);
chatBotRouter.get('/all-sessions', verifyToken, getAllSessionsUser);
chatBotRouter.post('/delete-session', verifyToken, deleteSessionById);

module.exports = chatBotRouter;
