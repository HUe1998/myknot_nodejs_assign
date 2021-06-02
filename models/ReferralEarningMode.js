const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReferralEarningSchema = new Schema({
    _id: String,
    parent1Split: {
        type: Number,
        default: 40
    },
    parent2Split: {
        type: Number,
        default: 20
    },
    parent3Split: {
        type: Number,
        default: 10
    }
});

const ReferralEarningMode = mongoose.model('ReferralEarningMode', ReferralEarningSchema);
module.exports = ReferralEarningMode;