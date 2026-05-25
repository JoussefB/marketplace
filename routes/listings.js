const express = require('express');
const router = express.Router();
const joi = require('joi');
const Listing = require('../models/Listing');
const { User } = require('../models/User');

function validateListing(listing) {
    const schema = joi.object({
        sellerId: joi.string().required(), 
        price: joi.number().min(1).required(),
        skinData: joi.object({
            name: joi.string().required(),
            weaponType: joi.string().required(),
            rarity: joi.string().required(),
            releaseSeason: joi.string().allow('', null)
        }).required()
    });
    return schema.validate(listing);
}


router.get('/', async (req, res) => {
    try {
       
        const listings = await Listing.find({ status: 'active' }).populate('seller', 'username');
        res.send(listings);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij het ophalen van de marktplaats.' });
    }
});

router.post('/', async (req, res) => {
    const { error } = validateListing(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const seller = await User.findById(req.body.sellerId);
        if (!seller) return res.status(404).send({ message: 'Verkoper niet gevonden.' });

        const listing = new Listing({
            seller: req.body.sellerId,
            skin: req.body.skinData,
            price: req.body.price
        });

        const savedListing = await listing.save();
        res.status(201).send(savedListing);
    } catch (error) {
        res.status(500).send({ message: 'Kon de advertentie niet plaatsen vanwege een serverfout.' });
    }
});

module.exports = router;