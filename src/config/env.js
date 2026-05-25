require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  deepseekApiKey: process.env.DEEPSEEK_API_KEY,
  appBasePath: process.env.APP_BASE_PATH || '/ReMon',
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

module.exports = env;
