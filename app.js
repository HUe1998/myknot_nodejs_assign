const express = require('express');
const mongoose = require('mongoose');
const app = express();
const Wallet = require('./models/Wallet');
const User = require('./models/User');
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/multiLvlReferral',
    { useNewUrlParser: true });
app.listen(4000, () => {
    console.log('App listening on port 4000');
});

app.post('/api/wallet/add', async (req, res) => {
    await Wallet.create(req.body);
    res.redirect('/api/wallet/add');
});

app.get('/api/wallet/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'wallets' Collection

            Use this format:
            {
                "userId": Number,
                "amount": Number,
                "description": String
            }`);
});

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