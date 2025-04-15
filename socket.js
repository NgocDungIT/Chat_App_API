const { Server } = require('socket.io');
const Message = require('./models/Messages.js');

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

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', userId);
            disconnectSocket(socket);
        });
    });
};

module.exports = { setupSocket };
