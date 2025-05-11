const mongoose = require('mongoose');

const chatBotMessagesSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true, // Tự động xóa khoảng trắng thừa
        },
        isUpdateTitle: {
            type: Boolean,
            required: true,
            default: false,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            index: true,
        },
        sessionType: {
            type: String,
            enum: ['text', 'image'],
            default: 'text',
            required: true,
        },
        messages: [
            {
                content: {
                    // Đổi tên từ 'message' thành 'content' để phù hợp cả file/ảnh
                    type: String,
                    required: false,
                    default: null,
                },
                fileUrl: {
                    required: false,
                    type: String,
                    default: null,
                },
                imageUrl: {
                    type: String,
                    default: null,
                    required: false,
                },
                role: {
                    type: String,
                    enum: ['user', 'assistant'],
                    required: true,
                    default: 'user',
                },
                messageType: {
                    type: String,
                    enum: ['text', 'image', 'file', 'code'],
                    default: 'text',
                    required: true,
                },
                createdAt: {
                    type: Date,
                    default: Date.now,
                },
            },
        ],
        createAt: {
            type: Date,
            default: Date.now(),
        },
        updateAt: {
            type: Date,
            default: Date.now(),
        },
    },
    {
        timestamps: true,
    }
);

chatBotMessagesSchema.pre('save', function (next) {
    this.updateAt = Date.now();
    next();
});

chatBotMessagesSchema.pre('findOneAndUpdate', function (next) {
    this.set({
        updateAt: Date.now(),
    });
    next();
});

module.exports = mongoose.model('ChatBotMessages', chatBotMessagesSchema);
