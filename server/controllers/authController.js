const authService = require('../services/authService');

async function register(req, res) {
    try {
        const { name, email, password } = req.body || {};
        const normalizedName = typeof name === 'string' ? name.trim() : '';
        const normalizedEmail = typeof email === 'string' ? email.trim() : '';

        if (!normalizedName || !normalizedEmail || typeof password !== 'string' || !password.trim() || password.length < 8) {
            return res.status(400).json({ success: false, message: 'Name and email are required, and password must be at least 8 characters' });
        }

        let result;
        await req.sessionStore.authenticate(req, async () => {
            result = await authService.register({ name: normalizedName, email: normalizedEmail, password });
            return result;
        });
        return res.status(201).json({ success: true, user: result.user, csrfToken: req.session.csrfToken });
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

        let result;
        await req.sessionStore.authenticate(req, async () => {
            result = await authService.login({ email: normalizedEmail, password });
            return result;
        });
        return res.status(200).json({ success: true, user: result.user, csrfToken: req.session.csrfToken });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.statusCode ? error.message : 'Unable to login' });
    }
}

const { pinCookieDeadline } = require('../config/sessionStore');
async function me(req, res) {
    return res.json({ success: true, user: req.customer, csrfToken: req.session.csrfToken });
}
async function renew(req, res, next) {
    try {
        const result = await req.sessionStore.renewActivity(req.sessionID);
        pinCookieDeadline(req.session, result.expiresAt);
        // Cookie-only changes don't trigger Set-Cookie with rolling:false.
        const dependencyRequire = require('node:module').createRequire(require.resolve('express-session'));
        const value = dependencyRequire('cookie-signature').sign(req.sessionID, req.app.locals.sessionSecret);
        res.cookie(req.app.locals.sessionCookieName, `s:${value}`, {
            ...req.app.locals.sessionCookieOptions, expires: result.expiresAt,
        });
        return res.json({ success: true, renewed: result.renewed, expiresAt: result.expiresAt });
    } catch (error) { return next(error); }
}
async function logout(req, res, next) {
    try {
        await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
        res.clearCookie(req.app.locals.sessionCookieName, req.app.locals.sessionCookieOptions);
        return res.json({ success: true });
    } catch (error) { return next(error); }
}
module.exports = { register, login, me, renew, logout };
