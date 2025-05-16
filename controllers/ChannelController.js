const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const { default: mongoose } = require('mongoose');
const Channel = require('../models/Channel');
const User = require('../models/User');

async function createChannel(req, res, next) {
    try {
        const { name, members } = req.body;
        const userId = req.userId;

        const admin = await User.findById(userId);

        if (!admin)
            return res.status(200).json({
                message: 'Admin user not found.',
            });

        const validMembers = await User.find({
            _id: { $in: members },
        });

        if (validMembers.length !== members.length)
            return res.status(200).json({
                message: 'Some members are not valid users.',
            });

        const newChannel = new Channel({
            name,
            image: null,
            admin: admin,
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
        })
            .sort({ updateAt: -1 })
            .populate({
                path: 'admin',
                select: 'firstName lastName email _id image color',
            })
            .populate({
                path: 'members',
                select: 'firstName lastName email _id image color',
            });

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

async function getAllMessagesByChannel(req, res, next) {
    try {
        const { channelId } = req.params;

        const channel = await Channel.findById(channelId).populate({
            path: 'messages',
            populate: {
                path: 'sender',
                select: 'firstName lastName email _id image color',
            },
        });

        const messages = channel?.messages || [];

        return res.status(200).json({
            message: 'Get all message by channel id successfully!',
            messages: messages,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function addMembersChannel(req, res, next) {
    try {
        const { members, channelId } = req.body;

        // Kiểm tra channelId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(200).json({
                message: 'Invalid channel ID',
            });
        }

        // Kiểm tra members có phải mảng không
        if (!Array.isArray(members) || members.length === 0) {
            return res.status(200).json({
                message: 'Members must be a non-empty array',
            });
        }

        const validMembers = await User.find({
            _id: { $in: members },
        });

        if (validMembers.length !== members.length)
            return res.status(200).json({
                message: 'Some members are not valid users.',
            });

        const channel = await Channel.findById(channelId);
        if (!channel) {
            return res.status(200).json({
                message: 'Channel not found',
            });
        }

        // Thêm thành viên vào channel
        const updatedChannel = await Channel.findByIdAndUpdate(
            channelId,
            {
                $addToSet: { members: { $each: members } },
            },
            { new: true }
        )
            .populate('members', 'firstName lastName email _id image color')
            .populate('admin', 'firstName lastName email _id image color');

        return res.status(200).json({
            message: 'Members added successfully',
            channel: updatedChannel,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: error.message,
        });
    }
}

async function leaveChannel(req, res, next) {
    try {
        const { channelId } = req.body;
        const userId = req.userId;

        // Kiểm tra channelId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(200).json({
                message: 'Invalid channel ID',
            });
        }

        // Cập nhật channel: xóa userId khỏi mảng members
        const updatedChannel = await Channel.findByIdAndUpdate(
            channelId,
            {
                $pull: { members: userId },
            },
            { new: true } // Trả về document sau khi update
        );

        if (!updatedChannel) {
            return res.status(200).json({
                message: 'Channel not found',
            });
        }

        return res.status(200).json({
            message: 'Left channel successfully',
            channel: updatedChannel,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function uploadImage(req, res, next) {
    try {
        const file = req.file;
        const { channelId } = req.body;

        // Kiểm tra channelId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            if (file) fs.unlinkSync(file.path); // Xóa file tạm nếu có
            return res.status(400).json({
                message: 'Invalid channel ID',
            });
        }

        // Kiểm tra có file được upload không
        if (!file) {
            return res.status(400).json({
                message: 'No image file provided',
            });
        }

        // Upload lên Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
            folder: 'Avatar-Chat-App',
            resource_type: 'image',
        });

        // Xóa file tạm sau khi upload
        fs.unlinkSync(file.path);

        const channel = await Channel.findByIdAndUpdate(
            channelId,
            {
                image: result.secure_url,
            },
            { new: true }
        );

        console.log("🚀 ~ uploadImage ~ channel:", channel)

        return res.status(200).json({
            message: 'Image uploaded successfully',
            url: result.secure_url,
        });
    } catch (err) {
        // Xóa file tạm nếu có lỗi
        if (req.file) fs.unlinkSync(req.file.path);

        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function deleteImage(req, res, next) {
    try {
        const { idImage, channelId } = req.body;

        // Kiểm tra channelId có hợp lệ không
        if (!mongoose.Types.ObjectId.isValid(channelId)) {
            return res.status(200).json({
                message: 'Invalid channel ID',
            });
        }

        if (!idImage) {
            return res.status(200).json({
                message: 'Invalid image id',
            });
        }

        if (idImage) {
            await cloudinary.uploader.destroy(`Avatar-Chat-App/${idImage}`, {
                resource_type: 'image',
            });
            await Channel.findByIdAndUpdate(
                channelId,
                { image: null },
                { new: true, runValidators: true }
            );
            res.status(200).send({
                message: 'Delete image successfully',
                url: null,
            });
        }
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

module.exports = {
    createChannel,
    getUserChannels,
    getAllMessagesByChannel,
    addMembersChannel,
    leaveChannel,
    uploadImage,
    deleteImage,
};
