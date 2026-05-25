const app = require('./app');
const env = require('./config/env');

app.listen(env.port, () => {
  console.log(`ReMon running at http://localhost:${env.port}${env.appBasePath}`);
});
