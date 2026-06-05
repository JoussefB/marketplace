const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', [auth, admin], async (req, res) => {
    try {
        const transactions = await Transaction.find()
            .populate('buyer', 'username')
            .populate('seller', 'username')
            .populate('listingId');

        res.send(transactions);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij ophalen transacties.' });
    }
});

router.get('/my-transactions', auth, async (req, res) => {
    try {
        const transactions = await Transaction.find({
            $or: [
                { buyer: req.user._id },
                { seller: req.user._id }
            ]
        })
            .populate('buyer', 'username')
            .populate('seller', 'username')
            .populate('listingId');

        res.send(transactions);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij ophalen van je transacties.' });
    }
});

router.get('/:id', [auth, validateObjectId], async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id)
            .populate('buyer', 'username')
            .populate('seller', 'username')
            .populate('listingId');

        if (!transaction) return res.status(404).send({ message: 'Transactie niet gevonden.' });

        const isBuyer = transaction.buyer._id.toString() === req.user._id;
        const isSeller = transaction.seller._id.toString() === req.user._id;

        if (!isBuyer && !isSeller && !req.user.isAdmin) {
            return res.status(403).send({ message: 'Je mag deze transactie niet bekijken.' });
        }

        res.send(transaction);
    } catch (error) {
        res.status(500).send({ message: 'Serverfout bij ophalen transactie.' });
    }
});

module.exports = router;
