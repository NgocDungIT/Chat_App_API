const mongoose = require('mongoose');

const channelSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'name is required!'],
    },
    image: {
        type: String,
        required: false,
    },
    members: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'User',
            required: true,
        },
    ],
    admin: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true,
    },
    messages: [
        {
            type: mongoose.Schema.ObjectId,
            ref: 'Message',
            required: false,
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
});

channelSchema.pre('save', function (next) {
    this.updateAt = Date.now();
    next();
});

channelSchema.pre('findOneAndUpdate', function (next) {
    this.set({
        updateAt: Date.now(),
    });
    next();
});

module.exports = mongoose.model('Channels', channelSchema);
