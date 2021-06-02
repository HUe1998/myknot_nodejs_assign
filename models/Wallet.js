const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    description: String
});

const Wallet = mongoose.model('Wallet', WalletSchema);
module.exports = Wallet;
