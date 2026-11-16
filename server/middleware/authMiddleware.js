const authRepository = require('../repositories/authRepository');
async function authenticate(req, res, next) {
  try {
    if (!req.session?.userId) return res.status(401).json({ success: false, message: 'Authentication required' });
    const user = await authRepository.findById(req.session.userId);
    if (!user || user.status !== 'active') {
      await new Promise((resolve, reject) => req.session.destroy(error => error ? reject(error) : resolve()));
      res.clearCookie(req.app.locals.sessionCookieName, req.app.locals.sessionCookieOptions);
      return res.status(403).json({ success: false, message: 'Invalid or inactive account' });
    }
    req.user = { id: user._id.toString(), role: user.role };
    req.customer = { id: user._id.toString(), name: user.name, email: user.email };
    return next();
  } catch (error) { return next(error); }
}
module.exports = authenticate;
