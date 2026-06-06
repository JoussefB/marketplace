function getJwtSecret() {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET ontbreekt in environment variables.');
    }

    return process.env.JWT_SECRET;
}

module.exports = { getJwtSecret };
