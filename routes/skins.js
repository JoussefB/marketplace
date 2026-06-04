const express = require('express');
const router = express.Router();
const { Skin } = require('../models/Skin');
const joi = require('joi');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

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

module.exports = router;
