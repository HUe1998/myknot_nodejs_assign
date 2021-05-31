const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    // UserId is _id
    name: String,
    parent1Id: ObjectId,
    parent2Id: ObjectId,
    parent3Id: ObjectId
});

const User = mongoose.model('User', UserSchema);
module.exports = User;