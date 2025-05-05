const User = require('../models/User');
const Message = require('../models/Messages');
const { default: mongoose } = require('mongoose');

async function searchContacts(req, res, next) {
    try {
        const { searchTerm } = req.body;
        if (searchTerm.length) {
            const cleanSearchTerm = searchTerm.replace(/[^a-zA-Z0-9\s]/g, '');
            const regex = new RegExp(cleanSearchTerm, 'i');

            const contacts = await User.find({
                $and: [
                    { _id: { $ne: req.userId } },
                    {
                        $or: [
                            { firstName: regex },
                            { lastName: regex },
                            { email: regex },
                        ],
                    },
                ],
            }).select('id firstName lastName email image color');

            return res.status(200).json({
                status: 'Success',
                contacts,
            });
        } else {
            return res.status(400).send('SearchTerm is required!');
        }
    } catch (error) {
        return res.status(500).send('Internal Server Error !');
    }
}

async function getContactsForDMList(req, res, next) {
    try {
        let { userId } = req;
        userId = new mongoose.Types.ObjectId(userId);

        const contacts = await Message.aggregate([
            {
                $match: {
                    $or: [{ sender: userId }, { recipient: userId }],
                },
            },
            {
                $sort: { timestamp: -1 },
            },
            {
                $group: {
                    _id: {
                        $cond: {
                            if: { $eq: ['$sender', userId] },
                            then: '$recipient',
                            else: '$sender',
                        },
                    },
                    lastMessageTime: { $first: '$timestamp' },
                },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'contactInfo',
                },
            },
            {
                $unwind: '$contactInfo',
            },
            {
                $project: {
                    _id: 1,
                    lastMessageTime: 1,
                    email: '$contactInfo.email',
                    firstName: '$contactInfo.firstName',
                    lastName: '$contactInfo.lastName',
                    image: '$contactInfo.image',
                    color: '$contactInfo.color',
                },
            },
            {
                $sort: { lastMessageTime: -1 },
            },
        ]);

        return res.status(200).json({
            message: 'Success',
            data: contacts,
        });
    } catch (error) {
        return res.status(500).json({
            message: 'Internal Server Error !',
            error: error.message,
        });
    }
}

async function getAllContacts(req, res, next) {
    try {
        const users = await User.find(
            { _id: { $ne: req.userId } },
            'firstName lastName _id email'
        );

        const contacts = users?.map((user) => ({
            value: user._id,
            label: user?.firstName
                ? `${user.firstName} ${user.lastName}`
                : user.email,
        }));

        return res.status(200).json({
            status: 'Success',
            contacts: contacts,
        });
    } catch (error) {
        return res.status(500).send('Internal Server Error!');
    }
}

module.exports = { searchContacts, getContactsForDMList, getAllContacts };
