import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';
import { useAuthStore } from '../store/authStore';

const WIRE_FEE      = 30;
const RESEND_SECS   = 60;
const OTP_MAX_TRIES = 5;

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export default function WireOTPPage() {
  const navigate = useNavigate();

  const selectedRecipient   = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount = useWireRecipientsStore((s) => s.selectedFromAccount);
  const amount              = useWireRecipientsStore((s) => s.amount);
  const memo                = useWireRecipientsStore((s) => s.memo);
  const setWireResult       = useWireRecipientsStore((s) => s.setWireResult);
  const user                = useAuthStore((s) => s.user);

  // Guard — must arrive here from review page
  useEffect(() => {
    if (!selectedRecipient || !selectedFromAccount || !amount) {
      navigate('/wire-transfer/review', { replace: true });
    }
  }, [selectedRecipient, selectedFromAccount, amount, navigate]);

  const [wireOtpToken, setWireOtpToken] = useState('');
  const [requesting,   setRequesting]   = useState(true);
  const [requestError, setRequestError] = useState('');

  const [digits,    setDigits]    = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState('');

  const [resendSecs, setResendSecs] = useState(RESEND_SECS);
  const [resending,  setResending]  = useState(false);

  const inputRefs = useRef([]);

  // ── Request OTP on mount ──────────────────────────────────────────
  const requestOTP = useCallback(async () => {
    setRequesting(true);
    setRequestError('');
    try {
      const res = await api.post('/wire-transfers/request-otp', {});
      setWireOtpToken(res.wireOtpToken);
    } catch (err) {
      setRequestError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setRequesting(false);
    }
  }, []);

  useEffect(() => { requestOTP(); }, [requestOTP]);

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSecs]);

  // ── Digit handlers ────────────────────────────────────────────────
  const handleDigitChange = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[idx]   = clean;
    setDigits(next);
    setError('');
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

  // ── Verify + submit wire ──────────────────────────────────────────
  const handleVerify = useCallback(async () => {
    if (!isComplete || verifying || !wireOtpToken) return;
    setVerifying(true);
    setError('');

    const parsedAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
    const recipientName = [
      selectedRecipient?.firstName,
      selectedRecipient?.lastName,
      selectedRecipient?.businessName,
    ].filter(Boolean).join(' ') || 'Recipient';

    try {
      const res = await api.post('/wire-transfers', {
        fromAccountId: selectedFromAccount.id  || selectedFromAccount._id,
        recipientId:   selectedRecipient._id   || selectedRecipient.id,
        amount:        parsedAmount,
        memo:          (memo || '').trim(),
        wireOtpToken,
        wireOtpCode:   code,
      });

      setWireResult({
        referenceNumber: res.data?.referenceNumber || '—',
        amount:          parsedAmount,
        fee:             WIRE_FEE,
        total:           parsedAmount + WIRE_FEE,
        pendingReview:   res.pendingReview || false,
        recipientName,
        fromAccountName: selectedFromAccount.accountName,
        submittedAt:     new Date(),
      });

      navigate('/wire-transfer/success', { replace: true });
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  }, [isComplete, verifying, wireOtpToken, code, amount, memo, selectedRecipient, selectedFromAccount, setWireResult, navigate]);

  // Auto-submit when all 6 digits are filled
  useEffect(() => {
    if (isComplete && !verifying) handleVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ── Resend ────────────────────────────────────────────────────────
  const handleResend = async () => {
    if (resendSecs > 0 || resending) return;
    setResending(true);
    try {
      await requestOTP();
      setResendSecs(RESEND_SECS);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } finally {
      setResending(false);
    }
  };

  const maskedEmail = user?.email
    ? user.email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '•') + c)
    : 'your email';

  const parsedAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;

  // ── Loading / error on OTP request ───────────────────────────────
  if (requesting) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Send Money" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#002D72] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500 text-sm">Sending verification code…</p>
          </div>
        </div>
      </div>
    );
  }

  if (requestError) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Send Money" />
        <div className="flex-1 flex flex-col items-center justify-center px-6 gap-4">
          <p className="text-red-600 text-sm text-center">{requestError}</p>
          <button
            type="button"
            onClick={requestOTP}
            className="px-8 py-3 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full"
          >
            TRY AGAIN
          </button>
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-500"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <AppHeader showBackButton title="Send Money" />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-10">

        {/* ── Header icon + copy ── */}
        <div className="flex flex-col items-center pt-10 pb-6 px-6">
          <div className="w-16 h-16 rounded-full bg-[#002D72]/10 flex items-center justify-center mb-5">
            <svg className="w-8 h-8 text-[#002D72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-[20px] font-bold text-gray-900 text-center mb-2">
            Additional authorization required
          </h2>
          <p className="text-[14px] text-gray-500 text-center leading-relaxed mb-1">
            We sent a 6-digit code to
          </p>
          <p className="text-[14px] font-semibold text-[#002D72] text-center mb-1">
            {maskedEmail}
          </p>
          <p className="text-[12px] text-gray-400 text-center">
            to verify your {fmtUSD(parsedAmount)} wire transfer
          </p>
        </div>

        {/* ── 6-digit input ── */}
        <div className="flex gap-2 justify-center mb-5 px-6" onPaste={handlePaste}>
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
              disabled={verifying}
              className={[
                'w-11 h-14 text-center text-xl font-bold rounded-xl border-2 outline-none transition-colors bg-gray-50',
                d          ? 'border-[#002D72] text-gray-900' : 'border-gray-200 text-gray-400',
                error      ? 'border-red-400'                  : '',
                verifying  ? 'opacity-50'                       : 'focus:border-[#002D72]',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Verify button */}
        <div className="px-6 mb-4">
          <button
            type="button"
            onClick={handleVerify}
            disabled={!isComplete || verifying}
            className="w-full bg-[#002D72] text-white font-bold text-sm tracking-widest py-4 rounded-full disabled:opacity-40 transition-colors"
          >
            {verifying ? 'VERIFYING…' : 'VERIFY & SEND'}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 text-sm text-center px-6 mb-4 leading-snug">{error}</p>
        )}

        {/* Resend + back */}
        <div className="flex items-center justify-between px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            ← Back
          </button>
          {resendSecs > 0 ? (
            <p className="text-sm text-gray-400">
              Resend in <span className="font-semibold text-gray-600 tabular-nums">{resendSecs}s</span>
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

        {/* Security note */}
        <p className="text-center text-[11px] text-gray-400 mt-6 px-8 leading-snug">
          This code expires in 5 minutes. Up to {OTP_MAX_TRIES} attempts allowed before the code is invalidated.
        </p>

      </div>
    </div>
  );
}
