const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('../repositories/authRepository');

async function register({ name, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await authRepository.findByEmail(normalizedEmail);

    if (existingUser) {
        const error = new Error('Email already registered');
        error.statusCode = 400;
        throw error;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await authRepository.createUser({
        name,
        email: normalizedEmail,
        passwordHash,
    });

    return{
        user:{
            id: user._id,
            name: user.name,
            email: user.email,
        },
        token: createToken(user._id),
    };
}
 

async function login({ email, password }) {
    const user = await authRepository.findEmailWithPassword(email.trim().toLowerCase());

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        const error = new Error('Invalid email or password');
        error.statusCode = 401;
        throw error;
    }

    if(user.status !== 'active') {
        const error = new Error('Account is not active');
        error.statusCode = 403;
        throw error;
    }

    return{
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        token: createToken(user._id),
    };
}

function createToken(userId) {
    return jwt.sign({ sub: userId.toString() }, process.env.JWT_SECRET, { expiresIn: '1d' });
}

module.exports = { register, login };