const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WalletSchema = new Schema({
    userId: ObjectId,
    amount: Number,
    description: String
});

const Wallet = mongoose.model('Wallet', WalletSchema);
module.exports = Wallet;
