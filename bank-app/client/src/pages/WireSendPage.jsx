import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';
import { api } from '../services/api';

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function StatusBanner({ status, message, referenceNumber, onDone }) {
  const configs = {
    success: {
      bg:    'bg-green-50 border-green-200',
      icon:  '✓',
      iconBg:'bg-green-500',
      title: 'Wire Transfer Initiated',
    },
    pending: {
      bg:    'bg-amber-50 border-amber-200',
      icon:  '⏳',
      iconBg:'bg-amber-500',
      title: 'Under Security Review',
    },
    blocked: {
      bg:    'bg-red-50 border-red-200',
      icon:  '✕',
      iconBg:'bg-red-500',
      title: 'Transfer Blocked',
    },
  };
  const c = configs[status] || configs.success;
  return (
    <div className={`mx-4 mt-6 rounded-2xl border p-5 ${c.bg}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-9 h-9 rounded-full ${c.iconBg} flex items-center justify-center text-white font-bold text-lg flex-shrink-0`}>
          {c.icon}
        </div>
        <p className="font-bold text-gray-900 text-[17px]">{c.title}</p>
      </div>
      <p className="text-[14px] text-gray-700 leading-relaxed">{message}</p>
      {referenceNumber && (
        <p className="mt-2 text-[12px] text-gray-500">Ref: {referenceNumber}</p>
      )}
      <button
        type="button"
        onClick={onDone}
        className="mt-4 w-full py-3 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a]"
      >
        DONE
      </button>
    </div>
  );
}

