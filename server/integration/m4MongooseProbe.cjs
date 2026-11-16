// Focused advisory reproduction in a separate process, never imported by the app.
const { approvedUri } = require('./m4Guard.cjs');
const uri = approvedUri(process.env.VENTO_M4_TEST_URI);
const mongoose = require('mongoose');
const { randomBytes } = require('node:crypto');
const assert = require('node:assert/strict');
(async () => {
  const conn = await mongoose.createConnection(uri, { sanitizeFilter: true,
    autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 2000 }).asPromise();
  const Model = conn.model('M4SanitizeProbe', new mongoose.Schema({ label: String, guard: String }), 'm4_security_probes');
  const guard = randomBytes(16).toString('hex');
  let connectionSanitizeIgnored, selectorRejected = false;
  try {
    await Model.create({ label: 'synthetic-only', guard });
    assert.ok(await Model.findOne({ label: 'synthetic-only', guard }));
    try {
      const matched = await Model.findOne({ label: 'synthetic-only', guard: { $ne: null } });
      connectionSanitizeIgnored = !!matched;
    } catch (error) {
      // Literal comparison after sanitization correctly fails String casting.
      if (error.name !== 'CastError') throw error;
      selectorRejected = true; connectionSanitizeIgnored = false;
    }
    assert.equal(conn.get('sanitizeFilter'), true);
  } finally { await conn.close(); }
  // Harmless named property, confined to this disposable Node process.
  let virtualPathRejected = false;
  try { new mongoose.Schema({}).virtual('__proto__.m4SyntheticProbe'); }
  catch (error) {
    if (!/special property|invalid|not allowed|reserved/i.test(error.message)) throw error;
    virtualPathRejected = true;
  }
  const virtualPrototypeWrite = Object.prototype.hasOwnProperty('m4SyntheticProbe');
  assert.equal(mongoose.version, '9.11.4');
  assert.equal(connectionSanitizeIgnored, false, 'Connection-level selector defense must hold');
  assert.equal(virtualPrototypeWrite, false, 'Virtual path must not pollute prototypes');
  console.log(JSON.stringify({ mongooseVersion: mongoose.version,
    connectionSanitizeIgnored, selectorRejected, virtualPrototypeWrite, virtualPathRejected,
    applicationExploitDemonstrated: false }));
})().catch(() => { console.error('Focused advisory probe failed; details suppressed'); process.exitCode = 1; });
