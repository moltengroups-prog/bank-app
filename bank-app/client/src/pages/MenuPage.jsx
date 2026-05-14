import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
import imgBoaMini from '../assets/images/boa-mini-logo.png';
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

function MenuRow({ label, subtitle, onClick }) {
  return (
    <>
      <InsetDivider color={200} />
      <button
        type="button"
        onClick={onClick}
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

      <AppHeader showBackButton title="Menu" showSpacer />

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        <EricaSearchBar ericaCount={3} />

        {/* ── Profile card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-5">
            <IconPerson />
            <span className="text-xl font-bold text-gray-900">Profile</span>
          </div>
          <MenuRow label="Settings" />
          <MenuRow label="Security Center" onClick={() => navigate('/security-center')} />
        </div>

        {/* ── Statements and Documents card ── */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-5">
            <IconDocument />
            <span className="text-xl font-bold text-gray-900">Statements and Documents</span>
          </div>
          <MenuRow label="Statements and Documents" onClick={() => navigate('/statements-documents')} />
          <MenuRow label="Go Paperless" onClick={() => navigate('/go-paperless')} />
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
