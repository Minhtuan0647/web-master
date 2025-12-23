const normalizeOrigin = (origin = '') => origin.replace(/\/$/, '').trim();

const parseList = (value = '') => {
  return value
    .split(',')
    .map((item) => normalizeOrigin(item))
    .filter(Boolean);
};

const nodeEnv = (process.env.NODE_ENV || 'development').trim();
const isProduction = nodeEnv === 'production';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProduction) {
    throw new Error('JWT_SECRET environment variable is required in production environments');
  }

  console.warn('⚠️  JWT_SECRET is not set. Falling back to a weak development secret.');
  jwtSecret = 'development-secret-change-me';
}

if (isProduction && jwtSecret.length < 32) {
  throw new Error('JWT_SECRET must be at least 32 characters long in production');
}

const defaultOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  process.env.FRONTEND_URL,
  process.env.ADMIN_FRONTEND_URL
]
  .map((origin) => normalizeOrigin(origin || ''))
  .filter(Boolean);

const envOrigins = parseList(process.env.ALLOWED_ORIGINS);
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins]));

// In development, allow all origins if ALLOWED_ORIGINS is not explicitly set
// This makes development easier while maintaining security in production
// If ALLOWED_ORIGINS is set (even if empty), respect it. Otherwise, allow all in dev.
const hasExplicitOrigins = process.env.ALLOWED_ORIGINS !== undefined;
const allowAllInDev = !isProduction && !hasExplicitOrigins;

if (!isProduction) {
  console.log('🔧 CORS Configuration:');
  console.log(`   Environment: ${nodeEnv}`);
  console.log(`   Allowed origins: ${allowedOrigins.length > 0 ? allowedOrigins.join(', ') : 'None configured'}`);
  console.log(`   Has explicit ALLOWED_ORIGINS: ${hasExplicitOrigins}`);
  console.log(`   Allow all in dev: ${allowAllInDev}`);
}

module.exports = {
  allowedOrigins,
  allowAllInDev,
  isProduction,
  jwtSecret,
  nodeEnv
};
