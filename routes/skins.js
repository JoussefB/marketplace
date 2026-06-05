const express = require('express');
const router = express.Router();
const { Skin } = require('../models/Skin');
const joi = require('joi');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

function validateSkin(skin) {
    const schema = joi.object({
        name: joi.string().min(3).max(50).required(),
        weaponType: joi.string().min(3).max(50).required(),
        rarity: joi.string().valid("Common","Uncommon","Rare","Epic","Legendary").required(),
        releaseSeason: joi.string().required()
    });

    return schema.validate(skin);
}

router.get('/', async (req, res) => {
    try {
        const skins = await Skin.find();
        res.send(skins); 
    } catch (error) {
        res.status(500).send({ message: 'Er ging iets fout bij het ophalen van de skins.' });
    }
});

router.get('/rarity/:rarity', async (req, res) => {
    try {
        const { error } = joi.string().valid("Common","Uncommon","Rare","Epic","Legendary").validate(req.params.rarity);
        if (error) return res.status(400).send({ message: 'Ongeldige rarity.' });

        const skins = await Skin.find({ rarity: req.params.rarity });
        res.send(skins);
    } catch (error) {
        res.status(500).send({ message: 'Er ging iets fout bij het filteren van skins.' });
    }
});

router.get('/:id', validateObjectId, async (req, res) => {
    try {
        const skin = await Skin.findById(req.params.id);
        if (!skin) return res.status(404).send({ message: 'Skin niet gevonden.' });

        res.send(skin);
    } catch (error) {
        res.status(500).send({ message: 'Er ging iets fout bij het ophalen van de skin.' });
    }
});


router.post('/',[auth,admin], async (req, res) => {

    const { error } = validateSkin(req.body);
    if (error) {
        return res.status(400).send({ message: error.details[0].message });
    }
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
        res.status(500).send({ message: 'Kon de skin niet opslaan. Kijk je data na.' });
    }
});

router.put('/:id', [auth, admin, validateObjectId], async (req, res) => {
    const { error } = validateSkin(req.body);
    if (error) return res.status(400).send({ message: error.details[0].message });

    try {
        const skin = await Skin.findByIdAndUpdate(
            req.params.id,
            {
                name: req.body.name,
                weaponType: req.body.weaponType,
                rarity: req.body.rarity,
                releaseSeason: req.body.releaseSeason
            },
            { new: true, runValidators: true }
        );

        if (!skin) return res.status(404).send({ message: 'Skin niet gevonden.' });

        res.send(skin);
    } catch (error) {
        res.status(500).send({ message: 'Kon de skin niet aanpassen.' });
    }
});

router.delete('/:id', [auth, admin, validateObjectId], async (req, res) => {
    try {
        const skin = await Skin.findByIdAndDelete(req.params.id);
        if (!skin) return res.status(404).send({ message: 'Skin niet gevonden.' });

        res.send({ message: 'Skin verwijderd.', skin });
    } catch (error) {
        res.status(500).send({ message: 'Kon de skin niet verwijderen.' });
    }
});

module.exports = router;
