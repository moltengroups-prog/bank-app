// ── Environment config ────────────────────────────────────────────
// NEXT_PUBLIC_ vars are embedded at build time and safe for the browser.
// BACKEND_URL is server-side only — used in next.config.mjs rewrites.
//
// Production values (Vercel dashboard → Settings → Environment Variables):
//   NEXT_PUBLIC_API_URL    = https://your-app.up.railway.app
//   NEXT_PUBLIC_SOCKET_URL = https://your-app.up.railway.app
//   BACKEND_URL            = https://your-app.up.railway.app   ← server-side only

// Full Railway origin (no path) — used to build API calls and socket connections
export const BACKEND_ORIGIN = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API base — appends /api for all REST calls
export const API_URL = `${BACKEND_ORIGIN}/api`;

// WebSocket URL — direct to Railway (Next.js cannot proxy WebSockets)
export const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:8000';

export const IS_PROD = process.env.NODE_ENV === 'production';
