import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
const IconInfo = () => (
  <svg className="w-4 h-4 text-[#1a6bbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4M12 8h.01" />
  </svg>
);
const IconChevronRight = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function DetailRow({ label, value, last = false }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-4">
        <span className="text-base text-gray-900">{label}</span>
        <span className="text-base text-gray-500">{value}</span>
      </div>
      {!last && <InsetDivider color={200} />}
    </>
  );
}

function TransactionDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const tx = state?.transaction;

  if (!tx) {
    navigate(-1);
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Details" showCartRight />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        <EricaSearchBar ericaCount={3} />

        {/* Transaction description + Edit Description + View more */}
        <div className="bg-white mt-3">
          <div className="flex items-start justify-between px-4 pt-5 pb-4">
            <p className="text-gray-900 font-bold text-base leading-snug whitespace-pre-line flex-1 pr-3">
              {tx.description}
            </p>
            <div className="flex items-center gap-0.5 flex-shrink-0 mt-0.5">
              <button type="button" className="text-[#1a6bbf] font-semibold text-sm">
                Edit Description
              </button>
              <IconChevronRight />
            </div>
          </div>
          <InsetDivider color={200} />
          <div className="flex items-center justify-between px-4 py-4">
            <span className="text-base text-gray-900">View more information</span>
            <button
              type="button"
              className="border border-[#002D72] text-[#002D72] font-bold text-xs px-5 py-1.5 rounded-full tracking-widest"
            >
              VIEW
            </button>
          </div>
        </div>

        {/* Amount / Date / Type / Online Purchase */}
        <div className="bg-white mt-4">
          <DetailRow label="Amount" value={tx.amount} />
          <DetailRow label="Transaction Date" value={tx.transactionDate} />
          <DetailRow label="Type" value={tx.type} />
          <DetailRow label="Online Purchase" value={tx.onlinePurchase} last />
        </div>

        {/* Merchant name + Transaction category */}
        <div className="bg-white mt-4">
          <div className="px-4 pt-5 pb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-sm text-gray-500">Merchant name</span>
              <IconInfo />
            </div>
            <p className="text-[#1a6bbf] font-bold text-base">{tx.merchant}</p>
          </div>
          <InsetDivider color={200} />
          <button
            type="button"
            className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-gray-50"
          >
            <div>
              <p className="text-sm text-gray-500 mb-0.5">Transaction category</p>
              <p className="text-base font-bold text-gray-900">{tx.category}</p>
            </div>
            <IconChevronRight />
          </button>
        </div>

        {/* Dispute button */}
        <div className="px-4 py-6">
          <button
            type="button"
            className="w-full py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a]"
          >
            DISPUTE TRANSACTION
          </button>
        </div>

        <LegalDisclosure />
      </div>

    </div>
  );
}

export default TransactionDetailsPage;
