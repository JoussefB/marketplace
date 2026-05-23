const express = require('express');
const router = express.Router();
const joi = require('joi'); // Joi weer importeren voor de validatie!
const { User } = require('../models/User');

// Joi validatie voor een nieuwe gebruiker
function validateUser(user) {
    const schema = joi.object({
        username: joi.string().min(3).max(50).required(),
        email: joi.string().min(5).max(255).email().required(),
        credits: joi.number().min(0)
    });
    return schema.validate(user);
}

// GET: Alle gebruikers ophalen
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.send(users);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij ophalen gebruikers.' });
    }
});

// POST: Een nieuwe gebruiker aanmaken (Met Joi check!)
router.post('/', async (req, res) => {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const user = new User({
            username: req.body.username,
            email: req.body.email,
            credits: req.body.credits
        });
        const savedUser = await user.save();
        res.status(201).send(savedUser);
    } catch (error) {
        res.status(500).send({ message: 'Kon gebruiker niet aanmaken (mogelijk bestaat de naam/email al).' });
    }
});

module.exports = router;