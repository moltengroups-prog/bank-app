import React from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';

import imgErica       from '../assets/images/btn-erica-red.jpeg';
import imgAvailBal    from '../assets/images/available-balance.jpeg';
import imgAvgSpend    from '../assets/images/spending-chart.jpeg';
import imgAdidas      from '../assets/images/logo-adidas.png';
import imgAlerts      from '../assets/images/alerts.jpeg';
import imgBetterMoney from '../assets/images/better-money-habits.jpeg';

/* ── SVG Icons ── */
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

/* ── Reusable card shell ── */
function DashCard({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-start p-4 w-full text-center active:bg-gray-50 min-h-[180px]"
    >
      {children}
    </button>
  );
}

function MainDashboardPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      {/* ══════════════════════════════════
          FIXED HEADER
      ══════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-3">

          {/* Left — hamburger */}
          <button type="button" className="flex flex-col items-center gap-1 flex-shrink-0">
            <IconHamburger />
            <span className="text-[10px] font-medium text-gray-600">Menu</span>
          </button>

          {/* Centre — Erica */}
          <div className="relative flex-shrink-0">
            <img
              src={imgErica}
              alt="Erica assistant"
              className="w-12 h-12 rounded-full object-cover"
            />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              2
            </span>
          </div>

          {/* Right — Inbox / Products / Log Out */}
          <div className="flex items-end gap-4 flex-shrink-0">
            <button type="button" className="flex flex-col items-center gap-0.5">
              <div className="relative">
                <IconEnvelope />
                <span className="absolute -top-1.5 -right-1.5 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  1
                </span>
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

        {/* Sub-nav — Accounts | Dashboard */}
        <div className="flex border-b border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="flex-1 py-3 text-sm font-medium text-gray-400 border-b-2 border-transparent tracking-wide"
          >
            Accounts
          </button>
          <button
            type="button"
            className="flex-1 py-3 text-sm font-bold text-red-600 border-b-2 border-red-600 tracking-wide"
          >
            Dashboard
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[104px] pb-20">

        {/* ── 2-column card grid ── */}
        <div className="grid grid-cols-2 gap-3 px-3 pt-4 pb-3">

          {/* Card 1 — Available Balance */}
          <DashCard onClick={() => navigate('/dashboard')}>
            <img
              src={imgAvailBal}
              alt="Available balance"
              className="w-16 h-14 object-contain mb-3"
            />
            <p className="text-gray-500 text-sm font-normal mb-1">joint</p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">$664.89</p>
            <p className="text-gray-400 text-xs font-normal mt-1">Available balance</p>
          </DashCard>

          {/* Card 2 — Average Spend */}
          <DashCard>
            <img
              src={imgAvgSpend}
              alt="Average spending chart"
              className="w-20 h-14 object-contain mb-3"
            />
            <p className="text-gray-500 text-xs font-normal leading-snug mb-1">
              On Average You Spend
            </p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">$782</p>
            <p className="text-gray-400 text-xs font-normal mt-1 leading-snug">
              Less Than You Deposit
            </p>
          </DashCard>

          {/* Card 3 — BankAmeriDeals (Adidas) */}
          <DashCard>
            <p className="text-gray-400 text-[9px] font-semibold tracking-widest uppercase mb-2 self-start">
              BankAmeriDeals&#174;
            </p>
            <img
              src={imgAdidas}
              alt="Adidas"
              className="w-full h-16 object-contain mb-2"
            />
            <p className="text-gray-900 text-sm font-semibold">Adidas</p>
            <p className="text-gray-900 text-sm font-bold">5% Cash back</p>
          </DashCard>

          {/* Card 4 — Alerts */}
          <DashCard>
            <div className="relative mb-3">
              <img
                src={imgAlerts}
                alt="Alerts"
                className="w-16 h-16 object-contain"
              />
            </div>
            <p className="text-gray-900 text-sm font-semibold mb-1">Alerts</p>
            <p className="text-gray-900 text-3xl font-bold leading-tight">0</p>
            <p className="text-gray-400 text-xs font-normal mt-1">Unread</p>
          </DashCard>

          {/* Card 5 — Better Money Habits */}
          <DashCard>
            <img
              src={imgBetterMoney}
              alt="Better Money Habits"
              className="w-16 h-16 object-contain mb-3"
            />
            <p className="text-gray-900 text-sm font-semibold leading-snug mb-1">
              Better Money Habits&#174;
            </p>
            <p className="text-gray-400 text-xs font-normal leading-snug">
              Make sense of your finances
            </p>
          </DashCard>

          {/* Card 6 — Zelle */}
          <DashCard>
            <div className="flex items-center justify-center h-16 mb-3">
              <p className="text-[#6D1ED4] text-3xl font-bold italic tracking-tight">
                Zelle<span className="text-lg align-super font-normal">&#174;</span>
              </p>
            </div>
            <p className="text-gray-700 text-sm font-medium leading-snug">
              Send or Request Money
            </p>
          </DashCard>

        </div>

        {/* ── Customize button ── */}
        <div className="px-4 py-4">
          <button
            type="button"
            className="w-full bg-[#002D72] text-white font-bold text-sm tracking-widest py-4 rounded-full"
          >
            CUSTOMIZE MY DASHBOARD
          </button>
        </div>

        {/* ── Balance disclaimers ── */}
        <div className="px-4 pb-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            For checking, savings, and money market accounts, the balance may reflect
            transactions that have not yet posted to your account. For credit card, Gold
            Option, Gold Reserve and personal line of credit accounts, the balance may not
            reflect recent transactions or pending payments.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Amount shown for loan products is principal balance only and is current as of
            previous business day's closing. This amount does not include any applicable
            accrued interest and/or fees. Refer to your monthly billing statement for more
            information.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            The data displayed for your Merrill account(s) is for informational purposes
            only. Your account statement is the official record of your holdings and balances.
          </p>
        </div>

        <LegalDisclosure />
      </div>

      {/* ══════════════════════════════════
          FIXED BOTTOM TAB BAR
      ══════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="flex">
          <button type="button" className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDollar active />
            <span className="text-[11px] font-semibold text-[#1a6bbf]">Accounts</span>
          </button>
          <button type="button" onClick={() => navigate('/pay-transfer')} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconTransfer />
            <span className="text-[11px] font-medium text-gray-500">Pay &amp; Transfer</span>
          </button>
          <button type="button" className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDeposit />
            <span className="text-[11px] font-medium text-gray-500">Deposit Checks</span>
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

export default MainDashboardPage;
