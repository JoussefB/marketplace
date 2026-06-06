const mongoose = require('mongoose');
const { skinSchema } = require('./Skin'); 

const listingSchema = new mongoose.Schema({
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    skinId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skin',
        required: true
    },
    skin: {
        type: skinSchema,
        required: true
    },
    price: {
        type: Number,
        required: true,
        min: 1
    },
    status: {
        type: String,
        enum: ['active', 'sold', 'cancelled'],
        default: 'active'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Listing = mongoose.model('Listing', listingSchema);

module.exports = Listing;
