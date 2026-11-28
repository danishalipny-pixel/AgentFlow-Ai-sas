import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '5201', 10),
  apiUrl: process.env.API_URL || 'http://localhost:5201',
  appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:5200',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5200',
  
  // Database
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/agentflow',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  
  // Auth
  jwtSecret: process.env.JWT_SECRET || 'agentflow_dev_jwt_secret_change_in_production_min_32_characters_12345',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'agentflow_dev_refresh_secret_change_in_production_min_32_characters_12345',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  encryptionKey: process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef', // 32 bytes in hex

  // AI Service & Local Ollama
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5202',
  ollamaBaseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
  defaultModel: process.env.DEFAULT_AI_MODEL || 'qwen2.5:7b',
  coderModel: process.env.CODER_AI_MODEL || 'qwen2.5-coder:7b',
  aiTimeoutMs: parseInt(process.env.AI_EXECUTION_TIMEOUT_SECONDS || '180', 10) * 1000,
  
  // Safety
  enforceApprovalForMutations: process.env.ENFORCE_APPROVAL_FOR_MUTATIONS !== 'false',
  ssrfProtectionEnabled: process.env.SSRF_PROTECTION_ENABLED !== 'false',

  // Email / SMTP
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'AgentFlow AI <no-reply@agentflow.ai>',
    isConfigured: Boolean(process.env.SMTP_HOST && process.env.SMTP_USER),
  },

  // Stripe
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    isConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  },

  // Platform Admin Seed
  platformAdmin: {
    email: process.env.PLATFORM_ADMIN_EMAIL || 'admin@agentflow.ai',
    password: process.env.PLATFORM_ADMIN_PASSWORD || 'AdminSecurePassword123!',
  },

  // Storage
  uploadDir: process.env.UPLOAD_DIR || path.resolve(__dirname, '../../uploads'),
  maxFileSize: parseInt(process.env.UPLOAD_MAX_FILE_SIZE_BYTES || '15728640', 10), // 15MB
};
