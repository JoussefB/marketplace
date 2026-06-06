const express = require('express');
const router = express.Router();
const joi = require('joi');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');
const { User } = require('../models/User');
const { Skin } = require('../models/Skin');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

function validateListing(listing) {
    const schema = joi.object({
        price: joi.number().min(1).required(),
        skinId: joi.string().hex().length(24).required()
    });
    return schema.validate(listing);
}

function validateListingUpdate(listing) {
    const schema = joi.object({
        price: joi.number().min(1).required(),
        status: joi.string().valid('active', 'sold', 'cancelled')
    });
    return schema.validate(listing);
}


router.get('/', async (req, res) => {
    try {
       
        const listings = await Listing.find({ status: 'active' })
            .populate('seller', 'username')
            .populate('skinId');
        res.send(listings);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij het ophalen van de marktplaats.' });
    }
});

router.get('/search', async (req, res) => {
    try {
        const schema = joi.object({
            maxPrice: joi.number().min(1),
            minPrice: joi.number().min(1),
            rarity: joi.string().valid('Common', 'Uncommon', 'Rare', 'Epic', 'Legendary')
        });

        const { error } = schema.validate(req.query);
        if (error) return res.status(400).send({ message: error.details[0].message });

        const filter = { status: 'active' };

        if (req.query.minPrice || req.query.maxPrice) {
            filter.price = {};
            if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
            if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
        }

        if (req.query.rarity) filter['skin.rarity'] = req.query.rarity;

        const listings = await Listing.find(filter)
            .populate('seller', 'username')
            .populate('skinId');
        res.send(listings);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij het zoeken naar advertenties.' });
    }
});

router.get('/my-listings', auth, async (req, res) => {
    try {
        const listings = await Listing.find({ seller: req.user._id })
            .populate('seller', 'username')
            .populate('skinId');
        res.send(listings);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij ophalen van je advertenties.' });
    }
});

router.get('/:id', validateObjectId, async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id)
            .populate('seller', 'username')
            .populate('skinId');
        if (!listing) return res.status(404).send({ message: 'Advertentie niet gevonden.' });

        res.send(listing);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij het ophalen van de advertentie.' });
    }
});

router.post('/',auth, async (req, res) => {
    const { error } = validateListing(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const seller = await User.findById(req.user._id);
        if (!seller) return res.status(404).send({ message: 'Verkoper niet gevonden.' });

        const skin = await Skin.findById(req.body.skinId);
        if (!skin) return res.status(404).send({ message: 'Skin niet gevonden.' });

        const listing = new Listing({
            seller: req.user._id,
            skinId: skin._id,
            skin: {
                name: skin.name,
                weaponType: skin.weaponType,
                rarity: skin.rarity,
                releaseSeason: skin.releaseSeason
            },
            price: req.body.price
        });

        const savedListing = await listing.save();
        res.status(201).send(savedListing);
    } catch (error) {
        res.status(500).send({ message: 'Kon de advertentie niet plaatsen vanwege een serverfout.' });
    }
});

router.post('/:id/buy', [auth, validateObjectId], async (req, res) => {
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

router.put('/:id', [auth, validateObjectId], async (req, res) => {
    const { error } = validateListingUpdate(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).send({ message: 'Advertentie niet gevonden.' });

        if (listing.seller.toString() !== req.user._id && !req.user.isAdmin) {
            return res.status(403).send({ message: 'Je mag deze advertentie niet aanpassen.' });
        }

        listing.price = req.body.price;
        if (req.body.status) listing.status = req.body.status;

        const savedListing = await listing.save();
        res.send(savedListing);
    } catch (error) {
        res.status(500).send({ message: 'Kon de advertentie niet aanpassen.' });
    }
});

router.delete('/:id', [auth, validateObjectId], async (req, res) => {
    try {
        const listing = await Listing.findById(req.params.id);
        if (!listing) return res.status(404).send({ message: 'Advertentie niet gevonden.' });

        if (listing.seller.toString() !== req.user._id && !req.user.isAdmin) {
            return res.status(403).send({ message: 'Je mag deze advertentie niet verwijderen.' });
        }

        await Listing.findByIdAndDelete(req.params.id);
        res.send({ message: 'Advertentie verwijderd.', listing });
    } catch (error) {
        res.status(500).send({ message: 'Kon de advertentie niet verwijderen.' });
    }
});

module.exports = router;
