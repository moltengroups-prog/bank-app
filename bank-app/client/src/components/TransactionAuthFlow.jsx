/**
 * TransactionAuthFlow — reusable 2-step banking authorization component.
 *
 * Step 1 (intro):  Show transaction summary + masked contact → user clicks NEXT
 *                  → onRequestOTP() fires → transitions to step 2.
 * Step 2 (code):   6-digit OTP input + optional ATM/Debit card section
 *                  → user enters code → onVerify(token, code) fires.
 *
 * Props:
 *   pageTitle        string   AppHeader center title
 *   transactionType  string   "Wire Transfer" | "Bill Payment" | …
 *   amount           number   Raw amount (formatted for display)
 *   recipient        string   Recipient / payee name
 *   fromAccount      string   Source account name (optional)
 *   onRequestOTP     async () => string   Calls server, returns OTP session token
 *   onVerify         async (token, code) => void   Throws on failure
 *   onCancel         () => void
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppHeader from './AppHeader';
import LegalDisclosure from './LegalDisclosure';
import { useAuthStore } from '../store/authStore';

const RESEND_SECS    = 30;
const MAX_RESENDS    = 3;

// ── Helpers ───────────────────────────────────────────────────────

function fmtUSD(n) {
  return '$' + Number(n || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2, maximumFractionDigits: 2,
  });
}

function maskPhone(phone) {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length < 4) return null;
  return `***-***-${d.slice(-4)}`;
}

function maskEmail(email) {
  if (!email) return 'your email';
  return email.replace(/^(.{2})(.*)(@.*)$/, (_, a, b, c) => a + b.replace(/./g, '•') + c);
}

function cardExpiryFormat(raw) {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length > 2) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

// ── OTP digit input row ───────────────────────────────────────────

function OTPBoxes({ digits, setDigits, error, disabled, inputRefs, onPaste }) {
  const handleChange = (idx, val) => {
    const clean = val.replace(/\D/g, '').slice(-1);
    const next  = [...digits];
    next[idx]   = clean;
    setDigits(next);
    if (clean && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  return (
    <div className="flex gap-2.5 justify-center" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          className={[
            'w-11 h-[52px] text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors bg-white',
            d       ? 'border-[#002D72] text-[#002D72]' : 'border-gray-300 text-gray-300',
            error   ? 'border-red-400'                   : '',
            disabled ? 'opacity-50'                      : 'focus:border-[#002D72]',
          ].join(' ')}
        />
      ))}
    </div>
  );
}

// ── ATM / Debit card section ──────────────────────────────────────

function DebitCardSection({ useOtpOnly, setUseOtpOnly, cardData, setCardData, disabled }) {
  function Field({ label, value, onChange, placeholder, maxLen, pattern }) {
    return (
      <div className="flex items-center justify-between py-[15px] border-b border-gray-100 last:border-0">
        <span className="text-[14px] text-gray-800">{label}</span>
        <input
          type="text"
          inputMode="numeric"
          value={value}
          onChange={(e) => {
            let v = e.target.value.replace(/[^0-9/]/g, '');
            if (maxLen) v = v.slice(0, maxLen);
            onChange(v);
          }}
          placeholder={placeholder}
          disabled={disabled || useOtpOnly}
          className="text-[14px] text-[#002D72] font-medium text-right bg-transparent outline-none w-40 disabled:opacity-40 placeholder-gray-300"
          style={{ direction: 'rtl' }}
        />
      </div>
    );
  }

  return (
    <div className="mt-6">
      <p className="text-[15px] font-semibold text-gray-900 mb-3">ATM/Debit card details</p>

      <div className={`bg-white rounded-xl border border-gray-200 px-4 transition-opacity ${useOtpOnly ? 'opacity-40' : ''}`}>
        <Field
          label="Card number (last 6 digits)"
          value={cardData.last6}
          onChange={(v) => setCardData({ ...cardData, last6: v.slice(0, 6) })}
          placeholder="••••••"
          maxLen={6}
        />
        <Field
          label="Expiration date"
          value={cardData.expiry}
          onChange={(v) => setCardData({ ...cardData, expiry: cardExpiryFormat(v) })}
          placeholder="MM/YY"
          maxLen={5}
        />
        <Field
          label="Security code (3 or 4 digits)"
          value={cardData.cvv}
          onChange={(v) => setCardData({ ...cardData, cvv: v.slice(0, 4) })}
          placeholder="•••"
          maxLen={4}
        />
        <Field
          label="ATM/Debit card PIN"
          value={cardData.pin}
          onChange={(v) => setCardData({ ...cardData, pin: v.slice(0, 4) })}
          placeholder="••••"
          maxLen={4}
        />
      </div>

      {/* Skip card checkbox */}
      <button
        type="button"
        className="flex items-center gap-2.5 mt-3 w-full"
        onClick={() => setUseOtpOnly(!useOtpOnly)}
        disabled={disabled}
      >
        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
          useOtpOnly ? 'bg-[#002D72] border-[#002D72]' : 'bg-white border-gray-400'
        }`}>
          {useOtpOnly && (
            <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <span className="text-[13px] text-gray-600 text-left leading-snug">
          Verify using authorization code only (I don't have an ATM/Debit card)
        </span>
      </button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function TransactionAuthFlow({
  pageTitle     = 'Send Money',
  transactionType,
  amount,
  recipient,
  fromAccount,
  onRequestOTP,
  onVerify,
  onCancel,
}) {
  const user = useAuthStore((s) => s.user);

  const phone        = maskPhone(user?.phoneNumber);
  const email        = maskEmail(user?.email);
  const maskedContact = phone || email;
  const contactType   = phone ? 'mobile number' : 'email';

  // ── Step state ────────────────────────────────────────────────────
  const [step,         setStep]         = useState('intro'); // 'intro' | 'code'
  const [otpToken,     setOtpToken]     = useState('');
  const [requesting,   setRequesting]   = useState(false);
  const [requestError, setRequestError] = useState('');

  // Code entry
  const [digits,    setDigits]    = useState(['', '', '', '', '', '']);
  const [verifying, setVerifying] = useState(false);
  const [error,     setError]     = useState('');
  const inputRefs = useRef([]);

  // Resend
  const [resendSecs,  setResendSecs]  = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [resending,   setResending]   = useState(false);

  // Debit card (optional)
  const [useOtpOnly, setUseOtpOnly] = useState(true);
  const [cardData,   setCardData]   = useState({ last6: '', expiry: '', cvv: '', pin: '' });

  // Resend countdown
  useEffect(() => {
    if (resendSecs <= 0) return;
    const id = setTimeout(() => setResendSecs((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [resendSecs]);

  // Auto-focus first box when entering code step
  useEffect(() => {
    if (step === 'code') {
      setTimeout(() => inputRefs.current[0]?.focus(), 120);
    }
  }, [step]);

  // ── Helpers ───────────────────────────────────────────────────────

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

  const cardValid = !useOtpOnly
    ? (cardData.last6.length === 6 &&
       /^\d{2}\/\d{2}$/.test(cardData.expiry) &&
       cardData.cvv.length >= 3 &&
       cardData.pin.length === 4)
    : true;

  const canVerify = isComplete && cardValid;

  // ── OTP request ───────────────────────────────────────────────────

  // Step 1 NEXT button
  const handleNextClick = async () => {
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
      await onVerify(otpToken, code, !useOtpOnly ? cardData : null);
    } catch (err) {
      setError(err.message || 'Verification failed. Please try again.');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setVerifying(false);
    }
  }, [canVerify, verifying, otpToken, code, useOtpOnly, cardData, onVerify]);

  useEffect(() => {
    if (step === 'code' && isComplete && !verifying && cardValid) handleVerify();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  // ═══════════════════════════════════════════════════════════════
  // STEP 1 — Authorization Required
  // ═══════════════════════════════════════════════════════════════

  if (step === 'intro') {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader showBackButton onBack={onCancel} title={pageTitle} />

        <div className="flex-1 pt-[64px] overflow-y-auto pb-28">
          <div className="px-5 pt-7 pb-4">

            {/* Main heading */}
            <h1 className="text-[22px] font-bold text-gray-900 leading-snug mb-4">
              Additional authorization is required for this transaction
            </h1>

            {/* Security copy */}
            <p className="text-[14px] text-gray-600 leading-relaxed mb-6">
              For your security, we require additional authorization for this transaction.
              You need to provide a verification code to confirm your identity.
            </p>

            {/* Transaction summary card */}
            {(transactionType || amount || recipient) && (
              <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200 mb-6">
                {transactionType && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-gray-500">Transfer Type</span>
                    <span className="text-[13px] font-semibold text-gray-800">{transactionType}</span>
                  </div>
                )}
                {amount > 0 && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-gray-500">Amount</span>
                    <span className="text-[13px] font-bold text-gray-900">{fmtUSD(amount)}</span>
                  </div>
                )}
                {recipient && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-gray-500">Recipient</span>
                    <span className="text-[13px] font-semibold text-gray-800 text-right max-w-[55%]">{recipient}</span>
                  </div>
                )}
                {fromAccount && (
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-[13px] text-gray-500">From Account</span>
                    <span className="text-[13px] text-gray-800">{fromAccount}</span>
                  </div>
                )}
              </div>
            )}

            {/* Verification method */}
            <div className="mb-4">
              <p className="text-[13px] text-gray-500 mb-1">Verification Method</p>
              <p className="text-[15px] font-semibold text-gray-900">SMS Authentication</p>
            </div>

            {/* Masked contact */}
            <div className="mb-6">
              <p className="text-[13px] text-gray-500 mb-1 capitalize">{contactType}</p>
              <p className="text-[15px] font-semibold text-gray-900">{maskedContact}</p>
            </div>

            {/* Error on request */}
            {requestError && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-red-600 text-sm">{requestError}</p>
              </div>
            )}

            <LegalDisclosure />
          </div>
        </div>

        {/* ── Fixed footer ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-3">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-[15px] border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleNextClick}
              disabled={requesting}
              className="flex-1 py-[15px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full disabled:opacity-50"
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
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════
  // STEP 2 — Authorization Code
  // ═══════════════════════════════════════════════════════════════

  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <AppHeader showBackButton onBack={() => setStep('intro')} title="Authorization Code" />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-28">
        <div className="px-5 pt-7">

          {/* Header copy */}
          <p className="text-[15px] text-gray-700 leading-relaxed mb-1">
            An authorization code was sent to your {contactType}.
          </p>
          <p className="text-[18px] font-semibold text-gray-900 mb-6">{maskedContact}</p>

          {/* 6-digit boxes */}
          <OTPBoxes
            digits={digits}
            setDigits={setDigits}
            error={error}
            disabled={verifying}
            inputRefs={inputRefs}
            onPaste={handlePaste}
          />

          {/* Expiry + resend */}
          <div className="mt-4 mb-2">
            <p className="text-[13px] text-gray-500">
              The code expires 10 minutes after you request it.{' '}
              {resendCount < MAX_RESENDS ? (
                resendSecs > 0 ? (
                  <span className="text-gray-400">Resend available in <span className="tabular-nums">{resendSecs}s</span></span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resending}
                    className="text-[#1a6bbf] font-medium disabled:opacity-50"
                  >
                    {resending ? 'Sending…' : 'Request another authorization code.'}
                  </button>
                )
              ) : (
                <span className="text-red-500">Maximum resend attempts reached.</span>
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Divider */}
          <div className="border-t border-gray-200 my-6" />

          {/* ATM / Debit card section */}
          <DebitCardSection
            useOtpOnly={useOtpOnly}
            setUseOtpOnly={setUseOtpOnly}
            cardData={cardData}
            setCardData={setCardData}
            disabled={verifying}
          />

          <div className="h-6" />
        </div>
      </div>

      {/* ── Fixed footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-3">
        <button
          type="button"
          onClick={handleVerify}
          disabled={!canVerify || verifying}
          className="w-full py-[15px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full disabled:opacity-40 transition-colors"
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
