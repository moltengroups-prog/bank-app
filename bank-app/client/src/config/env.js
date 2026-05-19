// ── Environment config ────────────────────────────────────────────
// CRA (react-scripts) requires the REACT_APP_ prefix for vars to be
// embedded at build time. Set these in Vercel's environment variables
// for production, or in .env.local for local overrides.
//
// Production values (Vercel dashboard → Settings → Environment Variables):
//   REACT_APP_API_URL    = https://your-app.up.railway.app/api
//   REACT_APP_SOCKET_URL = https://your-app.up.railway.app

export const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:8000';

export const IS_PROD = process.env.NODE_ENV === 'production';
