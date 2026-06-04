const express = require('express');
const router = express.Router();
const joi = require('joi');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');
const { User } = require('../models/User');
const auth = require('../middleware/auth');

function validateListing(listing) {
    const schema = joi.object({
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

router.post('/',auth, async (req, res) => {
    const { error } = validateListing(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const seller = await User.findById(req.user._id);
        if (!seller) return res.status(404).send({ message: 'Verkoper niet gevonden.' });

        const listing = new Listing({
            seller: req.user._id,
            skin: req.body.skinData,
            price: req.body.price
        });

        const savedListing = await listing.save();
        res.status(201).send(savedListing);
    } catch (error) {
        res.status(500).send({ message: 'Kon de advertentie niet plaatsen vanwege een serverfout.' });
    }
});

router.post('/:id/buy', auth, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).send({ message: 'Advertentie niet gevonden.' });
        if (listing.status !== 'active') return res.status(400).send({ message: 'Deze advertentie is niet meer actief.' });
        if (listing.seller.toString() === req.user._id) return res.status(400).send({ message: 'Je kunt je eigen skin niet kopen.' });

        const buyer = await User.findById(req.user._id);
        const seller = await User.findById(listing.seller);

        if (!buyer) return res.status(404).send({ message: 'Koper niet gevonden.' });
        if (!seller) return res.status(404).send({ message: 'Verkoper niet gevonden.' });
        if (buyer.credits < listing.price) return res.status(400).send({ message: 'Onvoldoende credits.' });

        buyer.credits -= listing.price;
        seller.credits += listing.price;
        buyer.inventory.push(listing.skin);
        listing.status = 'sold';

        const transaction = new Transaction({
            buyer: buyer._id,
            seller: seller._id,
            listingId: listing._id,
            price: listing.price
        });

        await buyer.save();
        await seller.save();
        await listing.save();
        await transaction.save();

        res.send({
            message: 'Aankoop succesvol!',
            transaction
        });
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij het kopen van de skin.' });
    }
});

module.exports = router;
