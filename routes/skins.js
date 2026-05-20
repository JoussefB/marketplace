const express = require('express');
const router = express.Router();
const Skin = require('../models/Skin');

router.get('/', async (req, res) => {
    try {
        const skins = await Skin.find();
        res.send(skins); 
    } catch (error) {
        res.status(500).send({ message: 'Er ging iets fout bij het ophalen van de skins.' });
    }
});


router.post('/', async (req, res) => {
    try {
        const skin = new Skin({
            name: req.body.name,
            weaponType: req.body.weaponType,
            rarity: req.body.rarity,
            releaseSeason: req.body.releaseSeason
        });

        const savedSkin = await skin.save(); 
        res.status(201).send(savedSkin);
    } catch (error) {
        res.status(400).send({ message: 'Kon de skin niet opslaan. Kijk je data na.' });
    }
});

module.exports = router;