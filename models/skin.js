const mongoose = require('mongoose');

const skinSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    weaponType: { 
        type: String, 
        required: true 
    },
    rarity: { 
        type: String, 
        required: true
    },
    releaseSeason: { 
        type: String 
    }
});

const Skin = mongoose.model('Skin', skinSchema);

module.exports = Skin;