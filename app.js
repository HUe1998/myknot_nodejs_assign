const express = require('express');
const mongoose = require('mongoose');
const app = express();
const Wallet = require('./models/Wallet');
const User = require('./models/User');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose.connect('mongodb://localhost:27017/multiLvlReferral',
    { useNewUrlParser: true });
app.listen(4000, () => {
    console.log('App listening on port 4000');
});

app.post('/api/wallet/add', (req, res) => {
    console.log(req.body);
    res.send();
});

app.get('/api', (req, res) => {
    res.send('<h1>API Homepage</h1>');
});
