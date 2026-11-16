const express = require('express');
const cors = require('cors');
const { createSessionFoundation } = require('./config/session');
const { createCsrf } = require('./middleware/csrfMiddleware');

function createApp({ client, dbName, secret, origins, production = true, clock, trustProxy = false }) {
  if (!Array.isArray(origins) || !origins.length || origins.some(origin => {
    try { return new URL(origin).origin !== origin || (production && !origin.startsWith('https://')); }
    catch { return true; }
  })) throw new Error('Explicit frontend origins required');
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', trustProxy);
  app.use((req, res, next) => {
    if (req.get('Origin') && !origins.includes(req.get('Origin'))) {
      return res.status(403).json({ success: false, message: 'Origin rejected' });
    }
    next();
  });
  app.use(cors({ origin: origins, credentials: true,
    methods: ['GET', 'POST', 'PUT', 'OPTIONS'], allowedHeaders: ['Content-Type', 'X-CSRF-Token'] }));
  app.use(express.json({ limit: '32kb' }));
  const foundation = createSessionFoundation({ client, dbName, secret, production, clock });
  app.locals.sessionStore = foundation.store;
  app.locals.sessionSecret = secret;
  app.locals.sessionCookieName = production ? '__Host-vento.sid' : 'vento.sid.dev';
  app.locals.sessionCookieOptions = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };
  app.locals.csrf = createCsrf({ secret, production, origins, clock });
  app.use((req, res, next) => {
    if (req.path.startsWith('/api/events/slug/') || (/^\/api\/events\/[^/]+\/rsvps$/.test(req.path) && req.method === 'POST')
      || req.path === '/api/health') return next();
    res.set('Cache-Control', 'no-store');
    return foundation.middleware(req, res, next);
  });
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/events', require('./routes/eventRoutes'));
  app.use('/api/events', require('./routes/rsvpRoutes'));
  app.get('/api/health', (req, res) => res.json({ success: true, message: 'Vento API is running' }));
  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);
    const status = error.type === 'entity.parse.failed' ? 400 : error.type === 'entity.too.large' ? 413 : 503;
    return res.status(status).json({ success: false, message: status === 503 ? 'Service unavailable' : 'Invalid request body' });
  });
  return app;
}
module.exports = { createApp };