function WireSendPage() {
  const navigate = useNavigate();

  const selectedRecipient   = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount = useWireRecipientsStore((s) => s.selectedFromAccount);

  const [amount,     setAmount]     = useState('');
  const [memo,       setMemo]       = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState('');

  // Redirect back if missing required selections
  useEffect(() => {
    if (!selectedRecipient)   navigate('/wire-transfer/start');
    else if (!selectedFromAccount) navigate('/wire-transfer/account-select');
  }, [selectedRecipient, selectedFromAccount, navigate]);

  const parsedAmount = parseFloat(amount.replace(/,/g, '')) || 0;
  const hasFunds     = selectedFromAccount
    ? selectedFromAccount.availableBalance >= parsedAmount
    : false;
  const canSubmit    = selectedFromAccount && parsedAmount >= 1 && hasFunds && !submitting;

  const recipientName = selectedRecipient
    ? [selectedRecipient.firstName, selectedRecipient.lastName, selectedRecipient.businessName]
        .filter(Boolean).join(' ') || 'Recipient'
    : '';

  const handleAmountChange = (e) => {
    const raw = e.target.value.replace(/[^0-9.]/g, '');
    setAmount(raw);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/wire-transfers', {
        fromAccountId: selectedFromAccount.id   || selectedFromAccount._id,
        recipientId:   selectedRecipient._id    || selectedRecipient.id,
        amount:        parsedAmount,
        memo:          memo.trim(),
      });

      if (res.pendingReview) {
        setResult({
          status:          'pending',
          message:         res.message,
          referenceNumber: res.referenceNumber,
        });
      } else {
        setResult({
          status:          'success',
          message:         `Your wire transfer of ${fmtUSD(parsedAmount)} to ${recipientName} is now processing.`,
          referenceNumber: res.data?.referenceNumber,
        });
      }
    } catch (err) {
      if (err.message?.toLowerCase().includes('blocked')) {
        setResult({ status: 'blocked', message: err.message });
      } else {
        setError(err.message || 'Something went wrong. Please try again.');
        setSubmitting(false);
      }
    }
  };

  if (result) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Send Money" />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-10">
          <StatusBanner
            status={result.status}
            message={result.message}
            referenceNumber={result.referenceNumber}
            onDone={() => navigate('/wire-transfer')}
          />
          <LegalDisclosure />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-28">

        <h1 className="px-4 pt-6 pb-2 text-[26px] font-bold text-gray-900 leading-tight">
          Wire details
        </h1>

        {/* ── Summary card: recipient + from account ── */}
        <div className="bg-white border-t border-b border-gray-200 mb-4">

          {/* Recipient row */}
          {selectedRecipient && (
            <div className="flex items-center gap-3 px-4 py-4">
              <span
                className={`fi fi-${(selectedRecipient.country || 'us').toLowerCase()} flex-shrink-0`}
                style={{ width: '2.2em', height: '1.65em', backgroundSize: 'cover', borderRadius: 3 }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-gray-900 leading-snug truncate">{recipientName}</p>
                <p className="text-[13px] text-gray-400 leading-snug">{selectedRecipient.accountNumberMasked}</p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/wire-transfer/start')}
                className="text-[#1a6bbf] text-sm font-semibold flex-shrink-0"
              >
                Change
              </button>
            </div>
          )}

          <div className="h-px bg-gray-100 mx-4" />

          {/* From account row — read-only */}
          {selectedFromAccount && (
            <div className="flex items-center justify-between px-4 py-4">
              <div className="min-w-0">
                <p className="text-[13px] text-gray-400 leading-snug mb-0.5">From</p>
                <p className="text-[15px] font-semibold text-gray-900 leading-snug">
                  {selectedFromAccount.accountName}
                  {selectedFromAccount.maskedAccountNumber && (
                    <span className="text-gray-400 font-normal ml-1">{selectedFromAccount.maskedAccountNumber}</span>
                  )}
                </p>
                <p className="text-[13px] text-gray-500 leading-snug">
                  {fmtUSD(selectedFromAccount.availableBalance)} available
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/wire-transfer/account-select')}
                className="text-[#1a6bbf] text-sm font-semibold flex-shrink-0 ml-3"
              >
                Change
              </button>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 px-0">

          {/* ── Amount ── */}
          <div className="bg-white border-t border-b border-gray-200">
            <div className="px-4 py-4">
              <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                Amount (USD)
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[22px] font-bold text-gray-400">$</span>
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amount}
                  onChange={handleAmountChange}
                  className="flex-1 text-[22px] font-bold text-gray-900 bg-transparent border-0 border-b border-gray-200 pb-1 focus:outline-none focus:border-[#1a6bbf]"
                  required
                />
              </div>
              {selectedFromAccount && parsedAmount > 0 && (
                <p className="mt-2 text-[12px] text-gray-400">
                  {parsedAmount > selectedFromAccount.availableBalance
                    ? <span className="text-red-500">Insufficient funds</span>
                    : `Available: ${fmtUSD(selectedFromAccount.availableBalance)}`
                  }
                </p>
              )}
            </div>
          </div>

          {/* ── Memo ── */}
          <div className="bg-white border-t border-b border-gray-200">
            <div className="px-4 py-4">
              <label className="block text-[15px] font-semibold text-gray-900 mb-3">
                Memo <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Invoice #123"
                value={memo}
                onChange={(e) => setMemo(e.target.value.slice(0, 140))}
                className="w-full text-[15px] text-gray-700 bg-transparent border-0 border-b border-gray-200 pb-1 focus:outline-none focus:border-[#1a6bbf]"
                maxLength={140}
              />
              <p className="mt-1 text-[11px] text-gray-400 text-right">{memo.length}/140</p>
            </div>
          </div>

          {/* ── Error ── */}
          {error && (
            <div className="mx-4">
              <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
            </div>
          )}

          <LegalDisclosure />
        </form>
      </div>

      {/* ── Submit footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 py-4 px-4 flex gap-3">
        <button
          type="button"
          onClick={() => navigate('/wire-transfer/account-select')}
          className="flex-1 py-3.5 border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
        >
          BACK
        </button>
        <button
          type="submit"
          disabled={!canSubmit}
          onClick={handleSubmit}
          className="flex-1 py-3.5 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a] disabled:opacity-40"
        >
          {submitting ? 'SENDING…' : 'SEND WIRE'}
        </button>
      </div>
    </div>
  );
}

export default WireSendPage;
