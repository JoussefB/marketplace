const assert = require('node:assert');
const test = require('node:test');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { app } = require('../index');
const { User } = require('../models/User');
const { Skin } = require('../models/Skin');
const Listing = require('../models/Listing');
const Transaction = require('../models/Transaction');

const jwtSecret = process.env.JWT_SECRET || 'vives_geheim_token';
const testMongoUri = process.env.TEST_MONGO_URI || 'mongodb://127.0.0.1:27017/marketplace_test';

let server;
let baseUrl;

function createToken(user) {
    return jwt.sign(
        {
            _id: user._id.toString(),
            username: user.username,
            isAdmin: user.isAdmin
        },
        jwtSecret,
        { expiresIn: '1h' }
    );
}

async function createUser(overrides = {}) {
    const password = overrides.password || 'Azerty123';
    const hashedPassword = await bcrypt.hash(password, 10);
    const unique = `${Date.now()}-${Math.round(Math.random() * 100000)}`;

    return User.create({
        username: overrides.username || `user-${unique}`,
        email: overrides.email || `user-${unique}@student.vives.be`,
        password: hashedPassword,
        credits: overrides.credits === undefined ? 120 : overrides.credits,
        isAdmin: overrides.isAdmin === undefined ? false : overrides.isAdmin
    });
}

async function sendRequest(method, path, options = {}) {
    const headers = {};

    if (options.body) headers['Content-Type'] = 'application/json';
    if (options.token) headers['x-auth-token'] = options.token;

    const response = await fetch(`${baseUrl}${path}`, {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined
    });

    const text = await response.text();
    const body = text ? JSON.parse(text) : {};

    return {
        status: response.status,
        body
    };
}

async function clearDatabase() {
    await User.deleteMany({});
    await Skin.deleteMany({});
    await Listing.deleteMany({});
    await Transaction.deleteMany({});
}

test.before(async () => {
    await mongoose.connect(testMongoUri);

    server = app.listen(0);
    await new Promise(resolve => server.once('listening', resolve));

    const address = server.address();
    baseUrl = `http://127.0.0.1:${address.port}`;
});

test.beforeEach(async () => {
    await clearDatabase();
});

test.after(async () => {
    await clearDatabase();
    await mongoose.connection.close();
    await new Promise(resolve => server.close(resolve));
});

test('POST /api/auth/register creates a user without returning a password', async () => {
    const res = await sendRequest('POST', '/api/auth/register', {
        body: {
            username: 'RegisterUser',
            email: 'register@student.vives.be',
            password: 'Azerty123'
        }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.username, 'RegisterUser');
    assert.strictEqual(res.body.password, undefined);

    const user = await User.findOne({ email: 'register@student.vives.be' });
    assert.notStrictEqual(user, null);
    assert.notStrictEqual(user.password, 'Azerty123');
});

test('POST /api/auth/login returns a JWT for valid credentials', async () => {
    await createUser({
        username: 'LoginUser',
        email: 'login@student.vives.be',
        password: 'Azerty123'
    });

    const res = await sendRequest('POST', '/api/auth/login', {
        body: {
            email: 'login@student.vives.be',
            password: 'Azerty123'
        }
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(typeof res.body.token, 'string');
});

test('GET /api/skins is public', async () => {
    await Skin.create({
        name: 'Glacier',
        weaponType: 'MP7',
        rarity: 'Epic',
        releaseSeason: 'Operation Black Ice'
    });

    const res = await sendRequest('GET', '/api/skins');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].name, 'Glacier');
});

test('POST /api/skins requires an admin token', async () => {
    const normalUser = await createUser({ isAdmin: false });

    const res = await sendRequest('POST', '/api/skins', {
        token: createToken(normalUser),
        body: {
            name: 'Glacier',
            weaponType: 'MP7',
            rarity: 'Epic',
            releaseSeason: 'Operation Black Ice'
        }
    });

    assert.strictEqual(res.status, 403);
});

test('POST /api/skins lets an admin create a skin', async () => {
    const admin = await createUser({ isAdmin: true });

    const res = await sendRequest('POST', '/api/skins', {
        token: createToken(admin),
        body: {
            name: 'Glacier',
            weaponType: 'MP7',
            rarity: 'Epic',
            releaseSeason: 'Operation Black Ice'
        }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.name, 'Glacier');
});

test('GET /api/skins/:id validates ObjectId values', async () => {
    const res = await sendRequest('GET', '/api/skins/not-a-valid-id');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.message, 'Ongeldig ObjectId.');
});

test('GET /api/users is admin-only and never returns passwords', async () => {
    const admin = await createUser({ isAdmin: true });
    await createUser({ username: 'VisibleUser' });

    const res = await sendRequest('GET', '/api/users', {
        token: createToken(admin)
    });

    assert.strictEqual(res.status, 200);
    assert.ok(res.body.length >= 2);
    assert.strictEqual(res.body[0].password, undefined);
});

test('GET /api/users/me returns the logged-in user', async () => {
    const user = await createUser({ username: 'ProfileUser' });

    const res = await sendRequest('GET', '/api/users/me', {
        token: createToken(user)
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.username, 'ProfileUser');
    assert.strictEqual(res.body.password, undefined);
});

test('GET /api/users/me/inventory returns the logged-in user inventory', async () => {
    const user = await createUser();
    user.inventory.push({
        name: 'Glacier',
        weaponType: 'MP7',
        rarity: 'Epic',
        releaseSeason: 'Operation Black Ice'
    });
    await user.save();

    const res = await sendRequest('GET', '/api/users/me/inventory', {
        token: createToken(user)
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].name, 'Glacier');
});

test('GET /api/users/:id validates ObjectId values', async () => {
    const admin = await createUser({ isAdmin: true });

    const res = await sendRequest('GET', '/api/users/not-a-valid-id', {
        token: createToken(admin)
    });

    assert.strictEqual(res.status, 400);
});

test('GET /api/skins/rarity/:rarity filters skins by rarity', async () => {
    await Skin.create({
        name: 'Glacier',
        weaponType: 'MP7',
        rarity: 'Epic',
        releaseSeason: 'Operation Black Ice'
    });
    await Skin.create({
        name: 'Black Ice',
        weaponType: 'R4-C',
        rarity: 'Rare',
        releaseSeason: 'Operation Black Ice'
    });

    const res = await sendRequest('GET', '/api/skins/rarity/Epic');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].rarity, 'Epic');
});

