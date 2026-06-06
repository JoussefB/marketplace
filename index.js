require('dotenv').config();
const express = require('express'); 
const mongoose = require('mongoose');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger.json');
const skinsRouter = require('./routes/skins'); 
const usersRouter = require('./routes/users');
const listingsRouter = require('./routes/listings');
const authRouter = require('./routes/auth');
const transactionsRouter = require('./routes/transactions');

const app = express();

app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'x-auth-token']
}));
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
    res.send(`
        <!doctype html>
        <html lang="en">
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>Marketplace API</title>
            <style>
                body {
                    margin: 0;
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-family: Arial, sans-serif;
                    background: #f5f5f5;
                    color: #222;
                }

                main {
                    text-align: center;
                }

                a {
                    display: inline-block;
                    margin-top: 16px;
                    padding: 12px 18px;
                    color: white;
                    background: #222;
                    text-decoration: none;
                    border-radius: 4px;
                }
            </style>
        </head>
        <body>
            <main>
                <h1>Marketplace API</h1>
                <a href="/api-docs">Open API documentation</a>
            </main>
        </body>
        </html>
    `); 
});

if (require.main === module) {
    connectToDatabase();

    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log(`Server draait op poort ${port}...`));
}

module.exports = { app, connectToDatabase };
