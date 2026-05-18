import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import WireFlowFooter from '../components/WireFlowFooter';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function WireAmountPage() {
  const navigate = useNavigate();

  const selectedRecipient   = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount = useWireRecipientsStore((s) => s.selectedFromAccount);
  const storedAmount        = useWireRecipientsStore((s) => s.amount);
  const storedMemo          = useWireRecipientsStore((s) => s.memo);
  const setAmount           = useWireRecipientsStore((s) => s.setAmount);
  const setMemo             = useWireRecipientsStore((s) => s.setMemo);

  const [localAmount, setLocalAmount] = useState(storedAmount || '');
  const [localMemo,   setLocalMemo]   = useState(storedMemo   || '');

  useEffect(() => {
    if (!selectedRecipient)        navigate('/wire-transfer/start');
    else if (!selectedFromAccount) navigate('/wire-transfer/account-select');
  }, [selectedRecipient, selectedFromAccount, navigate]);

  if (!selectedRecipient || !selectedFromAccount) return null;

  const parsedAmount = parseFloat(localAmount.replace(/[^0-9.]/g, '')) || 0;
  const hasFunds     = parsedAmount > 0 && selectedFromAccount.availableBalance >= parsedAmount;
  const canNext      = parsedAmount >= 1 && hasFunds;

  const handleNext = () => {
    setAmount(localAmount);
    setMemo(localMemo);
    navigate('/wire-transfer/review');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        <h2 className="px-4 pt-6 pb-3 text-[22px] font-bold text-gray-900">Wire amount</h2>

        {/* ── Amount input ── */}
        <div className="bg-white border-t border-b border-gray-200">
          <div className="px-4 py-5">
            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Amount (USD)
            </label>
            <div className="flex items-baseline gap-2">
              <span className="text-[30px] font-bold text-gray-300">$</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={localAmount}
                onChange={(e) => setLocalAmount(e.target.value.replace(/[^0-9.]/g, ''))}
                className="flex-1 text-[30px] font-bold text-gray-900 bg-transparent border-0 border-b-2 border-gray-200 pb-1 focus:outline-none focus:border-[#1a6bbf] placeholder-gray-300"
              />
            </div>
            <div className="mt-2 min-h-[18px]">
              {parsedAmount > 0 && (
                parsedAmount > selectedFromAccount.availableBalance ? (
                  <p className="text-[13px] text-red-500 font-medium">Insufficient funds</p>
                ) : (
                  <p className="text-[13px] text-gray-400">
                    Available: {fmtUSD(selectedFromAccount.availableBalance)}
                  </p>
                )
              )}
            </div>
          </div>
        </div>

        <div className="h-5" />

        {/* ── Memo ── */}
        <div className="bg-white border-t border-b border-gray-200">
          <div className="px-4 py-5">
            <label className="block text-[12px] font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Memo <span className="normal-case font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice #123"
              value={localMemo}
              onChange={(e) => setLocalMemo(e.target.value.slice(0, 140))}
              className="w-full text-[15px] text-gray-700 bg-transparent border-0 border-b-2 border-gray-200 pb-1 focus:outline-none focus:border-[#1a6bbf] placeholder-gray-300"
              maxLength={140}
            />
            <p className="mt-2 text-[11px] text-gray-400 text-right">{localMemo.length}/140</p>
          </div>
        </div>

        {/* ── Fee info card ── */}
        <div className="mx-4 mt-5 bg-white rounded-xl border border-gray-200 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-600 leading-relaxed">
              A flat wire fee of <span className="font-semibold text-gray-800">$30.00</span> applies
              to this transfer. The full cost breakdown will appear on the next screen.
            </p>
          </div>
        </div>

      </div>

      <WireFlowFooter
        cancelTo="/wire-transfer/recipient-summary"
        onNext={handleNext}
        nextEnabled={canNext}
      />

    </div>
  );
}

export default WireAmountPage;
