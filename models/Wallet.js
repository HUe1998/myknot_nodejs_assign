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
    description: {
        type: String,
        default: `${this.amount} added to userID ${this.userId}`
    }
});

const Wallet = mongoose.model('Wallet', WalletSchema);
module.exports = Wallet;
