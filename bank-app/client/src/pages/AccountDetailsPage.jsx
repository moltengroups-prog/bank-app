import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgErica    from '../assets/images/btn-erica-red.jpeg';
import imgPiggyBank from '../assets/images/piggybank.jpeg';
import imgApplePay from '../assets/images/applepay-log.png';
import imgPayPal   from '../assets/images/paypal-logo.png';
import imgAdidas   from '../assets/images/logo-adidas.png';
import imgLowes    from '../assets/images/logo-lowes.png';
import imgUlta     from '../assets/images/logo-ulta.png';
import imgGoal     from '../assets/images/goal-chart.jpeg';

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const transactions = [
  {
    status: 'Processing',
    description: 'PMNT SENT 05/03\nCASH APP*SUTRINA\nCLARK OAKLAND CA',
    amount: '-$100.00',
    balance: '$664.89',
    debit: true,
    transactionDate: '05/03/2026',
    type: 'Debit Card',
    onlinePurchase: 'Y',
    merchant: 'SQUARE CASH',
    category: 'Cash, Checks & Misc:Other Expenses',
  },
  {
    status: 'Processing',
    description: 'WM SUPERCENTER\n#745 05/02\n#XXXXX0542462\nPURCHASE 5600 N\nHENRY BLVD\nSTOCKBRIDGE GA',
    amount: '-$120.47',
    balance: '$764.89',
    debit: true,
    transactionDate: '05/02/2026',
    type: 'Debit Card',
    onlinePurchase: 'N',
    merchant: 'WALMART SUPERCENTER',
    category: 'Groceries & Supermarkets',
  },
  {
    status: 'Processing',
    description: 'FOOD DEPOT STOC\n05/02\n#XXXXX0414096\nPURCHASE FOOD\nDEPOT STOC',
    amount: '-$17.22',
    balance: '$885.36',
    debit: true,
    transactionDate: '05/02/2026',
    type: 'Debit Card',
    onlinePurchase: 'N',
    merchant: 'FOOD DEPOT',
    category: 'Groceries & Supermarkets',
  },
  {
    status: 'May 1, 2026',
    description: 'Online Banking transfer\nto CHK 3580\nConfirmation#\nXXXXX27445',
    amount: '-$200.00',
    balance: '$1,357.90',
    debit: true,
    transactionDate: '05/01/2026',
    type: 'ACH',
    onlinePurchase: 'N',
    merchant: 'BANK OF MOLTEN',
    category: 'Transfers',
  },
  {
    status: 'May 1, 2026',
    description: 'AT&T SERVICES\nDES:PAYROLL\nID:260501JC5406\nINDN:JOSEPH S CLARK\nCO ID:XXXXX82655\nPPD',
    amount: '$1,139.15',
    balance: '$1,557.90',
    debit: false,
    transactionDate: '05/01/2026',
    type: 'ACH',
    onlinePurchase: 'N',
    merchant: 'AT&T SERVICES',
    category: 'Income',
  },
  {
    status: 'Apr 29, 2026',
    description: 'CASH APP*SUTRINA\nCLARK* 04/28 PMNT\nSENT Oakland CA',
    amount: '-$50.00',
    balance: '$418.75',
    debit: true,
    transactionDate: '04/28/2026',
    type: 'Debit Card',
    onlinePurchase: 'Y',
    merchant: 'SQUARE CASH',
    category: 'Cash, Checks & Misc:Other Expenses',
  },
];

const deals = [
  { logo: imgAdidas, name: 'Adidas',      cashback: '5% Cash Back' },
  { logo: imgLowes,  name: "Lowe's",      cashback: '1% Cash Back' },
  { logo: imgUlta,   name: 'Ulta Beauty', cashback: '5% Cash Back' },
];

