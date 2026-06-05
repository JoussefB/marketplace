require('dotenv').config();
const express = require('express'); 
const mongoose = require('mongoose');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const skinsRouter = require('./routes/skins'); 
const usersRouter = require('./routes/users');
const listingsRouter = require('./routes/listings');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');

const app = express();

app.use(express.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

function connectToDatabase() {
    return mongoose.connect(process.env.MONGO_URI)
        .then(() => console.log('Succesvol verbonden met MongoDB...'))
        .catch(err => console.error('Kon geen verbinding maken met MongoDB:', err));
}

app.use('/api/skins',skinsRouter);
app.use('/api/users',usersRouter);
app.use('/api/listings',listingsRouter);
app.use('/api/auth',authRouter);
app.use('/api/transactions',transactionsRouter);

app.get('/api-docs.json', (req, res) => {
    res.send(swaggerDocument);
});

app.get('/', (req, res) => {
    res.send('Welcome to the marketplace'); 
});

if (require.main === module) {
    connectToDatabase();

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server draait op poort ${port}...`));
}

module.exports = { app, connectToDatabase };
