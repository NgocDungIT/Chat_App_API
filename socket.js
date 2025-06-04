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

    const sendMessage = async ({ message, contact }) => {
        const senderSocketId = userSocketMap.get(message.sender);
        const recipientSocketId = userSocketMap.get(message.recipient);

        const createdMessage = await Message.create(message);
        const messageData = await Message.findById(createdMessage._id)
            .populate('sender', 'id email color firstName lastName image')
            .populate('recipient', 'id email color firstName lastName image');

        if (recipientSocketId) {
            io.to(recipientSocketId).emit('recieveMessage', messageData);
            io.to(recipientSocketId).emit('addDirectContact', contact);
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

        await Channel.findByIdAndUpdate(channelId, {
            $push: {
                messages: createdMessage._id,
            },
        });

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
            });
            const adminSocketId = userSocketMap.get(
                channel.admin._id.toString()
            );
            if (adminSocketId) {
                io.to(adminSocketId).emit('recieveChannelMessage', finalData);
            }
        }
    };

    const sendChannelRename = async ({ channelId, newTitle }) => {
        try {
            // Update channel in database
            const updatedChannel = await Channel.findByIdAndUpdate(
                channelId,
                { name: newTitle },
                { new: true }
            ).populate('members');

            if (!updatedChannel) {
                throw new Error('Channel not found');
            }

            // Notify all members
            const finalData = {
                channelId: updatedChannel._id,
                title: newTitle,
            };

            if (updatedChannel?.members) {
                updatedChannel.members.forEach((member) => {
                    const memberSocketId = userSocketMap.get(
                        member._id.toString()
                    );
                    if (memberSocketId) {
                        io.to(memberSocketId).emit('channelRenamed', finalData);
                    }
                });
                const adminSocketId = userSocketMap.get(
                    updatedChannel.admin._id.toString()
                );
                if (adminSocketId) {
                    io.to(adminSocketId).emit('channelRenamed', finalData);
                }
            }

            return finalData;
        } catch (error) {
            console.error('Error renaming channel:', error);
            throw error;
        }
    };

    const sendChannelChangeImage = async ({ channelId, url }) => {
        try {
            const channel = await Channel.findById(channelId).populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName email _id image color',
                },
            });

            if (channel?.members) {
                channel.members.forEach((member) => {
                    const memberSocketId = userSocketMap.get(
                        member._id.toString()
                    );
                    if (memberSocketId) {
                        io.to(memberSocketId).emit('channelChangedImage', {
                            channelId,
                            url,
                        });
                    }
                });
            }
        } catch (error) {
            console.error('Error renaming channel:', error);
            throw error;
        }
    };

    const sendChannelCreate = async ({ channel }) => {
        if (channel?.members) {
            channel.members.forEach((member) => {
                const memberSocketId = userSocketMap.get(member._id.toString());
                if (memberSocketId) {
                    io.to(memberSocketId).emit('channelCreated', channel);
                }
            });

            const adminSocketId = userSocketMap.get(
                channel.admin._id.toString()
            );
            if (adminSocketId) {
                io.to(adminSocketId).emit('channelCreated', channel);
            }
        }
    };

    const sendChannelDelete = async ({ channelId }) => {
        try {
            const channel = await Channel.findById(channelId).populate({
                path: 'messages',
                populate: {
                    path: 'sender',
                    select: 'firstName lastName email _id image color',
                },
            });

            if (channel?.members) {
                channel.members.forEach((member) => {
                    const memberSocketId = userSocketMap.get(
                        member._id.toString()
                    );
                    if (memberSocketId) {
                        io.to(memberSocketId).emit('channelDeleted', channelId);
                    }
                });
            }

            await Channel.findByIdAndDelete(channelId);
        } catch (error) {
            console.error('Error renaming channel:', error);
            throw error;
        }
    };

    const sendChannelKick = async ({ channel, userId }) => {
        try {
            const updatedChannel = await Channel.findByIdAndUpdate(
                channel._id,
                {
                    $pull: { members: userId },
                },
                { new: true } // Trả về document sau khi update
            );

            if (!updatedChannel) {
                throw new Error('Channel not found');
            }

            const memberSocketId = userSocketMap.get(userId.toString());

            if (memberSocketId) {
                io.to(memberSocketId).emit('userIsKickedOut', {
                    channelId: channel._id,
                });
            }
        } catch (error) {
            console.error('Error renaming channel:', error);
            throw error;
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

    const broadcastOnlineUsers = () => {
        const onlineUserIds = Array.from(userSocketMap.keys());
        for (const [userId, socketId] of userSocketMap.entries()) {
            io.to(socketId).emit('onlineUsers', onlineUserIds);
        }
    };

    io.on('connection', (socket) => {
        const userId = socket.handshake.query.userId;

        if (userId) {
            console.log('Connect socket user: ', userId);
            userSocketMap.set(userId, socket.id);
            broadcastOnlineUsers();
        } else {
            console.log('User id not provided during connection.');
        }

        socket.on('sendMessage', sendMessage);
        socket.on('sendChannelMessage', sendChannelMessage);
        socket.on('renameChannel', sendChannelRename);
        socket.on('createChannel', sendChannelCreate);
        socket.on('deleteChannel', sendChannelDelete);
        socket.on('changeImageChannel', sendChannelChangeImage);
        socket.on('kickMemberChannel', sendChannelKick);

        socket.on('callUser', (data) => {
            const senderSocketId = userSocketMap.get(data.userToCall._id);

            if (senderSocketId) {
                io.to(senderSocketId).emit('callUser', {
                    signal: data.signalData,
                    from: data.from,
                });
            }
        });

        socket.on('answerCall', (data) => {
            const senderSocketId = userSocketMap.get(data.to._id);
            if (senderSocketId) {
                io.to(senderSocketId).emit('callAccepted', data.signal);
            }
        });

        socket.on('callEnded', (data) => {
            const senderSocketId = userSocketMap.get(data.to._id);
            if (senderSocketId) {
                io.to(senderSocketId).emit('callEnded');
            }
        });

        socket.on('disconnect', () => {
            console.log('❌ User disconnected:', userId);
            disconnectSocket(socket);
            broadcastOnlineUsers();
        });
    });
};

module.exports = { setupSocket };
