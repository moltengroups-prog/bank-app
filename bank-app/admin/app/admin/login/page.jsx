'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '../../../store/adminStore.js';

const ADMIN_ROLES = ['admin', 'support-agent'];

export default function AdminLoginPage() {
  const router  = useRouter();
  const { login, loading, error, clearError } = useAdminStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // Redirect if already holding a valid admin session
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('adminUser') || 'null'); } catch {}
    if (token && user && ADMIN_ROLES.includes(user.role)) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    const ok = await login(email.trim(), password);
    if (ok) router.replace('/admin/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-white font-bold text-xl">Bank of Molten</h1>
          <p className="text-slate-400 text-sm mt-1">Admin Console</p>
        </div>

        {/* Card */}
        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
          <h2 className="text-white font-semibold text-sm mb-5">Sign in to your account</h2>

          {/* Error banner — always visible, above the form */}
          {error && (
            <div className="mb-4 bg-red-500/15 border border-red-500/30 rounded-lg px-4 py-3">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-300 text-sm leading-snug">{error}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearError(); }}
                required
                autoComplete="email"
                placeholder="admin@bankmolten.com"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-md transition-colors mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-[#475569] text-xs mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
