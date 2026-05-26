'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminStore } from '../../../store/adminStore.js';
import { connectAdminSocket } from '../../../services/socket/socket.js';

const ADMIN_ROLES = ['admin', 'support-agent'];
const RESEND_SECS = 60;

function getSearchParam(key) {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

// ── Shared spinner icon ───────────────────────────────────────────
function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
  );
}

// ── Error banner ──────────────────────────────────────────────────
function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 bg-red-500/15 border border-red-500/30 rounded-lg px-4 py-3">
      <div className="flex items-start gap-2">
        <svg className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-red-300 text-sm leading-snug">{message}</p>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, verifyOTP, resendOTP, loading, error, clearError } = useAdminStore();

  const sessionExpired = getSearchParam('expired') === '1';

  // ── Step 1 state ──────────────────────────────────────────────
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');

  // ── Step 2 (OTP) state ────────────────────────────────────────
  const [step,       setStep]       = useState('credentials'); // 'credentials' | 'otp'
  const [otpToken,   setOtpToken]   = useState('');
  const [digits,     setDigits]     = useState(['', '', '', '', '', '']);
  const [localError, setLocalError] = useState(sessionExpired ? 'Your session expired due to inactivity.' : '');
  const [resendSecs, setResendSecs] = useState(RESEND_SECS);
  const [resending,  setResending]  = useState(false);
  const inputRefs = useRef([]);

  // Redirect if already holding a valid admin session
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    let user = null;
    try { user = JSON.parse(localStorage.getItem('adminUser') || 'null'); } catch {}
    if (token && user && ADMIN_ROLES.includes(user.role)) {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  // Strip ?expired=1 from URL so a manual refresh won't re-show the message
  useEffect(() => {
    if (sessionExpired) {
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss the session-expiry banner after 6 seconds
  useEffect(() => {
    if (!localError) return;
    const id = setTimeout(() => setLocalError(''), 6000);
    return () => clearTimeout(id);
  }, [localError]);

  // Resend countdown
  useEffect(() => {
    if (step !== 'otp' || resendSecs <= 0) return;
    const id = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [step, resendSecs]);

  // ── Step 1: credentials submit ────────────────────────────────
  const handleCredentials = async (e) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    const result = await login(email.trim(), password);
    if (!result) return; // error already in store
    if (result.requiresOTP) {
      setOtpToken(result.otpToken);
      setStep('otp');
      setResendSecs(RESEND_SECS);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    }
  };

  // ── Step 2: OTP digit handling ────────────────────────────────
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : 'your email';

  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[idx]   = clean;
    setDigits(next);
    clearError();
    setLocalError('');
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, 5)]?.focus();
  };

  const code       = digits.join('');
  const isComplete = code.length === 6;

  // ── Step 2: verify OTP ────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (!isComplete || loading) return;
    clearError();
    setLocalError('');
    const ok = await verifyOTP(otpToken, code);
    if (ok) {
      // Connect admin socket after session is established
      connectAdminSocket().catch(() => {});
      router.replace('/admin/dashboard');
    } else {
      // Clear digits on failure so the user retypes
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    }
  }, [isComplete, loading, verifyOTP, otpToken, code, clearError, router]);

  // Submit on completing the 6th digit
  useEffect(() => {
    if (step === 'otp' && isComplete && !loading) {
      handleVerify();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ── Step 2: resend OTP ────────────────────────────────────────
  const handleResend = async () => {
    if (resendSecs > 0 || resending) return;
    setResending(true);
    clearError();
    setLocalError('');
    try {
      await resendOTP(otpToken);
      setResendSecs(RESEND_SECS);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setLocalError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const displayError = error || localError;

  // ── Shared header ─────────────────────────────────────────────
  const Header = () => (
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
  );

  // ── Step 1: credentials ───────────────────────────────────────
  if (step === 'credentials') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="w-full max-w-sm">
          <Header />
          <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">
            <h2 className="text-white font-semibold text-sm mb-5">Sign in to your account</h2>
            <ErrorBanner message={displayError} />
            <form onSubmit={handleCredentials} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); setLocalError(''); }}
                  required
                  autoComplete="email"
                  placeholder="admin@bankmolten.com"
                  className="w-full bg-[#0f172a] border border-[#334155] rounded-md px-3 py-2.5 text-white text-sm placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); setLocalError(''); }}
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
                {loading
                  ? <span className="flex items-center justify-center gap-2"><Spinner /> Signing in…</span>
                  : 'Sign in'}
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

  // ── Step 2: OTP verification ──────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
      <div className="w-full max-w-sm">
        <Header />
        <div className="bg-[#1e293b] rounded-xl p-6 border border-[#334155]">

          {/* OTP heading */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
              <svg className="w-4.5 h-4.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-semibold text-sm">Verification required</p>
              <p className="text-slate-400 text-xs mt-0.5">
                Code sent to <span className="text-slate-300 font-medium">{maskedEmail}</span>
              </p>
            </div>
          </div>

          <ErrorBanner message={displayError} />

          {/* 6-digit boxes */}
          <div className="flex gap-2 justify-center mb-5" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                disabled={loading}
                className={[
                  'w-10 h-12 text-center text-lg font-bold rounded-lg border-2 outline-none transition-colors',
                  'bg-[#0f172a] text-white',
                  d        ? 'border-blue-500'  : 'border-[#334155]',
                  displayError ? 'border-red-500/60' : '',
                  loading  ? 'opacity-50 cursor-not-allowed' : 'focus:border-blue-400',
                ].join(' ')}
              />
            ))}
          </div>

          {/* Verify button */}
          <button
            type="button"
            onClick={handleVerify}
            disabled={!isComplete || loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-md transition-colors"
          >
            {loading
              ? <span className="flex items-center justify-center gap-2"><Spinner /> Verifying…</span>
              : 'Verify & Sign in'}
          </button>

          {/* Resend + back */}
          <div className="flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => { setStep('credentials'); clearError(); setLocalError(''); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              ← Back
            </button>
            {resendSecs > 0 ? (
              <p className="text-xs text-slate-500">
                Resend in <span className="text-slate-300 tabular-nums">{resendSecs}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <p className="text-center text-slate-600 text-[11px] mt-5 leading-snug">
            Check the server terminal for your verification code.
          </p>
        </div>

        <p className="text-center text-[#475569] text-xs mt-6">
          Authorized personnel only. All access is logged.
        </p>
      </div>
    </div>
  );
}
