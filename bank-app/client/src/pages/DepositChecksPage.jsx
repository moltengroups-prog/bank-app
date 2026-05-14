import React from 'react';
import LegalDisclosure from '../components/LegalDisclosure';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import EricaSearchBar from '../components/EricaSearchBar';
import imgHero from '../assets/images/deposit-check-hero.jpg';

function DepositChecksPage() {
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader
        showMenuButton
        showInbox
        inboxCount={2}
        showProducts
        showLogout
      />

      {/* ══ SCROLLABLE BODY ══ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-20">

        <EricaSearchBar ericaCount={3} />

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

      <BottomNavigation activeTab="deposit-checks" />

    </div>
  );
}

export default DepositChecksPage;
