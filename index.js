require('dotenv').config();
const express = require('express'); 
const mongoose = require('mongoose');

const app = express();

app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Succesvol verbonden met MongoDB...'))
    .catch(err => console.error('Kon geen verbinding maken met MongoDB:', err));

app.get('/', (req, res) => {
    res.send('Welcome to the marketplace'); 
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}...`));