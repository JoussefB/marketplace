require('dotenv').config();
const express = require('express'); 
const mongoose = require('mongoose');
const skinsRouter = require('./routes/skins'); 
const usersRouter = require('./routes/users');

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Succesvol verbonden met MongoDB...'))
    .catch(err => console.error('Kon geen verbinding maken met MongoDB:', err));

app.use('/api/skins',skinsRouter);
app.use('/api/users',usersRouter);

app.get('/', (req, res) => {
    res.send('Welcome to the marketplace'); 
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}...`));