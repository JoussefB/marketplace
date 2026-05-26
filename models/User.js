const mongoose = require('mongoose');
const { skinSchema } = require('./Skin'); 

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        minlength: 3,
        maxlength: 50,
        unique: true
    },
    email: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255,
        unique: true
    },
    password: {
        type: String,
        required: true,
        minlength: 5,
        maxlength: 255 
    },
    credits: {
        type: Number,
        default: 120, 
        min: 0
    },
    inventory: [skinSchema] 
});

const User = mongoose.model('User', userSchema);

module.exports = { User, userSchema };