const authService = require('../services/authService');

async function register(req, res) {
    try {
        const { name, email, password } = req.body || {};
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim() : '';

        if (!normalizedName || !normalizedEmail || typeof password !== 'string' || !password.trim() || password.length < 8) {
            return res.status(400).json({ success: false, message: 'Name and email are required, and password must be at least 8 characters' });
        }

        const result = await authService.register({ name: normalizedName, email: normalizedEmail, password });

        return res.status(201).json({ success: true, ...result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to register account' });
    }
}

async function login(req, res) {
    try {
        const { email, password } = req.body || {};
        const normalizedEmail = typeof email === 'string' ? email.trim() : '';

        if (!normalizedEmail || typeof password !== 'string' || !password.trim()) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const result = await authService.login({ email: normalizedEmail, password });

        return res.status(200).json({ success: true, ...result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to login' });
    }
}

module.exports = { register, login };
