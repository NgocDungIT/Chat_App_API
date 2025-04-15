const { mkdirSync, renameSync } = require('fs');
const Message = require('../models/Messages');

async function getMessagesByUser(req, res, next) {
    try {
        const userSender = req.userId;
        const userRecipient = req.body.id;

        if (!userSender || !userRecipient) {
            return res.status(400).send("Both user ID's are required.");
        }

        const messages = await Message.find({
            $or: [
                { sender: userSender, recipient: userRecipient },
                { sender: userRecipient, recipient: userSender },
            ],
        }).sort({ timestamp: 1 });

        return res.status(200).json({
            status: 'Get messages successfully.',
            data: messages,
        });
    } catch (error) {
        return res.status(500).send('Internal Server Error !');
    }
}

async function uploadFile(req, res, next) {
    try {
        const { file } = req;

        if (!file) {
            return res.status(404).json({ message: 'File not required.' });
        }

        const date = Date.now();

        let fileDir = `uploads/files/${date}`;
        let fileName = `${fileDir}/${file.originalname}`;

        mkdirSync(fileDir, { recursive: true });
        renameSync(file.path, fileName);

        return res.status(200).json({
            status: 'Upload file successfully.',
            data: {
                filePath: fileName,
            },
        });
    } catch (error) {
        return res.status(500).send(error);
    }
}

module.exports = { getMessagesByUser, uploadFile };
