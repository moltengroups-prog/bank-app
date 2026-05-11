import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import ActivityDetailsPage from './ActivityDetailsPage';
import imgErica   from '../assets/images/btn-erica-red.jpeg';
import imgBoaMini from '../assets/images/boa-mini-logo.png';

/* ── SVG Icons ── */
const IconBack = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const IconLightbulb = () => (
  <svg className="w-6 h-6 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const IconSort = () => (
  <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);
const IconFilter = () => (
  <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
  </svg>
);

const transactions = [
  {
    name: 'Adv SafeBalance Banking - 3580',
    date: 'May 08, 2026',
    amount: '$140.00',
    status: 'Completed',
    to: 'Adv SafeBalance Banking - 3580',
    from: 'joint - 3083',
    confirmationNumber: '4328636251',
  },
  {
    name: 'joint - 3083',
    date: 'May 03, 2026',
    amount: '$100.00',
    status: 'Completed',
    to: 'joint - 3083',
    from: 'Adv SafeBalance Banking - 3580',
    confirmationNumber: '4328636252',
  },
  {
    name: 'Adv SafeBalance Banking - 3580',
    date: 'May 01, 2026',
    amount: '$200.00',
    status: 'Completed',
    to: 'Adv SafeBalance Banking - 3580',
    from: 'joint - 3083',
    confirmationNumber: '4328636253',
  },
];

function ActivityPage() {
  const navigate = useNavigate();
  const [selectedTx, setSelectedTx] = useState(null);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      {/* ══════════════════════════════════
          FIXED HEADER
      ══════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">

          {/* Left — back arrow */}
          <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            <IconBack />
          </button>

          {/* Center — page title */}
          <span className="text-base font-normal text-gray-500 tracking-wide">Activity</span>

          {/* Right — Erica avatar */}
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
      <div className="flex-1 overflow-y-auto pt-[64px] pb-6">

        {/* ── Info card ── */}
        <div className="mx-4 mt-4 mb-6 bg-white rounded-2xl shadow-sm px-4 py-4 flex items-start gap-3">
          <IconLightbulb />
          <div>
            <p className="text-gray-900 font-semibold text-sm leading-snug">
              Can&#39;t find what you&#39;re looking for?
            </p>
            <p className="text-gray-500 text-sm leading-snug mt-0.5">
              Go to your account details to view more activity.
            </p>
          </div>
        </div>

        {/* ── Scheduled section ── */}
        <div className="px-4 mb-1">
          <h2 className="font-extrabold text-2xl text-gray-900 mb-3">Scheduled</h2>
          <p className="text-gray-700 text-base mb-4">There&#39;s nothing scheduled right now.</p>
        </div>

        <div className="border-t border-gray-300 mx-0 mb-4" />

        {/* ── History section ── */}
        <div className="px-4 mb-3">
          <h2 className="font-extrabold text-2xl text-gray-900 mb-4">History</h2>

          <button type="button" className="flex items-center text-[#1a6bbf] font-bold text-base mb-3">
            Sort: Date (Newest) <IconSort />
          </button>

          <button type="button" className="flex items-center text-[#1a6bbf] font-bold text-base mb-2">
            Filter <IconFilter />
          </button>

          <p className="text-gray-500 text-sm mb-3">Last 3 months</p>
        </div>

        {/* ── Transaction rows ── */}
        <div className="bg-white mx-0">
          {transactions.map((tx, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setSelectedTx(tx)}
              className={`w-full flex items-center justify-between px-4 py-4 text-left active:bg-gray-50 ${i < transactions.length - 1 ? 'border-b border-gray-200' : ''}`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                  <img src={imgBoaMini} alt="Bank of Molten" className="w-8 h-8 object-contain" />
                </div>
                <p className="text-gray-900 font-medium text-sm leading-snug">{tx.name}</p>
              </div>
              <div className="text-right flex-shrink-0 ml-4">
                <p className="text-gray-500 text-xs mb-0.5">{tx.date}</p>
                <p className="text-[#1a6bbf] font-bold text-base">{tx.amount}</p>
                <p className="text-gray-400 text-xs">Completed</p>
              </div>
            </button>
          ))}
        </div>

        {/* ── Footer note ── */}
        <div className="px-4 py-4 border-t border-gray-200">
          <p className="text-gray-500 text-sm text-center">
            You&#39;re viewing all available results.{' '}
            <button type="button" className="text-[#1a6bbf] font-medium">
              Adjust your filters
            </button>
          </p>
        </div>

        {/* ── Legal & footer ── */}
        <LegalDisclosure />
      </div>

      {/* ── Transaction detail modal ── */}
      <ActivityDetailsPage
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        rounded={false}
      />
    </div>
  );
}

export default ActivityPage;
