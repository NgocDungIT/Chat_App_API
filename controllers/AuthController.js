const jwt = require('jsonwebtoken');
const { compare } = require('bcrypt');
const User = require('../models/User');

const maxAge = Math.floor(Date.now() / 1000) + 60 * 60 * 30;
function createToken(email, userId) {
    return jwt.sign(
        {
            exp: maxAge,
            data: { email, userId },
        },
        process.env.JWT_KEY
    );
}

async function signup(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and Password required!');
        }

        const user = await User.create({ email, password });
        if (user) {
            const dataResponse = {
                id: user.id,
                email: user.email,
                profileSetup: user.profileSetup,
            };

            return res.status(201).json({
                message: 'Success!',
                data: dataResponse,
            });
        }
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function login(req, res, next) {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).send('Email and Password required!');
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).send('User with the given email not found!');
        }

        const checkPassword = await compare(password, user.password);
        if (!checkPassword) {
            return res.status(400).send('Password is incorrect!');
        }

        res.cookie('jwt', createToken(email, user.id), {
            maxAge,
            secure: true,
            sameSite: 'None',
        });
        const dataResponse = {
            id: user.id,
            email: user.email,
            profileSetup: user.profileSetup,
            firstName: user.firstName,
            lastName: user.lastName,
            image: user.image,
            color: user.color,
        };

        return res.status(201).json({
            message: 'Success!',
            data: dataResponse,
        });
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

async function logout(req, res, next) {
    try {
        res.cookie('jwt', '', {
            maxAge: 1,
            secure: true,
            sameSite: 'None',
        });
        res.status(200).send("Logout was successful")
    } catch (err) {
        return res.status(500).json({
            message: 'Internal Server Error!',
            error: err.message,
        });
    }
}

module.exports = { signup, login, logout };
