const { default: mongoose } = require('mongoose');
const ChatBotMessages = require('../models/ChatBotMessages');
const User = require('../models/User');

async function createSessionChat(req, res, next) {
    try {
        const { title, sessionType } = req.body;
        const userId = req.userId;

        const user = await User.findById(userId);

        if (!user)
            return res.status(200).json({
                message: 'User not found.',
            });

        const newSessionChat = new ChatBotMessages({
            title,
            sessionType,
            userId: userId,
        });

        await newSessionChat.save();

        return res.status(201).json({
            message: 'Create session chat successfully!',
            sessionChat: newSessionChat,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function addMessageSession(req, res, next) {
    const { sessionId, newMessage, isUpdateTitle = true } = req.body;

    if (!sessionId) {
        return res.status(200).json({
            message: 'Session id is required!',
        });
    }

    try {
        // Cập nhật title lần đầu
        if (!isUpdateTitle) {
            await ChatBotMessages.findByIdAndUpdate(
                sessionId,
                {
                    title: newMessage.content,
                    isUpdateTitle: true,
                },
                { new: true }
            );
        }

        // Thêm message vào mảng messages (đúng cấu trúc schema)
        const updatedSession = await ChatBotMessages.findByIdAndUpdate(
            sessionId,
            {
                $push: {
                    messages: {
                        content: newMessage?.content || null, // Sử dụng trường 'message' thay vì 'content'
                        role: newMessage.role, // Sử dụng 'senderType' thay vì 'role'
                        messageType: newMessage?.messageType || 'text',
                        imageUrl: newMessage?.imageUrl || null,
                        createdAt: new Date(), // Thêm timestamp
                    },
                },
                $set: { updatedAt: new Date() }, // Cập nhật thời gian sửa đổi
            },
            { new: true } // Trả về document sau khi update
        );

        if (!updatedSession) {
            return res.status(200).json({
                message: 'Session not found!',
            });
        }

        return res.status(200).json({
            message: 'Add message to session successfully!',
            data: updatedSession,
        });
    } catch (error) {
        console.log('🚀 ~ addMessageSession ~ error:', error);
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: error.message,
        });
    }
}

async function getAllSessionsUser(req, res, next) {
    try {
        const userId = new mongoose.Types.ObjectId(req.userId);
        if (!userId) {
            return res.status(200).json({
                message: 'User id is required!',
            });
        }
        const sessions = await ChatBotMessages.find({
            userId: userId,
        }).sort({ updateAt: -1 });

        return res.status(200).json({
            message: 'Get all session user successfully!',
            data: sessions || [],
        });
    } catch (error) {
        console.log('🚀 ~ getAllSessionChat ~ error:', error);
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: error.message,
        });
    }
}

async function deleteSessionById(req, res, next) {
    const { sessionId } = req.body;

    if (!sessionId) {
        return res.status(200).json({
            message: 'Session id is required!',
        });
    }

    try {
        await ChatBotMessages.findByIdAndDelete(sessionId);

        return res.status(200).json({
            message: 'Delete session id successfully!',
            data: [],
        });
    } catch (error) {
        console.log('🚀 ~ getAllSessionChat ~ error:', error);
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: error.message,
        });
    }
}

module.exports = {
    createSessionChat,
    addMessageSession,
    getAllSessionsUser,
    deleteSessionById,
};
