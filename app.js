const express = require('express');
const mongoose = require('mongoose');
const app = express();

mongoose.connect('mongodb://localhost:27017/multiLvlReferral',
    { useNewUrlParser: true });
app.listen(4000, () => {
    console.log('App listening on port 4000');
});

const Wallet = require('./models/Wallet.js');

const lmao = Wallet.create({

})