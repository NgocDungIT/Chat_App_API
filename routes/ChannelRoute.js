const { Router } = require('express');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const {
    createChannel,
    getUserChannels,
    getAllMessagesByChannel,
    leaveChannel,
    addMembersChannel,
} = require('../controllers/ChannelController');

const channelsRoutes = Router();

channelsRoutes.post('/create', verifyToken, createChannel);
channelsRoutes.post('/add-members-channel', verifyToken, addMembersChannel);
channelsRoutes.post('/leave-channel', verifyToken, leaveChannel);
channelsRoutes.get('/get-user-channels', verifyToken, getUserChannels);
channelsRoutes.get(
    '/get-messages-channel/:channelId',
    verifyToken,
    getAllMessagesByChannel
);

module.exports = channelsRoutes;
