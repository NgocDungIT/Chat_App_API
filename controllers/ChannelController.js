const { default: mongoose } = require('mongoose');
const Channel = require('../models/Channel');
const User = require('../models/User');

async function createChannel(req, res, next) {
    try {
        const { name, members } = req.body;
        const userId = req.userId;

        const admin = await User.findById(userId);

        if (!admin)
            return res.status(400).json({
                message: 'Admin user not found.',
            });

        const validMembers = await User.find({
            _id: { $in: members },
        });

        if (validMembers.length !== members.length)
            return res.status(400).json({
                message: 'Some members are not valid users.',
            });

        const newChannel = new Channel({
            name,
            image: null,
            admin: userId,
            members: validMembers,
        });

        await newChannel.save();

        return res.status(201).json({
            message: 'Create channel successfully!',
            channel: newChannel,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function getUserChannels(req, res, next) {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        const channels = await Channel.find({
            $or: [{ admin: userId }, { members: userId }],
        }).sort({ updateAt: -1 });

        return res.status(200).json({
            message: 'Get user channels successfully!',
            channels: channels || [],
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

module.exports = { createChannel, getUserChannels };
