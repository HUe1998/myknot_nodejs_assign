const express = require('express');
const mongoose = require('mongoose');
const app = express();
const Wallet = require('./models/Wallet');
const User = require('./models/User');
const ReferralEarningMode = require('./models/ReferralEarningMode');
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/multiLvlReferral',
    { useNewUrlParser: true });
app.listen(4000, () => {
    console.log('App listening on port 4000');
});

// API for GET, POST, PUT, DELETE wallets collection 
app.post('/api/wallet/add', async (req, res) => {
    const { userId, amount, description, referralEarningId } = req.body;
    const { parent1Id, parent2Id, parent3Id } = await User.findById(userId);
    const { parent1Split, parent2Split, parent3Split }
        = await ReferralEarningMode.findById(referralEarningId);

    await Wallet.create({ userId, amount, description });
    if (typeof parent1Id !== 'undefined') {
        await Wallet.create({
            userId: parent1Id,
            amount: amount * parent1Split * 0.01,
            description: "Parent1 Split from child"
        });
    }
    if (typeof parent2Id !== 'undefined') {
        await Wallet.create({
            userId: parent2Id,
            amount: amount * parent2Split * 0.01,
            description: "Parent2 Split from child"
        });
    }
    if (typeof parent3Id !== 'undefined') {
        await Wallet.create({
            userId: parent3Id,
            amount: amount * parent3Split * 0.01,
            description: "Parent3 Split from child"
        });
    }

    res.redirect('/api/wallet/add');
});

app.get('/api/wallet/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'wallets' Collection

            Use this format:
            {
                "userId": Number,
                "amount": Number,
                "description": String,
                "referralEarningId": String
            }`);
});

// API for GET, POST, PUT, DELETE users collection 
app.get('/api/user/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'users' Collection

            Use this format:
            {
                "_id": Number,
                "name": String,
                "parent1Id": Number (Optional)
            }`);
});

app.post('/api/user/add', async (req, res) => {
    const { _id, name, parent1Id } = req.body;
    if (typeof parent1Id === 'undefined') {
        await User.create({ _id, name });
    } else {
        const parent1 = await User.findById(parent1Id);
        await User.create({
            _id: _id,
            name: name,
            parent1Id: parent1Id,
            parent2Id: parent1.parent1Id,
            parent3Id: parent1.parent2Id
        });
    }
    res.redirect('/api/user/add');
});

// API for GET, POST, PUT, DELETE Parent ReferralEarningModes collection

app.get('/api/referralEarning/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'ReferralEarningModes' Collection
            with splits in Percentage.

            Use this format:
            {
                "_id": String,
                "parent1Split": Number,
                "parent2Split": Number,
                "parent3Split": Number
            }`);
});

app.post('/api/referralEarning/add', async (req, res) => {
    await ReferralEarningMode.create(req.body);
    res.redirect('/api/referralEarning/add');
});