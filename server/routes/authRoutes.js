const express = require('express');
const authController = require('../controllers/authController');

const router = express.Router();
const authenticate = require('../middleware/authMiddleware');
const csrf = (req, res, next) => req.app.locals.csrf.validate(req, res, next);
router.use((req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
router.get('/csrf', (req, res) => req.app.locals.csrf.bootstrap(req, res));

router.post('/register', csrf, authController.register);
router.post('/login', csrf, authController.login);
router.get('/me', authenticate, authController.me);
router.post('/activity', authenticate, csrf, authController.renew);
router.post('/logout', authenticate, csrf, authController.logout);

module.exports = router;
