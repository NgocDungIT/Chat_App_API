const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required!'],
        unique: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required!'],
        unique: true,
    },
    firstName: {
        type: String,
        required: false,
    },
    lastName: {
        type: String,
        required: false,
    },
    image: {
        type: String,
        required: false,
    },
    color: {
        type: Number,
        default: 0,
        required: false,
    },
    profileSetup: {
        type: Boolean,
        required: false,
        default: false,
    },
    createDate: {
        type: Date,
        required: false,
        default: new Date(),
    },
    updateDate: {
        type: Date,
        required: false,
    },
});

userSchema.pre("save", async function (next){
    const saltRounds = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, saltRounds);
    next();
})

module.exports = mongoose.model('User', userSchema);
