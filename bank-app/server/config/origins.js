// Centralized allowed-origins list used by both Express CORS middleware
// and Socket.IO CORS config. Accepts comma-separated values so multiple
// Vercel preview/production domains can be whitelisted in one variable.
//
// Required Railway environment variables:
//   CLIENT_URL = https://bank-app.vercel.app
//   ADMIN_URL  = https://bank-admin.vercel.app

function parseOrigins(envVar, fallback) {
  const val = process.env[envVar];
  if (!val) return [fallback];
  return val.split(',').map((s) => s.trim()).filter(Boolean);
}

export const ALLOWED_ORIGINS = [
  ...parseOrigins('CLIENT_URL', 'http://localhost:3000'),
  ...parseOrigins('ADMIN_URL',  'http://localhost:3001'),
];
