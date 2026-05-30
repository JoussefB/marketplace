function admin(req, res, next) {
    
    if (!req.user.isAdmin) return res.status(403).send({ message: 'Toegang geweigerd, u heeft geen adminrechten.' });

    next();
}

module.exports = admin;