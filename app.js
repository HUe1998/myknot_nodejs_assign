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

/**
 * POST handler to add money in a users wallet. Send it as a JSON in this format:
 * {
 *              "userId": Number,
 *              "amount": Number,
 *              "referralEarningId": String,
 *              "description": String
 *              
 * }
 * userId -> ID of user as saved in users collection. 
 * amount -> amount added to wallet.
 * referralEarningId -> ID of referral earning split to be used for it's parents.
 */
app.post('/api/wallet/add', async (req, res) => {
    const { userId, amount, referralEarningId, description } = req.body;
    const { balance, parent1Id, parent2Id, parent3Id }
        = await User.findById(userId);
    await User.findByIdAndUpdate(userId, { balance: amount + balance });
    const { parent1Split, parent2Split, parent3Split }
        = await ReferralEarningMode.findById(referralEarningId);
    const [parent1Amount, parent2Amount, parent3Amount]
        = [
            amount * parent1Split * 0.01,
            amount * parent2Split * 0.01,
            amount * parent3Split * 0.01
        ]
    await Wallet.create({ userId, amount, description });
    if (typeof parent1Id !== 'undefined') {
        const { balance: parent1balance } = await User.findById(parent1Id);
        await Wallet.create({
            userId: parent1Id,
            amount: parent1Amount,
            description: `Referral Split because Parent 1 of userID ${userId}`
        });
        await User.findByIdAndUpdate(parent1Id,
            { balance: parent1balance + parent1Amount }
        );
    }
    if (typeof parent2Id !== 'undefined') {
        const { balance: parent2balance } = await User.findById(parent2Id);
        await Wallet.create({
            userId: parent2Id,
            amount: parent2Amount,
            description: `Referral Split because Parent 2 of userID ${userId}`
        });
        await User.findByIdAndUpdate(parent2Id,
            { balance: parent2balance + parent2Amount }
        );
    }
    if (typeof parent3Id !== 'undefined') {
        const { balance: parent3balance } = await User.findById(parent3Id);
        await Wallet.create({
            userId: parent3Id,
            amount: parent3Amount,
            description: `Referral Split because Parent 3 of userID ${userId}`
        });
        await User.findByIdAndUpdate(parent3Id,
            { balance: parent3balance + parent3Amount }
        );
    }
    // Redirect to same homepage so GET handler could give response.
    res.redirect('/api/wallet/add');
});

// GET handler to output the format required for POST request
app.get('/api/wallet/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'wallets' Collection

            Use this format:
            {
                "userId": Number,               // Required
                "amount": Number,               // Required
                "referralEarningId": String,    // Required
                "description": String
            }`);
});

// GET handler to output the format required for POST request
app.get('/api/user/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'users' Collection

            Use this format:
            {
                "_id": Number,              // Required
                "name": String,             // Required
                "balance": Number       // Defaults to 0
                "parent1Id": Number
            }
            
            If no parent, do not input "parent1Id" field`);
});

/**
 * POST handler to add user. Send it as a JSON in this format:
 * {
 *              "_id": Number,
 *              "name": String,
 *              "balance": Number
 *              "parent1Id": Number
 *              
 * }
 * _id -> ID of user. Requires a unique number.
 * parent1Id -> ID of parent. If no parent, do not put this field in JSON.
 */
app.post('/api/user/add', async (req, res) => {
    const { _id, name, balance, parent1Id } = req.body;
    if (typeof parent1Id === 'undefined') {
        await User.create({ _id, name, balance });
    } else {
        const parent1 = await User.findById(parent1Id);
        await User.create({
            _id,
            name,
            balance,
            parent1Id,
            parent2Id: parent1.parent1Id,
            parent3Id: parent1.parent2Id
        });
    }
    res.redirect('/api/user/add');
});


// GET handler to output the format required for POST request
app.get('/api/referralEarning/add', (req, res) => {
    res.send(`Use 'POST' request to add document to 'ReferralEarningModes' Collection
            with splits in Percentage.

            Use this format:
            {
                "_id": String,              // Required
                "parent1Split": Number,     // Defaults to 40%
                "parent2Split": Number,     // Defaults to 20%
                "parent3Split": Number      // Defaults to 10%
            }`);
});

/**
 * POST request to add a Reward Split Mode for parents. 
 * Send it as a JSON in this format:
 * {
 *          "_id": String,              // Required
 *          "parent1Split": Number,     // Defaults to 40%
 *          "parent2Split": Number,     // Defaults to 20%
 *          "parent3Split": Number      // Defaults to 10%
 * }
 * _id is a String given so we could trace it back. e.g. "_id": "common"
 * could be used to find reward split designated by "common".
 * The parents split should be in percentage.
 */
app.post('/api/referralEarning/add', async (req, res) => {
    await ReferralEarningMode.create(req.body);
    res.redirect('/api/referralEarning/add');
});