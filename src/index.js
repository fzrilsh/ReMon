const app = require('./app');
const env = require('./config/env');
const { logError } = require('./utils/logger');

process.on('uncaughtException', (error) => {
  logError('UNCAUGHT_EXCEPTION', error);
  console.error('Server crashed. Restart with: npm run dev');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logError('UNHANDLED_REJECTION', reason);
});

app.listen(env.port, () => {
  console.log(`ReMon running at http://localhost:${env.port}${env.appBasePath}`);
});
