import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import FdicBanner from '../components/FdicBanner';
import AccountPickerModal from '../components/AccountPickerModal';
import AmountInputModal from '../components/AmountInputModal';
import DatePickerModal from '../components/DatePickerModal';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const IconLightbulb = () => (
  <svg className="w-10 h-10 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

function TransferPage() {
  const navigate = useNavigate();

  const [fromModal, setFromModal]   = useState(false);
  const [toModal, setToModal]       = useState(false);
  const [amountModal, setAmountModal] = useState(false);
  const [dateModal, setDateModal]   = useState(false);

  const [fromAccount, setFromAccount] = useState(null);
  const [toAccount, setToAccount]     = useState(null);
  const [amount, setAmount]           = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  const formatDate = (date) =>
    `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Transfer" showEricaRight ericaRightCount={3} />

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-28">

        {/* ── FDIC disclaimer ── */}
        <div className="bg-white px-4 pt-4 pb-4">
          <FdicBanner label="Bank of Molten deposit products:" labelBold showInvestment />
        </div>

        <InsetDivider />

        {/* ── From / To ── */}
        <div className="bg-white">
          <button
            type="button"
            onClick={() => setFromModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">From</span>
            <span className={`text-base ${fromAccount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {fromAccount ? fromAccount.name : 'Choose account'}
            </span>
          </button>
          <InsetDivider color={200} />
          <button
            type="button"
            onClick={() => setToModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">To</span>
            <span className={`text-base ${toAccount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {toAccount ? toAccount.name : 'Choose account'}
            </span>
          </button>
        </div>

        <div className="h-5 bg-gray-100" />

        {/* ── Amount / Date ── */}
        <div className="bg-white">
          <button
            type="button"
            onClick={() => setAmountModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">Amount</span>
            <span className={`text-base ${amount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {amount ? `$${amount}` : 'Enter amount'}
            </span>
          </button>
          <InsetDivider color={200} />
          <button
            type="button"
            onClick={() => setDateModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">Date</span>
            <span className={`text-base ${selectedDate ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {selectedDate ? formatDate(selectedDate) : 'Enter date'}
            </span>
          </button>
        </div>

        {/* ── Wire info banner ── */}
        <div className="mx-4 my-6 bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center flex-shrink-0">
            <IconLightbulb />
          </div>
          <p className="text-sm text-gray-700">
            Sending a wire?{' '}
            <button type="button" className="text-[#1a6bbf] font-medium">
              Start here.
            </button>
          </p>
        </div>

        {/* ── Legal & footer ── */}
        <LegalDisclosure />
      </div>

      {/* ══════════════════════════════════
          FIXED BOTTOM BUTTONS
      ══════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
        <InsetDivider color={200} />
        <div className="px-4 py-3 flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 border-2 border-[#1a6bbf] text-[#1a6bbf] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            className="flex-1 py-4 bg-slate-500 text-white font-bold text-sm tracking-widest rounded-full active:bg-slate-600"
          >
            NEXT
          </button>
        </div>
      </div>

      {/* ── Modals ── */}
      <AccountPickerModal
        open={fromModal}
        onClose={() => setFromModal(false)}
        title="From"
        selected={fromAccount}
        onSelect={(acc) => setFromAccount(acc)}
      />
      <AccountPickerModal
        open={toModal}
        onClose={() => setToModal(false)}
        title="To"
        selected={toAccount}
        onSelect={(acc) => setToAccount(acc)}
      />
      <AmountInputModal
        open={amountModal}
        onClose={() => setAmountModal(false)}
        value={amount}
        onDone={(val) => setAmount(val)}
      />
      <DatePickerModal
        open={dateModal}
        onClose={() => setDateModal(false)}
        selectedDate={selectedDate || new Date()}
        onDone={(date) => setSelectedDate(date)}
      />

    </div>
  );
}

export default TransferPage;
