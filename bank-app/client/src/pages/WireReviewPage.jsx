import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import InsetDivider from '../components/InsetDivider';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';
import { api } from '../services/api';

const WIRE_FEE = 30;

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function ReviewRow({ label, right }) {
  return (
    <div className="flex items-start justify-between px-4 py-[18px]">
      <span className="text-[15px] text-gray-900 flex-shrink-0 mr-4">{label}</span>
      <div className="text-right">{right}</div>
    </div>
  );
}

function WireReviewPage() {
  const navigate = useNavigate();

  const selectedRecipient   = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount = useWireRecipientsStore((s) => s.selectedFromAccount);
  const amount              = useWireRecipientsStore((s) => s.amount);
  const memo                = useWireRecipientsStore((s) => s.memo);
  const setWireResult       = useWireRecipientsStore((s) => s.setWireResult);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');

  useEffect(() => {
    if (!selectedRecipient)        navigate('/wire-transfer/start');
    else if (!selectedFromAccount) navigate('/wire-transfer/account-select');
    else if (!amount)              navigate('/wire-transfer/amount');
  }, [selectedRecipient, selectedFromAccount, amount, navigate]);

  if (!selectedRecipient || !selectedFromAccount || !amount) return null;

  const parsedAmount = parseFloat(String(amount).replace(/[^0-9.]/g, '')) || 0;
  const total        = parsedAmount + WIRE_FEE;

  const recipientName = [
    selectedRecipient.firstName,
    selectedRecipient.lastName,
    selectedRecipient.businessName,
  ].filter(Boolean).join(' ') || 'Recipient';

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await api.post('/wire-transfers', {
        fromAccountId: selectedFromAccount.id   || selectedFromAccount._id,
        recipientId:   selectedRecipient._id    || selectedRecipient.id,
        amount:        parsedAmount,
        memo:          (memo || '').trim(),
      });

      setWireResult({
        referenceNumber: res.data?.referenceNumber || res.referenceNumber || '—',
        amount:          parsedAmount,
        fee:             WIRE_FEE,
        total,
        pendingReview:   res.pendingReview || false,
        recipientName,
        fromAccountName: selectedFromAccount.accountName,
        submittedAt:     new Date(),
      });

      navigate('/wire-transfer/success');
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-28">

        <h2 className="px-4 pt-6 pb-3 text-[22px] font-bold text-gray-900">Review wire</h2>

        {/* ── Wire summary ── */}
        <div className="bg-white border-t border-b border-gray-200 mb-5">

          <ReviewRow
            label="Recipient"
            right={<span className="text-[15px] text-gray-500">{recipientName}</span>}
          />
          <InsetDivider color={100} />

          <ReviewRow
            label="From"
            right={
              <>
                <p className="text-[15px] text-gray-500">{selectedFromAccount.accountName}</p>
                {selectedFromAccount.maskedAccountNumber && (
                  <p className="text-[13px] text-gray-400 mt-0.5">{selectedFromAccount.maskedAccountNumber}</p>
                )}
              </>
            }
          />
          <InsetDivider color={100} />

          <ReviewRow
            label="Amount"
            right={<span className="text-[15px] text-gray-500">{fmtUSD(parsedAmount)} USD</span>}
          />

          {memo?.trim() && (
            <>
              <InsetDivider color={100} />
              <ReviewRow
                label="Memo"
                right={
                  <span className="text-[15px] text-gray-500 max-w-[55%] leading-snug block text-right">
                    {memo}
                  </span>
                }
              />
            </>
          )}
        </div>

        {/* ── Cost breakdown ── */}
        <h2 className="px-4 pb-3 text-[16px] font-bold text-gray-900">Your total transfer cost</h2>

        <div className="bg-white border-t border-b border-gray-200 mb-5">

          <ReviewRow
            label="Transfer amount"
            right={
              <>
                <p className="text-[15px] text-gray-500">{fmtUSD(parsedAmount)} USD</p>
                <p className="text-[12px] text-gray-400 mt-0.5">From {selectedFromAccount.accountName}</p>
              </>
            }
          />
          <InsetDivider color={100} />

          <ReviewRow
            label="Transfer fees"
            right={<span className="text-[15px] text-gray-500">+{fmtUSD(WIRE_FEE)} USD</span>}
          />
          <InsetDivider color={100} />

          <ReviewRow
            label={<span className="font-bold">Total cost</span>}
            right={<span className="text-[15px] font-bold text-gray-900">{fmtUSD(total)} USD</span>}
          />

        </div>

        {/* ── Error banner ── */}
        {error && (
          <div className="mx-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

      </div>

      {/* ── Fixed footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full active:bg-gray-50"
          >
            BACK
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full disabled:opacity-40 active:bg-[#001d4a] transition-colors"
          >
            {submitting ? 'SENDING…' : 'SEND WIRE'}
          </button>
        </div>
      </div>

    </div>
  );
}

export default WireReviewPage;
