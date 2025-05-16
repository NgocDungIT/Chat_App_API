const multer = require('multer');
const { Router } = require('express');
const { verifyToken } = require('../middlewares/AuthMiddleware');
const {
    createChannel,
    getUserChannels,
    getAllMessagesByChannel,
    leaveChannel,
    addMembersChannel,
    uploadImage,
    deleteImage,
} = require('../controllers/ChannelController');

const channelsRoutes = Router();
const upload = multer({ dest: 'uploads/' });

channelsRoutes.post('/create', verifyToken, createChannel);
channelsRoutes.post('/add-members-channel', verifyToken, addMembersChannel);
channelsRoutes.post('/leave-channel', verifyToken, leaveChannel);
channelsRoutes.post('/upload-image', upload.single('image'), uploadImage);
channelsRoutes.post('/delete-image', verifyToken, deleteImage);
channelsRoutes.get('/get-user-channels', verifyToken, getUserChannels);
channelsRoutes.get(
    '/get-messages-channel/:channelId',
    verifyToken,
    getAllMessagesByChannel
);

module.exports = channelsRoutes;
