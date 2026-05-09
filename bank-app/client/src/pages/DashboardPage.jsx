import React, { useState } from 'react';
import logo from '../assets/logos/logo.png';
import imgErica from '../assets/images/btn-erica-red.jpeg';
import imgBanner from '../assets/images/banner-rate-reduction.jpeg';
import imgNotepad from '../assets/images/icon-notepad.jpeg';
import imgAdidas from '../assets/images/logo-adidas.png';
import imgLowes from '../assets/images/logo-lowes.png';
import imgUlta from '../assets/images/logo-ulta.png';

const deals = [
  { logo: imgAdidas, name: 'Adidas',      cashback: '5% Cash Back' },
  { logo: imgLowes,  name: "Lowe's",      cashback: '1% Cash Back' },
  { logo: imgUlta,   name: 'Ulta Beauty', cashback: '5% Cash Back' },
];

/* ── Inline SVG icons ── */
const IconHamburger = () => (
  <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);
const IconEnvelope = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
  </svg>
);
const IconCart = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);
const IconLogOut = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);
const IconChevronRight = () => (
  <span className="text-gray-400 text-xl leading-none">›</span>
);
const IconChevronUp = ({ flipped }) => (
  <svg className={`w-5 h-5 text-gray-500 transition-transform ${flipped ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

/* ── Tab bar icons ── */
const IconDollar = ({ active }) => (
  <svg className={`w-7 h-7 ${active ? 'text-[#1a6bbf]' : 'text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 7v1m0 8v1m-3-5h6m-6 0a3 3 0 116 0" />
  </svg>
);
const IconTransfer = () => (
  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4M16 17H4m0 0l4 4m-4-4l4-4" />
  </svg>
);
const IconDeposit = () => (
  <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

function DashboardPage() {
  const [activeTab, setActiveTab]         = useState('accounts');
  const [bankingOpen, setBankingOpen]     = useState(true);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      {/* ════════════════════════════════
          FIXED HEADER
      ════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">
          {/* Hamburger / Menu */}
          <button className="flex flex-col items-center gap-1">
            <IconHamburger />
            <span className="text-[10px] font-medium text-gray-600">Menu</span>
          </button>

          {/* Right actions */}
          <div className="flex items-end gap-5">
            {/* Inbox */}
            <button className="flex flex-col items-center gap-0.5">
              <div className="relative">
                <IconEnvelope />
                <span className="absolute -top-1.5 -right-1.5 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  1
                </span>
              </div>
              <span className="text-[10px] font-medium text-gray-600">Inbox</span>
            </button>

            {/* Products */}
            <button className="flex flex-col items-center gap-0.5">
              <IconCart />
              <span className="text-[10px] font-medium text-gray-600">Products</span>
            </button>

            {/* Log Out */}
            <button className="flex flex-col items-center gap-0.5">
              <IconLogOut />
              <span className="text-[10px] font-medium text-gray-600">Log Out</span>
            </button>
          </div>
        </div>

        {/* Sub-nav tabs */}
        <div className="flex">
          {['accounts', 'dashboard'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-sm capitalize tracking-wide transition-colors ${
                activeTab === tab
                  ? 'font-bold text-red-600 border-b-2 border-red-600'
                  : 'font-medium text-gray-400 border-b-2 border-transparent'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════
          SCROLLABLE BODY
      ════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[104px] pb-20">

        {/* ── Erica search bar ── */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="flex-1 flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2.5">
            <IconSearch />
            <span className="text-gray-400 text-sm font-normal">Hi, I'm Erica. How can I help?</span>
          </div>
          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica assistant" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </div>
        </div>

        {/* ── Greeting card ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 active:bg-gray-50">
            <span className="font-bold text-gray-900 text-base">Hello, Sutrina</span>
            <IconChevronRight />
          </button>
          <button className="w-full flex items-start justify-between px-5 py-4 border-b border-gray-100 active:bg-gray-50">
            <div className="text-left pr-3">
              <p className="font-bold text-gray-900 text-base">Bank of Molten Life Plan®</p>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                Your next steps and new features are a tap away.
              </p>
            </div>
            <IconChevronRight />
          </button>
          <button className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
            <span className="text-gray-800 text-base font-medium">My Rewards</span>
            <IconChevronRight />
          </button>
        </div>

        {/* ── Banking card ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          {/* Red / navy accent bar */}
          <div className="h-1.5 flex">
            <div className="w-1/2 bg-red-600" />
            <div className="w-1/2 bg-[#002D72]" />
          </div>

          {/* Section header */}
          <button
            onClick={() => setBankingOpen(!bankingOpen)}
            className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100"
          >
            <span className="font-bold text-gray-900 text-base">Banking</span>
            <IconChevronUp flipped={!bankingOpen} />
          </button>

          {bankingOpen && (
            <>
              {/* Bank brand + FDIC */}
              <div className="px-5 pt-4 pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={logo} alt="Bank of Molten" className="h-5 w-auto" />
                  <span className="font-bold text-gray-900 text-sm">Bank of Molten</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="border border-gray-700 text-gray-700 font-extrabold text-[9px] px-1 py-0.5 flex-shrink-0 leading-none">
                    FDIC
                  </span>
                  <span className="text-gray-500 text-[10px] leading-snug">
                    FDIC-Insured - Backed by the full faith and credit of the U.S. Government
                  </span>
                </div>
              </div>

              {/* Account rows */}
              <button className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-100 active:bg-gray-50">
                <span className="text-gray-800 text-sm font-medium">joint</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-base">$664.89</span>
                  <IconChevronRight />
                </div>
              </button>
              <button className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
                <span className="text-gray-800 text-sm font-medium text-left leading-snug">
                  Adv SafeBalance<br />Banking - 3580
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900 text-base">$202.00</span>
                  <IconChevronRight />
                </div>
              </button>
            </>
          )}
        </div>

        {/* ── There's more to explore ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-start gap-4 px-5 pt-5 pb-4 border-b border-gray-100">
            <img src={imgNotepad} alt="Explore" className="w-14 h-14 object-contain flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-900 text-base mb-1">There's more to explore</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Explore Bank of Molten credit cards, loans, checking and savings accounts, plus Merrill investment solutions.
              </p>
            </div>
          </div>
          <div className="flex divide-x divide-gray-200">
            <button className="flex-1 py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider active:bg-gray-50">
              OFFERS
            </button>
            <button className="flex-1 py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider active:bg-gray-50">
              PRODUCTS
            </button>
          </div>
        </div>

        {/* ── Promotional banner ── */}
        <div className="mb-4">
          <img src={imgBanner} alt="Rate reduction on auto loans" className="w-full object-cover" />
        </div>

        {/* ── BankAmeriDeals ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-5 pt-5 pb-3 text-gray-400 text-[11px] font-semibold tracking-widest uppercase">
            BankMoltenDeals®
          </p>

          {/* Horizontally scrollable deal cards */}
          <div
            className="flex gap-3 px-5 pb-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-36 border border-gray-200 rounded-xl p-3 flex flex-col items-center"
              >
                <div className="w-full h-20 flex items-center justify-center mb-2">
                  <img
                    src={deal.logo}
                    alt={deal.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="text-gray-900 text-sm font-semibold text-center">{deal.name}</p>
                <p className="text-gray-700 text-sm font-bold text-center">{deal.cashback}</p>
              </div>
            ))}
          </div>

          {/* Pagination dots */}
          <div className="flex justify-center gap-2 pb-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          <div className="border-t border-gray-100">
            <button className="w-full py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider active:bg-gray-50">
              VIEW ALL DEALS
            </button>
          </div>
        </div>

        {/* ── Account Information ── */}
        <div className="px-4 py-4">
          <p className="text-gray-500 text-base font-normal mb-4">Account information</p>
          <div className="border-t border-gray-300 mb-6" />
          <button type="button" className="text-[#1a6bbf] font-bold text-base">Account Balance Footnotes</button>
          <div className="border-t border-gray-300 mt-6" />
        </div>

        {/* ── Legal info ── */}
        <div className="px-4 pb-4">
          <h3 className="font-bold text-xl text-gray-900 mb-3">Legal info and disclosures</h3>
          <p className="text-sm text-gray-700 font-medium mb-2">Investment, insurance and annuity products:</p>
          <ul className="text-sm text-gray-700 font-medium space-y-1 mb-4">
            <li>• Are Not FDIC Insured</li>
            <li>• Are Not Bank Guaranteed</li>
            <li>• May Lose Value</li>
            <li>• Are Not Deposits</li>
            <li>• Are Not Insured by Any Federal Government Agency</li>
            <li>• Are Not a Condition to Any Banking Service or Activity</li>
          </ul>
          <div className="border-t border-gray-200 mb-4" />
          <p className="text-sm text-gray-900 font-bold leading-relaxed mb-3">
            Investing involves risk. There is always the potential of losing money when you invest in
            securities. Asset allocation, diversification, and rebalancing do not ensure a profit or
            protect against loss in declining markets.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Bank of Molten, Merrill, their affiliates and advisors do not provide legal, tax or
            accounting advice. Clients should consult their legal and/or tax advisors before making
            any financial decisions.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Merrill offers a broad range of brokerage, investment advisory and other services.
            Additional information is available in our{' '}
            <button type="button" className="text-[#1a6bbf]">Client Relationship Summary.</button>
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Merrill Lynch, Pierce, Fenner &amp; Smith Incorporated (also referred to as "MLPF&amp;S"
            or "Merrill") makes available certain investment products sponsored, managed, distributed
            or provided by companies that are affiliates of Bank of Molten Corporation ("BofM Corp.").
            MLPF&amp;S is a registered broker-dealer, registered investment adviser,{' '}
            <button type="button" className="text-[#1a6bbf]">Member SIPC</button>{' '}
            and a wholly owned subsidiary of BofM Corp.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Insurance and annuity products are offered through Merrill Lynch Life Agency Inc.
            ("MLLA"), a licensed insurance agency and wholly owned subsidiary of BofM Corp.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-3">
            Bank of Molten Private Bank is a division of Bank of Molten, N.A., Member FDIC and a
            wholly owned subsidiary of BofM Corp. Trust, fiduciary, and investment management
            services offered through Bank of Molten Private Bank are provided by Bank of Molten N.A.
            and its agents, Member FDIC, or U.S. Trust Company of Delaware. Both are wholly owned
            subsidiaries of BofM Corp.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed mb-4">
            Banking products are provided by Bank of Molten, N.A. ("BANA") and affiliated banks,
            Members FDIC and wholly owned subsidiaries of BofM Corp.
          </p>
          <button type="button" className="text-[#1a6bbf] text-sm font-medium leading-snug text-left">
            See additional information about Merrill and Bank of Molten
          </button>
        </div>

        {/* ── Footer links ── */}
        <div className="border-t border-gray-300 px-4 pt-6 pb-4 space-y-3">
          <div className="flex justify-center gap-8">
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Browse with Specialist</button>
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Security</button>
          </div>
          <div className="flex justify-center gap-10">
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Privacy</button>
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Children's Privacy</button>
          </div>
          <div className="flex justify-center gap-6">
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Your Privacy Choices</button>
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">AdChoices</button>
          </div>
          <div className="flex justify-center gap-6 flex-wrap">
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Legal Info &amp; Disclosures</button>
            <button type="button" className="text-[#1a6bbf] text-sm font-semibold">Equal Housing Lender</button>
          </div>
          <p className="text-center text-gray-500 text-xs pt-2">
            Bank of Molten, N.A. Member FDIC. © 2026 Bank of Molten Corporation.
          </p>
        </div>
      </div>

      {/* ════════════════════════════════
          FIXED BOTTOM TAB BAR
      ════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex">
          <button className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDollar active />
            <span className="text-[11px] font-semibold text-[#1a6bbf]">Accounts</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconTransfer />
            <span className="text-[11px] font-medium text-gray-500">Pay &amp; Transfer</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDeposit />
            <span className="text-[11px] font-medium text-gray-500">Deposit Checks</span>
          </button>
          <button className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconPie />
            <span className="text-[11px] font-medium text-gray-500">Invest</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default DashboardPage;
