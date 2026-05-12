import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
const IconChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

function CommunicationsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Communications" showSpacer />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        <EricaSearchBar showProviderText />

        {/* Communication sections */}
        <div className="bg-white mt-6">

          {/* Status Tracker */}
          <button
            type="button"
            className="w-full flex items-start justify-between px-5 py-6 text-left active:bg-gray-50"
          >
            <div className="flex items-start gap-3 flex-1 pr-4">
              <div className="w-3 h-3 rounded-full bg-[#1a6bbf] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-900">Status Tracker</p>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  For service items, claims and requests
                </p>
              </div>
            </div>
            <IconChevronDown />
          </button>

          <InsetDivider color={200} />

          {/* Alerts */}
          <button
            type="button"
            className="w-full flex items-start justify-between px-5 py-6 text-left active:bg-gray-50"
          >
            <div className="flex-1 pr-4">
              <p className="text-xl font-bold text-gray-900">Alerts</p>
              <p className="text-sm text-gray-500 mt-1 leading-snug">
                Your notifications from Bank of America
              </p>
            </div>
            <IconChevronDown />
          </button>

        </div>

        {/* Divider before legal */}
        <InsetDivider className="mt-8" />

        <LegalDisclosure />
      </div>

    </div>
  );
}

export default CommunicationsPage;
