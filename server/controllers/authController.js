const authService = require('../services/authService');

async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        if (typeof name !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
            return res.status(400).json({ success: false, message: 'Name and email are required, and password must be at least 8 characters' });
        }

        const result = await authService.register({ name: name.trim(), email, password, });

        return res.status(201).json({ success: true, ...result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to register account' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body;

        if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password ) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const result = await authService.login({ email, password });

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to login' });
    }
}

module.exports = { register, login };