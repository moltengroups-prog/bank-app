import React from 'react';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import EricaSearchBar from '../components/EricaSearchBar';
import imgHero from '../assets/images/invest-hero-banner.jpg';

const investCards = [
  {
    title: 'Build your own portfolio',
    description: "Merrill's digital tools and insights can help put your ideas into action",
  },
  {
    title: 'Invest online with guidance',
    description: "Let's connect you with a professionally managed portfolio from Merrill",
  },
  {
    title: 'Guidance from an advisor',
    description: 'Get guidance to pursue your investing goals and ongoing advice when you want it',
  },
];

function InvestPage() {

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

        {/* Hero banner — rounded card */}
        <div className="mx-4 mt-4 rounded-2xl shadow-sm overflow-hidden">
          <img src={imgHero} alt="Invest for retirement" className="w-full" />
        </div>

        {/* Investment option cards */}
        {investCards.map((card, i) => (
          <button
            key={i}
            type="button"
            className="mx-4 mt-4 w-[calc(100%-2rem)] bg-white rounded-2xl shadow-sm p-5 text-left active:bg-gray-50"
          >
            <p className="text-xl font-bold text-[#1a6bbf] mb-2">{card.title}</p>
            <p className="text-sm text-gray-500 leading-relaxed">{card.description}</p>
          </button>
        ))}

        {/* Important Disclosures */}
        <div className="px-4 pt-6 pb-2">
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">
            Important Disclosures
          </button>
        </div>
        <InsetDivider />

        <LegalDisclosure />
      </div>

      <BottomNavigation activeTab="invest" />

    </div>
  );
}

export default InvestPage;