/* ─────────────────────────────────────────────
   Shared SVG icons (kept lightweight / inline)
───────────────────────────────────────────── */
const ChevronRight = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const ChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const IconInfo = () => (
  <svg className="w-5 h-5 text-[#1a6bbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4M12 8h.01" />
  </svg>
);
const IconSearch = () => (
  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
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
const IconBack = () => (
  <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
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

/* ─────────────────────────────────────────────
   Google Charts bar chart (Income vs Spending)
───────────────────────────────────────────── */
function SpendingChart() {
  const chartRef = useRef(null);
  const drawn    = useRef(false);

  useEffect(() => {
    if (drawn.current) return;

    function drawChart() {
      if (!window.google || !window.google.visualization) return;
      drawn.current = true;

      const data = window.google.visualization.arrayToDataTable([
        ['Type', 'Amount', { role: 'style' }],
        ['Income',   1139.15, '#9E9E9E'],
        ['Spending',  357.69, '#1a6bbf'],
      ]);

      const options = {
        legend:      'none',
        chartArea:   { width: '85%', height: '75%' },
        backgroundColor: 'transparent',
        bar:         { groupWidth: '55%' },
        vAxis:       { gridlines: { color: 'transparent' }, textPosition: 'none', baselineColor: '#ccc' },
        hAxis:       { textStyle: { color: '#6B7280', fontSize: 10 }, ticks: [{ v: 0, f: 'Income' }, { v: 1, f: 'Spending' }] },
      };

      const chart = new window.google.visualization.ColumnChart(chartRef.current);
      chart.draw(data, options);
    }

    if (window.google && window.google.charts) {
      window.google.charts.setOnLoadCallback(drawChart);
    } else {
      const existing = document.getElementById('google-charts-script');
      if (existing) {
        existing.addEventListener('load', () => {
          window.google.charts.load('current', { packages: ['corechart'] });
          window.google.charts.setOnLoadCallback(drawChart);
        });
        return;
      }
      const script  = document.createElement('script');
      script.id     = 'google-charts-script';
      script.src    = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(drawChart);
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div ref={chartRef} style={{ width: '160px', height: '120px' }} aria-label="Income vs Spending bar chart" />
  );
}

/* ─────────────────────────────────────────────
   Main page component
───────────────────────────────────────────── */
function AccountDetailsPage() {
  const navigate = useNavigate();

  const [routingOpen,  setRoutingOpen]  = useState(false);
  const [statusOpen,   setStatusOpen]   = useState(false);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      {/* ════════════════════════════════
          FIXED HEADER
      ════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Back button */}
          <button type="button" onClick={() => navigate(-1)} className="flex items-center justify-center">
            <IconBack />
          </button>

          {/* Right actions */}
          <div className="flex items-end gap-5">
            <button type="button" onClick={() => navigate('/communications')} className="flex flex-col items-center gap-0.5">
              <div className="relative">
                <IconEnvelope />
                <span className="absolute -top-1.5 -right-1.5 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">1</span>
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

      {/* ════════════════════════════════
          SCROLLABLE BODY
      ════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-20">

        {/* ── Erica search bar ── */}
        <div className="bg-white px-4 pt-3 pb-2">
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2.5">
              <IconSearch />
              <span className="text-gray-400 text-sm font-normal">Hi, I'm Erica. How can I help?</span>
            </div>
            <div className="relative flex-shrink-0">
              <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
              <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">2</span>
            </div>
          </div>
          <p className="text-right text-xs text-gray-500 mt-2 mb-1">Provided by Bank of America</p>
        </div>

        {/* ── Account overview ── */}
        <section className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-wide">JOINT</h2>
            <button type="button" className="text-[#1a6bbf] font-bold text-base tracking-wide">EDIT</button>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-5xl font-bold text-gray-900 mb-2">$664.89</p>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm font-normal">Available balance</span>
              <IconInfo />
            </div>
          </div>
        </section>

        {/* ── Account & routing numbers ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setRoutingOpen(!routingOpen)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="text-gray-900 text-base font-medium">Account &amp; routing numbers</span>
            <ChevronDown />
          </button>
          {routingOpen && (
            <>
              <InsetDivider color={100} />
              <div className="px-5 pb-4">
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Account number</span>
                    <span className="text-sm font-medium text-gray-900">••••••7890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Routing number</span>
                    <span className="text-sm font-medium text-gray-900">026009593</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Status tracker ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setStatusOpen(!statusOpen)}
            className="w-full flex items-start justify-between px-5 py-4"
          >
            <div className="text-left pr-3">
              <p className="text-gray-900 text-base font-medium">Status tracker</p>
              <p className="text-gray-500 text-sm leading-snug mt-0.5">
                For service items, claims and requests for this account
              </p>
            </div>
            <ChevronDown />
          </button>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Recent Transactions
            </p>
            <div className="space-y-0">
              {transactions.map((tx, i) => (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => navigate('/transaction-details', { state: { transaction: tx } })}
                    className="w-full flex items-start justify-between py-3 text-left active:bg-gray-50"
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-gray-500 text-xs font-normal mb-0.5">{tx.status}</p>
                      <p className="text-gray-900 text-sm font-bold leading-snug whitespace-pre-line">
                        {tx.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#1a6bbf]">{tx.amount}</p>
                      <p className="text-gray-500 text-xs font-normal">{tx.balance}</p>
                    </div>
                  </button>
                  {i < transactions.length - 1 && <InsetDivider color={100} />}
                </div>
              ))}
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            ALL TRANSACTIONS
          </button>
        </div>

        {/* ── Spending & Budgeting ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Spending &amp; Budgeting
            </p>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <SpendingChart />
                <p className="text-gray-500 text-[10px] font-normal -mt-1">Income / Spending</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Nice work! On average, you spend{' '}
                <span className="text-[#1a6bbf] font-bold">$782 less</span>{' '}
                than you deposit each month. Setting a budget can help you stay on track.
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            TRACK SPENDING
          </button>
        </div>

        {/* ── Goals ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">Goals</p>
            <div className="flex items-center gap-5">
              <img src={imgGoal} alt="Goals target" className="w-24 h-24 object-contain flex-shrink-0" />
              <p className="text-gray-900 text-lg font-medium leading-snug">
                Easily save for goals like vacations, cars or education.
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            CREATE GOAL
          </button>
        </div>

        {/* ── FICO Score ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium">Get your FICO® Score</p>
              <p className="text-gray-500 text-sm font-normal mt-0.5">Monitor your credit health with My Credit</p>
            </div>
            <ChevronRight />
          </button>
        </div>

        {/* ── Mobile Order ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Mobile Order</p>
          </div>
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Foreign currency</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">View activity</span>
            <ChevronRight />
          </button>
        </div>

        {/* ── Account Management ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Account Management</p>
          </div>

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Statements &amp; Documents</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Alerts</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-start justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium">Debit Card Settings</p>
              <p className="text-gray-500 text-sm font-normal leading-snug mt-0.5">
                Lock/unlock card, order a new or replacement card and more.
              </p>
            </div>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Beneficiaries</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-start justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium">Direct Deposit</p>
              <p className="text-gray-500 text-sm font-normal mt-0.5">It's secure and convenient. Set up one today.</p>
            </div>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Monthly Maintenance Fee info</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium leading-snug">
                Balance Connect® for<br />Overdraft Protection
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-gray-500 text-sm font-medium">Off</span>
              <ChevronRight />
            </div>
          </button>
        </div>

        {/* ── Keep the Change® ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Keep the Change®
            </p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <img src={imgPiggyBank} alt="Piggy bank" className="w-16 h-16 object-contain" />
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Round up each purchase to the nearest dollar and turn spare change into savings
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            ENROLL
          </button>
        </div>

        {/* ── Digital Wallets ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Digital Wallets</p>
          </div>

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={imgApplePay} alt="Apple Pay" className="h-8 w-auto object-contain" />
              <span className="text-gray-900 text-base font-medium">Add card(s) to Apple Wallet</span>
            </div>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={imgPayPal} alt="PayPal" className="h-8 w-auto object-contain" />
              <div className="text-left">
                <p className="text-gray-900 text-base font-medium">PayPal</p>
                <p className="text-gray-500 text-sm font-normal">Enjoy fast, secure checkout.</p>
              </div>
            </div>
            <ChevronRight />
          </button>
        </div>

        {/* ── Supplies ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Supplies</p>
          </div>
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Order Account Supplies/Accessories</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Get copies of Cleared Checks</span>
            <ChevronRight />
          </button>
        </div>

        {/* ── BankMoltenDeals® ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-5 pt-5 pb-3 text-gray-400 text-[11px] font-semibold tracking-widest uppercase">
            BankMoltenDeals®
          </p>
          <div
            className="flex gap-3 px-5 pb-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, i) => (
              <div key={i} className="flex-shrink-0 w-36 border border-gray-200 rounded-xl p-3 flex flex-col items-center">
                <div className="w-full h-20 flex items-center justify-center mb-2">
                  <img src={deal.logo} alt={deal.name} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-gray-900 text-sm font-semibold text-center">{deal.name}</p>
                <p className="text-gray-700 text-sm font-bold text-center">{deal.cashback}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 pb-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-gray-300'}`} />
            ))}
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider">
            VIEW ALL DEALS
          </button>
        </div>

        {/* ── Contact us ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button type="button" className="w-full flex items-center justify-between px-5 py-5">
            <span className="text-gray-900 text-base font-medium">Contact us</span>
            <ChevronRight />
          </button>
        </div>

        <LegalDisclosure />
      </div>

      {/* ════════════════════════════════
          FIXED BOTTOM TAB BAR
      ════════════════════════════════ */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white">
        <InsetDivider color={200} />
        <div className="flex">
          <button type="button" className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDollar active />
            <span className="text-[11px] font-semibold text-[#1a6bbf]">Accounts</span>
          </button>
          <button type="button" onClick={() => navigate('/pay-transfer')} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconTransfer />
            <span className="text-[11px] font-medium text-gray-500">Pay &amp; Transfer</span>
          </button>
          <button type="button" onClick={() => navigate('/deposit-checks')} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconDeposit />
            <span className="text-[11px] font-medium text-gray-500">Deposit Checks</span>
          </button>
          <button type="button" onClick={() => navigate('/invest')} className="flex-1 flex flex-col items-center py-2 gap-0.5">
            <IconPie />
            <span className="text-[11px] font-medium text-gray-500">Invest</span>
          </button>
        </div>
      </div>

    </div>
  );
}

export default AccountDetailsPage;
