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
 *              "userId": Number,               // Required
 *              "amount": Number,               // Required
 *              "referralEarningId": String,    // Required
 *              "description": String           // Optional
 *              
 * }
 * userId -> ID of user as saved in users collection. 
 * amount -> amount added to wallet.
 * referralEarningId -> ID of referral earning split to be used for it's parents.
 */
app.post('/api/wallet/create', async (req, res) => {
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
    // Redirect to user wallet's homepage so GET handler could give response.
    res.redirect('/api/wallet');
});

// GET handler that sends all wallet addition as a JSON response
app.get('/api/wallet', async (req, res) => {
    res.json(await Wallet.find({}));
});

// GET handler that sends all wallet addition of a specific user
app.get('/api/wallet/user/:id', async (req, res) => {
    res.json(await Wallet.find({ userId: Number(req.params.id) }));
});

// GET handler to respond with JSON data of specific wallet addition.
app.get('/api/wallet/:id', async (req, res) => {
    res.json(await Wallet.findById(req.params.id));
});

/**
 * POST handler to add user. Send it as a JSON in this format:
 * {
 *              "_id": Number,      // Required
 *              "name": String,     // Required
 *              "balance": Number   // Optional, defaults to 0
 *              "parent1Id": Number // Optional
 *              
 * }
 * _id -> ID of user. Requires a unique number.
 * parent1Id -> ID of parent. If no parent, do not put this field in JSON.
 */
app.post('/api/user/create', async (req, res) => {
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
    res.redirect('/api/user');
});

// GET handler that sends all users as a JSON response
app.get('/api/user', async (req, res) => {
    res.json(await User.find({}));
});

// GET handler that sends specific user as JSON provided '/id/' in url
app.get('/api/user/:id', async (req, res) => {
    res.json(await User.findById(req.params.id));
});

/**
 * PUT handler to update user. Request is a JSON as:
 * {
 *      "name": String,         // Optional
 *      "balance": Number,      // Optional
 *      "parent1Id": Number,    // Optional
 * }
 * Only parent1Id is given because realistically if you are updating a user,
 * the only link to other user is it's parent1. Other links to parent2 and parent3
 * respectively are automated.
 */
app.put('/api/user/:id', async (req, res) => {
    const userId = Number(req.params.id);
    const newParent1Id = req.body.parent1Id;
    const { parent1Id: oldParent1Id } = await User.findById(userId);
    await User.findByIdAndUpdate(userId, req.body);
    if ((typeof newParent1Id !== 'undefined') && (oldParent1Id !== newParent1Id)) {
        const { parent1Id: newParent2Id, parent2Id: newParent3Id } = await User.findById(newParent1Id);
        if (typeof newParent2Id === 'undefined') {
            await User.findByIdAndUpdate(userId, {
                $unset: {
                    parent2Id: undefined,
                    parent3Id: undefined
                }
            });
            await User.updateMany({ parent1Id: userId }, {
                parent2Id: newParent1Id, $unset: { parent3Id: undefined }
            });
        } else if (typeof newParent3Id === 'undefined') {
            await User.findByIdAndUpdate(userId, {
                parent2Id: newParent2Id, $unset: { parent3Id: undefined }
            });
            await User.updateMany({ parent1Id: userId },
                { parent2Id: newParent1Id, parent3Id: newParent2Id }
            );
        } else {
            await User.findByIdAndUpdate(userId,
                { parent2Id: newParent2Id, parent3Id: newParent3Id }
            );
            await User.updateMany({ parent1Id: userId },
                { parent2Id: newParent1Id, parent3Id: newParent2Id }
            );
        }
        await User.updateMany({ parent2Id: userId },
            { parent3Id: newParent1Id }
        );

    }
    res.redirect('/api/user');
});

// DELETE handler for user with ID specified in url.
app.delete('/api/user/:id', async (req, res) => {
    const userId = Number(req.params.id);
    await User.findByIdAndDelete(userId);
    // Remove mention of userId in it's children
    await User.updateMany({ parent1Id: userId }, {
        $unset: {
            parent1Id: undefined,
            parent2Id: undefined,
            parent3Id: undefined
        }
    });
    await User.updateMany({ parent2Id: userId }, {
        $unset: {
            parent2Id: undefined,
            parent3Id: undefined
        }
    });
    await User.updateMany({ parent3Id: userId }, { $unset: { parent3Id: undefined } });
    res.redirect('/api/user');
});


/**
 * POST request to add a Reward Split Mode for parents. 
 * Send it as a JSON in this format:
 * {
 *          "_id": String,              // Required
 *          "parent1Split": Number,     // Optional, Defaults to 40%
 *          "parent2Split": Number,     // Optional, Defaults to 20%
 *          "parent3Split": Number      // Optional, Defaults to 10%
 * }
 * _id is a String given so we could trace it back. e.g. "_id": "common"
 * could be used to find reward split designated by "common".
 * The parents split should be in percentage.
 */
app.post('/api/referralEarning/create', async (req, res) => {
    await ReferralEarningMode.create(req.body);
    res.redirect('/api/referralEarning');
});


// GET handler to output all Referral Earning modes as JSON
app.get('/api/referralEarning', async (req, res) => {
    res.json(await ReferralEarningMode.find({}));
});

// GET handler to output a specific Referral Earning mode using url
app.get('/api/referralEarning/:id', async (req, res) => {
    res.json(await ReferralEarningMode.findById(req.params.id));
});

/**
 * PUT handler to update a Referral Earning Mode. Request as JSON:
 * {
 *      "parent1Split": Number,     // Optional
 *      "parent2Split": Number,     // Optional
 *      "parent3Split": Number      // Optional
 * }
 */
app.put('/api/referralEarning/:id', async (req, res) => {
    await ReferralEarningMode.findByIdAndUpdate(req.params.id, req.body);
    res.redirect('/api/referralEarning');
});

// DELETE handler to delete Referral Earning Mode specified by url
app.delete('/api/referralEarning/:id', async (req, res) => {
    await ReferralEarningMode.findByIdAndDelete(req.params.id, req.body);
    res.redirect('/api/referralEarning');
});
