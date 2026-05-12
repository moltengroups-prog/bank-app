import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgErica from '../assets/images/btn-erica-red.jpeg';

const IconBack = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

function CommunicationsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">

      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-8 h-8 flex-shrink-0"
          >
            <IconBack />
          </button>
          <span className="text-base font-normal text-gray-500 tracking-wide">Communications</span>
          <div className="w-8 h-8 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        {/* Erica search bar + "Provided by" label */}
        <div className="bg-white px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2.5">
              <IconSearch />
              <span className="text-gray-400 text-sm font-normal">Hi, I&#39;m Erica. How can I help?</span>
            </div>
            <div className="flex-shrink-0">
              <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
            </div>
          </div>
          <p className="text-right text-xs text-gray-500 mt-2 mb-1">Provided by Bank of America</p>
        </div>

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
