import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import AccountPickerModal from '../components/AccountPickerModal';
import AmountInputModal from '../components/AmountInputModal';
import InsetDivider from '../components/InsetDivider';
import { transferService } from '../services/transferService';
import { useDashboardStore } from '../store/dashboardStore';
import { formatBalance } from '../utils/format';

const STEP_FORM    = 'form';
const STEP_REVIEW  = 'review';
const STEP_SUCCESS = 'success';
const STEP_REVIEW_STATUS = 'pending-review';
const STEP_BLOCKED = 'blocked';

function ExternalTransferPage() {
  const navigate       = useNavigate();
  const fetchAccounts  = useDashboardStore((s) => s.fetchAccounts);

  const [step, setStep] = useState(STEP_FORM);

  // Form state
  const [fromAccount,    setFromAccount]    = useState(null);
  const [routingNumber,  setRoutingNumber]  = useState('');
  const [accountNumber,  setAccountNumber]  = useState('');
  const [amount,         setAmount]         = useState('');
  const [amountModal,    setAmountModal]    = useState(false);
  const [fromModal,      setFromModal]      = useState(false);

  // Result
  const [result,   setResult]  = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState('');
  const [checkVisible, setCheckVisible] = useState(false);

  useEffect(() => {
    if (step === STEP_SUCCESS) {
      const t = setTimeout(() => setCheckVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [step]);

  const isReady = Boolean(
    fromAccount &&
    routingNumber.trim().length === 9 &&
    accountNumber.trim().length >= 4 &&
    parseFloat(amount) > 0
  );

  const handleReview = () => {
    if (!isReady) return;
    setError('');
    setStep(STEP_REVIEW);
  };

  const handleSubmit = async () => {
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const res = await transferService.externalTransfer(
        fromAccount.id,
        routingNumber.trim(),
        accountNumber.trim(),
        parseFloat(amount)
      );
      setResult(res);
      if (res.pendingReview) setStep(STEP_REVIEW_STATUS);
      else if (!res.success) setStep(STEP_BLOCKED);
      else setStep(STEP_SUCCESS);
    } catch (err) {
      if (err.data?.fraudBlocked) {
        setResult(err.data);
        setStep(STEP_BLOCKED);
      } else {
        setError(err.message || 'Transfer failed. Please try again.');
        setStep(STEP_REVIEW);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDone = () => {
    fetchAccounts();
    navigate('/pay-transfer');
  };

  // ── Success screen ────────────────────────────────────────────────
  if (step === STEP_SUCCESS && result?.data) {
    const d = result.data;
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader title="Transfer Details" showEricaRight ericaRightCount={3} />
        <div className="flex-1 overflow-y-auto pt-[64px] pb-28">
          <div className="flex flex-col items-center pt-10 pb-8 px-6">
            <div className={`w-[72px] h-[72px] rounded-full border-[2.5px] border-green-500 flex items-center justify-center mb-6 transition-all duration-500 ease-out ${checkVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
              <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-[22px] font-extrabold text-gray-900 text-center leading-snug">Transfer sent</h1>
          </div>

          <div className="bg-white border-t border-b border-gray-200">
            <div className="flex items-start justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900">From</span>
              <div className="text-right">
                <p className="text-[15px] text-gray-900 font-medium">{d.from.accountName}</p>
                <p className="text-[13px] text-gray-500">••••{d.from.last4}</p>
              </div>
            </div>
            <InsetDivider color={100} />
            <div className="flex items-start justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900">To</span>
              <div className="text-right">
                <p className="text-[15px] text-gray-900 font-medium">{d.to.recipientName || 'Recipient'}</p>
                <p className="text-[13px] text-gray-500">••••{d.to.last4}</p>
              </div>
            </div>
            <InsetDivider color={100} />
            <div className="flex items-center justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900">Amount</span>
              <span className="text-[15px] text-gray-900 font-medium">${Number(d.amount).toFixed(2)}</span>
            </div>
            <InsetDivider color={100} />
            <div className="flex items-center justify-between px-5 py-[18px]">
              <span className="text-[15px] text-gray-900">Confirmation #</span>
              <span className="text-[14px] text-gray-700 font-mono tracking-wide">{d.referenceNumber}</span>
            </div>
          </div>

          <div className="bg-gray-50 px-5 pt-6 pb-8">
            <p className="text-[12px] text-gray-500 leading-[1.65]">
              Funds may take 1–3 business days to appear in the recipient&apos;s account depending on their bank.
            </p>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-5 py-4">
          <button type="button" onClick={handleDone}
            className="w-full py-[17px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full">
            DONE
          </button>
        </div>
      </div>
    );
  }

  // ── Pending-review screen ─────────────────────────────────────────
  if (step === STEP_REVIEW_STATUS) {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader title="Transfer Under Review" showEricaRight ericaRightCount={3} />
        <div className="flex-1 overflow-y-auto pt-[64px] pb-28 flex flex-col items-center px-6 pt-16">
          <div className="w-[72px] h-[72px] rounded-full bg-amber-50 border-[2.5px] border-amber-400 flex items-center justify-center mb-6 mt-10">
            <svg className="w-9 h-9 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-gray-900 text-center mb-3">Transfer Under Review</h1>
          <p className="text-[15px] text-gray-500 text-center leading-relaxed mb-2">
            {result?.message || 'Your transfer is being reviewed for security purposes. You will be notified once it is processed.'}
          </p>
          {result?.referenceNumber && (
            <p className="text-[13px] text-gray-400 font-mono mt-2">Ref: {result.referenceNumber}</p>
          )}
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-5 py-4">
          <button type="button" onClick={handleDone}
            className="w-full py-[17px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full">
            DONE
          </button>
        </div>
      </div>
    );
  }

  // ── Blocked screen ────────────────────────────────────────────────
  if (step === STEP_BLOCKED) {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader title="Transfer Blocked" showEricaRight ericaRightCount={3} />
        <div className="flex-1 overflow-y-auto pt-[64px] pb-28 flex flex-col items-center px-6">
          <div className="w-[72px] h-[72px] rounded-full bg-red-50 border-[2.5px] border-red-400 flex items-center justify-center mb-6 mt-10">
            <svg className="w-9 h-9 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728" />
            </svg>
          </div>
          <h1 className="text-[22px] font-extrabold text-gray-900 text-center mb-3">Transfer Blocked</h1>
          <p className="text-[15px] text-gray-500 text-center leading-relaxed">
            This transfer was blocked due to suspicious activity. If you believe this is an error, please contact support.
          </p>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-5 py-4">
          <button type="button" onClick={handleDone}
            className="w-full py-[17px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full">
            DONE
          </button>
        </div>
      </div>
    );
  }

  // ── Review screen ─────────────────────────────────────────────────
  if (step === STEP_REVIEW) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Review Transfer" />
        <div className="flex-1 overflow-y-auto pt-[64px] pb-28">
          {error && (
            <div className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}
          <div className="bg-white mt-4 border-t border-b border-gray-200">
            {[
              ['From',            `${fromAccount?.accountName} ••••${fromAccount?.maskedAccountNumber?.slice(-4) || ''}`],
              ['Routing number',  routingNumber],
              ['Account number',  `••••${accountNumber.slice(-4)}`],
              ['Amount',          `$${parseFloat(amount).toFixed(2)}`],
            ].map(([label, value], i, arr) => (
              <React.Fragment key={label}>
                <div className="flex items-center justify-between px-5 py-[18px]">
                  <span className="text-[15px] text-gray-500">{label}</span>
                  <span className="text-[15px] text-gray-900 font-medium">{value}</span>
                </div>
                {i < arr.length - 1 && <InsetDivider color={100} />}
              </React.Fragment>
            ))}
          </div>
          <div className="mx-4 mt-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-amber-700 text-sm">
              Please verify all details. Transfers to external accounts may take 1–3 business days.
            </p>
          </div>
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
          <div className="px-4 py-3 flex gap-3">
            <button type="button" onClick={() => setStep(STEP_FORM)}
              className="flex-1 py-4 border-2 border-[#1a6bbf] text-[#1a6bbf] font-bold text-sm tracking-widest rounded-full bg-white">
              BACK
            </button>
            <button type="button" onClick={handleSubmit} disabled={loading}
              className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full ${loading ? 'bg-slate-300 text-white' : 'bg-[#002D72] text-white'}`}>
              {loading ? 'SENDING…' : 'CONFIRM'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Form screen (default) ─────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title="External Transfer" />

      <div className="flex-1 overflow-y-auto pt-[64px] pb-28">
        {error && (
          <div className="mx-4 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* From account */}
        <div className="bg-white mt-4">
          <button type="button" onClick={() => setFromModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50">
            <span className="text-base text-gray-900">From</span>
            <span className={`text-base ${fromAccount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {fromAccount ? `${fromAccount.accountName} ••••${fromAccount.maskedAccountNumber?.slice(-4) || ''}` : 'Choose account'}
            </span>
          </button>
        </div>

        <div className="h-5 bg-gray-100" />

        {/* Recipient details */}
        <div className="bg-white">
          <div className="flex items-center justify-between px-4 py-5">
            <label className="text-base text-gray-900 flex-shrink-0 w-36">Routing number</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={9}
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="9 digits"
              className="flex-1 text-right text-base text-gray-900 bg-transparent outline-none placeholder-[#1a6bbf]"
            />
          </div>
          <InsetDivider color={200} />
          <div className="flex items-center justify-between px-4 py-5">
            <label className="text-base text-gray-900 flex-shrink-0 w-36">Account number</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={17}
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter number"
              className="flex-1 text-right text-base text-gray-900 bg-transparent outline-none placeholder-[#1a6bbf]"
            />
          </div>
        </div>

        <div className="h-5 bg-gray-100" />

        {/* Amount */}
        <div className="bg-white">
          <button type="button" onClick={() => setAmountModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50">
            <span className="text-base text-gray-900">Amount</span>
            <span className={`text-base ${amount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {amount ? `$${amount}` : 'Enter amount'}
            </span>
          </button>
        </div>

        <div className="mx-4 mt-6 bg-white border border-gray-200 rounded-2xl px-4 py-4">
          <p className="text-sm text-gray-500 leading-relaxed">
            External transfers use routing and account numbers to send funds to accounts at other banks.
            Transfers typically settle in 1–3 business days.
          </p>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="px-4 py-3 flex gap-3">
          <button type="button" onClick={() => navigate(-1)}
            className="flex-1 py-4 border-2 border-[#1a6bbf] text-[#1a6bbf] font-bold text-sm tracking-widest rounded-full bg-white">
            CANCEL
          </button>
          <button type="button" onClick={handleReview} disabled={!isReady}
            className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full ${isReady ? 'bg-[#002D72] text-white' : 'bg-slate-300 text-white cursor-not-allowed'}`}>
            REVIEW
          </button>
        </div>
      </div>

      <AccountPickerModal
        open={fromModal}
        onClose={() => setFromModal(false)}
        title="From"
        selected={fromAccount}
        onSelect={(acc) => setFromAccount(acc)}
      />
      <AmountInputModal
        open={amountModal}
        onClose={() => setAmountModal(false)}
        value={amount}
        onDone={(val) => setAmount(val)}
      />
    </div>
  );
}

export default ExternalTransferPage;
