import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logos/logo.png';
import { authService } from '../services/authService';
import { useAuthStore } from '../store/authStore';
import { connectSocket } from '../socket/socket';
import { useNotificationStore } from '../store/notificationStore';

const RESEND_COOLDOWN = 60; // seconds

export default function OTPVerificationPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const completeLogin      = useAuthStore((s) => s.completeLogin);
  const subscribeToSocket  = useNotificationStore((s) => s.subscribeToSocket);

  const otpToken = location.state?.otpToken;
  const email    = location.state?.email || '';

  // Redirect to sign-in if landed here without a session token
  useEffect(() => {
    if (!otpToken) navigate('/', { replace: true });
  }, [otpToken, navigate]);

  const [digits,     setDigits]     = useState(['', '', '', '', '', '']);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [resendSecs, setResendSecs] = useState(RESEND_COOLDOWN);
  const [resending,  setResending]  = useState(false);
  const inputRefs = useRef([]);

  // Count down resend timer
  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSecs]);

  const code = digits.join('');
  const isComplete = code.length === 6 && digits.every((d) => d !== '');

  function handleDigitChange(idx, val) {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[idx]   = clean;
    setDigits(next);
    setError('');
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  }

  function handleKeyDown(idx, e) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  }

  function handlePaste(e) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = [...digits];
    pasted.split('').forEach((ch, i) => { if (i < 6) next[i] = ch; });
    setDigits(next);
    const focusIdx = Math.min(pasted.length, 5);
    inputRefs.current[focusIdx]?.focus();
  }

  async function handleVerify() {
    if (!isComplete || loading) return;
    setLoading(true);
    setError('');
    try {
      const data = await authService.verifyOTP(otpToken, code);
      completeLogin(data);
      // Connect socket after full login
      const socket = connectSocket();
      if (socket) {
        const doSub = () => subscribeToSocket(socket);
        if (socket.connected) doSub();
        else socket.once('connect', doSub);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendSecs > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authService.resendOTP(otpToken);
      setResendSecs(RESEND_COOLDOWN);
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Failed to resend. Please try again.');
    } finally {
      setResending(false);
    }
  }

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : 'your email';

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">

      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-8 pb-5">
        <h1 className="text-[22px] font-extrabold tracking-wide text-[#002D72]">
          BANK OF MOLTEN
        </h1>
        <img src={logo} alt="Bank of Molten" className="h-11 w-auto" />
      </div>

      {/* Card */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm px-6 pt-8 pb-8">

        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-[#002D72]/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-[#002D72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
        </div>

        <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
          Verification Required
        </h2>
        <p className="text-sm text-gray-500 text-center mb-1 leading-relaxed">
          We sent a 6-digit code to
        </p>
        <p className="text-sm font-semibold text-[#002D72] text-center mb-7">
          {maskedEmail}
        </p>

        {/* 6-digit input */}
        <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
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
              className={`w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors bg-gray-50
                ${d ? 'border-[#002D72] text-gray-900' : 'border-gray-200 text-gray-400'}
                ${error ? 'border-red-400' : ''}
                focus:border-[#002D72]`}
            />
          ))}
        </div>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4 leading-snug">{error}</p>
        )}

        {/* Verify button */}
        <button
          type="button"
          onClick={handleVerify}
          disabled={!isComplete || loading}
          className="w-full bg-[#002D72] text-white font-bold text-base tracking-widest py-4 rounded-full mb-5 disabled:opacity-50"
        >
          {loading ? 'Verifying…' : 'VERIFY'}
        </button>

        {/* Resend */}
        <div className="text-center">
          {resendSecs > 0 ? (
            <p className="text-sm text-gray-400">
              Resend code in <span className="font-semibold text-gray-600">{resendSecs}s</span>
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-semibold text-[#1a6bbf] disabled:opacity-50"
            >
              {resending ? 'Sending…' : 'Resend code'}
            </button>
          )}
        </div>

        {/* Back to sign in */}
        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back to sign in
          </button>
        </div>
      </div>

      {/* Dev hint */}
      <p className="text-center text-xs text-gray-400 mt-5 px-6">
        Check the server terminal for your verification code.
      </p>
    </div>
  );
}
