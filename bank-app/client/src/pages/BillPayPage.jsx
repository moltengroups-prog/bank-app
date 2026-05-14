import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
import LegalDisclosure from '../components/LegalDisclosure';

// ── Mock data (replace with API calls) ──────────────────────────

const PAYEES = [];          // future: fetched payee list
const PAYMENTS = [];        // future: scheduled & recent payments
const ACTIVITY = [];        // future: bill payment activity history

// ── Sub-components ───────────────────────────────────────────────

const IconPlus = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);

function PayTab() {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto pb-10">

      {/* ── Payees card ── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">
            Payees
          </span>
          <button
            type="button"
            onClick={() => navigate('/add-payee')}
            className="flex items-center gap-2 active:opacity-70"
          >
            <span className="text-[#1a6bbf] font-semibold text-base">Add Payee</span>
            <div className="w-6 h-6 rounded-full bg-[#1a6bbf] flex items-center justify-center flex-shrink-0">
              <IconPlus />
            </div>
          </button>
        </div>

        <div className="px-5 pb-6">
          {PAYEES.length === 0 ? (
            <p className="text-base text-gray-500 leading-snug">
              Ready to make a payment? Add a payee to get started.
            </p>
          ) : (
            <ul className="space-y-3">
              {PAYEES.map(payee => (
                <li key={payee.id} className="flex items-center justify-between">
                  <span className="text-base text-gray-900">{payee.name}</span>
                  <button type="button" className="text-[#1a6bbf] text-sm font-semibold">
                    Pay
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

    </div>
  );
}

function ActivityTab() {
  return (
    <div className="flex-1 overflow-y-auto pb-10">
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 py-6">
          {ACTIVITY.length === 0 ? (
            <p className="text-base text-gray-500 text-center leading-snug">
              No bill payment activity yet.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {ACTIVITY.map(item => (
                <li key={item.id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-900">{item.payee}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{item.date}</p>
                  </div>
                  <span className="text-base font-semibold text-gray-900">{item.amount}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function BillPayPage() {
  const [activeTab, setActiveTab] = useState('pay');

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Bill Pay" showSpacer />

      {/* Everything below the fixed header */}
      <div className="flex flex-col flex-1 pt-[64px] overflow-hidden">

        {/* Search bar */}
        <div className="bg-gray-100 px-4 py-3">
          <EricaSearchBar ericaCount={4} bgWhite={false} />
        </div>

        {/* ── Tab bar ── */}
        <div className="bg-white flex-shrink-0">
          <div className="flex">
            <button
              type="button"
              onClick={() => setActiveTab('pay')}
              className={`flex-1 py-3.5 text-sm font-medium tracking-wide border-b-2 transition-colors ${
                activeTab === 'pay'
                  ? 'text-[#C0392B] border-[#C0392B]'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              Pay
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('activity')}
              className={`flex-1 py-3.5 text-sm font-medium tracking-wide border-b-2 transition-colors ${
                activeTab === 'activity'
                  ? 'text-[#C0392B] border-[#C0392B]'
                  : 'text-gray-400 border-transparent'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {/* Tab content + legal (scrollable together) */}
        <div className="flex-1 overflow-y-auto pb-8">
          {activeTab === 'pay' ? <PayTab /> : <ActivityTab />}
          <LegalDisclosure />
        </div>

      </div>
    </div>
  );
}

export default BillPayPage;
