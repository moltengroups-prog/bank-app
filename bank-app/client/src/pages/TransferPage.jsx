import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import AccountPickerModal from '../components/AccountPickerModal';
import AmountInputModal from '../components/AmountInputModal';
import DatePickerModal from '../components/DatePickerModal';
import imgErica from '../assets/images/btn-erica-red.jpeg';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const IconBack = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

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
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formatDate = (date) =>
    `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      {/* ══════════════════════════════════
          FIXED HEADER
      ══════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 flex-shrink-0"
          >
            <IconBack />
          </button>

          <span className="text-base font-normal text-gray-500 tracking-wide">Transfer</span>

          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica assistant" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-28">

        {/* ── FDIC disclaimer ── */}
        <div className="bg-white px-4 pt-4 pb-4">
          <p className="text-sm font-bold text-gray-900 mb-2">Bank of Molten deposit products:</p>
          <div className="flex items-start gap-2 mb-2">
            <span className="inline-flex items-center justify-center border-2 border-[#1a6bbf] text-[#1a6bbf] font-black text-[11px] px-1 py-0.5 leading-none flex-shrink-0 mt-0.5 tracking-tight">
              FDIC
            </span>
            <p className="text-xs text-gray-500 italic leading-snug">
              FDIC-Insured &#8211; Backed by the full faith and credit of the U.S. Government
            </p>
          </div>
          <p className="text-sm font-bold text-gray-900">Investment products are not FDIC-Insured.</p>
        </div>

        <div className="border-t border-gray-300" />

        {/* ── From / To ── */}
        <div className="bg-white">
          <button
            type="button"
            onClick={() => setFromModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-200 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">From</span>
            <span className={`text-base ${fromAccount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {fromAccount ? fromAccount.name : 'Choose account'}
            </span>
          </button>
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
            className="w-full flex items-center justify-between px-4 py-5 border-b border-gray-200 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">Amount</span>
            <span className={`text-base ${amount ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {amount ? `$${amount}` : 'Enter amount'}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setDateModal(true)}
            className="w-full flex items-center justify-between px-4 py-5 active:bg-gray-50"
          >
            <span className="text-base text-gray-900">Date</span>
            <span className="text-base text-gray-900">{formatDate(selectedDate)}</span>
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
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 px-4 py-3 flex gap-3">
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
        selectedDate={selectedDate}
        onDone={(date) => setSelectedDate(date)}
      />

    </div>
  );
}

export default TransferPage;
