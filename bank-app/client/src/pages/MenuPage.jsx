import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgErica  from '../assets/images/btn-erica-red.jpeg';
import imgBoaMini from '../assets/images/boa-mini-logo.png';

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
const IconChevronRight = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const IconPerson = () => (
  <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);
const IconDocument = () => (
  <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);
const IconHelpCircle = () => (
  <svg className="w-7 h-7 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
  </svg>
);

function MenuRow({ label, subtitle }) {
  return (
    <>
      <InsetDivider color={200} />
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-gray-50"
      >
        <div>
          <p className="text-base text-gray-900">{label}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
        <IconChevronRight />
      </button>
    </>
  );
}

function MenuPage() {
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
          <span className="text-base font-normal text-gray-500 tracking-wide">Menu</span>
          <div className="w-8 h-8 flex-shrink-0" aria-hidden="true" />
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        {/* Erica search bar */}
        <div className="bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2.5">
              <IconSearch />
              <span className="text-gray-400 text-sm font-normal">Hi, I&#39;m Erica. How can I help?</span>
            </div>
            <div className="relative flex-shrink-0">
              <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
              <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
            </div>
          </div>
        </div>

        {/* ── Profile card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-5">
            <IconPerson />
            <span className="text-xl font-bold text-gray-900">Profile</span>
          </div>
          <MenuRow label="Settings" />
          <MenuRow label="Security Center" />
        </div>

        {/* ── Statements and Documents card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-5">
            <IconDocument />
            <span className="text-xl font-bold text-gray-900">Statements and Documents</span>
          </div>
          <MenuRow label="Statements and Documents" />
          <MenuRow label="Go Paperless" />
        </div>

        {/* ── Bank of Molten card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Red / navy stripe */}
          <div className="flex h-[5px]">
            <div className="flex-[3] bg-[#E31837]" />
            <div className="flex-[2] bg-[#002D72]" />
          </div>
          {/* Header row */}
          <div className="flex items-center justify-between px-5 py-4">
            <span className="text-lg font-medium text-gray-900">Bank of Molten</span>
            <img src={imgBoaMini} alt="Bank of Molten" className="h-7 w-auto object-contain" />
          </div>
          <InsetDivider color={200} />
          <MenuRow label="Manage Debit Card" />
          <MenuRow label="My Rewards" />
          <MenuRow label="Get your FICO® Score" subtitle="Monitor your credit health with My Credit" />
          <MenuRow label="Center for Business Empowerment" />
        </div>

        {/* ── Help and Support card ── */}
        <div className="mx-4 mt-4 mb-6 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-5">
            <IconHelpCircle />
            <span className="text-xl font-bold text-gray-900">Help and Support</span>
          </div>
          <MenuRow label="Help" />
          <MenuRow label="Contact Us" />
          <MenuRow label="Dispute a Transaction" />
          <MenuRow label="Share Your Feedback" />
          <MenuRow label="Browse with Specialist" />
        </div>

        <LegalDisclosure />
      </div>

    </div>
  );
}

export default MenuPage;
