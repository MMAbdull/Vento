const { createRequire } = require('node:module');

// Inspect the exact debug copies used by each dependency, even if not deduplicated.
function assertSafeSessionLogging() {
  for (const [dependency, namespace] of [
    ['express-session', 'express-session'], ['connect-mongo', 'connect-mongo'],
  ]) {
    const dependencyRequire = createRequire(require.resolve(dependency));
    if (dependencyRequire('debug').enabled(namespace)) {
      throw new Error('Sensitive session debug logging must be disabled in production');
    }
  }
}

module.exports = { assertSafeSessionLogging };
