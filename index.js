const express = require('express'); 
const app = express(); 

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Welcome to the marketplace '); 
});

const port = 3000;
app.listen(port, () => console.log(`Server draait op poort ${port}...`)); 