test('POST /api/listings lets a logged-in user create a listing', async () => {
    const seller = await createUser();

    const res = await sendRequest('POST', '/api/listings', {
        token: createToken(seller),
        body: {
            price: 350,
            skinData: {
                name: 'Glacier',
                weaponType: 'MP7',
                rarity: 'Epic',
                releaseSeason: 'Operation Black Ice'
            }
        }
    });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.price, 350);
    assert.strictEqual(res.body.seller, seller._id.toString());
});

test('GET /api/listings/my-listings returns only the logged-in user listings', async () => {
    const seller = await createUser();
    const otherSeller = await createUser();

    await Listing.create({
        seller: seller._id,
        price: 350,
        skin: {
            name: 'Glacier',
            weaponType: 'MP7',
            rarity: 'Epic',
            releaseSeason: 'Operation Black Ice'
        }
    });
    await Listing.create({
        seller: otherSeller._id,
        price: 250,
        skin: {
            name: 'Black Ice',
            weaponType: 'R4-C',
            rarity: 'Rare',
            releaseSeason: 'Operation Black Ice'
        }
    });

    const res = await sendRequest('GET', '/api/listings/my-listings', {
        token: createToken(seller)
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].seller._id, seller._id.toString());
});

test('GET /api/listings/search filters active listings by max price and rarity', async () => {
    const seller = await createUser();

    await Listing.create({
        seller: seller._id,
        price: 350,
        skin: {
            name: 'Glacier',
            weaponType: 'MP7',
            rarity: 'Epic',
            releaseSeason: 'Operation Black Ice'
        }
    });
    await Listing.create({
        seller: seller._id,
        price: 800,
        skin: {
            name: 'Gold Dust',
            weaponType: 'MP5',
            rarity: 'Legendary',
            releaseSeason: 'Operation Dust Line'
        }
    });

    const res = await sendRequest('GET', '/api/listings/search?maxPrice=500&rarity=Epic');

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].price, 350);
    assert.strictEqual(res.body[0].skin.rarity, 'Epic');
});

test('POST /api/listings/:id/buy transfers credits, embeds skin and logs transaction', async () => {
    const seller = await createUser({ credits: 120 });
    const buyer = await createUser({ credits: 500 });
    const listing = await Listing.create({
        seller: seller._id,
        price: 350,
        skin: {
            name: 'Glacier',
            weaponType: 'MP7',
            rarity: 'Epic',
            releaseSeason: 'Operation Black Ice'
        }
    });

    const res = await sendRequest('POST', `/api/listings/${listing._id}/buy`, {
        token: createToken(buyer)
    });

    assert.strictEqual(res.status, 200);

    const updatedBuyer = await User.findById(buyer._id);
    const updatedSeller = await User.findById(seller._id);
    const updatedListing = await Listing.findById(listing._id);
    const transaction = await Transaction.findOne({ listingId: listing._id });

    assert.strictEqual(updatedBuyer.credits, 150);
    assert.strictEqual(updatedBuyer.inventory.length, 1);
    assert.strictEqual(updatedSeller.credits, 470);
    assert.strictEqual(updatedListing.status, 'sold');
    assert.notStrictEqual(transaction, null);
    assert.strictEqual(transaction.price, 350);
});

test('GET /api/transactions/my-transactions returns transactions for logged-in user', async () => {
    const seller = await createUser();
    const buyer = await createUser();
    const listing = await Listing.create({
        seller: seller._id,
        price: 350,
        skin: {
            name: 'Glacier',
            weaponType: 'MP7',
            rarity: 'Epic',
            releaseSeason: 'Operation Black Ice'
        }
    });

    await Transaction.create({
        buyer: buyer._id,
        seller: seller._id,
        listingId: listing._id,
        price: 350
    });

    const res = await sendRequest('GET', '/api/transactions/my-transactions', {
        token: createToken(buyer)
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.length, 1);
    assert.strictEqual(res.body[0].price, 350);
});

test('GET /api/transactions is admin-only', async () => {
    const normalUser = await createUser();

    const res = await sendRequest('GET', '/api/transactions', {
        token: createToken(normalUser)
    });

    assert.strictEqual(res.status, 403);
});

test('GET /api/listings/:id validates ObjectId values', async () => {
    const res = await sendRequest('GET', '/api/listings/not-a-valid-id');

    assert.strictEqual(res.status, 400);
});
