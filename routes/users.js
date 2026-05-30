const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const joi = require('joi');
const { User } = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

// Joi validatie voor een nieuwe gebruiker
function validateUser(user) {
    const schema = joi.object({
        username: joi.string().min(3).max(50).required(),
        email: joi.string().min(5).max(255).email().required(),
        password: joi.string().min(5).max(255).required(),
        credits: joi.number().min(0)
    });
    return schema.validate(user);
}

// GET: Alle gebruikers ophalen (alleen admins)
router.get('/', [auth, admin], async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.send(users);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij ophalen gebruikers.' });
    }
});

// POST: Een nieuwe gebruiker aanmaken (alleen admins)
router.post('/', [auth, admin], async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password,
            credits: req.body.credits
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        const savedUser = await user.save();
        res.status(201).send({
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            credits: savedUser.credits,
            isAdmin: savedUser.isAdmin
        });
    } catch (error) {
        res.status(500).send({ message: 'Kon gebruiker niet aanmaken (mogelijk bestaat de naam/email al).' });
    }
});

module.exports = router;
