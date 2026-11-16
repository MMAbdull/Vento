const { randomBytes, createHmac, timingSafeEqual } = require('node:crypto');
const equal = (a, b) => typeof a === 'string' && typeof b === 'string'
  && Buffer.byteLength(a) === Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a), Buffer.from(b));

function createCsrf({ secret, production, origins, clock = Date.now }) {
  const name = production ? '__Host-vento.csrf' : 'vento.csrf.dev';

  const cookie = { httpOnly: true, secure: production, sameSite: 'lax', path: '/' };

  const sign = value => createHmac('sha256', secret).update(`csrf:${value}`).digest('hex');

  function bootstrap(req, res) {
    res.set('Cache-Control', 'no-store');

    if (req.session?.userId) return res.json({ success: true, csrfToken: req.session.csrfToken });

    const value = `${randomBytes(32).toString('hex')}.${clock() + 15 * 60 * 1000}`;

    const token = `${value}.${sign(value)}`;

    res.cookie(name, token, { ...cookie, maxAge: 15 * 60 * 1000 });

    return res.json({ success: true, csrfToken: token });
  }

  function validate(req, res, next) {
    const token = req.get('X-CSRF-Token');

    if (!origins.includes(req.get('Origin')) || !req.is('application/json')) {

      return res.status(403).json({ success: false, message: 'Request origin or content type rejected' });
    }

    if (req.session?.userId) {
      if (equal(token, req.session.csrfToken)) return next();
    } else if (typeof token === 'string' && token.length < 256) {
      const raw = (req.headers.cookie || '').split(';').map(item => item.trim())
        .find(item => item.startsWith(`${name}=`))?.slice(name.length + 1);
      let stored;
      try { stored = raw && decodeURIComponent(raw); } catch { stored = null; }
      const [nonce, expiry, signature, extra] = token.split('.');
      if (!extra && /^[a-f0-9]{64}$/.test(nonce || '') && /^\d{13}$/.test(expiry || '')
        && Number(expiry) > clock() && Number(expiry) <= clock() + 15 * 60 * 1000
        && equal(signature, sign(`${nonce}.${expiry}`)) && equal(stored, token)) return next();
    }
    return res.status(403).json({ success: false, message: 'CSRF validation failed' });
  }
  return { bootstrap, validate };
}
module.exports = { createCsrf };
