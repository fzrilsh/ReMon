require('dotenv').config();

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 3000,
  databaseUrl: process.env.DATABASE_URL,
  sessionSecret: process.env.SESSION_SECRET || 'fallback-dev-secret',
  aiApiKey: process.env.AI_API_KEY,
  aiBaseUrl: process.env.AI_BASE_URL || 'https://opencode.ai/zen/v1/chat/completions',
  aiModel: process.env.AI_MODEL || 'deepseek-v4-flash-free',
  appBasePath: process.env.APP_BASE_PATH,
  uploadDir: process.env.UPLOAD_DIR || 'public/uploads',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',
};

module.exports = env;
