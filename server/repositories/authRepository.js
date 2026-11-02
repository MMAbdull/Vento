const User = require('../models/User');

async function findByEmail(email) {
    return User.findOne({ email });
}

async function createUser(userData) {
    return User.create(userData);
}

async function findEmailWithPassword(email) {
    return User.findOne({ email }).select('+passwordHash');
}

module.exports = {
    findByEmail,
    createUser,
    findEmailWithPassword,
};
