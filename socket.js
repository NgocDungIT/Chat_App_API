const { Server } = require('socket.io');
const Message = require('./models/Messages.js');
const Channel = require('./models/Channel.js');

const setupSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.ORIGIN,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    const userSocketMap = new Map();

    const sendMessage = async (message) => {
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const createdMessage = await Message.create(message);
        const messageData = await Message.findById(createdMessage._id)
            .populate('sender', 'id email color firstName lastName image')
            .populate('recipient', 'id email color firstName lastName image');

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('recieveMessage', messageData);
        }

        if (senderSocketId) {
            io.to(senderSocketId).emit('recieveMessage', messageData);
        }
    };

    const sendChannelMessage = async (message) => {
        const { sender, channelId, messageType, content, fileUrl } = message;
        const createdMessage = await Message.create({
            sender,
            recipient: null,
            content,
            messageType,
            fileUrl,
            timestamp: new Date(),
        });

        const messageData = await Message.findById(createdMessage._id)
            .populate('sender', 'id email color firstName lastName image')
            .exec();

        const channel = await Channel.findById(channelId).populate('members');

        const finalData = { ...messageData._doc, channelId: channel._id };

        if (channel?.members) {
            channel.members.forEach((member) => {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit(
                        'recieveChannelMessage',
                        finalData
                    );
                }

                const adminSocketId = userSocketMap.get(
                    channel.admin._id.toString()
                );
                if (adminSocketId) {
                    io.to(adminSocketId).emit(
                        'recieveChannelMessage',
                        finalData
                    );
                }
            });
        }
    };

    const disconnectSocket = (socket) => {
        for (const [userId, socketId] of userSocketMap.entries()) {
            if (socketId === socket.id) {
                userSocketMap.delete(userId);
                break;
            }
        }
    };

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            console.log('Connect socket user: ', userId);
            userSocketMap.set(userId, socket.id);
        } else {
            console.log('User id not provided during connection.');
        }

        socket.on('sendMessage', sendMessage);
        socket.on('sendChannelMessage', sendChannelMessage);

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', userId);
            disconnectSocket(socket);
        });
    });
};

module.exports = { setupSocket };
