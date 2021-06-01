const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    _id: Number,                    // UserId is _id
    name: String,
    parent1Id: Number,
    parent2Id: Number,
    parent3Id: Number
});

const User = mongoose.model('User', UserSchema);
module.exports = User;