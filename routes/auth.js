const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const joi = require('joi');
const mongoose = require('mongoose');
const { User } = require('../models/User');

function isDatabaseUnavailable(error) {
    return mongoose.connection.readyState !== 1 || error.name === 'MongooseServerSelectionError';
}

function validateRegister(req) {
    const schema = joi.object({
        username: joi.string().min(3).max(50).required(),
        email: joi.string().min(5).max(255).email().required(),
        password: joi.string().min(5).max(255).required()
    });
    return schema.validate(req);
}

function validateLogin(req) {
    const schema = joi.object({
        email: joi.string().min(5).max(255).email().required(),
        password: joi.string().min(5).max(255).required()
    });
    return schema.validate(req);
}

router.post('/register', async (req, res) => {
    const { error } = validateRegister(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        let user = await User.findOne({
            $or: [
                { email: req.body.email },
                { username: req.body.username }
            ]
        });
        if (user) return res.status(400).send({ message: 'Gebruiker bestaat al.' });

        user = new User({
            username: req.body.username,
            email: req.body.email,
            password: req.body.password
        });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);

        await user.save();
        res.status(201).send({ message: 'Registratie succesvol!', username: user.username });
    } catch (error) {
        console.error('Registratiefout:', error);
        if (isDatabaseUnavailable(error)) {
            return res.status(503).send({ message: 'Database niet bereikbaar. Controleer je MongoDB Atlas IP whitelist.' });
        }
        if (error.code === 11000) {
            return res.status(400).send({ message: 'Gebruiker bestaat al.' });
        }
        res.status(500).send({ message: 'Serverfout bij registreren.' });
    }
});

router.post('/login', async (req, res) => {
    const { error } = validateLogin(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const user = await User.findOne({ email: req.body.email });
        if (!user) return res.status(400).send({ message: 'Ongeldig email of wachtwoord.' });
        if (!user.password) return res.status(400).send({ message: 'Ongeldig email of wachtwoord.' });

        const validPassword = await bcrypt.compare(req.body.password, user.password);
        if (!validPassword) return res.status(400).send({ message: 'Ongeldig email of wachtwoord.' });

        const token = jwt.sign(
            { _id: user._id, username: user.username, isAdmin: user.isAdmin }, 
            process.env.JWT_SECRET || 'vives_geheim_token', 
            { expiresIn: '1h' }
        );

        res.send({ message: 'Inloggen succesvol!', token: token });
    } catch (error) {
        console.error('Loginfout:', error);
        if (isDatabaseUnavailable(error)) {
            return res.status(503).send({ message: 'Database niet bereikbaar. Controleer je MongoDB Atlas IP whitelist.' });
        }
        res.status(500).send({ message: 'Serverfout bij inloggen.' });
    }
});

module.exports = router;
