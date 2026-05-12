import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgErica  from '../assets/images/btn-erica-red.jpeg';
import imgHero   from '../assets/images/deposit-check-hero.jpg';

const IconHamburger = () => (
  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconEnvelope = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconCart = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const IconLogOut = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

/* ── Bottom tab icons ── */
const IconDollar = () => (
  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 116 0" />
  </svg>
);
const IconTransfer = () => (
  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const IconDepositActive = () => (
  <svg className="w-7 h-7 text-[#1a6bbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <rect x="3" y="6" width="18" height="13" rx="2" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M8 14h.01M12 14h4" />
  </svg>
);
const IconPie = () => (
  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
  </svg>
);

function DepositChecksPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      {/* ══ FIXED HEADER ══ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">

          {/* Left — hamburger + Menu */}
          <button type="button" onClick={() => navigate('/menu')} className="flex flex-col items-center gap-1 flex-shrink-0">
            <IconHamburger />
            <span className="text-[10px] font-medium text-gray-600">Menu</span>
          </button>

          {/* Right — Inbox / Products / Log Out */}
          <div className="flex items-end gap-4 flex-shrink-0">
            <button type="button" onClick={() => navigate('/communications')} className="flex flex-col items-center gap-0.5">
              <div className="relative">
                <IconEnvelope />
                <span className="absolute -top-1.5 -right-1.5 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">2</span>
              </div>
              <span className="text-[10px] font-medium text-gray-600">Inbox</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5">
              <IconCart />
              <span className="text-[10px] font-medium text-gray-600">Products</span>
            </button>
            <button type="button" className="flex flex-col items-center gap-0.5">
              <IconLogOut />
              <span className="text-[10px] font-medium text-gray-600">Log Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* ══ SCROLLABLE BODY ══ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-20">

        {/* Erica search bar */}
        <div className="flex items-center gap-3 bg-white px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2.5">
            <IconSearch />
            <span className="text-gray-400 text-sm font-normal">Hi, I&#39;m Erica. How can I help?</span>
          </div>
          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </div>
        </div>

        {/* Hero image */}
        <img
          src={imgHero}
          alt="Deposit checks on your phone"
          className="w-full h-72 object-cover"
        />

        {/* Content section */}
        <div className="bg-white px-5 pt-6 pb-8">
          <h2 className="text-3xl font-extrabold text-gray-900 leading-tight mb-3">
            Did you know you can deposit checks right on your phone?
          </h2>
          <p className="text-base text-gray-700 mb-6">
            It&#39;s fast, easy and always at your fingertips.
          </p>
          <div className="flex gap-3">
            <button
              type="button"
              className="flex-1 py-4 border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
            >
              LEARN MORE
            </button>
            <button
              type="button"
              className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a]"
            >
              GET STARTED
            </button>
          </div>
        </div>

        <LegalDisclosure />
      </div>

      {/* ══ FIXED BOTTOM TAB BAR ══ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
        <InsetDivider color={200} />
        <div className="flex">
          <button type="button" onClick={() => navigate('/dashboard')} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDollar />
            <span className="text-[11px] font-medium text-gray-500">Accounts</span>
          </button>
          <button type="button" onClick={() => navigate('/pay-transfer')} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconTransfer />
            <span className="text-[11px] font-medium text-gray-500">Pay &amp; Transfer</span>
          </button>
          <button type="button" className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDepositActive />
            <span className="text-[11px] font-semibold text-[#1a6bbf]">Deposit Checks</span>
          </button>
          <button type="button" className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconPie />
            <span className="text-[11px] font-medium text-gray-500">Invest</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default DepositChecksPage;
