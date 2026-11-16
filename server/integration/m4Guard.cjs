function approvedUri(value) {
  // Deliberately no dotenv, SRV resolution, credentials, query options or fallback.
  if (typeof value !== 'string' || !/^mongodb:\/\/127\.0\.0\.1:37147\/vento_m4_[a-z0-9_]+$/.test(value)) {
    throw new Error('Explicit approved loopback Milestone 4 database URI required');
  }
  return value;
}
module.exports = { approvedUri };
