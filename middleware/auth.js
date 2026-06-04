const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

function auth(req, res, next) {
    const token = req.header('x-auth-token');
    
    if (!token) return res.status(401).send({ message: 'Toegang geweigerd. Geen token aangeleverd.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vives_geheim_token');
        if (!mongoose.Types.ObjectId.isValid(decoded._id)) {
            return res.status(400).send({ message: 'Ongeldig token.' });
        }
        
        req.user = decoded;
        
        next();
    } catch (ex) {
        res.status(400).send({ message: 'Ongeldig token.' });
    }
}

module.exports = auth;
