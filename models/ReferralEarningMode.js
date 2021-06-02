const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ReferralEarningSchema = new Schema({
    _id: String,
    parent1Split: Number,
    parent2Split: Number,
    parent3Split: Number
});

const ReferralEarningMode = mongoose.model('ReferralEarningMode', ReferralEarningSchema);
module.exports = ReferralEarningMode;