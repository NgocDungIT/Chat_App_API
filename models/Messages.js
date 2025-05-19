const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
    messageType: {
        type: String,
        enum: ['text', 'file', 'call'],
        default: 'text',
        required: false,
    },
    content: {
        type: String,
        required: function () {
            return this.messageType === 'text';
        },
    },
    fileUrl: {
        type: String,
        required: function () {
            return this.messageType === 'file';
        },
    },
    callTime: {
        type: String,
        required: function () {
            return this.messageType === 'call';
        },
    },
    timestamp: {
        type: Date,
        default: Date.now(),
    },
});

module.exports = mongoose.model('Message', messageSchema);
