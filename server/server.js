require('dotenv').config();
const mongoose = require('mongoose');
const { createApp } = require('./app');
const connectDatabase = require('./config/database');
async function start() {
  const production = process.env.NODE_ENV === 'production';
  const origins = (process.env.FRONTEND_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
  if (!process.env.SESSION_SECRET || Buffer.byteLength(process.env.SESSION_SECRET) < 32 || !origins.length) {
    throw new Error('SESSION_SECRET and FRONTEND_ORIGINS must be configured');
  }
  await connectDatabase();
  const app = createApp({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name,
    secret: process.env.SESSION_SECRET, origins, production,
    trustProxy: process.env.TRUST_PROXY_IPS ? process.env.TRUST_PROXY_IPS.split(',').map(value => value.trim()) : false });
  app.listen(process.env.PORT || 5000, () => console.log('Vento API started'));
}
if (require.main === module) start().catch(() => {
  console.error('Vento startup failed; check configuration and database availability'); process.exitCode = 1;
});
module.exports = { start };
