const jwt = require('jsonwebtoken');

function auth(req, res, next) {
    const token = req.header('x-auth-token');
    
    if (!token) return res.status(401).send({ message: 'Toegang geweigerd. Geen token aangeleverd.' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'vives_geheim_token');
        
        req.user = decoded;
        
        next();
    } catch (ex) {
        res.status(400).send({ message: 'Ongeldig token.' });
    }
}

module.exports = auth;