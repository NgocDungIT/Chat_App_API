const fs = require('fs');
const cloudinary = require('cloudinary').v2;
const User = require('../models/User');

async function getUserById(req, res, next) {
    try {
        const userId = req.userId;
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).send('User with the given email not found!');
        }
        const dataResponse = {
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        };

        return res.status(200).json({
            message: 'Success!',
            user: dataResponse,
        });
    } catch (err) {
        console.error('Error get user: ' + err.message);
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function updateUserById(req, res, next) {
    try {
        const userId = req.userId;
        const { firstName, lastName, color, profileSetup, image } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { firstName, lastName, color, image, profileSetup },
            { new: true, runValidators: true }
        );

        const dataResponse = {
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        };

        return res.status(200).json({
            message: 'Success!',
            user: dataResponse,
        });
    } catch (err) {
        console.error('Error update user: ' + err.message);
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

function uploadImage(req, res, next) {
    const filePath = req.file.path;
    cloudinary.uploader.upload(
        filePath,
        { folder: 'Avatar-Chat-App' },
        (error, result) => {
            fs.unlinkSync(filePath);

            if (error) {
                return res
                    .status(500)
                    .json({ message: 'Image upload failed', error });
            }

            res.status(200).send({
                message: 'Image uploaded successfully',
                url: result.secure_url,
            });
        }
    );
}

async function deleteImage(req, res, next) {
    const { idImage } = req.body;
    const userId = req.userId;

    if (idImage) {
        try {
            await cloudinary.uploader.destroy(`Avatar-Chat-App/${idImage}`, {
                resource_type: 'image',
            });
            await User.findByIdAndUpdate(
                userId,
                { image: '' },
                { new: true, runValidators: true }
            );
            res.status(200).send({
                message: 'Delete image successfully',
                url: '',
            });
        } catch (error) {
            return res
                .status(500)
                .json({ message: 'Delete image failed', error });
        }
    } else {
        console.log('Error: ', error.message);
        return res.status(500).json({ message: 'Delete image failed' });
    }
}

module.exports = {
    getUserById,
    updateUserById,
    uploadImage,
    deleteImage,
};
