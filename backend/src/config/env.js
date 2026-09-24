import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const BACKEND_ROOT = path.resolve(__dirname, '..', '..');

dotenv.config({ path: path.join(BACKEND_ROOT, '.env'), quiet: true });

const bool = (v, fallback = false) => (v === undefined || v === '' ? fallback : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));
const int = (v, fallback) => {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
};
const list = (v) => (v ? String(v).split(',').map((s) => s.trim()).filter(Boolean) : []);

const nodeEnv = process.env.NODE_ENV || 'development';

export const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: int(process.env.PORT, 5100),

  // ---- Database (MySQL) — fill these in backend/.env ----
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: int(process.env.DB_PORT, 3306),
    user: process.env.DB_USER || '',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'db_masmin',
    connectionLimit: int(process.env.DB_CONNECTION_LIMIT, 10),
    ssl: bool(process.env.DB_SSL, false),
    // create db_masmin (if the user may) and the tables on start-up
    autoMigrate: bool(process.env.DB_AUTO_MIGRATE, true),
  },

  // ---- Auth ----
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '12h',
  adminEmail: (process.env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: process.env.ADMIN_PASSWORD || '',
  adminName: process.env.ADMIN_NAME || 'Site Admin',

  // ---- HTTP ----
  corsOrigins: list(process.env.CORS_ORIGINS),
  trustProxy: bool(process.env.TRUST_PROXY, false),
  serveFrontend: bool(process.env.SERVE_FRONTEND, false),
  frontendDist: process.env.FRONTEND_DIST || path.resolve(BACKEND_ROOT, '..', 'frontend', 'dist'),

  // ---- Behaviour flags ----
  // SANDBOX_MODE=true returns OTP codes in the API response so the flow can be tested
  // without an email/SMS provider (this is what the original sandbox UI did). Set to false in production.
  sandboxMode: bool(process.env.SANDBOX_MODE, true),
  // 'sandbox' simulates the Razorpay popup; 'razorpay' creates real orders and verifies signatures.
  paymentMode: (process.env.PAYMENT_MODE || 'sandbox').toLowerCase(),
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
  demoLimitEnabled: bool(process.env.DEMO_LIMIT_ENABLED, true),

  // ---- Email (optional; without it OTP/notification mails are only logged) ----
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: int(process.env.SMTP_PORT, 587),
    secure: bool(process.env.SMTP_SECURE, false),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.MAIL_FROM || 'CallMaster <no-reply@localhost>',
  },
  notifyEmail: process.env.NOTIFY_EMAIL || '',

  // ---- Optional integrations ----
  smsWebhookUrl: process.env.SMS_WEBHOOK_URL || '',
  voiceDemoWebhookUrl: process.env.VOICE_DEMO_WEBHOOK_URL || '',

  // ---- Deep Customer Insights: real call audit (Deepgram speech-to-text → Claude audit) ----
  audit: {
    deepgramKey: process.env.DEEPGRAM_API_KEY || '',
    deepgramModel: process.env.DEEPGRAM_MODEL || 'nova-3',
    deepgramLanguage: process.env.DEEPGRAM_LANGUAGE || 'multi', // English + Hindi (and code-switching) in one pass
    anthropicKey: process.env.ANTHROPIC_API_KEY || '',
    anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-5',
    maxPerEmailPerDay: int(process.env.AUDIT_MAX_PER_EMAIL_DAY, 3),
    concurrency: int(process.env.AUDIT_CONCURRENCY, 2),
  },

  // ---- Uploads ----
  uploadDir: path.resolve(BACKEND_ROOT, process.env.UPLOAD_DIR || 'uploads'),
  uploadMaxMb: int(process.env.UPLOAD_MAX_MB, 25),
  dataRetentionDays: int(process.env.DATA_RETENTION_DAYS, 30),
};

/** True when both API keys are present; otherwise the demo falls back to the randomised sandbox scorecard. */
export const auditIsLive = () => Boolean(env.audit.deepgramKey && env.audit.anthropicKey);

export function assertEnv() {
  const problems = [];
  if (!env.db.user) problems.push('DB_USER is not set — add your MySQL connection details (DB_HOST, DB_USER, DB_PASSWORD, DB_NAME) to backend/.env');
  if (!env.db.name) problems.push('DB_NAME is not set (expected db_masmin)');
  if (!env.jwtSecret || env.jwtSecret.length < 16) problems.push('JWT_SECRET must be set to a random string of at least 16 characters');
  if (!['sandbox', 'razorpay'].includes(env.paymentMode)) problems.push('PAYMENT_MODE must be "sandbox" or "razorpay"');
  if (env.paymentMode === 'razorpay' && (!env.razorpayKeyId || !env.razorpayKeySecret)) {
    problems.push('PAYMENT_MODE=razorpay requires RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET');
  }
  if (problems.length) {
    const err = new Error(`Invalid configuration:\n  - ${problems.join('\n  - ')}`);
    err.isConfigError = true;
    throw err;
  }
}
