import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import EricaSearchBar from '../components/EricaSearchBar';
import ActivityDetailsPage from './ActivityDetailsPage';

import imgTransfer from '../assets/images/transfer-icon.png';
import imgZelle    from '../assets/images/zelle-logo.png';
import imgPayBills from '../assets/images/pay-bills-icon.png';
import imgWire     from '../assets/images/wire-transfer-icon.png';
import imgBoaMini  from '../assets/images/boa-mini-logo.png';

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
];

function PayAndTransferPage() {
  const navigate = useNavigate();
  const [selectedTx, setSelectedTx] = useState(null);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader
        showMenuButton
        showInbox
        inboxCount={2}
        showProducts
        showLogout
      />

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-20">

        <EricaSearchBar ericaCount={3} bgWhite={false} />

        {/* ── 2×2 Action Grid ── */}
        <div className="mx-4 mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-y divide-gray-200">

            {/* Transfer */}
            <button
              type="button"
              onClick={() => navigate('/transfer')}
              className="flex flex-col items-center justify-center py-8 px-4 active:bg-gray-50"
            >
              <img src={imgTransfer} alt="Transfer" className="w-14 h-14 object-contain mb-3" />
              <p className="text-[#1a6bbf] font-semibold text-base mb-1">Transfer</p>
              <p className="text-gray-500 text-xs">between my accounts</p>
            </button>

            {/* Zelle */}
            <button
              type="button"
              className="flex flex-col items-center justify-center py-8 px-4 active:bg-gray-50"
            >
              <img src={imgZelle} alt="Zelle" className="w-14 h-14 object-contain mb-3" />
              <p className="text-[#6D1ED4] font-semibold text-base mb-1">Zelle&#174;</p>
              <p className="text-gray-500 text-xs">send or receive</p>
            </button>

            {/* Pay Bills */}
            <button
              type="button"
              className="flex flex-col items-center justify-center py-8 px-4 active:bg-gray-50"
            >
              <img src={imgPayBills} alt="Pay Bills" className="w-14 h-14 object-contain mb-3" />
              <p className="text-[#1a6bbf] font-semibold text-base mb-1">Pay Bills</p>
              <p className="text-gray-500 text-xs">pay now or schedule</p>
            </button>

            {/* Wire */}
            <button
              type="button"
              className="flex flex-col items-center justify-center py-8 px-4 active:bg-gray-50"
            >
              <img src={imgWire} alt="Wire" className="w-14 h-14 object-contain mb-3" />
              <p className="text-[#1a6bbf] font-semibold text-base mb-1">Wire</p>
              <p className="text-gray-500 text-xs">U.S. or international</p>
            </button>

          </div>
        </div>

        {/* ── Activity heading ── */}
        <div className="px-4 mb-3">
          <h2 className="font-extrabold text-2xl text-gray-900">Activity</h2>
        </div>

        {/* ── History card ── */}
        <div className="mx-4 mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">

          {/* HISTORY label */}
          <div className="px-5 pt-4 pb-2">
            <p className="text-[11px] font-semibold text-gray-400 tracking-widest uppercase">History</p>
          </div>

          {transactions.map((tx, i) => (
            <React.Fragment key={i}>
              <button
                type="button"
                onClick={() => setSelectedTx(tx)}
                className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-gray-50"
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
              <InsetDivider color={100} />
            </React.Fragment>
          ))}

          {/* More Activity */}
          <div className="py-4 flex justify-center">
            <button type="button" onClick={() => navigate('/activity')} className="text-[#1a6bbf] font-bold text-sm tracking-widest">
              MORE ACTIVITY
            </button>
          </div>
        </div>

        <LegalDisclosure />
      </div>

      <BottomNavigation activeTab="pay-transfer" />

      {/* ── Transaction detail modal ── */}
      <ActivityDetailsPage
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        rounded={false}
      />

    </div>
  );
}

export default PayAndTransferPage;
