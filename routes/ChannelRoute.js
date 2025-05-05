const { Router } = require('express');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const {
    createChannel,
    getUserChannels,
} = require('../controllers/ChannelController');

const channelsRoutes = Router();

channelsRoutes.post('/create', verifyToken, createChannel);
channelsRoutes.get('/get-user-channels', verifyToken, getUserChannels);

module.exports = channelsRoutes;
