const { approvedUri } = require('./m4Guard.cjs');
const mongoose = require('mongoose');
const { createApp } = require('../app');
let server;
process.on('message', async message => {
  try {
    if (message.action === 'start') {
      const uri = approvedUri(message.uri);
      await mongoose.connect(uri, { autoIndex: false, autoCreate: false, serverSelectionTimeoutMS: 2000 });
      const app = createApp({ client: mongoose.connection.getClient(), dbName: mongoose.connection.name,
        secret: message.secret, origins: ['http://127.0.0.1:38148'], production: false,
        clock: () => message.now });
      server = app.listen(0, '127.0.0.1', () => process.send({ port: server.address().port }));
    } else if (message.action === 'stop') {
      server?.closeAllConnections();
      await new Promise(resolve => server ? server.close(resolve) : resolve());
      await mongoose.disconnect(); process.exit(0);
    }
  } catch { process.send({ failed: true }); }
});
