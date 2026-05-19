/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy REST API calls through Next.js so CORS is not needed in dev.
  // In production the admin api.js calls Railway directly via NEXT_PUBLIC_API_URL.
  // BACKEND_URL is server-side only — set it in Vercel environment variables.
  async rewrites() {
    const dest = process.env.BACKEND_URL || 'http://localhost:8000';
    return [
      {
        source:      '/api/:path*',
        destination: `${dest}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
